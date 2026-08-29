const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { validateTemplate } = require("../../../src/validator/elementor-native-lint");

const root = path.resolve(__dirname, "../../..");
const sourcePath = path.join(root, "sites/sms-home-salon/content/hair-revision-2026-08-27.json");
const fallbackSnapshotPath = path.join(root, "build/sites/sms-home-salon/hair-revision-2026-08-27/site-snapshot.pre-henna-merge.json");
const outputDir = path.join(root, "build/sites/sms-home-salon/hair-revision-2026-08-27");
const apply = process.argv.includes("--apply");
const hubOnly = process.argv.includes("--hub-only");
const hennaMerge = process.argv.includes("--henna-merge");
const finalizeHennaMerge = process.argv.includes("--finalize-henna-merge");
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
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&#8217;|&rsquo;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
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
function refreshIds(value, seed) { let index = 0; walk(value, (node) => { if (typeof node?.id === "string") node.id = stableId(`${seed}:${index++}:${node.elType || "node"}:${node.widgetType || ""}`); }); }
function assertUniqueIds(elements, label) {
  const seen = new Set();
  const duplicates = [];
  walk(elements, (node) => {
    if (typeof node?.id !== "string") return;
    if (seen.has(node.id)) duplicates.push(node.id);
    seen.add(node.id);
  });
  if (duplicates.length) throw new Error(`${label}: duplicate Elementor IDs: ${duplicates.slice(0, 5).join(", ")}`);
}
function lintDelta(before, after) {
  const baseline = validateTemplate({ elementor_data: before });
  const candidate = validateTemplate({ elementor_data: after });
  const signature = (issue) => `${issue.severity}|${issue.path}|${issue.message}`;
  const inherited = new Set(baseline.issues.map(signature));
  const newErrors = candidate.issues.filter((issue) => issue.severity === "error" && !inherited.has(signature(issue)));
  return {
    ok: newErrors.length === 0,
    new_errors: newErrors,
    inherited_errors: candidate.issues.filter((issue) => issue.severity === "error").length,
    warnings: candidate.issues.filter((issue) => issue.severity === "warning").length,
  };
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
    if (boxes.length >= 1) found = { row: node, boxes };
  });
  if (!found) throw new Error("Package price row was not found.");
  return found;
}
function descriptionFor(service, item) {
  if (String(service.path || "").startsWith("/waxing/")) return `${item.name} option for ${service.name.toLowerCase()} at your preferred location.`;
  if (service.name === "Henna Application") return "Professional henna application at your preferred location.";
  if (service.name === "Keratin Treatment") return `Keratin smoothing treatment for ${item.name.toLowerCase()}.`;
  if (service.name === "Hair Cut") return item.name === "Hair Trim" ? "Quick maintenance trim." : "Detailed cut for a straight, polished finish.";
  if (service.name === "Hair Coloring") return item.name === "Root Touch Up" ? "Colour refresh for the root area." : "Professional colour application service.";
  if (service.name === "Blow Dry Straight") return `Straight blow dry styling for ${item.name.replace("Blow Dry (Straight) ", "").toLowerCase()} hair.`;
  if (service.name === "Blow Dry Curl") return `Curl blow dry styling for ${item.name.replace("Blow Dry (Curl) ", "").toLowerCase()} hair.`;
  if (service.name === "Eyelash Lifting") return "Professional eyelash lifting delivered at home.";
  return "Professional eyebrow tinting delivered at home.";
}
function setPriceOnlyCard(card, service, item, linked) {
  const title = directWidget(card, "heading");
  const description = directWidget(card, "text-editor");
  const button = directWidget(card, "button");
  if (!title || !description || !button) throw new Error(`${service.name}: package card structure changed.`);
  title.settings.title = item.name;
  if (linked) title.settings.link = { ...(title.settings.link || {}), url: service.path, is_external: false, nofollow: false };
  description.settings.editor = `<p>${descriptionFor(service, item)}</p>`;
  const { row, boxes } = metricRow(card);
  const priceBox = boxes.find((box) => directHeadings(box).some((heading) => decode(heading.settings?.title) === "Price")) || boxes[boxes.length - 1];
  const headings = directHeadings(priceBox);
  headings[0].settings.title = "Price";
  headings[1].settings.title = item.price;
  priceBox.settings.width = { unit: "%", size: 100, sizes: [] };
  priceBox.settings.width_tablet = { unit: "%", size: 100, sizes: [] };
  priceBox.settings.width_mobile = { unit: "%", size: 100, sizes: [] };
  row.elements = [priceBox];
  row.settings.flex_justify_content = "center";
  row.settings.flex_justify_content_mobile = "center";
  button.settings.text = linked ? "Book This Service" : `Book ${service.name}`;
  button.settings._attributes = `data-service|${item.name}\ndata-cta|Book ${service.name}`;
}
function replaceExactWidgetText(elements, replacements) {
  walk(elements, (node) => {
    if (!node?.settings) return;
    for (const [key, value] of Object.entries(node.settings)) {
      if (typeof value !== "string") continue;
      for (const [from, to] of replacements) if (value === from) node.settings[key] = to;
    }
  });
}
function removeExactButton(elements, label) {
  let removed = 0;
  walk(elements, (node) => {
    if (!Array.isArray(node?.elements)) return;
    node.elements = node.elements.filter((child) => {
      const match = child?.widgetType === "button" && decode(child.settings?.text) === label && !child.settings?._attributes;
      if (match) removed += 1;
      return !match;
    });
  });
  return removed;
}
function flattenPackages(source) {
  return source.services.flatMap((service) => service.packages.map((item) => ({ service, item })));
}
function buildHub(page, source) {
  const before = page.elementor_data || [];
  const after = clone(before);
  const { container, cards } = packageGrid(after, Number(source.hub_minimum_cards || 12));
  const template = cards[0];
  const badge = cards.map(badgeChild).find(Boolean);
  if (!template || !badge) throw new Error("Hair hub package templates were not found.");
  container.elements = flattenPackages(source).map(({ service, item }, index) => {
    const card = clone(template);
    const displayedItem = source.hub_package_prefix ? { ...item, name: item.name.startsWith(service.name) ? item.name : `${service.name} - ${item.name}` } : item;
    removeBadge(card);
    setPriceOnlyCard(card, service, displayedItem, true);
    if (item.most_popular) card.elements.unshift(clone(badge));
    refreshIds(card, `hair-hub:${service.id}:${index}:${item.name}`);
    return card;
  });
  replaceExactWidgetText(after, [
    ["Prices are in AED. Final timing and availability are confirmed by our team before your appointment.", "Prices are in AED. Final availability is confirmed by our team before your appointment."],
  ]);
  if (removeExactButton(after, "Blow Dry Curl") > 1) throw new Error("Unexpected duplicate Blow Dry Curl hub buttons.");
  assertUniqueIds(after, "Hair hub");
  const lint = lintDelta(before, after);
  if (!lint.ok) throw new Error("Hair hub candidate introduced native lint errors.");
  return { before, after, lint };
}
function buildDetail(page, service) {
  const before = page.elementor_data || [];
  const after = clone(before);
  const { container, cards } = packageGrid(after, 1);
  if (cards.length > service.packages.length) throw new Error(`${service.name}: expected at most ${service.packages.length} package cards, found ${cards.length}.`);
  const existingBadge = cards.map(badgeChild).find(Boolean);
  const finalCards = [...cards];
  while (finalCards.length < service.packages.length) {
    const card = clone(cards[cards.length - 1]);
    refreshIds(card, `${service.id}:added-package:${finalCards.length}`);
    finalCards.push(card);
  }
  container.elements = finalCards;
  finalCards.forEach((card, index) => {
    removeBadge(card);
    setPriceOnlyCard(card, service, service.packages[index], false);
    if (index === 0 && existingBadge) card.elements.unshift(existingBadge);
  });
  replaceExactWidgetText(after, [
    ["Prices are in AED. Final timing and therapist availability are confirmed by our team before your appointment.", "Prices are in AED. Final therapist availability is confirmed by our team before your appointment."],
    ["Prices are in AED. Final timing and availability are confirmed by our team before your appointment.", "Prices are in AED. Final availability is confirmed by our team before your appointment."],
  ]);
  assertUniqueIds(after, service.name);
  const lint = lintDelta(before, after);
  if (!lint.ok) throw new Error(`${service.name}: candidate introduced native lint errors.`);
  return { before, after, lint };
}
function cardValues(card) {
  const output = [];
  walk(card, (node) => { if (node?.widgetType === "heading") output.push(decode(node.settings?.title)); });
  return output;
}
function verifyCards(elements, source, hub) {
  const expected = flattenPackages(source);
  const { cards } = packageGrid(elements, expected.length);
  if (cards.length !== expected.length) throw new Error(`Expected ${expected.length} Hair cards, found ${cards.length}.`);
  cards.forEach((card, index) => {
    const { service, item } = expected[index];
    const displayedName = hub && source.hub_package_prefix ? (item.name.startsWith(service.name) ? item.name : `${service.name} - ${item.name}`) : item.name;
    const values = cardValues(card);
    for (const value of [displayedName, "Price", item.price]) if (!values.includes(value)) throw new Error(`${service.name} / ${item.name}: missing ${value}.`);
    for (const forbidden of ["Duration", "Package", "From"]) if (values.includes(forbidden)) throw new Error(`${service.name} / ${item.name}: forbidden ${forbidden} field remains.`);
    if (values.filter((value) => value === "Price").length !== 1 || values.filter((value) => value === item.price).length !== 1) throw new Error(`${service.name} / ${item.name}: price-only contract failed.`);
    if (hub && route(directWidget(card, "heading")?.settings?.link?.url || "/") !== route(service.path)) throw new Error(`${item.name}: hub link mismatch.`);
  });
  const featured = cards.filter((card) => containsHeading(card, "Most Popular"));
  const expectedFeatured = hub ? String(source.featured_package || "Hair Trim") : expected[0].item.name;
  if (featured.length !== 1 || !cardValues(featured[0]).includes(expectedFeatured)) throw new Error(`${expectedFeatured} must be the sole Most Popular package in this section.`);
  return expected.map(({ service, item }) => ({ service_id: service.id, service: service.name, package: item.name, price: item.price }));
}
function verifyDetail(elements, service) {
  const { cards } = packageGrid(elements, service.packages.length);
  const scoped = { ...service, packages: service.packages };
  const source = { services: [scoped] };
  verifyCards(elements, source, false);
  return cards.map((card, index) => ({ package: service.packages[index].name, price: service.packages[index].price }));
}
function menuPayload(tree) {
  return (tree || []).map((item) => ({
    label: item.title,
    page_id: Number(item.object_id),
    type: item.type,
    object: item.object,
    source_key: item.source_key || undefined,
    target: item.target || "",
    attr_title: item.attr_title || "",
    description: item.description || "",
    classes: item.classes || [],
    xfn: item.xfn || "",
    ...(item.children?.length ? { children: menuPayload(item.children) } : {}),
  }));
}
function findMenuItem(tree, objectId) { let found = null; walk(tree, (item) => { if (Number(item?.object_id) === Number(objectId)) found = item; }); return found; }
function prepareMenu(menu, source) {
  if (!menu || Number(menu.id) !== source.menu_id || menu.slug !== "main-menu" || !(menu.locations || []).includes("menu-1")) throw new Error("Unexpected Main Menu identity.");
  const tree = clone(menu.tree || []);
  const hair = findMenuItem(tree, source.hub_id);
  if (!hair) throw new Error("Hair menu branch was not found.");
  const pool = new Map((hair.children || []).map((item) => [Number(item.object_id), item]));
  hair.children = source.services.map((service) => {
    const item = pool.get(service.id);
    if (!item) throw new Error(`${service.name}: Hair menu item missing.`);
    item.title = service.name;
    return item;
  });
  const sourceKeys = new Set();
  const objectIds = new Set();
  walk(tree, (item) => {
    if (!item?.source_key) return;
    if (sourceKeys.has(item.source_key)) throw new Error(`Duplicate menu source key: ${item.source_key}`);
    sourceKeys.add(item.source_key);
    if (objectIds.has(Number(item.object_id))) throw new Error(`Duplicate menu page: ${item.object_id}`);
    objectIds.add(Number(item.object_id));
  });
  return { tree, items: menuPayload(tree) };
}
function verifyMenu(menu, source) {
  const hair = findMenuItem(menu.tree, source.hub_id);
  const actual = (hair?.children || []).map((item) => Number(item.object_id));
  const expected = source.services.map((item) => item.id);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error("Hair menu contract failed.");
  return actual;
}
function validateSource(source) {
  if (source.site !== expectedSite || source.hub_id !== 64 || source.path !== "/hair/" || source.menu_id !== 12 || source.services.length !== 7) throw new Error("Hair revision source targets unexpected production objects.");
  if (source.draft_page?.id !== 397 || source.draft_page?.path !== "/hair/henna-application/") throw new Error("Henna draft-page contract is invalid.");
  const packages = flattenPackages(source);
  if (packages.length !== 18) throw new Error("Expected 18 Hair packages.");
  if (packages.filter(({ item }) => item.most_popular).length !== 1 || !packages.find(({ item }) => item.most_popular && item.name === "Hair Trim")) throw new Error("Hair Trim must be the only featured package.");
  for (const { service, item } of packages) if (!/^AED \d+$/.test(item.price) || "duration" in item) throw new Error(`${service.name} / ${item.name}: invalid price-only source.`);
}
async function apiFetch(endpoint, options = {}, attempt = 1) {
  try {
    const throttle = Math.max(0, 4500 - (Date.now() - lastApiCallAt));
    if (throttle) await new Promise((resolve) => setTimeout(resolve, throttle));
    lastApiCallAt = Date.now();
    const response = await fetch(`${baseUrl}/${endpoint.replace(/^\//, "")}`, {
      ...options,
      signal: AbortSignal.timeout(90000),
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json", ...(options.headers || {}) },
    });
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    if (!response.ok) throw new Error(`${endpoint} failed with ${response.status}: ${JSON.stringify(data).slice(0, 1500)}`);
    return data;
  } catch (error) {
    if (attempt >= 3) throw error;
    const cooldown = /failed with 403/.test(error.message) ? attempt * 60000 : attempt * 5000;
    await new Promise((resolve) => setTimeout(resolve, cooldown));
    return apiFetch(endpoint, options, attempt + 1);
  }
}
function assertTarget(status) { if (baseUrl !== expectedBaseUrl || status.site_url !== expectedSite || status.bridge_version !== expectedBridge) throw new Error(`Unexpected production bridge target: ${JSON.stringify({ baseUrl, status })}`); }
async function verifyPublic(source) {
  const results = [];
  for (const target of [...source.services.map((service) => ({ label: service.name, path: service.path, expected: service.packages.flatMap((item) => [item.name, item.price]) })), { label: "Hair hub", path: source.path, expected: flattenPackages(source).flatMap(({ item }) => [item.name, item.price]) }]) {
    const response = await fetch(`${expectedSite}${target.path}?hair_verify=${Date.now()}`, { headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(60000) });
    const html = await response.text();
    const text = decode(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " "));
    const missing = target.expected.filter((value) => !text.includes(value));
    if (!response.ok || missing.length) throw new Error(`${target.label}: public verification failed (${response.status}; ${missing.join(" | ")}).`);
    results.push({ label: target.label, path: target.path, status: response.status });
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  const retired = await fetch(`${expectedSite}${source.draft_page.path}?henna_draft_verify=${Date.now()}`, { headers: { "Cache-Control": "no-cache" }, redirect: "manual", signal: AbortSignal.timeout(60000) });
  if (retired.ok) throw new Error(`Drafted Henna page remains publicly available (${retired.status}).`);
  results.push({ label: "Henna Application draft", path: source.draft_page.path, status: retired.status });
  return results;
}
async function main() {
  const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  validateSource(source);
  fs.mkdirSync(outputDir, { recursive: true });
  let status = null;
  let snapshot;
  if (apply) {
    if (!baseUrl || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required with --apply.");
    status = await apiFetch("status");
    assertTarget(status);
    snapshot = await apiFetch("site-snapshot?include_data=true");
  } else {
    snapshot = JSON.parse(fs.readFileSync(fallbackSnapshotPath, "utf8"));
  }
  if (!snapshot.ok || !snapshot.include_data || snapshot.status?.site_url !== expectedSite) throw new Error("Production snapshot is incomplete or targets the wrong site.");
  writeJson(path.join(outputDir, apply ? "site-snapshot.pre-apply.json" : "site-snapshot.local-baseline.json"), snapshot);
  const pages = new Map(snapshot.pages.map((page) => [Number(page.id), page]));
  const hub = pages.get(source.hub_id);
  if (!hub || route(hub.url) !== route(source.path) || hub.status !== "publish") throw new Error("Hair hub identity mismatch.");
  for (const service of source.services) {
    const page = pages.get(service.id);
    if (!page || route(page.url) !== route(service.path) || page.status !== "publish") throw new Error(`${service.name}: page identity mismatch.`);
  }
  const hennaPage = pages.get(source.draft_page.id);
  if (!hennaPage || !["publish", "draft"].includes(hennaPage.status)) throw new Error("Henna Application page identity mismatch.");
  if (hennaPage.status === "publish" && route(hennaPage.url) !== route(source.draft_page.path)) throw new Error("Published Henna Application route mismatch.");
  const hubBuild = buildHub(hub, source);
  const details = hubOnly ? [] : source.services.map((service) => ({ service, page: pages.get(service.id), build: buildDetail(pages.get(service.id), service) }));
  const hubContract = verifyCards(hubBuild.after, source, true);
  for (const item of details) verifyDetail(item.build.after, item.service);
  const menuBefore = snapshot.menus.find((menu) => Number(menu.id) === source.menu_id);
  const menuPrepared = prepareMenu(menuBefore, source);
  const menuContract = verifyMenu({ tree: menuPrepared.tree }, source);
  writeJson(path.join(outputDir, "hair-hub.candidate.elementor.json"), hubBuild.after);
  for (const item of details) writeJson(path.join(outputDir, `detail-${item.service.id}.candidate.json`), item.build.after);
  writeJson(path.join(outputDir, "preflight-report.json"), {
    generated_at: new Date().toISOString(), dry_run: !apply, status,
    hub: { id: source.hub_id, lint: hubBuild.lint, packages: hubContract },
    details: details.map((item) => ({ id: item.service.id, lint: item.build.lint, packages: item.service.packages })),
    menu: menuContract,
  });
  if (!apply) {
    console.log(JSON.stringify({ ok: true, dry_run: true, hub_cards: hubContract.length, detail_pages: details.length, detail_cards: hubOnly ? 0 : flattenPackages(source).length, menu_items: menuBefore.count, new_lint_errors: 0, outputDir }, null, 2));
    return;
  }
  const fullWrites = [
    ...details.map((item) => ({ id: item.service.id, before: item.page, body: { elementor_data: item.build.after }, kind: "detail", service: item.service })),
    { id: source.hub_id, before: hub, body: { elementor_data: hubBuild.after }, kind: "hair-hub" },
  ];
  const writes = hubOnly
    ? fullWrites.filter((item) => item.kind === "hair-hub")
    : finalizeHennaMerge
      ? []
    : hennaMerge
      ? fullWrites.filter((item) => item.kind === "hair-hub" || item.id === 1086)
      : fullWrites;
  const results = [];
  for (const item of writes) {
    const latest = await apiFetch(`pages/${item.id}`);
    if (hash(latest.elementor_data || []) !== hash(item.before.elementor_data || []) || latest.status !== "publish" || route(latest.url) !== route(item.before.url)) throw new Error(`${item.id}: live page changed after preflight; refusing to overwrite it.`);
    await apiFetch(`pages/${item.id}`, { method: "PUT", body: JSON.stringify(item.body) });
    const saved = await apiFetch(`pages/${item.id}`);
    writeJson(path.join(outputDir, `${item.kind}-${item.id}.post-update.json`), saved);
    if (route(saved.url) !== route(item.before.url) || saved.status !== "publish" || Number(saved.parent_id) !== Number(item.before.parent_id)) throw new Error(`${item.id}: URL, status or parent changed unexpectedly.`);
    if (item.kind === "detail") verifyDetail(saved.elementor_data || [], item.service); else verifyCards(saved.elementor_data || [], source, true);
    const lint = lintDelta(item.before.elementor_data || [], saved.elementor_data || []);
    if (!lint.ok) throw new Error(`${item.id}: export-back lint failed.`);
    results.push({ id: item.id, kind: item.kind, url: saved.url, lint });
  }
  const menuInventory = await apiFetch("menus");
  const liveMenu = (menuInventory.menus || []).find((menu) => Number(menu.id) === source.menu_id);
  let menuAfter = liveMenu;
  if (!hubOnly && !finalizeHennaMerge) {
    if (hash(menuPayload(liveMenu.tree || [])) !== hash(menuPayload(menuBefore.tree || []))) throw new Error("Main Menu changed after preflight; refusing to overwrite it.");
    const livePrepared = prepareMenu(liveMenu, source);
    const menuDryRun = await apiFetch("menus", { method: "POST", body: JSON.stringify({ menu_id: source.menu_id, mode: "replace", dry_run: true, items: livePrepared.items }) });
    if (!menuDryRun.ok || !menuDryRun.dry_run) throw new Error("Main Menu dry run failed.");
    await apiFetch("menus", { method: "POST", body: JSON.stringify({ menu_id: source.menu_id, mode: "replace", dry_run: false, items: livePrepared.items }) });
    const afterMenus = await apiFetch("menus");
    menuAfter = (afterMenus.menus || []).find((menu) => Number(menu.id) === source.menu_id);
  }
  const savedMenuContract = verifyMenu(menuAfter, source);
  const expectedMenuCount = hennaMerge && !finalizeHennaMerge ? Number(menuBefore.count) - 1 : Number(menuBefore.count);
  if (Number(menuAfter.count) !== expectedMenuCount) throw new Error(`Main Menu item count changed unexpectedly: expected ${expectedMenuCount}, found ${menuAfter.count}.`);
  writeJson(path.join(outputDir, "main-menu.post-update.json"), menuAfter);
  if (hennaMerge && !finalizeHennaMerge) {
    const latestHenna = await apiFetch(`pages/${source.draft_page.id}`);
    if (hash(latestHenna.elementor_data || []) !== hash(hennaPage.elementor_data || []) || route(latestHenna.url) !== route(source.draft_page.path) || latestHenna.status !== "publish") throw new Error("Henna Application changed after preflight; refusing to draft it.");
    await apiFetch(`pages/${source.draft_page.id}`, { method: "PUT", body: JSON.stringify({ status: "draft", robots: ["noindex", "follow"] }) });
    const draftedHenna = await apiFetch(`pages/${source.draft_page.id}`);
    if (draftedHenna.status !== "draft" || route(draftedHenna.url) !== route(source.draft_page.path) || hash(draftedHenna.elementor_data || []) !== hash(hennaPage.elementor_data || [])) throw new Error("Henna Application draft verification failed.");
    writeJson(path.join(outputDir, "detail-397.drafted.json"), draftedHenna);
    results.push({ id: source.draft_page.id, kind: "drafted-detail", url: draftedHenna.url, status: draftedHenna.status });
  } else if (finalizeHennaMerge && hennaPage.status !== "draft") {
    throw new Error("Henna Application must already be draft during finalization.");
  }
  const cache = await apiFetch("clear-cache", { method: "POST", body: "{}" });
  const postSnapshot = await apiFetch("site-snapshot?include_data=true");
  writeJson(path.join(outputDir, "site-snapshot.post-apply.json"), postSnapshot);
  const postPages = new Map(postSnapshot.pages.map((page) => [Number(page.id), page]));
  verifyCards(postPages.get(source.hub_id).elementor_data || [], source, true);
  for (const service of source.services) verifyDetail(postPages.get(service.id).elementor_data || [], service);
  if (postPages.get(source.draft_page.id)?.status !== "draft") throw new Error("Post-snapshot Henna draft contract failed.");
  const publicChecks = await verifyPublic(source);
  const report = { generated_at: new Date().toISOString(), operation: "reconcile-hair-services", status, results, menu: { id: source.menu_id, count: menuAfter.count, hair: savedMenuContract }, cache, public_checks: publicChecks };
  writeJson(path.join(outputDir, "deployment-report.json"), report);
  console.log(JSON.stringify({ ok: true, dry_run: false, hub_cards: hubContract.length, detail_pages: hubOnly || finalizeHennaMerge ? 0 : hennaMerge ? 1 : details.length, detail_cards: hubOnly || finalizeHennaMerge ? 0 : hennaMerge ? source.services.find((item) => item.id === 1086).packages.length : flattenPackages(source).length, drafted_pages: hennaMerge || finalizeHennaMerge ? 1 : 0, menu_items: menuAfter.count, public_checks: publicChecks.length, outputDir }, null, 2));
}

module.exports = { buildHub, buildDetail, verifyCards, verifyDetail, prepareMenu, verifyMenu };
if (require.main === module) main().catch((error) => { console.error(error.stack || error.message); process.exit(1); });
