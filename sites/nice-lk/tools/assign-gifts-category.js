const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../..");
const outputDir = path.join(root, "build", "sites", "nice-lk", "gifts-category");
const sourcePrefix = "nice-lk:ccc:product:";
const targetSite = "https://nice.lk";
const apply = process.argv.includes("--apply");

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function relative(file) {
  return path.relative(root, file).replace(/\\/g, "/");
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
    if (!response.ok) {
      throw new Error(`${endpoint} failed with ${response.status}: ${payload?.message || response.statusText}`);
    }
    return payload;
  };
}

async function listAll(apiFetch, endpoint, itemKey) {
  const all = [];
  let page = 1;
  let totalPages = 1;
  do {
    const payload = await apiFetch(`${endpoint}?page=${page}&per_page=100`);
    all.push(...(payload[itemKey] || []));
    totalPages = Number(payload.total_pages || 1);
    page += 1;
  } while (page <= totalPages);
  return all;
}

function categoryIds(product) {
  if (Array.isArray(product.category_ids)) return product.category_ids.map(Number);
  return (product.categories || []).map((category) => Number(category.id)).filter(Boolean);
}

async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

async function main() {
  const site = String(process.env.NEB_SITE_URL || "").replace(/\/$/, "");
  const apiKey = process.env.NEB_API_KEY;
  if (!site || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");
  if (site !== targetSite) throw new Error(`Refusing unexpected target site: ${site}`);

  const apiFetch = createApi(site, apiKey);
  const status = await apiFetch("status");
  if (status.site_url !== targetSite || !status.woocommerce) {
    throw new Error("The target bridge or WooCommerce installation is not ready.");
  }

  const categoriesResponse = await apiFetch("woocommerce/categories");
  const products = await listAll(apiFetch, "woocommerce/products", "products");
  const imported = products.filter((product) => String(product.source_key || "").startsWith(sourcePrefix));
  const existingGifts = (categoriesResponse.categories || []).find((category) => category.slug === "gifts");
  const alreadyAssigned = existingGifts
    ? imported.filter((product) => categoryIds(product).includes(Number(existingGifts.id))).length
    : 0;

  const summary = {
    mode: apply ? "apply" : "dry-run",
    target: site,
    bridge_version: status.bridge_version,
    imported_products: imported.length,
    gifts_category_id: existingGifts ? Number(existingGifts.id) : null,
    already_assigned: alreadyAssigned,
    pending_assignment: imported.length - alreadyAssigned
  };

  if (imported.length !== 88) {
    throw new Error(`Expected 88 imported products, found ${imported.length}. Refusing to continue.`);
  }
  if (!apply) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const snapshotFile = path.join(outputDir, `pre-assignment-${Date.now()}.json`);
  writeJson(snapshotFile, {
    captured_at: new Date().toISOString(),
    status,
    categories: categoriesResponse.categories || [],
    products: imported
  });

  const categoryResult = await apiFetch("woocommerce/categories", {
    method: "POST",
    body: {
      name: "Gifts",
      slug: "gifts",
      description: "Personalized, mini-me and corporate gift products."
    }
  });
  const giftsId = Number(categoryResult.category.id);

  const updates = await pool(imported, 3, async (product) => {
    const originalIds = [...new Set(categoryIds(product))];
    if (originalIds.includes(giftsId)) {
      return { id: Number(product.id), action: "unchanged", original_category_ids: originalIds };
    }
    const result = await apiFetch(`woocommerce/products/${product.id}`, {
      method: "PUT",
      body: { category_ids: [...originalIds, giftsId] }
    });
    return {
      id: Number(product.id),
      action: "updated",
      original_category_ids: originalIds,
      category_ids: categoryIds(result.product)
    };
  });

  const verifiedProducts = await listAll(apiFetch, "woocommerce/products", "products");
  const verifiedImported = verifiedProducts.filter((product) => String(product.source_key || "").startsWith(sourcePrefix));
  const failures = [];
  for (const before of imported) {
    const after = verifiedImported.find((product) => Number(product.id) === Number(before.id));
    const beforeIds = categoryIds(before);
    const afterIds = after ? categoryIds(after) : [];
    if (!after) failures.push({ id: Number(before.id), error: "Product missing after update." });
    if (!afterIds.includes(giftsId)) failures.push({ id: Number(before.id), error: "Gifts category missing." });
    for (const id of beforeIds) {
      if (!afterIds.includes(id)) failures.push({ id: Number(before.id), error: `Original category ${id} was removed.` });
    }
  }

  await apiFetch("clear-cache", { method: "POST", body: {} });
  const reportFile = path.join(outputDir, "assignment-report.json");
  const report = {
    completed_at: new Date().toISOString(),
    pre_assignment_snapshot: relative(snapshotFile),
    ...summary,
    category_action: categoryResult.action,
    gifts_category_id: giftsId,
    gifts_category_url: `${targetSite}/product-category/gifts/`,
    updated: updates.filter((item) => item.action === "updated").length,
    unchanged: updates.filter((item) => item.action === "unchanged").length,
    verified_with_gifts: verifiedImported.filter((product) => categoryIds(product).includes(giftsId)).length,
    verification_failures: failures
  };
  writeJson(reportFile, report);
  console.log(JSON.stringify({
    report: relative(reportFile),
    gifts_category_id: giftsId,
    gifts_category_url: report.gifts_category_url,
    updated: report.updated,
    unchanged: report.unchanged,
    verified_with_gifts: report.verified_with_gifts,
    verification_failures: failures.length
  }, null, 2));
  if (failures.length) throw new Error(`Category assignment verification failed. See ${relative(reportFile)}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
