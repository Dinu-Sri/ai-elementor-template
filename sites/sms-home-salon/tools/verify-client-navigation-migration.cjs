const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "sites/sms-home-salon/content/client-approved-navigation-migration.json"), "utf8").replace(/^\uFEFF/, ""));
const outputFile = path.join(root, "build/sites/sms-home-salon/client-navigation-migration/final-qa.json");
const baseUrl = process.env.NEB_SITE_URL;
const apiKey = process.env.NEB_API_KEY;
const site = "https://homesalon.ae";
const newPageIds = { bleach: 1377, scrub: 1378, manicure: 1379, pedicure: 1380, "french-gel-nail-extensions": 1381 };

function cleanPath(value) {
  const pathname = new URL(value, site).pathname.replace(/\/{2,}/g, "/");
  return pathname === "/" ? "/" : `${pathname.replace(/\/$/, "")}/`;
}

function writeJson(value) {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(value, null, 2)}\n`);
}

async function apiFetch(endpoint, attempt = 1) {
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`, {
      signal: AbortSignal.timeout(60000),
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`${endpoint} failed with ${response.status}: ${JSON.stringify(data).slice(0, 800)}`);
    return data;
  } catch (error) {
    if (attempt >= 3) throw error;
    await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    return apiFetch(endpoint, attempt + 1);
  }
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

async function publicFetch(route, attempt = 1) {
  try {
    const response = await fetch(new URL(cleanPath(route), site), {
      redirect: "manual",
      signal: AbortSignal.timeout(30000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SMSHomeSalon-QA/1.0)" },
    });
    await response.body?.cancel();
    return { status: response.status, location: response.headers.get("location") || "" };
  } catch (error) {
    if (attempt >= 3) throw error;
    await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    return publicFetch(route, attempt + 1);
  }
}

async function publicText(url, attempt = 1) {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SMSHomeSalon-QA/1.0)" },
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`${url} returned ${response.status}`);
    return text;
  } catch (error) {
    if (attempt >= 3) throw error;
    await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    return publicText(url, attempt + 1);
  }
}

function flattenMenu(items, parent = null, output = []) {
  for (const item of items || []) {
    output.push({ id: Number(item.object_id), title: item.title, parent });
    flattenMenu(item.children, Number(item.object_id), output);
  }
  return output;
}

async function main() {
  if (!baseUrl || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");
  const failures = [];
  const [status, pageInventory, postInventory, menuInventory, redirectInventory] = await Promise.all([
    apiFetch("status"),
    apiFetch("pages?per_page=250&include_data=false"),
    apiFetch("posts?per_page=250"),
    apiFetch("menus"),
    apiFetch("rank-math/redirections"),
  ]);
  if (status.site_url !== site || status.bridge_version !== "0.9.0") failures.push("bridge identity/version mismatch");

  const pages = pageInventory.pages || [];
  const byId = new Map(pages.map((page) => [Number(page.id), page]));
  const published = pages.filter((page) => page.status === "publish");
  if (published.length !== 91) failures.push(`expected 91 published pages, found ${published.length}`);
  for (const page of published) if (!page.seo_description) failures.push(`page ${page.id}: missing SEO description`);

  for (const item of manifest.new_pages) {
    const page = byId.get(newPageIds[item.key]);
    if (!page || page.status !== "publish" || cleanPath(page.url) !== cleanPath(item.route)) failures.push(`new page ${item.key}: state mismatch`);
  }
  for (const item of manifest.page_moves) {
    const page = byId.get(Number(item.page_id));
    const parent = item.parent_key ? newPageIds[item.parent_key] : Number(item.parent_id || 0);
    if (!page || page.status !== "publish" || cleanPath(page.url) !== cleanPath(item.target) || Number(page.parent_id) !== parent) failures.push(`move ${item.page_id}: state mismatch`);
  }
  for (const item of [...manifest.merges, ...manifest.removals]) {
    const id = Number(item.absorbed_page_id || item.page_id);
    if (byId.get(id)?.status !== "draft") failures.push(`retired page ${id}: expected draft`);
  }

  const exactRedirects = new Map();
  for (const redirect of redirectInventory.redirections || []) {
    for (const source of redirect.sources || []) if (source.comparison === "exact" && source.route) exactRedirects.set(cleanPath(source.route), redirect);
  }
  const expectedRedirectCount = manifest.redirects.length + 1; // Includes the approved /pricing/ repair.
  if (Number(redirectInventory.count) !== expectedRedirectCount) failures.push(`expected ${expectedRedirectCount} Rank Math redirects, found ${redirectInventory.count}`);
  for (const item of manifest.redirects) {
    const redirect = exactRedirects.get(cleanPath(item.source));
    if (!redirect || redirect.status !== "active" || Number(redirect.type) !== 301 || cleanPath(redirect.destination_route || redirect.destination) !== cleanPath(item.destination)) failures.push(`redirect inventory mismatch: ${item.source}`);
  }

  const menu = (menuInventory.menus || []).find((item) => Number(item.id) === 12);
  const expectedMenu = [
    { id: 124, title: "Home", parent: null },
    { id: 61, title: "Services", parent: null },
    { id: 62, title: "Massage", parent: 61 },
    { id: 65, title: "Facial", parent: 61 },
    { id: 1377, title: "Bleach", parent: 61 },
    { id: 1378, title: "Scrub", parent: 61 },
    { id: 64, title: "Hair", parent: 61 },
    { id: 1379, title: "Manicure", parent: 61 },
    { id: 1380, title: "Pedicure", parent: 61 },
    { id: 1082, title: "Kids", parent: 61 },
    { id: 66, title: "Waxing", parent: 61 },
    { id: 67, title: "Threading", parent: 61 },
    { id: 60, title: "About Us", parent: null },
    { id: 1327, title: "Blog", parent: null },
    { id: 69, title: "Contact Us", parent: null },
  ];
  if (!menu || menu.count !== 15 || !(menu.locations || []).includes("menu-1") || JSON.stringify(flattenMenu(menu.tree)) !== JSON.stringify(expectedMenu)) failures.push("Main Menu hierarchy mismatch");

  const posts = postInventory.posts || [];
  if (posts.length !== 50) failures.push(`expected 50 posts, found ${posts.length}`);
  for (const post of posts) {
    if (!["publish", "future"].includes(post.status)) failures.push(`post ${post.id}: unexpected status ${post.status}`);
    if (!post.seo_description) failures.push(`post ${post.id}: missing SEO description`);
    if (!Number(post.featured_image_id)) failures.push(`post ${post.id}: missing featured image`);
  }

  const [callusPage, callusArticle] = await Promise.all([apiFetch("pages/1080"), apiFetch("posts/1172")]);
  const callusCards = callusPage.elementor_data?.[4]?.elements?.[0]?.elements?.[1]?.elements || [];
  const firstCallusCard = JSON.stringify(callusCards[0] || {});
  const secondCallusCard = JSON.stringify(callusCards[1] || {});
  if (!firstCallusCard.includes('Callus Treatment') || !firstCallusCard.includes('AED 160')) failures.push("Callus base package is not AED 160");
  if (!secondCallusCard.includes('Callus Treatment With Polish') || !secondCallusCard.includes('AED 180')) failures.push("Callus With Polish package is not AED 180");
  if (!callusArticle.content.includes('Callus Treatment \u2014 AED 160; With Polish \u2014 AED 180')) failures.push("Nail pricing article has the wrong Callus price line");

  const media = [];
  let mediaPage = 1;
  let mediaPages = 1;
  do {
    const inventory = await apiFetch(`media?per_page=250&page=${mediaPage}`);
    media.push(...(inventory.media || []));
    mediaPages = Number(inventory.total_pages || 1);
    mediaPage += 1;
  } while (mediaPage <= mediaPages);
  const mediaById = new Map(media.map((item) => [Number(item.id), item]));
  for (const post of posts) {
    const image = mediaById.get(Number(post.featured_image_id));
    if (!image) failures.push(`post ${post.id}: featured image ${post.featured_image_id} missing from media inventory`);
    else if (!image.alt) failures.push(`post ${post.id}: featured image ${image.id} missing ALT text`);
  }

  const targets = [...new Set(["/", ...manifest.new_pages.map((item) => item.route), ...manifest.redirects.map((item) => item.destination)].map(cleanPath))];
  const targetChecks = await mapLimit(targets, 4, async (route) => ({ route, ...(await publicFetch(route)) }));
  for (const check of targetChecks) if (check.status !== 200) failures.push(`target ${check.route}: expected 200, found ${check.status}`);
  const redirectChecks = await mapLimit(manifest.redirects, 4, async (item) => ({ source: cleanPath(item.source), destination: cleanPath(item.destination), ...(await publicFetch(item.source)) }));
  for (const check of redirectChecks) {
    const location = check.location ? cleanPath(check.location) : "";
    if (check.status !== 301 || location !== check.destination) failures.push(`source ${check.source}: expected 301 to ${check.destination}, found ${check.status} to ${location || "(none)"}`);
  }

  const sitemapIndex = await publicText(`${site}/sitemap_index.xml`);
  const sitemapUrls = [...sitemapIndex.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const pageSitemapUrl = sitemapUrls.find((url) => /page-sitemap[^/]*\.xml$/i.test(url));
  if (!pageSitemapUrl) failures.push("Rank Math page sitemap was not found in sitemap_index.xml");
  let pageSitemap = "";
  if (pageSitemapUrl) pageSitemap = await publicText(pageSitemapUrl);
  for (const target of [...manifest.new_pages.map((item) => item.route), ...manifest.page_moves.map((item) => item.target)]) {
    const canonical = new URL(cleanPath(target), site).href;
    if (!pageSitemap.includes(`<loc>${canonical}</loc>`)) failures.push(`page sitemap is missing ${cleanPath(target)}`);
  }
  for (const item of manifest.redirects) {
    const retired = new URL(cleanPath(item.source), site).href;
    if (pageSitemap.includes(`<loc>${retired}</loc>`)) failures.push(`page sitemap still contains retired route ${cleanPath(item.source)}`);
  }

  const report = {
    generated_at: new Date().toISOString(),
    ok: failures.length === 0,
    failures,
    counts: { published_pages: published.length, posts: posts.length, media: media.length, redirects: redirectInventory.count, menu_items: menu?.count || 0, targets_checked: targetChecks.length, sources_checked: redirectChecks.length, sitemap_targets_checked: manifest.new_pages.length + manifest.page_moves.length, sitemap_sources_checked: manifest.redirects.length },
    status,
    target_checks: targetChecks,
    redirect_checks: redirectChecks,
  };
  writeJson(report);
  console.log(JSON.stringify({ ok: report.ok, failures: failures.length, counts: report.counts, outputFile }, null, 2));
  if (failures.length) {
    console.error(failures.join("\n"));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
