const fs = require("fs");
const path = require("path");

const baseUrl = String(process.env.NEB_SITE_URL || "").replace(/\/$/, "");
const apiKey = process.env.NEB_API_KEY;
if (!baseUrl || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");

const root = path.resolve(__dirname, "../../..");
const drawioPath = path.join(root, "sites/sms-home-salon/docs/sms-home-salon-navigation.drawio");
const markdownPath = path.join(root, "sites/sms-home-salon/docs/live-sitemap.md");
const snapshotPath = path.join(root, "build/sites/sms-home-salon/navigation-drawio/source-snapshot.json");

const legacyPageIds = new Set([
  60, 61, 62, 63, 64, 65, 66, 67, 69, 124,
  389, 390, 391, 392, 393, 394, 395, 396, 397, 398,
  399, 400, 401, 402, 403, 404, 546, 547,
]);
const categoryIds = [62, 65, 1377, 1378, 64, 1379, 1380, 1082, 66, 67];
const directSlugs = ["about", "services", "contact", "blog", "privacy", "terms", "nails"];

function endpoint(value) {
  return /\/wp-json\/native-elementor\/v1$/i.test(baseUrl)
    ? `${baseUrl}/${value}`
    : `${baseUrl}/wp-json/native-elementor/v1/${value}`;
}

async function apiFetch(value) {
  const response = await fetch(endpoint(value), {
    signal: AbortSignal.timeout(60000),
    headers: { "X-API-Key": apiKey },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`${value} failed with ${response.status}: ${JSON.stringify(payload).slice(0, 800)}`);
  return payload;
}

function xml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/gi, "&")
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"');
}

function title(page) {
  return decodeHtml(page.title).replace(/\s+at Home in Dubai$/i, "").replace(/\s+/g, " ").trim();
}

function route(url) {
  return new URL(url).pathname || "/";
}

function nodeStyle(page, isHub = false) {
  const legacy = legacyPageIds.has(Number(page.id));
  return [
    "rounded=1", "whiteSpace=wrap", "html=1", "arcSize=8",
    `fillColor=${legacy ? "#dbeafe" : "#dcfce7"}`,
    `strokeColor=${legacy ? "#2563eb" : "#16a34a"}`,
    `fontColor=${legacy ? "#1e3a8a" : "#14532d"}`,
    `strokeWidth=${isHub ? 3 : 2}`,
    `fontStyle=${isHub ? 1 : 0}`,
    "fontSize=13", "spacing=8", "shadow=0",
  ].join(";");
}

function label(page, suffix = "") {
  const classification = legacyPageIds.has(Number(page.id)) ? "LEGACY" : "NEW";
  return `<b>${xml(title(page))}</b>${suffix ? `<br><font color="#475569">${xml(suffix)}</font>` : ""}`
    + `<br><font color="#64748b" style="font-size:10px">${xml(route(page.url))} | ${classification}</font>`;
}

function addVertex(cells, id, value, x, y, width, height, style, link = "") {
  cells.push(`<mxCell id="${xml(id)}" value="${xml(value)}" style="${xml(style)}" vertex="1" parent="1"${link ? ` link="${xml(link)}"` : ""}>`
    + `<mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry"/>`
    + "</mxCell>");
}

function addEdge(cells, id, source, target) {
  const style = "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#94a3b8;strokeWidth=2;endArrow=block;endFill=1;";
  cells.push(`<mxCell id="${xml(id)}" style="${xml(style)}" edge="1" parent="1" source="${xml(source)}" target="${xml(target)}">`
    + "<mxGeometry relative=\"1\" as=\"geometry\"/>"
    + "</mxCell>");
}

function renderMenu(items, depth = 0, output = []) {
  for (const item of items || []) {
    output.push(`${"  ".repeat(depth)}- ${decodeHtml(item.title)} -> ${route(item.url)}`);
    renderMenu(item.children, depth + 1, output);
  }
  return output;
}

async function main() {
  const [listing, menuListing, status] = await Promise.all([
    apiFetch("pages?per_page=250"),
    apiFetch("menus"),
    apiFetch("status"),
  ]);
  const pages = (listing.pages || []).filter((page) => page.status === "publish");
  const byId = new Map(pages.map((page) => [Number(page.id), page]));
  const home = byId.get(124);
  const directPages = directSlugs.map((slug) => pages.find((page) => page.slug === slug)).filter(Boolean);
  const categories = categoryIds.map((id) => byId.get(id)).filter(Boolean);
  const childrenByCategory = new Map(categories.map((category) => [
    Number(category.id),
    pages.filter((page) => Number(page.parent_id) === Number(category.id))
      .sort((left, right) => Number(left.menu_order) - Number(right.menu_order) || title(left).localeCompare(title(right))),
  ]));
  if (!home || directPages.length !== directSlugs.length || categories.length !== categoryIds.length) {
    throw new Error("Required live sitemap roots are missing.");
  }
  const includedIds = new Set([
    Number(home.id),
    ...directPages.map((page) => Number(page.id)),
    ...categories.map((page) => Number(page.id)),
    ...[...childrenByCategory.values()].flat().map((page) => Number(page.id)),
  ]);
  const omitted = pages.filter((page) => !includedIds.has(Number(page.id)));
  if (omitted.length || includedIds.size !== pages.length) {
    throw new Error(`Navigation coverage mismatch. Published=${pages.length}, included=${includedIds.size}, omitted=${omitted.map((page) => page.id).join(",")}`);
  }
  const mainMenu = (menuListing.menus || []).find((menu) => Number(menu.id) === 12);
  if (!mainMenu || Number(mainMenu.count) !== 15 || !(mainMenu.locations || []).includes("menu-1")) {
    throw new Error("Approved Main Menu ID 12 is not assigned to menu-1 with 15 items.");
  }

  const legacyCount = pages.filter((page) => legacyPageIds.has(Number(page.id))).length;
  fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
  fs.writeFileSync(snapshotPath, `${JSON.stringify({
    captured_at: new Date().toISOString(),
    bridge_version: status.bridge_version,
    published_pages: pages.length,
    legacy_pages: legacyCount,
    new_pages: pages.length - legacyCount,
    menu: mainMenu,
    pages,
  }, null, 2)}\n`);

  const cells = ["<mxCell id=\"0\"/>", "<mxCell id=\"1\" parent=\"0\"/>"];
  const textStyle = "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontColor=#0f172a;";
  const columnWidth = 620;
  const graphWidth = Math.max(4200, categories.length * columnWidth + 120);
  addVertex(cells, "title", "<b>SMS Home Salon Website Navigation</b><br><font color=\"#64748b\" style=\"font-size:12px\">Approved published structure | generated from the live site | 12 Aug 2026</font>", 60, 30, 830, 60, `${textStyle}fontSize=24;`);
  addVertex(cells, "legend-old", "<b>Legacy page</b>", graphWidth - 920, 35, 180, 42, "rounded=1;whiteSpace=wrap;html=1;fillColor=#dbeafe;strokeColor=#2563eb;fontColor=#1e3a8a;strokeWidth=2;fontSize=13;");
  addVertex(cells, "legend-new", "<b>Newly added page</b>", graphWidth - 720, 35, 210, 42, "rounded=1;whiteSpace=wrap;html=1;fillColor=#dcfce7;strokeColor=#16a34a;fontColor=#14532d;strokeWidth=2;fontSize=13;");
  addVertex(cells, "summary", `<b>${pages.length} published pages</b><br><font color=\"#64748b\">${legacyCount} legacy | ${pages.length - legacyCount} newly added</font>`, graphWidth - 470, 30, 390, 54, `${textStyle}fontSize=13;align=right;`);
  addVertex(cells, `page-${home.id}`, label(home), Math.round(graphWidth / 2) - 140, 110, 280, 68, nodeStyle(home, true), home.url);

  const directGap = (graphWidth - 380) / Math.max(1, directPages.length - 1);
  directPages.forEach((page, index) => {
    const x = Math.round(40 + index * directGap);
    addVertex(cells, `page-${page.id}`, label(page, page.slug === "nails" ? "Excluded from header" : ""), x, 230, 340, 68, nodeStyle(page, page.slug === "services"), page.url);
    addEdge(cells, `edge-home-${page.id}`, `page-${home.id}`, `page-${page.id}`);
  });

  const services = directPages.find((page) => page.slug === "services");
  categories.forEach((category, column) => {
    const children = childrenByCategory.get(Number(category.id));
    const x = 60 + column * columnWidth;
    addVertex(cells, `page-${category.id}`, label(category, `${children.length} service pages`), x + 100, 390, 360, 78, nodeStyle(category, true), category.url);
    addEdge(cells, `edge-services-${category.id}`, `page-${services.id}`, `page-${category.id}`);
    children.forEach((child, row) => {
      const y = 520 + row * 82;
      addVertex(cells, `page-${child.id}`, label(child), x, y, 560, 64, nodeStyle(child), child.url);
      addEdge(cells, `edge-${category.id}-${child.id}`, `page-${category.id}`, `page-${child.id}`);
    });
  });
  const maxChildren = Math.max(...[...childrenByCategory.values()].map((children) => children.length));
  const canvasHeight = 650 + maxChildren * 82;
  addVertex(cells, "note", "<font color=\"#64748b\">Conceptual website navigation: detail pages are grouped below published category hubs. Click any page node to open its live URL.</font>", 60, canvasHeight - 50, 2100, 36, `${textStyle}fontSize=12;`);
  const drawio = [
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    "<mxfile host=\"app.diagrams.net\" modified=\"2026-08-12T00:00:00.000Z\" agent=\"Codex\" version=\"24.7.17\" type=\"device\">",
    "<diagram id=\"sms-home-salon-navigation\" name=\"Website Navigation\">",
    `<mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${graphWidth}" pageHeight="${canvasHeight}" math="0" shadow="0">`,
    "<root>", ...cells, "</root>", "</mxGraphModel>", "</diagram>", "</mxfile>", "",
  ].join("\n");
  fs.mkdirSync(path.dirname(drawioPath), { recursive: true });
  fs.writeFileSync(drawioPath, drawio);

  const sitemapLines = ["/"];
  for (const page of directPages.filter((item) => item.slug !== "services")) {
    sitemapLines.push(`+-- ${route(page.url).replace(/^\//, "")}${page.slug === "nails" ? " (legacy hub, excluded from header)" : ""}`);
  }
  for (const category of categories) {
    const categoryRoute = route(category.url);
    sitemapLines.push(`+-- ${categoryRoute.replace(/^\//, "")}`);
    for (const child of childrenByCategory.get(Number(category.id))) sitemapLines.push(`|   +-- ${route(child.url).replace(categoryRoute, "")}`);
  }
  const inventoryRows = pages.slice().sort((left, right) => route(left.url).localeCompare(route(right.url)))
    .map((page) => `| ${page.id} | ${title(page)} | ${route(page.url)} | ${legacyPageIds.has(Number(page.id)) ? "Legacy" : "New"} |`);
  const markdown = [
    "# SMS Home Ladies Salon Live Sitemap", "",
    "Date captured: 2026-08-12  ",
    "Source of truth: fresh Native Elementor Bridge live inventory  ",
    `Bridge version: ${status.bridge_version}  `,
    `Published pages: ${pages.length} (${legacyCount} legacy, ${pages.length - legacyCount} newly added)`, "",
    "## Approved Main Menu", "",
    "The active `Main Menu` is ID `12`, assigned to `menu-1`, with category-only service navigation.", "",
    "```text", ...renderMenu(mainMenu.tree || []), "```", "",
    "The published `/nails/` legacy umbrella page remains available but is intentionally excluded from the header.", "",
    "## Published Page Hierarchy", "", "```text", ...sitemapLines, "```", "",
    "## Page Inventory", "", "| ID | Page | Route | Classification |", "| ---: | --- | --- | --- |", ...inventoryRows, "",
    "## Migration Verification", "",
    "- 44 approved old routes return direct one-hop 301 redirects.",
    "- All 44 canonical targets return HTTP 200.",
    "- Five approved new pages are published.",
    "- Eight absorbed or omitted pages are drafts with active redirects.",
    "- No retired links remain across 91 pages, eight templates, or 50 posts.", "",
  ].join("\n");
  fs.writeFileSync(markdownPath, markdown);

  console.log(JSON.stringify({
    drawio: drawioPath,
    markdown: markdownPath,
    published_pages: pages.length,
    legacy_pages: legacyCount,
    new_pages: pages.length - legacyCount,
    menu_items: mainMenu.count,
    category_counts: Object.fromEntries(categories.map((page) => [title(page), childrenByCategory.get(Number(page.id)).length])),
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
