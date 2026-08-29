const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { validateTemplate } = require("../../../src/validator/elementor-native-lint");

const root = path.resolve(__dirname, "../../..");
const outputDir = path.join(root, "build/sites/sms-home-salon/kids-package-metrics-2026-08-27");
const apply = process.argv.includes("--apply");
const baseUrl = String(process.env.NEB_SITE_URL || "").replace(/\/$/, "");
const apiKey = process.env.NEB_API_KEY;
const expectedBaseUrl = "https://homesalon.ae/wp-json/native-elementor/v1";
const expectedSite = "https://homesalon.ae";
const expectedBridge = "0.9.0";
const pageId = 1082;
let lastApiCallAt = 0;

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function hash(value) { return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function writeJson(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }
function decode(value) { return String(value || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim(); }
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
function transform(elements) {
  const after = clone(elements);
  const rows = metricRows(after);
  if (rows.length !== 4) throw new Error(`Expected 4 Kids package metric rows, found ${rows.length}.`);
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
    }
  }
  return after;
}
function verify(elements) {
  const rows = metricRows(elements);
  if (rows.length !== 4) throw new Error(`Export-back expected 4 metric rows, found ${rows.length}.`);
  for (const { row, boxes } of rows) {
    for (const key of ["flex_direction", "flex_direction_tablet", "flex_direction_mobile"]) if (row.settings[key] !== "row") throw new Error(`${key} is not row.`);
    for (const key of ["flex_wrap", "flex_wrap_tablet", "flex_wrap_mobile"]) if (row.settings[key] !== "nowrap") throw new Error(`${key} is not nowrap.`);
    for (const box of boxes) for (const key of ["width", "width_tablet", "width_mobile"]) if (Number(box.settings[key]?.size) !== 47) throw new Error(`${key} is not 47%.`);
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
  const page = (snapshot.pages || []).find((item) => Number(item.id) === pageId);
  if (!page || page.status !== "publish" || page.title !== "Kids Mani Pedi" || new URL(page.url).pathname !== "/kids-mani-pedi/") throw new Error("Kids Mani Pedi production identity changed.");
  const before = page.elementor_data || [];
  const after = transform(before);
  verify(after);
  const lint = lintDelta(before, after);
  if (!lint.ok) throw new Error("Candidate introduced native lint errors.");
  writeJson(path.join(outputDir, "kids-1082.candidate.elementor.json"), after);
  writeJson(path.join(outputDir, "preflight-report.json"), { generated_at: new Date().toISOString(), dry_run: !apply, page_id: pageId, metric_rows: 4, widths: "47%", wrap: "nowrap", lint });
  if (!apply) { console.log(JSON.stringify({ ok: true, dry_run: true, page_id: pageId, metric_rows: 4, lint }, null, 2)); return; }
  const latest = await apiFetch(`pages/${pageId}`);
  if (hash(latest.elementor_data || []) !== hash(before) || latest.title !== page.title || latest.url !== page.url) throw new Error("Kids Mani Pedi changed after preflight; refusing to overwrite it.");
  await apiFetch(`pages/${pageId}`, { method: "PUT", body: JSON.stringify({ elementor_data: after }) });
  const saved = await apiFetch(`pages/${pageId}`);
  writeJson(path.join(outputDir, "kids-1082.post-update.json"), saved);
  const rows = verify(saved.elementor_data || []);
  const exportLint = lintDelta(before, saved.elementor_data || []);
  if (!exportLint.ok) throw new Error("Export-back lint failed.");
  const cache = await apiFetch("clear-cache", { method: "POST", body: "{}" });
  const response = await fetch(`${expectedSite}/kids-mani-pedi/?metric_fix=${Date.now()}`, { headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(60000) });
  const html = await response.text();
  if (response.status !== 200 || !html.includes("Kids Mani Pedi") || !html.includes("AED 84")) throw new Error(`Public page check failed (${response.status}).`);
  writeJson(path.join(outputDir, "deployment-report.json"), { generated_at: new Date().toISOString(), page_id: pageId, metric_rows: rows, widths: "47%", wrap: "nowrap", lint: exportLint, cache, public_status: response.status });
  console.log(JSON.stringify({ ok: true, dry_run: false, page_id: pageId, metric_rows: rows, public_status: response.status, new_lint_errors: 0 }, null, 2));
}

main().catch((error) => { console.error(error.stack || error.message); process.exit(1); });
