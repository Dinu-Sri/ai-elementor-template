const baseUrl = String(process.env.NEB_SITE_URL || "").replace(/\/$/, "");
const apiKey = process.env.NEB_API_KEY;
const categoryIds = [62, 65, 1377, 1378, 64, 1379, 1380, 1082, 66, 67];
const scanPageIds = [124, 60, 61, ...categoryIds, 69];
const scanTemplateIds = [174, 55, 555];
const knownBadPaths = ["/facial-skin-care/", "/nails/acrylic-nail-extensions/", "/gallery/", "/pricing/"];

async function apiFetch(endpoint) {
  const response = await fetch(`${baseUrl}/${endpoint}`, {
    signal: AbortSignal.timeout(60000),
    headers: { "X-API-Key": apiKey },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`${endpoint} failed with ${response.status}: ${JSON.stringify(data).slice(0, 800)}`);
  return data;
}

function route(value) {
  return new URL(value, "https://homesalon.ae").pathname.replace(/\/$/, "") || "/";
}

function collectHours(raw, id, title, output) {
  const patterns = [
    /\b(?:[01]?\d|2[0-3]):[0-5]\d\s*(?:AM|PM)?\s*(?:-|\u2013|to)\s*(?:[01]?\d|2[0-3]):[0-5]\d\s*(?:AM|PM)?/gi,
    /\b(?:[1-9]|1[0-2])(?::[0-5]\d)?\s*(?:AM|PM)\s*(?:-|\u2013|to)\s*(?:[1-9]|1[0-2])(?::[0-5]\d)?\s*(?:AM|PM)/gi,
  ];
  for (const pattern of patterns) {
    for (const match of raw.matchAll(pattern)) output.push({ id, title, value: match[0] });
  }
}

async function main() {
  if (!baseUrl || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");
  const inventory = await apiFetch("pages?per_page=250&include_data=false");
  const published = (inventory.pages || []).filter((page) => page.status === "publish");
  const categories = [];
  for (const id of categoryIds) {
    const page = published.find((item) => Number(item.id) === id);
    const data = await apiFetch(`pages/${id}`);
    const raw = JSON.stringify(data.elementor_data || []);
    const children = published.filter((item) => Number(item.parent_id) === id);
    const missing = children.filter((item) => !raw.includes(route(item.url))).map((item) => route(item.url));
    categories.push({ id, title: page?.title, route: route(page?.url), children: children.length, missing_count: missing.length, missing });
  }

  const services = await apiFetch("pages/61");
  const servicesRaw = JSON.stringify(services.elementor_data || []);
  const servicesMissing = categoryIds.filter((id) => {
    const page = published.find((item) => Number(item.id) === id);
    return !servicesRaw.includes(route(page.url));
  });

  const hours = [];
  const badLinks = [];
  for (const id of scanPageIds) {
    const data = await apiFetch(`pages/${id}`);
    const raw = JSON.stringify(data.elementor_data || []);
    collectHours(raw, id, data.title, hours);
    for (const value of knownBadPaths) if (raw.includes(value)) badLinks.push({ id, title: data.title, value });
  }
  for (const id of scanTemplateIds) {
    const data = await apiFetch(`templates/${id}`);
    const raw = JSON.stringify(data.elementor_data || []);
    collectHours(raw, `template-${id}`, data.title, hours);
    for (const value of knownBadPaths) if (raw.includes(value)) badLinks.push({ id: `template-${id}`, title: data.title, value });
  }

  const uniqueHours = [...new Map(hours.map((item) => [`${item.id}|${item.value}`, item])).values()];
  console.log(JSON.stringify({
    categories,
    services_missing_category_ids: servicesMissing,
    opening_hours: uniqueHours,
    known_bad_links: badLinks,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
