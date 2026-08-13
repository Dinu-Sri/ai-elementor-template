const fs = require("fs");
const path = require("path");

const baseUrl = process.env.NEB_SITE_URL;
const apiKey = process.env.NEB_API_KEY;

if (!baseUrl || !apiKey) {
  throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");
}
if (!/^https:\/\/homesalon\.ae\/wp-json\/native-elementor\/v1\/?$/i.test(baseUrl)) {
  throw new Error(`Refusing to deploy the Blog page to unexpected bridge URL: ${baseUrl}`);
}

const pageId = 1327;
const root = path.resolve(__dirname, "../../..");
const payloadPath = path.join(
  root,
  "sites/sms-home-salon/content/pages/sms-home-salon-blog-page-2026.payload.json"
);
const outputDir = path.join(root, "build/sites/sms-home-salon/blog-page");
const reportPath = path.join(outputDir, "blog-page-push-report.json");

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
      if (![408, 429, 500, 502, 503, 504, 520, 522, 524].includes(response.status) || attempt === attempts) {
        throw lastError;
      }
    } catch (error) {
      lastError = error;
      if (attempt === attempts) throw lastError;
    }
    await new Promise((resolve) => setTimeout(resolve, 2500 * attempt));
  }
  throw lastError;
}

async function main() {
  const payload = JSON.parse(fs.readFileSync(payloadPath, "utf8"));
  const current = await apiFetch(`pages/${pageId}`);
  if (Number(current.id) !== pageId || current.slug !== "blog" || current.title !== "Blog") {
    throw new Error(`Page ${pageId} no longer matches the expected empty Blog page.`);
  }

  const saved = await apiFetch(`pages/${pageId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
  const exported = await apiFetch(`pages/${pageId}`);
  const cache = await apiFetch("clear-cache", { method: "POST", body: "{}" });

  fs.mkdirSync(outputDir, { recursive: true });
  const exportPath = path.join(outputDir, `blog-page-live-${pageId}.json`);
  fs.writeFileSync(exportPath, `${JSON.stringify(exported, null, 2)}\n`, "utf8");
  const report = {
    generated_at: new Date().toISOString(),
    page_id: pageId,
    title: saved.title,
    slug: saved.slug,
    status: saved.status,
    url: saved.url,
    edit_url: saved.edit_url,
    template: saved.template,
    payload_path: payloadPath,
    export_path: exportPath,
    cache
  };
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ ok: true, report }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
