const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../..");
const outputDir = path.join(root, "build/sites/sms-home-salon/client-navigation-migration/menu");
const apply = process.argv.includes("--apply");
const baseUrl = process.env.NEB_SITE_URL;
const apiKey = process.env.NEB_API_KEY;

const pageItem = (label, pageId, sourceKey, children) => ({
  label,
  page_id: pageId,
  type: "post_type",
  object: "page",
  source_key: sourceKey,
  ...(children ? { children } : {}),
});

const items = [
  pageItem("Home", 124, "main-home"),
  pageItem("Services", 61, "main-services", [
    pageItem("Massage", 62, "services-massage"),
    pageItem("Facial", 65, "services-facial"),
    pageItem("Bleach", 1377, "services-bleach"),
    pageItem("Scrub", 1378, "services-scrub"),
    pageItem("Hair", 64, "services-hair"),
    pageItem("Manicure", 1379, "services-manicure"),
    pageItem("Pedicure", 1380, "services-pedicure"),
    pageItem("Kids", 1082, "services-kids"),
    pageItem("Waxing", 66, "services-waxing"),
    pageItem("Threading", 67, "services-threading"),
  ]),
  pageItem("About Us", 60, "main-about"),
  pageItem("Blog", 1327, "main-blog"),
  pageItem("Contact Us", 69, "main-contact"),
];

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
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

function flatten(tree, parent = null, output = []) {
  for (const item of tree || []) {
    output.push({ label: item.title || item.label, object_id: Number(item.object_id || item.page_id), parent });
    flatten(item.children, Number(item.object_id || item.page_id), output);
  }
  return output;
}

function assertMenu(menu) {
  if (!menu || Number(menu.id) !== 12 || menu.name !== "Main Menu" || menu.slug !== "main-menu") {
    throw new Error(`Unexpected menu identity: ${JSON.stringify(menu)}`);
  }
  if (!(menu.locations || []).includes("menu-1")) throw new Error("Main Menu is no longer assigned to menu-1.");
}

function assertFinalMenu(menu) {
  assertMenu(menu);
  const actual = flatten(menu.tree || []);
  const expected = flatten(items);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Final menu tree mismatch.\nExpected ${JSON.stringify(expected)}\nActual ${JSON.stringify(actual)}`);
  }
  if (Number(menu.count) !== 15) throw new Error(`Expected 15 menu items, found ${menu.count}.`);
}

async function main() {
  if (!baseUrl || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");
  if (baseUrl.replace(/\/$/, "") !== "https://homesalon.ae/wp-json/native-elementor/v1") throw new Error(`Unexpected bridge URL: ${baseUrl}`);
  const status = await apiFetch("status");
  if (status.site_url !== "https://homesalon.ae" || status.bridge_version !== "0.9.0") throw new Error(`Unexpected bridge target: ${JSON.stringify(status)}`);
  const beforeInventory = await apiFetch("menus");
  const before = (beforeInventory.menus || []).find((menu) => Number(menu.id) === 12);
  assertMenu(before);
  writeJson(path.join(outputDir, "main-menu.before.json"), before);

  const body = { menu_id: 12, mode: "replace", dry_run: !apply, items };
  const result = await apiFetch("menus", { method: "POST", body: JSON.stringify(body) });
  writeJson(path.join(outputDir, apply ? "apply-result.json" : "dry-run.json"), result);
  if (!result.ok) throw new Error("Menu operation did not return ok.");
  if (!apply) {
    if (!result.dry_run || result.summary?.input_count !== 15) throw new Error("Menu dry-run summary is invalid.");
    console.log(JSON.stringify({ ok: true, dry_run: true, summary: result.summary, menu_id: 12, location: "menu-1", outputDir }, null, 2));
    return;
  }

  const afterInventory = await apiFetch("menus");
  const after = (afterInventory.menus || []).find((menu) => Number(menu.id) === 12);
  assertFinalMenu(after);
  writeJson(path.join(outputDir, "main-menu.after.json"), after);
  const cache = await apiFetch("clear-cache", { method: "POST", body: "{}" });
  console.log(JSON.stringify({ ok: true, dry_run: false, menu_id: 12, item_count: after.count, location: "menu-1", operations: result.operations?.length || 0, deleted: result.deleted_ids?.length || 0, cache, outputDir }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
