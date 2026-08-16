const fs = require("fs");
const path = require("path");

const baseUrl = String(process.env.NEB_SITE_URL || "").replace(/\/$/, "");
const apiKey = process.env.NEB_API_KEY;
if (!baseUrl || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");

const rootDir = path.resolve(__dirname, "../../..");
const clientFile = process.env.CLIENT_SITEMAP_FILE
  || "C:/Users/User/.codex/attachments/80aab27e-b98f-4e75-8b9c-46dbd8f300e0/pasted-text.txt";
const outputDir = path.join(rootDir, "build/sites/sms-home-salon/client-sitemap-reconciliation");

const hubs = [
  ["Massage", "/massage/", "Legacy"],
  ["Facial", "/facial/", "Legacy"],
  ["Bleach", "/bleach/", "New"],
  ["Scrub", "/scrub/", "New"],
  ["Hair", "/hair/", "Legacy"],
  ["Nails", "/nails/", "Legacy"],
  ["Manicure", "/manicure/", "New"],
  ["Pedicure", "/pedicure/", "New"],
  ["Waxing", "/waxing/", "Legacy"],
  ["Threading", "/threading/", "Legacy"]
];

const migrations = [
  ["/bleach/full-arm-bleaching/", ["/facial/full-arm-bleaching/"], "move"],
  ["/bleach/full-legs-bleaching/", ["/facial/full-legs-bleaching/"], "move"],
  ["/bleach/full-back-front-bleaching/", ["/facial/full-back-front-bleaching/"], "move"],
  ["/scrub/face-scrub/", ["/facial/face-scrub/"], "move"],
  ["/scrub/full-arm-scrub/", ["/facial/full-arm-scrub/"], "move"],
  ["/scrub/full-back-front-scrub/", ["/facial/full-back-front-scrub/"], "move"],
  ["/scrub/full-body-scrub/", ["/facial/full-body-scrub/"], "move"],
  ["/scrub/full-body-scrub-with-mask/", ["/facial/full-body-scrub-with-mask/"], "move"],
  ["/manicure/hand-paraffin-manicure/", ["/nails/hand-paraffin/"], "move-and-confirm-slug"],
  ["/manicure/classic-manicure/", ["/nails/classic-manicure/"], "move"],
  ["/manicure/spa-manicure/", ["/nails/spa-manicure/"], "move"],
  ["/manicure/classic-nails-extension/", ["/nails/classic-nails-extension/"], "move"],
  ["/manicure/gelish-manicure/", ["/nails/gelish-manicure/"], "move"],
  ["/manicure/french-gel-manicure/", ["/nails/french-gel-manicure/"], "move"],
  ["/manicure/cat-eye-extensions/", ["/nails/cat-eye-extensions/"], "move"],
  ["/manicure/acrylic-nail/", ["/nails/acrylic-nail/"], "move-existing-canonical"],
  ["/manicure/gel-nail-extensions/", ["/nails/gel-nail-extensions/"], "move-existing-canonical"],
  ["/manicure/builder-gel-nails/", ["/nails/builder-gel-nails/"], "move"],
  ["/kids/", ["/nails/kids/"], "move"],
  ["/pedicure/foot-paraffin/", ["/nails/foot-paraffin/"], "move"],
  ["/pedicure/classic-pedicure/", ["/nails/classic-pedicure/"], "move"],
  ["/pedicure/gel-pedicure/", ["/nails/gel-pedicure/"], "move"],
  ["/pedicure/spa-pedicure/", ["/nails/spa-pedicure/"], "move"],
  ["/pedicure/callus-pedicure/", ["/nails/callus/"], "move-and-rename"],
  ["/pedicure/foot-scrub-pedicure/", ["/nails/foot-scrub/"], "move-and-rename"],
  ["/waxing/upper-lip-waxing/", ["/waxing/upper-lip/"], "rename"],
  ["/waxing/eyebrows-waxing/", ["/waxing/eyebrows/"], "rename"],
  ["/waxing/chin-waxing/", ["/waxing/chin/"], "rename"],
  ["/waxing/underarms-waxing/", ["/waxing/underarms/"], "rename"],
  ["/waxing/chest-waxing/", ["/waxing/chest/"], "rename"],
  ["/waxing/stomach-waxing/", ["/waxing/half-stomach/", "/waxing/full-stomach/"], "merge"],
  ["/waxing/legs-waxing/", ["/waxing/half-legs/", "/waxing/full-legs/"], "merge"],
  ["/waxing/arms-waxing/", ["/waxing/half-arms/", "/waxing/full-arms/"], "merge"],
  ["/waxing/bikini-waxing/", ["/waxing/bikini/"], "rename"],
  ["/waxing/face-waxing/", ["/waxing/full-face/"], "rename"],
  ["/waxing/full-body-waxing/", ["/waxing/full-body-without-bikini/", "/waxing/full-body-with-bikini/"], "merge"]
];

const removals = [
  ["/threading/full-face-with-eyebrows/", "/threading/full-face-without-eyebrows/", "merge pricing/content into approved Full Face Threading page"],
  ["/threading/brows-upper-lip/", "/threading/", "not present in the approved inventory"],
  ["/threading/brows-chin/", "/threading/", "not present in the approved inventory"],
  ["/threading/custom-pack/", "/threading/", "not present in the approved inventory"]
];

function endpoint(value) {
  if (/\/wp-json\/native-elementor\/v1$/i.test(baseUrl)) return `${baseUrl}/${value}`;
  return `${baseUrl}/wp-json/native-elementor/v1/${value}`;
}

async function apiFetch(value) {
  const response = await fetch(endpoint(value), {
    headers: { "X-API-Key": apiKey },
    signal: AbortSignal.timeout(45000)
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`${value} failed with ${response.status}`);
  return payload;
}

async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next++;
      try {
        results[index] = await worker(items[index]);
      } catch (error) {
        results[index] = { id: items[index].id, error: error.message };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

function routeFromUrl(value) {
  try {
    const route = new URL(value, "https://homesalon.ae").pathname;
    return route === "/" ? route : `${route.replace(/\/$/, "")}/`;
  } catch {
    return value;
  }
}

function parseClientInventory(markdown) {
  const pages = [];
  for (const line of markdown.split(/\r?\n/)) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    if (!cells.length || cells[0] === "Page" || /^---/.test(cells[0])) continue;
    const urlCell = cells.find((cell) => /^`\//.test(cell));
    if (!urlCell) continue;
    const route = routeFromUrl(urlCell.replace(/`/g, ""));
    const statusCell = cells.find((cell) => /Legacy|New|Unclear/i.test(cell)) || "";
    const pricing = cells.length >= 4 ? cells[cells.length - 1] : "";
    pages.push({
      title: cells[0].replace(/\*\*/g, ""),
      route,
      status: /Unclear/i.test(statusCell) ? "Unclear" : (/Legacy/i.test(statusCell) ? "Legacy" : "New"),
      pricing,
      expected_prices: [...new Set([...pricing.matchAll(/AED\s*(\d+(?:\.\d+)?)/gi)].map((match) => Number(match[1])))]
    });
  }
  for (const [title, route, status] of hubs) pages.push({ title, route, status, pricing: "", expected_prices: [] });
  const unique = [...new Map(pages.map((page) => [page.route, page])).values()];
  unique.sort((left, right) => left.route.localeCompare(right.route));
  return unique;
}

function extractPrices(data) {
  const text = JSON.stringify(data || {});
  return [...new Set([...text.matchAll(/AED(?:&nbsp;|\s|<[^>]+>)*(\d+(?:\.\d+)?)/gi)].map((match) => Number(match[1])))]
    .sort((left, right) => left - right);
}

function markdownTable(rows, columns) {
  const output = [];
  output.push(`| ${columns.map((column) => column.label).join(" | ")} |`);
  output.push(`| ${columns.map((column) => column.align || "---").join(" | ")} |`);
  for (const row of rows) {
    output.push(`| ${columns.map((column) => String(column.value(row) ?? "").replace(/\|/g, "\\|")).join(" | ")} |`);
  }
  return output.join("\n");
}

async function main() {
  const clientMarkdown = fs.readFileSync(clientFile, "utf8");
  const proposed = parseClientInventory(clientMarkdown);
  if (proposed.length !== 93) throw new Error(`Expected 93 proposed routes, parsed ${proposed.length}.`);

  const [status, pageListing, menuListing] = await Promise.all([
    apiFetch("status"),
    apiFetch("pages?per_page=250"),
    apiFetch("menus")
  ]);
  const livePages = (pageListing.pages || []).filter((page) => page.status === "publish");
  const details = await pool(livePages, 8, (page) => apiFetch(`pages/${page.id}`));
  const detailById = new Map(details.filter((detail) => !detail.error).map((detail) => [Number(detail.id), detail]));
  const liveByRoute = new Map(livePages.map((page) => [routeFromUrl(page.url), page]));
  const proposedByRoute = new Map(proposed.map((page) => [page.route, page]));
  const migrationByTarget = new Map(migrations.map(([target, sources, action]) => [target, { target, sources, action }]));

  const exact = proposed.filter((page) => liveByRoute.has(page.route));
  const missing = proposed.filter((page) => !liveByRoute.has(page.route)).map((page) => {
    const migration = migrationByTarget.get(page.route);
    return {
      ...page,
      action: migration?.action || "create",
      sources: migration?.sources || []
    };
  });
  const currentOnly = livePages
    .map((page) => ({ ...page, route: routeFromUrl(page.url) }))
    .filter((page) => !proposedByRoute.has(page.route));

  const priceChecks = proposed.filter((page) => page.expected_prices.length).map((page) => {
    const migration = migrationByTarget.get(page.route);
    const sourceRoutes = liveByRoute.has(page.route) ? [page.route] : (migration?.sources || []);
    if (page.route === "/threading/full-face-without-eyebrows/") {
      sourceRoutes.push("/threading/full-face-with-eyebrows/");
    }
    const sourcePages = sourceRoutes.map((route) => liveByRoute.get(route)).filter(Boolean);
    const livePrices = [...new Set(sourcePages.flatMap((source) => extractPrices(detailById.get(Number(source.id)))))].sort((a, b) => a - b);
    const missingPrices = page.expected_prices.filter((price) => !livePrices.includes(price));
    return {
      route: page.route,
      title: page.title,
      expected_prices: page.expected_prices,
      source_routes: sourceRoutes,
      live_prices: livePrices,
      missing_prices: missingPrices
    };
  });
  const pricingConflicts = priceChecks.filter((check) => check.missing_prices.length);

  const report = {
    generated_at: new Date().toISOString(),
    bridge_version: status.bridge_version,
    summary: {
      client_inventory_routes: proposed.length,
      live_published_routes: livePages.length,
      exact_route_matches: exact.length,
      target_routes_not_live: missing.length,
      live_routes_not_in_target: currentOnly.length,
      new_hubs_required: missing.filter((item) => item.action === "create" && item.route.split("/").filter(Boolean).length === 1).length,
      new_detail_pages_required: missing.filter((item) => item.action === "create" && item.route.split("/").filter(Boolean).length > 1).length,
      route_migrations_or_merges: missing.filter((item) => item.action !== "create").length,
      pricing_conflicts: pricingConflicts.length,
      current_main_menu_items: menuListing.menus?.[0]?.items?.length || 0
    },
    proposed,
    exact,
    missing,
    current_only: currentOnly,
    migrations: migrations.map(([target, sources, action]) => ({ target, sources, action })),
    removals: removals.map(([source, redirect, reason]) => ({ source, redirect, reason })),
    price_checks: priceChecks,
    pricing_conflicts: pricingConflicts
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "client-sitemap-reconciliation.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const lines = [
    "# SMS Home Salon Client Sitemap Reconciliation",
    "",
    `Generated: ${report.generated_at}`,
    `Live source: Native Elementor Bridge ${report.bridge_version}`,
    "",
    "## Executive Summary",
    "",
    `- Client inventory: ${report.summary.client_inventory_routes} routes.`,
    `- Current live site: ${report.summary.live_published_routes} published routes.`,
    `- Exact URL matches: ${report.summary.exact_route_matches}.`,
    `- Proposed URLs not currently live: ${report.summary.target_routes_not_live}.`,
    `- Current live URLs absent from the proposal: ${report.summary.live_routes_not_in_target}.`,
    "- Four new category hubs are required: Bleach, Scrub, Manicure, and Pedicure.",
    "- One genuinely new detail page is required: French Gel Nail Extensions.",
    "",
    "> The client count of 93 includes both legacy Nails detail URLs and their proposed Manicure counterparts, while also recommending 301 redirects from the legacy URLs. A redirected URL is not an active page. The recommended canonical implementation therefore has 91 active/indexable pages, plus redirect records for retired URLs.",
    "",
    "## Proposed Routes Not Live",
    "",
    markdownTable(missing, [
      { label: "Target", value: (row) => `\`${row.route}\`` },
      { label: "Action", value: (row) => row.action },
      { label: "Current source", value: (row) => row.sources.map((source) => `\`${source}\``).join("<br>") || "None" }
    ]),
    "",
    "## Current Routes Outside Client Inventory",
    "",
    markdownTable(currentOnly, [
      { label: "ID", align: "---:", value: (row) => row.id },
      { label: "Current route", value: (row) => `\`${row.route}\`` },
      { label: "Page", value: (row) => row.title }
    ]),
    "",
    "## Pricing Values Missing From Current Content",
    "",
    pricingConflicts.length ? markdownTable(pricingConflicts, [
      { label: "Target", value: (row) => `\`${row.route}\`` },
      { label: "Missing AED values", value: (row) => row.missing_prices.join(", ") },
      { label: "Values detected", value: (row) => row.live_prices.join(", ") || "None" }
    ]) : "No missing client-specified AED values were detected.",
    ""
  ].join("\n");
  fs.writeFileSync(path.join(outputDir, "client-sitemap-reconciliation.md"), `${lines}\n`, "utf8");
  console.log(JSON.stringify(report.summary, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
