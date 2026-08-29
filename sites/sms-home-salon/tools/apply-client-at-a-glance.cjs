const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { validateTemplate } = require("../../../src/validator/elementor-native-lint");

const root = path.resolve(__dirname, "../../..");
const sourcePath = path.join(root, "sites/sms-home-salon/content/client-approved-at-a-glance-changes.json");
const outputDir = path.join(root, "build/sites/sms-home-salon/client-at-a-glance-update");
const apply = process.argv.includes("--apply");
const baseUrl = String(process.env.NEB_SITE_URL || "").replace(/\/$/, "");
const apiKey = process.env.NEB_API_KEY;

const expectedSite = "https://homesalon.ae";
const expectedBridge = "0.9.0";
const sectionLabels = {
  who_its_for: "Who It's For",
  when_to_book: "When to Book",
  top_benefits: "Top Benefits",
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function hash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
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

function directWidget(container, widgetType) {
  return (container.elements || []).find((element) => element?.elType === "widget" && element.widgetType === widgetType);
}

function directItemCards(column) {
  return (column.elements || []).filter((element) => {
    if (element?.elType !== "container") return false;
    return Boolean(directWidget(element, "heading") && directWidget(element, "text-editor"));
  });
}

function headingText(value) {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function findSectionColumn(elements, label) {
  let match = null;
  walk(elements, (node, parent) => {
    if (match || node?.elType !== "widget" || node.widgetType !== "heading") return;
    if (headingText(node.settings?.title) !== label) return;
    if (parent?.elType !== "container" || directItemCards(parent).length === 0) return;
    match = parent;
  });
  if (!match) throw new Error(`At a Glance column not found: ${label}`);
  return match;
}

function refreshIds(value, seed) {
  let index = 0;
  walk(value, (node) => {
    if (typeof node.id !== "string") return;
    node.id = crypto.createHash("md5").update(`${seed}:${index++}:${node.id}`).digest("hex").slice(0, 7);
  });
}

function updateItemCard(card, item) {
  const title = directWidget(card, "heading");
  const text = directWidget(card, "text-editor");
  if (!title || !text) throw new Error("At a Glance item card structure was not recognised.");
  title.settings.title = item.title;
  text.settings.editor = `<p>${item.text}</p>`;
}

function replaceItems(column, items, seed) {
  const cards = directItemCards(column);
  if (!cards.length) throw new Error(`${seed}: no reusable item card was found.`);
  const template = cards[0];
  const replacements = items.map((item, index) => {
    const card = index < cards.length ? cards[index] : clone(template);
    if (index >= cards.length) refreshIds(card, `${seed}:${index}`);
    updateItemCard(card, item);
    return card;
  });
  let replacementIndex = 0;
  column.elements = column.elements.flatMap((element) => {
    if (!cards.includes(element)) return [element];
    if (replacementIndex >= replacements.length) return [];
    return [replacements[replacementIndex++]];
  });
  if (replacementIndex < replacements.length) column.elements.push(...replacements.slice(replacementIndex));
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

function inspectContract(elements, definition) {
  const sections = {};
  for (const [key, items] of Object.entries(definition.sections)) {
    const column = findSectionColumn(elements, sectionLabels[key]);
    sections[key] = directItemCards(column).map((card) => ({
      title: headingText(directWidget(card, "heading")?.settings?.title),
      text: headingText(directWidget(card, "text-editor")?.settings?.editor),
    }));
    if (JSON.stringify(sections[key]) !== JSON.stringify(items)) {
      throw new Error(`${definition.id}: saved ${sectionLabels[key]} content does not match the approved source.`);
    }
  }
  return sections;
}

function assertOnlyAtAGlanceChanged(before, after, pageId) {
  if (before.length !== after.length) throw new Error(`${pageId}: top-level Elementor section count changed.`);
  const changedIndexes = [];
  for (let index = 0; index < before.length; index += 1) {
    if (hash(before[index]) !== hash(after[index])) changedIndexes.push(index);
  }
  if (changedIndexes.length !== 1) throw new Error(`${pageId}: expected one changed top-level section, got ${changedIndexes.join(", ")}.`);
  let hasAtAGlance = false;
  walk(after[changedIndexes[0]], (node) => {
    if (node?.widgetType === "heading" && headingText(node.settings?.title) === "At a Glance") hasAtAGlance = true;
  });
  if (!hasAtAGlance) throw new Error(`${pageId}: the changed section is not At a Glance.`);
  return changedIndexes[0];
}

function buildCandidate(page, definition) {
  const before = clone(page.elementor_data || []);
  const after = clone(before);
  for (const [key, items] of Object.entries(definition.sections)) {
    if (!sectionLabels[key]) throw new Error(`${definition.id}: unsupported section ${key}.`);
    replaceItems(findSectionColumn(after, sectionLabels[key]), items, `${definition.id}:${key}`);
  }
  const changed = hash(before) !== hash(after);
  const changedTopLevelIndex = changed ? assertOnlyAtAGlanceChanged(before, after, definition.id) : null;
  const lint = lintDelta(before, after);
  if (!lint.ok) throw new Error(`${definition.id}: native lint found ${lint.new_errors.length} new blocking error(s).`);
  const contract = inspectContract(after, definition);
  return { before, after, changed, lint, contract, changedTopLevelIndex };
}

function validateSource(source) {
  if (source.site !== expectedSite || !Array.isArray(source.pages) || source.pages.length !== 8) {
    throw new Error("Approved At a Glance source must contain the eight reviewed homesalon.ae pages.");
  }
  const ids = new Set();
  for (const page of source.pages) {
    if (ids.has(Number(page.id))) throw new Error(`Duplicate page ID ${page.id}.`);
    ids.add(Number(page.id));
    if (!page.path?.startsWith("/") || !Object.keys(page.sections || {}).length) throw new Error(`${page.id}: invalid approved source entry.`);
    for (const [key, items] of Object.entries(page.sections)) {
      if (!sectionLabels[key] || !Array.isArray(items) || !items.length) throw new Error(`${page.id}: invalid ${key} content.`);
      for (const item of items) {
        if (!item.title || !item.text) throw new Error(`${page.id}: every At a Glance item needs a title and text.`);
        if (/\p{Extended_Pictographic}/u.test(`${item.title}${item.text}`)) throw new Error(`${page.id}: emoji remains in approved content.`);
      }
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
  if (status.site_url !== expectedSite || status.bridge_version !== expectedBridge) {
    throw new Error(`Unexpected bridge target: ${JSON.stringify(status)}`);
  }
}

function assertPage(page, definition) {
  const actualPath = new URL(page.url).pathname.replace(/\/$/, "");
  const expectedPath = definition.path.replace(/\/$/, "");
  if (Number(page.id) !== Number(definition.id) || actualPath !== expectedPath) {
    throw new Error(`${definition.id}: expected ${definition.path}, got ${page.url}.`);
  }
  if (page.status !== "publish" || !Array.isArray(page.elementor_data)) {
    throw new Error(`${definition.id}: expected a published native Elementor page.`);
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
    page_settings_unchanged: hash(before.page_settings || {}) === hash(after.page_settings || {}),
  };
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&#8217;|&rsquo;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function verifyPublic(definition) {
  const url = `${expectedSite}${definition.path}?at-a-glance-qa=${Date.now()}`;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(90000),
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  });
  const html = await response.text();
  if (!response.ok) throw new Error(`${definition.id}: public page returned ${response.status}.`);
  const text = decodeHtml(html);
  const expected = Object.values(definition.sections).flatMap((items) => items.flatMap((item) => [item.title, item.text]));
  const missing = expected.filter((value) => !text.includes(value));
  if (missing.length) throw new Error(`${definition.id}: public page is missing ${missing.length} approved text value(s).`);
  return { url: response.url, status: response.status, approved_values: expected.length, missing: 0 };
}

async function main() {
  if (!baseUrl || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");
  const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  validateSource(source);
  const status = await apiFetch("status");
  assertTarget(status);

  const snapshot = await apiFetch("site-snapshot?include_data=true");
  if (!snapshot.ok || !snapshot.include_data || snapshot.status?.site_url !== expectedSite) {
    throw new Error("Fresh full-site snapshot did not return the expected production data.");
  }
  writeJson(path.join(outputDir, "site-snapshot.pre-update.json"), snapshot);
  const snapshotPages = new Map((snapshot.pages || []).map((page) => [Number(page.id), page]));
  for (const definition of source.pages) {
    const snapshotPage = snapshotPages.get(Number(definition.id));
    if (!snapshotPage) throw new Error(`${definition.id}: target page is missing from the fresh full-site snapshot.`);
    assertPage(snapshotPage, definition);
  }

  fs.mkdirSync(path.join(outputDir, "baselines"), { recursive: true });
  fs.mkdirSync(path.join(outputDir, "candidates"), { recursive: true });
  fs.mkdirSync(path.join(outputDir, "exports"), { recursive: true });
  const candidates = [];
  for (const definition of source.pages) {
    const page = await apiFetch(`pages/${definition.id}`);
    assertPage(page, definition);
    writeJson(path.join(outputDir, "baselines", `${definition.id}.pre-update.json`), page);
    const candidate = buildCandidate(page, definition);
    writeJson(path.join(outputDir, "candidates", `${definition.id}.elementor.json`), candidate.after);
    candidates.push({ definition, page, ...candidate });
  }

  const preflight = {
    generated_at: new Date().toISOString(),
    dry_run: !apply,
    operation: "update-existing-at-a-glance-sections",
    status,
    source_document_sha256: source.source_document_sha256,
    pages: candidates.map((candidate) => ({
      id: candidate.definition.id,
      title: candidate.page.title,
      url: candidate.page.url,
      changed: candidate.changed,
      changed_sections: Object.keys(candidate.definition.sections).map((key) => sectionLabels[key]),
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
    await apiFetch(`pages/${candidate.definition.id}`, {
      method: "PUT",
      body: JSON.stringify({ elementor_data: candidate.after }),
    });
    const saved = await apiFetch(`pages/${candidate.definition.id}`);
    writeJson(path.join(outputDir, "exports", `${candidate.definition.id}.post-update.json`), saved);
    const lint = lintDelta(candidate.before, saved.elementor_data || []);
    const contract = inspectContract(saved.elementor_data, candidate.definition);
    const invariants = pageInvariants(candidate.page, saved);
    assertOnlyAtAGlanceChanged(candidate.before, saved.elementor_data, candidate.definition.id);
    if (!lint.ok || !Object.values(invariants).every(Boolean)) throw new Error(`${candidate.definition.id}: post-save verification failed.`);
    results.push({ id: candidate.definition.id, title: saved.title, url: saved.url, lint, contract, invariants });
    console.log(`verified ${candidate.definition.id} ${saved.url}`);
  }

  const cache = await apiFetch("clear-cache", { method: "POST", body: "{}" });
  const publicChecks = [];
  for (const candidate of candidates) publicChecks.push(await verifyPublic(candidate.definition));
  const report = {
    generated_at: new Date().toISOString(),
    operation: "update-existing-at-a-glance-sections",
    status,
    source_document_sha256: source.source_document_sha256,
    results,
    unchanged_page_ids: candidates.filter((candidate) => !candidate.changed).map((candidate) => candidate.definition.id),
    cache,
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
