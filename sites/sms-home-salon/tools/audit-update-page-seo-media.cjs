const fs = require("fs");
const path = require("path");

const baseUrl = String(process.env.NEB_SITE_URL || "").replace(/\/$/, "");
const apiKey = process.env.NEB_API_KEY;
const apply = process.argv.includes("--apply");

if (!baseUrl || !apiKey) {
  throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");
}

const rootDir = path.resolve(__dirname, "../../..");
const outputDir = path.join(rootDir, "build/sites/sms-home-salon/page-seo-media");
const headers = { "X-API-Key": apiKey, "Content-Type": "application/json" };

const descriptions = new Map(Object.entries({
  60: "Meet SMS Home Salon and learn how our women-only team brings professional beauty and wellness services to clients across Dubai.",
  61: "Explore SMS Home Salon's at-home beauty services in Dubai, including massage, nails, hair, facials, waxing and threading for women.",
  62: "Explore massage services for women at home in Dubai, with relaxing and targeted treatments delivered by SMS Home Salon professionals.",
  63: "Browse manicure, pedicure, gel and nail extension services for women at home in Dubai with SMS Home Salon.",
  64: "Discover women's hair services at home in Dubai, from styling and colouring to treatments, delivered by SMS Home Salon professionals.",
  65: "Explore facial and skincare services for women at home in Dubai, with treatment options delivered by SMS Home Salon professionals.",
  66: "Browse women's waxing services at home in Dubai, with convenient appointment options from SMS Home Salon.",
  67: "Explore eyebrow and facial threading services for women at home in Dubai, delivered by SMS Home Salon professionals.",
  69: "Contact SMS Home Salon to ask a question or arrange women's beauty and wellness services at your home in Dubai.",
  124: "Book professional beauty and wellness services for women at home in Dubai, including massage, nails, hair, facials, waxing and threading.",
  389: "Book a pregnancy massage at home in Dubai with SMS Home Salon and enjoy a convenient treatment designed for expectant mothers.",
  390: "Book lymphatic drainage massage at home in Dubai with SMS Home Salon and explore session options for women.",
  391: "Discover Madero wood therapy massage at home in Dubai and book a convenient women's wellness appointment with SMS Home Salon.",
  392: "Book a deep tissue massage at home in Dubai with SMS Home Salon and explore available session options for women.",
  393: "Book a Thai massage at home in Dubai with SMS Home Salon and enjoy a convenient women's wellness appointment.",
  394: "Book a hot stone massage at home in Dubai with SMS Home Salon and explore relaxing session options for women.",
  395: "Explore gel nail extensions at home in Dubai and book a convenient women's nail appointment with SMS Home Salon.",
  396: "Explore acrylic nail services at home in Dubai and book a convenient women's nail appointment with SMS Home Salon.",
  397: "Book professional henna application at home in Dubai and explore women's hair colour options from SMS Home Salon.",
  398: "Explore keratin hair treatment at home in Dubai and book a convenient women's hair appointment with SMS Home Salon.",
  399: "Book a Hydra Facial at home in Dubai and explore convenient skincare appointment options for women with SMS Home Salon.",
  400: "Book a diamond facial at home in Dubai and explore convenient women's skincare appointments with SMS Home Salon.",
  401: "Book a pearl facial at home in Dubai and explore convenient women's skincare appointments with SMS Home Salon.",
  402: "Book a gold facial at home in Dubai and explore convenient women's skincare appointments with SMS Home Salon.",
  403: "Explore Dr. Renaud facial treatments at home in Dubai and book a convenient women's skincare appointment with SMS Home Salon.",
  404: "Book a fruit facial at home in Dubai and explore convenient women's skincare appointments with SMS Home Salon.",
  546: "Read the SMS Home Salon privacy policy to understand how information is collected, used and protected when you use our website and services.",
  547: "Read the SMS Home Salon terms of use covering access to our website, content and at-home beauty service information."
}).map(([id, value]) => [Number(id), value]));

function apiEndpoint(endpoint) {
  if (/\/wp-json\/native-elementor\/v1$/i.test(baseUrl)) return `${baseUrl}/${endpoint}`;
  return `${baseUrl}/wp-json/native-elementor/v1/${endpoint}`;
}

async function apiFetch(endpoint, options = {}) {
  const response = await fetch(apiEndpoint(endpoint), {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(45000)
  });
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { raw: text };
  }
  if (!response.ok) {
    throw new Error(`${endpoint} failed with ${response.status}: ${JSON.stringify(payload).slice(0, 800)}`);
  }
  return payload;
}

async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next++;
      try {
        results[index] = await worker(items[index], index);
      } catch (error) {
        results[index] = { error: error.message, item: items[index] };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/gi, "&")
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function readAttribute(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return decodeHtml(tag.match(new RegExp(`(?:^|\\s)${escaped}=["']([^"']*)`, "i"))?.[1] || "");
}

function sourceBasename(url) {
  try {
    return decodeURIComponent(new URL(url).pathname.split("/").pop())
      .toLowerCase()
      .replace(/-\d+x\d+(?=\.[^.]+$)/, "")
      .replace(/-scaled(?=\.[^.]+$)/, "")
      .replace(/\.[^.]+$/, "");
  } catch {
    return "";
  }
}

function cleanTitle(media) {
  const value = decodeHtml(media.title || media.slug || "")
    .replace(/\.(?:avif|gif|jpe?g|png|webp)$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b(?:img|image|photo|copy|final|edited|scaled)\b/gi, " ")
    .replace(/\b[0-9a-f]{8,}\b/gi, " ")
    .replace(/\b\d{6,}\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return value;
}

function plannedAlt(media, usages) {
  const combined = `${media.title} ${media.slug} ${media.url}`.toLowerCase();
  if (combined.includes("logo")) return "SMS Home Salon logo";
  if (combined.includes("google-5-star")) return "SMS Home Salon five-star Google rating";

  const pageTitles = [...new Set(usages.map((usage) => decodeHtml(usage.page_title)).filter(Boolean))];
  const cleaned = cleanTitle(media);
  const meaningfulTitle = cleaned.length >= 5 && /[a-z]{3}/i.test(cleaned) && !/^\d+(?: \d+)*$/.test(cleaned);

  if (pageTitles.length === 1 && pageTitles[0].toLowerCase() !== "home") {
    const title = pageTitles[0].replace(/\s+/g, " ").trim();
    return `${title} service at home in Dubai`.slice(0, 125);
  }
  if (meaningfulTitle) return `${cleaned} - SMS Home Salon`.slice(0, 125);
  return "Women's beauty service at home in Dubai by SMS Home Salon";
}

async function loadState() {
  const [pageListing, mediaListing] = await Promise.all([
    apiFetch("pages?per_page=250"),
    apiFetch("media?per_page=250&page=1")
  ]);
  const pages = (pageListing.pages || []).filter((page) => page.status === "publish");
  const media = mediaListing.media || [];
  const mediaByBasename = new Map(media.map((item) => [sourceBasename(item.url), item]));
  const crawls = await pool(pages, 8, async (page) => {
    const response = await fetch(page.url, { redirect: "follow", signal: AbortSignal.timeout(45000) });
    const html = await response.text();
    const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => {
      const tag = match[0];
      const src = readAttribute(tag, "src") || readAttribute(tag, "data-src");
      const mediaItem = mediaByBasename.get(sourceBasename(src));
      return {
        src,
        alt: readAttribute(tag, "alt"),
        media_id: mediaItem ? Number(mediaItem.id) : 0
      };
    }).filter((image) => image.src);
    const metaDescription = decodeHtml(
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)?.[1]
      || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)?.[1]
      || ""
    );
    return { id: page.id, title: page.title, url: page.url, http: response.status, meta_description: metaDescription, images };
  });
  return { pages, media, crawls };
}

function analyze(state) {
  const mediaById = new Map(state.media.map((item) => [Number(item.id), item]));
  const blankUsages = [];
  const unresolved = [];
  for (const crawl of state.crawls) {
    if (crawl.error) continue;
    for (const image of crawl.images) {
      if (String(image.alt || "").trim()) continue;
      const usage = { page_id: crawl.id, page_title: crawl.title, page_url: crawl.url, src: image.src };
      if (image.media_id) blankUsages.push({ ...usage, media_id: image.media_id });
      else unresolved.push(usage);
    }
  }

  const usageByMedia = new Map();
  for (const usage of blankUsages) {
    if (!usageByMedia.has(usage.media_id)) usageByMedia.set(usage.media_id, []);
    usageByMedia.get(usage.media_id).push(usage);
  }
  const altUpdates = [...usageByMedia].map(([id, usages]) => {
    const media = mediaById.get(id);
    return {
      id,
      current_alt: media?.alt || "",
      planned_alt: plannedAlt(media || {}, usages),
      title: media?.title || "",
      url: media?.url || "",
      usages
    };
  }).filter((item) => !String(item.current_alt).trim());

  const missingDescriptions = state.pages.filter((page) => !String(page.seo_description || "").trim());
  const descriptionUpdates = missingDescriptions.map((page) => ({
    id: Number(page.id),
    title: decodeHtml(page.title),
    url: page.url,
    description: descriptions.get(Number(page.id)) || ""
  }));

  return { missingDescriptions, descriptionUpdates, altUpdates, unresolved };
}

function writeReports(before, after, applied) {
  fs.mkdirSync(outputDir, { recursive: true });
  const pagesById = new Map(after.state.pages.map((page) => [Number(page.id), page]));
  const mediaById = new Map(after.state.media.map((item) => [Number(item.id), item]));
  const snapshotPath = path.join(outputDir, "pre-update-snapshot.json");
  let cumulativeChanges = null;
  if (fs.existsSync(snapshotPath)) {
    const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
    cumulativeChanges = {
      snapshot_captured_at: snapshot.captured_at,
      descriptions_filled: (snapshot.pages || []).filter((page) => (
        !String(page.seo_description || "").trim()
        && String(pagesById.get(Number(page.id))?.seo_description || "").trim()
      )).length,
      attachment_alts_filled: (snapshot.media || []).filter((item) => (
        !String(item.alt || "").trim()
        && String(mediaById.get(Number(item.id))?.alt || "").trim()
      )).length
    };
  }
  const renderedDescriptionFailures = after.state.crawls.filter((crawl) => {
    if (crawl.error || crawl.http !== 200) return true;
    const page = pagesById.get(Number(crawl.id));
    return !crawl.meta_description || crawl.meta_description !== String(page?.seo_description || "");
  });
  const report = {
    generated_at: new Date().toISOString(),
    applied,
    cumulative_changes: cumulativeChanges,
    summary: {
      published_pages: after.state.pages.length,
      descriptions_before: before.state.pages.length - before.analysis.missingDescriptions.length,
      descriptions_updated: applied ? before.analysis.descriptionUpdates.length : 0,
      descriptions_after: after.state.pages.length - after.analysis.missingDescriptions.length,
      rendered_descriptions_after: after.state.crawls.filter((crawl) => crawl.meta_description).length,
      rendered_description_failures: renderedDescriptionFailures.length,
      rendered_images_after: after.state.crawls.reduce((sum, crawl) => sum + (crawl.images?.length || 0), 0),
      matched_blank_alt_instances_before: before.analysis.altUpdates.reduce((sum, item) => sum + item.usages.length, 0),
      attachment_alt_updated: applied ? before.analysis.altUpdates.length : 0,
      matched_blank_alt_instances_after: after.analysis.altUpdates.reduce((sum, item) => sum + item.usages.length, 0),
      unresolved_blank_instances_after: after.analysis.unresolved.length,
      crawl_errors_after: after.state.crawls.filter((crawl) => crawl.error || crawl.http !== 200).length
    },
    description_updates: before.analysis.descriptionUpdates,
    alt_updates: before.analysis.altUpdates,
    remaining_missing_descriptions: after.analysis.descriptionUpdates,
    remaining_matched_blank_alt: after.analysis.altUpdates,
    remaining_unresolved_blank_alt: after.analysis.unresolved,
    rendered_description_failures: renderedDescriptionFailures,
    crawl_errors: after.state.crawls.filter((crawl) => crawl.error || crawl.http !== 200)
  };
  fs.writeFileSync(path.join(outputDir, "page-seo-media-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const lines = [
    "# Home Salon Page SEO and Media Report",
    "",
    `Generated: ${report.generated_at}`,
    `Mode: ${applied ? "applied and verified" : "audit only"}`,
    "",
    ...(cumulativeChanges ? [
      `- Missing descriptions filled since snapshot: ${cumulativeChanges.descriptions_filled}`,
      `- Missing attachment alts filled since snapshot: ${cumulativeChanges.attachment_alts_filled}`
    ] : []),
    `- Published pages: ${report.summary.published_pages}`,
    `- Explicit descriptions before: ${report.summary.descriptions_before}`,
    `- Descriptions updated: ${report.summary.descriptions_updated}`,
    `- Explicit descriptions after: ${report.summary.descriptions_after}`,
    `- Rendered descriptions after: ${report.summary.rendered_descriptions_after}`,
    `- Rendered description failures: ${report.summary.rendered_description_failures}`,
    `- Attachment alt records updated: ${report.summary.attachment_alt_updated}`,
    `- Matched blank rendered image instances after: ${report.summary.matched_blank_alt_instances_after}`,
    `- Unresolved blank rendered image instances after: ${report.summary.unresolved_blank_instances_after}`,
    `- Crawl errors after: ${report.summary.crawl_errors_after}`,
    "",
    "## Description Updates",
    "",
    "| ID | Page | Description |",
    "| ---: | --- | --- |",
    ...report.description_updates.map((item) => `| ${item.id} | ${item.title} | ${item.description} |`),
    "",
    "## Attachment Alt Updates",
    "",
    "| ID | Media | Alt | Rendered Uses |",
    "| ---: | --- | --- | ---: |",
    ...report.alt_updates.map((item) => `| ${item.id} | ${item.title} | ${item.planned_alt} | ${item.usages.length} |`),
    ""
  ];
  fs.writeFileSync(path.join(outputDir, "page-seo-media-report.md"), `${lines.join("\n")}\n`, "utf8");
  return report;
}

async function main() {
  const beforeState = await loadState();
  const beforeAnalysis = analyze(beforeState);
  const unmappedDescriptions = beforeAnalysis.descriptionUpdates.filter((item) => !item.description);
  if (unmappedDescriptions.length) {
    throw new Error(`Missing explicit descriptions for page IDs: ${unmappedDescriptions.map((item) => item.id).join(", ")}`);
  }

  if (apply) {
    fs.mkdirSync(outputDir, { recursive: true });
    const pageIds = new Set(beforeAnalysis.descriptionUpdates.map((item) => item.id));
    const mediaIds = new Set(beforeAnalysis.altUpdates.map((item) => item.id));
    fs.writeFileSync(path.join(outputDir, "pre-update-snapshot.json"), `${JSON.stringify({
      captured_at: new Date().toISOString(),
      pages: beforeState.pages.filter((page) => pageIds.has(Number(page.id))),
      media: beforeState.media.filter((item) => mediaIds.has(Number(item.id)))
    }, null, 2)}\n`, "utf8");

    const pageResults = await pool(beforeAnalysis.descriptionUpdates, 4, async (item) => {
      const saved = await apiFetch(`pages/${item.id}`, {
        method: "PUT",
        body: { seo_description: item.description }
      });
      if (saved.seo_description !== item.description) throw new Error(`Description verification failed for page ${item.id}`);
      return { id: item.id, ok: true };
    });
    const mediaResults = await pool(beforeAnalysis.altUpdates, 6, async (item) => {
      const saved = await apiFetch(`media/${item.id}`, {
        method: "PUT",
        body: { alt: item.planned_alt }
      });
      if (saved.media?.alt !== item.planned_alt) throw new Error(`Alt verification failed for media ${item.id}`);
      return { id: item.id, ok: true };
    });
    const failures = [...pageResults, ...mediaResults].filter((item) => item.error || !item.ok);
    if (failures.length) throw new Error(`Update failures: ${JSON.stringify(failures)}`);
    await apiFetch("clear-cache", { method: "POST", body: {} });
  }

  const afterState = apply ? await loadState() : beforeState;
  const afterAnalysis = analyze(afterState);
  const report = writeReports(
    { state: beforeState, analysis: beforeAnalysis },
    { state: afterState, analysis: afterAnalysis },
    apply
  );
  console.log(JSON.stringify(report.summary, null, 2));
  if (apply && (
    report.summary.descriptions_after !== report.summary.published_pages
    || report.summary.rendered_description_failures
    || report.summary.matched_blank_alt_instances_after
    || report.summary.unresolved_blank_instances_after
    || report.summary.crawl_errors_after
  )) {
    throw new Error("Post-update verification failed; see page-seo-media-report.json.");
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
