const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "..", "..");
const site = (process.env.NEB_SITE_URL || "").replace(/\/$/, "");
const apiKey = process.env.NEB_API_KEY;

if (!site || !apiKey) {
  throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");
}

const api = `${site}/wp-json/native-elementor/v1/`;
const headers = { "X-API-Key": apiKey, "Content-Type": "application/json" };
const timeout = (milliseconds) => AbortSignal.timeout(milliseconds);
const count = (source, needle) => String(source || "").split(needle).length - 1;

async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;

  async function run() {
    while (next < items.length) {
      const index = next++;
      try {
        results[index] = await worker(items[index], index);
      } catch (error) {
        results[index] = { error: `${error.name}: ${error.message}` };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

function loadExpectedPosts() {
  const reportDir = path.join(root, "build", "deployments", "seo-pilot");
  const reports = fs.readdirSync(reportDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => JSON.parse(fs.readFileSync(path.join(reportDir, file), "utf8")));

  return [...new Map(reports.map((report) => {
    const post = report.post || {};
    return [Number(post.id), {
      id: Number(post.id),
      content_id: report.content_id,
      slug: post.slug
    }];
  })).values()]
    .filter((post) => post.id && post.slug)
    .sort((left, right) => left.id - right.id);
}

async function readApiPost(expected) {
  const response = await fetch(`${api}posts/${expected.id}`, {
    headers,
    signal: timeout(30000)
  });
  const payload = await response.json();
  const post = payload.post || payload.data || payload;
  const content = String(post.content || "");
  const internalLinks = [...content.matchAll(
    /href=["'](https:\/\/smspetgrooming\.ae\/[^"'#?]*)/gi
  )].map((match) => match[1]);

  return {
    ...expected,
    api_http: response.status,
    status: post.status,
    author_id: Number(post.author_id),
    canonical: post.canonical_url,
    featured_image_id: Number(post.featured_image_id),
    featured_image_url: post.featured_image_url,
    seo_title: post.seo_title,
    seo_description: post.seo_description,
    focus_keyword: post.focus_keyword,
    faq_count: Array.isArray(post.faq_schema) ? post.faq_schema.length : 0,
    body_h1: (content.match(/<h1\b/gi) || []).length,
    body_note_count: count(content, "Some supporting visuals in this article may be AI-assisted"),
    blog_link_count: internalLinks.filter((url) => url.includes("/blog/")).length,
    internal_links: [...new Set(internalLinks)]
  };
}

async function readPublicPost(expected) {
  const directUrl = `${site}/${expected.slug}/`;
  const response = await fetch(directUrl, {
    redirect: "follow",
    signal: timeout(30000)
  });
  const html = await response.text();
  const canonical = html.match(
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i
  )?.[1] || html.match(
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i
  )?.[1] || "";

  return {
    id: expected.id,
    public_http: response.status,
    public_final_url: response.url,
    html_canonical: canonical,
    template_note_count: count(html, "Some supporting visuals in this article may be AI-assisted"),
    noindex: /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html)
  };
}

async function checkInternalLink(url) {
  const response = await fetch(url, {
    redirect: "manual",
    signal: timeout(30000)
  });
  return {
    url,
    http: response.status,
    location: response.headers.get("location") || ""
  };
}

function isPostFailure(post) {
  const directUrl = `${site}/${post.slug}/`;
  return Boolean(
    post.error ||
    post.status !== "publish" ||
    post.author_id !== 2 ||
    post.canonical !== directUrl ||
    !post.featured_image_id ||
    !post.seo_title ||
    !post.seo_description ||
    !post.focus_keyword ||
    !post.faq_count ||
    post.body_h1 !== 0 ||
    post.body_note_count !== 0 ||
    post.blog_link_count !== 0 ||
    post.public_http !== 200 ||
    post.public_final_url !== directUrl ||
    post.html_canonical !== directUrl ||
    post.template_note_count !== 1 ||
    post.noindex
  );
}

async function main() {
  const expected = loadExpectedPosts();
  const cacheResponse = await fetch(`${api}clear-cache`, {
    method: "POST",
    headers,
    body: "{}",
    signal: timeout(30000)
  });

  const apiRows = await pool(expected, 10, readApiPost);
  const publicRows = await pool(expected, 10, readPublicPost);
  const rows = apiRows.map((apiRow, index) => ({ ...apiRow, ...publicRows[index] }));
  const uniqueInternalLinks = [...new Set(apiRows.flatMap((post) => post.internal_links || []))];
  const linkChecks = await pool(uniqueInternalLinks, 10, checkInternalLink);
  const failures = rows.filter(isPostFailure);
  const linkFailures = linkChecks.filter((link) => link.error || link.http < 200 || link.http >= 300);

  const archiveResponse = await fetch(`${site}/blog/`, {
    redirect: "follow",
    signal: timeout(30000)
  });

  const result = {
    checked_at: new Date().toISOString(),
    cache_clear: { http: cacheResponse.status, ok: cacheResponse.ok },
    summary: {
      total: rows.length,
      published: rows.filter((post) => post.status === "publish").length,
      author_2: rows.filter((post) => post.author_id === 2).length,
      direct_api_canonicals: rows.filter((post) => post.canonical === `${site}/${post.slug}/`).length,
      direct_html_canonicals: rows.filter((post) => post.html_canonical === `${site}/${post.slug}/`).length,
      featured_images: rows.filter((post) => post.featured_image_id > 0).length,
      seo_complete: rows.filter((post) => post.seo_title && post.seo_description && post.focus_keyword).length,
      faq_schema: rows.filter((post) => post.faq_count > 0).length,
      public_200: rows.filter((post) => post.public_http === 200).length,
      template_note_once: rows.filter((post) => post.template_note_count === 1).length,
      noindex: rows.filter((post) => post.noindex).length,
      body_blog_links: rows.reduce((total, post) => total + (post.blog_link_count || 0), 0),
      unique_internal_links: uniqueInternalLinks.length,
      direct_internal_links_ok: linkChecks.filter((link) => link.http >= 200 && link.http < 300).length
    },
    archive: { http: archiveResponse.status, final_url: archiveResponse.url },
    failures,
    link_failures: linkFailures,
    rows,
    link_checks: linkChecks
  };

  const output = path.join(root, "build", "deployments", "seo-batch", "publish-1-50-validation.json");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    output: path.relative(root, output),
    summary: result.summary,
    archive: result.archive,
    failures: failures.map((post) => ({ id: post.id, slug: post.slug, error: post.error })),
    link_failures: linkFailures
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
