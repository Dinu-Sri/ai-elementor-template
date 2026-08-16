const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { validateTemplate } = require("../../../src/validator/elementor-native-lint");

const root = path.resolve(__dirname, "../../..");
const outputDir = path.join(root, "build/sites/sms-home-salon/phase2-approved-finish");
const apply = process.argv.includes("--apply");
const baseUrl = String(process.env.NEB_SITE_URL || "").replace(/\/$/, "");
const apiKey = process.env.NEB_API_KEY;
const canonicalHours = "12:30 PM - 11:00 PM";
const seoPostIds = new Set(Array.from({ length: 50 }, (_, index) => 1166 + index));

const categories = [
  ["Massage", "/massage/"],
  ["Facial", "/facial/"],
  ["Bleach", "/bleach/"],
  ["Scrub", "/scrub/"],
  ["Hair", "/hair/"],
  ["Manicure", "/manicure/"],
  ["Pedicure", "/pedicure/"],
  ["Kids", "/kids/"],
  ["Waxing", "/waxing/"],
  ["Threading", "/threading/"],
];

const hubLinks = {
  62: {
    "Deep Tissue Massage": "/massage/deep-tissue-massage/",
    "Thai Massage": "/massage/thai-massage/",
    "Hot Stone Massage": "/massage/hot-stone-massage/",
    "Madero Massage": "/massage/madero-massage/",
    "Lymphatic Drainage": "/massage/lymphatic-drainage-massage/",
    "Reflexology Massage": "/massage/reflexology-massage/",
    "Full Body Massage": "/massage/full-body-massage/",
    "Full Back Massage": "/massage/full-back-massage/",
    "Foot Massage": "/massage/foot-massage/",
    "Head & Shoulder Massage": "/massage/head-shoulder-massage/",
    "Head Massage": "/massage/head-massage/",
    "Head & Neck Massage": "/massage/head-neck-massage/",
    "Pregnancy Massage": "/massage/pregnancy-massage/",
    "Shoulder Massage": "/massage/shoulder-massage/",
  },
  65: {
    "Face Scrub": "/scrub/face-scrub/",
    "Clean Up Facial": "/facial/clean-up-facial/",
    "Fruit Facial": "/facial/fruit-facial/",
    "Dr. Renaud Facial": "/facial/dr-renaud-facial/",
    "Gold Facial": "/facial/gold-facial/",
    "Pearl Facial": "/facial/pearl-facial/",
    "Diamond Facial": "/facial/diamond-facial/",
    "Hydra Facial": "/facial/hydra-facial/",
    "Full Arm Bleaching": "/bleach/full-arm-bleaching/",
    "Full Legs Bleaching": "/bleach/full-legs-bleaching/",
    "Full Body Scrub": "/scrub/full-body-scrub/",
    "Full Back/Front Bleach": "/bleach/full-back-front-bleaching/",
  },
  64: {
    "Hair Trim": "/hair/hair-cut/",
    "Straight Hair Cut": "/hair/hair-cut/",
    "Blow Dry - Short": "/hair/blow-dry-straight/",
    "Blow Dry - Medium": "/hair/blow-dry-straight/",
    "Blow Dry - Long": "/hair/blow-dry-straight/",
    "Root Touch Up": "/hair/hair-coloring/",
    "Color Application": "/hair/hair-coloring/",
    "Henna Application": "/hair/henna-application/",
    "Keratin - Short Hair": "/hair/keratin-treatment/",
    "Keratin - Long Hair": "/hair/keratin-treatment/",
    "Eyelash Lifting": "/hair/eyelash-lifting/",
    "Eyebrow Tint": "/hair/eyebrow-tint/",
  },
  63: {
    "Manicure with Polish": "/manicure/classic-manicure/",
    "Gelish Manicure": "/manicure/gelish-manicure/",
    "French Gel Manicure": "/manicure/french-gel-manicure/",
    "Acrylic Nail Extensions": "/manicure/acrylic-nail/",
    "Builder Gel (BIAB)": "/manicure/builder-gel-nails/",
    "Pedicure with Color": "/pedicure/classic-pedicure/",
    "Spa Pedicure": "/pedicure/spa-pedicure/",
    "Gelish Pedicure": "/pedicure/gel-pedicure/",
    "French Gel Pedicure": "/pedicure/gel-pedicure/",
    "Callus Treatment": "/pedicure/callus-pedicure/",
    "Kids Mani Pedi": "/kids/",
    "Nail Design (Per Nail)": "/manicure/",
  },
  66: {
    "Upper Lip": "/waxing/upper-lip-waxing/",
    "Eyebrows": "/waxing/eyebrows-waxing/",
    "Under Arms": "/waxing/underarms-waxing/",
    "Half Arms": "/waxing/arms-waxing/",
    "Full Arms": "/waxing/arms-waxing/",
    "Half Legs": "/waxing/legs-waxing/",
    "Full Legs": "/waxing/legs-waxing/",
    "Bikini": "/waxing/bikini-waxing/",
    "Full Face": "/waxing/face-waxing/",
    "Full Stomach": "/waxing/stomach-waxing/",
    "Full Body (No Bikini)": "/waxing/full-body-waxing/",
    "Full Body (With Bikini)": "/waxing/full-body-waxing/",
  },
  67: {
    "Upper Lip Threading": "/threading/upper-lip/",
    "Chin Threading": "/threading/chin/",
    "Lower Lip Threading": "/threading/lower-lip/",
    "Neck Threading": "/threading/neck/",
    "Forehead Threading": "/threading/forehead/",
    "Side Locks Threading": "/threading/side-locks/",
    "Eyebrows Threading": "/threading/eyebrows/",
    "Full Face (No Brows)": "/threading/full-face-without-eyebrows/",
    "Full Face (With Brows)": "/threading/full-face-without-eyebrows/",
  },
};

const extraHubLinks = {
  64: [["Blow Dry Curl", "/hair/blow-dry-curl/"]],
  63: [["Manicure Services", "/manicure/"], ["Pedicure Services", "/pedicure/"], ["French Gel Services", "/manicure/french-gel-manicure/"]],
  66: [["Chin Waxing", "/waxing/chin-waxing/"], ["Chest Waxing", "/waxing/chest-waxing/"]],
};

const routeReplacements = [
  ["/facial-skin-care/hydra-facial/", "/facial/hydra-facial/"],
  ["/facial-skin-care/diamond-facial/", "/facial/diamond-facial/"],
  ["/facial-skin-care/pearl-facial/", "/facial/pearl-facial/"],
  ["/facial-skin-care/gold-facial/", "/facial/gold-facial/"],
  ["/nails/acrylic-nail-extensions/", "/manicure/acrylic-nail/"],
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function stableId(seed) {
  return crypto.createHash("md5").update(seed).digest("hex").slice(0, 7);
}

function walk(value, visitor, parent = null) {
  if (!value || typeof value !== "object") return;
  visitor(value, parent);
  for (const child of Object.values(value)) walk(child, visitor, value);
}

function replaceString(value, replacements, stats) {
  let output = value;
  for (const [source, destination, label = source] of replacements) {
    if (!output.includes(source)) continue;
    const count = output.split(source).length - 1;
    output = output.split(source).join(destination);
    stats[label] = (stats[label] || 0) + count;
  }
  return output;
}

function replaceDeep(value, replacements, stats) {
  if (typeof value === "string") return replaceString(value, replacements, stats);
  if (Array.isArray(value)) return value.map((item) => replaceDeep(item, replacements, stats));
  if (!value || typeof value !== "object") return value;
  const output = {};
  for (const [key, child] of Object.entries(value)) output[key] = replaceDeep(child, replacements, stats);
  return output;
}

function hoursReplacements() {
  return [
    ["10:00 AM to 10:30 PM", canonicalHours, "opening_hours"],
    ["10 AM - 10:30 PM", canonicalHours, "opening_hours"],
    ["12:30 AM to 11:00 PM", canonicalHours, "opening_hours"],
    ["12:30 PM to 11:00 PM", canonicalHours, "opening_hours"],
    ["12:30 PM - 11 PM", canonicalHours, "opening_hours"],
  ];
}

function setHeadingLinks(elementorData, links, stats, scope = elementorData) {
  const pending = new Map(Object.entries(links));
  walk(scope, (node) => {
    if (node.elType !== "widget" || node.widgetType !== "heading" || !node.settings) return;
    const title = String(node.settings.title || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const destination = pending.get(title);
    if (!destination) return;
    node.settings.link = { ...(node.settings.link || {}), url: destination, is_external: false, nofollow: false };
    pending.delete(title);
    stats.hub_heading_links = (stats.hub_heading_links || 0) + 1;
  });
  return [...pending.keys()];
}

function makeButton(text, url, seed, templateSettings = {}) {
  const settings = clone(templateSettings);
  settings.text = text;
  settings.link = { url, is_external: false, nofollow: false };
  delete settings.__dynamic__;
  delete settings._attributes;
  return {
    id: stableId(`${seed}:button:${text}:${url}`),
    elType: "widget",
    settings,
    elements: [],
    widgetType: "button",
  };
}

function standardButtonSettings() {
  return {
    align: "center",
    align_mobile: "center",
    size: "sm",
    button_text_color: "#2A0F1B",
    background_color: "#FFFFFF",
    button_background_hover_color: "#F8EFE7",
    border_border: "solid",
    border_width: { unit: "px", top: "1", right: "1", bottom: "1", left: "1", isLinked: true },
    border_color: "#E2C8D0",
    border_radius: { unit: "px", top: "6", right: "6", bottom: "6", left: "6", isLinked: true },
    typography_typography: "custom",
    typography_font_family: "DM Sans",
    typography_font_size: { unit: "px", size: 14, sizes: [] },
    typography_font_size_mobile: { unit: "px", size: 13, sizes: [] },
    typography_font_weight: "700",
    text_padding: { unit: "px", top: "10", right: "18", bottom: "10", left: "18", isLinked: false },
    text_padding_mobile: { unit: "px", top: "9", right: "14", bottom: "9", left: "14", isLinked: false },
  };
}

function addExtraHubLinks(elementorData, pageId, items, stats) {
  if (!items || !items.length) return;
  const packageSection = elementorData[4];
  if (!packageSection) throw new Error(`Page ${pageId}: package section index 4 is missing.`);
  let headerContainer = null;
  walk(packageSection, (node) => {
    if (headerContainer || node.elType !== "container" || !Array.isArray(node.elements)) return;
    if (node.elements.some((child) => child?.widgetType === "heading" && /^Choose Your /.test(child.settings?.title || ""))) {
      headerContainer = node;
    }
  });
  if (!headerContainer) throw new Error(`Page ${pageId}: package heading container was not found.`);
  headerContainer.elements = headerContainer.elements.filter((child) => child?.settings?._element_id !== "phase2-service-links");
  headerContainer.elements.push({
    id: stableId(`${pageId}:phase2-service-links`),
    elType: "container",
    settings: {
      _element_id: "phase2-service-links",
      content_width: "full",
      flex_direction: "row",
      flex_wrap: "wrap",
      flex_justify_content: "center",
      flex_justify_content_tablet: "center",
      flex_justify_content_mobile: "center",
      flex_gap: { column: "10", row: "10", unit: "px", isLinked: true },
      flex_gap_tablet: { column: "10", row: "10", unit: "px", isLinked: true },
      flex_gap_mobile: { column: "8", row: "8", unit: "px", isLinked: true },
      margin: { unit: "px", top: "10", right: "0", bottom: "0", left: "0", isLinked: false },
    },
    elements: items.map(([text, url]) => makeButton(text, url, `${pageId}:extra`, standardButtonSettings())),
    isInner: true,
  });
  stats.hub_extra_links = items.length;
}

function updateServicesCategories(elementorData, stats) {
  let buttonContainer = null;
  let template = null;
  walk(elementorData[1], (node) => {
    if (buttonContainer || node.elType !== "container" || !Array.isArray(node.elements)) return;
    const buttons = node.elements.filter((child) => child?.widgetType === "button");
    if (buttons.length >= 6 && buttons.some((button) => button.settings?.text === "Massage")) {
      buttonContainer = node;
      template = buttons[0].settings;
    }
  });
  if (!buttonContainer || !template) throw new Error("Services page category button container was not found.");
  buttonContainer.elements = categories.map(([text, url]) => makeButton(text, url, "services-category", template));
  stats.services_category_links = categories.length;
}

function fixHomepageHotStone(elementorData, stats) {
  let targetContainer = null;
  function visit(node) {
    if (!node || typeof node !== "object") return false;
    let containsTitle = node.elType === "widget" && node.widgetType === "heading" && node.settings?.title === "Hot Stone Massage";
    for (const child of Object.values(node)) if (visit(child)) containsTitle = true;
    if (containsTitle && node.elType === "container" && !targetContainer) targetContainer = node;
    return containsTitle;
  }
  visit(elementorData);
  if (!targetContainer) throw new Error("Homepage Hot Stone Massage card was not found.");
  let changed = 0;
  walk(targetContainer, (node) => {
    if (changed || node.elType !== "widget" || !node.settings) return;
    for (const [key, value] of Object.entries(node.settings)) {
      if (typeof value !== "string" || !value.includes("AED 264")) continue;
      const occurrences = value.split("AED 264").length - 1;
      node.settings[key] = value.split("AED 264").join("AED 380");
      changed += occurrences;
    }
  });
  if (changed !== 1 && !JSON.stringify(targetContainer).includes("AED 380")) {
    throw new Error(`Homepage Hot Stone price expected one change or an existing AED 380 value, got ${changed}.`);
  }
  stats.homepage_hot_stone_price = changed;
}

function disableBlogDateArchiveLinks(elementorData, stats) {
  let changed = 0;
  walk(elementorData, (node) => {
    if (node.elType !== "widget" || node.widgetType !== "posts" || !node.settings) return;
    for (const key of ["classic_meta_data", "cards_meta_data", "full_content_meta_data"]) {
      if (!Array.isArray(node.settings[key]) || !node.settings[key].includes("date")) continue;
      node.settings[key] = node.settings[key].filter((item) => item !== "date");
      changed += 1;
    }
  });
  stats.blog_date_meta_removed = changed;
}

function disablePostDateArchiveLink(elementorData, stats) {
  let changed = 0;
  walk(elementorData, (node) => {
    if (node.elType !== "widget" || node.widgetType !== "post-info" || !Array.isArray(node.settings?.icon_list)) return;
    for (const item of node.settings.icon_list) {
      if ((item.type || "date") !== "date") continue;
      if (item.link !== "") {
        item.link = "";
        changed += 1;
      }
    }
  });
  stats.date_archive_links_disabled = changed;
}

function lintElementor(elementorData, baselineData) {
  const baseline = validateTemplate({ elementor_data: baselineData });
  const candidate = validateTemplate({ elementor_data: elementorData });
  const signature = (issue) => `${issue.severity}|${issue.path}|${issue.message}`;
  const inherited = new Set(baseline.issues.map(signature));
  const newErrors = candidate.issues.filter((issue) => issue.severity === "error" && !inherited.has(signature(issue)));
  if (newErrors.length) throw new Error(`Native lint found ${newErrors.length} new blocking error(s): ${JSON.stringify(newErrors.slice(0, 3))}`);
  return {
    new_errors: 0,
    inherited_errors: candidate.issues.filter((issue) => issue.severity === "error").length,
    warnings: candidate.issues.filter((issue) => issue.severity === "warning").length,
  };
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
    if (!response.ok) throw new Error(`${endpoint} failed with ${response.status}: ${JSON.stringify(data).slice(0, 1000)}`);
    return data;
  } catch (error) {
    if (attempt >= 3) throw error;
    await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    return apiFetch(endpoint, options, attempt + 1);
  }
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

function pageCandidate(item, payload) {
  const baseline = clone(payload.elementor_data || []);
  const stats = {};
  let data = replaceDeep(baseline, [...hoursReplacements(), ...routeReplacements], stats);
  if (Number(item.id) === 55) throw new Error("Footer template was returned as a page.");
  if (Number(item.id) === 61) updateServicesCategories(data, stats);
  if (hubLinks[item.id]) {
    const missing = setHeadingLinks(data, hubLinks[item.id], stats, data[4]);
    if (missing.length) throw new Error(`Page ${item.id}: missing package headings: ${missing.join(", ")}`);
    addExtraHubLinks(data, item.id, extraHubLinks[item.id] || [], stats);
  }
  if (Number(item.id) === 124) fixHomepageHotStone(data, stats);
  if (item.slug === "blog") disableBlogDateArchiveLinks(data, stats);
  const changed = JSON.stringify(data) !== JSON.stringify(baseline);
  return { kind: "page", id: Number(item.id), title: item.title, changed, stats, lint: changed ? lintElementor(data, baseline) : null, baseline: payload, data };
}

function templateCandidate(item, payload) {
  const baseline = clone(payload.elementor_data || []);
  const stats = {};
  let data = replaceDeep(baseline, [...hoursReplacements(), ...routeReplacements], stats);
  if (Number(item.id) === 55) data = replaceDeep(data, [["/pricing/", "/services/", "footer_pricing_link"]], stats);
  disablePostDateArchiveLink(data, stats);
  const changed = JSON.stringify(data) !== JSON.stringify(baseline);
  return { kind: "template", id: Number(item.id), title: item.title, changed, stats, lint: changed ? lintElementor(data, baseline) : null, baseline: payload, data };
}

function postCandidate(item, payload, posts) {
  const stats = {};
  const articleReplacements = posts.flatMap((post) => {
    const source = `/blog/${post.slug}/`;
    const destination = `/${post.slug}/`;
    return [
      [`https://homesalon.ae${source}`, `https://homesalon.ae${destination}`, "article_permalink"],
      [source, destination, "article_permalink"],
    ];
  });
  const replacements = [...articleReplacements, ...routeReplacements, ...hoursReplacements()];
  const content = replaceString(payload.content || "", replacements, stats);
  const excerpt = replaceString(payload.excerpt || "", replacements, stats);
  const changed = content !== (payload.content || "") || excerpt !== (payload.excerpt || "");
  return { kind: "post", id: Number(item.id), title: item.title, changed, stats, baseline: payload, content, excerpt };
}

async function main() {
  if (!baseUrl || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");
  if (baseUrl !== "https://homesalon.ae/wp-json/native-elementor/v1") throw new Error(`Unexpected bridge URL: ${baseUrl}`);
  const status = await apiFetch("status");
  if (status.site_url !== "https://homesalon.ae" || status.bridge_version !== "0.9.0") {
    throw new Error(`Unexpected bridge target: ${JSON.stringify(status)}`);
  }

  const [pageInventory, templateInventory, postInventory] = await Promise.all([
    apiFetch("pages?per_page=250&include_data=false"),
    apiFetch("templates?per_page=250&include_data=false"),
    apiFetch("posts?per_page=250"),
  ]);
  const pages = (pageInventory.pages || []).filter((item) => item.status === "publish" && item.has_elementor_data);
  const templates = (templateInventory.templates || []).filter((item) => item.status === "publish" && item.has_elementor_data);
  const posts = (postInventory.posts || []).filter((item) => item.status === "publish" && seoPostIds.has(Number(item.id)));
  if (posts.length !== 50) throw new Error(`Expected 50 published SEO posts, found ${posts.length}.`);

  const pageCandidates = await mapLimit(pages, 5, async (item) => pageCandidate(item, await apiFetch(`pages/${item.id}`)));
  const templateCandidates = await mapLimit(templates, 4, async (item) => templateCandidate(item, await apiFetch(`templates/${item.id}`)));
  const postCandidates = await mapLimit(posts, 6, async (item) => postCandidate(item, await apiFetch(`posts/${item.id}`), posts));
  const changed = [...pageCandidates, ...templateCandidates, ...postCandidates].filter((item) => item.changed);

  fs.mkdirSync(outputDir, { recursive: true });
  for (const item of changed) writeJson(path.join(outputDir, "baselines", `${item.kind}-${item.id}.json`), item.baseline);
  const report = {
    ok: true,
    dry_run: !apply,
    bridge_version: status.bridge_version,
    canonical_hours: canonicalHours,
    inventory: { pages: pages.length, templates: templates.length, seo_posts: posts.length },
    changes: changed.map(({ kind, id, title, stats, lint }) => ({ kind, id, title, stats, lint })),
    summary: {
      pages: changed.filter((item) => item.kind === "page").length,
      templates: changed.filter((item) => item.kind === "template").length,
      posts: changed.filter((item) => item.kind === "post").length,
    },
  };
  writeJson(path.join(outputDir, apply ? "apply-plan.json" : "dry-run.json"), report);

  const redirectPayload = {
    dry_run: !apply,
    redirections: [{ source: "/pricing/", destination: "/services/", type: 301, status: "active", ignore_case: true }],
  };
  report.pricing_redirect = await apiFetch("rank-math/redirections", { method: "POST", body: JSON.stringify(redirectPayload) });

  if (apply) {
    for (const item of changed) {
      if (item.kind === "page") await apiFetch(`pages/${item.id}`, { method: "PUT", body: JSON.stringify({ elementor_data: item.data }) });
      if (item.kind === "template") await apiFetch(`templates/${item.id}`, { method: "PUT", body: JSON.stringify({ elementor_data: item.data }) });
      if (item.kind === "post") await apiFetch(`posts/${item.id}`, { method: "PUT", body: JSON.stringify({ content: item.content, excerpt: item.excerpt }) });
    }
    report.cache = await apiFetch("clear-cache", { method: "POST", body: "{}" });
  }

  writeJson(path.join(outputDir, apply ? "apply-report.json" : "dry-run.json"), report);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
