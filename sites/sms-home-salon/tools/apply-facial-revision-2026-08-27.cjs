const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { validateTemplate } = require("../../../src/validator/elementor-native-lint");

const root = path.resolve(__dirname, "../../..");
const sourcePath = path.join(root, "sites/sms-home-salon/content/facial-revision-2026-08-27.json");
const fallbackSnapshotPath = path.join(root, "build/sites/sms-home-salon/facial-revision-2026-08-27/site-snapshot.pre-update.json");
const outputDir = path.join(root, "build/sites/sms-home-salon/facial-revision-2026-08-27");
const apply = process.argv.includes("--apply");
const facialCopyOnly = process.argv.includes("--facial-copy-only");
const baseUrl = String(process.env.NEB_SITE_URL || "").replace(/\/$/, "");
const apiKey = process.env.NEB_API_KEY;
const expectedBaseUrl = "https://homesalon.ae/wp-json/native-elementor/v1";
const expectedSite = "https://homesalon.ae";
const expectedBridge = "0.9.0";
let lastApiCallAt = 0;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function hash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function stableId(seed) {
  return crypto.createHash("md5").update(seed).digest("hex").slice(0, 7);
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

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

function route(value) {
  return new URL(value, expectedSite).pathname.replace(/\/$/, "") || "/";
}

function walk(value, visitor) {
  if (!value || typeof value !== "object") return;
  visitor(value);
  if (Array.isArray(value)) {
    for (const child of value) walk(child, visitor);
    return;
  }
  for (const child of Object.values(value)) walk(child, visitor);
}

function directWidget(container, type) {
  return (container.elements || []).find((element) => element?.elType === "widget" && element.widgetType === type);
}

function containsHeading(value, title) {
  let found = false;
  walk(value, (node) => {
    if (node?.widgetType === "heading" && decode(node.settings?.title) === title) found = true;
  });
  return found;
}

function refreshIds(value, seed) {
  let index = 0;
  walk(value, (node) => {
    if (typeof node?.id === "string") node.id = stableId(`${seed}:${index++}:${node.elType || "node"}:${node.widgetType || ""}`);
  });
}

function assertUniqueIds(elements, label) {
  const seen = new Set();
  const duplicates = [];
  walk(elements, (node) => {
    if (typeof node?.id !== "string") return;
    if (seen.has(node.id)) duplicates.push(node.id);
    seen.add(node.id);
  });
  if (duplicates.length) throw new Error(`${label}: duplicate Elementor IDs: ${duplicates.slice(0, 5).join(", ")}`);
  return seen.size;
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

function linkedHeading(card) {
  return directWidget(card, "heading");
}

function allHeadings(card) {
  const output = [];
  walk(card, (node) => {
    if (node?.widgetType === "heading") output.push(node);
  });
  return output;
}

function badgeChild(card) {
  return (card.elements || []).find((child) => child?.elType === "container" && containsHeading(child, "Most Popular"));
}

function removeBadge(card) {
  card.elements = (card.elements || []).filter((child) => child !== badgeChild(card));
}

function setTimedCard(card, service, linked) {
  const title = linkedHeading(card);
  const description = directWidget(card, "text-editor");
  const button = directWidget(card, "button");
  if (!title || !description || !button) throw new Error(`${service.name}: package card structure changed.`);
  title.settings.title = service.name;
  if (linked) title.settings.link = { ...(title.settings.link || {}), url: service.path, is_external: false, nofollow: false };
  description.settings.editor = `<p>${service.description}${service.note ? ` ${service.note}` : ""}</p>`;
  const values = allHeadings(card).filter((node) => node !== title && decode(node.settings?.title) !== "Most Popular");
  if (values.length !== 4) throw new Error(`${service.name}: expected four duration/price headings, found ${values.length}.`);
  [values[0].settings.title, values[1].settings.title, values[2].settings.title, values[3].settings.title] = ["Duration", `${service.duration} min`, "Price", service.price];
  button.settings._attributes = `data-service|${service.name}\ndata-cta|Book ${service.name}`;
  if (!linked) button.settings.text = `Book ${service.name}`;
}

function setPriceCard(card, service) {
  const title = linkedHeading(card);
  const description = directWidget(card, "text-editor");
  const button = directWidget(card, "button");
  if (!title || !description || !button) throw new Error(`${service.name}: Bleach package card structure changed.`);
  title.settings.title = service.name;
  title.settings.link = { ...(title.settings.link || {}), url: service.path, is_external: false, nofollow: false };
  description.settings.editor = `<p>${service.description}</p>`;
  const values = allHeadings(card).filter((node) => node !== title && decode(node.settings?.title) !== "Most Popular");
  if (values.length !== 4) throw new Error(`${service.name}: expected four price headings, found ${values.length}.`);
  [values[0].settings.title, values[1].settings.title, values[2].settings.title, values[3].settings.title] = ["Price", service.price, "From", service.price];
  button.settings.text = `Book ${service.name}`;
  button.settings._attributes = `data-service|${service.name}\ndata-cta|Book ${service.name}`;
}

function replaceStrings(value, replacements) {
  if (typeof value === "string") {
    let output = value;
    for (const [from, to] of replacements) output = output.split(from).join(to);
    return output;
  }
  if (Array.isArray(value)) return value.map((item) => replaceStrings(item, replacements));
  if (!value || typeof value !== "object") return value;
  const output = {};
  for (const [key, child] of Object.entries(value)) output[key] = replaceStrings(child, replacements);
  return output;
}

function replaceExactWidgetText(elements, replacements) {
  walk(elements, (node) => {
    if (!node?.settings) return;
    for (const [key, value] of Object.entries(node.settings)) {
      if (typeof value !== "string") continue;
      for (const [from, to] of replacements) {
        if (value === from) node.settings[key] = to;
      }
    }
  });
}

function buildFacialHub(page, source) {
  const before = page.elementor_data || [];
  const after = clone(before);
  const { container, cards } = packageGrid(after, 7);
  const byPath = new Map(cards.map((card) => [route(linkedHeading(card)?.settings?.link?.url || "/"), card]));
  const badge = cards.map(badgeChild).find(Boolean);
  if (!badge) throw new Error("Facial hub Most Popular badge template was not found.");
  const selected = source.facial.services.map((service) => {
    const card = byPath.get(route(service.path));
    if (!card) throw new Error(`${service.name}: Facial hub card was not found.`);
    removeBadge(card);
    setTimedCard(card, service, true);
    if (service.most_popular) {
      const featured = clone(badge);
      refreshIds(featured, `facial-featured:${service.id}`);
      card.elements.unshift(featured);
    }
    return card;
  });
  container.elements = selected;
  const rewritten = replaceStrings(after, [
    ["Facials, scrub, bleach and polishing treatments for brighter, cleaner and more even-looking skin from the comfort of your home.", "Professional facial treatments for cleaner, hydrated and radiant-looking skin from the comfort of your home."],
    ["Target dullness, uneven tone and congestion with facial and body skin-care options.", "Target dullness, uneven tone, dehydration and congestion with professional facial options."],
    ["Facial, scrub and polishing options help refresh dull-looking skin and improve the appearance of radiance.", "Professional facial options help refresh dull-looking skin and improve the appearance of radiance."],
    ["Bleaching, fruit facials and premium glow facials help support a more even-looking finish.", "Fruit, gold, pearl and diamond facials help support a brighter, more even-looking finish."],
    ["Your skin-care therapist prepares the treatment area, checks your skin goal and performs the selected facial, scrub, bleach or polishing service with hygienic care.", "Your skin-care therapist prepares the treatment area, checks your skin goal and performs the selected facial service with hygienic care."],
    ["Products, towels and tools are arranged cleanly before the facial, scrub, bleach or polishing treatment begins.", "Products, towels and tools are arranged cleanly before the selected facial treatment begins."],
    ["Tell us your skin goal, select a package and receive a complete facial or polishing session at home.", "Tell us your skin goal, select a package and receive a complete facial session at home."],
    ["Select clean-up, fruit facial, premium facial, hydra facial, body scrub, bleach or polishing package.", "Select Face Clean Up, Fruit, Gold, Pearl, Diamond, Dr. Renaud or Hydra Facial."],
    ["Clean-up facials support deeper cleansing, exfoliation and a fresher skin feel.", "Face Clean Up supports deeper cleansing, exfoliation and a fresher skin feel."],
    ["Scrub and Bleach", "Dr. Renaud Facial"],
    ["Best for body exfoliation, tan removal support and brighter-looking areas.", "Best for a professional product-led facial selected around your current skin goals."],
    ["Clean Up or Fruit Facial is a good starting choice.", "Face Clean Up or Fruit Facial is a good starting choice."],
    ["It is better to let the skin rest for several hours after facial or scrub services.", "It is better to let the skin rest for several hours after a facial service."],
    ["Can I book body scrub or bleaching at home?", "How long do facial appointments take?"],
    ["<p>Yes. Face, arms, legs, back, front and full body scrub or bleaching options are available.</p>", "<p>Face Clean Up is 45 minutes. The other facial packages listed on this page are 60 minutes.</p>"],
  ]);
  const renamed = replaceStrings(rewritten, [["Clean Up Facial", "Face Clean Up"], ["clean up facial", "face clean up"]]);
  assertUniqueIds(renamed, "Facial hub");
  const lint = lintDelta(before, renamed);
  if (!lint.ok) throw new Error("Facial hub candidate introduced native lint errors.");
  return { before, after: renamed, lint };
}

function buildBleachHub(page, scrubPage, source) {
  const before = page.elementor_data || [];
  const after = clone(before);
  const scrub = clone(scrubPage.elementor_data || []);
  const bleachGrid = packageGrid(after, 3);
  const scrubGrid = packageGrid(scrub, 5);
  const cardsByPath = new Map();
  for (const card of [...bleachGrid.cards, ...scrubGrid.cards]) cardsByPath.set(route(linkedHeading(card)?.settings?.link?.url || "/"), card);
  const selected = source.bleach.services.map((service) => {
    const original = cardsByPath.get(route(service.path));
    if (!original) throw new Error(`${service.name}: source package card was not found.`);
    const card = clone(original);
    if (!source.bleach.services.slice(0, 3).some((item) => item.id === service.id)) refreshIds(card, `bleach-moved:${service.id}`);
    if (service.id !== 1150) removeBadge(card);
    setPriceCard(card, service);
    return card;
  });
  bleachGrid.container.elements = selected;
  replaceExactWidgetText(after, [
    ["Bleach Treatments at Home in Dubai", "Bleach and Scrub Treatments at Home in Dubai"],
    ["<p>Book bleach treatments at home in Dubai with trained female professionals. We bring the products, clean tools and complete setup to your home, hotel or office.</p>", "<p>Book bleach and scrub treatments at home in Dubai with trained female professionals. We bring the products, clean tools and complete setup to your home, hotel or office.</p>"],
    ["Start From AED 96", "Start From AED 60"],
    ["Choose Your Bleach Treatments Package", "Choose Your Bleach or Scrub Package"],
    ["<p>Prices are in AED. Choose a service below or contact our team to combine treatments in one home appointment.</p>", "<p>Prices are in AED. Choose a bleaching or scrub service below, or contact our team to combine treatments in one home appointment.</p>"],
  ]);
  assertUniqueIds(after, "Bleach hub");
  const lint = lintDelta(before, after);
  if (!lint.ok) throw new Error("Bleach hub candidate introduced native lint errors.");
  return { before, after, lint };
}

function buildDetailPage(page, service) {
  const before = page.elementor_data || [];
  let after = clone(before);
  if (service.old_name) after = replaceStrings(after, [[service.old_name, service.name], [service.old_name.toLowerCase(), service.name.toLowerCase()]]);
  const { cards } = packageGrid(after, 1);
  if (cards.length !== 1) throw new Error(`${service.name}: expected exactly one detail-page package card.`);
  setTimedCard(cards[0], service, false);
  assertUniqueIds(after, service.name);
  const lint = lintDelta(before, after);
  if (!lint.ok) throw new Error(`${service.name}: detail-page candidate introduced native lint errors.`);
  const payload = { elementor_data: after };
  if (service.old_name) {
    payload.title = service.page_title;
    payload.seo_title = "Face Clean Up at Home in Dubai | SMS Home Salon";
    payload.seo_description = "Book face clean up at home in Dubai with trained female professionals. A 45-minute package is available for AED 120.";
    payload.focus_keyword = "face clean up at home in Dubai";
  }
  return { before, after, payload, lint };
}

function cardContract(elements, services, timed) {
  const { cards } = packageGrid(elements, services.length);
  if (cards.length !== services.length) throw new Error(`Expected ${services.length} package cards, found ${cards.length}.`);
  return services.map((service) => {
    const card = cards.find((item) => route(linkedHeading(item)?.settings?.link?.url || service.path) === route(service.path));
    if (!card) throw new Error(`${service.name}: package card missing.`);
    const text = [];
    walk(card, (node) => {
      if (node?.settings) for (const value of Object.values(node.settings)) if (typeof value === "string") text.push(decode(value));
    });
    const expected = timed ? [service.name, `${service.duration} min`, service.price] : [service.name, service.price];
    const missing = expected.filter((value) => !text.includes(value));
    if (missing.length) throw new Error(`${service.name}: package card missing ${missing.join(" | ")}`);
    return { id: service.id, name: service.name, path: service.path, duration: service.duration || null, price: service.price };
  });
}

function facialHubContract(elements, source) {
  const cards = cardContract(elements, source.facial.services, true);
  const { cards: rawCards } = packageGrid(elements, source.facial.services.length);
  const badges = rawCards.filter((card) => containsHeading(card, "Most Popular"));
  if (badges.length !== 1 || decode(linkedHeading(badges[0])?.settings?.title) !== "Gold Facial") throw new Error("Gold Facial must be the sole Most Popular package.");
  const forbidden = ["Face Scrub", "Full Arm Bleaching", "Full Legs Bleaching", "Full Body Scrub", "Full Back/Front Bleach"];
  const titles = rawCards.map((card) => decode(linkedHeading(card)?.settings?.title));
  if (forbidden.some((title) => titles.includes(title))) throw new Error("Non-facial cards remain on the Facial hub.");
  return cards;
}

function detailContract(page, service) {
  const { cards } = packageGrid(page.elementor_data || [], 1);
  if (cards.length !== 1) throw new Error(`${service.name}: detail package card count changed.`);
  const values = [];
  walk(cards[0], (node) => {
    if (node?.widgetType === "heading") values.push(decode(node.settings?.title));
  });
  for (const expected of [service.name, "Duration", `${service.duration} min`, "Price", service.price]) {
    if (!values.includes(expected)) throw new Error(`${service.name}: detail package is missing ${expected}.`);
  }
  if (service.old_name && (page.title !== service.page_title || JSON.stringify(page.elementor_data).includes(service.old_name))) throw new Error("Face Clean Up rename contract failed.");
  return { id: service.id, duration: service.duration, price: service.price };
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

function findMenuItem(tree, objectId) {
  let found = null;
  walk(tree, (item) => {
    if (Number(item?.object_id) === Number(objectId)) found = item;
  });
  return found;
}

function prepareMenu(menu, source) {
  if (!menu || Number(menu.id) !== source.menu_id || menu.slug !== "main-menu" || !(menu.locations || []).includes("menu-1")) throw new Error("Unexpected Main Menu identity.");
  const tree = clone(menu.tree || []);
  const facial = findMenuItem(tree, source.facial.hub_id);
  const bleach = findMenuItem(tree, source.bleach.hub_id);
  const scrub = findMenuItem(tree, 1378);
  if (!facial || !bleach || !scrub) throw new Error("Facial, Bleach or Scrub menu branch was not found.");
  const pool = new Map([...facial.children, ...bleach.children, ...scrub.children].map((item) => [Number(item.object_id), item]));
  facial.children = source.facial.services.map((service) => {
    const item = pool.get(service.id);
    if (!item) throw new Error(`${service.name}: Facial menu item missing.`);
    item.title = service.name;
    return item;
  });
  bleach.children = source.bleach.services.map((service) => {
    const item = pool.get(service.id);
    if (!item) throw new Error(`${service.name}: Bleach menu item missing.`);
    return item;
  });
  scrub.children = source.scrub_menu_remaining_ids.map((id) => {
    const item = pool.get(id);
    if (!item) throw new Error(`${id}: remaining Scrub menu item missing.`);
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
  const facial = findMenuItem(menu.tree, source.facial.hub_id);
  const bleach = findMenuItem(menu.tree, source.bleach.hub_id);
  const scrub = findMenuItem(menu.tree, 1378);
  const ids = (branch) => (branch.children || []).map((item) => Number(item.object_id));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  if (!same(ids(facial), source.facial.services.map((item) => item.id))) throw new Error("Facial menu contract failed.");
  if (!same(ids(bleach), source.bleach.services.map((item) => item.id))) throw new Error("Bleach menu contract failed.");
  if (!same(ids(scrub), source.scrub_menu_remaining_ids)) throw new Error("Scrub menu contract failed.");
  if (facial.children.find((item) => Number(item.object_id) === 1052)?.title !== "Face Clean Up") throw new Error("Face Clean Up menu rename failed.");
  return { facial: ids(facial), bleach: ids(bleach), scrub: ids(scrub) };
}

function validateSource(source) {
  if (source.site !== expectedSite || source.facial.hub_id !== 65 || source.bleach.hub_id !== 1377 || source.menu_id !== 12) throw new Error("Revision source targets unexpected production objects.");
  if (source.facial.services.length !== 7 || source.bleach.services.length !== 5) throw new Error("Expected seven Facial services and five Bleach hub services.");
  if (source.facial.services.filter((item) => item.most_popular).length !== 1 || !source.facial.services.find((item) => item.most_popular && item.name === "Gold Facial")) throw new Error("Gold Facial must be the only featured package.");
  const clean = source.facial.services.find((item) => item.id === 1052);
  if (!clean || clean.name !== "Face Clean Up" || clean.duration !== 45 || clean.price !== "AED 120") throw new Error("Face Clean Up source contract failed.");
  for (const service of source.facial.services) if (![45, 60].includes(service.duration) || !/^AED \d+$/.test(service.price)) throw new Error(`${service.name}: invalid duration or price.`);
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
    const firewallCooldown = /failed with 403/.test(error.message) ? attempt * 60000 : attempt * 5000;
    await new Promise((resolve) => setTimeout(resolve, firewallCooldown));
    return apiFetch(endpoint, options, attempt + 1);
  }
}

function assertTarget(status) {
  if (baseUrl !== expectedBaseUrl || status.site_url !== expectedSite || status.bridge_version !== expectedBridge) throw new Error(`Unexpected production bridge target: ${JSON.stringify({ baseUrl, status })}`);
}

async function verifyPublic(source) {
  const results = [];
  for (const service of source.facial.services) {
    const response = await fetch(`${expectedSite}${service.path}?facial_verify=${Date.now()}`, { headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(60000) });
    const html = await response.text();
    const text = decode(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " "));
    const expected = [service.name, `${service.duration} min`, service.price];
    const missing = expected.filter((value) => !text.includes(value));
    if (!response.ok || missing.length) throw new Error(`${service.name}: public verification failed (${response.status}; ${missing.join(" | ")}).`);
    results.push({ id: service.id, path: service.path, status: response.status });
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  for (const [label, pathValue, services] of [["Facial hub", source.facial.path, source.facial.services], ["Bleach hub", source.bleach.path, source.bleach.services]]) {
    const response = await fetch(`${expectedSite}${pathValue}?hub_verify=${Date.now()}`, { headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(60000) });
    const html = await response.text();
    const expected = services.flatMap((service) => [service.name, service.path, service.price]);
    const missing = expected.filter((value) => !html.includes(value));
    if (!response.ok || missing.length) throw new Error(`${label}: public verification failed (${response.status}; ${missing.join(" | ")}).`);
    results.push({ label, path: pathValue, status: response.status });
  }
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
  const facialHub = pages.get(source.facial.hub_id);
  const bleachHub = pages.get(source.bleach.hub_id);
  const scrubHub = pages.get(1378);
  if (!facialHub || route(facialHub.url) !== "/facial" || !bleachHub || route(bleachHub.url) !== "/bleach" || !scrubHub || route(scrubHub.url) !== "/scrub") throw new Error("Expected Facial, Bleach or Scrub hub identity was not found.");
  for (const service of [...source.facial.services, ...source.bleach.services]) {
    const page = pages.get(service.id);
    if (!page || route(page.url) !== route(service.path) || page.status !== "publish") throw new Error(`${service.name}: page identity mismatch.`);
  }
  const facialBuild = buildFacialHub(facialHub, source);
  const bleachBuild = buildBleachHub(bleachHub, scrubHub, source);
  const details = source.facial.services.map((service) => ({ service, page: pages.get(service.id), build: buildDetailPage(pages.get(service.id), service) }));
  const facialContract = facialHubContract(facialBuild.after, source);
  const bleachContract = cardContract(bleachBuild.after, source.bleach.services, false);
  for (const item of details) detailContract({ ...item.page, title: item.build.payload.title || item.page.title, elementor_data: item.build.after }, item.service);
  const menuBefore = snapshot.menus.find((menu) => Number(menu.id) === source.menu_id);
  const menuPrepared = prepareMenu(menuBefore, source);
  const menuContract = verifyMenu({ tree: menuPrepared.tree }, source);
  writeJson(path.join(outputDir, "facial-hub.candidate.elementor.json"), facialBuild.after);
  writeJson(path.join(outputDir, "bleach-hub.candidate.elementor.json"), bleachBuild.after);
  for (const item of details) writeJson(path.join(outputDir, `detail-${item.service.id}.candidate.json`), item.build.payload);
  writeJson(path.join(outputDir, "preflight-report.json"), {
    generated_at: new Date().toISOString(),
    dry_run: !apply,
    status,
    facial_hub: { id: source.facial.hub_id, lint: facialBuild.lint, packages: facialContract },
    bleach_hub: { id: source.bleach.hub_id, lint: bleachBuild.lint, packages: bleachContract },
    details: details.map((item) => ({ id: item.service.id, lint: item.build.lint, duration: item.service.duration, price: item.service.price })),
    menu: menuContract,
  });
  if (!apply) {
    console.log(JSON.stringify({ ok: true, dry_run: true, facial_cards: facialContract.length, bleach_cards: bleachContract.length, detail_pages: details.length, menu_items: menuBefore.count, new_lint_errors: 0, outputDir }, null, 2));
    return;
  }

  const fullWrites = [
    ...details.map((item) => ({ id: item.service.id, before: item.page, body: item.build.payload, kind: "detail", service: item.service })),
    { id: source.facial.hub_id, before: facialHub, body: { elementor_data: facialBuild.after }, kind: "facial-hub" },
    { id: source.bleach.hub_id, before: bleachHub, body: { elementor_data: bleachBuild.after }, kind: "bleach-hub" },
  ];
  const writes = facialCopyOnly ? fullWrites.filter((item) => item.kind === "facial-hub") : fullWrites;
  const results = [];
  for (const item of writes) {
    const latest = await apiFetch(`pages/${item.id}`);
    if (hash(latest.elementor_data || []) !== hash(item.before.elementor_data || []) || latest.status !== "publish" || route(latest.url) !== route(item.before.url)) throw new Error(`${item.id}: live page changed after preflight; refusing to overwrite it.`);
    await apiFetch(`pages/${item.id}`, { method: "PUT", body: JSON.stringify(item.body) });
    const saved = await apiFetch(`pages/${item.id}`);
    writeJson(path.join(outputDir, `${item.kind}-${item.id}.post-update.json`), saved);
    if (route(saved.url) !== route(item.before.url) || saved.status !== "publish" || Number(saved.parent_id) !== Number(item.before.parent_id)) throw new Error(`${item.id}: URL, status or parent changed unexpectedly.`);
    if (item.kind === "detail") detailContract(saved, item.service);
    if (item.kind === "facial-hub") facialHubContract(saved.elementor_data || [], source);
    if (item.kind === "bleach-hub") cardContract(saved.elementor_data || [], source.bleach.services, false);
    const lint = lintDelta(item.before.elementor_data || [], saved.elementor_data || []);
    if (!lint.ok) throw new Error(`${item.id}: export-back lint failed.`);
    results.push({ id: item.id, kind: item.kind, url: saved.url, lint });
  }

  const menuInventory = await apiFetch("menus");
  const liveMenu = (menuInventory.menus || []).find((menu) => Number(menu.id) === source.menu_id);
  let menuAfter = liveMenu;
  let savedMenuContract = verifyMenu(liveMenu, source);
  if (!facialCopyOnly) {
    if (hash(menuPayload(liveMenu.tree || [])) !== hash(menuPayload(menuBefore.tree || []))) throw new Error("Main Menu changed after preflight; refusing to overwrite it.");
    const livePrepared = prepareMenu(liveMenu, source);
    const menuDryRun = await apiFetch("menus", { method: "POST", body: JSON.stringify({ menu_id: source.menu_id, mode: "replace", dry_run: true, items: livePrepared.items }) });
    if (!menuDryRun.ok || !menuDryRun.dry_run) throw new Error("Main Menu dry run failed.");
    await apiFetch("menus", { method: "POST", body: JSON.stringify({ menu_id: source.menu_id, mode: "replace", dry_run: false, items: livePrepared.items }) });
    const afterMenus = await apiFetch("menus");
    menuAfter = (afterMenus.menus || []).find((menu) => Number(menu.id) === source.menu_id);
    savedMenuContract = verifyMenu(menuAfter, source);
    if (Number(menuAfter.count) !== Number(menuBefore.count)) throw new Error("Main Menu item count changed unexpectedly.");
  }
  writeJson(path.join(outputDir, "main-menu.post-update.json"), menuAfter);

  const cache = await apiFetch("clear-cache", { method: "POST", body: "{}" });
  const postSnapshot = await apiFetch("site-snapshot?include_data=true");
  writeJson(path.join(outputDir, "site-snapshot.post-apply.json"), postSnapshot);
  const postPages = new Map(postSnapshot.pages.map((page) => [Number(page.id), page]));
  facialHubContract(postPages.get(source.facial.hub_id).elementor_data || [], source);
  cardContract(postPages.get(source.bleach.hub_id).elementor_data || [], source.bleach.services, false);
  for (const service of source.facial.services) detailContract(postPages.get(service.id), service);
  const publicChecks = await verifyPublic(source);
  const report = { generated_at: new Date().toISOString(), operation: "reconcile-facial-and-bleach-services", status, results, menu: { id: source.menu_id, count: menuAfter.count, contract: savedMenuContract }, cache, public_checks: publicChecks };
  writeJson(path.join(outputDir, "deployment-report.json"), report);
  console.log(JSON.stringify({ ok: true, dry_run: false, facial_cards: 7, bleach_cards: 5, detail_pages: facialCopyOnly ? 0 : 7, menu_items: menuAfter.count, public_checks: publicChecks.length, outputDir }, null, 2));
}

module.exports = { buildFacialHub, buildBleachHub, buildDetailPage, facialHubContract, detailContract, prepareMenu, verifyMenu };

if (require.main === module) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
  });
}
