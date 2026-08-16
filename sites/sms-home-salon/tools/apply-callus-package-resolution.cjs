const fs = require("fs");
const path = require("path");
const { validateTemplate } = require("../../../src/validator/elementor-native-lint");

const root = path.resolve(__dirname, "../../..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "sites/sms-home-salon/content/client-approved-navigation-migration.json"), "utf8").replace(/^\uFEFF/, ""));
const outputDir = path.join(root, "build/sites/sms-home-salon/client-navigation-migration/callus-resolution");
const apply = process.argv.includes("--apply");
const baseUrl = process.env.NEB_SITE_URL;
const apiKey = process.env.NEB_API_KEY;
const articleId = 1172;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function walk(value, visitor) {
  if (!value || typeof value !== "object") return;
  visitor(value);
  for (const child of Object.values(value)) walk(child, visitor);
}

async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`, {
    ...options,
    signal: AbortSignal.timeout(90000),
    headers: { "X-API-Key": apiKey, "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!response.ok) throw new Error(`${endpoint} failed with ${response.status}: ${JSON.stringify(data).slice(0, 1000)}`);
  return data;
}

function updateCard(card, packageItem) {
  const headings = [];
  const buttons = [];
  walk(card, (node) => {
    if (node?.widgetType === "heading") headings.push(node);
    if (node?.widgetType === "button") buttons.push(node);
  });
  const label = headings.find((node) => {
    const value = node.settings?.title || "";
    return !["Most Popular", "Duration", "Price", "From", "Package"].includes(value) && !/^(AED\b|\d+\s*min)/i.test(value);
  });
  const prices = headings.filter((node) => /^AED\b/i.test(node.settings?.title || ""));
  if (!label || !prices.length || !buttons.length) throw new Error("Callus package card structure was not recognised.");
  label.settings.title = packageItem.label;
  prices.forEach((node) => { node.settings.title = packageItem.price; });
  buttons[0].settings.text = "Book Callus Treatment";
  buttons[0].settings.link = { url: "", is_external: false, nofollow: false };
  buttons[0].settings._attributes = "data-service|Callus Treatment\ndata-cta|Book Callus Treatment";
}

function inspectPage(data, packages) {
  const cards = data?.[4]?.elements?.[0]?.elements?.[1]?.elements || [];
  const labels = [];
  const prices = [];
  const popupAttrs = [];
  let viewPackages = false;
  for (const card of cards) {
    walk(card, (node) => {
      if (node?.widgetType === "heading") {
        const value = node.settings?.title || "";
        if (/^AED\b/i.test(value)) prices.push(value);
        else if (!labels.includes(value) && !["Most Popular", "Duration", "Price", "From", "Package"].includes(value) && !/^\d+\s*min/i.test(value)) labels.push(value);
      }
    });
  }
  walk(data, (node) => {
    if (node?.widgetType !== "button") return;
    if (node.settings?.text === "View Packages") viewPackages = node.settings.link?.url === "#packages" && node.settings.link?.is_external === false;
    if (["Book Now", "Book Callus Treatment"].includes(node.settings?.text)) popupAttrs.push(node.settings?._attributes || "");
  });
  const expectedAttrs = "data-service|Callus Treatment\ndata-cta|Book Callus Treatment";
  return {
    labels_match: packages.every((item, index) => labels[index] === item.label),
    prices_match: packages.every((item, index) => prices[index] === item.price),
    view_packages_same_tab: viewPackages,
    popup_attributes_ok: popupAttrs.length === packages.length + 1 && popupAttrs.every((value) => value === expectedAttrs),
  };
}

async function main() {
  if (!baseUrl || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");
  const definition = manifest.callus_package_resolution;
  const status = await apiFetch("status");
  if (status.site_url !== "https://homesalon.ae" || status.bridge_version !== "0.9.0") throw new Error("Unexpected bridge target.");
  const [page, article] = await Promise.all([apiFetch(`pages/${definition.page_id}`), apiFetch(`posts/${articleId}`)]);
  if (page.status !== "publish" || new URL(page.url).pathname !== definition.target) throw new Error("Callus page identity mismatch.");
  if (!["publish", "future"].includes(article.status)) throw new Error("Nail pricing article status mismatch.");

  const data = clone(page.elementor_data);
  const cards = data?.[4]?.elements?.[0]?.elements?.[1]?.elements;
  if (!Array.isArray(cards) || cards.length !== 2) throw new Error(`Expected two Callus package cards, found ${cards?.length || 0}.`);
  definition.packages.forEach((item, index) => updateCard(cards[index], item));
  walk(data, (node) => {
    if (node?.widgetType !== "button" || !node.settings) return;
    if (node.settings.text === "Book Now") {
      node.settings.link = { url: "", is_external: false, nofollow: false };
      node.settings._attributes = "data-service|Callus Treatment\ndata-cta|Book Callus Treatment";
    }
    if (node.settings.text === "View Packages") node.settings.link = { url: "#packages", is_external: false, nofollow: false };
  });
  const contract = inspectPage(data, definition.packages);
  if (!Object.values(contract).every(Boolean)) throw new Error(`Callus candidate contract failed: ${JSON.stringify(contract)}`);
  const lint = validateTemplate({ elementor_data: data });
  const blockingErrors = lint.issues.filter((issue) => issue.severity === "error");
  if (blockingErrors.length) throw new Error(`Callus candidate has ${blockingErrors.length} blocking native lint errors.`);

  const oldArticleLine = `<li>Callus Treatment \u2014 AED 180</li>`;
  const newArticleLine = `<li>Callus Treatment \u2014 AED 160; With Polish \u2014 AED 180</li>`;
  const occurrences = article.content.split(oldArticleLine).length - 1;
  const alreadyUpdated = article.content.includes(newArticleLine);
  if (occurrences !== 1 && !alreadyUpdated) throw new Error(`Expected one old Callus article price line, found ${occurrences}.`);
  const articleContent = occurrences === 1 ? article.content.replace(oldArticleLine, newArticleLine) : article.content;
  const plan = { page_id: definition.page_id, article_id: articleId, contract, blocking_errors: 0, article_occurrences: occurrences, apply };
  writeJson(path.join(outputDir, "preflight.json"), plan);
  if (!apply) {
    console.log(JSON.stringify({ ok: true, dry_run: true, ...plan, outputDir }, null, 2));
    return;
  }

  writeJson(path.join(outputDir, "page.before.json"), page);
  writeJson(path.join(outputDir, "article.before.json"), article);
  await apiFetch(`pages/${definition.page_id}`, {
    method: "PUT",
    body: JSON.stringify({
      elementor_data: data,
      seo_description: "Book callus treatment at home in Dubai from AED 160, with a polish option at AED 180 and a hygienic women-only setup.",
    }),
  });
  if (articleContent !== article.content) await apiFetch(`posts/${articleId}`, { method: "PUT", body: JSON.stringify({ content: articleContent }) });
  const [savedPage, savedArticle] = await Promise.all([apiFetch(`pages/${definition.page_id}`), apiFetch(`posts/${articleId}`)]);
  const savedContract = inspectPage(savedPage.elementor_data, definition.packages);
  if (!Object.values(savedContract).every(Boolean) || savedPage.status !== page.status || savedPage.url !== page.url) throw new Error("Saved Callus page verification failed.");
  if (!savedArticle.content.includes(newArticleLine) || savedArticle.content.includes(oldArticleLine) || savedArticle.status !== article.status || savedArticle.url !== article.url) throw new Error("Saved Callus article verification failed.");
  writeJson(path.join(outputDir, "page.after.json"), savedPage);
  writeJson(path.join(outputDir, "article.after.json"), savedArticle);
  const cache = await apiFetch("clear-cache", { method: "POST", body: "{}" });
  writeJson(path.join(outputDir, "deployment-report.json"), { ...plan, saved_contract: savedContract, cache });
  console.log(JSON.stringify({ ok: true, page_id: definition.page_id, article_id: articleId, packages: definition.packages, cache, outputDir }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
