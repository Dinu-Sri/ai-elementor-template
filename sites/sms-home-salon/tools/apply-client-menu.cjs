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
    pageItem("Massage", 62, "services-massage", [
      pageItem("Pregnancy Massage", 389, "massage-pregnancy"),
      pageItem("Lymphatic Drainage Massage", 390, "massage-lymphatic-drainage"),
      pageItem("Madero Massage", 391, "massage-madero"),
      pageItem("Deep Tissue Massage", 392, "massage-deep-tissue"),
      pageItem("Thai Massage", 393, "massage-thai"),
      pageItem("Hot Stone Massage", 394, "massage-hot-stone"),
      pageItem("Reflexology Massage", 1035, "massage-reflexology"),
      pageItem("Full Body Massage", 1038, "massage-full-body"),
      pageItem("Full Back Massage", 1040, "massage-full-back"),
      pageItem("Foot Massage", 1042, "massage-foot"),
      pageItem("Head and Shoulder Massage", 1044, "massage-head-shoulder"),
      pageItem("Head Massage", 1046, "massage-head"),
      pageItem("Head and Neck Massage", 1048, "massage-head-neck"),
      pageItem("Shoulder Massage", 1050, "massage-shoulder"),
    ]),
    pageItem("Facial", 65, "services-facial", [
      pageItem("Clean Up Facial", 1052, "facial-clean-up"),
      pageItem("Hydra Facial", 399, "facial-hydra"),
      pageItem("Diamond Facial", 400, "facial-diamond"),
      pageItem("Pearl Facial", 401, "facial-pearl"),
      pageItem("Gold Facial", 402, "facial-gold"),
      pageItem("Dr. Renaud Facial", 403, "facial-dr-renaud"),
      pageItem("Fruit Facial", 404, "facial-fruit"),
    ]),
    pageItem("Bleach", 1377, "services-bleach", [
      pageItem("Full Arms Bleaching", 1150, "bleach-full-arms"),
      pageItem("Full Legs Bleaching", 1152, "bleach-full-legs"),
      pageItem("Full Back and Front Bleaching", 1154, "bleach-full-back-front"),
    ]),
    pageItem("Scrub", 1378, "services-scrub", [
      pageItem("Face Scrub", 1156, "scrub-face"),
      pageItem("Full Arms Scrub", 1158, "scrub-full-arms"),
      pageItem("Full Back and Front Scrub", 1160, "scrub-full-back-front"),
      pageItem("Full Body Scrub", 1162, "scrub-full-body"),
      pageItem("Full Body Scrub With Mask", 1164, "scrub-full-body-mask"),
    ]),
    pageItem("Hair", 64, "services-hair", [
      pageItem("Hair Cut", 1084, "hair-cut"),
      pageItem("Hair Coloring", 1086, "hair-coloring"),
      pageItem("Blow Dry Straight", 1088, "hair-blow-dry-straight"),
      pageItem("Blow Dry Curl", 1090, "hair-blow-dry-curl"),
      pageItem("Eyelash Lifting", 1092, "hair-eyelash-lifting"),
      pageItem("Eyebrow Tint", 1094, "hair-eyebrow-tint"),
      pageItem("Henna Application", 397, "hair-henna"),
      pageItem("Keratin Treatment", 398, "hair-keratin"),
    ]),
    pageItem("Manicure", 1379, "services-manicure", [
      pageItem("Hand Paraffin", 1054, "manicure-hand-paraffin"),
      pageItem("Classic Manicure", 1056, "manicure-classic"),
      pageItem("Spa Manicure", 1058, "manicure-spa"),
      pageItem("Classic Nail Extensions", 1060, "manicure-classic-extensions"),
      pageItem("Gelish Manicure", 1062, "manicure-gelish"),
      pageItem("French Gel Manicure", 1064, "manicure-french-gel"),
      pageItem("Cat Eye Extensions", 1066, "manicure-cat-eye"),
      pageItem("Builder Gel Nails", 1068, "manicure-builder-gel"),
      pageItem("Gel Nail Extensions", 395, "manicure-gel-extensions"),
      pageItem("Acrylic Nail", 396, "manicure-acrylic"),
      pageItem("French Gel Nail Extensions", 1381, "manicure-french-gel-extensions"),
    ]),
    pageItem("Pedicure", 1380, "services-pedicure", [
      pageItem("Foot Paraffin", 1070, "pedicure-foot-paraffin"),
      pageItem("Spa Pedicure", 1072, "pedicure-spa"),
      pageItem("Foot Scrub", 1074, "pedicure-foot-scrub"),
      pageItem("Classic Pedicure", 1076, "pedicure-classic"),
      pageItem("Gel Pedicure", 1078, "pedicure-gel"),
      pageItem("Callus Treatment", 1080, "pedicure-callus"),
    ]),
    pageItem("Kids", 1082, "services-kids"),
    pageItem("Waxing", 66, "services-waxing", [
      pageItem("Upper Lip Waxing", 1096, "waxing-upper-lip"),
      pageItem("Eyebrow Waxing", 1098, "waxing-eyebrows"),
      pageItem("Chin Waxing", 1100, "waxing-chin"),
      pageItem("Underarms Waxing", 1102, "waxing-underarms"),
      pageItem("Chest Waxing", 1104, "waxing-chest"),
      pageItem("Stomach Waxing", 1106, "waxing-stomach"),
      pageItem("Face Waxing", 1110, "waxing-face"),
      pageItem("Arms Waxing", 1112, "waxing-arms"),
      pageItem("Legs Waxing", 1116, "waxing-legs"),
      pageItem("Bikini Waxing", 1120, "waxing-bikini"),
      pageItem("Full Body Waxing", 1122, "waxing-full-body"),
    ]),
    pageItem("Threading", 67, "services-threading", [
      pageItem("Chin Threading", 1126, "threading-chin"),
      pageItem("Upper Lip Threading", 1128, "threading-upper-lip"),
      pageItem("Lower Lip Threading", 1130, "threading-lower-lip"),
      pageItem("Neck Threading", 1132, "threading-neck"),
      pageItem("Forehead Threading", 1134, "threading-forehead"),
      pageItem("Side Locks Threading", 1136, "threading-side-locks"),
      pageItem("Eyebrows Threading", 1138, "threading-eyebrows"),
      pageItem("Full Face Threading", 1140, "threading-full-face"),
    ]),
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
  if (Number(menu.count) !== expected.length) throw new Error(`Expected ${expected.length} menu items, found ${menu.count}.`);
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
    if (!result.dry_run || result.summary?.input_count !== flatten(items).length) throw new Error("Menu dry-run summary is invalid.");
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
