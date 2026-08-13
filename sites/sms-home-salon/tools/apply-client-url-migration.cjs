const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../..");
const manifestPath = path.join(root, "sites/sms-home-salon/content/client-approved-navigation-migration.json");
const outputDir = path.join(root, "build/sites/sms-home-salon/client-navigation-migration/url-migration");
const apply = process.argv.includes("--apply");
const baseUrl = process.env.NEB_SITE_URL;
const apiKey = process.env.NEB_API_KEY;
const expectedBridge = "https://homesalon.ae/wp-json/native-elementor/v1";
const expectedSite = "https://homesalon.ae";
const newPageIds = {
  bleach: 1377,
  scrub: 1378,
  manicure: 1379,
  pedicure: 1380,
  "french-gel-nail-extensions": 1381,
};
const manicureAttachment = {
  id: 452,
  sourceSlug: "manicure",
  targetSlug: "manicure-service-video",
  expectedFile: "/wp-content/uploads/2026/05/Manicure.mp4",
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function cleanPath(value) {
  const pathname = new URL(value, expectedSite).pathname.replace(/\/{2,}/g, "/");
  return pathname === "/" ? "/" : `${pathname.replace(/\/$/, "")}/`;
}

function absoluteUrl(route) {
  return new URL(cleanPath(route), expectedSite).href;
}

async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`, {
    ...options,
    headers: { "X-API-Key": apiKey, "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!response.ok) throw new Error(`${endpoint} failed with ${response.status}: ${JSON.stringify(data).slice(0, 1500)}`);
  return data;
}

function resolveParent(item) {
  if (item.parent_key) return newPageIds[item.parent_key];
  return Number(item.parent_id || 0);
}

function findRedirect(manifest, source) {
  const match = manifest.redirects.find((item) => cleanPath(item.source) === cleanPath(source));
  if (!match) throw new Error(`Redirect missing for ${source}.`);
  return { ...match, ignore_case: false };
}

function assertSnapshot(snapshot, manifest) {
  const pages = snapshot.pages || [];
  const byId = new Map(pages.map((page) => [Number(page.id), page]));
  const targetOwners = new Map();
  const failures = [];

  for (const item of manifest.new_pages) {
    const id = newPageIds[item.key];
    const page = byId.get(id);
    if (!page) {
      failures.push(`new page ${item.key}: expected ID ${id} is missing`);
      continue;
    }
    const current = cleanPath(page.url);
    const target = cleanPath(item.route);
    if (!['draft', 'publish'].includes(page.status)) failures.push(`${id}: unexpected status ${page.status}`);
    const expectedParent = item.parent_key ? newPageIds[item.parent_key] : 0;
    const interruptedManicure = id === newPageIds.manicure
      && page.status === 'publish'
      && page.slug === 'manicure-2'
      && current === '/manicure-2/';
    if ((!interruptedManicure && page.slug !== item.slug) || Number(page.parent_id) !== expectedParent) {
      failures.push(`${id}: expected slug ${item.slug} and parent ${expectedParent}`);
    }
    if (page.status === 'publish' && current !== target && !interruptedManicure) failures.push(`${id}: expected published URL ${target}, found ${current}`);
    if (!page.has_elementor_data) failures.push(`${id}: Elementor data is missing`);
    if (!page.seo_description) failures.push(`${id}: Rank Math description is missing`);
    targetOwners.set(target, id);
  }

  for (const item of manifest.page_moves) {
    const page = byId.get(Number(item.page_id));
    if (!page) {
      failures.push(`${item.page_id}: move source is missing`);
      continue;
    }
    const current = cleanPath(page.url);
    const source = cleanPath(item.source);
    const target = cleanPath(item.target);
    if (![source, target].includes(current)) failures.push(`${item.page_id}: expected ${source} or ${target}, found ${current}`);
    if (page.status !== 'publish') failures.push(`${item.page_id}: expected publish, found ${page.status}`);
    if (!page.has_elementor_data) failures.push(`${item.page_id}: Elementor data is missing`);
    if (!page.seo_description) failures.push(`${item.page_id}: Rank Math description is missing`);
    targetOwners.set(target, Number(item.page_id));
  }

  for (const item of [...manifest.merges, ...manifest.removals]) {
    const id = Number(item.absorbed_page_id || item.page_id);
    const page = byId.get(id);
    if (!page) failures.push(`${id}: retirement source is missing`);
    else if (!['publish', 'draft'].includes(page.status)) failures.push(`${id}: unexpected retirement status ${page.status}`);
  }

  for (const page of pages) {
    const current = cleanPath(page.url);
    const owner = targetOwners.get(current);
    if (owner && owner !== Number(page.id)) failures.push(`${current}: target collision between ${owner} and ${page.id}`);
  }

  if (manifest.redirects.length !== 44) failures.push(`expected 44 redirects, found ${manifest.redirects.length}`);
  if (new Set(manifest.redirects.map((item) => cleanPath(item.source))).size !== manifest.redirects.length) {
    failures.push('redirect sources are not unique');
  }
  if (failures.length) throw new Error(`Migration preflight failed:\n- ${failures.join("\n- ")}`);
  return { byId, page_count: pages.length };
}

async function saveBaseline(id, label) {
  const current = await apiFetch(`pages/${id}`);
  writeJson(path.join(outputDir, "baselines", `${id}.${label}.json`), current);
  return current;
}

async function publishReviewedPage(item) {
  const id = newPageIds[item.key];
  const before = await saveBaseline(id, "before-publish");
  const target = cleanPath(item.route);
  const parentId = item.parent_key ? newPageIds[item.parent_key] : 0;
  const interruptedManicure = id === newPageIds.manicure
    && before.status === 'publish'
    && before.slug === 'manicure-2'
    && cleanPath(before.url) === '/manicure-2/';
  if ((!interruptedManicure && before.slug !== item.slug) || Number(before.parent_id) !== parentId) {
    throw new Error(`${id}: reviewed page slug or parent drifted.`);
  }
  if (before.status === 'publish' && cleanPath(before.url) !== target && !interruptedManicure) {
    throw new Error(`${id}: reviewed published page URL drifted from ${target}.`);
  }
  if (before.status !== 'publish' || before.slug !== item.slug || Number(before.parent_id) !== parentId || before.title !== item.title) {
    await apiFetch(`pages/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: item.title,
        status: "publish",
        slug: item.slug,
        parent_id: parentId,
        canonical_url: absoluteUrl(target),
        robots: ["index", "follow"],
      }),
    });
  }
  const after = await apiFetch(`pages/${id}`);
  if (after.status !== 'publish' || cleanPath(after.url) !== target || Number(after.parent_id) !== parentId) {
    throw new Error(`${id}: reviewed page publish verification failed.`);
  }
  writeJson(path.join(outputDir, "exports", `${id}.published.json`), after);
  return { id, target, action: before.status === 'publish' ? 'unchanged' : 'published' };
}

async function resolveManicureAttachmentCollision() {
  const response = await fetch(`${expectedSite}/wp-json/wp/v2/media/${manicureAttachment.id}`);
  if (!response.ok) throw new Error(`Unable to inspect media attachment ${manicureAttachment.id}.`);
  const before = await response.json();
  const sourceUrl = before.source_url || '';
  if (!sourceUrl.endsWith(manicureAttachment.expectedFile)) {
    throw new Error(`Media ${manicureAttachment.id}: unexpected file URL ${sourceUrl}.`);
  }
  if (![manicureAttachment.sourceSlug, manicureAttachment.targetSlug].includes(before.slug)) {
    throw new Error(`Media ${manicureAttachment.id}: unexpected slug ${before.slug}.`);
  }
  writeJson(path.join(outputDir, "baselines", `${manicureAttachment.id}.media-before.json`), before);
  if (before.slug === manicureAttachment.sourceSlug) {
    const saved = await apiFetch(`media/${manicureAttachment.id}`, {
      method: "PUT",
      body: JSON.stringify({ slug: manicureAttachment.targetSlug }),
    });
    if (saved.media?.slug !== manicureAttachment.targetSlug || saved.media?.url !== sourceUrl) {
      throw new Error(`Media ${manicureAttachment.id}: slug rename verification failed.`);
    }
    writeJson(path.join(outputDir, "exports", `${manicureAttachment.id}.media-renamed.json`), saved);
    return { id: manicureAttachment.id, action: 'renamed', file_url_unchanged: true };
  }
  return { id: manicureAttachment.id, action: 'unchanged', file_url_unchanged: true };
}

async function movePage(item) {
  const id = Number(item.page_id);
  const before = await saveBaseline(id, "before-move");
  const current = cleanPath(before.url);
  const source = cleanPath(item.source);
  const target = cleanPath(item.target);
  const parentId = resolveParent(item);
  if (![source, target].includes(current) || before.status !== 'publish') {
    throw new Error(`${id}: live move source drifted (${before.status} ${current}).`);
  }
  if (current !== target || before.title !== item.title || Number(before.parent_id) !== parentId) {
    const body = {
      title: item.title,
      status: "publish",
      slug: item.slug,
      parent_id: parentId,
      canonical_url: absoluteUrl(target),
      robots: Array.isArray(before.robots) && before.robots.length ? before.robots : ["index", "follow"],
    };
    await apiFetch(`pages/${id}`, { method: "PUT", body: JSON.stringify(body) });
  }
  const after = await apiFetch(`pages/${id}`);
  if (after.status !== 'publish' || cleanPath(after.url) !== target || Number(after.parent_id) !== parentId || after.title !== item.title) {
    throw new Error(`${id}: post-move verification failed.`);
  }
  writeJson(path.join(outputDir, "exports", `${id}.moved.json`), after);
  return { id, source, target, parent_id: parentId, action: current === target ? 'unchanged' : 'moved' };
}

async function upsertRedirect(item) {
  const response = await apiFetch("rank-math/redirections", {
    method: "POST",
    body: JSON.stringify({ dry_run: false, redirections: [{ ...item, ignore_case: false }] }),
  });
  if (!response.ok) throw new Error(`Redirect save failed for ${item.source}.`);
  return response;
}

async function retirePage(item, kind) {
  const id = Number(item.absorbed_page_id || item.page_id);
  const source = cleanPath(item.absorbed_source || item.source);
  const before = await saveBaseline(id, `before-${kind}`);
  if (before.status === 'publish' && cleanPath(before.url) !== source) {
    throw new Error(`${id}: retirement source drifted from ${source}.`);
  }
  if (before.status !== 'draft') {
    await apiFetch(`pages/${id}`, { method: "PUT", body: JSON.stringify({ status: "draft", robots: ["noindex", "follow"] }) });
  }
  const after = await apiFetch(`pages/${id}`);
  if (after.status !== 'draft') throw new Error(`${id}: retirement verification failed.`);
  writeJson(path.join(outputDir, "exports", `${id}.${kind}.json`), after);
  return { id, source, target: cleanPath(item.target), status: after.status };
}

function validateRedirectInventory(inventory, manifest) {
  const exact = new Map();
  for (const redirect of inventory.redirections || []) {
    for (const source of redirect.sources || []) {
      if (source.comparison === 'exact' && source.route) exact.set(cleanPath(source.route), redirect);
    }
  }
  const failures = [];
  for (const expected of manifest.redirects) {
    const actual = exact.get(cleanPath(expected.source));
    if (!actual) failures.push(`${expected.source}: missing`);
    else if (cleanPath(actual.destination_route || actual.destination) !== cleanPath(expected.destination)) failures.push(`${expected.source}: wrong destination`);
    else if (Number(actual.type) !== 301 || actual.status !== 'active') failures.push(`${expected.source}: not active 301`);
  }
  if (failures.length) throw new Error(`Redirect verification failed:\n- ${failures.join("\n- ")}`);
}

async function main() {
  if (!baseUrl || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");
  if (baseUrl.replace(/\/$/, "") !== expectedBridge) throw new Error(`Unexpected bridge URL: ${baseUrl}`);
  const manifest = readJson(manifestPath);
  const status = await apiFetch("status");
  if (status.site_url !== expectedSite || status.bridge_version !== "0.9.0") {
    throw new Error(`Unexpected bridge target: ${JSON.stringify(status)}`);
  }
  const snapshot = await apiFetch("site-snapshot?include_data=false");
  writeJson(path.join(outputDir, "site-snapshot.before.json"), snapshot);
  const preflight = assertSnapshot(snapshot, manifest);
  const redirectDryRun = await apiFetch("rank-math/redirections", {
    method: "POST",
    body: JSON.stringify({ dry_run: true, redirections: manifest.redirects.map((item) => ({ ...item, ignore_case: false })) }),
  });
  if (!redirectDryRun.ok) throw new Error("Redirect dry-run failed.");
  const report = {
    generated_at: new Date().toISOString(),
    apply,
    status,
    preflight,
    redirect_dry_run: redirectDryRun.summary,
    planned: { publish: manifest.new_pages.length, move: manifest.page_moves.length, retire: manifest.merges.length + manifest.removals.length, redirects: manifest.redirects.length },
  };
  writeJson(path.join(outputDir, "preflight-report.json"), report);
  if (!apply) {
    console.log(JSON.stringify({ ok: true, ...report.planned, redirect_plan: redirectDryRun.summary, outputDir }, null, 2));
    return;
  }

  report.media_collision = await resolveManicureAttachmentCollision();
  report.published = [];
  for (const item of manifest.new_pages.filter((page) => !page.parent_key)) {
    report.published.push(await publishReviewedPage(item));
  }
  for (const item of manifest.new_pages.filter((page) => page.parent_key)) {
    report.published.push(await publishReviewedPage(item));
  }

  report.moved = [];
  report.redirects = [];
  for (const item of manifest.page_moves) {
    report.moved.push(await movePage(item));
    const redirect = findRedirect(manifest, item.source);
    await upsertRedirect(redirect);
    report.redirects.push({ source: cleanPath(redirect.source), destination: cleanPath(redirect.destination) });
    console.log(`moved ${item.page_id} ${cleanPath(item.source)} -> ${cleanPath(item.target)}`);
  }

  report.retired = [];
  for (const item of manifest.merges) {
    const redirect = findRedirect(manifest, item.absorbed_source);
    await upsertRedirect(redirect);
    report.redirects.push({ source: cleanPath(redirect.source), destination: cleanPath(redirect.destination) });
    report.retired.push(await retirePage(item, "absorbed"));
  }
  for (const item of manifest.removals) {
    const redirect = findRedirect(manifest, item.source);
    await upsertRedirect(redirect);
    report.redirects.push({ source: cleanPath(redirect.source), destination: cleanPath(redirect.destination) });
    report.retired.push(await retirePage(item, "retired"));
  }

  const inventory = await apiFetch("rank-math/redirections");
  validateRedirectInventory(inventory, manifest);
  report.redirect_inventory_count = inventory.count;
  report.cache = await apiFetch("clear-cache", { method: "POST", body: "{}" });
  const after = await apiFetch("site-snapshot?include_data=false");
  writeJson(path.join(outputDir, "site-snapshot.after.json"), after);
  writeJson(path.join(outputDir, "deployment-report.json"), report);
  console.log(JSON.stringify({ ok: true, published: report.published.length, moved: report.moved.length, retired: report.retired.length, redirects: report.redirects.length, redirect_inventory_count: inventory.count, outputDir }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
