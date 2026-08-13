const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../..");
const outputDir = path.join(root, "build/sites/sms-home-salon/homepage-icon-repair");
const baseUrl = String(process.env.NEB_SITE_URL || "").replace(/\/$/, "");
const apiKey = process.env.NEB_API_KEY;
const apply = process.argv.includes("--apply");

const expectedSite = "https://homesalon.ae";
const expectedBridge = "0.9.0";
const pageId = 124;
const expectedIconCount = 38;

const iconMap = {
  "tabler:diamond": { value: "far fa-gem", library: "fa-regular" },
  "tabler:user-heart": { value: "fas fa-user", library: "fa-solid" },
  "tabler:sparkles": { value: "fas fa-magic", library: "fa-solid" },
  "tabler:shield-check": { value: "fas fa-shield-alt", library: "fa-solid" },
  "tabler:clock-hour-9": { value: "far fa-clock", library: "fa-regular" },
  "tabler:phone-call": { value: "fas fa-phone-alt", library: "fa-solid" },
  "tabler:calendar-check": { value: "far fa-calendar-check", library: "fa-regular" },
  "tabler:home-heart": { value: "fas fa-home", library: "fa-solid" },
  "tabler:quote": { value: "fas fa-quote-left", library: "fa-solid" },
  "tabler:clock": { value: "far fa-clock", library: "fa-regular" },
  "tabler:map-pin": { value: "fas fa-map-marker-alt", library: "fa-solid" },
};

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function apiFetch(endpoint, options = {}) {
  const response = await fetch(`${baseUrl}/${endpoint.replace(/^\//, "")}`, {
    ...options,
    signal: AbortSignal.timeout(60000),
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!response.ok) {
    throw new Error(`${endpoint} failed with ${response.status}: ${JSON.stringify(data).slice(0, 1500)}`);
  }
  return data;
}

function parseIconify(html) {
  if (!/class=["']iconify["']/i.test(html)) return null;
  const icon = html.match(/data-icon=["']([^"']+)["']/i)?.[1];
  const color = html.match(/color\s*:\s*([^;"']+)/i)?.[1]?.trim();
  const size = Number(html.match(/font-size\s*:\s*(\d+(?:\.\d+)?)px/i)?.[1]);
  const align = html.match(/text-align\s*:\s*(left|center|right)/i)?.[1] || "center";
  if (!icon || !color || !Number.isFinite(size)) {
    throw new Error(`Could not parse Iconify widget: ${html}`);
  }
  return { icon, color, size, align };
}

function transform(elements, report) {
  for (const element of elements || []) {
    if (element.elType === "widget" && element.widgetType === "html") {
      const parsed = parseIconify(String(element.settings?.html || ""));
      if (parsed) {
        const selectedIcon = iconMap[parsed.icon];
        if (!selectedIcon) throw new Error(`No native icon mapping for ${parsed.icon}`);
        element.widgetType = "icon";
        element.settings = {
          selected_icon: selectedIcon,
          view: "default",
          primary_color: parsed.color,
          size: { unit: "px", size: parsed.size, sizes: [] },
          align: parsed.align,
          align_tablet: parsed.align,
          align_mobile: parsed.align,
        };
        report.push({ id: element.id, source: parsed.icon, target: selectedIcon.value, color: parsed.color, size: parsed.size, align: parsed.align });
      }
    }
    transform(element.elements, report);
  }
}

function inspect(elements, state = { iconify: [], native: [] }) {
  for (const element of elements || []) {
    if (element.elType === "widget" && element.widgetType === "html" && /class=["']iconify["']/i.test(String(element.settings?.html || ""))) {
      state.iconify.push(element.id);
    }
    if (element.elType === "widget" && element.widgetType === "icon") {
      state.native.push({ id: element.id, value: element.settings?.selected_icon?.value || "" });
    }
    inspect(element.elements, state);
  }
  return state;
}

function assertTarget(status, page) {
  if (baseUrl !== `${expectedSite}/wp-json/native-elementor/v1`) throw new Error(`Unexpected bridge URL: ${baseUrl}`);
  if (status.site_url !== expectedSite || status.bridge_version !== expectedBridge) throw new Error(`Unexpected bridge target: ${JSON.stringify(status)}`);
  if (Number(page.id) !== pageId || page.url !== `${expectedSite}/`) throw new Error(`Unexpected homepage: ${JSON.stringify({ id: page.id, url: page.url })}`);
}

async function verifyPublic() {
  const response = await fetch(`${expectedSite}/?homepage-icon-qa=${Date.now()}`, {
    signal: AbortSignal.timeout(60000),
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  });
  const html = await response.text();
  if (!response.ok) throw new Error(`Public homepage returned ${response.status}`);
  return {
    iconify_placeholders: (html.match(/class=["']iconify["']/gi) || []).length,
    native_icon_widgets: (html.match(/elementor-widget-icon/g) || []).length,
    fontawesome_icons: (html.match(/fa-(?:gem|user|magic|shield-alt|clock|phone-alt|calendar-check|home|quote-left|map-marker-alt)/g) || []).length,
  };
}

async function main() {
  if (!baseUrl || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");
  const [status, before] = await Promise.all([apiFetch("status"), apiFetch(`pages/${pageId}`)]);
  assertTarget(status, before);
  writeJson(path.join(outputDir, "homepage.before.json"), before);

  const candidate = JSON.parse(JSON.stringify(before.elementor_data));
  const replacements = [];
  transform(candidate, replacements);
  if (replacements.length !== expectedIconCount) throw new Error(`Expected ${expectedIconCount} Iconify replacements, found ${replacements.length}`);
  const candidateState = inspect(candidate);
  if (candidateState.iconify.length !== 0 || candidateState.native.length !== expectedIconCount) {
    throw new Error(`Candidate icon state is invalid: ${JSON.stringify(candidateState)}`);
  }
  writeJson(path.join(outputDir, "homepage.candidate.elementor.json"), candidate);
  writeJson(path.join(outputDir, "replacement-report.json"), replacements);

  if (!apply) {
    console.log(JSON.stringify({ ok: true, dry_run: true, page_id: pageId, replacements: replacements.length, outputDir }, null, 2));
    return;
  }

  await apiFetch(`pages/${pageId}`, { method: "PUT", body: JSON.stringify({ elementor_data: candidate }) });
  const after = await apiFetch(`pages/${pageId}`);
  const afterState = inspect(after.elementor_data);
  if (afterState.iconify.length !== 0 || afterState.native.length !== expectedIconCount) {
    throw new Error(`Saved homepage icon state is invalid: ${JSON.stringify(afterState)}`);
  }
  writeJson(path.join(outputDir, "homepage.after.json"), after);
  const cache = await apiFetch("clear-cache", { method: "POST", body: "{}" });
  const publicState = await verifyPublic();
  if (publicState.iconify_placeholders !== 0 || publicState.native_icon_widgets < expectedIconCount) {
    throw new Error(`Public homepage icon state is invalid: ${JSON.stringify(publicState)}`);
  }
  console.log(JSON.stringify({ ok: true, dry_run: false, page_id: pageId, replacements: replacements.length, saved: afterState, public: publicState, cache, outputDir }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
