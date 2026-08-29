const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { validateTemplate } = require("../../../src/validator/elementor-native-lint");
const { buildHub, buildDetail, verifyCards, verifyDetail, prepareMenu, verifyMenu } = require("./apply-hair-revision-2026-08-27.cjs");

const root = path.resolve(__dirname, "../../..");
const category = process.argv.includes("--threading") ? "threading" : "waxing";
const profile = category === "threading"
  ? { hubId: 67, hubPath: "/threading/", services: 8, packages: 9, featured: "Chin Threading" }
  : { hubId: 66, hubPath: "/waxing/", services: 11, packages: 45, featured: "Upper Lip Waxing - Normal" };
const sourcePath = path.join(root, `sites/sms-home-salon/content/${category}-revision-2026-08-27.json`);
const fallbackSnapshotPath = path.join(root, `build/sites/sms-home-salon/${category}-revision-2026-08-27/site-snapshot.pre-update.json`);
const outputDir = path.join(root, `build/sites/sms-home-salon/${category}-revision-2026-08-27`);
const apply = process.argv.includes("--apply");
const liveDryRun = process.argv.includes("--live-dry-run");
const baseUrl = String(process.env.NEB_SITE_URL || "").replace(/\/$/, ""), apiKey = process.env.NEB_API_KEY;
const expectedBaseUrl = "https://homesalon.ae/wp-json/native-elementor/v1", expectedSite = "https://homesalon.ae", expectedBridge = "0.9.0";
let lastApiCallAt = 0;

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function hash(value) { return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function writeJson(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }
function decode(value) { return String(value || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim(); }
function route(value) { return new URL(value, expectedSite).pathname.replace(/\/$/, "") || "/"; }
function walk(value, visit) { if (!value || typeof value !== "object") return; visit(value); for (const child of Array.isArray(value) ? value : Object.values(value)) walk(child, visit); }
function lintDelta(before, after) { const baseline = validateTemplate({ elementor_data: before }), candidate = validateTemplate({ elementor_data: after }); const signature = (issue) => `${issue.severity}|${issue.path}|${issue.message}`, inherited = new Set(baseline.issues.map(signature)); const newErrors = candidate.issues.filter((issue) => issue.severity === "error" && !inherited.has(signature(issue))); return { ok: newErrors.length === 0, new_errors: newErrors, inherited_errors: candidate.issues.filter((issue) => issue.severity === "error").length, warnings: candidate.issues.filter((issue) => issue.severity === "warning").length }; }
function flatten(source) { return source.services.flatMap((service) => service.packages.map((item) => ({ service, item }))); }
function menuPayload(tree) { return (tree || []).map((item) => ({ label: item.title, page_id: Number(item.object_id), type: item.type, object: item.object, source_key: item.source_key || undefined, target: item.target || "", attr_title: item.attr_title || "", description: item.description || "", classes: item.classes || [], xfn: item.xfn || "", ...(item.children?.length ? { children: menuPayload(item.children) } : {}) })); }
function hubTitle(source, service, item) { return source.hub_package_prefix && !item.name.toLowerCase().startsWith(service.name.toLowerCase()) ? `${service.name} - ${item.name}` : item.name; }
function validateSource(source) {
  if (source.site !== expectedSite || source.menu_id !== 12 || source.hub_id !== profile.hubId || source.hub_path !== profile.hubPath || source.services?.length !== profile.services || flatten(source).length !== profile.packages || !source.hub_package_prefix || source.featured_package !== profile.featured) throw new Error(`Unexpected ${category} revision source.`);
  const ids = new Set(), paths = new Set();
  for (const service of source.services) { if (ids.has(service.id) || paths.has(route(service.path))) throw new Error(`${service.name}: duplicate identity.`); ids.add(service.id); paths.add(route(service.path)); for (const item of service.packages) if (!/^AED \d+$/.test(item.price)) throw new Error(`${service.name}/${item.name}: invalid price.`); }
  if (flatten(source).filter(({ item }) => item.most_popular).length !== 1 || hubTitle(source, flatten(source)[0].service, flatten(source)[0].item) !== source.featured_package) throw new Error(`${category} Most Popular contract is invalid.`);
}
async function apiFetch(endpoint, options = {}, attempt = 1) {
  try { const throttle = Math.max(0, 4500 - (Date.now() - lastApiCallAt)); if (throttle) await new Promise((resolve) => setTimeout(resolve, throttle)); lastApiCallAt = Date.now(); const response = await fetch(`${baseUrl}/${endpoint.replace(/^\//, "")}`, { ...options, signal: AbortSignal.timeout(90000), headers: { "X-API-Key": apiKey, "Content-Type": "application/json", ...(options.headers || {}) } }); const text = await response.text(); let data; try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; } if (!response.ok) throw new Error(`${endpoint} failed with ${response.status}: ${JSON.stringify(data).slice(0, 1500)}`); return data; }
  catch (error) { if (attempt >= 3) throw error; await new Promise((resolve) => setTimeout(resolve, /failed with 403/.test(error.message) ? attempt * 60000 : attempt * 5000)); return apiFetch(endpoint, options, attempt + 1); }
}
async function verifyPublic(source) {
  const results = [];
  for (const service of source.services) { const response = await fetch(`${expectedSite}${service.path}?${category}_verify=${Date.now()}`, { headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(60000) }); const html = await response.text(), text = decode(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")); const missing = service.packages.flatMap((item) => [item.name, item.price]).filter((value) => !text.includes(value)); if (!response.ok || missing.length) throw new Error(`${service.name}: public verification failed (${response.status}; ${missing.join(" | ")}).`); results.push({ id: service.id, path: service.path, status: response.status }); await new Promise((resolve) => setTimeout(resolve, 1500)); }
  const response = await fetch(`${expectedSite}${source.hub_path}?${category}_hub_verify=${Date.now()}`, { headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(60000) }), html = await response.text(); const missing = flatten(source).flatMap(({ service, item }) => [item.name, item.price, service.path]).filter((value) => !html.includes(value)); if (!response.ok || missing.length) throw new Error(`${category} hub public verification failed (${response.status}; ${missing.join(" | ")}).`); results.push({ id: source.hub_id, path: source.hub_path, status: response.status }); return results;
}
async function main() {
  const source = JSON.parse(fs.readFileSync(sourcePath, "utf8")); validateSource(source); fs.mkdirSync(outputDir, { recursive: true });
  let status = null, snapshot;
  if (apply || liveDryRun) { if (!baseUrl || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required for live operations."); status = await apiFetch("status"); if (baseUrl !== expectedBaseUrl || status.site_url !== expectedSite || status.bridge_version !== expectedBridge) throw new Error("Unexpected production bridge target."); snapshot = await apiFetch("site-snapshot?include_data=true"); }
  else snapshot = JSON.parse(fs.readFileSync(fallbackSnapshotPath, "utf8"));
  if (!snapshot.ok || !snapshot.include_data || snapshot.status?.site_url !== expectedSite) throw new Error("Production snapshot is incomplete or targets the wrong site."); writeJson(path.join(outputDir, apply ? "site-snapshot.pre-apply.json" : "site-snapshot.local-baseline.json"), snapshot);
  const pages = new Map(snapshot.pages.map((page) => [Number(page.id), page])), hubPage = pages.get(source.hub_id);
  if (!hubPage || hubPage.status !== "publish" || route(hubPage.url) !== route(source.hub_path)) throw new Error(`${category} hub identity mismatch.`);
  for (const service of source.services) { const page = pages.get(service.id); if (!page || page.status !== "publish" || route(page.url) !== route(service.path)) throw new Error(`${service.name}: page identity mismatch.`); }
  const hubBuild = buildHub(hubPage, source), details = source.services.map((service) => ({ service, page: pages.get(service.id), build: buildDetail(pages.get(service.id), service) }));
  const hubContract = verifyCards(hubBuild.after, source, true); for (const item of details) verifyDetail(item.build.after, item.service);
  const menuBefore = snapshot.menus.find((menu) => Number(menu.id) === source.menu_id), preparedMenu = prepareMenu(menuBefore, source), menuContract = verifyMenu({ tree: preparedMenu.tree }, source);
  writeJson(path.join(outputDir, `${category}-hub.candidate.elementor.json`), hubBuild.after); for (const item of details) writeJson(path.join(outputDir, `detail-${item.service.id}.candidate.json`), item.build.after);
  writeJson(path.join(outputDir, "preflight-report.json"), { generated_at: new Date().toISOString(), dry_run: !apply, status, hub: { id: source.hub_id, lint: hubBuild.lint, packages: hubContract }, details: details.map((item) => ({ id: item.service.id, lint: item.build.lint, packages: item.service.packages })), menu: menuContract });
  if (!apply) { console.log(JSON.stringify({ ok: true, dry_run: true, existing_pages: source.services.length, new_pages: 0, hub_cards: hubContract.length, detail_cards: flatten(source).length, menu_items: menuBefore.count, new_lint_errors: 0, outputDir }, null, 2)); return; }
  const writes = [...details.map((item) => ({ id: item.service.id, before: item.page, after: item.build.after, kind: "detail", service: item.service })), { id: source.hub_id, before: hubPage, after: hubBuild.after, kind: "hub" }], results = [];
  for (const item of writes) { const latest = await apiFetch(`pages/${item.id}`); if (hash(latest.elementor_data || []) !== hash(item.before.elementor_data || []) || latest.status !== "publish" || route(latest.url) !== route(item.before.url)) throw new Error(`${item.id}: live page changed after preflight.`); await apiFetch(`pages/${item.id}`, { method: "PUT", body: JSON.stringify({ elementor_data: item.after }) }); const saved = await apiFetch(`pages/${item.id}`); writeJson(path.join(outputDir, `${item.kind}-${item.id}.post-update.json`), saved); if (saved.status !== "publish" || route(saved.url) !== route(item.before.url) || Number(saved.parent_id) !== Number(item.before.parent_id)) throw new Error(`${item.id}: identity changed unexpectedly.`); if (item.kind === "hub") verifyCards(saved.elementor_data || [], source, true); else verifyDetail(saved.elementor_data || [], item.service); const lint = lintDelta(item.before.elementor_data || [], saved.elementor_data || []); if (!lint.ok) throw new Error(`${item.id}: export-back lint failed.`); results.push({ id: item.id, kind: item.kind, url: saved.url, lint }); }
  const liveMenu = (await apiFetch("menus")).menus.find((menu) => Number(menu.id) === source.menu_id); if (hash(menuPayload(liveMenu.tree || [])) !== hash(menuPayload(menuBefore.tree || []))) throw new Error("Main Menu changed after preflight."); const livePrepared = prepareMenu(liveMenu, source); const menuDryRun = await apiFetch("menus", { method: "POST", body: JSON.stringify({ menu_id: source.menu_id, mode: "replace", dry_run: true, items: livePrepared.items }) }); if (!menuDryRun.ok || !menuDryRun.dry_run) throw new Error("Main Menu dry run failed."); await apiFetch("menus", { method: "POST", body: JSON.stringify({ menu_id: source.menu_id, mode: "replace", dry_run: false, items: livePrepared.items }) }); const menuAfter = (await apiFetch("menus")).menus.find((menu) => Number(menu.id) === source.menu_id), savedMenuContract = verifyMenu(menuAfter, source); if (Number(menuAfter.count) !== Number(menuBefore.count)) throw new Error("Main Menu count changed unexpectedly."); writeJson(path.join(outputDir, "main-menu.post-update.json"), menuAfter);
  const cache = await apiFetch("clear-cache", { method: "POST", body: "{}" }), postSnapshot = await apiFetch("site-snapshot?include_data=true"); writeJson(path.join(outputDir, "site-snapshot.post-apply.json"), postSnapshot); const postPages = new Map(postSnapshot.pages.map((page) => [Number(page.id), page])); verifyCards(postPages.get(source.hub_id).elementor_data || [], source, true); for (const service of source.services) verifyDetail(postPages.get(service.id).elementor_data || [], service);
  const publicChecks = await verifyPublic(source); writeJson(path.join(outputDir, "deployment-report.json"), { generated_at: new Date().toISOString(), operation: `reconcile-${category}-services`, status, results, menu: { id: source.menu_id, count: menuAfter.count, contract: savedMenuContract }, cache, public_checks: publicChecks });
  console.log(JSON.stringify({ ok: true, dry_run: false, existing_pages: source.services.length, new_pages: 0, hub_cards: hubContract.length, detail_cards: flatten(source).length, menu_items: menuAfter.count, public_checks: publicChecks.length, outputDir }, null, 2));
}

if (require.main === module) main().catch((error) => { console.error(error.stack || error.message); process.exit(1); });
