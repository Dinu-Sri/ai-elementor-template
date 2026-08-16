const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../..");
const outputDir = path.join(root, "build/sites/sms-home-salon/phase2-approved-finish/rank-math-hours");
const baseUrl = String(process.env.NEB_SITE_URL || "").replace(/\/$/, "");
const apiKey = process.env.NEB_API_KEY;
const apply = process.argv.includes("--apply");
const expected = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  .map((day) => ({ day, time: "12:30-23:00" }));

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`${baseUrl}/${endpoint.replace(/^\//, "")}`, {
    ...options,
    signal: AbortSignal.timeout(90000),
    headers: { "X-API-Key": apiKey, "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!response.ok) throw new Error(`${endpoint} failed with ${response.status}: ${JSON.stringify(data).slice(0, 1000)}`);
  return data;
}

function collectOpeningHours(value, output = []) {
  if (!value || typeof value !== "object") return output;
  if (Array.isArray(value.openingHours)) output.push(...value.openingHours.map(String));
  for (const child of Object.values(value)) collectOpeningHours(child, output);
  return output;
}

async function publicSchemaHours() {
  const response = await fetch("https://homesalon.ae/", { redirect: "follow", signal: AbortSignal.timeout(90000) });
  const html = await response.text();
  const hours = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { collectOpeningHours(JSON.parse(match[1]), hours); } catch {}
  }
  return [...new Set(hours)];
}

async function main() {
  if (!baseUrl || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");
  if (baseUrl !== "https://homesalon.ae/wp-json/native-elementor/v1") throw new Error(`Unexpected bridge URL: ${baseUrl}`);
  const status = await apiFetch("status");
  if (status.site_url !== "https://homesalon.ae" || status.bridge_version !== "0.9.0") {
    throw new Error(`Bridge 0.9.0 is required on homesalon.ae: ${JSON.stringify(status)}`);
  }
  if (!status.rank_math_local_business) throw new Error("Rank Math Local Business settings are unavailable.");

  const baseline = await apiFetch("rank-math/local-business");
  writeJson(path.join(outputDir, "baseline.json"), baseline);
  const payload = { dry_run: !apply, opening_hours: expected, opening_hours_format: "on" };
  const result = await apiFetch("rank-math/local-business", { method: "PUT", body: JSON.stringify(payload) });
  const verified = apply ? await apiFetch("rank-math/local-business") : null;
  if (apply && JSON.stringify(verified.opening_hours) !== JSON.stringify(expected)) {
    throw new Error(`Saved opening hours did not verify: ${JSON.stringify(verified)}`);
  }
  const publicHours = apply ? await publicSchemaHours() : [];
  const expectedSchema = "Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday 12:30-23:00";
  if (apply && !publicHours.includes(expectedSchema)) {
    throw new Error(`Public Rank Math schema did not expose the approved hours: ${JSON.stringify(publicHours)}`);
  }
  const report = { ok: true, dry_run: !apply, status, requested: payload, result, verified, public_schema_hours: publicHours };
  writeJson(path.join(outputDir, apply ? "apply-report.json" : "dry-run.json"), report);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
