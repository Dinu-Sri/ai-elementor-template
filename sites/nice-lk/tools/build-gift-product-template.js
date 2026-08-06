const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../..");
const templateDir = path.join(root, "sites", "nice-lk", "content", "templates");
const baselineFile = path.join(templateDir, "photobook-product-246.live-baseline.json");
const outputFile = path.join(templateDir, "gift-product.elementor.json");
const sourceTemplateId = 246;
const targetSite = "https://nice.lk";

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function createApi(baseUrl, apiKey) {
  const api = `${baseUrl.replace(/\/$/, "")}/wp-json/native-elementor/v1/`;
  return async function apiFetch(endpoint, options = {}) {
    const response = await fetch(`${api}${endpoint}`, {
      method: options.method || "GET",
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(options.timeout || 90000)
    });
    const text = await response.text();
    let payload;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      throw new Error(`${endpoint} returned non-JSON (${response.status}).`);
    }
    if (!response.ok) throw new Error(`${endpoint} failed with ${response.status}: ${payload?.message || response.statusText}`);
    return payload;
  };
}

function environment() {
  const site = String(process.env.NEB_SITE_URL || "").replace(/\/$/, "");
  const apiKey = process.env.NEB_API_KEY;
  if (!site || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required for live operations.");
  if (site !== targetSite) throw new Error(`Refusing unexpected target site: ${site}`);
  return { site, apiKey };
}

async function capture() {
  if (fs.existsSync(baselineFile)) throw new Error(`Approved baseline already exists: ${path.relative(root, baselineFile)}`);
  const { site, apiKey } = environment();
  const template = await createApi(site, apiKey)(`pages/${sourceTemplateId}`);
  if (template.type !== "jet-woo-builder" || !Array.isArray(template.elementor_data)) {
    throw new Error(`Post ${sourceTemplateId} is not the expected JetWooBuilder template.`);
  }
  writeJson(baselineFile, {
    captured_at: new Date().toISOString(),
    source_id: sourceTemplateId,
    title: template.title,
    type: template.type,
    template: template.template || "default",
    page_settings: template.page_settings || "",
    elementor_data: template.elementor_data
  });
  console.log(JSON.stringify({ captured: path.relative(root, baselineFile), source_id: sourceTemplateId }, null, 2));
}

function findElement(elements, id) {
  for (const element of elements || []) {
    if (element.id === id) return element;
    const nested = findElement(element.elements, id);
    if (nested) return nested;
  }
  return null;
}

function applySpacingResets(elements) {
  for (const element of elements || []) {
    element.settings = element.settings || {};
    element.settings._margin = { unit: "px", top: "0", right: "0", bottom: "0", left: "0", isLinked: true };
    element.settings._margin_tablet = { unit: "px", top: "0", right: "0", bottom: "0", left: "0", isLinked: true };
    element.settings._margin_mobile = { unit: "px", top: "0", right: "0", bottom: "0", left: "0", isLinked: true };
    applySpacingResets(element.elements);
  }
}

function build() {
  const baseline = readJson(baselineFile);
  const data = JSON.parse(JSON.stringify(baseline.elementor_data));
  const rootContainer = findElement(data, "198d15d1");
  const imageContainer = findElement(data, "5c6db6b5");
  const summaryContainer = findElement(data, "31c9b02b");
  const title = findElement(data, "390cfd8");
  const price = findElement(data, "1592f3a4");
  const description = findElement(data, "78d222d8");
  const addToCart = findElement(data, "3eae859e");
  if (!rootContainer || !imageContainer || !summaryContainer || !title || !price || !description || !addToCart) {
    throw new Error("The approved photobook baseline no longer matches the expected shared product structure.");
  }

  rootContainer.settings = {
    ...rootContainer.settings,
    content_width: "boxed",
    boxed_width: { unit: "px", size: 1240, sizes: [] },
    boxed_width_tablet: { unit: "px", size: 960, sizes: [] },
    boxed_width_mobile: { unit: "px", size: 767, sizes: [] },
    flex_direction: "row",
    flex_direction_tablet: "column",
    flex_direction_mobile: "column",
    gap: { unit: "px", size: 28, sizes: [] },
    gap_tablet: { unit: "px", size: 20, sizes: [] },
    background_background: "classic",
    background_color: "#F5F7FB",
    padding: { unit: "px", top: "48", right: "24", bottom: "56", left: "24", isLinked: false },
    padding_tablet: { unit: "px", top: "32", right: "20", bottom: "40", left: "20", isLinked: false },
    padding_mobile: { unit: "px", top: "22", right: "14", bottom: "30", left: "14", isLinked: false }
  };

  imageContainer.settings = {
    ...imageContainer.settings,
    width: { unit: "%", size: 54, sizes: [] },
    width_tablet: { unit: "%", size: 100, sizes: [] },
    width_mobile: { unit: "%", size: 100, sizes: [] },
    flex_direction: "column",
    justify_content: "center",
    background_background: "classic",
    background_color: "#FFFFFF",
    border_border: "solid",
    border_width: { unit: "px", top: "1", right: "1", bottom: "1", left: "1", isLinked: true },
    border_color: "#E5E7EB",
    border_radius: { unit: "px", top: "8", right: "8", bottom: "8", left: "8", isLinked: true },
    padding: { unit: "px", top: "20", right: "20", bottom: "20", left: "20", isLinked: true },
    padding_mobile: { unit: "px", top: "12", right: "12", bottom: "12", left: "12", isLinked: true }
  };

  summaryContainer.settings = {
    ...summaryContainer.settings,
    width: { unit: "%", size: 42, sizes: [] },
    width_tablet: { unit: "%", size: 100, sizes: [] },
    width_mobile: { unit: "%", size: 100, sizes: [] },
    flex_direction: "column",
    gap: { unit: "px", size: 14, sizes: [] },
    justify_content: "center",
    background_background: "classic",
    background_color: "#FFFFFF",
    border_border: "solid",
    border_width: { unit: "px", top: "1", right: "1", bottom: "1", left: "1", isLinked: true },
    border_color: "#E5E7EB",
    border_radius: { unit: "px", top: "8", right: "8", bottom: "8", left: "8", isLinked: true },
    padding: { unit: "px", top: "32", right: "32", bottom: "32", left: "32", isLinked: true },
    padding_mobile: { unit: "px", top: "22", right: "18", bottom: "22", left: "18", isLinked: false }
  };

  title.settings = {
    ...title.settings,
    header_size: "h1",
    title_color: "#111827",
    typography_typography: "custom",
    typography_font_family: "Poppins",
    typography_font_size: { unit: "px", size: 34, sizes: [] },
    typography_font_size_tablet: { unit: "px", size: 29, sizes: [] },
    typography_font_size_mobile: { unit: "px", size: 24, sizes: [] },
    typography_font_weight: "700",
    typography_line_height: { unit: "em", size: 1.2, sizes: [] }
  };
  price.settings = {
    ...price.settings,
    color: "#6A4CFF",
    typography_typography: "custom",
    typography_font_family: "Manrope",
    typography_font_size: { unit: "px", size: 22, sizes: [] },
    typography_font_weight: "800"
  };
  description.settings = {
    ...description.settings,
    text_color: "#4B5563",
    typography_typography: "custom",
    typography_font_family: "Manrope",
    typography_font_size: { unit: "px", size: 15, sizes: [] },
    typography_line_height: { unit: "em", size: 1.7, sizes: [] }
  };
  addToCart.settings = {
    ...addToCart.settings,
    button_text_color: "#FFFFFF",
    button_background_color: "#111827",
    button_hover_color: "#FFFFFF",
    button_hover_background_color: "#6A4CFF",
    button_border_radius: { unit: "px", top: "6", right: "6", bottom: "6", left: "6", isLinked: true },
    button_typography_typography: "custom",
    button_typography_font_family: "Manrope",
    button_typography_font_weight: "800"
  };

  const sharedIds = new Set(["390cfd8", "1592f3a4", "78d222d8", "3eae859e"]);
  summaryContainer.elements = summaryContainer.elements.filter((element) => sharedIds.has(element.id));
  summaryContainer.elements.unshift({
    id: "a1b2c3d4",
    elType: "widget",
    settings: {
      title: "GIFTS & PERSONALISATION",
      header_size: "div",
      title_color: "#6A4CFF",
      typography_typography: "custom",
      typography_font_family: "Manrope",
      typography_font_size: { unit: "px", size: 12, sizes: [] },
      typography_font_weight: "800",
      typography_letter_spacing: { unit: "px", size: 0, sizes: [] }
    },
    elements: [],
    widgetType: "heading"
  });
  summaryContainer.elements.push({
    id: "b2c3d4e5",
    elType: "widget",
    settings: {
      editor: "Personalisation available for individual gifts and branded bulk orders. Our team will confirm artwork, quantity and delivery details with you.",
      text_color: "#4B5563",
      typography_typography: "custom",
      typography_font_family: "Manrope",
      typography_font_size: { unit: "px", size: 14, sizes: [] },
      typography_line_height: { unit: "em", size: 1.6, sizes: [] }
    },
    elements: [],
    widgetType: "text-editor"
  });
  summaryContainer.elements.push({
    id: "c3d4e5f6",
    elType: "widget",
    settings: {
      text: "Request a quote",
      link: { url: "/contact-us/", is_external: "", nofollow: "", custom_attributes: "" },
      align: "justify",
      size: "md",
      button_text_color: "#FFFFFF",
      background_color: "#6A4CFF",
      button_background_hover_color: "#111827",
      border_radius: { unit: "px", top: "6", right: "6", bottom: "6", left: "6", isLinked: true },
      typography_typography: "custom",
      typography_font_family: "Manrope",
      typography_font_weight: "800"
    },
    elements: [],
    widgetType: "button"
  });

  applySpacingResets(data);

  writeJson(outputFile, {
    title: "Gifts Product",
    source_id: sourceTemplateId,
    template_type: "single",
    status: "draft",
    page_settings: baseline.page_settings || "",
    elementor_data: data
  });
  console.log(JSON.stringify({ output: path.relative(root, outputFile), source_id: sourceTemplateId }, null, 2));
}

const action = process.argv.includes("--capture") ? capture() : Promise.resolve(build());
action.catch((error) => {
  console.error(error.message);
  process.exit(1);
});
