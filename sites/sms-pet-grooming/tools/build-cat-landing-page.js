const fs = require("fs");
const path = require("path");

const siteRoot = path.resolve(__dirname, "..");
const suiteRoot = path.resolve(siteRoot, "..", "..");
const sourcePath = path.join(
  siteRoot,
  "content",
  "elementor",
  "baselines",
  "dog-landing-live-1044.json"
);
const outputPath = path.join(
  suiteRoot,
  "build",
  "sites",
  "sms-pet-grooming",
  "native-sources",
  "sms-pet-cat-landing.payload.json"
);

const colorMap = new Map([
  ["#5C2B02", "#174D8F"],
  ["#FFEACD", "#EAF4FF"],
  ["#FFF8F1", "#F7FBFF"],
  ["#FFDCB9", "#DCEEFF"],
  ["#8A3F07BD", "#2563A8BD"],
  ["#8A3F0778", "#3382EA78"],
  ["#8A3F07", "#2563A8"],
  ["#C57309", "#1E6CFF"],
  ["#996108", "#174D8F"],
  ["#FFB672", "#8CC8FF"],
  ["#00D828", "#3382EA"],
  ["#00D8B4", "#2CB5E8"],
  ["#FF9807", "#7C62FF"],
  ["#493213", "#173A63"],
  ["#4B0D0D", "#173A63"]
]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function walk(elements, visit) {
  for (const element of elements || []) {
    visit(element);
    walk(element.elements, visit);
  }
}

function indexElements(elements) {
  const index = new Map();
  walk(elements, (element) => index.set(element.id, element));
  return index;
}

function replaceColors(value) {
  if (Array.isArray(value)) return value.map(replaceColors);
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) value[key] = replaceColors(child);
    return value;
  }
  if (typeof value !== "string") return value;

  let result = value;
  for (const [from, to] of colorMap) {
    result = result.replace(new RegExp(from, "gi"), to);
  }
  return result;
}

function zeroBox() {
  return {
    unit: "px",
    top: "0",
    right: "0",
    bottom: "0",
    left: "0",
    isLinked: true
  };
}

function build() {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing protected dog landing baseline: ${sourcePath}`);
  }

  const source = readJson(sourcePath);
  if (source.id !== 1044 || source.slug !== "native-review-sms-pet-landing-page") {
    throw new Error("The source file is not the protected live dog landing page baseline.");
  }

  const elementorData = JSON.parse(JSON.stringify(source.elementor_data));
  const index = indexElements(elementorData);
  const get = (id) => {
    const element = index.get(id);
    if (!element) throw new Error(`Expected Elementor element ${id} was not found.`);
    return element;
  };
  const heading = (id, title) => {
    get(id).settings.title = title;
  };
  const editor = (id, html) => {
    get(id).settings.editor = html;
  };
  const button = (id, text, url = "#book-now-form") => {
    const widget = get(id);
    widget.settings.text = text;
    widget.settings.link = { ...(widget.settings.link || {}), url };
  };

  // Apply the cat palette to page-specific sections, preserving shared service-card colors.
  for (const section of elementorData) {
    if (section.id !== "0000143") replaceColors(section);
  }
  get("0000143").settings.background_color = "#DCEEFF";

  heading("0000007", "Cat Grooming at Home in Dubai");
  heading("0000008", "Cat Grooming <br> at Your Dubai Home");
  editor(
    "0000009",
    "<p>Give your cat a cleaner coat, neatly trimmed nails, fresh ears, and a calmer grooming experience without travelling to a salon.</p>"
  );
  heading("0000004", "Starting from AED 200");
  button("0000001", "Book Cat Grooming");
  button("0000002", "View Packages", "#cat-packages");

  heading("0000012", "At-Home Comfort");
  editor(
    "0000013",
    "<p>Your cat stays in familiar surroundings while the grooming setup comes directly to your home.</p>"
  );
  heading("0000016", "Two Clear Packages");
  editor(
    "0000017",
    "<p>Choose Basic or Full grooming based on your cat's coat condition and the level of care needed.</p>"
  );
  editor(
    "000001b",
    "<p>Bathing, brushing, nail clipping, ear and eye cleaning, deshedding, and hygiene care in one visit.</p>"
  );
  heading("0000022", "Cat-Safe Products");
  editor(
    "0000023",
    "<p>A clean mobile setup with products selected for safe, gentle everyday cat grooming.</p>"
  );
  get("0000015").settings.selected_icon = { value: "fas fa-cat", library: "fa-solid" };

  heading("000004a", "When Cat Grooming at Home Makes Sense");
  editor(
    "0000029",
    "<p>Regular grooming keeps your cat's coat cleaner, easier to manage, and more comfortable between visits.</p>"
  );
  heading("000002b", "Cats Who Dislike Travel");
  editor(
    "000002c",
    "<p>A mobile appointment helps cats avoid car rides, crowded salons, unfamiliar animals, and stressful waiting areas.</p>"
  );
  heading("0000033", "Every 4-8 Weeks");
  editor(
    "0000034",
    "<p>Many cats benefit from a regular coat, nail, deshedding, and hygiene routine.</p>"
  );
  heading("0000036", "Before Travel or Visitors");
  editor(
    "0000037",
    "<p>Book ahead of travel, boarding, visitors, or whenever you want your cat feeling fresh and comfortable.</p>"
  );
  editor(
    "000003a",
    "<p>Dematting, deshedding, ticks, and hygiene trims are easier to handle before they become uncomfortable.</p>"
  );
  editor(
    "000003f",
    "<p>Choose Basic or Full grooming based on your cat's coat condition and grooming needs.</p>"
  );

  heading("00000eb", "Cat Grooming Discounts");
  get("b5df963").settings.selected_icon = { value: "fas fa-cat", library: "fa-solid" };

  // Combine the two cat packages into one balanced, centered card row.
  heading("0000076", "Cat Grooming Packages and Prices");
  get("000007a").settings._element_id = "cat-packages";
  heading("000005a", "Basic Grooming");
  heading("000005c", "Cat Basic Grooming");
  editor("000005d", "<p>A complete routine grooming refresh for cats in the comfort of home.</p>");
  heading("000005f", "AED 200");
  editor(
    "0000060",
    "<ul><li>Nail clipping and paw trim</li><li>Ear, paw, and eye cleaning</li><li>Bum-area trim or shave</li><li>Bath and blow dry</li><li>Deshedding and brushing</li><li>Perfume when requested</li><li>Anal glands expression</li></ul>"
  );
  button("0000061", "Select Basic Grooming");

  heading("000007c", "Full Grooming");
  heading("000007e", "Cat Full Grooming");
  editor(
    "000007f",
    "<p>A more complete grooming session with all-over shaving or trimming when required.</p>"
  );
  heading("0000081", "AED 280");
  editor(
    "0000082",
    "<ul><li>Nail clipping and paw trim</li><li>Ear, paw, and eye cleaning</li><li>Bum-area trim or shave</li><li>Bath and blow dry</li><li>Deshedding and brushing</li><li>Perfume when requested</li><li>Anal glands expression</li><li>Shave and trimming all over</li></ul>"
  );
  button("0000083", "Select Full Grooming");

  const packageRow = get("0000079");
  packageRow.elements = [get("0000062"), get("0000084")];
  packageRow.settings.flex_justify_content = "center";
  packageRow.settings.flex_gap = { column: "28", row: "28", unit: "px", isLinked: true };
  for (const cardId of ["0000062", "0000084"]) {
    const settings = get(cardId).settings;
    settings.width = { unit: "%", size: 47, sizes: [] };
    settings.width_tablet = { unit: "%", size: 47, sizes: [] };
    settings.width_mobile = { unit: "%", size: 100, sizes: [] };
  }
  get("000007b").settings.padding.bottom = "40";
  const fullSectionIndex = elementorData.findIndex((section) => section.id === "000009d");
  if (fullSectionIndex === -1) throw new Error("Expected full-grooming section was not found.");
  elementorData.splice(fullSectionIndex, 1);

  const setList = (id, items) => {
    const list = get(id).settings.icon_list;
    if (!Array.isArray(list) || list.length !== items.length) {
      throw new Error(`Unexpected icon-list shape for ${id}.`);
    }
    list.forEach((item, itemIndex) => {
      item.text = items[itemIndex];
    });
  };
  setList("al00009", ["Dematting or Detangling", "Tick Removal", "Flea and Tick Bath", "Deshedding"]);
  setList("al00011", ["Medicated Bath", "Teeth Brushing", "Eye Cleaning and Trimming", "Anal Glands Expression"]);
  setList("al00013", ["Bum-Area Shave or Trim", "Nail Clipping", "Ear Cleaning"]);
  editor(
    "al00014",
    "<p>Add-ons are optional and can be discussed while booking. Final suitability may depend on your cat's coat condition, temperament, and grooming needs.</p>"
  );

  heading("0000103", "A Simple Cat Grooming Appointment Flow");
  editor(
    "0000104",
    "<p>From package choice to aftercare, the appointment is designed to feel easy for you and calmer for your cat.</p>"
  );
  editor(
    "00000f4",
    "<p>Select Basic or Full grooming based on your cat's coat condition and the level of care needed.</p>"
  );
  editor(
    "0000100",
    "<p>Get practical guidance and plan the next visit around your cat's coat and grooming cycle.</p>"
  );
  heading("0000145", "Book Your Cat's Grooming Visit");

  // Keep the manually added spacer component and make its container responsive-lint safe.
  const separator = get("e82dcd0");
  separator.settings.content_width = "full";
  separator.settings.padding = zeroBox();
  separator.settings.padding_tablet = zeroBox();
  separator.settings.padding_mobile = zeroBox();

  // The native linter requires explicit spacing resets for editable widgets.
  walk(elementorData, (element) => {
    element.settings = element.settings || {};
    for (const key of ["_margin", "_margin_tablet", "_margin_mobile"]) {
      if (!element.settings[key]) element.settings[key] = zeroBox();
    }
  });

  const payload = {
    title: "Cat Grooming at Home in Dubai",
    slug: "cat-grooming-at-home-dubai",
    status: "publish",
    template: source.template || "elementor_header_footer",
    page_settings: source.page_settings || {},
    elementor_data: elementorData
  };

  const serialized = JSON.stringify(payload);
  const requiredMarkers = [
    "Cat Grooming at Home in Dubai",
    "Cat Grooming Packages and Prices",
    "Cat Basic Grooming",
    "AED 280",
    "A Simple Cat Grooming Appointment Flow",
    "Book Your Cat's Grooming Visit"
  ];
  for (const marker of requiredMarkers) {
    if (!serialized.includes(marker)) throw new Error(`Missing generated marker: ${marker}`);
  }
  const requiredComponentTypes = new Map([
    ["5571627", "spacer"],
    ["ee5f9c0", "video"],
    ["8d31aa3", "image-carousel"]
  ]);
  for (const [id, widgetType] of requiredComponentTypes) {
    if (get(id).widgetType !== widgetType) {
      throw new Error(`Required manual component ${id} must remain ${widgetType}.`);
    }
  }

  writeJson(outputPath, payload);
  return {
    ok: true,
    source_page_id: source.id,
    output: path.relative(root, outputPath),
    top_level_sections: elementorData.length,
    package_cards: packageRow.elements.length,
    add_on_items: 11
  };
}

console.log(JSON.stringify(build(), null, 2));
