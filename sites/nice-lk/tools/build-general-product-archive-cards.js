const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../..");
const snapshotFile = path.join(root, "build", "site-intake", "nice-lk-photobook-archive", "site-snapshot.json");
const templateDir = path.join(root, "sites", "nice-lk", "content", "templates");
const baselineFile = path.join(templateDir, "general-product-archive-6916.live-baseline.json");
const outputFile = path.join(templateDir, "general-product-archive-6916.elementor.json");
const templateId = 6916;
const widgetId = "455e1c3";
const giftsCondition = "include/product_archive/product_cat/197";

const cardCss = `selector .woocommerce-result-count,
selector .woocommerce-ordering {
  margin-bottom: 18px;
  color: #4B5563;
  font-family: Manrope, sans-serif;
  font-size: 13px;
}

selector ul.products {
  display: grid !important;
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  gap: 20px !important;
  align-items: stretch;
  margin: 0 !important;
  padding: 0 !important;
}

selector ul.products li.product {
  position: relative;
  display: flex !important;
  flex-direction: column;
  width: auto !important;
  min-width: 0;
  height: 100%;
  float: none !important;
  margin: 0 !important;
  padding: 12px 12px 16px !important;
  overflow: hidden;
  border: 1px solid #E6EAF2;
  border-radius: 18px;
  background: #FFFFFF;
  box-shadow: 0 16px 36px rgba(17, 24, 39, 0.06);
  transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
}

selector ul.products li.product:hover {
  transform: translateY(-4px);
  border-color: #D6D9F6;
  box-shadow: 0 22px 44px rgba(17, 24, 39, 0.10);
}

selector ul.products li.product > .woocommerce-LoopProduct-link {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  color: inherit;
}

selector ul.products li.product img {
  width: 100%;
  aspect-ratio: 1 / 1;
  margin-bottom: 14px !important;
  border-radius: 14px;
  background: #F8FAFC;
  object-fit: contain;
}

selector ul.products li.product .woocommerce-loop-product__title {
  display: -webkit-box;
  min-height: 126px;
  max-height: 126px;
  flex: 0 0 126px;
  margin: 0 0 12px !important;
  overflow: hidden;
  overflow-wrap: anywhere;
  color: #111827 !important;
  font-family: Poppins, sans-serif !important;
  font-size: 15px !important;
  font-weight: 700 !important;
  line-height: 1.4 !important;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 6;
}

selector ul.products li.product .price {
  display: flex;
  min-height: 24px;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px !important;
  color: #6A4CFF !important;
  font-family: Manrope, sans-serif !important;
  font-size: 15px !important;
  font-weight: 800 !important;
  line-height: 1.2 !important;
}

selector ul.products li.product .price del {
  color: #94A3B8 !important;
  font-weight: 600;
}

selector ul.products li.product .price ins {
  text-decoration: none;
}

selector ul.products li.product .button {
  display: inline-flex !important;
  width: 100%;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  margin-top: auto !important;
  padding: 10px 16px !important;
  border: 1px solid #111827 !important;
  border-radius: 12px !important;
  background: #111827 !important;
  color: #FFFFFF !important;
  font-family: Manrope, sans-serif !important;
  font-size: 12px !important;
  font-weight: 800 !important;
  letter-spacing: 0 !important;
  line-height: 1.2 !important;
  text-align: center;
  text-transform: uppercase !important;
}

selector ul.products li.product .button:hover {
  border-color: #6A4CFF !important;
  background: #6A4CFF !important;
}

selector span.onsale {
  top: 12px !important;
  right: auto !important;
  left: 12px !important;
  min-height: auto !important;
  padding: 7px 10px !important;
  border-radius: 999px !important;
  background: #EF4444 !important;
  color: #FFFFFF !important;
  font-family: Manrope, sans-serif !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  line-height: 1 !important;
  text-transform: uppercase !important;
}

selector nav.woocommerce-pagination {
  margin-top: 28px;
}

selector nav.woocommerce-pagination ul {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0;
  border: 0 !important;
}

selector nav.woocommerce-pagination ul li {
  border: 0 !important;
}

selector nav.woocommerce-pagination ul li a,
selector nav.woocommerce-pagination ul li span {
  display: inline-flex;
  min-width: 42px;
  height: 42px;
  align-items: center;
  justify-content: center;
  border: 1px solid #D6DBE7;
  border-radius: 12px;
  background: #FFFFFF;
  color: #111827;
  font-family: Manrope, sans-serif;
  font-size: 13px;
  font-weight: 700;
}

selector nav.woocommerce-pagination ul li span.current,
selector nav.woocommerce-pagination ul li a:hover {
  border-color: #6A4CFF;
  background: #6A4CFF;
  color: #FFFFFF;
}

@media (max-width: 1024px) {
  selector ul.products {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}

@media (max-width: 767px) {
  selector ul.products {
    grid-template-columns: minmax(0, 1fr) !important;
    gap: 14px !important;
  }

  selector ul.products li.product {
    padding: 10px 10px 14px !important;
  }

  selector ul.products li.product .woocommerce-loop-product__title {
    font-size: 14px !important;
  }
}`;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function findElement(elements, id) {
  for (const element of elements || []) {
    if (element.id === id) return element;
    const nested = findElement(element.elements, id);
    if (nested) return nested;
  }
  return null;
}

function captureBaseline() {
  if (fs.existsSync(baselineFile)) {
    throw new Error(`Approved baseline already exists: ${path.relative(root, baselineFile)}`);
  }
  const snapshot = readJson(snapshotFile);
  const template = (snapshot.templates || []).find((item) => Number(item.id) === templateId);
  const themeBuilder = (snapshot.theme_builder?.templates || []).find((item) => Number(item.id) === templateId);
  if (!template || !Array.isArray(template.elementor_data) || !themeBuilder) {
    throw new Error(`Template ${templateId} is missing from the fresh site snapshot.`);
  }
  writeJson(baselineFile, {
    title: template.title,
    type: themeBuilder.type,
    status: template.status,
    conditions: themeBuilder.conditions,
    template: template.template || "default",
    page_settings: template.page_settings || "",
    elementor_data: template.elementor_data
  });
  return { captured: path.relative(root, baselineFile) };
}

function buildCandidate() {
  const payload = readJson(baselineFile);
  const widget = findElement(payload.elementor_data, widgetId);
  if (!widget || widget.widgetType !== "wc-archive-products") {
    throw new Error(`Expected archive-products widget ${widgetId} was not found.`);
  }
  if (widget.settings.custom_css) {
    throw new Error("The approved baseline already contains widget custom CSS; reconcile it before rebuilding.");
  }

  widget.settings.columns = 4;
  widget.settings.columns_tablet = 2;
  widget.settings.columns_mobile = 1;
  widget.settings.nothing_found_message = "No products match this filter yet.";
  widget.settings.custom_css = cardCss;
  payload.conditions = [...new Set([...(payload.conditions || []), giftsCondition])];

  writeJson(outputFile, payload);
  return {
    output: path.relative(root, outputFile),
    template_id: templateId,
    widget_id: widgetId,
    columns: { desktop: 4, tablet: 2, mobile: 1 }
  };
}

const result = process.argv.includes("--capture") ? captureBaseline() : buildCandidate();
console.log(JSON.stringify(result, null, 2));
