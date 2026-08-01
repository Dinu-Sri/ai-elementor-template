const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const site = (process.env.NEB_SITE_URL || "").replace(/\/$/, "");
const apiKey = process.env.NEB_API_KEY;
const configArg = process.argv[2];

if (!site || !apiKey) {
  throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");
}
if (!configArg) {
  throw new Error("Usage: node tools/validate-site-seo-media.js <site-seo-config.json>");
}

const config = JSON.parse(fs.readFileSync(path.resolve(root, configArg), "utf8"));

const api = `${site}/wp-json/native-elementor/v1/`;
const headers = { "X-API-Key": apiKey, "Content-Type": "application/json" };

async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`${api}${endpoint}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(30000)
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`${endpoint} failed with ${response.status}`);
  return payload;
}

async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next++;
      try {
        results[index] = await worker(items[index]);
      } catch (error) {
        results[index] = { error: `${error.name}: ${error.message}` };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

function readAttribute(tag, name) {
  return tag.match(new RegExp(`${name}=["']([^"']*)`, "i"))?.[1] ?? null;
}

function decodeHtmlText(value) {
  return String(value || "")
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function sourceBasename(url) {
  try {
    return decodeURIComponent(new URL(url).pathname.split("/").pop())
      .toLowerCase()
      .replace(/-\d+x\d+(?=\.[^.]+$)/, "");
  } catch {
    return "";
  }
}

async function main() {
  await apiFetch("clear-cache", { method: "POST", body: {} });
  const [pageListing, postListing, mediaListing] = await Promise.all([
    apiFetch("pages?per_page=250"),
    apiFetch("posts?per_page=250"),
    apiFetch("media?per_page=250")
  ]);

  const pagesById = new Map((pageListing.pages || []).map((page) => [Number(page.id), page]));
  const pageChecks = await pool(config.pages, 10, async (expected) => {
    const page = pagesById.get(Number(expected.id));
    if (!page) return { id: expected.id, error: "Page missing from API listing" };
    const response = await fetch(page.url, {
      redirect: "follow",
      signal: AbortSignal.timeout(30000)
    });
    const html = await response.text();
    const description = html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i
    )?.[1] || html.match(
      /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i
    )?.[1] || "";
    const canonical = html.match(
      /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i
    )?.[1] || html.match(
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i
    )?.[1] || "";
    return {
      id: expected.id,
      title: page.title,
      api_url: page.url,
      api_description: page.seo_description,
      api_canonical: page.canonical_url,
      http: response.status,
      final_url: response.url,
      html_description: decodeHtmlText(description),
      html_canonical: canonical,
      rank_math: /Rank Math/i.test(html),
      noindex: /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html),
      expected
    };
  });

  const media = mediaListing.media || [];
  const mediaById = new Map(media.map((item) => [Number(item.id), item]));
  const mediaByBasename = new Map(media.map((item) => [sourceBasename(item.url), item]));
  const mediaUpdateFailures = Object.entries(config.media_alt)
    .map(([id, alt]) => ({ id: Number(id), alt, actual: mediaById.get(Number(id))?.alt || "" }))
    .filter((item) => item.actual !== item.alt);

  const publicItems = [
    ...(pageListing.pages || []).filter((page) => page.status === "publish")
      .map((page) => ({ type: "page", id: page.id, title: page.title, url: page.url })),
    ...(postListing.posts || []).filter((post) => post.status === "publish")
      .map((post) => ({ type: "post", id: post.id, title: post.title, url: post.url }))
  ];
  const crawls = await pool(publicItems, 10, async (item) => {
    const response = await fetch(item.url, {
      redirect: "follow",
      signal: AbortSignal.timeout(30000)
    });
    const html = await response.text();
    const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => {
      const tag = match[0];
      const src = readAttribute(tag, "src") || readAttribute(tag, "data-src") || "";
      const mediaItem = mediaByBasename.get(sourceBasename(src));
      return {
        src,
        alt: readAttribute(tag, "alt"),
        media_id: mediaItem ? Number(mediaItem.id) : 0
      };
    }).filter((image) => image.src);
    return { ...item, http: response.status, images };
  });

  const renderedImages = crawls.flatMap((crawl) => (crawl.images || []).map((image) => ({
    ...image,
    page_type: crawl.type,
    page_id: crawl.id,
    page_title: crawl.title,
    page_url: crawl.url
  })));
  const configuredMediaIds = new Set(Object.keys(config.media_alt).map(Number));
  const configuredRenderedFailures = renderedImages.filter((image) => (
    configuredMediaIds.has(image.media_id) && !String(image.alt || "").trim()
  ));
  const blankRenderedImages = renderedImages.filter((image) => !String(image.alt || "").trim());
  const blankMedia = media.filter((item) => !String(item.alt || "").trim());
  const pageFailures = pageChecks.filter((page) => (
    page.error ||
    page.http !== 200 ||
    page.api_description !== page.expected.seo_description ||
    page.api_canonical !== page.expected.canonical_url ||
    page.html_description !== page.expected.seo_description ||
    page.html_canonical !== page.expected.canonical_url ||
    !page.rank_math ||
    page.noindex
  ));

  const report = {
    checked_at: new Date().toISOString(),
    summary: {
      published_pages: pageChecks.length,
      explicit_rank_math_descriptions: pageChecks.filter((page) => page.api_description).length,
      rendered_descriptions_match: pageChecks.filter((page) => page.html_description === page.expected.seo_description).length,
      rendered_canonicals_match: pageChecks.filter((page) => page.html_canonical === page.expected.canonical_url).length,
      page_failures: pageFailures.length,
      media_total: media.length,
      media_with_alt: media.length - blankMedia.length,
      intentional_blank_media: blankMedia.length,
      configured_alt_updates: Object.keys(config.media_alt).length,
      configured_alt_failures: mediaUpdateFailures.length,
      public_urls_crawled: crawls.length,
      rendered_images: renderedImages.length,
      rendered_blank_alt_instances: blankRenderedImages.length,
      configured_rendered_alt_failures: configuredRenderedFailures.length
    },
    page_failures: pageFailures,
    media_update_failures: mediaUpdateFailures,
    configured_rendered_alt_failures: configuredRenderedFailures,
    blank_media: blankMedia,
    blank_rendered_images: blankRenderedImages,
    pages: pageChecks
  };

  const output = path.join(root, "build", "deployments", "seo-batch", "page-seo-media-alt-validation.json");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    output: path.relative(root, output),
    summary: report.summary,
    page_failures: pageFailures.map((page) => ({
      id: page.id,
      title: page.title,
      api_url: page.api_url,
      final_url: page.final_url,
      api_canonical: page.api_canonical,
      html_canonical: page.html_canonical,
      description_matches: page.html_description === page.expected?.seo_description
    })),
    media_update_failures: mediaUpdateFailures,
    configured_rendered_alt_failures: configuredRenderedFailures,
    blank_rendered_media: [...new Map(blankRenderedImages.map((image) => [
      `${image.media_id}:${image.src}`,
      { media_id: image.media_id, src: image.src, pages: [] }
    ])).values()].slice(0, 30)
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
