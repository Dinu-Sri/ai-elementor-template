const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { validateTemplate } = require("../../../src/validator/elementor-native-lint");

const root = path.resolve(__dirname, "../../..");
const snapshotPath = path.join(root, "build/site-intake/sms-home-salon-blog-theme-builder/site-snapshot.json");
const migrationPath = path.join(root, "sites/sms-home-salon/content/client-approved-navigation-migration.json");
const outputDir = path.join(root, "build/sites/sms-home-salon/client-navigation-migration/pricing-merges");
const apply = process.argv.includes("--apply");
const baseUrl = process.env.NEB_SITE_URL;
const apiKey = process.env.NEB_API_KEY;

const mergeDefinitions = [
  {
    pageId: 1106,
    source: "/waxing/half-stomach/",
    title: "Stomach Waxing at Home in Dubai",
    oldServices: ["Half Stomach Waxing"],
    service: "Stomach Waxing",
    seoTitle: "Stomach Waxing at Home in Dubai | SMS Home Salon",
    seoDescription: "Book half or full stomach waxing at home in Dubai with Normal, Rica or Hard Wax packages and a trained female professional.",
    focusKeyword: "stomach waxing at home in Dubai",
    packages: waxPackages("Half Stomach", [60, 72, 84], "Full Stomach", [72, 84, 96]),
  },
  {
    pageId: 1116,
    source: "/waxing/half-legs/",
    title: "Legs Waxing at Home in Dubai",
    oldServices: ["Half Legs Waxing"],
    service: "Legs Waxing",
    seoTitle: "Legs Waxing at Home in Dubai | SMS Home Salon",
    seoDescription: "Book half or full legs waxing at home in Dubai with Normal, Rica or Hard Wax packages and a hygienic women-only setup.",
    focusKeyword: "legs waxing at home in Dubai",
    packages: waxPackages("Half Legs", [48, 60, 72], "Full Legs", [96, 108, 120]),
  },
  {
    pageId: 1112,
    source: "/waxing/half-arms/",
    title: "Arms Waxing at Home in Dubai",
    oldServices: ["Half Arms Waxing"],
    service: "Arms Waxing",
    seoTitle: "Arms Waxing at Home in Dubai | SMS Home Salon",
    seoDescription: "Book half or full arms waxing at home in Dubai with Normal, Rica or Hard Wax packages and a trained female professional.",
    focusKeyword: "arms waxing at home in Dubai",
    packages: waxPackages("Half Arms", [48, 60, 72], "Full Arms", [72, 84, 96]),
  },
  {
    pageId: 1122,
    source: "/waxing/full-body-without-bikini/",
    title: "Full Body Waxing at Home in Dubai",
    oldServices: ["Full Body Wax Without Bikini"],
    service: "Full Body Waxing",
    seoTitle: "Full Body Waxing at Home in Dubai | SMS Home Salon",
    seoDescription: "Book full body waxing at home in Dubai with or without bikini, using Normal, Rica or Hard Wax in a private women-only setup.",
    focusKeyword: "full body waxing at home in Dubai",
    packages: waxPackages("Without Bikini", [300, 312, 324], "With Bikini", [420, 432, 444]),
  },
  {
    pageId: 1140,
    source: "/threading/full-face-without-eyebrows/",
    title: "Full Face Threading at Home in Dubai",
    oldServices: ["Full Face Threading Without Eyebrows"],
    service: "Full Face Threading",
    seoTitle: "Full Face Threading at Home in Dubai | SMS Home Salon",
    seoDescription: "Book full face threading at home in Dubai with or without eyebrow shaping, delivered by a trained female beauty professional.",
    focusKeyword: "full face threading at home in Dubai",
    packages: [
      { label: "Full Face Without Eyebrows", price: "AED 96", description: "Full face threading without eyebrow shaping." },
      { label: "Full Face With Eyebrows", price: "AED 120", description: "Full face threading including eyebrow shaping." },
    ],
  },
];

function waxPackages(firstArea, firstPrices, secondArea, secondPrices) {
  const waxes = ["Normal Wax", "Rica Wax", "Hard Wax"];
  return [
    ...waxes.map((wax, index) => ({
      label: `${firstArea} - ${wax}`,
      price: `AED ${firstPrices[index]}`,
      description: `${firstArea} ${wax.toLowerCase()} delivered at home with a clean professional setup.`,
    })),
    ...waxes.map((wax, index) => ({
      label: `${secondArea} - ${wax}`,
      price: `AED ${secondPrices[index]}`,
      description: `${secondArea} ${wax.toLowerCase()} delivered at home with a clean professional setup.`,
    })),
  ];
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function walk(value, visitor) {
  if (!value || typeof value !== "object") return;
  visitor(value);
  for (const child of Object.values(value)) walk(child, visitor);
}

function refreshIds(value, seed) {
  let index = 0;
  walk(value, (node) => {
    if (typeof node.id === "string") {
      node.id = crypto.createHash("md5").update(`${seed}:${index++}:${node.id}`).digest("hex").slice(0, 7);
    }
  });
}

function removeMostPopular(value) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value.elements)) {
    value.elements = value.elements.filter((child) => !(child?.widgetType === "heading" && child?.settings?.title === "Most Popular"));
    value.elements.forEach(removeMostPopular);
  }
}

function durationFromLabel(label) {
  const match = String(label).match(/(\d+)\s*[- ]?Minute/i);
  return match ? `${match[1]} min` : "Package";
}

function updateCard(card, item, pageDefinition, isFirst) {
  if (!isFirst) removeMostPopular(card);
  const headings = [];
  const editors = [];
  const buttons = [];
  walk(card, (node) => {
    if (node?.elType !== "widget" || !node.settings) return;
    if (node.widgetType === "heading") headings.push(node);
    if (node.widgetType === "text-editor") editors.push(node);
    if (node.widgetType === "button") buttons.push(node);
  });
  const titleHeading = headings.find((node) => {
    const value = node.settings.title || "";
    return !["Most Popular", "Duration", "Price", "From"].includes(value)
      && !/^(\d+\s*min|Package|AED\b)/i.test(value);
  });
  const durationHeading = headings.find((node) => /^(\d+\s*min|Package)$/i.test(node.settings.title || ""));
  const priceHeadings = headings.filter((node) => /^AED\b/i.test(node.settings.title || ""));
  if (!titleHeading || !priceHeadings.length || !buttons[0]) {
    throw new Error(`${pageDefinition.pageId}: package card structure was not recognised.`);
  }
  titleHeading.settings.title = item.label;
  if (durationHeading) durationHeading.settings.title = durationFromLabel(item.label);
  priceHeadings.forEach((node) => { node.settings.title = item.price; });
  if (editors[0]) editors[0].settings.editor = `<p>${item.description || `${item.label} delivered at home with a clean professional setup.`}</p>`;
  buttons[0].settings.text = `Book ${pageDefinition.service}`;
  buttons[0].settings.link = { url: "", is_external: false, nofollow: false };
  buttons[0].settings._attributes = `data-service|${pageDefinition.service}\ndata-cta|Book ${pageDefinition.service}`;
}

function replacePackageCards(elements, definition) {
  const container = elements?.[4]?.elements?.[0]?.elements?.[1]?.elements;
  if (!Array.isArray(container) || !container.length) {
    throw new Error(`${definition.pageId}: package card container was not found.`);
  }
  const template = clone(container[0]);
  const cards = definition.packages.map((item, index) => {
    const card = clone(template);
    if (index > 0) refreshIds(card, `${definition.pageId}-package-${index}`);
    updateCard(card, item, definition, index === 0);
    return card;
  });
  container.splice(0, container.length, ...cards);
}

function setHeading(elements, id, title) {
  walk(elements, (node) => {
    if (node.id === id && node.settings) node.settings.title = title;
  });
}

function replaceServiceCopy(elements, definition) {
  for (const oldService of definition.oldServices || []) {
    const oldLower = oldService.toLowerCase();
    const serviceLower = definition.service.toLowerCase();
    walk(elements, (node) => {
      if (!node.settings) return;
      for (const [key, value] of Object.entries(node.settings)) {
        if (typeof value !== "string") continue;
        node.settings[key] = value
          .split(oldService).join(definition.service)
          .split(oldLower).join(serviceLower);
      }
    });
  }
  setHeading(elements, "c3c1cb4", definition.title);
  setHeading(elements, "8ec27f0", `Start From ${definition.packages[0].price}`);
  setHeading(elements, "c147134", `Choose Your ${definition.service} Package`);
  setHeading(elements, "879001d", `Book Your ${definition.service} at Home`);
  let heroButtons = 0;
  let packageAnchors = 0;
  walk(elements, (node) => {
    if (node?.elType !== "widget" || node.widgetType !== "button" || !node.settings) return;
    if (node.settings.text === "Book Now") {
      node.settings.link = { url: "", is_external: false, nofollow: false };
      node.settings._attributes = `data-service|${definition.service}\ndata-cta|Book ${definition.service}`;
      heroButtons += 1;
    }
    if (node.settings.text === "View Packages") {
      node.settings.link = { url: "#packages", is_external: false, nofollow: false };
      packageAnchors += 1;
    }
  });
  if (heroButtons !== 1 || packageAnchors !== 1) {
    throw new Error(`${definition.pageId}: hero button contract failed.`);
  }
}

function buildPricingDefinitions(migration) {
  const serviceById = {
    389: "Pregnancy Massage",
    396: "Acrylic Nail Extensions",
    1038: "Full Body Massage",
    1044: "Head and Shoulder Massage",
    1046: "Head Massage",
    1048: "Head and Neck Massage",
    1050: "Shoulder Massage",
  };
  return migration.pricing_updates.map((item) => ({
    pageId: Number(item.page_id),
    source: item.source,
    service: serviceById[Number(item.page_id)],
    packages: item.packages.map((entry) => ({
      label: entry.label,
      price: entry.price,
      description: `${entry.label} delivered at home with a clean professional setup.`,
    })),
  }));
}

function lintResult(payload) {
  const strict = validateTemplate(payload);
  const errors = strict.issues.filter((issue) => issue.severity === "error");
  return {
    strict_ok: strict.ok,
    ok: errors.length === 0,
    score: strict.score,
    issue_count: strict.issue_count,
    blocking_issue_count: errors.length,
    inherited_warning_count: strict.issues.filter((issue) => issue.severity === "warning").length,
    issues: strict.issues,
  };
}

function inspectPackageContract(elements, definition) {
  const cards = elements?.[4]?.elements?.[0]?.elements?.[1]?.elements || [];
  const prices = [];
  const labels = [];
  const relevantAttrs = [];
  let viewPackagesSameTab = false;
  walk(elements, (node) => {
    if (node?.widgetType === "heading" && /^AED\b/i.test(node.settings?.title || "")) prices.push(node.settings.title);
    if (node?.widgetType === "button") {
      if (node.settings?.text === "View Packages") {
        viewPackagesSameTab = node.settings.link?.url === "#packages" && node.settings.link?.is_external === false;
      }
      if (node.settings?.text === "Book Now" || node.settings?.text === `Book ${definition.service}`) {
        relevantAttrs.push(node.settings?._attributes || "");
      }
    }
  });
  for (const card of cards) {
    let label = "";
    walk(card, (node) => {
      if (label || node?.widgetType !== "heading") return;
      const value = node.settings?.title || "";
      if (!["Most Popular", "Duration", "Price", "From"].includes(value) && !/^(\d+\s*min|Package|AED\b)/i.test(value)) label = value;
    });
    labels.push(label);
  }
  const expectedPrices = definition.packages.map((item) => item.price);
  const expectedLabels = definition.packages.map((item) => item.label);
  return {
    card_count: cards.length,
    expected_card_count: definition.packages.length,
    labels,
    expected_labels: expectedLabels,
    labels_match: JSON.stringify(labels) === JSON.stringify(expectedLabels),
    expected_prices_present: expectedPrices.every((price) => prices.includes(price)),
    view_packages_same_tab: viewPackagesSameTab,
    popup_attributes_ok: relevantAttrs.length === definition.packages.length + 1
      && relevantAttrs.every((value) => value === `data-service|${definition.service}\ndata-cta|Book ${definition.service}`),
  };
}

function buildCandidates(snapshot, migration) {
  const byId = new Map(snapshot.pages.map((page) => [Number(page.id), page]));
  const pricing = buildPricingDefinitions(migration);
  const definitions = [...pricing, ...mergeDefinitions];
  const candidates = definitions.map((definition) => {
    const source = byId.get(definition.pageId);
    if (!source) throw new Error(`${definition.pageId}: page missing from snapshot.`);
    const livePath = new URL(source.url).pathname;
    if (livePath.replace(/\/$/, "") !== definition.source.replace(/\/$/, "")) {
      throw new Error(`${definition.pageId}: expected ${definition.source}, snapshot has ${livePath}.`);
    }
    if (source.status !== "publish") throw new Error(`${definition.pageId}: expected published source, got ${source.status}.`);
    const elementorData = clone(source.elementor_data);
    if (definition.oldServices) replaceServiceCopy(elementorData, definition);
    else {
      setHeading(elementorData, "8ec27f0", `Start From ${definition.packages[0].price}`);
      walk(elementorData, (node) => {
        if (node?.widgetType !== "button" || !node.settings) return;
        if (node.settings.text === "Book Now") {
          node.settings.link = { url: "", is_external: false, nofollow: false };
          node.settings._attributes = `data-service|${definition.service}\ndata-cta|Book ${definition.service}`;
        }
        if (node.settings.text === "View Packages") {
          node.settings.link = { url: "#packages", is_external: false, nofollow: false };
        }
      });
    }
    replacePackageCards(elementorData, definition);
    const payload = {
      id: definition.pageId,
      title: definition.title || source.title,
      status: source.status,
      slug: source.slug,
      parent_id: source.parent_id,
      menu_order: source.menu_order,
      template: source.template,
      page_settings: clone(source.page_settings || {}),
      elementor_data: elementorData,
    };
    if (definition.seoTitle) payload.seo_title = definition.seoTitle;
    if (definition.seoDescription) payload.seo_description = definition.seoDescription;
    if (definition.focusKeyword) payload.focus_keyword = definition.focusKeyword;
    return { definition, source, payload, lint: lintResult(payload), contract: inspectPackageContract(elementorData, definition) };
  });
  return candidates;
}

function assertCandidates(candidates) {
  const failures = [];
  for (const candidate of candidates) {
    const { definition, lint, contract } = candidate;
    if (!lint.ok) failures.push(`${definition.pageId}: ${lint.blocking_issue_count} blocking lint errors`);
    if (contract.card_count !== contract.expected_card_count) failures.push(`${definition.pageId}: card count mismatch`);
    if (!contract.labels_match) failures.push(`${definition.pageId}: package labels mismatch`);
    if (!contract.expected_prices_present) failures.push(`${definition.pageId}: expected price missing`);
    if (!contract.view_packages_same_tab) failures.push(`${definition.pageId}: View Packages anchor invalid`);
    if (!contract.popup_attributes_ok) failures.push(`${definition.pageId}: popup attributes invalid`);
  }
  if (failures.length) throw new Error(`Candidate validation failed:\n- ${failures.join("\n- ")}`);
}

async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`, {
    ...options,
    headers: { "X-API-Key": apiKey, "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!response.ok) throw new Error(`${endpoint} failed with ${response.status}: ${JSON.stringify(data).slice(0, 1200)}`);
  return data;
}

async function verifyLiveSource(candidate) {
  const current = await apiFetch(`pages/${candidate.definition.pageId}`);
  const currentPath = new URL(current.url).pathname;
  if (currentPath.replace(/\/$/, "") !== candidate.definition.source.replace(/\/$/, "")) {
    throw new Error(`${candidate.definition.pageId}: live URL drifted to ${currentPath}.`);
  }
  if (current.status !== "publish") throw new Error(`${candidate.definition.pageId}: live status drifted to ${current.status}.`);
  fs.writeFileSync(path.join(outputDir, "baselines", `${candidate.definition.pageId}.pre-update.json`), `${JSON.stringify(current, null, 2)}\n`);
  return current;
}

async function main() {
  fs.mkdirSync(path.join(outputDir, "baselines"), { recursive: true });
  fs.mkdirSync(path.join(outputDir, "candidates"), { recursive: true });
  fs.mkdirSync(path.join(outputDir, "exports"), { recursive: true });
  const snapshot = readJson(snapshotPath);
  const migration = readJson(migrationPath);
  const candidates = buildCandidates(snapshot, migration);
  assertCandidates(candidates);
  for (const candidate of candidates) {
    fs.writeFileSync(path.join(outputDir, "candidates", `${candidate.definition.pageId}.json`), `${JSON.stringify(candidate.payload, null, 2)}\n`);
  }
  const preflight = candidates.map((candidate) => ({
    id: candidate.definition.pageId,
    source: candidate.definition.source,
    package_count: candidate.definition.packages.length,
    lint: candidate.lint,
    contract: candidate.contract,
  }));
  fs.writeFileSync(path.join(outputDir, "preflight-report.json"), `${JSON.stringify(preflight, null, 2)}\n`);
  if (!apply) {
    console.log(JSON.stringify({ ok: true, apply: false, pages: candidates.length, packages: candidates.reduce((sum, item) => sum + item.definition.packages.length, 0), blocking_errors: preflight.reduce((sum, item) => sum + item.lint.blocking_issue_count, 0), outputDir }, null, 2));
    return;
  }
  if (!baseUrl || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required with --apply.");
  if (baseUrl.replace(/\/$/, "") !== "https://homesalon.ae/wp-json/native-elementor/v1") throw new Error(`Unexpected bridge URL: ${baseUrl}`);
  const status = await apiFetch("status");
  if (status.site_url !== "https://homesalon.ae" || status.bridge_version !== "0.8.7") throw new Error(`Unexpected bridge target: ${JSON.stringify(status)}`);

  const results = [];
  for (const candidate of candidates) {
    const before = await verifyLiveSource(candidate);
    const body = clone(candidate.payload);
    delete body.id;
    await apiFetch(`pages/${candidate.definition.pageId}`, { method: "PUT", body: JSON.stringify(body) });
    const exported = await apiFetch(`pages/${candidate.definition.pageId}`);
    fs.writeFileSync(path.join(outputDir, "exports", `${candidate.definition.pageId}.post-update.json`), `${JSON.stringify(exported, null, 2)}\n`);
    const lint = lintResult(exported);
    const contract = inspectPackageContract(exported.elementor_data, candidate.definition);
    const beforePath = new URL(before.url).pathname;
    const afterPath = new URL(exported.url).pathname;
    const invariant = {
      url_unchanged: beforePath === afterPath,
      status_unchanged: before.status === exported.status && exported.status === "publish",
      parent_unchanged: Number(before.parent_id) === Number(exported.parent_id),
    };
    if (!lint.ok || !contract.labels_match || !contract.expected_prices_present || !contract.view_packages_same_tab || !contract.popup_attributes_ok || !Object.values(invariant).every(Boolean)) {
      throw new Error(`${candidate.definition.pageId}: post-save verification failed.`);
    }
    results.push({ id: candidate.definition.pageId, title: exported.title, url: exported.url, package_count: contract.card_count, lint, contract, invariant });
    console.log(`verified ${candidate.definition.pageId} ${exported.url} (${contract.card_count} packages)`);
  }
  const redirects = await apiFetch("rank-math/redirections");
  if (Number(redirects.count) !== 0) throw new Error(`Redirect inventory changed unexpectedly to ${redirects.count}.`);
  const report = { generated_at: new Date().toISOString(), operation: "pricing-and-content-merges", status, results, redirect_count: redirects.count };
  fs.writeFileSync(path.join(outputDir, "deployment-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, updated: results.length, package_cards: results.reduce((sum, item) => sum + item.package_count, 0), redirect_count: redirects.count, outputDir }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
