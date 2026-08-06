const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../..");
const templateDir = path.join(root, "sites", "nice-lk", "content", "templates");
const baselineFile = path.join(templateDir, "shop-photobooks-archive-6567.live-baseline.json");
const outputFile = path.join(templateDir, "shop-photobooks-archive-6567.elementor.json");
const albumFilter = "10x15,12x17,6x12,8x12";
const albumFilterUrl = "/shop/?product_cat=10x15%2C12x17%2C6x12%2C8x12";

function findWidget(elements, id) {
  for (const element of elements || []) {
    if (element.id === id) return element;
    const nested = findWidget(element.elements, id);
    if (nested) return nested;
  }
  return null;
}

function replaceOnce(source, search, replacement, label) {
  const first = source.indexOf(search);
  if (first < 0) throw new Error(`Could not find ${label} in the approved live baseline.`);
  if (source.indexOf(search, first + search.length) >= 0) {
    throw new Error(`Found more than one ${label}; refusing an ambiguous transform.`);
  }
  return source.replace(search, replacement);
}

const payload = JSON.parse(fs.readFileSync(baselineFile, "utf8"));
const filterWidget = findWidget(payload.elementor_data, "snshop06");
if (!filterWidget || filterWidget.widgetType !== "html" || typeof filterWidget.settings?.html !== "string") {
  throw new Error("Expected archive filter widget snshop06 was not found.");
}

let html = filterWidget.settings.html;
html = replaceOnce(
  html,
  ".snf-rw input[type=range]{-webkit-appearance:none;appearance:none;position:absolute;top:0;left:0;width:100%;height:100%;background:transparent;outline:none;margin:0}",
  ".snf-rw input[type=range]{-webkit-appearance:none;appearance:none;position:absolute;top:0;left:0;width:100%;height:100%;background:transparent;outline:none;margin:0}#snfMin{z-index:3}#snfMax{z-index:4}",
  "range input stacking styles"
);
html = replaceOnce(html, " style='z-index:3'", "", "minimum price inline style");
html = replaceOnce(html, " style='z-index:4'", "", "maximum price inline style");
html = replaceOnce(
  html,
  "    var html=\"<a class='snf-chip' href='/shop/'>All</a>\";",
  `    var html="<a class='snf-chip' href='${albumFilterUrl}'>All</a>";`,
  "dynamic All chip"
);
html = replaceOnce(
  html,
  "  var MX=100000,STEP=500;",
  [
    `  var ALBUM_CATEGORY_FILTER='${albumFilter}';`,
    "  var EXCLUDED_CATEGORY_SLUGS={'personalized-gifts':true,'mini-me':true,'t-shirt-printing':true,'corporate-gifts':true};",
    "  var initialUrl=new URL(window.location.href);",
    "  var initialPath=String(initialUrl.pathname||'').replace(/\\/$/,'');",
    "  if(/^\\/shop(?:\\/page\\/\\d+)?$/.test(initialPath)&&!initialUrl.searchParams.has('product_cat')){",
    "    initialUrl.searchParams.set('product_cat',ALBUM_CATEGORY_FILTER);",
    "    window.location.replace(initialUrl.toString());",
    "    return;",
    "  }",
    "  var MX=100000,STEP=500;"
  ].join("\n"),
  "archive script initialization"
);
html = replaceOnce(
  html,
  "<a class='snf-chip' href='/shop/'>All</a>",
  `<a class='snf-chip' href='${albumFilterUrl}'>All</a>`,
  "static All chip"
);
html = replaceOnce(
  html,
  "      if(slugLc==='10x15'||slugLc==='12x17'||slugLc==='6x12'||slugLc==='8x12'||slugLc==='uncategorized'){return;}",
  "      if(EXCLUDED_CATEGORY_SLUGS[slugLc]||slugLc==='10x15'||slugLc==='12x17'||slugLc==='6x12'||slugLc==='8x12'||slugLc==='uncategorized'){return;}",
  "category chip exclusion"
);

filterWidget.settings.html = html;
fs.writeFileSync(outputFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  output: path.relative(root, outputFile),
  template_id: 6567,
  album_categories: albumFilter.split(","),
  excluded_categories: ["personalized-gifts", "mini-me", "t-shirt-printing", "corporate-gifts"]
}, null, 2));
