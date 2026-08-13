const fs = require("fs");
const path = require("path");
const { validateTemplate } = require("../../../src/validator/elementor-native-lint");

const root = path.resolve(__dirname, "../../..");
const manifestPath = path.join(root, "sites/sms-home-salon/content/client-approved-navigation-migration.json");
const outputDir = path.join(root, "build/sites/sms-home-salon/client-navigation-migration/internal-links");
const apply = process.argv.includes("--apply");
const baseUrl = process.env.NEB_SITE_URL;
const apiKey = process.env.NEB_API_KEY;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeRoute(value) {
  const pathname = new URL(value, "https://homesalon.ae").pathname.replace(/\/{2,}/g, "/");
  return pathname === "/" ? "/" : `${pathname.replace(/\/$/, "")}/`;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replacementsFromManifest(manifest) {
  return manifest.redirects
    .map((item) => ({ source: normalizeRoute(item.source), destination: normalizeRoute(item.destination) }))
    .sort((a, b) => b.source.length - a.source.length);
}

function replaceLinksInString(value, replacements) {
  let output = value;
  let count = 0;
  const sources = new Set();
  for (const item of replacements) {
    const withSlash = new RegExp(escapeRegex(item.source), "g");
    output = output.replace(withSlash, () => {
      count += 1;
      sources.add(item.source);
      return item.destination;
    });
    const sourceBare = item.source.replace(/\/$/, "");
    const destinationBare = item.destination.replace(/\/$/, "");
    const withoutSlash = new RegExp(`${escapeRegex(sourceBare)}(?=([?#]|["'\\s<]|$))`, "g");
    output = output.replace(withoutSlash, () => {
      count += 1;
      sources.add(item.source);
      return destinationBare;
    });
  }
  return { value: output, count, sources: [...sources] };
}

function replaceLinks(value, replacements, stats) {
  if (typeof value === "string") {
    const result = replaceLinksInString(value, replacements);
    stats.count += result.count;
    result.sources.forEach((source) => stats.sources.add(source));
    return result.value;
  }
  if (Array.isArray(value)) return value.map((item) => replaceLinks(item, replacements, stats));
  if (!value || typeof value !== "object") return value;
  const output = {};
  for (const [key, child] of Object.entries(value)) output[key] = replaceLinks(child, replacements, stats);
  return output;
}

function findOldLinks(value, replacements, found = new Set()) {
  if (typeof value === "string") {
    for (const item of replacements) {
      const bare = item.source.replace(/\/$/, "");
      if (value.includes(item.source) || new RegExp(`${escapeRegex(bare)}(?=([?#]|["'\\s<]|$))`).test(value)) found.add(item.source);
    }
    return found;
  }
  if (!value || typeof value !== "object") return found;
  for (const child of Object.values(value)) findOldLinks(child, replacements, found);
  return found;
}

function lintElementor(data) {
  const result = validateTemplate({ elementor_data: data });
  return {
    blocking_errors: result.issues.filter((issue) => issue.severity === "error").length,
    inherited_warnings: result.issues.filter((issue) => issue.severity === "warning").length,
  };
}

async function apiFetch(endpoint, options = {}, attempt = 1) {
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`, {
      ...options,
      signal: AbortSignal.timeout(90000),
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json", ...(options.headers || {}) },
    });
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    if (!response.ok) throw new Error(`${endpoint} failed with ${response.status}: ${JSON.stringify(data).slice(0, 1000)}`);
    return data;
  } catch (error) {
    if (attempt >= 3) throw error;
    await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    return apiFetch(endpoint, options, attempt + 1);
  }
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

function buildElementorCandidate(kind, item, payload, replacements) {
  const stats = { count: 0, sources: new Set() };
  const updated = replaceLinks(clone(payload.elementor_data || []), replacements, stats);
  const lint = stats.count ? lintElementor(updated) : { blocking_errors: 0, inherited_warnings: 0 };
  if (lint.blocking_errors) throw new Error(`${kind} ${item.id}: ${lint.blocking_errors} blocking native lint errors.`);
  return {
    kind,
    id: Number(item.id),
    title: item.title,
    status: item.status,
    url: item.url || "",
    replacements: stats.count,
    sources: [...stats.sources],
    lint,
    data: updated,
  };
}

async function main() {
  if (!baseUrl || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");
  if (baseUrl.replace(/\/$/, "") !== "https://homesalon.ae/wp-json/native-elementor/v1") throw new Error(`Unexpected bridge URL: ${baseUrl}`);
  const status = await apiFetch("status");
  if (status.site_url !== "https://homesalon.ae" || status.bridge_version !== "0.9.0") throw new Error(`Unexpected bridge target: ${JSON.stringify(status)}`);
  const manifest = readJson(manifestPath);
  const replacements = replacementsFromManifest(manifest);

  const [pageInventory, templateInventory, postInventory] = await Promise.all([
    apiFetch("pages?per_page=250&include_data=false"),
    apiFetch("templates?per_page=250&include_data=false"),
    apiFetch("posts?per_page=250"),
  ]);
  const pages = (pageInventory.pages || []).filter((item) => item.status === "publish" && item.has_elementor_data);
  const templates = (templateInventory.templates || []).filter((item) => item.status === "publish" && item.has_elementor_data);
  const posts = (postInventory.posts || []).filter((item) => ["publish", "future"].includes(item.status));

  const pageCandidates = await mapLimit(pages, 5, async (item) => buildElementorCandidate("page", item, await apiFetch(`pages/${item.id}`), replacements));
  const templateCandidates = await mapLimit(templates, 4, async (item) => buildElementorCandidate("template", item, await apiFetch(`templates/${item.id}`), replacements));
  const postCandidates = await mapLimit(posts, 5, async (item) => {
    const payload = await apiFetch(`posts/${item.id}`);
    const content = replaceLinksInString(payload.content || "", replacements);
    const excerpt = replaceLinksInString(payload.excerpt || "", replacements);
    return {
      kind: "post",
      id: Number(item.id),
      title: item.title,
      status: item.status,
      url: item.url,
      replacements: content.count + excerpt.count,
      sources: [...new Set([...content.sources, ...excerpt.sources])],
      content: content.value,
      excerpt: excerpt.value,
    };
  });
  const changed = [...pageCandidates, ...templateCandidates, ...postCandidates].filter((item) => item.replacements > 0);
  const audit = {
    generated_at: new Date().toISOString(),
    apply,
    scanned: { pages: pages.length, templates: templates.length, posts: posts.length },
    changed: changed.map(({ data, content, excerpt, ...item }) => item),
    totals: {
      objects: changed.length,
      replacements: changed.reduce((sum, item) => sum + item.replacements, 0),
      pages: changed.filter((item) => item.kind === "page").length,
      templates: changed.filter((item) => item.kind === "template").length,
      posts: changed.filter((item) => item.kind === "post").length,
    },
  };
  writeJson(path.join(outputDir, apply ? "apply-plan.json" : "dry-run.json"), audit);
  if (!apply) {
    console.log(JSON.stringify({ ok: true, dry_run: true, scanned: audit.scanned, totals: audit.totals, outputDir }, null, 2));
    return;
  }

  const results = [];
  for (const item of changed) {
    const endpoint = `${item.kind === "page" ? "pages" : item.kind === "template" ? "templates" : "posts"}/${item.id}`;
    writeJson(path.join(outputDir, "baselines", `${item.kind}-${item.id}.json`), await apiFetch(endpoint));
    const body = item.kind === "post" ? { content: item.content, excerpt: item.excerpt } : { elementor_data: item.data };
    await apiFetch(endpoint, { method: "PUT", body: JSON.stringify(body) });
    const exported = await apiFetch(endpoint);
    const target = item.kind === "post" ? [exported.content || "", exported.excerpt || ""] : exported.elementor_data || [];
    const remaining = [...findOldLinks(target, replacements)];
    if (remaining.length) throw new Error(`${item.kind} ${item.id}: old links remain after save: ${remaining.join(", ")}`);
    if (exported.status !== item.status || (item.url && exported.url !== item.url)) throw new Error(`${item.kind} ${item.id}: identity changed during link update.`);
    writeJson(path.join(outputDir, "exports", `${item.kind}-${item.id}.json`), exported);
    results.push({ kind: item.kind, id: item.id, replacements: item.replacements });
    console.log(`verified ${item.kind} ${item.id} (${item.replacements} links)`);
  }
  const cache = await apiFetch("clear-cache", { method: "POST", body: "{}" });
  const report = { ...audit, results, cache };
  writeJson(path.join(outputDir, "deployment-report.json"), report);
  console.log(JSON.stringify({ ok: true, updated: results.length, replacements: results.reduce((sum, item) => sum + item.replacements, 0), cache, outputDir }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
