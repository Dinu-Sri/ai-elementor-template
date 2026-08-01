const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "..", "..");
const site = (process.env.NEB_SITE_URL || "").replace(/\/$/, "");
const apiKey = process.env.NEB_API_KEY;

if (!site || !apiKey) {
  throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");
}

const api = `${site}/wp-json/native-elementor/v1/`;
const headers = { "X-API-Key": apiKey, "Content-Type": "application/json" };
const pageIds = [1040, 1044, 1204, 1208, 1209];
const attachmentIds = new Map([
  ["https://smspetgrooming.ae/wp-content/uploads/2026/07/Google-5-Star-1024x160-1.webp", 1042],
  ["https://smspetgrooming.ae/wp-content/uploads/2026/03/sms-vehicle.png", 96],
  ["https://smspetgrooming.ae/wp-content/uploads/2026/03/Home-Pets.png", 608]
]);

async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`${api}${endpoint}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(30000)
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`${endpoint} failed with ${response.status}`);
  return payload;
}

function reconnectImages(value, changes) {
  if (Array.isArray(value)) {
    value.forEach((item) => reconnectImages(item, changes));
    return;
  }
  if (!value || typeof value !== "object") return;

  if (typeof value.url === "string" && attachmentIds.has(value.url)) {
    const expectedId = attachmentIds.get(value.url);
    if (Number(value.id) !== expectedId) {
      value.id = expectedId;
      value.size = value.size || "full";
      changes.push({ url: value.url, attachment_id: expectedId });
    }
  }
  Object.values(value).forEach((item) => reconnectImages(item, changes));
}

async function main() {
  const results = [];
  for (const pageId of pageIds) {
    const page = await apiFetch(`pages/${pageId}`);
    const changes = [];
    reconnectImages(page.elementor_data, changes);
    if (changes.length) {
      await apiFetch(`pages/${pageId}`, {
        method: "PUT",
        body: { elementor_data: page.elementor_data }
      });
    }
    results.push({ id: pageId, title: page.title, changes });
  }

  await apiFetch("clear-cache", { method: "POST", body: {} });
  const report = { applied_at: new Date().toISOString(), pages: results };
  const output = path.join(root, "build", "deployments", "seo-batch", "elementor-image-id-fixes.json");
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ output: path.relative(root, output), ...report }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
