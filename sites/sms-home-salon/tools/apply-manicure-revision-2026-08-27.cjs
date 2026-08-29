const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { validateTemplate } = require("../../../src/validator/elementor-native-lint");

const root = path.resolve(__dirname, "../../..");
const categorySlug = process.env.NEB_TIMED_CATEGORY || "manicure";
const categoryContracts = {
  manicure: { hubId: 1379, services: 11, packages: 22 },
  pedicure: { hubId: 1380, services: 6, packages: 14 },
};
const categoryContract = categoryContracts[categorySlug];
if (!categoryContract) throw new Error(`Unsupported timed category: ${categorySlug}`);
const sourcePath = path.join(root, `sites/sms-home-salon/content/${categorySlug}-revision-2026-08-27.json`);
const fallbackSnapshotPath = path.join(root, `build/sites/sms-home-salon/${categorySlug}-revision-2026-08-27/site-snapshot.pre-update.json`);
const outputDir = path.join(root, `build/sites/sms-home-salon/${categorySlug}-revision-2026-08-27`);
const apply = process.argv.includes("--apply");
const baseUrl = String(process.env.NEB_SITE_URL || "").replace(/\/$/, "");
const apiKey = process.env.NEB_API_KEY;
const expectedBaseUrl = "https://homesalon.ae/wp-json/native-elementor/v1";
const expectedSite = "https://homesalon.ae";
const expectedBridge = "0.9.0";
let lastApiCallAt = 0;

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function hash(value) { return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function stableId(seed) { return crypto.createHash("md5").update(seed).digest("hex").slice(0, 7); }
function writeJson(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }
function decode(value) {
  return String(value || "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&#8217;|&rsquo;/gi, "'").replace(/\s+/g, " ").trim();
}
function route(value) { return new URL(value, expectedSite).pathname.replace(/\/$/, "") || "/"; }
function walk(value, visitor) {
  if (!value || typeof value !== "object") return;
  visitor(value);
  for (const child of Array.isArray(value) ? value : Object.values(value)) walk(child, visitor);
}
function directWidget(container, type) { return (container.elements || []).find((item) => item?.elType === "widget" && item.widgetType === type); }
function directHeadings(container) { return (container.elements || []).filter((item) => item?.elType === "widget" && item.widgetType === "heading"); }
function containsHeading(value, title) { let found = false; walk(value, (node) => { if (node?.widgetType === "heading" && decode(node.settings?.title) === title) found = true; }); return found; }
function collectIds(value) { const ids = new Set(); walk(value, (node) => { if (typeof node?.id === "string") ids.add(node.id); }); return ids; }
function refreshIds(value, seed, used = new Set()) {
  let index = 0;
  walk(value, (node) => {
    if (typeof node?.id !== "string") return;
    let attempt = 0, candidate;
    do { candidate = stableId(`${seed}:${index}:${attempt++}:${node.elType || "node"}:${node.widgetType || ""}`); } while (used.has(candidate));
    node.id = candidate; used.add(candidate); index += 1;
  });
}
function duplicateIds(elements) {
  const seen = new Set(), duplicates = new Set();
  walk(elements, (node) => { if (typeof node?.id !== "string") return; if (seen.has(node.id)) duplicates.add(node.id); seen.add(node.id); });
  return duplicates;
}
function assertNoNewDuplicateIds(before, after, label) {
  const inherited = duplicateIds(before), candidate = duplicateIds(after);
  const introduced = [...candidate].filter((id) => !inherited.has(id));
  if (introduced.length) throw new Error(`${label}: new duplicate Elementor IDs: ${introduced.slice(0, 5).join(", ")}`);
}
function lintDelta(before, after) {
  const baseline = validateTemplate({ elementor_data: before }), candidate = validateTemplate({ elementor_data: after });
  const signature = (issue) => `${issue.severity}|${issue.path}|${issue.message}`;
  const inherited = new Set(baseline.issues.map(signature));
  const newErrors = candidate.issues.filter((issue) => issue.severity === "error" && !inherited.has(signature(issue)));
  return { ok: newErrors.length === 0, new_errors: newErrors, inherited_errors: candidate.issues.filter((issue) => issue.severity === "error").length, warnings: candidate.issues.filter((issue) => issue.severity === "warning").length };
}
function packageGrid(elements, minimumCards = 1) {
  const section = (elements || []).find((item) => containsHeading(item, "Packages and Prices"));
  if (!section) throw new Error("Packages and Prices section was not found.");
  let best = null;
  walk(section, (node) => {
    if (node?.elType !== "container" || !Array.isArray(node.elements)) return;
    const cards = node.elements.filter((child) => child?.elType === "container" && directWidget(child, "heading") && directWidget(child, "text-editor") && directWidget(child, "button"));
    if (cards.length >= minimumCards && (!best || cards.length > best.cards.length)) best = { container: node, cards };
  });
  if (!best) throw new Error("Package card grid structure was not recognised.");
  return best;
}
function badgeChild(card) { return (card.elements || []).find((child) => child?.elType === "container" && containsHeading(child, "Most Popular")); }
function removeBadge(card) { const badge = badgeChild(card); card.elements = (card.elements || []).filter((child) => child !== badge); return badge; }
function metricRow(card) {
  let found = null;
  walk(card, (node) => {
    if (found || node?.elType !== "container" || !Array.isArray(node.elements)) return;
    const boxes = node.elements.filter((child) => child?.elType === "container" && directHeadings(child).length === 2);
    if (boxes.length >= 2) found = { row: node, boxes };
  });
  if (!found) throw new Error("Package metric row was not found.");
  return found;
}
function descriptionFor(service, item) {
  if (service.name === "Classic Manicure") return `${item.name} classic manicure delivered at your location.`;
  if (service.name === "Acrylic Nail") return `${item.name} service completed by a professional nail technician.`;
  if (service.name === "Builder Gel Nails") return `${item.name} service for a neat, durable finish.`;
  return `${item.name} service delivered at your preferred location.`;
}
function setTimedCard(card, service, item, linked) {
  const title = directWidget(card, "heading"), description = directWidget(card, "text-editor"), button = directWidget(card, "button");
  if (!title || !description || !button) throw new Error(`${service.name}: package card structure changed.`);
  title.settings.title = item.name;
  title.settings.link = linked ? { ...(title.settings.link || {}), url: service.path, is_external: false, nofollow: false } : { ...(title.settings.link || {}), url: "" };
  description.settings.editor = `<p>${descriptionFor(service, item)}</p>`;
  const { row, boxes } = metricRow(card);
  const priceBox = boxes.find((box) => directHeadings(box).some((heading) => decode(heading.settings?.title) === "Price")) || boxes[boxes.length - 1];
  const durationBox = boxes.find((box) => box !== priceBox && directHeadings(box).some((heading) => decode(heading.settings?.title) === "Duration")) || boxes.find((box) => box !== priceBox);
  if (!durationBox || durationBox === priceBox) throw new Error(`${service.name}/${item.name}: distinct Duration and Price boxes were not found.`);
  const durationHeadings = directHeadings(durationBox), priceHeadings = directHeadings(priceBox);
  durationHeadings[0].settings.title = "Duration";
  durationHeadings[1].settings.title = `${item.duration} min`;
  priceHeadings[0].settings.title = "Price";
  priceHeadings[1].settings.title = item.price;
  row.settings.flex_direction = "row";
  row.settings.flex_direction_tablet = "row";
  row.settings.flex_direction_mobile = "row";
  row.settings.flex_wrap = "nowrap";
  row.settings.flex_wrap_tablet = "nowrap";
  row.settings.flex_wrap_mobile = "nowrap";
  row.settings.flex_justify_content = "space-between";
  row.settings.flex_justify_content_tablet = "space-between";
  row.settings.flex_justify_content_mobile = "space-between";
  for (const box of [durationBox, priceBox]) {
    box.settings.width = { unit: "%", size: 47, sizes: [] };
    box.settings.width_tablet = { unit: "%", size: 47, sizes: [] };
    box.settings.width_mobile = { unit: "%", size: 47, sizes: [] };
    box.settings.padding_mobile = { unit: "px", top: "11", right: "8", bottom: "11", left: "8", isLinked: false };
  }
  row.elements = [durationBox, priceBox];
  button.settings.text = linked ? "Book This Service" : `Book ${service.name}`;
  button.settings._attributes = `data-service|${item.name}\ndata-cta|Book ${service.name}`;
}
function flattenPackages(source) { return source.services.flatMap((service) => service.packages.map((item) => ({ service, item }))); }
function buildHub(page, source) {
  const before = page.elementor_data || [], after = clone(before);
  const { container, cards } = packageGrid(after, source.services.length);
  const template = cards[0], badge = cards.map(badgeChild).find(Boolean);
  if (!template || !badge) throw new Error("Manicure hub package templates were not found.");
  container.elements = [];
  const usedIds = collectIds(after);
  container.elements = flattenPackages(source).map(({ service, item }, index) => {
    const card = clone(template);
    removeBadge(card);
    setTimedCard(card, service, item, true);
    if (index === 0) card.elements.unshift(clone(badge));
    refreshIds(card, `manicure-hub:${service.id}:${index}:${item.name}`, usedIds);
    return card;
  });
  assertNoNewDuplicateIds(before, after, `${categorySlug} hub`);
  const lint = lintDelta(before, after);
  if (!lint.ok) throw new Error(`${categorySlug} hub candidate introduced native lint errors.`);
  return { before, after, lint };
}
function buildDetail(page, service) {
  const before = page.elementor_data || [], after = clone(before);
  const { container, cards } = packageGrid(after, 1);
  const template = cards[0], badge = cards.map(badgeChild).find(Boolean);
  if (!template || !badge) throw new Error(`${service.name}: card or badge template was not found.`);
  container.elements = [];
  const usedIds = collectIds(after);
  container.elements = service.packages.map((item, index) => {
    const card = clone(template);
    removeBadge(card);
    setTimedCard(card, service, item, false);
    if (index === 0) card.elements.unshift(clone(badge));
    refreshIds(card, `${service.id}:${index}:${item.name}`, usedIds);
    return card;
  });
  assertNoNewDuplicateIds(before, after, service.name);
  const lint = lintDelta(before, after);
  if (!lint.ok) throw new Error(`${service.name}: candidate introduced native lint errors.`);
  return { before, after, lint };
}
function cardValues(card) { const values = []; walk(card, (node) => { if (node?.widgetType === "heading") values.push(decode(node.settings?.title)); }); return values; }
function verifyPackages(elements, services, hub) {
  const expected = services.flatMap((service) => service.packages.map((item) => ({ service, item })));
  const { cards } = packageGrid(elements, expected.length);
  if (cards.length !== expected.length) throw new Error(`Expected ${expected.length} cards, found ${cards.length}.`);
  cards.forEach((card, index) => {
    const { service, item } = expected[index], values = cardValues(card);
    for (const value of [item.name, "Duration", `${item.duration} min`, "Price", item.price]) if (!values.includes(value)) throw new Error(`${service.name}/${item.name}: missing ${value}.`);
    for (const forbidden of ["Package", "From"]) if (values.includes(forbidden)) throw new Error(`${service.name}/${item.name}: forbidden ${forbidden} field remains.`);
    const link = route(directWidget(card, "heading")?.settings?.link?.url || "/");
    if (hub && link !== route(service.path)) throw new Error(`${item.name}: hub link mismatch.`);
  });
  const featured = cards.filter((card) => containsHeading(card, "Most Popular"));
  if (featured.length !== 1 || !cardValues(featured[0]).includes(expected[0].item.name)) throw new Error("First package must be the sole Most Popular card.");
  return expected.map(({ service, item }) => ({ service_id: service.id, package: item.name, duration: item.duration, price: item.price }));
}
function menuPayload(tree) {
  return (tree || []).map((item) => ({ label: item.title, page_id: Number(item.object_id), type: item.type, object: item.object, source_key: item.source_key || undefined, target: item.target || "", attr_title: item.attr_title || "", description: item.description || "", classes: item.classes || [], xfn: item.xfn || "", ...(item.children?.length ? { children: menuPayload(item.children) } : {}) }));
}
function findMenuItem(tree, objectId) { let found = null; walk(tree, (item) => { if (Number(item?.object_id) === Number(objectId)) found = item; }); return found; }
function prepareMenu(menu, source) {
  if (!menu || Number(menu.id) !== source.menu_id || menu.slug !== "main-menu" || !(menu.locations || []).includes("menu-1")) throw new Error("Unexpected Main Menu identity.");
  const tree = clone(menu.tree || []), branch = findMenuItem(tree, source.hub.id);
  if (!branch) throw new Error(`${categorySlug} menu branch was not found.`);
  const pool = new Map((branch.children || []).map((item) => [Number(item.object_id), item]));
  branch.children = source.services.map((service) => {
    const item = pool.get(service.id);
    if (!item) throw new Error(`${service.name}: menu item missing.`);
    item.title = service.menu_name || service.name;
    return item;
  });
  const sourceKeys = new Set(), objectIds = new Set();
  walk(tree, (item) => { if (!item?.source_key) return; if (sourceKeys.has(item.source_key)) throw new Error(`Duplicate menu source key: ${item.source_key}`); sourceKeys.add(item.source_key); if (objectIds.has(Number(item.object_id))) throw new Error(`Duplicate menu page: ${item.object_id}`); objectIds.add(Number(item.object_id)); });
  return { tree, items: menuPayload(tree) };
}
function verifyMenu(menu, source) {
  const branch = findMenuItem(menu.tree, source.hub.id), actual = (branch?.children || []).map((item) => Number(item.object_id)), expected = source.services.map((item) => item.id);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${categorySlug} menu contract failed.`);
  return actual;
}
function validateSource(source) {
  if (source.site !== expectedSite || source.menu_id !== 12 || source.hub?.id !== categoryContract.hubId || source.services?.length !== categoryContract.services) throw new Error(`Unexpected ${categorySlug} revision source target.`);
  const packages = flattenPackages(source);
  if (packages.length !== categoryContract.packages) throw new Error(`Expected ${categoryContract.packages} packages, found ${packages.length}.`);
  const ids = new Set(), paths = new Set();
  for (const service of source.services) {
    if (ids.has(service.id) || paths.has(route(service.path))) throw new Error(`${service.name}: duplicate page identity.`);
    ids.add(service.id); paths.add(route(service.path));
    for (const item of service.packages) if (![10, 30, 40, 45, 60, 90, 120].includes(item.duration) || !/^AED \d+$/.test(item.price)) throw new Error(`${service.name}/${item.name}: invalid duration or price.`);
  }
}
async function apiFetch(endpoint, options = {}, attempt = 1) {
  try {
    const throttle = Math.max(0, 4500 - (Date.now() - lastApiCallAt));
    if (throttle) await new Promise((resolve) => setTimeout(resolve, throttle));
    lastApiCallAt = Date.now();
    const response = await fetch(`${baseUrl}/${endpoint.replace(/^\//, "")}`, { ...options, signal: AbortSignal.timeout(90000), headers: { "X-API-Key": apiKey, "Content-Type": "application/json", ...(options.headers || {}) } });
    const text = await response.text(); let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    if (!response.ok) throw new Error(`${endpoint} failed with ${response.status}: ${JSON.stringify(data).slice(0, 1500)}`);
    return data;
  } catch (error) {
    if (attempt >= 3) throw error;
    await new Promise((resolve) => setTimeout(resolve, /failed with 403/.test(error.message) ? attempt * 60000 : attempt * 5000));
    return apiFetch(endpoint, options, attempt + 1);
  }
}
async function verifyPublic(source) {
  const results = [];
  for (const service of source.services) {
    const response = await fetch(`${expectedSite}${service.path}?${categorySlug}_verify=${Date.now()}`, { headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(60000) });
    const html = await response.text(), text = decode(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " "));
    const missing = service.packages.flatMap((item) => [item.name, `${item.duration} min`, item.price]).filter((value) => !text.includes(value));
    if (!response.ok || missing.length) throw new Error(`${service.name}: public verification failed (${response.status}; ${missing.join(" | ")}).`);
    results.push({ id: service.id, path: service.path, status: response.status });
    await new Promise((resolve) => setTimeout(resolve, 1800));
  }
  const response = await fetch(`${expectedSite}${source.hub.path}?hub_verify=${Date.now()}`, { headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(60000) });
  const html = await response.text();
  const missing = flattenPackages(source).flatMap(({ service, item }) => [item.name, service.path, `${item.duration} min`, item.price]).filter((value) => !html.includes(value));
  if (!response.ok || missing.length) throw new Error(`${categorySlug} hub: public verification failed (${response.status}; ${missing.join(" | ")}).`);
  results.push({ label: `${categorySlug} hub`, path: source.hub.path, status: response.status });
  return results;
}
async function main() {
  const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  validateSource(source); fs.mkdirSync(outputDir, { recursive: true });
  let status = null, snapshot;
  if (apply) {
    if (!baseUrl || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required with --apply.");
    status = await apiFetch("status");
    if (baseUrl !== expectedBaseUrl || status.site_url !== expectedSite || status.bridge_version !== expectedBridge) throw new Error("Unexpected production bridge target.");
    snapshot = await apiFetch("site-snapshot?include_data=true");
  } else snapshot = JSON.parse(fs.readFileSync(fallbackSnapshotPath, "utf8"));
  if (!snapshot.ok || !snapshot.include_data || snapshot.status?.site_url !== expectedSite) throw new Error("Production snapshot is incomplete or targets the wrong site.");
  writeJson(path.join(outputDir, apply ? "site-snapshot.pre-apply.json" : "site-snapshot.local-baseline.json"), snapshot);
  const pages = new Map(snapshot.pages.map((page) => [Number(page.id), page])), hubPage = pages.get(source.hub.id);
  if (!hubPage || hubPage.status !== "publish" || route(hubPage.url) !== route(source.hub.path)) throw new Error(`${categorySlug} hub identity mismatch.`);
  for (const service of source.services) { const page = pages.get(service.id); if (!page || page.status !== "publish" || route(page.url) !== route(service.path)) throw new Error(`${service.name}: page identity mismatch.`); }
  const hubBuild = buildHub(hubPage, source), detailBuilds = source.services.map((service) => ({ service, page: pages.get(service.id), build: buildDetail(pages.get(service.id), service) }));
  const hubContract = verifyPackages(hubBuild.after, source.services, true);
  for (const item of detailBuilds) verifyPackages(item.build.after, [item.service], false);
  const menuBefore = snapshot.menus.find((menu) => Number(menu.id) === source.menu_id), menuPrepared = prepareMenu(menuBefore, source), menuContract = verifyMenu({ tree: menuPrepared.tree }, source);
  writeJson(path.join(outputDir, `${categorySlug}-hub.candidate.elementor.json`), hubBuild.after);
  for (const item of detailBuilds) writeJson(path.join(outputDir, `detail-${item.service.id}.candidate.json`), item.build.after);
  writeJson(path.join(outputDir, "preflight-report.json"), { generated_at: new Date().toISOString(), dry_run: !apply, status, hub: { id: source.hub.id, lint: hubBuild.lint, packages: hubContract }, details: detailBuilds.map((item) => ({ id: item.service.id, lint: item.build.lint, packages: item.service.packages })), menu: menuContract });
  if (!apply) { console.log(JSON.stringify({ ok: true, dry_run: true, hub_cards: hubContract.length, detail_pages: detailBuilds.length, detail_cards: flattenPackages(source).length, menu_items: menuBefore.count, new_lint_errors: 0, outputDir }, null, 2)); return; }
  const writes = [...detailBuilds.map((item) => ({ id: item.service.id, before: item.page, body: { elementor_data: item.build.after }, kind: "detail", service: item.service })), { id: source.hub.id, before: hubPage, body: { elementor_data: hubBuild.after }, kind: "hub" }];
  const results = [];
  for (const item of writes) {
    const latest = await apiFetch(`pages/${item.id}`);
    if (hash(latest.elementor_data || []) !== hash(item.before.elementor_data || []) || latest.status !== "publish" || route(latest.url) !== route(item.before.url)) throw new Error(`${item.id}: live page changed after preflight; refusing to overwrite it.`);
    await apiFetch(`pages/${item.id}`, { method: "PUT", body: JSON.stringify(item.body) });
    const saved = await apiFetch(`pages/${item.id}`); writeJson(path.join(outputDir, `${item.kind}-${item.id}.post-update.json`), saved);
    if (saved.status !== "publish" || route(saved.url) !== route(item.before.url) || Number(saved.parent_id) !== Number(item.before.parent_id)) throw new Error(`${item.id}: URL, status or parent changed unexpectedly.`);
    verifyPackages(saved.elementor_data || [], item.kind === "hub" ? source.services : [item.service], item.kind === "hub");
    const lint = lintDelta(item.before.elementor_data || [], saved.elementor_data || []); if (!lint.ok) throw new Error(`${item.id}: export-back lint failed.`);
    results.push({ id: item.id, kind: item.kind, url: saved.url, lint });
  }
  const menuInventory = await apiFetch("menus"), liveMenu = (menuInventory.menus || []).find((menu) => Number(menu.id) === source.menu_id);
  if (hash(menuPayload(liveMenu.tree || [])) !== hash(menuPayload(menuBefore.tree || []))) throw new Error("Main Menu changed after preflight; refusing to overwrite it.");
  const livePrepared = prepareMenu(liveMenu, source), menuDryRun = await apiFetch("menus", { method: "POST", body: JSON.stringify({ menu_id: source.menu_id, mode: "replace", dry_run: true, items: livePrepared.items }) });
  if (!menuDryRun.ok || !menuDryRun.dry_run) throw new Error("Main Menu dry run failed.");
  await apiFetch("menus", { method: "POST", body: JSON.stringify({ menu_id: source.menu_id, mode: "replace", dry_run: false, items: livePrepared.items }) });
  const afterMenus = await apiFetch("menus"), menuAfter = (afterMenus.menus || []).find((menu) => Number(menu.id) === source.menu_id), savedMenuContract = verifyMenu(menuAfter, source);
  if (Number(menuAfter.count) !== Number(menuBefore.count)) throw new Error("Main Menu count changed unexpectedly.");
  writeJson(path.join(outputDir, "main-menu.post-update.json"), menuAfter);
  const cache = await apiFetch("clear-cache", { method: "POST", body: "{}" }), postSnapshot = await apiFetch("site-snapshot?include_data=true");
  writeJson(path.join(outputDir, "site-snapshot.post-apply.json"), postSnapshot);
  const postPages = new Map(postSnapshot.pages.map((page) => [Number(page.id), page]));
  verifyPackages(postPages.get(source.hub.id).elementor_data || [], source.services, true);
  for (const service of source.services) verifyPackages(postPages.get(service.id).elementor_data || [], [service], false);
  const publicChecks = await verifyPublic(source);
  writeJson(path.join(outputDir, "deployment-report.json"), { generated_at: new Date().toISOString(), operation: `reconcile-${categorySlug}-services`, status, results, menu: { id: source.menu_id, count: menuAfter.count, contract: savedMenuContract }, cache, public_checks: publicChecks });
  console.log(JSON.stringify({ ok: true, dry_run: false, hub_cards: hubContract.length, detail_pages: detailBuilds.length, detail_cards: flattenPackages(source).length, menu_items: menuAfter.count, public_checks: publicChecks.length, outputDir }, null, 2));
}

module.exports = { main, buildHub, buildDetail, verifyPackages, prepareMenu, verifyMenu };
if (require.main === module) main().catch((error) => { console.error(error.stack || error.message); process.exit(1); });
