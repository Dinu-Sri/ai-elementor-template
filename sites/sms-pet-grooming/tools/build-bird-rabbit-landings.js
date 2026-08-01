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

const configs = {
  bird: {
    label: "Bird",
    slug: "bird-grooming-at-home-dubai",
    output: "sms-pet-bird-landing.payload.json",
    icon: { value: "fas fa-dove", library: "fa-solid" },
    colors: {
      "#5C2B02": "#01665B",
      "#FFEACD": "#E7FFFA",
      "#FFF8F1": "#F7FFFD",
      "#FFDCB9": "#CFF8F0",
      "#F5E1FF": "#EAF4FF",
      "#8A3F07BD": "#008C78BD",
      "#8A3F0778": "#00A99078",
      "#8A3F07": "#008C78",
      "#C57309": "#007D70",
      "#996108": "#01665B",
      "#FFB672": "#7CE8D8",
      "#00D828": "#00D8B4",
      "#00D8B4": "#00D8B4",
      "#FF9807": "#3382EA",
      "#493213": "#014C45",
      "#4B0D0D": "#014C45"
    },
    emphasisBackground: "#CFF8F0",
    heroDescription:
      "Give your bird thoughtful nail, beak, feather, and hygiene care with a calmer grooming experience at your Dubai home.",
    benefitOneTitle: "At-Home Comfort",
    benefitOneText:
      "Your bird stays in familiar surroundings while the grooming setup comes directly to your home.",
    benefitTwoTitle: "Two Clear Packages",
    benefitTwoText:
      "Choose Basic or Full grooming based on the nail, beak, bathing, and feather care your bird needs.",
    careTitle: "Feather and Hygiene Care",
    careText:
      "Nail filing, beak trimming, bathing, feather care, and optional wing clipping in one convenient visit.",
    safeTitle: "Bird-Safe Handling",
    safeText:
      "A patient mobile setup designed for gentle handling and practical everyday bird grooming.",
    homeSenseTitle: "When Bird Grooming at Home Makes Sense",
    routineTitle: "Routine Feather Care",
    routineText:
      "Regular grooming helps keep nails, beak, feathers, and everyday hygiene easier to manage between visits.",
    travelTitle: "Birds Who Dislike Travel",
    travelText:
      "A mobile appointment helps birds avoid car rides, crowded salons, unfamiliar animals, and stressful waiting areas.",
    scheduleTitle: "Regular Care Schedule",
    scheduleText:
      "Book according to your bird's nail, beak, bathing, and feather-care needs.",
    occasionTitle: "Before Travel or Boarding",
    occasionText:
      "Book ahead of travel, boarding, visitors, or whenever your bird needs a clean and comfortable refresh.",
    issueText:
      "Long nails, beak-care needs, and untidy feathers are easier to address before they become uncomfortable.",
    packageChoiceText:
      "Choose Basic or Full grooming based on your bird's nail, beak, bathing, and feather-care needs.",
    basicTitle: "Bird Basic Grooming",
    basicPrice: "AED 200",
    basicDescription:
      "A focused grooming refresh covering essential nail, beak, bathing, and finishing care.",
    basicItems: [
      "Nail clipping and filing",
      "Beak trimming",
      "Bath and blow dry",
      "Perfume when requested"
    ],
    fullTitle: "Bird Full Grooming",
    fullPrice: "AED 260",
    fullDescription:
      "A more complete bird grooming session with feather wing clipping included.",
    fullItems: [
      "Nail clipping and filing",
      "Beak trimming",
      "Bath and blow dry",
      "Feather wing clipping",
      "Perfume when requested"
    ],
    addOns: [
      "Dematting or Detangling",
      "Tick Removal",
      "Flea and Tick Bath",
      "Deshedding",
      "Medicated Bath",
      "Teeth Brushing",
      "Eye Cleaning and Trimming",
      "Anal Glands Expression",
      "Bum-Area Shave or Trim",
      "Beak Trimming",
      "Feather Wing Clipping"
    ],
    addOnNote:
      "Add-ons are optional and can be discussed while booking. Final suitability may depend on your bird's species, temperament, feather condition, and grooming needs.",
    flowText:
      "From package choice to aftercare, the appointment is designed to feel simple for you and calmer for your bird.",
    chooseText:
      "Select Basic or Full grooming based on your bird's nail, beak, bathing, and feather-care needs.",
    aftercareText:
      "Get practical guidance and plan the next visit around your bird's nail, beak, feather, and grooming cycle."
  },
  rabbit: {
    label: "Rabbit",
    slug: "rabbit-grooming-at-home-dubai",
    output: "sms-pet-rabbit-landing.payload.json",
    icon: { value: "fas fa-paw", library: "fa-solid" },
    colors: {
      "#5C2B02": "#6F1D2C",
      "#FFEACD": "#FFF0F1",
      "#FFF8F1": "#FFF8F8",
      "#FFDCB9": "#FFDADC",
      "#F5E1FF": "#F5EFFF",
      "#8A3F07BD": "#B52E42BD",
      "#8A3F0778": "#FF474A78",
      "#8A3F07": "#B52E42",
      "#C57309": "#D93645",
      "#996108": "#6F1D2C",
      "#FFB672": "#FF9A9C",
      "#00D828": "#FF474A",
      "#00D8B4": "#FF7A7D",
      "#FF9807": "#7C62FF",
      "#493213": "#561522",
      "#4B0D0D": "#561522"
    },
    emphasisBackground: "#FFDADC",
    heroDescription:
      "Give your rabbit cleaner fur, neatly filed nails, fresh ears, and a calmer grooming experience without travelling to a salon.",
    benefitOneTitle: "At-Home Comfort",
    benefitOneText:
      "Your rabbit stays in familiar surroundings while the grooming setup comes directly to your home.",
    benefitTwoTitle: "Two Clear Packages",
    benefitTwoText:
      "Choose Basic or Full grooming based on your rabbit's coat condition and the level of care needed.",
    careTitle: "Coat and Hygiene Care",
    careText:
      "Nail filing, ear cleaning, bathing, deshedding, brushing, and coat trimming in one convenient visit.",
    safeTitle: "Rabbit-Safe Handling",
    safeText:
      "A patient mobile setup designed for gentle handling and practical everyday rabbit grooming.",
    homeSenseTitle: "When Rabbit Grooming at Home Makes Sense",
    routineTitle: "Routine Coat Care",
    routineText:
      "Regular grooming keeps your rabbit's coat cleaner, easier to manage, and more comfortable between visits.",
    travelTitle: "Rabbits Who Dislike Travel",
    travelText:
      "A mobile appointment helps rabbits avoid car rides, crowded salons, unfamiliar animals, and stressful waiting areas.",
    scheduleTitle: "Regular Grooming Care",
    scheduleText:
      "Book according to your rabbit's coat, nail, ear-cleaning, and deshedding needs.",
    occasionTitle: "Before Travel or Boarding",
    occasionText:
      "Book ahead of travel, boarding, visitors, or whenever your rabbit needs a clean and comfortable refresh.",
    issueText:
      "Matting, loose fur, long nails, and hygiene concerns are easier to address before they become uncomfortable.",
    packageChoiceText:
      "Choose Basic or Full grooming based on your rabbit's coat condition and grooming needs.",
    basicTitle: "Rabbit Basic Grooming",
    basicPrice: "AED 200",
    basicDescription:
      "A complete routine grooming refresh for rabbits in the comfort of home.",
    basicItems: [
      "Nail clipping and filing",
      "Ear cleaning",
      "Bath and blow dry",
      "Deshedding and brushing",
      "Perfume when requested"
    ],
    fullTitle: "Rabbit Full Grooming",
    fullPrice: "AED 260",
    fullDescription:
      "A more complete grooming session with all-over shaving or trimming when required.",
    fullItems: [
      "Nail clipping and filing",
      "Ear cleaning",
      "Bath and blow dry",
      "Deshedding and brushing",
      "Shave and trimming all over",
      "Perfume when requested"
    ],
    addOns: [
      "Dematting or Detangling",
      "Tick Removal",
      "Flea and Tick Bath",
      "Deshedding",
      "Medicated Bath",
      "Teeth Brushing",
      "Eye Cleaning and Trimming",
      "Anal Glands Expression",
      "Bum-Area Shave or Trim",
      "Nail Clipping",
      "Ear Cleaning"
    ],
    addOnNote:
      "Add-ons are optional and can be discussed while booking. Final suitability may depend on your rabbit's coat condition, temperament, and grooming needs.",
    flowText:
      "From package choice to aftercare, the appointment is designed to feel simple for you and calmer for your rabbit.",
    chooseText:
      "Select Basic or Full grooming based on your rabbit's coat condition and the level of care needed.",
    aftercareText:
      "Get practical guidance and plan the next visit around your rabbit's coat and grooming cycle."
  }
};

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

function replaceColors(value, replacements) {
  if (Array.isArray(value)) return value.map((item) => replaceColors(item, replacements));
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      value[key] = replaceColors(child, replacements);
    }
    return value;
  }
  if (typeof value !== "string") return value;

  let result = value;
  for (const [from, to] of Object.entries(replacements)) {
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

function buildPage(source, config) {
  const elementorData = JSON.parse(JSON.stringify(source.elementor_data));
  const index = indexElements(elementorData);
  const get = (id) => {
    const element = index.get(id);
    if (!element) throw new Error(`${config.label}: expected Elementor element ${id} was not found.`);
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

  for (const section of elementorData) {
    if (section.id !== "0000143") replaceColors(section, config.colors);
  }
  get("0000143").settings.background_color = config.emphasisBackground;

  heading("0000007", `${config.label} Grooming at Home in Dubai`);
  heading("0000008", `${config.label} Grooming <br> at Your Dubai Home`);
  editor("0000009", `<p>${config.heroDescription}</p>`);
  heading("0000004", "Starting from AED 200");
  button("0000001", `Book ${config.label} Grooming`);
  button("0000002", "View Packages", `#${config.label.toLowerCase()}-packages`);

  heading("0000012", config.benefitOneTitle);
  editor("0000013", `<p>${config.benefitOneText}</p>`);
  heading("0000016", config.benefitTwoTitle);
  editor("0000017", `<p>${config.benefitTwoText}</p>`);
  heading("000001a", config.careTitle);
  editor("000001b", `<p>${config.careText}</p>`);
  heading("0000022", config.safeTitle);
  editor("0000023", `<p>${config.safeText}</p>`);
  get("0000015").settings.selected_icon = config.icon;

  heading("000004a", config.homeSenseTitle);
  heading("0000028", config.routineTitle);
  editor("0000029", `<p>${config.routineText}</p>`);
  heading("000002b", config.travelTitle);
  editor("000002c", `<p>${config.travelText}</p>`);
  heading("0000033", config.scheduleTitle);
  editor("0000034", `<p>${config.scheduleText}</p>`);
  heading("0000036", config.occasionTitle);
  editor("0000037", `<p>${config.occasionText}</p>`);
  editor("000003a", `<p>${config.issueText}</p>`);
  editor("000003f", `<p>${config.packageChoiceText}</p>`);

  heading("00000eb", `${config.label} Grooming Discounts`);
  get("b5df963").settings.selected_icon = config.icon;

  heading("0000076", `${config.label} Grooming Packages and Prices`);
  get("000007a").settings._element_id = `${config.label.toLowerCase()}-packages`;
  heading("000005a", "Basic Grooming");
  heading("000005c", config.basicTitle);
  editor("000005d", `<p>${config.basicDescription}</p>`);
  heading("000005f", config.basicPrice);
  editor("0000060", `<ul>${config.basicItems.map((item) => `<li>${item}</li>`).join("")}</ul>`);
  button("0000061", "Select Basic Grooming");

  heading("000007c", "Full Grooming");
  heading("000007e", config.fullTitle);
  editor("000007f", `<p>${config.fullDescription}</p>`);
  heading("0000081", config.fullPrice);
  editor("0000082", `<ul>${config.fullItems.map((item) => `<li>${item}</li>`).join("")}</ul>`);
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
  if (fullSectionIndex === -1) throw new Error(`${config.label}: full package section was not found.`);
  elementorData.splice(fullSectionIndex, 1);

  const setList = (id, items) => {
    const list = get(id).settings.icon_list;
    if (!Array.isArray(list) || list.length !== items.length) {
      throw new Error(`${config.label}: unexpected icon-list shape for ${id}.`);
    }
    list.forEach((item, itemIndex) => {
      item.text = items[itemIndex];
    });
  };
  setList("al00009", config.addOns.slice(0, 4));
  setList("al00011", config.addOns.slice(4, 8));
  setList("al00013", config.addOns.slice(8, 11));
  editor("al00014", `<p>${config.addOnNote}</p>`);

  heading("0000103", `A Simple ${config.label} Grooming Appointment Flow`);
  editor("0000104", `<p>${config.flowText}</p>`);
  editor("00000f4", `<p>${config.chooseText}</p>`);
  editor("0000100", `<p>${config.aftercareText}</p>`);
  heading("0000145", `Book Your ${config.label}'s Grooming Visit`);

  const separator = get("e82dcd0");
  separator.settings.content_width = "full";
  separator.settings.padding = zeroBox();
  separator.settings.padding_tablet = zeroBox();
  separator.settings.padding_mobile = zeroBox();

  walk(elementorData, (element) => {
    element.settings = element.settings || {};
    for (const key of ["_margin", "_margin_tablet", "_margin_mobile"]) {
      if (!element.settings[key]) element.settings[key] = zeroBox();
    }
  });

  const requiredComponentTypes = new Map([
    ["5571627", "spacer"],
    ["ee5f9c0", "video"],
    ["8d31aa3", "image-carousel"]
  ]);
  for (const [id, widgetType] of requiredComponentTypes) {
    if (get(id).widgetType !== widgetType) {
      throw new Error(`${config.label}: required component ${id} must remain ${widgetType}.`);
    }
  }

  const payload = {
    title: `${config.label} Grooming at Home in Dubai`,
    slug: config.slug,
    status: "publish",
    template: source.template || "elementor_header_footer",
    page_settings: source.page_settings || {},
    elementor_data: elementorData
  };
  const serialized = JSON.stringify(payload);
  for (const marker of [
    `${config.label} Grooming at Home in Dubai`,
    `${config.label} Grooming Packages and Prices`,
    config.basicTitle,
    config.fullPrice,
    `A Simple ${config.label} Grooming Appointment Flow`,
    `Book Your ${config.label}'s Grooming Visit`
  ]) {
    if (!serialized.includes(marker)) throw new Error(`${config.label}: missing marker ${marker}.`);
  }

  const outputPath = path.join(
    suiteRoot,
    "build",
    "sites",
    "sms-pet-grooming",
    "native-sources",
    config.output
  );
  writeJson(outputPath, payload);
  return {
    animal: config.label,
    output: path.relative(root, outputPath),
    top_level_sections: elementorData.length,
    package_cards: packageRow.elements.length,
    add_on_items: config.addOns.length
  };
}

if (!fs.existsSync(sourcePath)) {
  throw new Error(`Missing protected dog landing baseline: ${sourcePath}`);
}
const source = readJson(sourcePath);
if (source.id !== 1044 || source.slug !== "native-review-sms-pet-landing-page") {
  throw new Error("The source file is not the protected live dog landing page baseline.");
}

const results = Object.values(configs).map((config) => buildPage(source, config));
console.log(JSON.stringify({ ok: true, source_page_id: source.id, pages: results }, null, 2));
