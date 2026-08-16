const fs = require("fs");
const path = require("path");

const baseUrl = process.env.NEB_SITE_URL;
const apiKey = process.env.NEB_API_KEY;

if (!baseUrl || !apiKey) {
  throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");
}
if (!/^https:\/\/homesalon\.ae\/wp-json\/native-elementor\/v1\/?$/i.test(baseUrl)) {
  throw new Error(`Refusing to deploy blog templates to unexpected bridge URL: ${baseUrl}`);
}

const root = path.resolve(__dirname, "../../..");
const outputDir = path.join(root, "build/sites/sms-home-salon/theme-templates");
const reportPath = path.join(outputDir, "blog-theme-template-push-report.json");
const definitions = [
  {
    key: "loop",
    path: path.join(root, "sites/sms-home-salon/content/templates/sms-home-salon-blog-loop-2026.payload.json"),
    existingId: 1318
  },
  {
    key: "archive",
    path: path.join(root, "sites/sms-home-salon/content/templates/sms-home-salon-blog-archive-2026.payload.json"),
    existingId: 1316
  },
  {
    key: "single",
    path: path.join(root, "sites/sms-home-salon/content/templates/sms-home-salon-blog-single-2026.payload.json"),
    existingId: 1317
  }
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function decodeTitle(value) {
  return String(value || "")
    .replaceAll("&#8211;", "-")
    .replaceAll("&#038;", "&")
    .replaceAll("&amp;", "&");
}

function walk(elements, callback) {
  for (const element of elements || []) {
    callback(element);
    walk(element.elements, callback);
  }
}

async function apiFetch(endpoint, options = {}) {
  const attempts = Number(process.env.NEB_RETRIES || 4);
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`, {
        ...options,
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
          ...(options.headers || {})
        }
      });
      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { raw: text };
      }
      if (response.ok) return data;
      lastError = new Error(`${endpoint} failed with ${response.status}: ${JSON.stringify(data).slice(0, 1000)}`);
      if (![408, 429, 500, 502, 503, 504, 520, 522, 524].includes(response.status) || attempt === attempts) throw lastError;
    } catch (error) {
      lastError = error;
      if (attempt === attempts) throw lastError;
    }
    await new Promise((resolve) => setTimeout(resolve, 2500 * attempt));
  }
  throw lastError;
}

async function main() {
  ensureDir(outputDir);
  const status = await apiFetch("status");
  const templatesData = await apiFetch("templates?per_page=250");
  const existingTemplates = templatesData.templates || [];
  const results = [];
  let loopId = null;

  for (const definition of definitions) {
    const payload = readJson(definition.path);
    if (definition.key === "archive") {
      if (!loopId) throw new Error("The blog loop template must be saved before the archive template.");
      walk(payload.elementor_data, (element) => {
        if (element.widgetType === "loop-grid") element.settings.template_id = String(loopId);
      });
    }

    const matchedByTitle = existingTemplates.find((template) => decodeTitle(template.title) === payload.title);
    const existingId = definition.existingId || matchedByTitle?.id || null;
    const body = {
      title: payload.title,
      type: payload.type,
      conditions: payload.conditions || [],
      elementor_data: payload.elementor_data || []
    };
    const saved = existingId
      ? await apiFetch(`templates/${existingId}`, { method: "PUT", body: JSON.stringify(body) })
      : await apiFetch("templates", { method: "POST", body: JSON.stringify(body) });
    if (definition.key === "loop") loopId = Number(saved.id);

    const exported = await apiFetch(`templates/${saved.id}`);
    const exportPath = path.join(outputDir, `${definition.key}-live-${saved.id}.json`);
    fs.writeFileSync(exportPath, `${JSON.stringify(exported, null, 2)}\n`, "utf8");
    results.push({
      key: definition.key,
      action: existingId ? "updated" : "created",
      id: Number(saved.id),
      title: saved.title,
      type: payload.type,
      conditions: payload.conditions || [],
      edit_url: saved.edit_url || "",
      payload_path: definition.path,
      export_path: exportPath
    });
    console.log(`${existingId ? "updated" : "created"} ${payload.title} -> ${saved.id}`);
  }

  const themeBuilder = await apiFetch("theme-builder");
  const report = {
    generated_at: new Date().toISOString(),
    bridge_version: status.bridge_version,
    elementor_pro_theme_builder: Boolean(themeBuilder.elementor_pro_theme_builder),
    loop_template_id: loopId,
    count: results.length,
    results
  };
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ ok: true, count: results.length, loopId, reportPath }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
