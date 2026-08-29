const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { validateTemplate } = require("../../../src/validator/elementor-native-lint");

const root = path.resolve(__dirname, "../../..");
const sourcePath = path.join(root, "sites/sms-home-salon/content/massage-revision-2026-08-26.json");
const fallbackSnapshotPath = path.join(root, "build/sites/sms-home-salon/massage-revision-audit/site-snapshot.json");
const outputDir = path.join(root, "build/sites/sms-home-salon/massage-revision-2026-08-26");
const apply = process.argv.includes("--apply");
const draftsOnly = process.argv.includes("--drafts-only");
const baseUrl = String(process.env.NEB_SITE_URL || "").replace(/\/$/, "");
const apiKey = process.env.NEB_API_KEY;
const expectedBaseUrl = "https://homesalon.ae/wp-json/native-elementor/v1";
const expectedSite = "https://homesalon.ae";
const expectedBridge = "0.9.0";
const baselinePageId = 1044;
const hubPageId = 62;
const menuId = 12;

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

function widgets(section) {
  const output = [];
  walk(section, (node) => {
    if (node?.elType === "widget") output.push(node);
  });
  return output;
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

function replaceDeep(value, replacements) {
  if (typeof value === "string") {
    let output = value;
    for (const [from, to] of replacements) output = output.split(from).join(to);
    return output;
  }
  if (Array.isArray(value)) return value.map((item) => replaceDeep(item, replacements));
  if (!value || typeof value !== "object") return value;
  const output = {};
  for (const [key, child] of Object.entries(value)) output[key] = replaceDeep(child, replacements);
  return output;
}

function refreshIds(elements, seed) {
  let index = 0;
  walk(elements, (node) => {
    if (node && typeof node === "object" && typeof node.id === "string") {
      node.id = stableId(`${seed}:${index}:${node.elType || "node"}:${node.widgetType || ""}`);
      index += 1;
    }
  });
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

function textNodeAfter(ordered, headingTitle) {
  const index = ordered.findIndex((node) => node.widgetType === "heading" && decode(node.settings?.title) === headingTitle);
  if (index < 0) throw new Error(`Heading not found: ${headingTitle}`);
  const text = ordered.slice(index + 1).find((node) => node.widgetType === "text-editor");
  if (!text) throw new Error(`Text after heading not found: ${headingTitle}`);
  return text;
}

function rewriteCardGroup(section, startTitle, endTitle, cards) {
  const ordered = widgets(section);
  const start = ordered.findIndex((node) => node.widgetType === "heading" && decode(node.settings?.title) === startTitle);
  const end = endTitle
    ? ordered.findIndex((node, index) => index > start && node.widgetType === "heading" && decode(node.settings?.title) === endTitle)
    : ordered.length;
  if (start < 0 || end < 0) throw new Error(`Unable to locate ${startTitle} card group.`);
  const group = ordered.slice(start + 1, end);
  const headings = group.filter((node) => node.widgetType === "heading");
  const texts = group.filter((node) => node.widgetType === "text-editor");
  if (headings.length !== cards.length || texts.length !== cards.length) {
    throw new Error(`${startTitle}: expected ${cards.length} heading/text pairs, found ${headings.length}/${texts.length}.`);
  }
  cards.forEach((card, index) => {
    headings[index].settings.title = card.title;
    texts[index].settings.editor = `<p>${card.text}</p>`;
  });
}

function rewriteRightForYou(section, definition) {
  const ordered = widgets(section);
  const guideHeading = ordered.find((node) => node.widgetType === "heading" && / Guide$/.test(decode(node.settings?.title)));
  const title = ordered.find((node) => node.widgetType === "heading" && /^Is .+ Right for You\?$/.test(decode(node.settings?.title)));
  if (!guideHeading || !title) throw new Error(`${definition.key}: Right for You heading structure changed.`);
  guideHeading.settings.title = `${definition.service} Guide`;
  title.settings.title = `Is ${definition.service} Right for You?`;
  const introIndex = ordered.indexOf(title);
  const intro = ordered.slice(introIndex + 1).find((node) => node.widgetType === "text-editor");
  if (!intro) throw new Error(`${definition.key}: Right for You introduction was not found.`);
  intro.settings.editor = `<p>${definition.right_for_you.intro}</p>`;

  const cards = [];
  walk(section, (node) => {
    if (node?.elType === "container" && directWidget(node, "icon") && directWidget(node, "heading") && directWidget(node, "text-editor")) cards.push(node);
  });
  if (cards.length !== 6 || definition.right_for_you.cards.length !== 6) {
    throw new Error(`${definition.key}: expected six Right for You cards.`);
  }
  definition.right_for_you.cards.forEach((content, index) => {
    directWidget(cards[index], "heading").settings.title = content.title;
    directWidget(cards[index], "text-editor").settings.editor = `<p>${content.text}</p>`;
  });
}

function rewriteFaqs(section, definition) {
  const ordered = widgets(section);
  const pageTitle = ordered.find((node) => node.widgetType === "heading" && /Booking Questions$/.test(decode(node.settings?.title)));
  if (!pageTitle) throw new Error(`${definition.key}: FAQ title was not found.`);
  pageTitle.settings.title = `${definition.service} Booking Questions`;
  const intro = ordered.slice(ordered.indexOf(pageTitle) + 1).find((node) => node.widgetType === "text-editor");
  intro.settings.editor = `<p>Answers to common questions before booking ${definition.service.toLowerCase()} at home.</p>`;
  const questions = ordered.filter((node) => node.widgetType === "heading" && decode(node.settings?.title).endsWith("?"));
  if (questions.length !== definition.faqs.length) throw new Error(`${definition.key}: expected ${definition.faqs.length} FAQ questions, found ${questions.length}.`);
  definition.faqs.forEach((faq, index) => {
    questions[index].settings.title = faq.question;
    textNodeAfter(ordered, faq.question).settings.editor = `<p>${faq.answer}</p>`;
  });
}

function findVideoPoster(elements) {
  let video = null;
  walk(elements, (node) => {
    if (!video && node?.elType === "widget" && node.widgetType === "video" && node.settings?.poster) video = node;
  });
  if (!video) throw new Error("Hero video widget was not found.");
  return video;
}

function buildPage(baseline, definition, media) {
  const baselineElements = baseline.elementor_data || [];
  let elements = clone(baselineElements);
  elements = replaceDeep(elements, [
    ["Head and Shoulder Massage", definition.service],
    ["head and shoulder massage", definition.service.toLowerCase()],
    ["head-shoulder-massage", definition.slug],
    ["Start From AED 216", `Start From ${definition.variants[0].price}`],
    ["AED 216", definition.variants[0].price],
    ["AED 264", definition.variants[1].price],
  ]);

  const hero = widgets(elements[0]);
  const heroTitle = hero.find((node) => node.widgetType === "heading" && /at Home in Dubai$/.test(decode(node.settings?.title)));
  const heroText = hero.find((node) => node.widgetType === "text-editor");
  if (!heroTitle || !heroText) throw new Error(`${definition.key}: hero structure changed.`);
  heroTitle.settings.title = definition.title;
  heroText.settings.editor = `<p>${definition.hero_description}</p>`;
  findVideoPoster(elements).settings.poster = clone(media);

  rewriteCardGroup(elements[2], "Who It's For", "When to Book", definition.at_a_glance.who);
  rewriteCardGroup(elements[2], "When to Book", "Top Benefits", definition.at_a_glance.when);
  rewriteCardGroup(elements[2], "Top Benefits", null, definition.at_a_glance.benefits);

  const included = widgets(elements[3]);
  textNodeAfter(included, `Everything Needed for ${definition.service}`).settings.editor = `<p>${definition.included_description}</p>`;
  textNodeAfter(included, "Preference Check").settings.editor = `<p>${definition.preference_description}</p>`;

  const packages = widgets(elements[4]);
  definition.variants.forEach((variant, index) => {
    const label = `${variant.minutes}-Minute ${definition.service}`;
    const heading = packages.find((node) => node.widgetType === "heading" && decode(node.settings?.title) === label);
    if (!heading) throw new Error(`${definition.key}: package heading missing: ${label}`);
    textNodeAfter(packages, label).settings.editor = `<p>${definition.package_descriptions[index]}</p>`;
  });

  rewriteRightForYou(elements[6], definition);
  rewriteFaqs(elements[8], definition);
  const bookTitle = widgets(elements[10]).find((node) => node.widgetType === "heading" && /^Book Your /.test(decode(node.settings?.title)));
  if (!bookTitle) throw new Error(`${definition.key}: final booking heading was not found.`);
  bookTitle.settings.title = `Book Your ${definition.service} at Home`;
  refreshIds(elements, definition.slug);

  const candidate = {
    title: definition.title,
    slug: definition.slug,
    status: "draft",
    parent_id: hubPageId,
    menu_order: definition.menu_order,
    template: baseline.template || "elementor_header_footer",
    page_settings: {},
    seo_title: definition.seo_title,
    seo_description: definition.seo_description,
    focus_keyword: definition.focus_keyword,
    canonical_url: `${expectedSite}${definition.path}`,
    robots: ["index", "follow"],
    elementor_data: elements,
  };
  const lint = lintDelta(baselineElements, elements);
  if (!lint.ok) throw new Error(`${definition.key}: page candidate introduced native lint errors.`);
  inspectPageContract(candidate, definition, media, null);
  return { candidate, lint };
}

function allText(value) {
  const values = [];
  walk(value, (node) => {
    if (node?.elType !== "widget") return;
    for (const key of ["title", "editor", "text"]) {
      if (typeof node.settings?.[key] === "string") values.push(decode(node.settings[key]));
    }
  });
  return values.join("\n");
}

function inspectPageContract(page, definition, media, expectedStatus) {
  if (page.status !== "draft" && route(page.url || definition.path) !== route(definition.path)) throw new Error(`${definition.key}: page route mismatch.`);
  if (page.slug && page.slug !== definition.slug) throw new Error(`${definition.key}: page slug mismatch.`);
  if (page.parent_id !== undefined && Number(page.parent_id) !== hubPageId) throw new Error(`${definition.key}: page parent mismatch.`);
  if (expectedStatus && page.status !== expectedStatus) throw new Error(`${definition.key}: expected status ${expectedStatus}, found ${page.status}.`);
  const text = allText(page.elementor_data || []);
  const expected = [
    definition.title,
    definition.hero_description,
    `Start From ${definition.variants[0].price}`,
    ...definition.variants.flatMap((variant) => [`${variant.minutes}-Minute ${definition.service}`, variant.price]),
    `Is ${definition.service} Right for You?`,
    definition.right_for_you.intro,
    ...definition.faqs.flatMap((faq) => [faq.question, faq.answer]),
  ];
  const missing = expected.filter((value) => !text.includes(value));
  if (missing.length) throw new Error(`${definition.key}: candidate is missing ${missing.length} required value(s): ${missing.join(" | ")}`);
  if (definition.key === "cupping-therapy" && /Head and Shoulder Massage|head and shoulder massage/.test(text)) {
    throw new Error("Cupping Therapy candidate retains stale baseline service copy.");
  }
  const poster = findVideoPoster(page.elementor_data || []).settings.poster;
  if (media && (poster.url !== media.url || Number(poster.id) !== Number(media.id))) throw new Error(`${definition.key}: hero poster does not match uploaded media.`);
  const duplicateIds = [];
  const seen = new Set();
  walk(page.elementor_data || [], (node) => {
    if (typeof node?.id !== "string") return;
    if (seen.has(node.id)) duplicateIds.push(node.id);
    seen.add(node.id);
  });
  if (duplicateIds.length) throw new Error(`${definition.key}: duplicate Elementor IDs found.`);
  return { required_values: expected.length, element_ids: seen.size, duplicate_ids: 0 };
}

function packageGrid(hubElements) {
  const section = hubElements.find((item) => containsHeading(item, "Packages and Prices"));
  if (!section) throw new Error("Massage hub package section was not found.");
  let grid = null;
  walk(section, (node) => {
    if (grid || node?.elType !== "container" || !Array.isArray(node.elements)) return;
    const cards = node.elements.filter((child) => child?.elType === "container" && directWidget(child, "text-editor") && directWidget(child, "button"));
    if (cards.length >= 14) grid = node;
  });
  if (!grid) throw new Error("Massage hub package grid structure was not recognised.");
  return grid;
}

function linkedHeading(card) {
  return (card.elements || []).find((node) => node?.widgetType === "heading" && node.settings?.link?.url);
}

function setHubCard(card, service) {
  const heading = linkedHeading(card);
  const description = directWidget(card, "text-editor");
  const button = directWidget(card, "button");
  if (!heading || !description || !button) throw new Error(`${service.service}: hub card structure changed.`);
  heading.settings.title = service.hub_title;
  heading.settings.link = { ...(heading.settings.link || {}), url: service.path, is_external: false, nofollow: false };
  description.settings.editor = `<p>${service.description}</p>`;
  const priceHeadings = [];
  walk(card, (node) => {
    if (node?.widgetType === "heading" && /^(?:\d+ min|AED \d+|Ask us)$/.test(decode(node.settings?.title))) priceHeadings.push(node);
  });
  if (priceHeadings.length !== 4) throw new Error(`${service.service}: expected four duration/price headings, found ${priceHeadings.length}.`);
  service.variants.forEach((variant, index) => {
    priceHeadings[index * 2].settings.title = `${variant.minutes} min`;
    priceHeadings[(index * 2) + 1].settings.title = variant.price;
  });
  button.settings._attributes = `data-service|${service.service}\ndata-cta|Book ${service.service}`;
}

function buildHub(hub, source) {
  const before = hub.elementor_data || [];
  const after = clone(before);
  const grid = packageGrid(after);
  const existingByPath = new Map();
  for (const card of grid.elements) {
    const heading = linkedHeading(card);
    if (heading) existingByPath.set(route(heading.settings.link.url), card);
  }
  const templateCard = existingByPath.get("/massage/head-shoulder-massage");
  if (!templateCard) throw new Error("Hub template package card was not found.");
  for (const service of source.services) {
    let card = existingByPath.get(route(service.path));
    if (!card) {
      card = clone(templateCard);
      grid.elements.push(card);
      refreshIds(card, `hub:${service.key || service.path}`);
      existingByPath.set(route(service.path), card);
    }
    setHubCard(card, service);
  }
  if (grid.elements.filter((card) => linkedHeading(card)).length !== 16) throw new Error("Massage hub must contain exactly 16 linked package cards.");
  const lint = lintDelta(before, after);
  if (!lint.ok) throw new Error("Massage hub candidate introduced native lint errors.");
  inspectHubContract(after, source);
  return { before, after, lint };
}

function inspectHubContract(elements, source) {
  const grid = packageGrid(elements);
  const checks = source.services.map((service) => {
    const card = grid.elements.find((item) => route(linkedHeading(item)?.settings?.link?.url || "/") === route(service.path));
    if (!card) throw new Error(`${service.service}: hub card missing.`);
    const text = allText(card);
    const expected = [service.hub_title, service.description, ...service.variants.flatMap((variant) => [`${variant.minutes} min`, variant.price])];
    const missing = expected.filter((value) => !text.includes(value));
    if (missing.length) throw new Error(`${service.service}: hub card is missing ${missing.join(" | ")}`);
    if (/Ask us/.test(text)) throw new Error(`${service.service}: stale Ask us pricing remains.`);
    return { service: service.service, path: service.path, variants: service.variants };
  });
  return checks;
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

function prepareMenu(menu, definitions, idsByKey) {
  if (!menu || Number(menu.id) !== menuId || menu.slug !== "main-menu" || !(menu.locations || []).includes("menu-1")) {
    throw new Error(`Unexpected main menu identity: ${JSON.stringify(menu)}`);
  }
  const tree = clone(menu.tree || []);
  let massage = null;
  walk(tree, (item) => {
    if (Number(item?.object_id) === hubPageId) massage = item;
  });
  if (!massage || !Array.isArray(massage.children)) throw new Error("Massage menu branch was not found.");
  for (const definition of definitions) {
    const id = Number(idsByKey[definition.key]);
    if (!id) throw new Error(`${definition.key}: page ID is missing for menu update.`);
    const existing = massage.children.find((item) => Number(item.object_id) === id || item.source_key === `massage-${definition.key}`);
    const item = existing || {};
    Object.assign(item, {
      title: definition.service,
      object_id: id,
      type: "post_type",
      object: "page",
      source_key: `massage-${definition.key}`,
      children: [],
    });
    if (!existing) massage.children.push(item);
  }
  const seen = new Set();
  walk(tree, (item) => {
    if (!item || typeof item !== "object" || !item.source_key) return;
    if (seen.has(item.source_key)) throw new Error(`Duplicate menu source key: ${item.source_key}`);
    seen.add(item.source_key);
  });
  return { items: menuPayload(tree), expectedCount: Number(menu.count) + definitions.filter((definition) => !massage.children.some((item) => item.source_key === `massage-${definition.key}`)).length };
}

function validateSource(source) {
  if (source.site !== expectedSite || Number(source.parent?.id) !== hubPageId || source.parent?.path !== "/massage/") throw new Error("Content source targets an unexpected site or parent.");
  if (!Array.isArray(source.services) || source.services.length !== 16) throw new Error("Expected exactly 16 massage services.");
  if (!Array.isArray(source.new_pages) || source.new_pages.length !== 2) throw new Error("Expected exactly two new massage page definitions.");
  const paths = source.services.map((item) => item.path);
  if (new Set(paths).size !== paths.length) throw new Error("Duplicate massage service paths found.");
  const ids = source.services.filter((item) => item.id).map((item) => Number(item.id));
  if (new Set(ids).size !== ids.length) throw new Error("Duplicate existing massage page IDs found.");
  for (const service of source.services) {
    if (!Array.isArray(service.variants) || service.variants.length !== 2 || service.variants[0].minutes !== 60 || service.variants[1].minutes !== 90) {
      throw new Error(`${service.service}: expected 60- and 90-minute variants.`);
    }
  }
  for (const definition of source.new_pages) {
    const service = source.services.find((item) => item.key === definition.key);
    if (!service) throw new Error(`${definition.key}: new page is missing from the service matrix.`);
    definition.variants = clone(service.variants);
    const localImage = path.join(root, definition.image.file);
    if (!fs.existsSync(localImage)) throw new Error(`${definition.key}: image file not found: ${localImage}`);
    const text = JSON.stringify(definition);
    if (/\p{Extended_Pictographic}/u.test(text)) throw new Error(`${definition.key}: emoji found in page source.`);
    if (definition.right_for_you.cards.length !== 6 || definition.faqs.length !== 6) throw new Error(`${definition.key}: incomplete card or FAQ contract.`);
  }
}

async function apiFetch(endpoint, options = {}, attempt = 1) {
  try {
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
    await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    return apiFetch(endpoint, options, attempt + 1);
  }
}

function assertTarget(status) {
  if (baseUrl !== expectedBaseUrl || status.site_url !== expectedSite || status.bridge_version !== expectedBridge) {
    throw new Error(`Unexpected production bridge target: ${JSON.stringify({ baseUrl, status })}`);
  }
}

async function ensureMedia(definition) {
  const search = encodeURIComponent(definition.image.title);
  const inventory = await apiFetch(`media?per_page=250&search=${search}`);
  const stem = path.basename(definition.image.file, path.extname(definition.image.file));
  const match = (inventory.media || []).find((item) => String(item.url || "").includes(stem));
  if (match) return { url: match.url, id: match.id, alt: definition.image.alt, source: "library", size: "" };
  const file = path.join(root, definition.image.file);
  const uploaded = await apiFetch("media/upload", {
    method: "POST",
    body: JSON.stringify({
      filename: path.basename(file),
      title: definition.image.title,
      alt: definition.image.alt,
      caption: definition.image.source,
      data: fs.readFileSync(file).toString("base64"),
      set_featured: false,
    }),
  });
  return { url: uploaded.url, id: uploaded.attachment_id, alt: definition.image.alt, source: "library", size: "" };
}

async function verifyPublic(definition) {
  const response = await fetch(`${expectedSite}${definition.path}?neb_verify=${Date.now()}`, { headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(60000) });
  const html = await response.text();
  if (!response.ok) throw new Error(`${definition.key}: public page returned ${response.status}.`);
  const text = decode(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " "));
  const expected = [definition.title, definition.hero_description, ...definition.variants.flatMap((variant) => [`${variant.minutes}-Minute ${definition.service}`, variant.price]), `Is ${definition.service} Right for You?`];
  const missing = expected.filter((value) => !text.includes(value));
  if (missing.length) throw new Error(`${definition.key}: public page is missing ${missing.join(" | ")}`);
  return { key: definition.key, url: response.url, status: response.status, missing: 0 };
}

async function main() {
  const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  validateSource(source);
  fs.mkdirSync(outputDir, { recursive: true });
  let snapshot;
  let status = null;
  if (apply) {
    if (!baseUrl || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required with --apply.");
    status = await apiFetch("status");
    assertTarget(status);
    snapshot = await apiFetch("site-snapshot?include_data=true");
    if (!snapshot.ok || !snapshot.include_data || snapshot.status?.site_url !== expectedSite) throw new Error("Fresh production snapshot was incomplete.");
  } else {
    if (!fs.existsSync(fallbackSnapshotPath)) throw new Error(`Audit snapshot not found: ${fallbackSnapshotPath}`);
    snapshot = JSON.parse(fs.readFileSync(fallbackSnapshotPath, "utf8"));
  }
  writeJson(path.join(outputDir, apply ? "site-snapshot.pre-apply.json" : "site-snapshot.local-baseline.json"), snapshot);

  const pages = new Map((snapshot.pages || []).map((page) => [Number(page.id), page]));
  const baseline = pages.get(baselinePageId);
  const hub = pages.get(hubPageId);
  if (!baseline || route(baseline.url) !== "/massage/head-shoulder-massage" || !hub || route(hub.url) !== "/massage") {
    throw new Error("Approved page or Massage hub baseline was not found at the expected ID and route.");
  }
  const currentByPath = new Map((snapshot.pages || []).map((page) => [route(page.url), page]));
  for (const service of source.services.filter((item) => item.id && !item.key)) {
    const page = currentByPath.get(route(service.path));
    if (!page || Number(page.id) !== Number(service.id) || page.status !== "publish") throw new Error(`${service.service}: production identity mismatch.`);
  }

  const mediaByKey = {};
  for (const definition of source.new_pages) {
    mediaByKey[definition.key] = apply
      ? await ensureMedia(definition)
      : { url: `${expectedSite}/wp-content/uploads/2026/08/${path.basename(definition.image.file)}`, id: 0, alt: definition.image.alt, source: "library", size: "" };
  }
  const builds = source.new_pages.map((definition) => ({ definition, ...buildPage(baseline, definition, mediaByKey[definition.key]) }));
  const hubBuild = buildHub(hub, source);
  for (const build of builds) writeJson(path.join(outputDir, `${build.definition.key}.candidate.json`), build.candidate);
  writeJson(path.join(outputDir, "massage-hub.candidate.elementor.json"), hubBuild.after);
  writeJson(path.join(outputDir, "preflight-report.json"), {
    generated_at: new Date().toISOString(),
    dry_run: !apply,
    operation: "create-two-massage-pages-and-reconcile-hub",
    status,
    existing_services_verified: 14,
    new_pages: builds.map((build) => ({ key: build.definition.key, path: build.definition.path, lint: build.lint })),
    hub: { id: hubPageId, changed: hash(hubBuild.before) !== hash(hubBuild.after), lint: hubBuild.lint, cards: inspectHubContract(hubBuild.after, source) },
  });
  if (!apply) {
    console.log(JSON.stringify({ ok: true, dry_run: true, existing_pages: 14, new_pages: 2, hub_cards: 16, new_lint_errors: 0, outputDir }, null, 2));
    return;
  }

  const createdOrUpdated = [];
  const idsByKey = {};
  for (const build of builds) {
    const existing = currentByPath.get(route(build.definition.path))
      || (snapshot.pages || []).find((page) => page.slug === build.definition.slug && Number(page.parent_id) === hubPageId);
    let saved;
    if (existing) {
      if (Number(existing.parent_id) !== hubPageId) throw new Error(`${build.definition.key}: existing route has unexpected parent.`);
      saved = await apiFetch(`pages/${existing.id}`, { method: "PUT", body: JSON.stringify(build.candidate) });
    } else {
      saved = await apiFetch("pages", { method: "POST", body: JSON.stringify(build.candidate) });
    }
    idsByKey[build.definition.key] = saved.id;
    const draft = await apiFetch(`pages/${saved.id}`);
    writeJson(path.join(outputDir, `${build.definition.key}.draft-export.json`), draft);
    const draftLint = lintDelta(baseline.elementor_data || [], draft.elementor_data || []);
    const contract = inspectPageContract(draft, build.definition, mediaByKey[build.definition.key], "draft");
    if (!draftLint.ok) throw new Error(`${build.definition.key}: draft export introduced native lint errors.`);
    if (draftsOnly) {
      createdOrUpdated.push({ key: build.definition.key, id: saved.id, url: draft.url, status: draft.status, lint: draftLint, contract });
      continue;
    }
    await apiFetch(`pages/${saved.id}`, { method: "PUT", body: JSON.stringify({ status: "publish" }) });
    const published = await apiFetch(`pages/${saved.id}`);
    writeJson(path.join(outputDir, `${build.definition.key}.published-export.json`), published);
    inspectPageContract(published, build.definition, mediaByKey[build.definition.key], "publish");
    createdOrUpdated.push({ key: build.definition.key, id: saved.id, url: published.url, status: published.status, lint: draftLint, contract });
  }

  if (draftsOnly) {
    const report = {
      generated_at: new Date().toISOString(),
      operation: "create-two-massage-page-drafts",
      status,
      existing_service_pages_verified: 14,
      pages: createdOrUpdated,
      media: mediaByKey,
      hub_unchanged: true,
      menu_unchanged: true,
    };
    writeJson(path.join(outputDir, "draft-deployment-report.json"), report);
    console.log(JSON.stringify({ ok: true, drafts_only: true, pages: createdOrUpdated, hub_unchanged: true, menu_unchanged: true, outputDir }, null, 2));
    return;
  }

  const latestHub = await apiFetch(`pages/${hubPageId}`);
  if (hash(latestHub.elementor_data || []) !== hash(hubBuild.before)) throw new Error("Massage hub changed after preflight; refusing to overwrite live work.");
  await apiFetch(`pages/${hubPageId}`, { method: "PUT", body: JSON.stringify({ elementor_data: hubBuild.after }) });
  const hubExport = await apiFetch(`pages/${hubPageId}`);
  writeJson(path.join(outputDir, "massage-hub.post-update.json"), hubExport);
  const hubLint = lintDelta(hubBuild.before, hubExport.elementor_data || []);
  const hubContract = inspectHubContract(hubExport.elementor_data || [], source);
  if (!hubLint.ok) throw new Error("Massage hub export introduced native lint errors.");

  const menuInventory = await apiFetch("menus");
  const menuBefore = (menuInventory.menus || []).find((menu) => Number(menu.id) === menuId);
  writeJson(path.join(outputDir, "main-menu.before.json"), menuBefore);
  const preparedMenu = prepareMenu(menuBefore, source.new_pages, idsByKey);
  const menuDryRun = await apiFetch("menus", { method: "POST", body: JSON.stringify({ menu_id: menuId, mode: "replace", dry_run: true, items: preparedMenu.items }) });
  writeJson(path.join(outputDir, "main-menu.dry-run.json"), menuDryRun);
  if (!menuDryRun.ok || !menuDryRun.dry_run) throw new Error("Main menu dry run failed.");
  const menuApply = await apiFetch("menus", { method: "POST", body: JSON.stringify({ menu_id: menuId, mode: "replace", dry_run: false, items: preparedMenu.items }) });
  if (!menuApply.ok) throw new Error("Main menu apply failed.");
  const menuAfterInventory = await apiFetch("menus");
  const menuAfter = (menuAfterInventory.menus || []).find((menu) => Number(menu.id) === menuId);
  writeJson(path.join(outputDir, "main-menu.after.json"), menuAfter);
  const massageBranch = menuAfter.tree?.flatMap((item) => item.children || []).find((item) => Number(item.object_id) === hubPageId);
  for (const definition of source.new_pages) {
    if (!massageBranch?.children?.some((item) => Number(item.object_id) === Number(idsByKey[definition.key]) && item.title === definition.service)) {
      throw new Error(`${definition.key}: main menu verification failed.`);
    }
  }

  const cache = await apiFetch("clear-cache", { method: "POST", body: "{}" });
  const postSnapshot = await apiFetch("site-snapshot?include_data=true");
  if (!postSnapshot.ok || !postSnapshot.include_data || postSnapshot.status?.site_url !== expectedSite) throw new Error("Post-update production snapshot was incomplete.");
  writeJson(path.join(outputDir, "site-snapshot.post-apply.json"), postSnapshot);
  const postPages = new Map(postSnapshot.pages.map((page) => [Number(page.id), page]));
  for (const item of createdOrUpdated) inspectPageContract(postPages.get(Number(item.id)), source.new_pages.find((definition) => definition.key === item.key), mediaByKey[item.key], "publish");
  const postHub = postPages.get(hubPageId);
  inspectHubContract(postHub.elementor_data || [], source);
  if (hash(hub.page_settings || {}) !== hash(postHub.page_settings || {})) throw new Error("Massage hub page settings changed during the update.");
  const publicChecks = [];
  for (const definition of source.new_pages) publicChecks.push(await verifyPublic(definition));
  const report = {
    generated_at: new Date().toISOString(),
    operation: "create-two-massage-pages-and-reconcile-hub",
    status,
    existing_service_pages_verified: 14,
    pages: createdOrUpdated,
    hub: { id: hubPageId, lint: hubLint, cards: hubContract.length, page_settings_unchanged: true },
    menu: { id: menuId, before_count: menuBefore.count, after_count: menuAfter.count, dry_run: menuDryRun.summary, operations: menuApply.operations?.length || 0 },
    media: mediaByKey,
    cache,
    public_checks: publicChecks,
  };
  writeJson(path.join(outputDir, "deployment-report.json"), report);
  console.log(JSON.stringify({ ok: true, dry_run: false, new_pages: createdOrUpdated, hub_cards: hubContract.length, menu_items: menuAfter.count, public_checks: publicChecks.length, outputDir }, null, 2));
}

module.exports = { buildHub, buildPage, inspectHubContract, inspectPageContract, validateSource };

if (require.main === module) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
  });
}
