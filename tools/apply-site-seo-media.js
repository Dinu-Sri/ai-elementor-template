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
  throw new Error("Usage: node tools/apply-site-seo-media.js <site-seo-config.json>");
}

const configFile = path.resolve(root, configArg);
const config = JSON.parse(fs.readFileSync(configFile, "utf8"));
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
  if (!response.ok) {
    throw new Error(`${endpoint} failed with ${response.status}: ${payload.message || response.statusText}`);
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
        results[index] = { ok: false, error: error.message };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

async function main() {
  const pageResults = await pool(config.pages, 5, async (page) => {
    const body = {
      seo_title: page.seo_title,
      seo_description: page.seo_description,
      focus_keyword: page.focus_keyword,
      canonical_url: page.canonical_url,
      robots: ["index", "follow"],
      og_title: page.seo_title,
      og_description: page.seo_description
    };
    const result = await apiFetch(`pages/${page.id}`, { method: "PUT", body });
    return { ok: true, id: page.id, title: result.title, url: result.url };
  });

  const mediaEntries = Object.entries(config.media_alt).map(([id, alt]) => ({ id: Number(id), alt }));
  const mediaResults = await pool(mediaEntries, 10, async (media) => {
    const result = await apiFetch(`media/${media.id}`, {
      method: "PUT",
      body: { alt: media.alt }
    });
    return { ok: true, id: media.id, alt: result.media.alt, url: result.media.url };
  });

  const pageFailures = pageResults.filter((result) => !result.ok);
  const mediaFailures = mediaResults.filter((result) => !result.ok);
  if (pageFailures.length || mediaFailures.length) {
    throw new Error(JSON.stringify({ pageFailures, mediaFailures }, null, 2));
  }

  await apiFetch("clear-cache", { method: "POST", body: {} });
  const report = {
    applied_at: new Date().toISOString(),
    pages_updated: pageResults.length,
    media_updated: mediaResults.length,
    pages: pageResults,
    media: mediaResults
  };
  const output = path.join(root, "build", "deployments", "seo-batch", "page-seo-media-alt-apply.json");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ output: path.relative(root, output), ...report }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
