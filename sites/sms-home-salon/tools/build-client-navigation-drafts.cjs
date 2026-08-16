const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { validateTemplate } = require("../../../src/validator/elementor-native-lint");

const root = path.resolve(__dirname, "../../..");
const snapshotPath = path.join(root, "build/site-intake/sms-home-salon-blog-theme-builder/site-snapshot.json");
const outputDir = path.join(root, "build/sites/sms-home-salon/client-navigation-migration/draft-pages");
const imagePath = path.join(root, "sites/sms-home-salon/assets/generated/french-gel-nail-extensions-hero.webp");
const apply = process.argv.includes("--apply");
const baseUrl = process.env.NEB_SITE_URL;
const apiKey = process.env.NEB_API_KEY;

const hubDefinitions = [
  {
    key: "bleach",
    sourceId: 65,
    heroSourceId: 1150,
    title: "Bleach Treatments at Home in Dubai",
    slug: "bleach",
    service: "Bleach Treatments",
    singular: "bleaching treatment",
    startPrice: "AED 96",
    seoTitle: "Bleach Treatments at Home in Dubai | SMS Home Salon",
    seoDescription: "Book professional face and body bleach treatments at home in Dubai with trained female therapists and a clean, private salon setup.",
    focusKeyword: "bleach treatments at home in Dubai",
    benefits: [
      ["Professional Application", "Careful product mixing and even application by a trained female professional."],
      ["Private Home Setup", "Receive your treatment comfortably at home, in a hotel or at your office."],
      ["Area-Specific Options", "Choose focused arm, leg, back and front body packages without paying for areas you do not need."],
    ],
    guide: [
      ["Full Arms", "Choose this option for complete bleaching care from shoulders to wrists."],
      ["Full Legs", "A focused package for even-looking bleaching care across both legs."],
      ["Back and Front", "The most complete option for the back and front body areas."],
      ["Before Booking", "Tell our team about sensitivity, recent exfoliation or irritated skin."],
      ["Aftercare", "Avoid heat, heavy fragrance and strong exfoliation immediately after the service."],
      ["Combine Services", "Ask about combining bleaching with another compatible home salon appointment."],
    ],
    crossLinks: [["Massage", "/massage/"], ["Manicure Services", "/manicure/"], ["Hair Services", "/hair/"], ["Waxing", "/waxing/"]],
    services: [
      ["Full Arm Bleaching", "/bleach/full-arm-bleaching/", "AED 96", "Even-looking arm bleaching with careful application."],
      ["Full Legs Bleaching", "/bleach/full-legs-bleaching/", "AED 120", "Professional bleaching care for the full legs."],
      ["Full Back and Front Bleaching", "/bleach/full-back-front-bleaching/", "AED 240", "A complete back and front body bleaching package."],
    ],
  },
  {
    key: "scrub",
    sourceId: 65,
    heroSourceId: 1156,
    title: "Scrub Treatments at Home in Dubai",
    slug: "scrub",
    service: "Scrub Treatments",
    singular: "scrub treatment",
    startPrice: "AED 60",
    seoTitle: "Body and Face Scrub at Home in Dubai | SMS Home Salon",
    seoDescription: "Book face and body scrub treatments at home in Dubai with trained female therapists, professional products and a hygienic private setup.",
    focusKeyword: "scrub treatments at home in Dubai",
    benefits: [
      ["Smoother-Looking Skin", "Professional exfoliation helps lift surface buildup and refresh treated areas."],
      ["Focused Treatment Areas", "Choose face, arms, back and front, or a complete body scrub package."],
      ["Optional Body Mask", "Select the full body scrub with mask for a more complete care routine."],
    ],
    guide: [
      ["Face Scrub", "Choose gentle facial exfoliation when your main goal is a cleaner, softer skin feel."],
      ["Full Arms", "Focused exfoliation for both arms with a clean home setup."],
      ["Back and Front", "A broader package for hard-to-reach back and front body areas."],
      ["Full Body", "Choose this option for complete body exfoliation in one appointment."],
      ["Scrub With Mask", "Add a soothing body mask after exfoliation for a more indulgent service."],
      ["Aftercare", "Use gentle moisturiser and avoid harsh exfoliation immediately after the appointment."],
    ],
    crossLinks: [["Massage", "/massage/"], ["Pedicure Services", "/pedicure/"], ["Hair Services", "/hair/"], ["Waxing", "/waxing/"]],
    services: [
      ["Face Scrub", "/scrub/face-scrub/", "AED 60", "Gentle face exfoliation for softer, refreshed-looking skin."],
      ["Full Arm Scrub", "/scrub/full-arm-scrub/", "AED 72", "Focused exfoliation for smooth, refreshed arms."],
      ["Full Back and Front Scrub", "/scrub/full-back-front-scrub/", "AED 180", "Professional exfoliation across the back and front body."],
      ["Full Body Scrub", "/scrub/full-body-scrub/", "AED 300", "Complete body exfoliation delivered in a private home setup."],
      ["Full Body Scrub With Mask", "/scrub/full-body-scrub-with-mask/", "AED 480", "Full body scrub followed by a soothing body mask."],
    ],
  },
  {
    key: "manicure",
    sourceId: 63,
    heroSourceId: 1056,
    title: "Manicure Services at Home in Dubai",
    slug: "manicure",
    service: "Manicure Services",
    singular: "manicure service",
    startPrice: "AED 60",
    seoTitle: "Manicure Services at Home in Dubai | SMS Home Salon",
    seoDescription: "Book manicure, gel and nail extension services at home in Dubai with trained female technicians, sterilised tools and premium products.",
    focusKeyword: "manicure services at home in Dubai",
    benefits: [
      ["Neat, Polished Hands", "Professional shaping, cuticle care and finish options for everyday or event-ready nails."],
      ["Long-Wear Choices", "Choose gel, builder gel, acrylic or nail extensions when you want more durability."],
      ["Styles for Every Goal", "Select natural care, classic colour, French tips, cat-eye effects or added length."],
    ],
    guide: [
      ["Classic Manicure", "Best for regular grooming, shaping and a clean polish finish."],
      ["Gel Manicure", "Choose gelish or French gel when longer wear is the priority."],
      ["Gel Extensions", "Add length with gel extensions, including a classic French finish."],
      ["Acrylic Extensions", "A strong extension option with natural, French and ombre packages."],
      ["Builder Gel", "Adds structure to natural nails or supports a builder gel extension."],
      ["Hand Paraffin", "Warm paraffin care is ideal for dry-feeling hands and added comfort."],
    ],
    crossLinks: [["Massage", "/massage/"], ["Pedicure Services", "/pedicure/"], ["Hair Services", "/hair/"], ["Waxing", "/waxing/"]],
    services: [
      ["Hand Paraffin", "/manicure/hand-paraffin/", "AED 60", "Warm paraffin care for softer, more comfortable hands."],
      ["Classic Manicure", "/manicure/classic-manicure/", "AED 72", "Nail shaping, cuticle care and your selected finish."],
      ["Spa Manicure", "/manicure/spa-manicure/", "AED 96", "A more indulgent manicure with focused hand care."],
      ["Classic Nails Extension", "/manicure/classic-nails-extension/", "AED 120", "Classic nail length and shape extension service."],
      ["Gelish Manicure", "/manicure/gelish-manicure/", "AED 120", "Long-wearing gel colour with manicure preparation."],
      ["French Gel Manicure", "/manicure/french-gel-manicure/", "AED 144", "A crisp French finish with a durable gel base."],
      ["French Gel Nail Extensions", "/manicure/french-gel-nail-extensions/", "AED 320", "Elegant gel extensions finished with classic French tips."],
      ["Cat Eye Extensions", "/manicure/cat-eye-extensions/", "AED 350", "Magnetic cat-eye gel finish over nail extensions."],
      ["Acrylic Nail Extensions", "/manicure/acrylic-nail/", "AED 300", "Strong acrylic extensions with multiple finish options."],
      ["Gel Nail Extensions", "/manicure/gel-nail-extensions/", "AED 300", "Gel extensions for added length, shape and shine."],
      ["Builder Gel Nails", "/manicure/builder-gel-nails/", "AED 280", "Builder gel overlays and extensions for added structure."],
    ],
  },
  {
    key: "pedicure",
    sourceId: 63,
    heroSourceId: 1076,
    title: "Pedicure Services at Home in Dubai",
    slug: "pedicure",
    service: "Pedicure Services",
    singular: "pedicure service",
    startPrice: "AED 60",
    seoTitle: "Pedicure Services at Home in Dubai | SMS Home Salon",
    seoDescription: "Book pedicure, foot scrub, paraffin and callus services at home in Dubai with trained female technicians and hygienic tools.",
    focusKeyword: "pedicure services at home in Dubai",
    benefits: [
      ["Clean, Polished Feet", "Professional nail shaping, cuticle care and finish options without travelling to a salon."],
      ["Comfort-Focused Care", "Foot scrub, paraffin and callus options help refresh rough, tired-feeling feet."],
      ["Classic or Gel Finish", "Choose regular colour, French tips or longer-wearing gel according to your plans."],
    ],
    guide: [
      ["Classic Pedicure", "Best for regular grooming, shaping and a fresh polish finish."],
      ["Gel Pedicure", "Choose gel colour, gelish or French gel for longer wear."],
      ["Spa Pedicure", "A relaxing option with deeper foot care and a polished finish."],
      ["Callus Pedicure", "Focused care for hard skin and rough areas on the feet."],
      ["Foot Scrub", "Professional exfoliation to refresh dry, rough-feeling feet."],
      ["Foot Paraffin", "Warm paraffin care for added softness and comfort."],
    ],
    crossLinks: [["Massage", "/massage/"], ["Manicure Services", "/manicure/"], ["Hair Services", "/hair/"], ["Waxing", "/waxing/"]],
    services: [
      ["Foot Paraffin", "/pedicure/foot-paraffin/", "AED 72", "Warm paraffin care for dry, tired feet."],
      ["Classic Pedicure", "/pedicure/classic-pedicure/", "AED 72", "Nail shaping, cuticle care and your selected finish."],
      ["Gel Pedicure", "/pedicure/gel-pedicure/", "AED 96", "Long-wearing gel colour with professional foot care."],
      ["Spa Pedicure", "/pedicure/spa-pedicure/", "AED 144", "Relaxing foot care with a polished salon finish."],
      ["Callus Pedicure", "/pedicure/callus-pedicure/", "AED 160", "Focused hard-skin care for smoother, comfortable feet."],
      ["Foot Scrub Pedicure", "/pedicure/foot-scrub-pedicure/", "AED 60", "Professional foot exfoliation and refreshing care."],
    ],
  },
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function walk(value, visitor) {
  if (!value || typeof value !== "object") return;
  visitor(value);
  for (const child of Object.values(value)) walk(child, visitor);
}

function refreshIds(elements, seed) {
  let index = 0;
  walk(elements, (node) => {
    if (typeof node.id !== "string") return;
    node.id = crypto.createHash("md5").update(`${seed}:${index++}:${node.id}`).digest("hex").slice(0, 7);
  });
}

function setWidget(elements, id, settings) {
  let count = 0;
  walk(elements, (node) => {
    if (node.id === id && node.settings) {
      Object.assign(node.settings, settings);
      count += 1;
    }
  });
  return count;
}

function setWidgetPairs(elements, pairs, values) {
  values.forEach((value, index) => {
    const ids = pairs[index];
    if (!ids) return;
    setWidget(elements, ids[0], { title: value[0] });
    setWidget(elements, ids[1], { editor: `<p>${value[1]}</p>` });
  });
}

function findHeroPoster(page) {
  let poster = null;
  walk(page.elementor_data, (node) => {
    if (node?.settings?._element_id === "VIDEO_MASSAGE_HERO" && node.settings.poster?.url) {
      poster = clone(node.settings.poster);
    }
  });
  if (!poster) throw new Error(`Page ${page.id} has no current hero poster.`);
  return poster;
}

function setHeroPoster(elements, poster, alt) {
  let count = 0;
  walk(elements, (node) => {
    if (node?.settings?._element_id === "VIDEO_MASSAGE_HERO") {
      node.settings.poster = { ...clone(poster), alt };
      count += 1;
    }
  });
  if (count !== 1) throw new Error(`Expected one hero media widget, found ${count}.`);
}

function updatePackageCard(card, service, category) {
  const headings = [];
  const editors = [];
  const buttons = [];
  walk(card, (node) => {
    if (node?.elType !== "widget" || !node.settings) return;
    if (node.widgetType === "heading") headings.push(node);
    if (node.widgetType === "text-editor") editors.push(node);
    if (node.widgetType === "button") buttons.push(node);
  });
  const title = headings.find((node) => {
    const value = node.settings.title || "";
    return !["Most Popular", "Price", "From"].includes(value) && !/^AED\b/i.test(value);
  });
  const prices = headings.filter((node) => /^AED\b/i.test(node.settings.title || ""));
  if (!title || !editors[0] || !buttons[0] || prices.length < 1) {
    throw new Error(`${category}: package card structure was not recognised.`);
  }
  title.settings.title = service[0];
  title.settings.link = { url: service[1], is_external: false, nofollow: false };
  editors[0].settings.editor = `<p>${service[3]}</p>`;
  for (const price of prices) price.settings.title = service[2];
  buttons[0].settings.text = `Book ${service[0]}`;
  buttons[0].settings.link = { url: "", is_external: false, nofollow: false };
  buttons[0].settings._attributes = `data-service|${service[0]}\ndata-cta|Book ${service[0]}`;
}

function updateHubCards(elements, definition) {
  const container = elements?.[4]?.elements?.[0]?.elements?.[1]?.elements;
  if (!Array.isArray(container) || container.length < 2) {
    throw new Error(`${definition.key}: package container was not found.`);
  }
  const featured = clone(container[0]);
  const regular = clone(container[1]);
  const cards = definition.services.map((service, index) => {
    const card = clone(index === 0 ? featured : regular);
    refreshIds(card, `${definition.key}-card-${index}`);
    updatePackageCard(card, service, definition.key);
    return card;
  });
  container.splice(0, container.length, ...cards);
}

function updateHubButtons(elements, definition) {
  let hero = 0;
  let anchor = 0;
  walk(elements, (node) => {
    if (node?.elType !== "widget" || node.widgetType !== "button" || !node.settings) return;
    if (node.settings.text === "Book Now") {
      node.settings.link = { url: "", is_external: false, nofollow: false };
      node.settings._attributes = `data-service|${definition.service}\ndata-cta|Book ${definition.service}`;
      hero += 1;
    }
    if (node.settings.text === "View Packages") {
      node.settings.link = { url: "#packages", is_external: false, nofollow: false };
      anchor += 1;
    }
  });
  if (hero !== 1 || anchor !== 1) throw new Error(`${definition.key}: hero buttons were not recognised.`);
}

function buildHub(source, heroSource, definition) {
  const elements = clone(source.elementor_data);
  const replacements = [
    ["Nail Services", definition.service],
    ["Nail Service", definition.service],
    ["Nail Care", definition.service],
    ["Facial and Skin Care", definition.service],
    ["Facial & Skin", definition.service],
    ["Facial", definition.service],
    ["facial", definition.singular],
    ["nail services", definition.service.toLowerCase()],
    ["nail care", definition.service.toLowerCase()],
  ];
  walk(elements, (node) => {
    if (!node.settings) return;
    for (const [key, value] of Object.entries(node.settings)) {
      if (typeof value !== "string") continue;
      let updated = value;
      for (const [before, after] of replacements) updated = updated.split(before).join(after);
      node.settings[key] = updated;
    }
  });

  setWidget(elements, "c3c1cb4", { title: definition.title });
  setWidget(elements, "853d8a5", { editor: `<p>Book ${definition.service.toLowerCase()} at home in Dubai with trained female professionals. We bring the products, clean tools and complete setup to your home, hotel or office.</p>` });
  setWidget(elements, "8ec27f0", { title: `Start From ${definition.startPrice}` });
  setWidget(elements, "3e2d0a4", { title: `${definition.service} Benefits` });
  setWidget(elements, "8d12864", { title: `Professional ${definition.service}, Brought Home` });
  setWidget(elements, "70da1a3", { editor: `<p>Choose from focused ${definition.service.toLowerCase()} delivered privately at your location, with professional products and careful hygiene from setup to aftercare.</p>` });
  setWidget(elements, "d65ea4d", { title: `Everything Needed for Your ${definition.service}` });
  setWidget(elements, "0c2e387", { editor: `<p>Your female professional arrives with clean tools, fresh towels and the products required for your selected ${definition.singular}. Preferences are confirmed before the service begins.</p>` });
  setWidgetPairs(elements, [["9c93b7e", "877143e"], ["58bb421", "2e2d15a"], ["76d0e81", "bc46760"]], definition.benefits);
  setWidget(elements, "619768d", { title: "Consultation and Preparation" });
  setWidget(elements, "d223ca8", { editor: `<p>Your preferences and treatment area are confirmed before a clean, comfortable ${definition.singular} setup is prepared.</p>` });
  setWidget(elements, "d28db1e", { title: "Professional Service and Aftercare" });
  setWidget(elements, "898fad1", { editor: "<p>The selected treatment is completed carefully, followed by simple guidance to help protect the result.</p>" });
  setWidget(elements, "c147134", { title: `Choose Your ${definition.service} Package` });
  setWidget(elements, "53595cb", { editor: "<p>Prices are in AED. Choose a service below or contact our team to combine treatments in one home appointment.</p>" });
  setWidget(elements, "025484c", { editor: `<p>Choose your ${definition.singular}, confirm your preferred time and enjoy professional care without travelling to a salon.</p>` });
  setWidget(elements, "346c808", { title: "Choose Your Service" });
  setWidget(elements, "9113068", { editor: `<p>Compare the available ${definition.service.toLowerCase()} and select the treatment area or finish that suits your needs.</p>` });
  setWidget(elements, "c8f85fa", { title: "Share Your Preferences" });
  setWidget(elements, "74c425c", { editor: "<p>Tell our team about sensitivity, your preferred finish and any service questions when booking.</p>" });
  setWidget(elements, "b0d3b6d", { title: "We Prepare the Setup" });
  setWidget(elements, "a3d5479", { editor: "<p>Your female professional arrives with clean tools, fresh towels and the products required for the appointment.</p>" });
  setWidget(elements, "a2908d0", { title: "Service and Aftercare" });
  setWidget(elements, "0bc61f5", { editor: "<p>Relax while the service is completed, then follow the practical aftercare guidance provided.</p>" });
  setWidget(elements, "c52eae8", { title: `${definition.service} Guide` });
  setWidget(elements, "ea33ac0", { title: `Which ${definition.service} Option Should You Choose?` });
  setWidget(elements, "639258a", { editor: `<p>Compare each option by treatment area, finish and price. Open the linked service page for full package details.</p>` });
  setWidgetPairs(elements, [
    ["1019719", "a6df2da"], ["a91fd44", "6373257"], ["c0ee9c9", "7df9ad0"],
    ["41bf0b0", "e33d350"], ["97bf64a", "ee8b1a9"], ["659553f", "7ed3539"],
  ], definition.guide);
  setWidget(elements, "d28375e", { title: "Other Services" });
  setWidget(elements, "40b41f1", { title: "Complete Your Home Salon Visit" });
  setWidget(elements, "7778d14", { editor: "<p>Explore related at-home salon services and combine compatible appointments for a convenient visit.</p>" });
  const crossIds = [
    ["41775e2", "e6844b8", "9227d3b"], ["4db12fb", "1574d78", "48e0c98"],
    ["76d4c33", "22fc352", "b4e0746"], ["4af77dd", "451e2cd", "dfdac60"],
  ];
  definition.crossLinks.forEach((item, index) => {
    const ids = crossIds[index];
    setWidget(elements, ids[0], { title: item[0] });
    setWidget(elements, ids[1], { editor: `<p>View ${item[0].toLowerCase()} available across Dubai.</p>` });
    setWidget(elements, ids[2], { text: "View Service", link: { url: item[1], is_external: false, nofollow: false } });
  });
  setWidget(elements, "82244a3", { title: `${definition.service} Booking Questions` });
  setWidget(elements, "0b9414e", { editor: `<p>Practical answers before booking ${definition.service.toLowerCase()} at home in Dubai.</p>` });
  setWidget(elements, "29a65ab", { title: `Can I book ${definition.service.toLowerCase()} at home in Dubai?` });
  setWidget(elements, "3289f8a", { editor: `<p>Yes. SMS Home Ladies Salon provides ${definition.service.toLowerCase()} at homes, hotels and offices across Dubai.</p>` });
  setWidget(elements, "36a7e34", { title: "Do you bring the products and equipment?" });
  setWidget(elements, "56c13b4", { editor: "<p>Yes. Your professional arrives with the tools, products, towels and hygienic setup required for the selected service.</p>" });
  setWidget(elements, "a52d9c6", { title: "How do I choose the right option?" });
  setWidget(elements, "01fe0a0", { editor: "<p>Compare the package cards and linked detail pages, or send your preferences to our team for guidance.</p>" });
  setWidget(elements, "3fb2afa", { title: "Can I combine this with another service?" });
  setWidget(elements, "63549e5", { editor: "<p>Usually, yes. Ask our team to confirm timing and compatibility when combining services in one visit.</p>" });
  setWidget(elements, "5a361c5", { title: "Are same-day appointments available?" });
  setWidget(elements, "91eddfd", { editor: "<p>Same-day slots may be available depending on your location and the selected service.</p>" });
  setWidget(elements, "5082a64", { title: "How do I confirm my booking?" });
  setWidget(elements, "c65c7d1", { editor: "<p>Use the booking button or WhatsApp to confirm the service, location and preferred appointment time.</p>" });
  setWidget(elements, "879001d", { title: `Book Your ${definition.service} at Home` });

  updateHubCards(elements, definition);
  updateHubButtons(elements, definition);
  setHeroPoster(elements, findHeroPoster(heroSource), `${definition.service} at Home in Dubai - SMS Home Ladies Salon`);
  refreshIds(elements, definition.key);

  return {
    key: definition.key,
    title: definition.title,
    slug: definition.slug,
    status: "draft",
    parent_id: 0,
    menu_order: 0,
    template: source.template || "elementor_header_footer",
    page_settings: clone(source.page_settings || {}),
    seo_title: definition.seoTitle,
    seo_description: definition.seoDescription,
    focus_keyword: definition.focusKeyword,
    canonical_url: `https://homesalon.ae/${definition.slug}/`,
    robots: ["index", "follow"],
    elementor_data: elements,
  };
}

function replaceStrings(value, replacements) {
  if (typeof value === "string") {
    let output = value;
    for (const [before, after] of replacements) output = output.split(before).join(after);
    return output;
  }
  if (Array.isArray(value)) return value.map((item) => replaceStrings(item, replacements));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, replaceStrings(child, replacements)]));
  }
  return value;
}

function buildFrenchExtension(source, media) {
  let elements = clone(source.elementor_data);
  elements = replaceStrings(elements, [
    ["French Gel Manicure", "French Gel Nail Extensions"],
    ["french gel manicure", "French gel nail extensions"],
    ["AED 144", "AED 320"],
    ["AED 300", "AED 320"],
  ]);
  setHeroPoster(elements, media, "French Gel Nail Extensions at Home in Dubai - SMS Home Ladies Salon");
  let hero = 0;
  let anchor = 0;
  let packageButtons = 0;
  walk(elements, (node) => {
    if (node?.elType !== "widget" || node.widgetType !== "button" || !node.settings) return;
    if (node.settings.text === "Book Now") {
      node.settings.link = { url: "", is_external: false, nofollow: false };
      node.settings._attributes = "data-service|French Gel Nail Extensions\ndata-cta|Book French Gel Nail Extensions";
      hero += 1;
    } else if (node.settings.text === "View Packages") {
      node.settings.link = { url: "#packages", is_external: false, nofollow: false };
      anchor += 1;
    } else if (node.settings.text === "Book French Gel Nail Extensions") {
      node.settings.link = { url: "", is_external: false, nofollow: false };
      node.settings._attributes = "data-service|French Gel Nail Extensions\ndata-cta|Book French Gel Nail Extensions";
      packageButtons += 1;
    }
  });
  if (hero !== 1 || anchor !== 1 || packageButtons !== 1) {
    throw new Error(`French extension buttons invalid: hero=${hero}, anchor=${anchor}, packages=${packageButtons}`);
  }
  refreshIds(elements, "french-gel-nail-extensions");
  return {
    key: "french-gel-nail-extensions",
    title: "French Gel Nail Extensions at Home in Dubai",
    slug: "french-gel-nail-extensions",
    status: "draft",
    parent_key: "manicure",
    parent_id: 0,
    menu_order: 7,
    template: source.template || "elementor_header_footer",
    page_settings: clone(source.page_settings || {}),
    seo_title: "French Gel Nail Extensions at Home in Dubai | SMS Home Salon",
    seo_description: "Book French gel nail extensions at home in Dubai for AED 320 with a trained female technician, hygienic tools and a polished finish.",
    focus_keyword: "French gel nail extensions at home in Dubai",
    canonical_url: "https://homesalon.ae/manicure/french-gel-nail-extensions/",
    robots: ["index", "follow"],
    elementor_data: elements,
  };
}

function placeholderMedia() {
  return {
    url: "https://homesalon.ae/wp-content/uploads/french-gel-nail-extensions-hero.webp",
    id: 0,
    alt: "French Gel Nail Extensions at Home in Dubai - SMS Home Ladies Salon",
    source: "library",
    size: "",
  };
}

function buildCandidates(snapshot, media = placeholderMedia()) {
  const pages = new Map(snapshot.pages.map((page) => [Number(page.id), page]));
  const hubs = hubDefinitions.map((definition) => {
    const source = pages.get(definition.sourceId);
    const heroSource = pages.get(definition.heroSourceId);
    if (!source || !heroSource) throw new Error(`${definition.key}: source page missing from snapshot.`);
    return buildHub(source, heroSource, definition);
  });
  const detailSource = pages.get(1064);
  if (!detailSource) throw new Error("French Gel Manicure source page 1064 is missing from snapshot.");
  return [...hubs, buildFrenchExtension(detailSource, media)];
}

function lintCandidates(candidates, stage) {
  const reports = candidates.map((candidate) => {
    const strict = validateTemplate(candidate);
    const blocking = strict.issues.filter((issue) => issue.severity === "error");
    return {
      key: candidate.key,
      ...strict,
      strict_ok: strict.ok,
      ok: blocking.length === 0,
      lint_mode: "approved-live-baseline",
      blocking_issue_count: blocking.length,
      inherited_warning_count: strict.issues.filter((issue) => issue.severity === "warning").length,
    };
  });
  const failures = reports.filter((report) => !report.ok);
  fs.writeFileSync(path.join(outputDir, `lint-${stage}.json`), `${JSON.stringify(reports, null, 2)}\n`);
  if (failures.length) throw new Error(`${stage}: native lint failed for ${failures.map((item) => item.key).join(", ")}`);
  return reports;
}

function writeCandidates(candidates, suffix = "candidate") {
  fs.mkdirSync(outputDir, { recursive: true });
  for (const candidate of candidates) {
    fs.writeFileSync(path.join(outputDir, `${candidate.key}.${suffix}.json`), `${JSON.stringify(candidate, null, 2)}\n`);
  }
}

async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`, {
    ...options,
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!response.ok) throw new Error(`${endpoint} failed with ${response.status}: ${JSON.stringify(data).slice(0, 1200)}`);
  return data;
}

async function ensureMedia() {
  const existing = await apiFetch("media?per_page=250&search=French%20Gel%20Nail%20Extensions");
  const match = (existing.media || []).find((item) => /french-gel-nail-extensions-hero/i.test(item.url || ""));
  if (match) {
    return { url: match.url, id: match.id, alt: match.alt, source: "library", size: "" };
  }
  const uploaded = await apiFetch("media/upload", {
    method: "POST",
    body: JSON.stringify({
      filename: path.basename(imagePath),
      title: "French Gel Nail Extensions at Home in Dubai",
      alt: "French Gel Nail Extensions at Home in Dubai - SMS Home Ladies Salon",
      data: fs.readFileSync(imagePath).toString("base64"),
      set_featured: false,
    }),
  });
  return {
    url: uploaded.url,
    id: uploaded.attachment_id,
    alt: "French Gel Nail Extensions at Home in Dubai - SMS Home Ladies Salon",
    source: "library",
    size: "",
  };
}

function inspectButtons(elements, service) {
  const buttons = [];
  walk(elements, (node) => {
    if (node?.elType === "widget" && node.widgetType === "button") buttons.push(node.settings || {});
  });
  return {
    view_packages_same_tab: buttons.some((item) => item.text === "View Packages" && item.link?.url === "#packages" && item.link?.is_external === false),
    popup_buttons: buttons.filter((item) => String(item._attributes || "").includes("data-service|")).length,
    service_popup_present: buttons.some((item) => String(item._attributes || "").includes(`data-service|${service}`)),
  };
}

async function deploy(candidates) {
  const status = await apiFetch("status");
  if (status.site_url !== "https://homesalon.ae" || status.bridge_version !== "0.8.7") {
    throw new Error(`Unexpected bridge target: ${JSON.stringify(status)}`);
  }
  const before = await apiFetch("pages?per_page=250");
  const rootSlugs = new Set(hubDefinitions.map((item) => item.slug));
  const rootConflicts = (before.pages || []).filter((page) => Number(page.parent_id) === 0 && rootSlugs.has(page.slug));
  if (rootConflicts.length) throw new Error(`Root draft slug conflict: ${rootConflicts.map((item) => `${item.slug}:${item.id}`).join(", ")}`);

  const results = [];
  const idsByKey = {};
  for (const candidate of candidates) {
    const body = clone(candidate);
    delete body.key;
    delete body.parent_key;
    if (candidate.parent_key) body.parent_id = idsByKey[candidate.parent_key];
    if (candidate.parent_key && !body.parent_id) throw new Error(`${candidate.key}: parent draft was not created.`);
    const saved = await apiFetch("pages", { method: "POST", body: JSON.stringify(body) });
    idsByKey[candidate.key] = saved.id;
    results.push({ key: candidate.key, id: saved.id, status: saved.status, url: saved.url, parent_id: body.parent_id });
  }

  const verified = [];
  for (const result of results) {
    const exported = await apiFetch(`pages/${result.id}`);
    const strictLint = validateTemplate(exported);
    const lint = {
      ...strictLint,
      strict_ok: strictLint.ok,
      ok: strictLint.issues.every((issue) => issue.severity !== "error"),
      lint_mode: "approved-live-baseline",
      blocking_issue_count: strictLint.issues.filter((issue) => issue.severity === "error").length,
      inherited_warning_count: strictLint.issues.filter((issue) => issue.severity === "warning").length,
    };
    const expected = candidates.find((item) => item.key === result.key);
    const buttons = inspectButtons(exported.elementor_data, expected.key === "french-gel-nail-extensions" ? "French Gel Nail Extensions" : hubDefinitions.find((item) => item.key === expected.key).service);
    verified.push({
      ...result,
      title: exported.title,
      slug: exported.slug,
      exported_status: exported.status,
      exported_parent_id: exported.parent_id,
      seo_description: exported.seo_description,
      lint,
      buttons,
    });
  }
  const bad = verified.filter((item) => item.exported_status !== "draft" || !item.lint.ok || !item.seo_description || !item.buttons.view_packages_same_tab || !item.buttons.service_popup_present);
  if (bad.length) throw new Error(`Post-save verification failed for ${bad.map((item) => item.key).join(", ")}`);

  const redirects = await apiFetch("rank-math/redirections");
  if (Number(redirects.count) !== 0) throw new Error(`Redirect inventory changed unexpectedly to ${redirects.count}.`);
  return { status, results, verified, redirect_count: redirects.count };
}

async function main() {
  if (!fs.existsSync(snapshotPath)) throw new Error(`Snapshot not found: ${snapshotPath}`);
  if (!fs.existsSync(imagePath)) throw new Error(`Image not found: ${imagePath}`);
  fs.mkdirSync(outputDir, { recursive: true });
  const snapshot = readJson(snapshotPath);
  const localCandidates = buildCandidates(snapshot);
  writeCandidates(localCandidates);
  const localLint = lintCandidates(localCandidates, "pre-upload");

  if (!apply) {
    console.log(JSON.stringify({ ok: true, apply: false, candidates: localCandidates.length, lint: localLint.map((item) => ({ key: item.key, score: item.score, issues: item.issue_count })), outputDir }, null, 2));
    return;
  }
  if (!baseUrl || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required with --apply.");
  if (baseUrl.replace(/\/$/, "") !== "https://homesalon.ae/wp-json/native-elementor/v1") {
    throw new Error(`Refusing unexpected bridge URL: ${baseUrl}`);
  }

  const media = await ensureMedia();
  const finalCandidates = buildCandidates(snapshot, media);
  writeCandidates(finalCandidates, "final");
  const finalLint = lintCandidates(finalCandidates, "post-upload");
  const deployment = await deploy(finalCandidates);
  const report = {
    generated_at: new Date().toISOString(),
    operation: "create-five-draft-pages",
    media,
    lint: finalLint,
    ...deployment,
  };
  fs.writeFileSync(path.join(outputDir, "deployment-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({
    ok: true,
    media_id: media.id,
    created: deployment.results,
    verified: deployment.verified.length,
    redirect_count: deployment.redirect_count,
    outputDir,
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
