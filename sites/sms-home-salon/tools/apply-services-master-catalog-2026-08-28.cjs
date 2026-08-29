const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { validateTemplate } = require("../../../src/validator/elementor-native-lint");

const root = path.resolve(__dirname, "../../..");
const contentDir = path.join(root, "sites/sms-home-salon/content");
const manifestPath = path.join(contentDir, "services-master-catalog-2026-08-28.json");
const outputDir = path.join(root, "build/sites/sms-home-salon/services-master-catalog-2026-08-28");
const apply = process.argv.includes("--apply");
const offline = process.argv.includes("--offline");
const baseUrl = String(process.env.NEB_SITE_URL || "").replace(/\/$/, "");
const apiKey = process.env.NEB_API_KEY;
const expectedBaseUrl = "https://homesalon.ae/wp-json/native-elementor/v1";
const expectedSite = "https://homesalon.ae";
const expectedBridge = "0.9.0";
const expectedOldGroupCounts = {
  "Signature Massage": 6, "Focused Massage": 8,
  Manicure: 8, "Extensions and BIAB": 14, "Pedicure and Kids": 15,
  "Cut, Color and Treatment": 6, "Styling, Brows and Lashes": 10,
  Facials: 7, "Body Scrub and Bleach": 8,
  "Face and Upper Body": 8, "Arms, Legs and Packages": 7,
  "Threading Packages": 9,
};
let lastApiCallAt = 0;

function readJson(file) { return JSON.parse(fs.readFileSync(path.join(contentDir, file), "utf8")); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function hash(value) { return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function stableId(seed) { return crypto.createHash("md5").update(seed).digest("hex").slice(0, 7); }
function writeJson(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`); }
function decode(value) { return String(value || "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#0*39;|&apos;/gi, "'").replace(/&#8217;|&rsquo;/gi, "'").replace(/\s+/g, " ").trim(); }
function route(value) { return new URL(value, expectedSite).pathname.replace(/\/$/, "") || "/"; }
function walk(value, visitor) { if (!value || typeof value !== "object") return; visitor(value); for (const child of Array.isArray(value) ? value : Object.values(value)) walk(child, visitor); }
function containsHeading(value, title) { let found = false; walk(value, (node) => { if (node?.widgetType === "heading" && decode(node.settings?.title) === title) found = true; }); return found; }
function widgets(value, type) { const found = []; walk(value, (node) => { if (node?.widgetType === type) found.push(node); }); return found; }
function collectIds(value) { const ids = new Set(); walk(value, (node) => { if (typeof node?.id === "string") ids.add(node.id); }); return ids; }
function refreshIds(value, seed, used) { let index = 0; walk(value, (node) => { if (typeof node?.id !== "string") return; let candidate, attempt = 0; do candidate = stableId(`${seed}:${index}:${attempt++}:${node.elType || "node"}:${node.widgetType || ""}`); while (used.has(candidate)); node.id = candidate; used.add(candidate); index += 1; }); }
function duplicateIds(elements) { const seen = new Set(), duplicates = new Set(); walk(elements, (node) => { if (typeof node?.id !== "string") return; if (seen.has(node.id)) duplicates.add(node.id); seen.add(node.id); }); return duplicates; }
function lintDelta(before, after) { const baseline = validateTemplate({ elementor_data: before }), candidate = validateTemplate({ elementor_data: after }); const signature = (issue) => `${issue.severity}|${issue.path}|${issue.message}`, inherited = new Set(baseline.issues.map(signature)); const newErrors = candidate.issues.filter((issue) => issue.severity === "error" && !inherited.has(signature(issue))); return { ok: newErrors.length === 0, new_errors: newErrors, inherited_errors: candidate.issues.filter((issue) => issue.severity === "error").length, warnings: candidate.issues.filter((issue) => issue.severity === "warning").length }; }
function packageTitle(serviceName, itemName) { return itemName.toLowerCase().startsWith(serviceName.toLowerCase()) ? itemName : `${serviceName} - ${itemName}`; }
function timedMetric(duration, price) { return `${duration} min | ${price}`; }
function item(group, title, description, metric, pathName) { return { group, title, description, metric, path: pathName }; }

function buildCatalog() {
  const massage = readJson("massage-revision-2026-08-26.json");
  const facial = readJson("facial-revision-2026-08-27.json");
  const body = readJson("bleach-scrub-revision-2026-08-27.json");
  const hair = readJson("hair-revision-2026-08-27.json");
  const manicure = readJson("manicure-revision-2026-08-27.json");
  const pedicure = readJson("pedicure-revision-2026-08-27.json");
  const kids = readJson("kids-mani-pedi-revision-2026-08-27.json");
  const waxing = readJson("waxing-revision-2026-08-27.json");
  const threading = readJson("threading-revision-2026-08-27.json");

  const massageItems = massage.services.flatMap((service, serviceIndex) => service.variants.map((variant) => item(
    serviceIndex < 6 ? "Signature Massage" : "Focused Massage",
    `${service.service} - ${variant.minutes} min`,
    service.description,
    variant.price,
    service.path,
  )));

  const manicureItems = manicure.services.flatMap((service, serviceIndex) => service.packages.map((pkg) => item(
    serviceIndex < 6 ? "Manicure" : "Extensions and BIAB",
    packageTitle(service.name, pkg.name),
    `${service.name} delivered by a professional nail technician at your preferred location.`,
    timedMetric(pkg.duration, pkg.price),
    service.path,
  )));
  const pedicureItems = pedicure.services.flatMap((service) => service.packages.map((pkg) => item(
    "Pedicure and Kids",
    packageTitle(service.name, pkg.name),
    `${service.name} delivered by a professional nail technician at your preferred location.`,
    timedMetric(pkg.duration, pkg.price),
    service.path,
  )));
  const kidsItems = kids.packages.map((pkg) => item(
    "Pedicure and Kids",
    pkg.name,
    `${pkg.name} delivered as a comfortable kids nail appointment at your preferred location.`,
    timedMetric(pkg.duration, pkg.price),
    kids.page.path,
  ));

  const hairItems = hair.services.flatMap((service) => service.packages.map((pkg) => item(
    [398, 1084, 1086].includes(service.id) ? "Cut, Color and Treatment" : "Styling, Brows and Lashes",
    packageTitle(service.name, pkg.name),
    `${service.name} service delivered by a professional at your preferred location.`,
    pkg.price,
    service.path,
  )));

  const facialItems = facial.facial.services.map((service) => item(
    "Facials",
    service.name,
    service.description,
    timedMetric(service.duration, service.price),
    service.path,
  ));
  const bodyItems = body.categories.flatMap((category) => category.services.map((service) => item(
    "Body Scrub and Bleach",
    service.name,
    `${service.name} delivered in a clean, private home setup.`,
    timedMetric(service.duration, service.price),
    service.path,
  )));

  const upperWaxIds = new Set([1096, 1098, 1100, 1102, 1106, 1104, 1110]);
  const waxingItems = waxing.services.flatMap((service) => service.packages.map((pkg) => item(
    upperWaxIds.has(service.id) ? "Face and Upper Body" : "Arms, Legs and Packages",
    packageTitle(service.name, pkg.name),
    `${pkg.name} option for ${service.name.toLowerCase()} at your preferred location.`,
    pkg.price,
    service.path,
  )));
  const threadingItems = threading.services.flatMap((service) => service.packages.map((pkg) => item(
    "Threading Packages",
    packageTitle(service.name, pkg.name),
    `${pkg.name} threading service delivered at your preferred location.`,
    pkg.price,
    service.path,
  )));

  return [
    { name: "Massage", items: massageItems },
    { name: "Nails", items: [...manicureItems, ...pedicureItems, ...kidsItems] },
    { name: "Hair", items: hairItems },
    { name: "Facial & Skin Care", items: [...facialItems, ...bodyItems] },
    { name: "Waxing", items: waxingItems },
    { name: "Threading", items: threadingItems },
  ];
}

function isPackageCard(node) { return node?.elType === "container" && Array.isArray(node.elements) && node.elements.some((child) => child?.widgetType === "button") && widgets(node, "heading").length >= 3 && widgets(node, "text-editor").length >= 1; }
function packageGrids(section) { const grids = []; walk(section, (node) => { if (node?.elType !== "container" || !Array.isArray(node.elements)) return; const cards = node.elements.filter(isPackageCard); if (!cards.length) return; const group = decode(widgets(cards[0], "heading")[0]?.settings?.title); grids.push({ group, container: node, cards }); }); if (!grids.length) throw new Error("Package grids were not found."); return grids; }
function gridForGroup(section, group) { const matches = packageGrids(section).filter((grid) => grid.group === group); if (matches.length !== 1) throw new Error(`${group}: expected one package grid, found ${matches.length}.`); return matches[0]; }
function sectionByName(elements, name) { const section = (elements || []).find((top) => containsHeading(top, name)); if (!section) throw new Error(`${name}: top-level section was not found.`); return section; }
function setCard(card, packageItem) {
  const headings = widgets(card, "heading"), descriptions = widgets(card, "text-editor"), buttons = widgets(card, "button");
  if (headings.length < 3 || descriptions.length !== 1 || buttons.length !== 1) throw new Error(`${packageItem.title}: unexpected card template.`);
  headings[0].settings.title = packageItem.group;
  headings[1].settings.title = packageItem.title;
  headings[1].settings.link = { ...(headings[1].settings.link || {}), url: packageItem.path, is_external: false, nofollow: false };
  headings[2].settings.title = packageItem.metric;
  descriptions[0].settings.editor = `<p>${packageItem.description}</p>`;
  buttons[0].settings.text = "Book Now";
  buttons[0].settings._attributes = `data-service|${packageItem.title}\ndata-cta|Book ${packageItem.title}`;
}
function setCategoryButtons(elements) {
  const expected = [
    ["Massage", "/massage/"], ["Facial", "/facial/"], ["Bleach", "/bleach/"], ["Scrub", "/scrub/"], ["Hair", "/hair/"],
    ["Manicure", "/manicure/"], ["Pedicure", "/pedicure/"], ["Kids Mani Pedi", "/kids-mani-pedi/"], ["Waxing", "/waxing/"], ["Threading", "/threading/"],
  ];
  const section = sectionByName(elements, "Browse by Category");
  let best = null;
  walk(section, (node) => { if (node?.elType !== "container" || !Array.isArray(node.elements)) return; const buttons = node.elements.filter((child) => child?.widgetType === "button"); if (buttons.length > (best?.length || 0)) best = buttons; });
  if (!best || best.length !== expected.length) throw new Error(`Expected ${expected.length} category buttons, found ${best?.length || 0}.`);
  best.forEach((button, index) => { button.settings.text = expected[index][0]; button.settings.link = { ...(button.settings.link || {}), url: expected[index][1], is_external: false, nofollow: false }; });
  return expected;
}
function transform(before, catalog) {
  const after = clone(before), used = collectIds(after), report = [];
  for (const category of catalog) {
    const section = sectionByName(after, category.name), groups = [...new Set(category.items.map((packageItem) => packageItem.group))];
    for (const group of groups) {
      const groupItems = category.items.filter((packageItem) => packageItem.group === group), { container, cards } = gridForGroup(section, group);
      if (cards.length !== expectedOldGroupCounts[group]) throw new Error(`${category.name}/${group}: expected ${expectedOldGroupCounts[group]} current cards, found ${cards.length}.`);
      const template = cards[0];
      container.elements = groupItems.map((packageItem, index) => { const card = clone(template); setCard(card, packageItem); refreshIds(card, `services:${category.name}:${group}:${index}:${packageItem.title}`, used); return card; });
      report.push({ category: category.name, group, before: cards.length, after: groupItems.length });
    }
  }
  const categoryButtons = setCategoryButtons(after);
  const inheritedDuplicates = duplicateIds(before), candidateDuplicates = duplicateIds(after), introduced = [...candidateDuplicates].filter((id) => !inheritedDuplicates.has(id));
  if (introduced.length) throw new Error(`New duplicate Elementor IDs: ${introduced.slice(0, 5).join(", ")}`);
  return { after, report, categoryButtons };
}
function verify(elements, catalog) {
  const results = [];
  for (const category of catalog) {
    const section = sectionByName(elements, category.name), groups = [...new Set(category.items.map((packageItem) => packageItem.group))]; let categoryCount = 0;
    for (const group of groups) {
      const groupItems = category.items.filter((packageItem) => packageItem.group === group), { cards } = gridForGroup(section, group);
      if (cards.length !== groupItems.length) throw new Error(`${category.name}/${group}: expected ${groupItems.length} cards, found ${cards.length}.`);
      cards.forEach((card, index) => {
        const packageItem = groupItems[index], headings = widgets(card, "heading").map((heading) => decode(heading.settings?.title)), description = decode(widgets(card, "text-editor")[0]?.settings?.editor), link = route(widgets(card, "heading")[1]?.settings?.link?.url || "/");
        for (const expected of [packageItem.group, packageItem.title, packageItem.metric]) if (!headings.includes(expected)) throw new Error(`${category.name}/${packageItem.title}: missing ${expected}.`);
        if (description !== packageItem.description || link !== route(packageItem.path)) throw new Error(`${category.name}/${packageItem.title}: description or link mismatch.`);
      });
      categoryCount += cards.length;
    }
    results.push({ category: category.name, cards: categoryCount });
  }
  const headingValues = widgets(elements, "heading").map((heading) => decode(heading.settings?.title));
  if (["60 min AED 299", "Clean Up Facial", "AED 25"].some((stale) => headingValues.includes(stale))) throw new Error("Known stale package heading remains.");
  return results;
}
async function apiFetch(endpoint, options = {}, attempt = 1) {
  try { const throttle = Math.max(0, 4500 - (Date.now() - lastApiCallAt)); if (throttle) await new Promise((resolve) => setTimeout(resolve, throttle)); lastApiCallAt = Date.now(); const response = await fetch(`${baseUrl}/${endpoint.replace(/^\//, "")}`, { ...options, signal: AbortSignal.timeout(90000), headers: { "X-API-Key": apiKey, "Content-Type": "application/json", ...(options.headers || {}) } }); const text = await response.text(); let data; try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; } if (!response.ok) throw new Error(`${endpoint} failed with ${response.status}: ${JSON.stringify(data).slice(0, 1500)}`); return data; }
  catch (error) { if (attempt >= 3) throw error; await new Promise((resolve) => setTimeout(resolve, /failed with 403/.test(error.message) ? attempt * 60000 : attempt * 5000)); return apiFetch(endpoint, options, attempt + 1); }
}
async function publicCheck(catalog) {
  const response = await fetch(`${expectedSite}/services/?catalog_verify=${Date.now()}`, { headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(90000) });
  const html = await response.text(), text = decode(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " "));
  const missing = [];
  for (const category of catalog) for (const packageItem of category.items) { if (!text.includes(packageItem.title)) missing.push(packageItem.title); if (!text.includes(packageItem.metric)) missing.push(packageItem.metric); if (!html.includes(packageItem.path)) missing.push(packageItem.path); }
  if (response.status !== 200 || missing.length || text.includes("AED 299") || text.includes("Clean Up Facial")) throw new Error(`Public Services check failed (${response.status}; ${[...new Set(missing)].slice(0, 15).join(" | ")}).`);
  return { status: response.status, packages: catalog.reduce((sum, category) => sum + category.items.length, 0) };
}
async function main() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")), catalog = buildCatalog(), total = catalog.reduce((sum, category) => sum + category.items.length, 0);
  if (manifest.site !== expectedSite || manifest.page.id !== 61 || manifest.total_packages !== 159 || total !== manifest.total_packages) throw new Error("Unexpected Services master manifest or package count.");
  for (const contract of manifest.section_contract) { const category = catalog.find((item) => item.name === contract.name); if (!category || category.items.length !== contract.packages) throw new Error(`${contract.name}: source count mismatch.`); }
  if (apply && offline) throw new Error("Offline snapshots cannot be used for production writes.");
  if (!offline && (!baseUrl || !apiKey || baseUrl !== expectedBaseUrl)) throw new Error("Production bridge credentials and exact URL are required.");
  fs.mkdirSync(outputDir, { recursive: true });
  let status, snapshot;
  if (offline) {
    const offlinePath = path.join(root, "build/sites/sms-home-salon/nail-detail-package-metrics-2026-08-27/site-snapshot.pre-update.json");
    snapshot = JSON.parse(fs.readFileSync(offlinePath, "utf8"));
    status = snapshot.status;
  } else {
    status = await apiFetch("status"); if (status.site_url !== expectedSite || status.bridge_version !== expectedBridge) throw new Error("Unexpected production target or bridge version.");
    snapshot = await apiFetch("site-snapshot?include_data=true"); writeJson(path.join(outputDir, "site-snapshot.pre-update.json"), snapshot);
  }
  const page = (snapshot.pages || []).find((item) => Number(item.id) === manifest.page.id);
  if (!page || page.status !== "publish" || page.title !== manifest.page.title || route(page.url) !== route(manifest.page.path) || Number(page.parent_id) !== 0) throw new Error("Services page identity changed.");
  const before = page.elementor_data || [], built = transform(before, catalog), contract = verify(built.after, catalog), lint = lintDelta(before, built.after);
  if (!lint.ok) throw new Error("Services candidate introduced native lint errors.");
  writeJson(path.join(outputDir, "services-61.candidate.elementor.json"), built.after);
  writeJson(path.join(outputDir, "preflight-report.json"), { generated_at: new Date().toISOString(), dry_run: !apply, page: manifest.page, total_packages: total, sections: built.report, category_buttons: built.categoryButtons, contract, lint });
  if (!apply) { console.log(JSON.stringify({ ok: true, dry_run: true, page_id: page.id, total_packages: total, sections: contract, new_lint_errors: 0, outputDir }, null, 2)); return; }
  const latest = await apiFetch(`pages/${page.id}`); if (hash(latest.elementor_data || []) !== hash(before) || latest.title !== page.title || latest.url !== page.url) throw new Error("Services page changed after preflight; refusing to overwrite it.");
  await apiFetch(`pages/${page.id}`, { method: "PUT", body: JSON.stringify({ elementor_data: built.after }) });
  const saved = await apiFetch(`pages/${page.id}`); writeJson(path.join(outputDir, "services-61.post-update.json"), saved);
  if (saved.status !== "publish" || saved.title !== page.title || route(saved.url) !== route(page.url) || Number(saved.parent_id) !== Number(page.parent_id)) throw new Error("Services identity changed after save.");
  const savedContract = verify(saved.elementor_data || [], catalog), exportLint = lintDelta(before, saved.elementor_data || []); if (!exportLint.ok) throw new Error("Services export-back lint failed.");
  const cache = await apiFetch("clear-cache", { method: "POST", body: "{}" }), publicResult = await publicCheck(catalog);
  writeJson(path.join(outputDir, "deployment-report.json"), { generated_at: new Date().toISOString(), operation: "reconcile-services-master-catalog", page_id: page.id, total_packages: total, sections: savedContract, lint: exportLint, cache, public_check: publicResult });
  console.log(JSON.stringify({ ok: true, dry_run: false, page_id: page.id, total_packages: total, sections: savedContract, public_status: publicResult.status, new_lint_errors: 0, outputDir }, null, 2));
}

main().catch((error) => { console.error(error.stack || error.message); process.exit(1); });
