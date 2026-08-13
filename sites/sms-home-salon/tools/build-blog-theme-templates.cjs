const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../..");
const sourceDir = path.join(root, "sites/sms-pet-grooming/content/elementor/blog");
const outputDir = path.join(root, "sites/sms-home-salon/content/templates");

const sources = {
  archive: path.join(sourceDir, "blog-theme-archive-1236.payload.json"),
  single: path.join(sourceDir, "blog-theme-single-live-1237.payload.json"),
  loop: path.join(root, "legacy/site-workflows/blog-v1/payloads/blog-loop.payload.json")
};

const outputs = {
  archive: path.join(outputDir, "sms-home-salon-blog-archive-2026.payload.json"),
  single: path.join(outputDir, "sms-home-salon-blog-single-2026.payload.json"),
  loop: path.join(outputDir, "sms-home-salon-blog-loop-2026.payload.json")
};

const colorMap = new Map([
  ["#FFF4E6", "#FFF2F5"],
  ["#C96800", "#9F435D"],
  ["#1F1E1E", "#202124"],
  ["#5C2B02", "#202124"],
  ["#FF9807", "#C97084"],
  ["#FFEACD", "#E7D9DD"],
  ["#FFFDF9", "#FFFDFC"],
  ["#625C56", "#667085"],
  ["#F4E8DA", "#E7D9DD"],
  ["#FFF8EF", "#EEF6F1"],
  ["#AC836E", "#C97084"],
  ["#61340A", "#9F435D"],
  ["#2A2A2A", "#202124"],
  ["#9E5C3B", "#9F435D"],
  ["#E76A2B", "#202124"],
  ["#00B82E", "#4F7F68"],
  ["rgba(49,31,14,0.28)", "rgba(32,33,36,0.20)"]
]);

const textMap = new Map([
  ["SMS PET GROOMING &nbsp;•&nbsp; PRACTICAL PET CARE IN DUBAI", "SMS HOME SALON &nbsp;•&nbsp; PRACTICAL BEAUTY CARE IN DUBAI"],
  ["The Pet Care Journal", "The Home Beauty Journal"],
  ["Helpful, veterinarian-conscious grooming guidance for happier dogs, cats, birds, and rabbits across Dubai.", "Practical guidance for massage, nails, hair, facials, waxing, threading, and at-home beauty appointments across Dubai."],
  ["Book Mobile Grooming", "Book a Home Salon Visit"],
  ["Clear Advice for Better Grooming Days", "Clear Advice for Better Beauty Appointments"],
  ["From coat care and climate-friendly routines to preparing for an at-home appointment, every guide is written to make pet care feel simpler.", "From choosing the right treatment to preparing for an at-home appointment, every guide is written to make beauty care feel simpler."],
  ["Load More Guides", "Load More Beauty Guides"],
  ["You have reached the end of our pet care guides.", "You have reached the end of our home beauty guides."],
  ["More practical pet care guides are coming soon.", "More practical home beauty guides are coming soon."],
  ["READY FOR A CALMER GROOMING DAY?", "READY FOR AN EASIER BEAUTY APPOINTMENT?"],
  ["Bring Professional Pet Grooming Home", "Bring Professional Salon Care Home"],
  ["Choose your pet, select a package, and let our mobile team bring the grooming setup to your Dubai home.", "Choose your service and let our women-only team bring the salon setup to your home, hotel, or office in Dubai."],
  ["SMS PET GROOMING &nbsp;•&nbsp; PET CARE GUIDE", "SMS HOME SALON &nbsp;•&nbsp; BEAUTY CARE GUIDE"],
  ["Some supporting visuals in this article may be AI-assisted illustrations created to explain grooming concepts. They do not document a specific SMS Pet Grooming customer, pet, appointment, or guaranteed result. Where real service evidence matters, we aim to use consented photographs and records from actual appointments.</p><p>For current services, suitability, or evidence from an actual grooming appointment, speak with our team.", "Some supporting visuals in this article may be AI-assisted illustrations created to explain beauty and wellness concepts. They do not document a specific SMS Home Salon customer, appointment, or guaranteed result. Where real service evidence matters, we aim to use consented photographs and records from actual appointments.</p><p>For current services, suitability, or evidence from an actual home salon appointment, speak with our team."],
  ["NEED A GROOMER?", "READY TO BOOK AT HOME?"],
  ["Professional Pet Care at Your Door", "Professional Salon Care at Your Door"],
  ["Our mobile team brings the grooming setup to your Dubai home for dogs, cats, birds, and rabbits.", "Our women-only team brings the salon setup to your home, hotel, or office across Dubai."],
  ["Home-based convenience", "Women-only at-home service"],
  ["Clear grooming packages", "Clear service packages"],
  ["More Practical Pet Care Guides", "More Practical Home Beauty Guides"],
  ["Read Guide", "Read Article"]
]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function translate(value) {
  if (Array.isArray(value)) return value.map(translate);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, translate(item)]));
  }
  if (typeof value !== "string") return value;
  if (colorMap.has(value)) return colorMap.get(value);
  let translated = value;
  for (const [source, replacement] of textMap) {
    translated = translated.replaceAll(source, replacement);
  }
  return translated;
}

function walk(elements, callback) {
  for (const element of elements || []) {
    callback(element);
    walk(element.elements, callback);
  }
}

function dynamicTag(name, settings = {}, id = "21c15c7") {
  return `[elementor-tag id="${id}" name="${name}" settings="${encodeURIComponent(JSON.stringify(settings))}"]`;
}

function zeroSpacing() {
  return {
    unit: "px",
    top: "0",
    right: "0",
    bottom: "0",
    left: "0",
    isLinked: false
  };
}

function addNativeMarginResets(element) {
  element.settings._margin = element.settings._margin || zeroSpacing();
  element.settings._margin_tablet = element.settings._margin_tablet || zeroSpacing();
  element.settings._margin_mobile = element.settings._margin_mobile || zeroSpacing();
}

function popupLink() {
  return dynamicTag("popup", { popup: "555" });
}

function articleServiceAttributes() {
  return dynamicTag("post-terms", {
    taxonomy: "category",
    before: "data-service|",
    after: "\ndata-cta|Book This Service"
  }, "6b9a7e2");
}

function configurePopupButton(element, dynamicService = false) {
  element.settings.link = { url: "/#booking" };
  element.settings._attributes = dynamicService
    ? "data-service|Home Salon Services\ndata-cta|Book This Service"
    : "data-service|Home Salon Services\ndata-cta|Book Home Salon Services";
  element.settings.__dynamic__ = {
    ...(element.settings.__dynamic__ || {}),
    link: popupLink()
  };
  if (dynamicService) {
    element.settings.__dynamic__._attributes = articleServiceAttributes();
  }
}

function disableDateArchiveLink(element) {
  if (element.widgetType !== "post-info" || !Array.isArray(element.settings?.icon_list)) return;
  for (const item of element.settings.icon_list) {
    if ((item.type || "date") === "date") item.link = "";
  }
}

function buildLoop() {
  const payload = translate(readJson(sources.loop));
  payload.title = "SMS Home Salon Blog Loop - 2026";
  payload.type = "loop-item";
  payload.conditions = [];
  walk(payload.elementor_data, disableDateArchiveLink);
  return payload;
}

function buildArchive() {
  const payload = translate(readJson(sources.archive));
  payload.title = "SMS Home Salon Blog Archive - 2026";
  payload.type = "archive";
  payload.conditions = [];
  walk(payload.elementor_data, (element) => {
    if (element.widgetType === "loop-grid") {
      element.settings.template_id = "0";
    }
    if (element.widgetType === "button" && ["0000005", "0000013"].includes(element.id)) {
      configurePopupButton(element, false);
    }
  });
  return payload;
}

function buildSingle() {
  const payload = translate(readJson(sources.single));
  payload.title = "SMS Home Salon Blog Single - 2026";
  payload.type = "single-post";
  payload.conditions = [];
  walk(payload.elementor_data, (element) => {
    disableDateArchiveLink(element);
    if (element.widgetType === "button" && ["03a3b5a", "000003a"].includes(element.id)) {
      configurePopupButton(element, true);
    }
    if (["19c9d42", "1b506c1", "29fcce1", "c8a6b7e", "556ca5c", "85b5b53"].includes(element.id)) {
      addNativeMarginResets(element);
    }
    if (["29fcce1", "85b5b53"].includes(element.id)) {
      element.settings.flex_direction = "column";
    }
    if (element.id === "19c9d42") {
      element.settings.padding = element.settings.padding || zeroSpacing();
      element.settings.padding_tablet = element.settings.padding_tablet || zeroSpacing();
      element.settings.padding_mobile = element.settings.padding_mobile || zeroSpacing();
    }
  });
  return payload;
}

function main() {
  const payloads = {
    loop: buildLoop(),
    archive: buildArchive(),
    single: buildSingle()
  };
  for (const [key, payload] of Object.entries(payloads)) {
    writeJson(outputs[key], payload);
  }
  console.log(JSON.stringify({ ok: true, outputs }, null, 2));
}

main();
