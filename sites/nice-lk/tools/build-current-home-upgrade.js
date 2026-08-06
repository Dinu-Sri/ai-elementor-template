#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { compilePage } = require("../../../src/compiler/native-elementor-compiler");

const root = path.resolve(__dirname, "../../..");
const snapshotPath = path.join(root, "build", "site-intake", "nice-lk", "site-snapshot.json");
const additionsPath = path.join(
  root,
  "sites",
  "nice-lk",
  "blueprints",
  "nice-lk-home-current-upgrade.sections.blueprint.json"
);
const baselinePath = path.join(
  root,
  "sites",
  "nice-lk",
  "content",
  "pages",
  "home-v2-live-baseline.elementor.json"
);
const outputPath = path.join(
  root,
  "sites",
  "nice-lk",
  "content",
  "pages",
  "home-current-upgrade-preview.elementor.json"
);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function spacing(top, right, bottom, left) {
  return {
    unit: "px",
    top: String(top),
    right: String(right),
    bottom: String(bottom),
    left: String(left),
    isLinked: top === right && right === bottom && bottom === left
  };
}

function walk(nodes, visitor) {
  for (const node of nodes || []) {
    visitor(node);
    walk(node.elements, visitor);
  }
}

function tuneAdditions(nodes) {
  walk(nodes, (node) => {
    const settings = node.settings || {};
    for (const key of ["border_radius", "image_border_radius"]) {
      if (!settings[key] || !Array.isArray(settings[key].sizes)) continue;
      settings[key].sizes = settings[key].sizes.map((size) => Math.min(Number(size) || 0, 8));
      for (const side of ["top", "right", "bottom", "left"]) {
        if (settings[key][side] !== undefined) settings[key][side] = "8";
      }
    }
  });
}

if (!fs.existsSync(snapshotPath)) {
  throw new Error(`Missing fresh site snapshot: ${snapshotPath}`);
}

const snapshot = readJson(snapshotPath);
const liveHome = (snapshot.pages || []).find((page) => Number(page.id) === 238);
if (!liveHome || !Array.isArray(liveHome.elementor_data)) {
  throw new Error("Live homepage 238 was not found in the Nice.lk snapshot.");
}

const baseline = {
  title: liveHome.title,
  slug: liveHome.slug,
  status: liveHome.status,
  template: liveHome.template || "elementor_header_footer",
  page_settings: liveHome.page_settings || {},
  elementor_data: clone(liveHome.elementor_data)
};
writeJson(baselinePath, baseline);

const additions = compilePage(readJson(additionsPath));
const [categorySection, productSection, quoteSection] = clone(additions.elementor_data);
tuneAdditions([categorySection, productSection, quoteSection]);

for (const section of [categorySection, productSection]) {
  section.settings.padding = spacing(56, 24, 56, 24);
  section.settings.padding_tablet = spacing(48, 24, 48, 24);
  section.settings.padding_mobile = spacing(40, 16, 40, 16);
}

const categoryCards = categorySection.elements?.[0]?.elements?.[1]?.elements || [];
for (const card of categoryCards) {
  card.settings.width = { unit: "%", size: 23, sizes: [] };
  card.settings.width_tablet = { unit: "%", size: 48, sizes: [] };
  card.settings.width_mobile = { unit: "%", size: 100, sizes: [] };
  card.settings.padding = spacing(24, 20, 24, 20);
  card.settings.border_color = "rgba(91,22,197,0.14)";
  card.settings.border_radius = spacing(6, 6, 6, 6);
  card.settings.box_shadow_box_shadow_type = "yes";
  card.settings.box_shadow_box_shadow = {
    horizontal: 0,
    vertical: 8,
    blur: 28,
    spread: 0,
    color: "rgba(48,34,80,0.08)"
  };
}

const productCards = productSection.elements?.[0]?.elements?.[1]?.elements || [];
for (const card of productCards) {
  card.settings.background_background = "classic";
  card.settings.background_color = "#FFFFFF";
  card.settings.padding = spacing(16, 16, 18, 16);
  card.settings.border_border = "solid";
  card.settings.border_width = spacing(1, 1, 1, 1);
  card.settings.border_color = "rgba(91,22,197,0.12)";
  card.settings.border_radius = spacing(6, 6, 6, 6);
  const imageWidget = card.elements?.find((node) => node.widgetType === "image");
  if (imageWidget) {
    imageWidget.settings.height = { unit: "px", size: 250, sizes: [] };
    imageWidget.settings.height_tablet = { unit: "px", size: 230, sizes: [] };
    imageWidget.settings.height_mobile = { unit: "px", size: 280, sizes: [] };
    imageWidget.settings["object-fit"] = "contain";
  }
}

quoteSection.settings.padding = spacing(56, 24, 56, 24);
quoteSection.settings.padding_tablet = spacing(48, 24, 48, 24);
quoteSection.settings.padding_mobile = spacing(40, 16, 40, 16);

const currentSections = clone(liveHome.elementor_data);
walk(currentSections, (node) => {
  if (node.widgetType === "heading" && node.settings && node.settings.title === "Brithday") {
    node.settings.title = "Birthday";
  }
  if (node.settings && node.settings.ekit_heading_title === "{{2K+}} Happy Customers") {
    node.settings.ekit_heading_title = "2K+ Happy Customers";
  }
});

const heroSlides = currentSections[0]?.elements?.find((node) => node.widgetType === "slides");
if (heroSlides) {
  heroSlides.settings.slides_height_mobile = { unit: "px", size: 420, sizes: [] };
}

const photobookHeadingRow = currentSections[1]?.elements?.[0];
if (photobookHeadingRow?.elements?.length === 2) {
  photobookHeadingRow.elements[0].settings.width = { unit: "%", size: 45, sizes: [] };
  photobookHeadingRow.elements[1].settings.width = { unit: "%", size: 55, sizes: [] };
}

categorySection.settings._title = "New product categories";
productSection.settings._title = "New product showcase";
quoteSection.settings._title = "Bulk order call to action";

const upgradedSections = [
  currentSections[0],
  categorySection,
  currentSections[1],
  productSection,
  currentSections[2],
  currentSections[3],
  currentSections[4],
  quoteSection,
  currentSections[5],
  currentSections[6]
].filter(Boolean);

const preview = {
  title: "Home - Current Design Upgrade Preview",
  slug: "home-gift-print-preview",
  status: "draft",
  template: liveHome.template || "elementor_header_footer",
  page_settings: liveHome.page_settings || {},
  elementor_data: upgradedSections
};

writeJson(outputPath, preview);
console.log(`Saved live baseline: ${path.relative(root, baselinePath)}`);
console.log(`Saved upgraded preview: ${path.relative(root, outputPath)}`);
