const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const baseUrl = process.env.NEB_SITE_URL;
const apiKey = process.env.NEB_API_KEY;

if (!baseUrl || !apiKey) {
  throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");
}

const root = path.resolve(__dirname, "../../..");
const mapPath = path.join(root, "sites/sms-home-salon/content/seo-50-internal-link-map.csv");
const outputDir = path.join(root, "build/sites/sms-home-salon/seo-50");
const jsonPath = path.join(outputDir, "seo-50-interlink-audit.json");
const markdownPath = path.join(outputDir, "seo-50-interlink-audit.md");
const seoPostIds = new Set(Array.from({ length: 50 }, (_, index) => 1166 + index));

function decodeHtml(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&#8211;", "-")
    .replaceAll("&#8212;", "-")
    .replaceAll("&#8217;", "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value) {
  return decodeHtml(value).toLowerCase();
}

function normalizeUrl(value) {
  try {
    const url = new URL(String(value || "").trim(), "https://homesalon.ae/");
    if (!/^https?:$/i.test(url.protocol)) return "";
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    if (hostname !== "homesalon.ae") return url.href;
    let pathname = url.pathname.replace(/\/{2,}/g, "/");
    if (pathname !== "/" && !pathname.endsWith("/")) pathname += "/";
    return `https://homesalon.ae${pathname}`;
  } catch {
    return "";
  }
}

function extractLinks(html) {
  const links = [];
  const pattern = /<a\b[^>]*\bhref=(?:"([^"]*)"|'([^']*)')[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of String(html || "").matchAll(pattern)) {
    const href = match[1] ?? match[2] ?? "";
    const target = normalizeUrl(href);
    if (!target.startsWith("https://homesalon.ae/")) continue;
    links.push({ anchor: decodeHtml(match[3]), target });
  }
  return links;
}

async function apiFetch(endpoint) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`, {
    headers: { "X-API-Key": apiKey }
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${endpoint} failed with ${response.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : {};
}

async function pool(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

function multiset(rows, keyFn) {
  const result = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    result.set(key, (result.get(key) || 0) + 1);
  }
  return result;
}

async function main() {
  const plannedRows = parse(fs.readFileSync(mapPath, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true
  }).map((row) => ({
    order: Number(row["Source Order"]),
    source_id: row["Source ID"],
    source_slug: normalizeUrl(row["Source Slug"]),
    anchor: decodeHtml(row.Anchor),
    target: normalizeUrl(row["Target URL"]),
    link_type: row["Link Type"]
  }));

  const [postsList, pagesList] = await Promise.all([
    apiFetch("posts?per_page=250"),
    apiFetch("pages?per_page=250")
  ]);
  const seoPosts = (postsList.posts || []).filter((post) => seoPostIds.has(Number(post.id)));
  const livePosts = await pool(seoPosts, 6, (post) => apiFetch(`posts/${post.id}`));

  const pageTargets = new Set((pagesList.pages || [])
    .filter((page) => page.status === "publish")
    .map((page) => normalizeUrl(page.url)));
  const articleTargets = new Set(livePosts.map((post) => normalizeUrl(post.url)));
  const sourceByUrl = new Map(livePosts.map((post) => [normalizeUrl(post.url), post]));

  const results = [];
  const missing = [];
  const invalidTargets = [];
  for (const [sourceUrl, post] of sourceByUrl) {
    const planned = plannedRows.filter((row) => row.source_slug === sourceUrl);
    const actual = extractLinks(post.content);
    const actualExact = multiset(actual, (link) => `${normalizeText(link.anchor)}|${link.target}`);
    const plannedExact = multiset(planned, (link) => `${normalizeText(link.anchor)}|${link.target}`);

    for (const row of planned) {
      const key = `${normalizeText(row.anchor)}|${row.target}`;
      const available = actualExact.get(key) || 0;
      if (available > 0) {
        actualExact.set(key, available - 1);
      } else {
        missing.push({
          post_id: Number(post.id),
          source_slug: sourceUrl,
          anchor: row.anchor,
          target: row.target,
          link_type: row.link_type
        });
      }
      const targetExists = row.link_type === "supporting_article"
        ? articleTargets.has(row.target)
        : pageTargets.has(row.target);
      if (!targetExists) {
        invalidTargets.push({
          post_id: Number(post.id),
          source_slug: sourceUrl,
          target: row.target,
          link_type: row.link_type
        });
      }
    }

    results.push({
      post_id: Number(post.id),
      title: post.title,
      slug: sourceUrl,
      status: post.status,
      planned_links: planned.length,
      actual_internal_links: actual.length,
      planned_supporting_links: planned.filter((row) => row.link_type === "supporting_article").length,
      planned_service_links: planned.filter((row) => row.link_type === "commercial_service").length,
      missing_exact_links: missing.filter((row) => row.post_id === Number(post.id)).length,
      cms_visual_markers: (String(post.content).match(/CMS_VISUAL/g) || []).length
    });
  }

  results.sort((a, b) => a.post_id - b.post_id);
  const summary = {
    generated_at: new Date().toISOString(),
    posts_checked: results.length,
    planned_links: plannedRows.length,
    actual_internal_links: results.reduce((sum, row) => sum + row.actual_internal_links, 0),
    posts_with_missing_links: results.filter((row) => row.missing_exact_links > 0).length,
    missing_exact_links: missing.length,
    invalid_planned_targets: invalidTargets.length,
    posts_with_no_supporting_links: results.filter((row) => row.planned_supporting_links === 0).length,
    posts_with_no_service_links: results.filter((row) => row.planned_service_links === 0).length,
    cms_visual_markers: results.reduce((sum, row) => sum + row.cms_visual_markers, 0)
  };

  const report = { summary, posts: results, missing, invalid_targets: invalidTargets };
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const lines = [
    "# SEO 50 Interlink Audit",
    "",
    `Generated: ${summary.generated_at}`,
    "",
    `- Posts checked: ${summary.posts_checked}`,
    `- Planned internal links: ${summary.planned_links}`,
    `- Actual internal links: ${summary.actual_internal_links}`,
    `- Missing exact planned links: ${summary.missing_exact_links}`,
    `- Invalid planned targets: ${summary.invalid_planned_targets}`,
    `- Posts with no supporting-article links: ${summary.posts_with_no_supporting_links}`,
    `- Posts with no commercial-service links: ${summary.posts_with_no_service_links}`,
    `- Remaining CMS_VISUAL markers: ${summary.cms_visual_markers}`,
    ""
  ];
  if (missing.length) {
    lines.push("## Missing Links", "");
    for (const row of missing) {
      lines.push(`- Post ${row.post_id}: \`${row.anchor}\` -> ${row.target}`);
    }
    lines.push("");
  }
  if (invalidTargets.length) {
    lines.push("## Invalid Targets", "");
    for (const row of invalidTargets) {
      lines.push(`- Post ${row.post_id}: ${row.target} (${row.link_type})`);
    }
    lines.push("");
  }
  fs.writeFileSync(markdownPath, `${lines.join("\n")}\n`, "utf8");
  console.log(JSON.stringify({ ok: missing.length === 0 && invalidTargets.length === 0, summary, jsonPath, markdownPath }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
