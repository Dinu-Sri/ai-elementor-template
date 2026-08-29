const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { validateTemplate } = require("../../../src/validator/elementor-native-lint");
const { buildDetail, verifyPackages } = require("./apply-manicure-revision-2026-08-27.cjs");

const root = path.resolve(__dirname, "../../..");
const sourcePath = path.join(root, "sites/sms-home-salon/content/kids-mani-pedi-revision-2026-08-27.json");
const fallbackSnapshotPath = path.join(root, "build/sites/sms-home-salon/kids-mani-pedi-revision-2026-08-27/site-snapshot.pre-update.json");
const fallbackRedirectsPath = path.join(root, "build/sites/sms-home-salon/kids-mani-pedi-revision-2026-08-27/redirects.pre-update.json");
const outputDir = path.join(root, "build/sites/sms-home-salon/kids-mani-pedi-revision-2026-08-27");
const apply = process.argv.includes("--apply");
const baseUrl = String(process.env.NEB_SITE_URL || "").replace(/\/$/, "");
const apiKey = process.env.NEB_API_KEY;
const expectedBaseUrl = "https://homesalon.ae/wp-json/native-elementor/v1";
const expectedSite = "https://homesalon.ae";
const expectedBridge = "0.9.0";
let lastApiCallAt = 0;

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function hash(value) { return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function writeJson(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }
function decode(value) { return String(value || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim(); }
function route(value) { return new URL(value, expectedSite).pathname.replace(/\/$/, "") || "/"; }
function walk(value, visitor) { if (!value || typeof value !== "object") return; visitor(value); for (const child of Array.isArray(value) ? value : Object.values(value)) walk(child, visitor); }
function replaceDeep(value, replacer) {
  if (typeof value === "string") return replacer(value);
  if (Array.isArray(value)) return value.map((item) => replaceDeep(item, replacer));
  if (!value || typeof value !== "object") return value;
  for (const [key, child] of Object.entries(value)) value[key] = replaceDeep(child, replacer);
  return value;
}
function lintDelta(before, after) {
  const baseline = validateTemplate({ elementor_data: before }), candidate = validateTemplate({ elementor_data: after });
  const signature = (issue) => `${issue.severity}|${issue.path}|${issue.message}`, inherited = new Set(baseline.issues.map(signature));
  const newErrors = candidate.issues.filter((issue) => issue.severity === "error" && !inherited.has(signature(issue)));
  return { ok: newErrors.length === 0, new_errors: newErrors, inherited_errors: candidate.issues.filter((issue) => issue.severity === "error").length, warnings: candidate.issues.filter((issue) => issue.severity === "warning").length };
}
function kidsService(source) { return { id: source.page.id, name: source.page.title, path: source.page.path, packages: source.packages }; }
function buildKidsPage(page, source) {
  const built = buildDetail(page, kidsService(source));
  replaceDeep(built.after, (value) => value.replaceAll("Kids Nail Services", "Kids Mani Pedi").replaceAll("kids nail services", "kids mani pedi"));
  verifyPackages(built.after, [kidsService(source)], false);
  const lint = lintDelta(built.before, built.after);
  if (!lint.ok) throw new Error("Kids page candidate introduced native lint errors.");
  return { ...built, lint };
}
function buildReferencePage(page, source) {
  const before = page.elementor_data || [], after = clone(before);
  replaceDeep(after, (value) => value.replaceAll(source.page.old_path, source.page.path));
  if (Number(page.id) === 61) walk(after, (node) => { if (node?.widgetType === "button" && node.settings?.text === "Kids") node.settings.text = source.page.title; });
  const raw = JSON.stringify(after);
  if (raw.includes(source.page.old_path) || !raw.includes(source.page.path)) throw new Error(`${page.id}: Kids reference transformation failed.`);
  const lint = lintDelta(before, after);
  if (!lint.ok) throw new Error(`${page.id}: reference update introduced native lint errors.`);
  return { before, after, lint };
}
function menuPayload(tree) { return (tree || []).map((item) => ({ label: item.title, page_id: Number(item.object_id), type: item.type, object: item.object, source_key: item.source_key || undefined, target: item.target || "", attr_title: item.attr_title || "", description: item.description || "", classes: item.classes || [], xfn: item.xfn || "", ...(item.children?.length ? { children: menuPayload(item.children) } : {}) })); }
function findMenuItem(tree, objectId) { let found = null; walk(tree, (item) => { if (Number(item?.object_id) === Number(objectId)) found = item; }); return found; }
function prepareMenu(menu, source) {
  if (!menu || Number(menu.id) !== source.menu_id || menu.slug !== "main-menu" || !(menu.locations || []).includes("menu-1")) throw new Error("Unexpected Main Menu identity.");
  const tree = clone(menu.tree || []), item = findMenuItem(tree, source.page.id);
  if (!item || item.source_key !== "services-kids") throw new Error("Kids menu item was not found.");
  item.title = source.page.title;
  return { tree, items: menuPayload(tree) };
}
function verifyMenu(menu, source) { const item = findMenuItem(menu.tree, source.page.id); if (!item || item.title !== source.page.title || route(item.url) !== route(source.page.path)) throw new Error("Kids menu contract failed."); return { id: Number(item.object_id), title: item.title, url: item.url }; }
function validateSource(source) {
  if (source.site !== expectedSite || source.menu_id !== 12 || source.page?.id !== 1082 || source.page.old_path !== "/kids/" || source.page.path !== "/kids-mani-pedi/" || source.page.title !== "Kids Mani Pedi" || source.packages?.length !== 4) throw new Error("Unexpected Kids Mani Pedi revision source.");
  for (const item of source.packages) if (![10, 45, 60].includes(item.duration) || !/^AED \d+$/.test(item.price)) throw new Error(`${item.name}: invalid duration or price.`);
  if (source.redirect.source !== source.page.old_path || source.redirect.destination !== source.page.path || source.redirect.type !== 301 || source.redirect.status !== "active") throw new Error("Unexpected Kids redirect contract.");
}
function redirectMatch(inventory, source) {
  return (inventory.redirections || []).find((item) => (item.sources || []).some((entry) => entry.comparison === "exact" && route(entry.route) === route(source.redirect.source)));
}
function verifyRedirect(inventory, source) {
  const item = redirectMatch(inventory, source);
  if (!item || Number(item.type) !== 301 || item.status !== "active" || route(item.destination) !== route(source.redirect.destination)) throw new Error("Kids redirect contract failed.");
  return { id: item.id, source: source.redirect.source, destination: item.destination, type: Number(item.type), status: item.status };
}
async function apiFetch(endpoint, options = {}, attempt = 1) {
  try {
    const throttle = Math.max(0, 4500 - (Date.now() - lastApiCallAt)); if (throttle) await new Promise((resolve) => setTimeout(resolve, throttle)); lastApiCallAt = Date.now();
    const response = await fetch(`${baseUrl}/${endpoint.replace(/^\//, "")}`, { ...options, signal: AbortSignal.timeout(90000), headers: { "X-API-Key": apiKey, "Content-Type": "application/json", ...(options.headers || {}) } });
    const text = await response.text(); let data; try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    if (!response.ok) throw new Error(`${endpoint} failed with ${response.status}: ${JSON.stringify(data).slice(0, 1500)}`);
    return data;
  } catch (error) { if (attempt >= 3) throw error; await new Promise((resolve) => setTimeout(resolve, /failed with 403/.test(error.message) ? attempt * 60000 : attempt * 5000)); return apiFetch(endpoint, options, attempt + 1); }
}
async function publicCheck(source) {
  const fresh = await fetch(`${expectedSite}${source.page.path}?kids_verify=${Date.now()}`, { redirect: "manual", headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(60000) });
  const html = await fresh.text(), text = decode(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " "));
  const missing = [source.page.title, ...source.packages.flatMap((item) => [item.name, `${item.duration} min`, item.price])].filter((value) => !text.includes(value));
  if (fresh.status !== 200 || missing.length || html.includes(source.page.old_path)) throw new Error(`New Kids URL public check failed (${fresh.status}; ${missing.join(" | ")}).`);
  const old = await fetch(`${expectedSite}${source.page.old_path}?kids_redirect=${Date.now()}`, { redirect: "manual", headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(60000) });
  if (old.status !== 301 || route(old.headers.get("location")) !== route(source.page.path)) throw new Error(`Old Kids URL did not return a direct 301 (${old.status}; ${old.headers.get("location")}).`);
  const references = [];
  for (const pathName of ["/services/", "/nails/"]) { const response = await fetch(`${expectedSite}${pathName}?kids_ref=${Date.now()}`, { headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(60000) }); const body = await response.text(); if (!response.ok || !body.includes(source.page.path) || body.includes(`href=\"${source.page.old_path}\"`)) throw new Error(`${pathName}: public Kids link verification failed.`); references.push({ path: pathName, status: response.status }); }
  return { page: { path: source.page.path, status: fresh.status }, redirect: { path: source.page.old_path, status: old.status, location: old.headers.get("location") }, references };
}
async function main() {
  const source = JSON.parse(fs.readFileSync(sourcePath, "utf8")); validateSource(source); fs.mkdirSync(outputDir, { recursive: true });
  let status = null, snapshot, redirects;
  if (apply) {
    if (!baseUrl || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required with --apply.");
    status = await apiFetch("status");
    if (baseUrl !== expectedBaseUrl || status.site_url !== expectedSite || status.bridge_version !== expectedBridge || !status.rank_math_redirections) throw new Error("Unexpected production bridge target or redirect capability.");
    snapshot = await apiFetch("site-snapshot?include_data=true"); redirects = await apiFetch("rank-math/redirections");
  } else { snapshot = JSON.parse(fs.readFileSync(fallbackSnapshotPath, "utf8")); redirects = JSON.parse(fs.readFileSync(fallbackRedirectsPath, "utf8")); }
  if (!snapshot.ok || !snapshot.include_data || snapshot.status?.site_url !== expectedSite) throw new Error("Production snapshot is incomplete or targets the wrong site.");
  writeJson(path.join(outputDir, apply ? "site-snapshot.pre-apply.json" : "site-snapshot.local-baseline.json"), snapshot);
  const pages = new Map(snapshot.pages.map((page) => [Number(page.id), page])), kidsPage = pages.get(source.page.id);
  if (!kidsPage || kidsPage.status !== "publish" || kidsPage.title !== source.page.old_title || route(kidsPage.url) !== route(source.page.old_path) || Number(kidsPage.parent_id) !== 0) throw new Error("Kids page identity drifted from the approved baseline.");
  const related = [61, 63].map((id) => pages.get(id)); if (related.some((page) => !page || page.status !== "publish")) throw new Error("Services or Nails reference page is missing.");
  if (redirectMatch(redirects, source)) throw new Error("The old /kids/ route already has a redirect; refusing an unreviewed overwrite.");
  const kidsBuild = buildKidsPage(kidsPage, source), relatedBuilds = related.map((page) => ({ page, build: buildReferencePage(page, source) }));
  const menuBefore = snapshot.menus.find((menu) => Number(menu.id) === source.menu_id), menuPrepared = prepareMenu(menuBefore, source);
  writeJson(path.join(outputDir, "kids-1082.candidate.elementor.json"), kidsBuild.after); for (const item of relatedBuilds) writeJson(path.join(outputDir, `reference-${item.page.id}.candidate.elementor.json`), item.build.after);
  writeJson(path.join(outputDir, "preflight-report.json"), { generated_at: new Date().toISOString(), dry_run: !apply, status, page: source.page, packages: source.packages, lint: { kids: kidsBuild.lint, references: relatedBuilds.map((item) => ({ id: item.page.id, lint: item.build.lint })) }, menu: { before_count: menuBefore.count, label: source.page.title }, redirect: source.redirect });
  if (!apply) { console.log(JSON.stringify({ ok: true, dry_run: true, page_id: source.page.id, packages: source.packages.length, reference_pages: relatedBuilds.length, menu_items: menuBefore.count, redirect: source.redirect, new_lint_errors: 0, outputDir }, null, 2)); return; }
  const redirectDryRun = await apiFetch("rank-math/redirections", { method: "POST", body: JSON.stringify({ dry_run: true, redirections: [{ ...source.redirect, ignore_case: false }] }) });
  if (!redirectDryRun.ok || !redirectDryRun.dry_run || Number(redirectDryRun.summary?.create) !== 1) throw new Error("Kids redirect dry run did not plan exactly one creation.");
  const results = [];
  for (const item of relatedBuilds) {
    const latest = await apiFetch(`pages/${item.page.id}`); if (hash(latest.elementor_data || []) !== hash(item.page.elementor_data || []) || route(latest.url) !== route(item.page.url)) throw new Error(`${item.page.id}: live reference page changed after preflight.`);
    await apiFetch(`pages/${item.page.id}`, { method: "PUT", body: JSON.stringify({ elementor_data: item.build.after }) }); const saved = await apiFetch(`pages/${item.page.id}`); writeJson(path.join(outputDir, `reference-${item.page.id}.post-update.json`), saved);
    if (JSON.stringify(saved.elementor_data || []).includes(source.page.old_path) || !JSON.stringify(saved.elementor_data || []).includes(source.page.path)) throw new Error(`${item.page.id}: export-back reference contract failed.`);
    const lint = lintDelta(item.page.elementor_data || [], saved.elementor_data || []); if (!lint.ok) throw new Error(`${item.page.id}: export-back lint failed.`); results.push({ id: item.page.id, kind: "reference", lint });
  }
  const latestKids = await apiFetch(`pages/${source.page.id}`);
  if (hash(latestKids.elementor_data || []) !== hash(kidsPage.elementor_data || []) || latestKids.title !== source.page.old_title || route(latestKids.url) !== route(source.page.old_path)) throw new Error("Kids page changed after preflight; refusing to overwrite it.");
  await apiFetch(`pages/${source.page.id}`, { method: "PUT", body: JSON.stringify({ title: source.page.title, slug: source.page.slug, canonical_url: `${expectedSite}${source.page.path}`, seo_title: source.page.seo_title, seo_description: source.page.seo_description, focus_keyword: source.page.focus_keyword, robots: ["index", "follow"], elementor_data: kidsBuild.after }) });
  const savedKids = await apiFetch(`pages/${source.page.id}`); writeJson(path.join(outputDir, "kids-1082.post-update.json"), savedKids);
  if (savedKids.title !== source.page.title || savedKids.status !== "publish" || route(savedKids.url) !== route(source.page.path) || route(savedKids.canonical_url) !== route(source.page.path) || Number(savedKids.parent_id) !== Number(kidsPage.parent_id)) throw new Error("Kids page identity or SEO export-back contract failed.");
  verifyPackages(savedKids.elementor_data || [], [kidsService(source)], false); const kidsLint = lintDelta(kidsPage.elementor_data || [], savedKids.elementor_data || []); if (!kidsLint.ok) throw new Error("Kids export-back lint failed."); results.push({ id: source.page.id, kind: "page", lint: kidsLint });
  const liveMenus = await apiFetch("menus"), liveMenu = (liveMenus.menus || []).find((menu) => Number(menu.id) === source.menu_id);
  if (hash(menuPayload(liveMenu.tree || [])) !== hash(menuPayload(menuBefore.tree || []))) throw new Error("Main Menu changed after preflight; refusing to overwrite it.");
  const livePrepared = prepareMenu(liveMenu, source), menuDryRun = await apiFetch("menus", { method: "POST", body: JSON.stringify({ menu_id: source.menu_id, mode: "replace", dry_run: true, items: livePrepared.items }) }); if (!menuDryRun.ok || !menuDryRun.dry_run) throw new Error("Main Menu dry run failed.");
  await apiFetch("menus", { method: "POST", body: JSON.stringify({ menu_id: source.menu_id, mode: "replace", dry_run: false, items: livePrepared.items }) });
  const menuAfter = (await apiFetch("menus")).menus.find((menu) => Number(menu.id) === source.menu_id); if (Number(menuAfter.count) !== Number(menuBefore.count)) throw new Error("Main Menu count changed unexpectedly."); const menuContract = verifyMenu(menuAfter, source); writeJson(path.join(outputDir, "main-menu.post-update.json"), menuAfter);
  const redirectSave = await apiFetch("rank-math/redirections", { method: "POST", body: JSON.stringify({ dry_run: false, redirections: [{ ...source.redirect, ignore_case: false }] }) }); if (!redirectSave.ok) throw new Error("Kids redirect save failed.");
  const redirectAfter = await apiFetch("rank-math/redirections"), redirectContract = verifyRedirect(redirectAfter, source); writeJson(path.join(outputDir, "redirects.post-update.json"), redirectAfter);
  const cache = await apiFetch("clear-cache", { method: "POST", body: "{}" }), postSnapshot = await apiFetch("site-snapshot?include_data=true"); writeJson(path.join(outputDir, "site-snapshot.post-apply.json"), postSnapshot);
  const postKids = postSnapshot.pages.find((page) => Number(page.id) === source.page.id); if (!postKids || postKids.title !== source.page.title || route(postKids.url) !== route(source.page.path)) throw new Error("Post-snapshot Kids identity failed."); verifyPackages(postKids.elementor_data || [], [kidsService(source)], false);
  const publicChecks = await publicCheck(source);
  writeJson(path.join(outputDir, "deployment-report.json"), { generated_at: new Date().toISOString(), operation: "rename-and-reprice-kids-mani-pedi", status, results, menu: { id: source.menu_id, count: menuAfter.count, contract: menuContract }, redirect: redirectContract, cache, public_checks: publicChecks });
  console.log(JSON.stringify({ ok: true, dry_run: false, page_id: source.page.id, title: source.page.title, path: source.page.path, packages: source.packages.length, reference_pages: relatedBuilds.length, menu_items: menuAfter.count, redirect: redirectContract, public_checks: 4, outputDir }, null, 2));
}

if (require.main === module) main().catch((error) => { console.error(error.stack || error.message); process.exit(1); });
