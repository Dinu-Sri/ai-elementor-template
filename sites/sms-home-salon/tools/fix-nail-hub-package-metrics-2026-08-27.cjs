const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { validateTemplate } = require("../../../src/validator/elementor-native-lint");

const root = path.resolve(__dirname, "../../..");
const detailsOnly = process.argv.includes("--details");
const outputDir = path.join(root, `build/sites/sms-home-salon/nail-${detailsOnly ? "detail" : "hub"}-package-metrics-2026-08-27`);
const apply = process.argv.includes("--apply");
const baseUrl = String(process.env.NEB_SITE_URL || "").replace(/\/$/, "");
const apiKey = process.env.NEB_API_KEY;
const expectedBaseUrl = "https://homesalon.ae/wp-json/native-elementor/v1";
const expectedSite = "https://homesalon.ae";
const expectedBridge = "0.9.0";
const manicureSource = JSON.parse(fs.readFileSync(path.join(root, "sites/sms-home-salon/content/manicure-revision-2026-08-27.json"), "utf8"));
const pedicureSource = JSON.parse(fs.readFileSync(path.join(root, "sites/sms-home-salon/content/pedicure-revision-2026-08-27.json"), "utf8"));
const targets = detailsOnly
  ? [...manicureSource.services, ...pedicureSource.services].map((service) => ({ id: service.id, label: service.name, path: service.path, metricRows: service.packages.length }))
  : [
    { id: 1379, label: "Manicure", path: "/manicure/", metricRows: 22 },
    { id: 1380, label: "Pedicure", path: "/pedicure/", metricRows: 14 },
  ];
let lastApiCallAt = 0;

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function hash(value) { return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function writeJson(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }
function decode(value) { return String(value || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim(); }
function route(value) { return new URL(value, expectedSite).pathname; }
function walk(value, visitor) { if (!value || typeof value !== "object") return; visitor(value); for (const child of Array.isArray(value) ? value : Object.values(value)) walk(child, visitor); }
function directHeadings(container) { return (container.elements || []).filter((child) => child?.widgetType === "heading"); }
function lintDelta(before, after) {
  const baseline = validateTemplate({ elementor_data: before });
  const candidate = validateTemplate({ elementor_data: after });
  const signature = (issue) => `${issue.severity}|${issue.path}|${issue.message}`;
  const inherited = new Set(baseline.issues.map(signature));
  const newErrors = candidate.issues.filter((issue) => issue.severity === "error" && !inherited.has(signature(issue)));
  return { ok: newErrors.length === 0, new_errors: newErrors, inherited_errors: candidate.issues.filter((issue) => issue.severity === "error").length, warnings: candidate.issues.filter((issue) => issue.severity === "warning").length };
}
function metricRows(elements) {
  const rows = [];
  walk(elements, (node) => {
    if (node?.elType !== "container" || !Array.isArray(node.elements)) return;
    const boxes = node.elements.filter((child) => child?.elType === "container" && directHeadings(child).length === 2);
    const labels = boxes.flatMap((box) => directHeadings(box).map((heading) => decode(heading.settings?.title)));
    if (boxes.length === 2 && labels.includes("Duration") && labels.includes("Price")) rows.push({ row: node, boxes });
  });
  return rows;
}
function transform(elements, expectedRows) {
  const after = clone(elements), rows = metricRows(after);
  if (rows.length !== expectedRows) throw new Error(`Expected ${expectedRows} metric rows, found ${rows.length}.`);
  for (const { row, boxes } of rows) {
    Object.assign(row.settings, {
      flex_direction: "row",
      flex_direction_tablet: "row",
      flex_direction_mobile: "row",
      flex_wrap: "nowrap",
      flex_wrap_tablet: "nowrap",
      flex_wrap_mobile: "nowrap",
      flex_justify_content: "space-between",
      flex_justify_content_tablet: "space-between",
      flex_justify_content_mobile: "space-between",
    });
    for (const box of boxes) {
      box.settings.width = { unit: "%", size: 47, sizes: [] };
      box.settings.width_tablet = { unit: "%", size: 47, sizes: [] };
      box.settings.width_mobile = { unit: "%", size: 47, sizes: [] };
      box.settings.padding_mobile = { unit: "px", top: "11", right: "8", bottom: "11", left: "8", isLinked: false };
    }
  }
  return after;
}
function verify(elements, expectedRows) {
  const rows = metricRows(elements);
  if (rows.length !== expectedRows) throw new Error(`Export-back expected ${expectedRows} metric rows, found ${rows.length}.`);
  for (const { row, boxes } of rows) {
    for (const key of ["flex_direction", "flex_direction_tablet", "flex_direction_mobile"]) if (row.settings[key] !== "row") throw new Error(`${key} is not row.`);
    for (const key of ["flex_wrap", "flex_wrap_tablet", "flex_wrap_mobile"]) if (row.settings[key] !== "nowrap") throw new Error(`${key} is not nowrap.`);
    for (const box of boxes) {
      for (const key of ["width", "width_tablet", "width_mobile"]) if (Number(box.settings[key]?.size) !== 47) throw new Error(`${key} is not 47%.`);
      if (Number(box.settings.padding_mobile?.left) !== 8 || Number(box.settings.padding_mobile?.right) !== 8) throw new Error("Mobile metric padding is not 8px.");
    }
  }
  return rows.length;
}
async function apiFetch(endpoint, options = {}, attempt = 1) {
  try {
    const throttle = Math.max(0, 4500 - (Date.now() - lastApiCallAt));
    if (throttle) await new Promise((resolve) => setTimeout(resolve, throttle));
    lastApiCallAt = Date.now();
    const response = await fetch(`${baseUrl}/${endpoint.replace(/^\//, "")}`, { ...options, signal: AbortSignal.timeout(90000), headers: { "X-API-Key": apiKey, "Content-Type": "application/json", ...(options.headers || {}) } });
    const text = await response.text();
    let data; try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    if (!response.ok) throw new Error(`${endpoint} failed with ${response.status}: ${JSON.stringify(data).slice(0, 1200)}`);
    return data;
  } catch (error) {
    if (attempt >= 3) throw error;
    await new Promise((resolve) => setTimeout(resolve, /failed with 403/.test(error.message) ? attempt * 60000 : attempt * 5000));
    return apiFetch(endpoint, options, attempt + 1);
  }
}
async function main() {
  if (!baseUrl || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");
  if (baseUrl !== expectedBaseUrl) throw new Error("Unexpected bridge URL.");
  fs.mkdirSync(outputDir, { recursive: true });
  const status = await apiFetch("status");
  if (status.site_url !== expectedSite || status.bridge_version !== expectedBridge) throw new Error("Unexpected production target or bridge version.");
  const snapshot = await apiFetch("site-snapshot?include_data=true");
  writeJson(path.join(outputDir, "site-snapshot.pre-update.json"), snapshot);
  const builds = targets.map((target) => {
    const page = (snapshot.pages || []).find((item) => Number(item.id) === target.id);
    if (!page || page.status !== "publish" || route(page.url) !== target.path || !page.title.toLowerCase().includes(target.label.toLowerCase())) throw new Error(`${target.label} production identity changed.`);
    const before = page.elementor_data || [], after = transform(before, target.metricRows);
    verify(after, target.metricRows);
    const lint = lintDelta(before, after);
    if (!lint.ok) throw new Error(`${target.label} candidate introduced native lint errors.`);
    writeJson(path.join(outputDir, `${target.id}.candidate.elementor.json`), after);
    return { target, page, before, after, lint };
  });
  writeJson(path.join(outputDir, "preflight-report.json"), { generated_at: new Date().toISOString(), dry_run: !apply, pages: builds.map(({ target, lint }) => ({ ...target, lint })), widths: "47%", wrap: "nowrap" });
  if (!apply) { console.log(JSON.stringify({ ok: true, dry_run: true, pages: builds.map(({ target }) => ({ id: target.id, metric_rows: target.metricRows })), new_lint_errors: 0 }, null, 2)); return; }
  const results = [];
  for (const build of builds) {
    const { target, page, before, after } = build;
    const latest = await apiFetch(`pages/${target.id}`);
    if (hash(latest.elementor_data || []) !== hash(before) || latest.title !== page.title || latest.url !== page.url) throw new Error(`${target.label} changed after preflight; refusing to overwrite it.`);
    await apiFetch(`pages/${target.id}`, { method: "PUT", body: JSON.stringify({ elementor_data: after }) });
    const saved = await apiFetch(`pages/${target.id}`);
    writeJson(path.join(outputDir, `${target.id}.post-update.json`), saved);
    const rows = verify(saved.elementor_data || [], target.metricRows), lint = lintDelta(before, saved.elementor_data || []);
    if (!lint.ok) throw new Error(`${target.label} export-back lint failed.`);
    results.push({ id: target.id, label: target.label, metric_rows: rows, lint });
  }
  const cache = await apiFetch("clear-cache", { method: "POST", body: "{}" });
  for (const target of targets) {
    const response = await fetch(`${expectedSite}${target.path}?metric_fix=${Date.now()}`, { headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(60000) });
    const html = await response.text();
    if (response.status !== 200 || !html.toLowerCase().includes(target.label.toLowerCase())) throw new Error(`${target.label} public page check failed (${response.status}).`);
  }
  writeJson(path.join(outputDir, "deployment-report.json"), { generated_at: new Date().toISOString(), pages: results, widths: "47%", wrap: "nowrap", cache, public_status: 200 });
  console.log(JSON.stringify({ ok: true, dry_run: false, pages: results.map(({ id, metric_rows }) => ({ id, metric_rows })), public_status: 200, new_lint_errors: 0 }, null, 2));
}

main().catch((error) => { console.error(error.stack || error.message); process.exit(1); });
