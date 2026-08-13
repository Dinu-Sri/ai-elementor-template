const fs = require("fs");
const path = require("path");

const baseUrl = String(process.env.NEB_SITE_URL || "").replace(/\/$/, "");
const apiKey = process.env.NEB_API_KEY;
const siteHost = "homesalon.ae";
const root = path.resolve(__dirname, "../../..");
const outputPath = path.join(root, "build/sites/sms-home-salon/phase2-remaining/public-link-audit.json");

async function apiFetch(endpoint) {
  const response = await fetch(`${baseUrl}/${endpoint}`, {
    signal: AbortSignal.timeout(60000),
    headers: { "X-API-Key": apiKey },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`${endpoint} failed with ${response.status}`);
  return data;
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

function normalizeUrl(value, source) {
  try {
    const decoded = String(value || "").replace(/&amp;/g, "&").trim();
    if (!decoded || /^(?:#|mailto:|tel:|javascript:|data:)/i.test(decoded)) return "";
    const url = new URL(decoded, source);
    if (url.hostname.toLowerCase().replace(/^www\./, "") !== siteHost) return "";
    if (/^\/wp-(?:admin|content|includes|json)\//.test(url.pathname)) return "";
    if (url.pathname === "/cdn-cgi/l/email-protection") return "";
    url.hash = "";
    url.search = "";
    url.hostname = siteHost;
    url.protocol = "https:";
    return url.href;
  } catch {
    return "";
  }
}

function extractLinks(html, source) {
  const links = [];
  for (const match of String(html || "").matchAll(/<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>/gi)) {
    const url = normalizeUrl(match[1] ?? match[2], source);
    if (url) links.push(url);
  }
  return [...new Set(links)];
}

async function fetchText(url, attempt = 1) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(45000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SMSHomeSalon-LinkAudit/1.0)" },
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`${url} returned ${response.status}`);
    return text;
  } catch (error) {
    if (attempt >= 3) throw error;
    await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    return fetchText(url, attempt + 1);
  }
}

async function checkUrl(url, attempt = 1) {
  try {
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(30000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SMSHomeSalon-LinkAudit/1.0)" },
    });
    await response.body?.cancel();
    return { url, status: response.status, location: response.headers.get("location") || "" };
  } catch (error) {
    if (attempt >= 3) return { url, status: 0, location: "", error: error.message };
    await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    return checkUrl(url, attempt + 1);
  }
}

async function main() {
  if (!baseUrl || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");
  const [pageInventory, postInventory] = await Promise.all([
    apiFetch("pages?per_page=250&include_data=false"),
    apiFetch("posts?per_page=250"),
  ]);
  const sources = [
    ...(pageInventory.pages || []).filter((item) => item.status === "publish").map((item) => item.url),
    ...(postInventory.posts || []).filter((item) => item.status === "publish").map((item) => item.url),
    "https://homesalon.ae/category/massage/",
    "https://homesalon.ae/author/admin_2culxpzf/",
  ];
  const sourceLinks = await pool(sources, 4, async (source) => ({ source, links: extractLinks(await fetchText(source), source) }));
  const references = new Map();
  for (const item of sourceLinks) {
    for (const link of item.links) {
      if (!references.has(link)) references.set(link, []);
      references.get(link).push(item.source);
    }
  }
  const checks = await pool([...references.keys()], 5, checkUrl);
  const broken = checks.filter((item) => item.status === 0 || item.status >= 400).map((item) => ({ ...item, referenced_by: references.get(item.url) }));
  const redirects = checks.filter((item) => item.status >= 300 && item.status < 400).map((item) => ({ ...item, referenced_by: references.get(item.url) }));
  const report = {
    sources_scanned: sources.length,
    unique_internal_links: checks.length,
    broken_count: broken.length,
    redirect_count: redirects.length,
    broken,
    redirects,
  };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({
    sources_scanned: report.sources_scanned,
    unique_internal_links: report.unique_internal_links,
    broken_count: report.broken_count,
    redirect_count: report.redirect_count,
    broken: broken.map((item) => ({ url: item.url, status: item.status, references: item.referenced_by.length })),
    redirect_classes: {
      blog_prefix: redirects.filter((item) => new URL(item.url).pathname.startsWith("/blog/")).length,
      date_archives: redirects.filter((item) => /^\/\d{4}\/\d{2}\/\d{2}\/$/.test(new URL(item.url).pathname)).length,
      other: redirects.filter((item) => !new URL(item.url).pathname.startsWith("/blog/") && !/^\/\d{4}\/\d{2}\/\d{2}\/$/.test(new URL(item.url).pathname)).length,
    },
    outputPath,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
