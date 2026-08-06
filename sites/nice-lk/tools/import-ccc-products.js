const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../..");
const siteRoot = path.join(root, "sites", "nice-lk");
const productFile = path.join(siteRoot, "content", "products", "ccc-products.normalized.json");
const categoryFile = path.join(siteRoot, "content", "products", "ccc-product-categories.json");
const homepageMediaFile = path.join(siteRoot, "content", "products", "homepage-media-uploads.json");
const outputDir = path.join(root, "build", "sites", "nice-lk", "product-import");
const mediaMapFile = path.join(outputDir, "media-map.json");
const progressFile = path.join(outputDir, "import-progress.json");
const reportFile = path.join(outputDir, "import-report.json");
const apply = process.argv.includes("--apply");

const categorySlugs = {
  "Personalized Gifts": "personalized-gifts",
  "Mini Me": "mini-me",
  "T-Shirt Printing": "t-shirt-printing",
  "Corporate Gifts": "corporate-gifts"
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function relative(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

function normalizeAssetPath(file) {
  return String(file || "").replace(/\\/g, "/");
}

function sourceProductKey(product) {
  return `nice-lk:ccc:product:${product.source_product_index}`;
}

function sourceVariationKey(variation) {
  return `nice-lk:ccc:row:${variation.source_row}`;
}

function effectiveProductType(product) {
  return product.variations.length > 1 ? "variable" : "simple";
}

function stockFields(quantity) {
  if (quantity === null || quantity === undefined || quantity === "") {
    return { manage_stock: false };
  }
  const stock = Number(quantity);
  return {
    manage_stock: true,
    stock_quantity: stock,
    stock_status: stock > 0 ? "instock" : "outofstock"
  };
}

function variationOptions(product) {
  const counts = new Map();
  for (const variation of product.variations) {
    const label = String(variation.name || "Default").trim() || "Default";
    const key = label.toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const used = new Set();
  return product.variations.map((variation) => {
    const label = String(variation.name || "Default").trim() || "Default";
    let option = counts.get(label.toLowerCase()) > 1 ? `${label} - ${variation.sku}` : label;
    let suffix = 2;
    while (used.has(option.toLowerCase())) {
      option = `${label} - ${variation.sku} ${suffix++}`;
    }
    used.add(option.toLowerCase());
    return option;
  });
}

function mediaMetadata(products) {
  const metadata = new Map();
  for (const product of products) {
    for (const file of product.images || []) {
      const key = normalizeAssetPath(file);
      if (!metadata.has(key)) metadata.set(key, { title: product.name, alt: product.name });
    }
    for (const variation of product.variations || []) {
      for (const file of variation.images || []) {
        const key = normalizeAssetPath(file);
        if (!metadata.has(key)) {
          const option = String(variation.name || "").trim();
          const alt = option && option.toLowerCase() !== "default"
            ? `${product.name} - ${option}`
            : product.name;
          metadata.set(key, { title: product.name, alt });
        }
      }
    }
  }
  return metadata;
}

function validateSource(products, categories) {
  const errors = [];
  const warnings = [];
  const sourceKeys = new Set();
  const skus = new Set();
  const slugs = new Set();
  let sourceRowCount = 0;

  for (const category of categories) {
    if (!category.name || !category.slug) errors.push("Every category requires a name and slug.");
  }
  for (const expected of Object.entries(categorySlugs)) {
    if (!categories.some((category) => category.name === expected[0] && category.slug === expected[1])) {
      errors.push(`Missing required category ${expected[0]} (${expected[1]}).`);
    }
  }

  for (const product of products) {
    const productKey = sourceProductKey(product);
    if (sourceKeys.has(productKey)) errors.push(`Duplicate source key: ${productKey}`);
    sourceKeys.add(productKey);
    if (!product.name || !product.slug) errors.push(`Product ${product.source_product_index} needs a name and slug.`);
    if (slugs.has(product.slug)) errors.push(`Duplicate product slug: ${product.slug}`);
    slugs.add(product.slug);
    if (!categorySlugs[product.category_guess]) {
      errors.push(`Product ${product.source_product_index} has an unsupported category: ${product.category_guess}`);
    }
    if (!Array.isArray(product.variations) || product.variations.length === 0) {
      errors.push(`Product ${product.source_product_index} has no source rows.`);
      continue;
    }
    if (!["simple", "variable"].includes(product.type)) {
      errors.push(`Product ${product.source_product_index} has unsupported type ${product.type}.`);
    }

    if (!(product.images || []).length) warnings.push(`Product ${product.source_product_index} has no image.`);
    for (const variation of product.variations) {
      sourceRowCount += 1;
      const variationKey = sourceVariationKey(variation);
      if (sourceKeys.has(variationKey)) errors.push(`Duplicate source key: ${variationKey}`);
      sourceKeys.add(variationKey);
      if (!variation.sku) errors.push(`Source row ${variation.source_row} has no SKU.`);
      if (skus.has(variation.sku)) errors.push(`Duplicate SKU: ${variation.sku}`);
      skus.add(variation.sku);
      if (variation.stock_quantity === null || variation.stock_quantity === "") {
        warnings.push(`Source row ${variation.source_row} has no stock quantity.`);
      }
      if (!(variation.images || []).length) warnings.push(`Source row ${variation.source_row} has no image.`);
    }
  }

  return { errors, warnings, sourceRowCount };
}

function productPayload(product, mediaMap) {
  const images = (product.images || []).map((file) => mediaMap[normalizeAssetPath(file)]).filter(Boolean);
  const productType = effectiveProductType(product);
  const payload = {
    source_key: sourceProductKey(product),
    name: product.name,
    slug: product.slug,
    type: productType,
    status: "draft",
    categories: [categorySlugs[product.category_guess]],
    images,
    menu_order: Number(product.source_product_index)
  };

  if (productType === "simple") {
    const variation = product.variations[0];
    return {
      ...payload,
      sku: variation.sku,
      regular_price: "",
      ...stockFields(variation.stock_quantity)
    };
  }

  const options = variationOptions(product);
  payload.attributes = [{
    name: "Option",
    options,
    visible: true,
    variation: true
  }];
  payload.variations = product.variations.map((variation, index) => {
    const imageId = (variation.images || [])
      .map((file) => mediaMap[normalizeAssetPath(file)])
      .find(Boolean) || images[0] || 0;
    return {
      source_key: sourceVariationKey(variation),
      sku: variation.sku,
      status: "publish",
      regular_price: "",
      ...stockFields(variation.stock_quantity),
      attributes: { Option: options[index] },
      image_id: imageId
    };
  });
  return payload;
}

async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next++;
      try {
        results[index] = await worker(items[index], index);
      } catch (error) {
        results[index] = { ok: false, error: error.message };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

function createApi(baseUrl, apiKey) {
  const api = `${baseUrl.replace(/\/$/, "")}/wp-json/native-elementor/v1/`;
  return async function apiFetch(endpoint, options = {}) {
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
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
          throw new Error(`${endpoint} returned non-JSON (${response.status}): ${text.slice(0, 200)}`);
        }
        if (!response.ok) {
          const error = new Error(`${endpoint} failed with ${response.status}: ${payload?.message || response.statusText}`);
          error.retryable = response.status >= 500 || response.status === 429;
          throw error;
        }
        return payload;
      } catch (error) {
        lastError = error;
        if (attempt === 3 || error.retryable === false || /failed with 4\d\d/.test(error.message)) throw error;
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      }
    }
    throw lastError;
  };
}

async function listAll(apiFetch, endpoint, itemKey, extra = "") {
  const all = [];
  let page = 1;
  let totalPages = 1;
  do {
    const separator = endpoint.includes("?") ? "&" : "?";
    const payload = await apiFetch(`${endpoint}${separator}page=${page}&per_page=100${extra}`);
    all.push(...(payload[itemKey] || []));
    totalPages = Number(payload.total_pages || 1);
    page += 1;
  } while (page <= totalPages);
  return all;
}

function seedMediaMap() {
  const mediaMap = fs.existsSync(mediaMapFile) ? readJson(mediaMapFile) : {};
  if (fs.existsSync(homepageMediaFile)) {
    for (const upload of readJson(homepageMediaFile).uploads || []) {
      if (upload.source_file && upload.attachment_id) {
        mediaMap[normalizeAssetPath(upload.source_file)] = Number(upload.attachment_id);
      }
    }
  }
  return mediaMap;
}

async function main() {
  const products = readJson(productFile);
  const categories = readJson(categoryFile);
  const sourceValidation = validateSource(products, categories);
  const metadata = mediaMetadata(products);
  const imageFiles = [...metadata.keys()];
  const missingFiles = imageFiles.filter((file) => !fs.existsSync(path.join(root, file)));
  if (missingFiles.length) sourceValidation.errors.push(...missingFiles.map((file) => `Missing image file: ${file}`));

  const summary = {
    mode: apply ? "apply" : "dry-run",
    products: products.length,
    simple_products: products.filter((product) => effectiveProductType(product) === "simple").length,
    variable_products: products.filter((product) => effectiveProductType(product) === "variable").length,
    inferred_variable_products: products
      .filter((product) => product.type === "simple" && effectiveProductType(product) === "variable")
      .map((product) => product.source_product_index),
    source_rows: sourceValidation.sourceRowCount,
    woocommerce_variations: products
      .filter((product) => effectiveProductType(product) === "variable")
      .reduce((sum, product) => sum + product.variations.length, 0),
    unique_images: imageFiles.length,
    categories: categories.length,
    warnings: sourceValidation.warnings,
    errors: sourceValidation.errors
  };
  if (!apply) {
    console.log(JSON.stringify(summary, null, 2));
    if (summary.errors.length) process.exitCode = 1;
    return;
  }
  if (summary.errors.length) throw new Error(`Source validation failed:\n${summary.errors.join("\n")}`);

  const site = process.env.NEB_SITE_URL;
  const apiKey = process.env.NEB_API_KEY;
  if (!site || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required with --apply.");
  if (site.replace(/\/$/, "") !== "https://nice.lk") throw new Error(`Refusing unexpected target site: ${site}`);
  const apiFetch = createApi(site, apiKey);
  const status = await apiFetch("status");
  if (status.site_url !== "https://nice.lk" || status.bridge_version !== "0.7.0" || !status.woocommerce) {
    throw new Error(`Unexpected live bridge status: ${JSON.stringify(status)}`);
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const snapshot = {
    captured_at: new Date().toISOString(),
    status,
    categories: await apiFetch("woocommerce/categories"),
    products: await listAll(apiFetch, "woocommerce/products", "products")
  };
  const snapshotFile = path.join(outputDir, `pre-import-snapshot-${Date.now()}.json`);
  writeJson(snapshotFile, snapshot);
  console.log(`Saved pre-import snapshot: ${relative(snapshotFile)}`);

  const mediaMap = seedMediaMap();
  const pendingImages = imageFiles.filter((file) => !mediaMap[file]);
  let uploaded = 0;
  const mediaResults = await pool(pendingImages, 3, async (file) => {
    const absolute = path.join(root, file);
    const meta = metadata.get(file);
    const result = await apiFetch("media/upload", {
      method: "POST",
      timeout: 120000,
      body: {
        data: fs.readFileSync(absolute).toString("base64"),
        filename: path.basename(absolute),
        title: meta.title,
        alt: meta.alt,
        set_featured: false
      }
    });
    mediaMap[file] = Number(result.attachment_id);
    writeJson(mediaMapFile, mediaMap);
    uploaded += 1;
    console.log(`Uploaded media ${uploaded}/${pendingImages.length}: ${path.basename(file)} -> ${result.attachment_id}`);
    return { ok: true, file, attachment_id: Number(result.attachment_id) };
  });
  const mediaFailures = mediaResults.filter((result) => result && !result.ok);
  if (mediaFailures.length) {
    writeJson(progressFile, { ...summary, phase: "media", media_failures: mediaFailures, media_map: mediaMap });
    throw new Error(`${mediaFailures.length} media uploads failed. See ${relative(progressFile)}.`);
  }

  const categoryResults = [];
  for (const category of categories) {
    const firstProduct = products.find((product) => product.category_guess === category.name && (product.images || []).length);
    const thumbnailId = firstProduct ? mediaMap[normalizeAssetPath(firstProduct.images[0])] : 0;
    const result = await apiFetch("woocommerce/categories", {
      method: "POST",
      body: {
        ...category,
        description: `${category.name} products staged from the CCC catalog.`,
        ...(thumbnailId ? { thumbnail_id: thumbnailId } : {})
      }
    });
    categoryResults.push({ action: result.action, ...result.category });
    console.log(`${result.action} category: ${result.category.name} (${result.category.id})`);
  }

  const productResults = [];
  const productFailures = [];
  let completed = 0;
  await pool(products, 2, async (product) => {
    try {
      const payload = productPayload(product, mediaMap);
      const result = await apiFetch("woocommerce/products", { method: "POST", body: payload, timeout: 120000 });
      const record = {
        ok: true,
        action: result.action,
        source_product_index: product.source_product_index,
        id: result.product.id,
        source_key: result.product.source_key,
        name: result.product.name,
        status: result.product.status,
        type: result.product.type,
        image_id: result.product.image_id,
        variation_count: (result.product.variations || []).length,
        variation_actions: (result.variation_results || []).map((item) => item.action)
      };
      productResults.push(record);
      completed += 1;
      console.log(`${result.action} product ${completed}/${products.length}: ${product.name} (${result.product.id})`);
      writeJson(progressFile, { started_at: snapshot.captured_at, media_map: mediaMap, categories: categoryResults, products: productResults, failures: productFailures });
      return record;
    } catch (error) {
      const failure = { ok: false, source_product_index: product.source_product_index, name: product.name, error: error.message };
      productFailures.push(failure);
      writeJson(progressFile, { started_at: snapshot.captured_at, media_map: mediaMap, categories: categoryResults, products: productResults, failures: productFailures });
      return failure;
    }
  });

  const imported = await listAll(apiFetch, "woocommerce/products?status=draft", "products", "&include_variations=1");
  const staged = imported.filter((product) => String(product.source_key || "").startsWith("nice-lk:ccc:product:"));
  const verificationFailures = [];
  for (const source of products) {
    const live = staged.find((product) => product.source_key === sourceProductKey(source));
    if (!live) {
      verificationFailures.push({ source_product_index: source.source_product_index, error: "Draft product not found after import." });
      continue;
    }
    if (live.status !== "draft") verificationFailures.push({ id: live.id, error: `Unexpected status ${live.status}.` });
    const expectedType = effectiveProductType(source);
    const expected = productPayload(source, mediaMap);
    if (live.type !== expectedType) verificationFailures.push({ id: live.id, error: `Unexpected type ${live.type}.` });
    if (!(live.categories || []).some((category) => category.slug === expected.categories[0])) {
      verificationFailures.push({ id: live.id, error: `Missing category ${expected.categories[0]}.` });
    }
    if (Number(live.image_id || 0) !== Number(expected.images[0] || 0)) {
      verificationFailures.push({ id: live.id, error: `Featured image mismatch: expected ${expected.images[0] || 0}, found ${live.image_id || 0}.` });
    }
    const expectedGallery = expected.images.slice(1).map(Number);
    const liveGallery = (live.gallery_image_ids || []).map(Number);
    if (JSON.stringify(liveGallery) !== JSON.stringify(expectedGallery)) {
      verificationFailures.push({ id: live.id, error: "Gallery image IDs do not match the source mapping." });
    }
    if (expectedType === "simple") {
      if (live.sku !== expected.sku) verificationFailures.push({ id: live.id, error: `SKU mismatch: expected ${expected.sku}, found ${live.sku}.` });
      if (expected.manage_stock && Number(live.stock_quantity) !== Number(expected.stock_quantity)) {
        verificationFailures.push({ id: live.id, error: `Stock mismatch: expected ${expected.stock_quantity}, found ${live.stock_quantity}.` });
      }
    }
    if (expectedType === "variable" && (live.variations || []).length !== source.variations.length) {
      verificationFailures.push({ id: live.id, error: `Expected ${source.variations.length} variations, found ${(live.variations || []).length}.` });
    }
    if (expectedType === "variable") {
      for (const expectedVariation of expected.variations) {
        const liveVariation = (live.variations || []).find((variation) => variation.source_key === expectedVariation.source_key);
        if (!liveVariation) {
          verificationFailures.push({ id: live.id, error: `Missing variation ${expectedVariation.source_key}.` });
          continue;
        }
        if (liveVariation.sku !== expectedVariation.sku) {
          verificationFailures.push({ id: live.id, variation_id: liveVariation.id, error: `Variation SKU mismatch for ${expectedVariation.source_key}.` });
        }
        if (Number(liveVariation.image_id || 0) !== Number(expectedVariation.image_id || 0)) {
          verificationFailures.push({ id: live.id, variation_id: liveVariation.id, error: `Variation image mismatch for ${expectedVariation.source_key}.` });
        }
        if (expectedVariation.manage_stock && Number(liveVariation.stock_quantity) !== Number(expectedVariation.stock_quantity)) {
          verificationFailures.push({ id: live.id, variation_id: liveVariation.id, error: `Variation stock mismatch for ${expectedVariation.source_key}.` });
        }
        const expectedOption = expectedVariation.attributes.Option;
        if (liveVariation.attributes?.option !== expectedOption) {
          verificationFailures.push({ id: live.id, variation_id: liveVariation.id, error: `Variation option mismatch for ${expectedVariation.source_key}.` });
        }
      }
    }
  }

  await apiFetch("clear-cache", { method: "POST", body: {} });
  const report = {
    completed_at: new Date().toISOString(),
    target: site,
    bridge_version: status.bridge_version,
    woocommerce_version: status.woocommerce_version,
    pre_import_snapshot: relative(snapshotFile),
    source_summary: summary,
    uploaded_media: mediaResults.filter((result) => result?.ok).length,
    reused_media: imageFiles.length - pendingImages.length,
    media_count: Object.keys(mediaMap).length,
    categories: categoryResults,
    products: productResults.sort((a, b) => a.source_product_index - b.source_product_index),
    product_failures: productFailures,
    verification: {
      expected_products: products.length,
      found_products: staged.length,
      expected_variations: summary.woocommerce_variations,
      found_variations: staged.reduce((sum, product) => sum + (product.variations || []).length, 0),
      failures: verificationFailures
    }
  };
  writeJson(reportFile, report);
  console.log(JSON.stringify({
    report: relative(reportFile),
    uploaded_media: report.uploaded_media,
    reused_media: report.reused_media,
    categories: report.categories.length,
    products: report.products.length,
    product_failures: report.product_failures.length,
    verification_failures: report.verification.failures.length
  }, null, 2));

  if (productFailures.length || verificationFailures.length || staged.length !== products.length) {
    throw new Error(`Import completed with failures. See ${relative(reportFile)}.`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
