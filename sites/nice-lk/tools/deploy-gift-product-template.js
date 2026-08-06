const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../..");
const candidateFile = path.join(root, "sites", "nice-lk", "content", "templates", "gift-product.elementor.json");
const outputDir = path.join(root, "build", "sites", "nice-lk", "gift-product-template");
const targetSite = "https://nice.lk";
const expectedBridgeVersion = "0.8.0";
const giftsCategoryId = 197;
const sourceTemplateId = 246;
const giftProductUrl = `${targetSite}/product/lipstick-holder-keychain/`;
const photobookProductUrl = `${targetSite}/product/young-handsome-the-portrait-edition/`;
const apply = process.argv.includes("--apply");

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

async function publicHtml(url) {
  const response = await fetch(url, {
    headers: { "Cache-Control": "no-cache" },
    signal: AbortSignal.timeout(90000)
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}.`);
  return response.text();
}

async function verifyPublic(templateId) {
  let last = null;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const [giftHtml, photobookHtml] = await Promise.all([
      publicHtml(`${giftProductUrl}?neb-check=${Date.now()}`),
      publicHtml(`${photobookProductUrl}?neb-check=${Date.now()}`)
    ]);
    last = {
      gift_uses_template: giftHtml.includes(`elementor-${templateId}`),
      gift_has_marker: giftHtml.includes("GIFTS &amp; PERSONALISATION") || giftHtml.includes("GIFTS & PERSONALISATION"),
      gift_has_photobook_preview: giftHtml.includes("Example Design Preview"),
      photobook_uses_original_template: photobookHtml.includes(`elementor-${sourceTemplateId}`),
      photobook_has_preview: photobookHtml.includes("Example Design Preview")
    };
    if (last.gift_uses_template && last.gift_has_marker && !last.gift_has_photobook_preview && last.photobook_uses_original_template && last.photobook_has_preview) {
      return last;
    }
    if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, attempt * 2500));
  }
  return last;
}

async function main() {
  const site = String(process.env.NEB_SITE_URL || "").replace(/\/$/, "");
  const apiKey = process.env.NEB_API_KEY;
  if (!site || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");
  if (site !== targetSite) throw new Error(`Refusing unexpected target site: ${site}`);

  const apiFetch = createApi(site, apiKey);
  const status = await apiFetch("status");
  if (status.bridge_version !== expectedBridgeVersion || !status.jetwoo_builder) {
    throw new Error(`Native Elementor Bridge ${expectedBridgeVersion} with JetWooBuilder support is required; live bridge is ${status.bridge_version || "unknown"}.`);
  }
  const templatesResponse = await apiFetch("jetwoo/templates?include_data=0");
  const rulesResponse = await apiFetch("jetwoo/single-rules");
  const candidate = readJson(candidateFile);
  const existingRule = (rulesResponse.rules || []).find((rule) => Number(rule.category_id) === giftsCategoryId);
  const existingTemplate = existingRule
    ? (templatesResponse.templates || []).find((template) => Number(template.id) === Number(existingRule.template_id))
    : (templatesResponse.templates || []).find((template) => template.title === candidate.title);
  const summary = {
    mode: apply ? "apply" : "dry-run",
    target: site,
    bridge_version: status.bridge_version,
    source_template_id: sourceTemplateId,
    gifts_category_id: giftsCategoryId,
    existing_template_id: existingTemplate ? Number(existingTemplate.id) : null,
    existing_rule: existingRule || null
  };
  if (!apply) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const snapshotFile = path.join(outputDir, `pre-deploy-${Date.now()}.json`);
  writeJson(snapshotFile, {
    captured_at: new Date().toISOString(),
    status,
    templates: templatesResponse.templates || [],
    rules: rulesResponse.rules || []
  });

  let templateId;
  let templateAction;
  if (existingTemplate) {
    if (Number(existingTemplate.id) === sourceTemplateId) throw new Error("Refusing to overwrite the photobook source template.");
    const updated = await apiFetch(`jetwoo/templates/${existingTemplate.id}`, {
      method: "PUT",
      body: {
        title: candidate.title,
        status: "draft",
        template_type: candidate.template_type,
        page_settings: candidate.page_settings,
        elementor_data: candidate.elementor_data
      }
    });
    templateId = Number(updated.template.id);
    templateAction = "updated";
  } else {
    const created = await apiFetch("jetwoo/templates", {
      method: "POST",
      body: {
        source_id: sourceTemplateId,
        title: candidate.title,
        status: "draft",
        template_type: candidate.template_type,
        elementor_data: candidate.elementor_data
      }
    });
    templateId = Number(created.template.id);
    templateAction = "created";
  }

  const exportedDraft = await apiFetch(`jetwoo/templates/${templateId}`);
  if (JSON.stringify(exportedDraft.elementor_data) !== JSON.stringify(candidate.elementor_data)) {
    throw new Error(`JetWooBuilder export-back mismatch for template ${templateId}.`);
  }
  await apiFetch(`jetwoo/templates/${templateId}`, { method: "PUT", body: { status: "publish" } });

  const preservedRules = (rulesResponse.rules || []).filter((rule) => Number(rule.category_id) !== giftsCategoryId);
  const deployedRules = [...preservedRules, { category_id: giftsCategoryId, template_id: templateId }];
  await apiFetch("jetwoo/single-rules", { method: "PUT", body: { rules: deployedRules } });
  await apiFetch("clear-cache", { method: "POST", body: {} });

  const verification = await verifyPublic(templateId);
  const verified = verification
    && verification.gift_uses_template
    && verification.gift_has_marker
    && !verification.gift_has_photobook_preview
    && verification.photobook_uses_original_template
    && verification.photobook_has_preview;
  if (!verified) {
    await apiFetch("jetwoo/single-rules", { method: "PUT", body: { rules: rulesResponse.rules || [] } });
    await apiFetch("clear-cache", { method: "POST", body: {} });
    throw new Error(`Public verification failed and the previous JetWooBuilder rules were restored: ${JSON.stringify(verification)}`);
  }

  const reportFile = path.join(outputDir, "deployment-report.json");
  const report = {
    completed_at: new Date().toISOString(),
    pre_deploy_snapshot: relative(snapshotFile),
    ...summary,
    template_action: templateAction,
    template_id: templateId,
    rules: deployedRules,
    verification
  };
  writeJson(reportFile, report);
  console.log(JSON.stringify({
    report: relative(reportFile),
    template_action: templateAction,
    template_id: templateId,
    gifts_category_id: giftsCategoryId,
    verification
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
