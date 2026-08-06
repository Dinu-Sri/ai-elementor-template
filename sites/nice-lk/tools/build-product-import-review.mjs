import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../../..");
const productDir = path.join(root, "sites", "nice-lk", "content", "products");
const outputDir = path.join(root, "outputs", "nice-lk-product-import-review-20260806");
const previewDir = path.join(outputDir, "previews");
const outputPath = path.join(outputDir, "nice-lk-product-import-review.xlsx");

const products = JSON.parse(
  await fs.readFile(path.join(productDir, "ccc-products.normalized.json"), "utf8")
);
const rows = JSON.parse(
  await fs.readFile(path.join(productDir, "ccc-product-rows.json"), "utf8")
);
const categories = JSON.parse(
  await fs.readFile(path.join(productDir, "ccc-product-categories.json"), "utf8")
);
const imageManifest = JSON.parse(
  await fs.readFile(path.join(productDir, "ccc-image-manifest.json"), "utf8")
);

const colors = {
  purple: "#5B16C5",
  blue: "#4267C7",
  orange: "#F05A2B",
  teal: "#168B7B",
  ink: "#24222A",
  muted: "#66616F",
  light: "#F7F5FC",
  line: "#DDD8E8",
  white: "#FFFFFF",
  green: "#16835A",
  greenLight: "#E7F5EE",
  amber: "#A96600",
  amberLight: "#FFF3D8",
  red: "#B92D2D",
  redLight: "#FDE9E7"
};

const categoryNames = categories.map((category) => category.name);
const productById = new Map(products.map((product) => [product.source_product_index, product]));
const duplicateVariationKeys = new Set();

for (const product of products) {
  const groups = new Map();
  for (const variation of product.variations) {
    const key = String(variation.name || "").trim().toLowerCase();
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  for (const [name, count] of groups.entries()) {
    if (count > 1) duplicateVariationKeys.add(`${product.source_product_index}:${name}`);
  }
}

const colorWords = new Set([
  "black", "blue", "brown", "dark green", "gold", "gray", "green", "grey",
  "light green", "orange", "pink", "purple", "red", "rose gold", "silver",
  "white", "yellow"
]);

function suggestedAttribute(product) {
  if (product.type !== "variable") return "";
  const values = product.variations
    .map((variation) => String(variation.name || "").trim())
    .filter((value) => value && value.toLowerCase() !== "default");
  if (values.length && values.every((value) => colorWords.has(value.toLowerCase()))) return "Color";
  if (values.length && values.every((value) => /^\d+(?:\.\d+)?(?:\s*[*xX]\s*\d+(?:\.\d+)?)+/.test(value))) return "Size";
  if (values.length && values.every((value) => /^\d+(?:\.\d+)?(?:\s*(?:cm|mm|ml|oz))?$/i.test(value))) return "Size";
  return "Option";
}

const imageUsage = new Map();
for (const product of products) {
  for (const image of product.images || []) {
    if (!imageUsage.has(image)) imageUsage.set(image, { products: new Set(), rows: new Set() });
    imageUsage.get(image).products.add(product.name);
  }
  for (const variation of product.variations || []) {
    for (const image of variation.images || []) {
      if (!imageUsage.has(image)) imageUsage.set(image, { products: new Set(), rows: new Set() });
      imageUsage.get(image).products.add(product.name);
      imageUsage.get(image).rows.add(variation.source_row);
    }
  }
}

const imageAudit = [];
for (const item of imageManifest) {
  const absolutePath = path.join(root, ...item.file.split("/"));
  const metadata = await sharp(absolutePath).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;
  const minSide = Math.min(width, height);
  const aspect = height ? width / height : 0;
  const usage = imageUsage.get(item.file) || { products: new Set(), rows: new Set() };
  let status = "Low Resolution";
  let action = "Request a better source image or approve careful upscaling to a 1200 x 1200 canvas.";
  if (minSide >= 1000) {
    status = "Ready";
    action = "Standardize to the approved 1200 x 1200 export profile.";
  } else if (minSide >= 800) {
    status = "Acceptable";
    action = "Standardize to 1200 x 1200 with light upscaling.";
  } else if (minSide >= 600) {
    status = "Upscale";
    action = "Upscale and review at 100% before import.";
  }
  imageAudit.push({
    file: path.basename(item.file),
    width,
    height,
    format: (metadata.format || path.extname(item.file).slice(1)).toUpperCase(),
    aspect: Number(aspect.toFixed(3)),
    minSide,
    productCount: usage.products.size,
    products: [...usage.products].join(" | "),
    rows: [...usage.rows].sort((a, b) => a - b).join(", "),
    status,
    action,
    sourcePath: item.file
  });
}

const categoryCounts = new Map();
for (const product of products) {
  categoryCounts.set(product.category_guess, (categoryCounts.get(product.category_guess) || 0) + 1);
}

const issues = [];
function addIssue(severity, scope, product, sourceRow, field, issue, action) {
  issues.push([
    severity,
    scope,
    product?.source_product_index || "",
    product?.name || "",
    sourceRow || "",
    field,
    issue,
    action,
    "Open",
    ""
  ]);
}

for (const product of products) {
  addIssue(
    "Blocker",
    "Product",
    product,
    "",
    "Final Category",
    `Category is guessed as ${product.category_guess}; the workbook has no explicit category column.`,
    "Confirm or change the final category and mark Category Approval as Approved."
  );
  addIssue(
    "Review",
    "Product",
    product,
    "",
    "Descriptions",
    "Short and full product descriptions are not present in the source workbook.",
    "Add customer-facing descriptions or approve description drafting."
  );
  if ((product.images || []).length === 0) {
    addIssue(
      "Blocker",
      "Product",
      product,
      "",
      "Product Image",
      "No image is mapped to this product.",
      "Supply or select a product image before import."
    );
  }
  if (product.type === "variable") {
    addIssue(
      "Blocker",
      "Product",
      product,
      "",
      "Variation Attribute",
      `Suggested attribute is ${suggestedAttribute(product)}; the source does not explicitly name the attribute.`,
      "Confirm the final attribute and mark Attribute Approval as Approved."
    );
  }
  if (product.type === "simple" && product.variations.length > 1) {
    addIssue(
      "Blocker",
      "Product",
      product,
      "",
      "Product Type",
      `Product is marked simple but has ${product.variations.length} source rows with Default variation labels.`,
      "Confirm whether these rows are separate products, image choices, or true variations."
    );
  }

  const duplicateNames = new Map();
  for (const variation of product.variations) {
    const key = String(variation.name || "").trim().toLowerCase();
    duplicateNames.set(key, (duplicateNames.get(key) || 0) + 1);
    addIssue(
      "Blocker",
      "Variation",
      product,
      variation.source_row,
      "Regular Price",
      "No regular price is present in the source workbook.",
      "Enter the WooCommerce regular price."
    );
    if (variation.stock_quantity === null || variation.stock_quantity === "" || variation.stock_quantity === undefined) {
      addIssue(
        "Blocker",
        "Variation",
        product,
        variation.source_row,
        "Stock Quantity",
        "Stock quantity is blank.",
        "Confirm the available quantity."
      );
    }
    if ((variation.images || []).length === 0) {
      addIssue(
        "Blocker",
        "Variation",
        product,
        variation.source_row,
        "Variation Image",
        "No image is mapped to this source row.",
        "Supply an image or approve use of the parent product image."
      );
    }
  }
  for (const [name, count] of duplicateNames.entries()) {
    if (count > 1) {
      addIssue(
        "Blocker",
        "Product",
        product,
        "",
        "Duplicate Variation Value",
        `Variation value "${name || "Default"}" appears ${count} times.`,
        "Rename, merge, or otherwise distinguish these variation rows."
      );
    }
  }
}

if ((categoryCounts.get("T-Shirt Printing") || 0) === 0) {
  addIssue(
    "Blocker",
    "Category",
    null,
    "",
    "T-Shirt Printing",
    "No source products were confidently assigned to T-Shirt Printing.",
    "Identify the applicable products or provide a separate T-shirt catalog."
  );
}

const lowResolutionCount = imageAudit.filter((image) => image.minSide < 800).length;
addIssue(
  "Blocker",
  "Catalog",
  null,
  "",
  "Image Resolution",
  `${lowResolutionCount} of ${imageAudit.length} images are below 800 px on their shortest side.`,
  "Provide better originals or approve a standardized upscale-and-review workflow."
);

const workbook = Workbook.create();
const readme = workbook.worksheets.add("Read Me");
const productSheet = workbook.worksheets.add("Products");
const variationSheet = workbook.worksheets.add("Variations");
const categorySheet = workbook.worksheets.add("Categories");
const imageSheet = workbook.worksheets.add("Image Audit");
const issueSheet = workbook.worksheets.add("Issues");

for (const sheet of [readme, productSheet, variationSheet, categorySheet, imageSheet, issueSheet]) {
  sheet.showGridLines = false;
}

function styleHeader(range) {
  range.format = {
    fill: colors.purple,
    font: { bold: true, color: colors.white },
    verticalAlignment: "center",
    wrapText: true,
    borders: { bottom: { style: "medium", color: colors.orange } }
  };
  range.format.rowHeight = 32;
}

function styleDataRange(range) {
  range.format = {
    font: { color: colors.ink, size: 10 },
    verticalAlignment: "top",
    borders: { insideHorizontal: { style: "thin", color: colors.line } }
  };
}

function addStatusFormatting(range) {
  range.conditionalFormats.add("containsText", {
    text: "READY",
    format: { fill: colors.greenLight, font: { bold: true, color: colors.green } }
  });
  range.conditionalFormats.add("containsText", {
    text: "REVIEW",
    format: { fill: colors.amberLight, font: { bold: true, color: colors.amber } }
  });
  range.conditionalFormats.add("containsText", {
    text: "BLOCKED",
    format: { fill: colors.redLight, font: { bold: true, color: colors.red } }
  });
}

readme.getRange("A1:H1").merge();
readme.getRange("A1").values = [["Nice.lk Product Import Review"]];
readme.getRange("A1:H1").format = {
  fill: colors.purple,
  font: { bold: true, color: colors.white, size: 20 },
  verticalAlignment: "center"
};
readme.getRange("A1:H1").format.rowHeight = 42;
readme.getRange("A3:H3").merge();
readme.getRange("A3").values = [[
  "Complete the highlighted approval and pricing fields before any WooCommerce import. All products must remain Draft until owner approval."
]];
readme.getRange("A3:H3").format = {
  fill: colors.light,
  font: { bold: true, color: colors.ink, size: 11 },
  wrapText: true,
  verticalAlignment: "center",
  borders: { left: { style: "thick", color: colors.orange } }
};
readme.getRange("A3:H3").format.rowHeight = 42;

readme.getRange("A5:B5").values = [["Catalog Metric", "Value"]];
styleHeader(readme.getRange("A5:B5"));
readme.getRange("A6:A15").values = [
  ["Products"],
  ["Variation rows"],
  ["Variable products"],
  ["Simple products"],
  ["Extracted images"],
  ["Products without images"],
  ["Variation rows without images"],
  ["Images below 800 px"],
  ["Open blockers"],
  ["Ready variation rows"]
];
readme.getRange("B6:B15").formulas = [
  [`=COUNTA('Products'!$A$2:$A$${products.length + 1})`],
  [`=COUNTA('Variations'!$A$2:$A$${rows.length + 1})`],
  [`=COUNTIF('Products'!$C$2:$C$${products.length + 1},"variable")`],
  [`=COUNTIF('Products'!$C$2:$C$${products.length + 1},"simple")`],
  [`=COUNTA('Image Audit'!$A$2:$A$${imageAudit.length + 1})`],
  [`=COUNTIF('Products'!$I$2:$I$${products.length + 1},"Missing")`],
  [`=COUNTIF('Variations'!$M$2:$M$${rows.length + 1},"Missing")`],
  [`=COUNTIF('Image Audit'!$J$2:$J$${imageAudit.length + 1},"Low Resolution")`],
  [`=COUNTIFS('Issues'!$A$2:$A$${issues.length + 1},"Blocker",'Issues'!$I$2:$I$${issues.length + 1},"Open")`],
  [`=COUNTIF('Variations'!$O$2:$O$${rows.length + 1},"READY")`]
];
readme.getRange("A6:B15").format = {
  borders: { insideHorizontal: { style: "thin", color: colors.line } },
  font: { color: colors.ink, size: 11 }
};
readme.getRange("B6:B15").format.numberFormat = "#,##0";
readme.getRange("B6:B15").format.horizontalAlignment = "right";

readme.getRange("D5:H5").merge();
readme.getRange("D5").values = [["Required Review Sequence"]];
styleHeader(readme.getRange("D5:H5"));
readme.getRange("D6:H11").values = [
  ["1", "Products", "Confirm final categories and product types.", "Owner", "Pending"],
  ["2", "Products", "Confirm variation attributes and descriptions.", "Owner / Content", "Pending"],
  ["3", "Variations", "Enter regular prices and correct stock exceptions.", "Owner", "Pending"],
  ["4", "Image Audit", "Provide better originals or approve upscaling.", "Owner", "Pending"],
  ["5", "Issues", "Resolve every open blocker.", "Owner / Importer", "Pending"],
  ["6", "Import", "Create WooCommerce products as drafts and verify them.", "Importer", "Not Started"]
];
readme.getRange("D6:H11").format = {
  borders: { insideHorizontal: { style: "thin", color: colors.line } },
  font: { color: colors.ink, size: 10 },
  wrapText: true,
  verticalAlignment: "top"
};
readme.getRange("D6:D11").format.horizontalAlignment = "center";
readme.getRange("H6:H11").format = { fill: colors.amberLight, font: { bold: true, color: colors.amber } };

readme.getRange("A18:H18").merge();
readme.getRange("A18").values = [["Import rule: do not publish products directly. The first site upload must use Draft status and undergo product-page, variation, stock, image, and mobile checks."]];
readme.getRange("A18:H18").format = {
  fill: colors.redLight,
  font: { bold: true, color: colors.red, size: 11 },
  wrapText: true,
  borders: { left: { style: "thick", color: colors.red } }
};
readme.getRange("A18:H18").format.rowHeight = 44;
readme.getRange("A:A").format.columnWidth = 30;
readme.getRange("B:B").format.columnWidth = 14;
readme.getRange("C:C").format.columnWidth = 3;
readme.getRange("D:D").format.columnWidth = 7;
readme.getRange("E:E").format.columnWidth = 17;
readme.getRange("F:F").format.columnWidth = 42;
readme.getRange("G:G").format.columnWidth = 18;
readme.getRange("H:H").format.columnWidth = 16;

const productHeaders = [
  "Product ID", "Product Name", "Proposed Woo Type", "Variation Rows", "Category Guess",
  "Final Category", "Category Approval", "Product Image Count", "Product Image Status",
  "Suggested Attribute", "Final Attribute", "Attribute Approval", "Short Description",
  "Full Description", "Weight (kg)", "Length (cm)", "Width (cm)", "Height (cm)",
  "Tax Status", "Shipping Class", "Publish Status", "Readiness", "Reviewer Notes"
];
productSheet.getRange(`A1:W1`).values = [productHeaders];
styleHeader(productSheet.getRange("A1:W1"));
const productValues = products.map((product) => [
  product.source_product_index,
  product.name,
  product.type,
  product.variations.length,
  product.category_guess,
  product.category_guess,
  "Pending",
  (product.images || []).length,
  (product.images || []).length ? "Mapped" : "Missing",
  suggestedAttribute(product),
  suggestedAttribute(product),
  product.type === "variable" ? "Pending" : "Not Required",
  "",
  "",
  "",
  "",
  "",
  "",
  "taxable",
  "",
  "Draft",
  "",
  ""
]);
productSheet.getRange(`A2:W${products.length + 1}`).values = productValues;
for (let row = 2; row <= products.length + 1; row += 1) {
  productSheet.getRange(`V${row}`).formulas = [[
    `=IF(OR(F${row}="",G${row}<>"Approved",H${row}=0,AND(C${row}="variable",OR(K${row}="",L${row}<>"Approved"))),"BLOCKED",IF(OR(M${row}="",N${row}=""),"REVIEW","READY"))`
  ]];
}
styleDataRange(productSheet.getRange(`A2:W${products.length + 1}`));
productSheet.getRange(`F2:F${products.length + 1}`).dataValidation = { rule: { type: "list", values: categoryNames } };
productSheet.getRange(`G2:G${products.length + 1}`).dataValidation = { rule: { type: "list", values: ["Pending", "Approved", "Change Required"] } };
productSheet.getRange(`L2:L${products.length + 1}`).dataValidation = { rule: { type: "list", values: ["Pending", "Approved", "Not Required"] } };
productSheet.getRange(`S2:S${products.length + 1}`).dataValidation = { rule: { type: "list", values: ["taxable", "shipping", "none"] } };
productSheet.getRange(`U2:U${products.length + 1}`).dataValidation = { rule: { type: "list", values: ["Draft", "Pending Review"] } };
for (const column of ["F", "G", "K", "L", "M", "N", "O", "P", "Q", "R", "T", "W"]) {
  productSheet.getRange(`${column}2:${column}${products.length + 1}`).format.fill = colors.amberLight;
}
productSheet.getRange(`O2:R${products.length + 1}`).format.numberFormat = "0.00";
addStatusFormatting(productSheet.getRange(`V2:V${products.length + 1}`));
productSheet.freezePanes.freezeRows(1);
productSheet.tables.add(`A1:W${products.length + 1}`, true, "ProductsReviewTable");
const productWidths = [10, 42, 16, 12, 20, 20, 16, 12, 16, 18, 18, 16, 34, 45, 11, 11, 11, 11, 12, 18, 13, 12, 32];
productWidths.forEach((width, index) => { productSheet.getRangeByIndexes(0, index, products.length + 1, 1).format.columnWidth = width; });

const variationHeaders = [
  "Source Row", "Product ID", "Product Name", "Product Type", "Attribute Name",
  "Variation Value", "Duplicate Value", "SKU", "Stock Qty", "Regular Price", "Sale Price",
  "Image Count", "Image Status", "Sample", "Readiness", "Reviewer Notes"
];
variationSheet.getRange("A1:P1").values = [variationHeaders];
styleHeader(variationSheet.getRange("A1:P1"));
const variationValues = [];
for (const product of products) {
  for (const variation of product.variations) {
    const duplicateKey = `${product.source_product_index}:${String(variation.name || "").trim().toLowerCase()}`;
    variationValues.push([
      variation.source_row,
      product.source_product_index,
      product.name,
      product.type,
      "",
      variation.name,
      duplicateVariationKeys.has(duplicateKey) ? "Yes" : "No",
      variation.sku,
      variation.stock_quantity ?? "",
      "",
      "",
      (variation.images || []).length,
      (variation.images || []).length ? "Mapped" : "Missing",
      variation.sample ?? "",
      "",
      ""
    ]);
  }
}
variationSheet.getRange(`A2:P${variationValues.length + 1}`).values = variationValues;
for (let row = 2; row <= variationValues.length + 1; row += 1) {
  variationSheet.getRange(`E${row}`).formulas = [[
    `=IF(D${row}="variable",INDEX('Products'!$K$2:$K$${products.length + 1},MATCH(B${row},'Products'!$A$2:$A$${products.length + 1},0)),"")`
  ]];
  variationSheet.getRange(`O${row}`).formulas = [[
    `=IF(OR(I${row}="",J${row}="",M${row}="Missing",AND(D${row}="variable",E${row}="")),"BLOCKED",IF(G${row}="Yes","REVIEW","READY"))`
  ]];
}
styleDataRange(variationSheet.getRange(`A2:P${variationValues.length + 1}`));
for (const column of ["I", "J", "K", "P"]) {
  variationSheet.getRange(`${column}2:${column}${variationValues.length + 1}`).format.fill = colors.amberLight;
}
variationSheet.getRange(`I2:I${variationValues.length + 1}`).format.numberFormat = "#,##0";
variationSheet.getRange(`J2:K${variationValues.length + 1}`).format.numberFormat = "#,##0.00";
variationSheet.getRange(`G2:G${variationValues.length + 1}`).conditionalFormats.add("containsText", {
  text: "Yes",
  format: { fill: colors.redLight, font: { bold: true, color: colors.red } }
});
addStatusFormatting(variationSheet.getRange(`O2:O${variationValues.length + 1}`));
variationSheet.freezePanes.freezeRows(1);
variationSheet.tables.add(`A1:P${variationValues.length + 1}`, true, "VariationsReviewTable");
const variationWidths = [10, 10, 40, 13, 18, 20, 14, 14, 11, 14, 12, 11, 13, 10, 12, 32];
variationWidths.forEach((width, index) => { variationSheet.getRangeByIndexes(0, index, variationValues.length + 1, 1).format.columnWidth = width; });

categorySheet.getRange("A1:E1").values = [["Category", "Slug", "Guessed Product Count", "Approval", "Reviewer Notes"]];
styleHeader(categorySheet.getRange("A1:E1"));
const categoryValues = categories.map((category) => [
  category.name,
  category.slug,
  categoryCounts.get(category.name) || 0,
  "Pending",
  category.name === "T-Shirt Printing" ? "No products are currently matched to this category." : ""
]);
categorySheet.getRange(`A2:E${categoryValues.length + 1}`).values = categoryValues;
styleDataRange(categorySheet.getRange(`A2:E${categoryValues.length + 1}`));
categorySheet.getRange(`D2:D${categoryValues.length + 1}`).dataValidation = { rule: { type: "list", values: ["Pending", "Approved", "Change Required"] } };
categorySheet.getRange(`D2:E${categoryValues.length + 1}`).format.fill = colors.amberLight;
categorySheet.getRange(`C2:C${categoryValues.length + 1}`).format.numberFormat = "#,##0";
categorySheet.freezePanes.freezeRows(1);
categorySheet.tables.add(`A1:E${categoryValues.length + 1}`, true, "CategoryReviewTable");
[24, 24, 20, 18, 48].forEach((width, index) => { categorySheet.getRangeByIndexes(0, index, categoryValues.length + 1, 1).format.columnWidth = width; });

const imageHeaders = [
  "File", "Width", "Height", "Format", "Aspect Ratio", "Shortest Side", "Product Count",
  "Products", "Source Rows", "QA Status", "Recommended Action", "Source Path"
];
imageSheet.getRange("A1:L1").values = [imageHeaders];
styleHeader(imageSheet.getRange("A1:L1"));
const imageValues = imageAudit.map((image) => [
  image.file, image.width, image.height, image.format, image.aspect, image.minSide,
  image.productCount, image.products, image.rows, image.status, image.action, image.sourcePath
]);
imageSheet.getRange(`A2:L${imageValues.length + 1}`).values = imageValues;
styleDataRange(imageSheet.getRange(`A2:L${imageValues.length + 1}`));
imageSheet.getRange(`B2:G${imageValues.length + 1}`).format.numberFormat = "#,##0.000";
imageSheet.getRange(`B2:C${imageValues.length + 1}`).format.numberFormat = "#,##0";
imageSheet.getRange(`F2:G${imageValues.length + 1}`).format.numberFormat = "#,##0";
imageSheet.getRange(`J2:J${imageValues.length + 1}`).conditionalFormats.add("containsText", {
  text: "Ready",
  format: { fill: colors.greenLight, font: { bold: true, color: colors.green } }
});
imageSheet.getRange(`J2:J${imageValues.length + 1}`).conditionalFormats.add("containsText", {
  text: "Acceptable",
  format: { fill: colors.amberLight, font: { bold: true, color: colors.amber } }
});
imageSheet.getRange(`J2:J${imageValues.length + 1}`).conditionalFormats.add("containsText", {
  text: "Low Resolution",
  format: { fill: colors.redLight, font: { bold: true, color: colors.red } }
});
imageSheet.freezePanes.freezeRows(1);
imageSheet.tables.add(`A1:L${imageValues.length + 1}`, true, "ImageAuditTable");
[30, 10, 10, 10, 12, 13, 13, 46, 18, 18, 54, 48].forEach((width, index) => { imageSheet.getRangeByIndexes(0, index, imageValues.length + 1, 1).format.columnWidth = width; });

issueSheet.getRange("A1:J1").values = [[
  "Severity", "Scope", "Product ID", "Product Name", "Source Row", "Field",
  "Issue", "Required Action", "Status", "Reviewer Notes"
]];
styleHeader(issueSheet.getRange("A1:J1"));
issueSheet.getRange(`A2:J${issues.length + 1}`).values = issues;
styleDataRange(issueSheet.getRange(`A2:J${issues.length + 1}`));
issueSheet.getRange(`I2:I${issues.length + 1}`).dataValidation = { rule: { type: "list", values: ["Open", "Resolved", "Accepted Risk"] } };
issueSheet.getRange(`I2:J${issues.length + 1}`).format.fill = colors.amberLight;
issueSheet.getRange(`A2:A${issues.length + 1}`).conditionalFormats.add("containsText", {
  text: "Blocker",
  format: { fill: colors.redLight, font: { bold: true, color: colors.red } }
});
issueSheet.getRange(`A2:A${issues.length + 1}`).conditionalFormats.add("containsText", {
  text: "Review",
  format: { fill: colors.amberLight, font: { bold: true, color: colors.amber } }
});
issueSheet.getRange(`I2:I${issues.length + 1}`).conditionalFormats.add("containsText", {
  text: "Resolved",
  format: { fill: colors.greenLight, font: { bold: true, color: colors.green } }
});
issueSheet.freezePanes.freezeRows(1);
issueSheet.tables.add(`A1:J${issues.length + 1}`, true, "IssueRegisterTable");
[12, 12, 10, 38, 10, 22, 48, 48, 16, 34].forEach((width, index) => { issueSheet.getRangeByIndexes(0, index, issues.length + 1, 1).format.columnWidth = width; });

for (const sheet of [productSheet, variationSheet, categorySheet, imageSheet, issueSheet]) {
  sheet.getUsedRange().format.wrapText = true;
  sheet.getUsedRange().format.autofitRows();
}

await fs.mkdir(previewDir, { recursive: true });
const renderSpecs = [
  ["Read Me", "A1:H18"],
  ["Products", "A1:W24"],
  ["Variations", "A1:P26"],
  ["Categories", "A1:E5"],
  ["Image Audit", "A1:L24"],
  ["Issues", "A1:J26"]
];
for (const [sheetName, range] of renderSpecs) {
  const preview = await workbook.render({ sheetName, range, scale: 1, format: "png" });
  await fs.writeFile(
    path.join(previewDir, `${sheetName.toLowerCase().replace(/\s+/g, "-")}.png`),
    new Uint8Array(await preview.arrayBuffer())
  );
}

const verification = await workbook.inspect({
  kind: "table",
  range: "Read Me!A1:H18",
  include: "values,formulas",
  tableMaxRows: 20,
  tableMaxCols: 8,
  maxChars: 10000
});
console.log(verification.ndjson);

const productFormulaCheck = await workbook.inspect({
  kind: "table",
  range: `Products!V1:V${products.length + 1}`,
  include: "values,formulas",
  tableMaxRows: products.length + 1,
  tableMaxCols: 1,
  maxChars: 20000
});
const variationFormulaCheck = await workbook.inspect({
  kind: "table",
  range: `Variations!E1:O${variationValues.length + 1}`,
  include: "values,formulas",
  tableMaxRows: variationValues.length + 1,
  tableMaxCols: 11,
  maxChars: 60000
});
const formulaCheckText = `${productFormulaCheck.ndjson}\n${variationFormulaCheck.ndjson}`;
const formulaError = formulaCheckText.match(/#REF!|#DIV\/0!|#VALUE!|#NAME\?|#N\/A/);
if (formulaError) throw new Error(`Formula verification failed: ${formulaError[0]}`);
console.log("Formula verification: no spreadsheet errors found.");

await fs.mkdir(outputDir, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
const savedWorkbook = await SpreadsheetFile.importXlsx(await FileBlob.load(outputPath));
const savedSheets = await savedWorkbook.inspect({ kind: "sheet", include: "id,name", maxChars: 4000 });
for (const sheetName of ["Read Me", "Products", "Variations", "Categories", "Image Audit", "Issues"]) {
  if (!savedSheets.ndjson.includes(sheetName)) throw new Error(`Saved workbook is missing sheet: ${sheetName}`);
}
console.log("Saved workbook verification: all six sheets reopened successfully.");
console.log(JSON.stringify({
  output: outputPath,
  products: products.length,
  variations: variationValues.length,
  images: imageValues.length,
  issues: issues.length,
  previews: renderSpecs.length
}, null, 2));
process.exitCode = 0;
