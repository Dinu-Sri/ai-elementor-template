const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { validateTemplate } = require("../../../src/validator/elementor-native-lint");

const root = path.resolve(__dirname, "../../..");
const sourcePath = path.join(root, "sites/sms-home-salon/content/right-for-you-content.json");
const outputDir = path.join(root, "build/sites/sms-home-salon/right-for-you-update");
const apply = process.argv.includes("--apply");
const baseUrl = String(process.env.NEB_SITE_URL || "").replace(/\/$/, "");
const apiKey = process.env.NEB_API_KEY;
const expectedSite = "https://homesalon.ae";
const expectedBridge = "0.9.0";

const icons = {
  aftercare: { value: "fas fa-leaf", library: "fa-solid" },
  back: { value: "fas fa-user", library: "fa-solid" },
  balance: { value: "fas fa-balance-scale", library: "fa-solid" },
  bright: { value: "fas fa-sun", library: "fa-solid" },
  brow: { value: "far fa-eye", library: "fa-regular" },
  calendar: { value: "far fa-calendar-check", library: "fa-regular" },
  care: { value: "fas fa-heart", library: "fa-solid" },
  clean: { value: "fas fa-star", library: "fa-solid" },
  clock: { value: "far fa-clock", library: "fa-regular" },
  color: { value: "fas fa-palette", library: "fa-solid" },
  comfort: { value: "fas fa-spa", library: "fa-solid" },
  contour: { value: "fas fa-star", library: "fa-solid" },
  curl: { value: "fas fa-magic", library: "fa-solid" },
  cut: { value: "fas fa-cut", library: "fa-solid" },
  desk: { value: "fas fa-desktop", library: "fa-solid" },
  diamond: { value: "far fa-gem", library: "fa-regular" },
  durable: { value: "fas fa-shield-alt", library: "fa-solid" },
  even: { value: "fas fa-check-circle", library: "fa-solid" },
  exfoliate: { value: "fas fa-magic", library: "fa-solid" },
  eye: { value: "far fa-eye", library: "fa-regular" },
  face: { value: "far fa-smile", library: "fa-regular" },
  feather: { value: "fas fa-feather-alt", library: "fa-solid" },
  fire: { value: "fas fa-fire", library: "fa-solid" },
  flow: { value: "fas fa-water", library: "fa-solid" },
  foot: { value: "fas fa-shoe-prints", library: "fa-solid" },
  french: { value: "fas fa-paint-brush", library: "fa-solid" },
  fresh: { value: "fas fa-sun", library: "fa-solid" },
  full_body: { value: "fas fa-user", library: "fa-solid" },
  glow: { value: "fas fa-sun", library: "fa-solid" },
  gold: { value: "fas fa-medal", library: "fa-solid" },
  hair: { value: "fas fa-cut", library: "fa-solid" },
  hand: { value: "far fa-hand-paper", library: "fa-regular" },
  head: { value: "far fa-smile", library: "fa-regular" },
  heart: { value: "fas fa-heart", library: "fa-solid" },
  home: { value: "fas fa-home", library: "fa-solid" },
  hydration: { value: "fas fa-tint", library: "fa-solid" },
  kids: { value: "fas fa-child", library: "fa-solid" },
  mask: { value: "fas fa-spa", library: "fa-solid" },
  measure: { value: "fas fa-ruler", library: "fa-solid" },
  mobility: { value: "fas fa-running", library: "fa-solid" },
  nails: { value: "far fa-hand-paper", library: "fa-regular" },
  natural: { value: "fas fa-leaf", library: "fa-solid" },
  options: { value: "fas fa-list-ul", library: "fa-solid" },
  pearl: { value: "far fa-gem", library: "fa-regular" },
  precision: { value: "fas fa-bullseye", library: "fa-solid" },
  pressure: { value: "fas fa-hand-point-up", library: "fa-solid" },
  privacy: { value: "fas fa-user-shield", library: "fa-solid" },
  professional: { value: "fas fa-user-check", library: "fa-solid" },
  relax: { value: "fas fa-spa", library: "fa-solid" },
  shape: { value: "fas fa-star", library: "fa-solid" },
  smooth: { value: "fas fa-feather-alt", library: "fa-solid" },
  soft: { value: "fas fa-feather-alt", library: "fa-solid" },
  sparkle: { value: "fas fa-magic", library: "fa-solid" },
  strength: { value: "fas fa-shield-alt", library: "fa-solid" },
  stretch: { value: "fas fa-expand-arrows-alt", library: "fa-solid" },
  style: { value: "fas fa-wind", library: "fa-solid" },
  target: { value: "fas fa-bullseye", library: "fa-solid" },
  thread: { value: "fas fa-bullseye", library: "fa-solid" },
  tools: { value: "fas fa-toolbox", library: "fa-solid" },
  warmth: { value: "fas fa-fire", library: "fa-solid" },
  wax: { value: "fas fa-feather-alt", library: "fa-solid" },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function hash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
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

function walk(value, visitor, parent = null) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const child of value) walk(child, visitor, parent);
    return;
  }
  visitor(value, parent);
  for (const [key, child] of Object.entries(value)) {
    if (key === "elements" && Array.isArray(child)) {
      for (const element of child) walk(element, visitor, value);
    } else {
      walk(child, visitor, value);
    }
  }
}

function directWidget(container, type) {
  return (container.elements || []).find((element) => element?.elType === "widget" && element.widgetType === type);
}

function hasHeading(value, title) {
  let found = false;
  walk(value, (node) => {
    if (node?.widgetType === "heading" && decode(node.settings?.title) === title) found = true;
  });
  return found;
}

function locateGuide(elements, definition) {
  const guideName = definition.guide_name || definition.service;
  const topLevelIndex = elements.findIndex((section) => {
    let found = false;
    walk(section, (node) => {
      if (node?.widgetType === "heading" && /^Is .+ Right for You\?$/.test(decode(node.settings?.title))) found = true;
    });
    return found;
  });
  if (topLevelIndex < 0) throw new Error(`${definition.id}: Right for You guide section was not found.`);
  const section = elements[topLevelIndex];
  let header = null;
  walk(section, (node) => {
    if (header || node?.elType !== "container") return;
    const headings = (node.elements || []).filter((item) => item?.widgetType === "heading");
    if (headings.some((item) => /^Is .+ Right for You\?$/.test(decode(item.settings?.title))) && directWidget(node, "text-editor")) header = node;
  });
  if (!header) throw new Error(`${definition.id}: guide header structure was not recognised.`);
  const eyebrow = (header.elements || []).find((item) => item?.widgetType === "heading" && / Guide$/.test(decode(item.settings?.title)));
  const heading = (header.elements || []).find((item) => item?.widgetType === "heading" && /^Is .+ Right for You\?$/.test(decode(item.settings?.title)));
  if (!eyebrow || !heading) throw new Error(`${definition.id}: guide labels were not found.`);
  const cards = [];
  walk(section, (node) => {
    if (node?.elType !== "container") return;
    if (directWidget(node, "icon") && directWidget(node, "heading") && directWidget(node, "text-editor")) cards.push(node);
  });
  if (cards.length !== 6) throw new Error(`${definition.id}: expected six guide cards, found ${cards.length}.`);
  return { section, topLevelIndex, guideName, eyebrow, heading, intro: directWidget(header, "text-editor"), cards };
}

function cardPlan(source, definition) {
  return [
    { title: "Best For", text: definition.best_for, icon: definition.best_icon },
    ...source.common_cards,
    ...definition.focus,
  ];
}

function updateCard(card, content, pageId) {
  const icon = directWidget(card, "icon");
  const heading = directWidget(card, "heading");
  const text = directWidget(card, "text-editor");
  if (!icon || !heading || !text || !icons[content.icon]) throw new Error(`${pageId}: invalid guide card or icon token ${content.icon}.`);
  icon.settings.selected_icon = clone(icons[content.icon]);
  heading.settings.title = content.title;
  text.settings.editor = `<p>${content.text}</p>`;
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

function inspectContract(elements, source, definition) {
  const guide = locateGuide(elements, definition);
  const expected = cardPlan(source, definition).map((item) => ({ ...item, selected_icon: icons[item.icon] }));
  const actual = guide.cards.map((card) => ({
    title: decode(directWidget(card, "heading")?.settings?.title),
    text: decode(directWidget(card, "text-editor")?.settings?.editor),
    icon: cardPlanIcon(directWidget(card, "icon")?.settings?.selected_icon),
  }));
  const comparableExpected = expected.map((item) => ({ title: item.title, text: item.text, icon: cardPlanIcon(item.selected_icon) }));
  if (decode(guide.eyebrow.settings?.title) !== `${guide.guideName} Guide`) throw new Error(`${definition.id}: guide eyebrow does not match the source.`);
  if (decode(guide.heading.settings?.title) !== `Is ${guide.guideName} Right for You?`) throw new Error(`${definition.id}: guide heading does not match the source.`);
  if (decode(guide.intro?.settings?.editor) !== definition.intro) throw new Error(`${definition.id}: guide intro does not match the source.`);
  if (JSON.stringify(actual) !== JSON.stringify(comparableExpected)) throw new Error(`${definition.id}: guide card contract does not match the source.`);
  return { intro: definition.intro, cards: actual };
}

function cardPlanIcon(value) {
  return { value: value?.value || "", library: value?.library || "" };
}

function assertOnlyGuideChanged(before, after, definition) {
  if (before.length !== after.length) throw new Error(`${definition.id}: top-level Elementor section count changed.`);
  const changedIndexes = [];
  for (let index = 0; index < before.length; index += 1) {
    if (hash(before[index]) !== hash(after[index])) changedIndexes.push(index);
  }
  if (changedIndexes.length !== 1) throw new Error(`${definition.id}: expected one changed top-level section, got ${changedIndexes.join(", ")}.`);
  const guideName = definition.guide_name || definition.service;
  const expectedHeading = `Is ${guideName} Right for You?`;
  if (!hasHeading(after[changedIndexes[0]], expectedHeading)) throw new Error(`${definition.id}: changed section is not the expected guide.`);
  return changedIndexes[0];
}

function buildCandidate(page, source, definition) {
  const before = clone(page.elementor_data || []);
  const after = clone(before);
  const guide = locateGuide(after, definition);
  guide.eyebrow.settings.title = `${guide.guideName} Guide`;
  guide.heading.settings.title = `Is ${guide.guideName} Right for You?`;
  guide.intro.settings.editor = `<p>${definition.intro}</p>`;
  cardPlan(source, definition).forEach((content, index) => updateCard(guide.cards[index], content, definition.id));
  const changed = hash(before) !== hash(after);
  const changedTopLevelIndex = changed ? assertOnlyGuideChanged(before, after, definition) : null;
  const lint = lintDelta(before, after);
  if (!lint.ok) throw new Error(`${definition.id}: native lint found ${lint.new_errors.length} new blocking error(s).`);
  const contract = inspectContract(after, source, definition);
  return { before, after, changed, changedTopLevelIndex, lint, contract };
}

function validateSource(source) {
  if (source.site !== expectedSite || !Array.isArray(source.pages) || source.pages.length !== 76) {
    throw new Error("Right for You content source must contain 76 homesalon.ae pages.");
  }
  if (!Array.isArray(source.common_cards) || source.common_cards.length !== 3) throw new Error("Exactly three common cards are required.");
  const ids = new Set();
  const paths = new Set();
  const intros = new Set();
  const specificCards = new Set();
  for (const definition of source.pages) {
    if (ids.has(Number(definition.id)) || paths.has(definition.path)) throw new Error(`${definition.id}: duplicate ID or path.`);
    ids.add(Number(definition.id));
    paths.add(definition.path);
    if (!definition.path.startsWith("/") || !definition.service || !definition.intro || !definition.best_for || !icons[definition.best_icon]) {
      throw new Error(`${definition.id}: invalid page content definition.`);
    }
    if (definition.guide_name && definition.guide_name.length > 48) throw new Error(`${definition.id}: guide name is too long.`);
    if (intros.has(definition.intro)) throw new Error(`${definition.id}: guide intro is not unique.`);
    intros.add(definition.intro);
    if (!Array.isArray(definition.focus) || definition.focus.length !== 2) throw new Error(`${definition.id}: exactly two focus cards are required.`);
    const specific = [{ title: "Best For", text: definition.best_for, icon: definition.best_icon }, ...definition.focus];
    for (const card of specific) {
      if (!card.title || !card.text || !icons[card.icon]) throw new Error(`${definition.id}: invalid service-specific card.`);
      const signature = `${card.title}: ${card.text}`;
      if (specificCards.has(signature)) throw new Error(`${definition.id}: service-specific card is not unique.`);
      specificCards.add(signature);
    }
    const allText = [definition.intro, definition.best_for, ...definition.focus.flatMap((card) => [card.title, card.text])].join(" ");
    if (/\p{Extended_Pictographic}/u.test(allText)) throw new Error(`${definition.id}: emoji remains in the content source.`);
    if (definition.intro.length > 150 || definition.best_for.length > 120 || definition.focus.some((card) => card.title.length > 36 || card.text.length > 120)) {
      throw new Error(`${definition.id}: content exceeds the responsive length contract.`);
    }
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
    if (!response.ok) throw new Error(`${endpoint} failed with ${response.status}: ${JSON.stringify(data).slice(0, 1200)}`);
    return data;
  } catch (error) {
    if (attempt >= 3) throw error;
    await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    return apiFetch(endpoint, options, attempt + 1);
  }
}

function assertTarget(status) {
  if (baseUrl !== `${expectedSite}/wp-json/native-elementor/v1`) throw new Error(`Unexpected bridge URL: ${baseUrl}`);
  if (status.site_url !== expectedSite || status.bridge_version !== expectedBridge) throw new Error(`Unexpected bridge target: ${JSON.stringify(status)}`);
}

function assertPage(page, definition) {
  const actualPath = new URL(page.url).pathname.replace(/\/$/, "");
  const expectedPath = definition.path.replace(/\/$/, "");
  if (Number(page.id) !== Number(definition.id) || actualPath !== expectedPath) throw new Error(`${definition.id}: expected ${definition.path}, got ${page.url}.`);
  const expectedTitles = new Set([definition.service, `${definition.service} at Home in Dubai`]);
  if (!expectedTitles.has(page.title) || page.status !== "publish" || !Array.isArray(page.elementor_data)) {
    throw new Error(`${definition.id}: expected the published ${definition.service} native Elementor page.`);
  }
}

function pageInvariants(before, after) {
  return {
    id_unchanged: Number(before.id) === Number(after.id),
    title_unchanged: before.title === after.title,
    url_unchanged: before.url === after.url,
    slug_unchanged: before.slug === after.slug,
    status_unchanged: before.status === after.status && after.status === "publish",
    parent_unchanged: Number(before.parent_id) === Number(after.parent_id),
  };
}

async function mapLimit(items, limit, worker) {
  const output = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      output[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return output;
}

async function verifyPublic(definition, source) {
  const response = await fetch(`${expectedSite}${definition.path}?right-for-you-qa=${Date.now()}`, {
    signal: AbortSignal.timeout(90000),
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  });
  const html = await response.text();
  if (!response.ok) throw new Error(`${definition.id}: public page returned ${response.status}.`);
  const text = decode(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " "));
  const expected = [
    `Is ${definition.guide_name || definition.service} Right for You?`,
    definition.intro,
    ...cardPlan(source, definition).flatMap((card) => [card.title, card.text]),
  ];
  const missing = expected.filter((value) => !text.includes(value));
  if (missing.length) throw new Error(`${definition.id}: public page is missing ${missing.length} guide value(s).`);
  if (text.includes("warm stone relaxation massage") && definition.service !== "Hot Stone Massage") {
    throw new Error(`${definition.id}: stale warm-stone guide copy remains public.`);
  }
  return { id: definition.id, url: response.url, status: response.status, expected_values: expected.length, missing: 0 };
}

async function main() {
  if (!baseUrl || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");
  const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  validateSource(source);
  const status = await apiFetch("status");
  assertTarget(status);
  const snapshot = await apiFetch("site-snapshot?include_data=true");
  if (!snapshot.ok || !snapshot.include_data || snapshot.status?.site_url !== expectedSite) throw new Error("Fresh full-site snapshot did not return expected production data.");

  fs.mkdirSync(path.join(outputDir, "baselines"), { recursive: true });
  fs.mkdirSync(path.join(outputDir, "candidates"), { recursive: true });
  fs.mkdirSync(path.join(outputDir, "exports"), { recursive: true });
  writeJson(path.join(outputDir, "site-snapshot.pre-update.json"), snapshot);
  const pages = new Map((snapshot.pages || []).map((page) => [Number(page.id), page]));
  const candidates = source.pages.map((definition) => {
    const page = pages.get(Number(definition.id));
    if (!page) throw new Error(`${definition.id}: target missing from full-site snapshot.`);
    assertPage(page, definition);
    writeJson(path.join(outputDir, "baselines", `${definition.id}.pre-update.json`), page);
    const candidate = buildCandidate(page, source, definition);
    writeJson(path.join(outputDir, "candidates", `${definition.id}.elementor.json`), candidate.after);
    return { definition, page, ...candidate };
  });

  const preflight = {
    generated_at: new Date().toISOString(),
    dry_run: !apply,
    operation: "update-existing-right-for-you-sections",
    status,
    pages: candidates.map((candidate) => ({
      id: candidate.definition.id,
      title: candidate.page.title,
      url: candidate.page.url,
      changed: candidate.changed,
      changed_top_level_index: candidate.changedTopLevelIndex,
      lint: candidate.lint,
      contract: candidate.contract,
    })),
  };
  writeJson(path.join(outputDir, "preflight-report.json"), preflight);
  if (!apply) {
    console.log(JSON.stringify({ ok: true, dry_run: true, pages: candidates.length, changed: candidates.filter((candidate) => candidate.changed).length, new_lint_errors: 0, outputDir }, null, 2));
    return;
  }

  const results = [];
  for (const candidate of candidates.filter((item) => item.changed)) {
    const latest = await apiFetch(`pages/${candidate.definition.id}`);
    assertPage(latest, candidate.definition);
    if (hash(latest.elementor_data) !== hash(candidate.before)) throw new Error(`${candidate.definition.id}: live Elementor data changed after preflight.`);
    await apiFetch(`pages/${candidate.definition.id}`, { method: "PUT", body: JSON.stringify({ elementor_data: candidate.after }) });
    const saved = await apiFetch(`pages/${candidate.definition.id}`);
    writeJson(path.join(outputDir, "exports", `${candidate.definition.id}.post-update.json`), saved);
    const lint = lintDelta(candidate.before, saved.elementor_data || []);
    const contract = inspectContract(saved.elementor_data, source, candidate.definition);
    const invariants = pageInvariants(candidate.page, saved);
    assertOnlyGuideChanged(candidate.before, saved.elementor_data, candidate.definition);
    if (!lint.ok || !Object.values(invariants).every(Boolean)) throw new Error(`${candidate.definition.id}: post-save verification failed.`);
    results.push({ id: candidate.definition.id, title: saved.title, url: saved.url, lint, contract, invariants });
    console.log(`verified ${results.length}/${candidates.filter((item) => item.changed).length}: ${candidate.definition.id} ${saved.url}`);
  }

  const cache = await apiFetch("clear-cache", { method: "POST", body: "{}" });
  const postSnapshot = await apiFetch("site-snapshot?include_data=true");
  if (!postSnapshot.ok || !postSnapshot.include_data || postSnapshot.status?.site_url !== expectedSite) {
    throw new Error("Post-update full-site snapshot did not return expected production data.");
  }
  writeJson(path.join(outputDir, "site-snapshot.post-update.json"), postSnapshot);
  const postPages = new Map((postSnapshot.pages || []).map((page) => [Number(page.id), page]));
  const fullSnapshotChecks = source.pages.map((definition) => {
    const before = pages.get(Number(definition.id));
    const after = postPages.get(Number(definition.id));
    if (!after) throw new Error(`${definition.id}: target missing from post-update full-site snapshot.`);
    assertPage(after, definition);
    const candidate = buildCandidate(after, source, definition);
    if (candidate.changed) throw new Error(`${definition.id}: post-update snapshot does not match the content source.`);
    if (hash(before.page_settings || {}) !== hash(after.page_settings || {})) {
      throw new Error(`${definition.id}: page settings changed during the update.`);
    }
    return { id: definition.id, content_locked: true, page_settings_unchanged: true, lint: candidate.lint };
  });
  const publicChecks = await mapLimit(source.pages, 5, (definition) => verifyPublic(definition, source));
  const report = {
    generated_at: new Date().toISOString(),
    operation: "update-existing-right-for-you-sections",
    status,
    results,
    unchanged_page_ids: candidates.filter((candidate) => !candidate.changed).map((candidate) => candidate.definition.id),
    cache,
    full_snapshot_checks: fullSnapshotChecks,
    public_checks: publicChecks,
  };
  writeJson(path.join(outputDir, "deployment-report.json"), report);
  console.log(JSON.stringify({ ok: true, dry_run: false, updated: results.length, unchanged: candidates.length - results.length, public_checks: publicChecks.length, outputDir }, null, 2));
}

module.exports = { buildCandidate, inspectContract, validateSource };

if (require.main === module) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exit(1);
  });
}
