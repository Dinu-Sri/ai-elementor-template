const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { validateTemplate } = require("../../../src/validator/elementor-native-lint");

const root = path.resolve(__dirname, "../../..");
const sourcePath = path.join(root, "sites/sms-home-salon/content/bleach-scrub-revision-2026-08-27.json");
const fallbackSnapshotPath = path.join(root, "build/sites/sms-home-salon/bleach-scrub-revision-2026-08-27/site-snapshot.pre-update.json");
const supplementalPagePath = path.join(root, "build/sites/sms-home-salon/bleach-scrub-revision-2026-08-27/page-1164.pre-update.json");
const outputDir = path.join(root, "build/sites/sms-home-salon/bleach-scrub-revision-2026-08-27");
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
function decode(value) {
  return String(value || "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#0*39;|&apos;/gi, "'").replace(/&#8217;|&rsquo;/gi, "'").replace(/\s+/g, " ").trim();
}
function route(value) { return new URL(value, expectedSite).pathname.replace(/\/$/, "") || "/"; }
function walk(value, visitor) { if (!value || typeof value !== "object") return; visitor(value); for (const child of Array.isArray(value) ? value : Object.values(value)) walk(child, visitor); }
function directWidget(container, type) { return (container.elements || []).find((item) => item?.elType === "widget" && item.widgetType === type); }
function directHeadings(container) { return (container.elements || []).filter((item) => item?.elType === "widget" && item.widgetType === "heading"); }
function containsHeading(value, title) { let found = false; walk(value, (node) => { if (node?.widgetType === "heading" && decode(node.settings?.title) === title) found = true; }); return found; }
function assertUniqueIds(elements, label) {
  const seen = new Set(), duplicates = [];
  walk(elements, (node) => { if (typeof node?.id !== "string") return; if (seen.has(node.id)) duplicates.push(node.id); seen.add(node.id); });
  if (duplicates.length) throw new Error(`${label}: duplicate Elementor IDs: ${duplicates.slice(0, 5).join(", ")}`);
}
function lintDelta(before, after) {
  const baseline = validateTemplate({ elementor_data: before });
  const candidate = validateTemplate({ elementor_data: after });
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
function removeBadge(card) { card.elements = (card.elements || []).filter((child) => child !== badgeChild(card)); }
function metricRow(card) {
  let found = null;
  walk(card, (node) => {
    if (found || node?.elType !== "container" || !Array.isArray(node.elements)) return;
    const boxes = node.elements.filter((child) => child?.elType === "container" && directHeadings(child).length === 2);
    if (boxes.length >= 2) found = { row: node, boxes };
  });
  if (!found) throw new Error("Package duration/price row was not found.");
  return found;
}
function setTimedCard(card, service, linked) {
  const title = directWidget(card, "heading"), description = directWidget(card, "text-editor"), button = directWidget(card, "button");
  if (!title || !description || !button) throw new Error(`${service.name}: package card structure changed.`);
  title.settings.title = service.name;
  if (linked) title.settings.link = { ...(title.settings.link || {}), url: service.path, is_external: false, nofollow: false };
  description.settings.editor = `<p>${service.name} delivered at home with a clean professional setup.${service.note ? ` ${service.note}.` : ""}</p>`;
  const { row, boxes } = metricRow(card);
  const priceBox = boxes.find((box) => directHeadings(box).some((heading) => decode(heading.settings?.title) === "Price")) || boxes[boxes.length - 1];
  const durationBox = boxes.find((box) => box !== priceBox);
  const durationHeadings = directHeadings(durationBox), priceHeadings = directHeadings(priceBox);
  durationHeadings[0].settings.title = "Duration";
  durationHeadings[1].settings.title = `${service.duration} min`;
  priceHeadings[0].settings.title = "Price";
  priceHeadings[1].settings.title = service.price;
  durationBox.settings.width = { unit: "%", size: 47, sizes: [] };
  durationBox.settings.width_tablet = { unit: "%", size: 48, sizes: [] };
  durationBox.settings.width_mobile = { unit: "%", size: 100, sizes: [] };
  priceBox.settings.width = { unit: "%", size: 48, sizes: [] };
  priceBox.settings.width_tablet = { unit: "%", size: 48, sizes: [] };
  priceBox.settings.width_mobile = { unit: "%", size: 100, sizes: [] };
  row.elements = [durationBox, priceBox];
  button.settings.text = linked ? "Book This Service" : `Book ${service.menu_name || service.name}`;
  button.settings._attributes = `data-service|${service.name}\ndata-cta|Book ${service.menu_name || service.name}`;
}
function buildHub(page, category) {
  const before = page.elementor_data || [], after = clone(before);
  const { container, cards } = packageGrid(after, category.services.length);
  const byPath = new Map(cards.map((card) => [route(directWidget(card, "heading")?.settings?.link?.url || "/"), card]));
  const badge = cards.map(badgeChild).find(Boolean);
  if (!badge) throw new Error(`${category.name}: Most Popular badge template was not found.`);
  container.elements = category.services.map((service, index) => {
    const card = byPath.get(route(service.path));
    if (!card) throw new Error(`${service.name}: hub card was not found.`);
    removeBadge(card);
    setTimedCard(card, service, true);
    if (index === 0) card.elements.unshift(badge);
    return card;
  });
  assertUniqueIds(after, `${category.name} hub`);
  const lint = lintDelta(before, after);
  if (!lint.ok) throw new Error(`${category.name} hub introduced native lint errors.`);
  return { before, after, lint };
}
function buildDetail(page, service) {
  const before = page.elementor_data || [], after = clone(before);
  const { cards } = packageGrid(after, 1);
  if (cards.length !== 1) throw new Error(`${service.name}: expected one package card.`);
  setTimedCard(cards[0], service, false);
  assertUniqueIds(after, service.name);
  const lint = lintDelta(before, after);
  if (!lint.ok) throw new Error(`${service.name}: candidate introduced native lint errors.`);
  return { before, after, lint };
}
function cardValues(card) { const values = []; walk(card, (node) => { if (node?.widgetType === "heading") values.push(decode(node.settings?.title)); }); return values; }
function verifyCategory(elements, category, hub) {
  const { cards } = packageGrid(elements, category.services.length);
  if (cards.length !== category.services.length) throw new Error(`${category.name}: expected ${category.services.length} cards, found ${cards.length}.`);
  cards.forEach((card, index) => {
    const service = category.services[index], values = cardValues(card);
    for (const expected of [service.name, "Duration", `${service.duration} min`, "Price", service.price]) if (!values.includes(expected)) throw new Error(`${service.name}: missing ${expected}.`);
    for (const forbidden of ["Package", "From"]) if (values.includes(forbidden)) throw new Error(`${service.name}: forbidden ${forbidden} remains.`);
    if (values.filter((value) => value === "Duration").length !== 1 || values.filter((value) => value === "Price").length !== 1) throw new Error(`${service.name}: duration/price label contract failed.`);
    if (hub && route(directWidget(card, "heading")?.settings?.link?.url || "/") !== route(service.path)) throw new Error(`${service.name}: hub link mismatch.`);
    if (service.note && !JSON.stringify(card).includes(service.note)) throw new Error(`${service.name}: note is missing.`);
  });
  const featured = cards.filter((card) => containsHeading(card, "Most Popular"));
  if (featured.length !== 1 || !cardValues(featured[0]).includes(category.services[0].name)) throw new Error(`${category.name}: first package must be the sole Most Popular card.`);
  return category.services.map((service) => ({ id: service.id, name: service.name, path: service.path, duration: service.duration, price: service.price }));
}
function menuPayload(tree) {
  return (tree || []).map((item) => ({ label: item.title, page_id: Number(item.object_id), type: item.type, object: item.object, source_key: item.source_key || undefined, target: item.target || "", attr_title: item.attr_title || "", description: item.description || "", classes: item.classes || [], xfn: item.xfn || "", ...(item.children?.length ? { children: menuPayload(item.children) } : {}) }));
}
function findMenuItem(tree, objectId) { let found = null; walk(tree, (item) => { if (Number(item?.object_id) === Number(objectId)) found = item; }); return found; }
function prepareMenu(menu, source) {
  if (!menu || Number(menu.id) !== source.menu_id || menu.slug !== "main-menu" || !(menu.locations || []).includes("menu-1")) throw new Error("Unexpected Main Menu identity.");
  const tree = clone(menu.tree || []);
  const branches = source.categories.map((category) => findMenuItem(tree, category.hub_id));
  if (branches.some((branch) => !branch)) throw new Error("Bleach or Scrub menu branch was not found.");
  const pool = new Map(branches.flatMap((branch) => branch.children || []).map((item) => [Number(item.object_id), item]));
  source.categories.forEach((category, index) => {
    branches[index].children = category.services.map((service) => {
      const item = pool.get(service.id);
      if (!item) throw new Error(`${service.name}: menu item missing.`);
      if (service.menu_name) item.title = service.menu_name;
      return item;
    });
  });
  const sourceKeys = new Set(), objectIds = new Set();
  walk(tree, (item) => { if (!item?.source_key) return; if (sourceKeys.has(item.source_key)) throw new Error(`Duplicate menu source key: ${item.source_key}`); sourceKeys.add(item.source_key); if (objectIds.has(Number(item.object_id))) throw new Error(`Duplicate menu page: ${item.object_id}`); objectIds.add(Number(item.object_id)); });
  return { tree, items: menuPayload(tree) };
}
function verifyMenu(menu, source) {
  const contract = {};
  for (const category of source.categories) {
    const branch = findMenuItem(menu.tree, category.hub_id);
    const actual = (branch?.children || []).map((item) => Number(item.object_id));
    const expected = category.services.map((item) => item.id);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${category.name} menu contract failed.`);
    contract[category.name.toLowerCase()] = actual;
  }
  return contract;
}
function validateSource(source) {
  if (source.site !== expectedSite || source.menu_id !== 12 || source.categories.length !== 2) throw new Error("Unexpected revision source target.");
  const bleach = source.categories.find((item) => item.name === "Bleach"), scrub = source.categories.find((item) => item.name === "Scrub");
  if (bleach?.hub_id !== 1377 || bleach.services.length !== 3 || scrub?.hub_id !== 1378 || scrub.services.length !== 5) throw new Error("Expected three Bleach and five Scrub services.");
  for (const service of source.categories.flatMap((item) => item.services)) if (![30, 45, 60, 90, 120].includes(service.duration) || !/^AED \d+$/.test(service.price)) throw new Error(`${service.name}: invalid duration or price.`);
}
async function apiFetch(endpoint, options = {}, attempt = 1) {
  try {
    const throttle = Math.max(0, 4500 - (Date.now() - lastApiCallAt));
    if (throttle) await new Promise((resolve) => setTimeout(resolve, throttle));
    lastApiCallAt = Date.now();
    const response = await fetch(`${baseUrl}/${endpoint.replace(/^\//, "")}`, { ...options, signal: AbortSignal.timeout(90000), headers: { "X-API-Key": apiKey, "Content-Type": "application/json", ...(options.headers || {}) } });
    const text = await response.text();
    let data; try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
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
  for (const category of source.categories) {
    for (const service of category.services) {
      const response = await fetch(`${expectedSite}${service.path}?bleach_scrub_verify=${Date.now()}`, { headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(60000) });
      const html = await response.text(), text = decode(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " "));
      const missing = [service.name, `${service.duration} min`, service.price].filter((value) => !text.includes(value));
      if (!response.ok || missing.length) throw new Error(`${service.name}: public verification failed (${response.status}; ${missing.join(" | ")}).`);
      results.push({ id: service.id, path: service.path, status: response.status });
      await new Promise((resolve) => setTimeout(resolve, 1800));
    }
    const response = await fetch(`${expectedSite}${category.path}?hub_verify=${Date.now()}`, { headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(60000) });
    const html = await response.text();
    const missing = category.services.flatMap((service) => [service.name, service.path, `${service.duration} min`, service.price]).filter((value) => !html.includes(value));
    if (!response.ok || missing.length) throw new Error(`${category.name} hub: public verification failed (${response.status}; ${missing.join(" | ")}).`);
    results.push({ label: `${category.name} hub`, path: category.path, status: response.status });
  }
  return results;
}
async function main() {
  const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  validateSource(source);
  fs.mkdirSync(outputDir, { recursive: true });
  let status = null, snapshot, supplemental;
  if (apply) {
    if (!baseUrl || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required with --apply.");
    status = await apiFetch("status");
    if (baseUrl !== expectedBaseUrl || status.site_url !== expectedSite || status.bridge_version !== expectedBridge) throw new Error("Unexpected production bridge target.");
    snapshot = await apiFetch("site-snapshot?include_data=true");
    supplemental = await apiFetch("pages/1164");
    writeJson(path.join(outputDir, "page-1164.pre-apply.json"), supplemental);
  } else {
    snapshot = JSON.parse(fs.readFileSync(fallbackSnapshotPath, "utf8"));
    supplemental = JSON.parse(fs.readFileSync(supplementalPagePath, "utf8"));
  }
  if (!snapshot.ok || !snapshot.include_data || snapshot.status?.site_url !== expectedSite) throw new Error("Production snapshot is incomplete or targets the wrong site.");
  writeJson(path.join(outputDir, apply ? "site-snapshot.pre-apply.json" : "site-snapshot.local-baseline.json"), snapshot);
  const pages = new Map(snapshot.pages.map((page) => [Number(page.id), page]));
  pages.set(1164, supplemental);
  for (const category of source.categories) {
    const hub = pages.get(category.hub_id);
    if (!hub || hub.status !== "publish" || route(hub.url) !== route(category.path)) throw new Error(`${category.name} hub identity mismatch.`);
    for (const service of category.services) {
      const page = pages.get(service.id);
      if (!page || page.status !== "publish" || route(page.url) !== route(service.path)) throw new Error(`${service.name}: page identity mismatch.`);
    }
  }
  const hubBuilds = source.categories.map((category) => ({ category, page: pages.get(category.hub_id), build: buildHub(pages.get(category.hub_id), category) }));
  const detailBuilds = source.categories.flatMap((category) => category.services.map((service) => ({ category, service, page: pages.get(service.id), build: buildDetail(pages.get(service.id), service) })));
  const hubContracts = hubBuilds.map((item) => verifyCategory(item.build.after, item.category, true));
  for (const item of detailBuilds) verifyCategory(item.build.after, { name: item.service.name, services: [item.service] }, false);
  const menuBefore = snapshot.menus.find((menu) => Number(menu.id) === source.menu_id);
  const menuPrepared = prepareMenu(menuBefore, source), menuContract = verifyMenu({ tree: menuPrepared.tree }, source);
  for (const item of hubBuilds) writeJson(path.join(outputDir, `${item.category.name.toLowerCase()}-hub.candidate.elementor.json`), item.build.after);
  for (const item of detailBuilds) writeJson(path.join(outputDir, `detail-${item.service.id}.candidate.json`), item.build.after);
  writeJson(path.join(outputDir, "preflight-report.json"), { generated_at: new Date().toISOString(), dry_run: !apply, status, hubs: hubBuilds.map((item, index) => ({ id: item.category.hub_id, lint: item.build.lint, packages: hubContracts[index] })), details: detailBuilds.map((item) => ({ id: item.service.id, lint: item.build.lint, duration: item.service.duration, price: item.service.price })), menu: menuContract });
  if (!apply) {
    console.log(JSON.stringify({ ok: true, dry_run: true, bleach_cards: source.categories[0].services.length, scrub_cards: source.categories[1].services.length, detail_pages: detailBuilds.length, menu_items: menuBefore.count, new_lint_errors: 0, outputDir }, null, 2));
    return;
  }
  const writes = [...detailBuilds.map((item) => ({ id: item.service.id, before: item.page, body: { elementor_data: item.build.after }, kind: "detail", category: item.category, service: item.service })), ...hubBuilds.map((item) => ({ id: item.category.hub_id, before: item.page, body: { elementor_data: item.build.after }, kind: "hub", category: item.category }))];
  const results = [];
  for (const item of writes) {
    const latest = await apiFetch(`pages/${item.id}`);
    if (hash(latest.elementor_data || []) !== hash(item.before.elementor_data || []) || latest.status !== "publish" || route(latest.url) !== route(item.before.url)) throw new Error(`${item.id}: live page changed after preflight; refusing to overwrite it.`);
    await apiFetch(`pages/${item.id}`, { method: "PUT", body: JSON.stringify(item.body) });
    const saved = await apiFetch(`pages/${item.id}`);
    writeJson(path.join(outputDir, `${item.kind}-${item.id}.post-update.json`), saved);
    if (saved.status !== "publish" || route(saved.url) !== route(item.before.url) || Number(saved.parent_id) !== Number(item.before.parent_id)) throw new Error(`${item.id}: URL, status or parent changed unexpectedly.`);
    verifyCategory(saved.elementor_data || [], item.kind === "hub" ? item.category : { name: item.service.name, services: [item.service] }, item.kind === "hub");
    const lint = lintDelta(item.before.elementor_data || [], saved.elementor_data || []);
    if (!lint.ok) throw new Error(`${item.id}: export-back lint failed.`);
    results.push({ id: item.id, kind: item.kind, url: saved.url, lint });
  }
  const menuInventory = await apiFetch("menus"), liveMenu = (menuInventory.menus || []).find((menu) => Number(menu.id) === source.menu_id);
  if (hash(menuPayload(liveMenu.tree || [])) !== hash(menuPayload(menuBefore.tree || []))) throw new Error("Main Menu changed after preflight; refusing to overwrite it.");
  const livePrepared = prepareMenu(liveMenu, source);
  const menuDryRun = await apiFetch("menus", { method: "POST", body: JSON.stringify({ menu_id: source.menu_id, mode: "replace", dry_run: true, items: livePrepared.items }) });
  if (!menuDryRun.ok || !menuDryRun.dry_run) throw new Error("Main Menu dry run failed.");
  await apiFetch("menus", { method: "POST", body: JSON.stringify({ menu_id: source.menu_id, mode: "replace", dry_run: false, items: livePrepared.items }) });
  const afterMenus = await apiFetch("menus"), menuAfter = (afterMenus.menus || []).find((menu) => Number(menu.id) === source.menu_id), savedMenuContract = verifyMenu(menuAfter, source);
  if (Number(menuAfter.count) !== Number(menuBefore.count)) throw new Error("Main Menu count changed unexpectedly.");
  writeJson(path.join(outputDir, "main-menu.post-update.json"), menuAfter);
  const cache = await apiFetch("clear-cache", { method: "POST", body: "{}" });
  const postSnapshot = await apiFetch("site-snapshot?include_data=true"), postSupplemental = await apiFetch("pages/1164");
  writeJson(path.join(outputDir, "site-snapshot.post-apply.json"), postSnapshot);
  writeJson(path.join(outputDir, "page-1164.post-apply.json"), postSupplemental);
  const postPages = new Map(postSnapshot.pages.map((page) => [Number(page.id), page])); postPages.set(1164, postSupplemental);
  for (const category of source.categories) { verifyCategory(postPages.get(category.hub_id).elementor_data || [], category, true); for (const service of category.services) verifyCategory(postPages.get(service.id).elementor_data || [], { name: service.name, services: [service] }, false); }
  const publicChecks = await verifyPublic(source);
  const report = { generated_at: new Date().toISOString(), operation: "reconcile-bleach-scrub-services", status, results, menu: { id: source.menu_id, count: menuAfter.count, contract: savedMenuContract }, cache, public_checks: publicChecks };
  writeJson(path.join(outputDir, "deployment-report.json"), report);
  console.log(JSON.stringify({ ok: true, dry_run: false, bleach_cards: source.categories[0].services.length, scrub_cards: source.categories[1].services.length, detail_pages: detailBuilds.length, menu_items: menuAfter.count, public_checks: publicChecks.length, outputDir }, null, 2));
}

module.exports = { buildHub, buildDetail, verifyCategory, prepareMenu, verifyMenu };
if (require.main === module) main().catch((error) => { console.error(error.stack || error.message); process.exit(1); });
