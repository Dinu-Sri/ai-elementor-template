#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const expectedVersion = process.argv[2] || "0.8.0";
const phpPath = path.join(root, "plugin", "native-elementor-bridge", "native-elementor-bridge.php");
const packageScriptPath = path.join(root, "tools", "package-plugin.ps1");
const packageJsonPath = path.join(root, "package.json");
const smokeTestPath = path.join(root, "tools", "smoke-test-plugin.php");
const php = fs.readFileSync(phpPath, "utf8");
const packageScript = fs.readFileSync(packageScriptPath, "utf8");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const errors = [];

const phpCandidates = process.platform === "win32"
  ? [process.env.PHP_BINARY, "C:\\xampp\\php\\php.exe", "php"]
  : [process.env.PHP_BINARY, "php"];
let phpLint = null;
for (const candidate of phpCandidates.filter(Boolean)) {
  if (path.isAbsolute(candidate) && !fs.existsSync(candidate)) continue;
  const result = spawnSync(candidate, ["-l", phpPath], { encoding: "utf8" });
  if (result.error && result.error.code === "ENOENT") continue;
  phpLint = {
    binary: candidate,
    status: result.status,
    output: `${result.stdout || ""}${result.stderr || ""}`.trim()
  };
  if (result.error || result.status !== 0) {
    errors.push(`PHP syntax validation failed: ${phpLint.output || result.error.message}`);
  }
  break;
}
if (!phpLint) {
  errors.push("PHP CLI is required for release syntax validation but was not found.");
}

let phpSmoke = null;
if (phpLint && phpLint.status === 0) {
  const result = spawnSync(phpLint.binary, [smokeTestPath], { encoding: "utf8" });
  phpSmoke = {
    status: result.status,
    output: `${result.stdout || ""}${result.stderr || ""}`.trim()
  };
  if (result.error || result.status !== 0) {
    errors.push(`PHP bridge smoke test failed: ${phpSmoke.output || result.error.message}`);
  }
}

function capture(pattern, source, label) {
  const match = source.match(pattern);
  if (!match) {
    errors.push(`Missing ${label}.`);
    return "";
  }
  return match[1];
}

const versions = {
  plugin_header: capture(/\* Version:\s*([0-9.]+)/, php, "plugin header version"),
  constant: capture(/define\('NEB_VERSION',\s*'([0-9.]+)'\);/, php, "NEB_VERSION"),
  package_json: packageJson.version,
  package_script: capture(/\[string\]\$Version\s*=\s*"([0-9.]+)"/, packageScript, "package script version")
};

for (const [label, version] of Object.entries(versions)) {
  if (version !== expectedVersion) errors.push(`${label} is ${version || "missing"}; expected ${expectedVersion}.`);
}

const requiredRoutes = [
  "/woocommerce/categories",
  "/woocommerce/products",
  "/woocommerce/products/(?P<id>\\d+)",
  "/jetwoo/templates",
  "/jetwoo/templates/(?P<id>\\d+)",
  "/jetwoo/single-rules"
];
const requiredRankMathRoutes = [
  "/rank-math/redirections",
  "/rank-math/local-business"
];
for (const route of requiredRoutes) {
  if (!php.includes(`'${route}'`)) errors.push(`Missing route ${route}.`);
}
for (const route of requiredRankMathRoutes) {
  if (!php.includes(`'${route}'`)) errors.push(`Missing route ${route}.`);
}

const callbackNames = [...php.matchAll(/'callback'\s*=>\s*\[\$this,\s*'([^']+)'\]/g)].map((match) => match[1]);
const methodNames = new Set([...php.matchAll(/(?:public|private|protected)\s+function\s+([a-zA-Z0-9_]+)\s*\(/g)].map((match) => match[1]));
for (const callback of callbackNames) {
  if (!methodNames.has(callback)) errors.push(`Route callback ${callback} has no class method.`);
}

for (const requiredMethod of [
  "list_woo_categories",
  "upsert_woo_category",
  "list_woo_products",
  "upsert_woo_product",
  "get_woo_product",
  "update_woo_product",
  "upsert_woo_variations",
  "list_jetwoo_templates",
  "create_jetwoo_template",
  "get_jetwoo_template",
  "update_jetwoo_template",
  "get_jetwoo_single_rules",
  "update_jetwoo_single_rules",
  "resolve_jetwoo_single_template"
]) {
  if (!methodNames.has(requiredMethod)) errors.push(`Missing WooCommerce method ${requiredMethod}.`);
}

for (const requiredMethod of [
  "rank_math_redirections_available",
  "list_rank_math_redirections",
  "prepare_rank_math_redirect_plan",
  "upsert_rank_math_redirections"
]) {
  if (!methodNames.has(requiredMethod)) errors.push(`Missing Rank Math method ${requiredMethod}.`);
}

for (const requiredMethod of [
  "rank_math_local_business_available",
  "sanitize_rank_math_opening_hours",
  "get_rank_math_local_business",
  "update_rank_math_local_business"
]) {
  if (!methodNames.has(requiredMethod)) errors.push(`Missing Rank Math Local Business method ${requiredMethod}.`);
}

function executableBraces(source) {
  let state = "normal";
  let output = "";
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (state === "normal") {
      if (char === "'" || char === '"') {
        state = char === "'" ? "single" : "double";
      } else if (char === "/" && next === "/") {
        state = "line";
        index += 1;
      } else if (char === "#") {
        state = "line";
      } else if (char === "/" && next === "*") {
        state = "block";
        index += 1;
      } else {
        output += char;
      }
    } else if (state === "single" || state === "double") {
      if (char === "\\") {
        index += 1;
      } else if ((state === "single" && char === "'") || (state === "double" && char === '"')) {
        state = "normal";
      }
    } else if (state === "line" && (char === "\n" || char === "\r")) {
      state = "normal";
    } else if (state === "block" && char === "*" && next === "/") {
      state = "normal";
      index += 1;
    }
  }
  return output;
}

let braceDepth = 0;
for (const char of executableBraces(php)) {
  if (char === "{") braceDepth += 1;
  if (char === "}") braceDepth -= 1;
  if (braceDepth < 0) errors.push("PHP closes a block before it is opened.");
}
if (braceDepth !== 0) errors.push(`PHP brace balance is ${braceDepth}; expected 0.`);

for (const requiredToken of [
  "_neb_source_key",
  "new WC_Product_Simple()",
  "new WC_Product_Variable()",
  "new WC_Product_Variation()",
  "woocommerce_version"
]) {
  if (!php.includes(requiredToken)) errors.push(`Missing release contract token: ${requiredToken}.`);
}

if (/(?:^|[^'"])\\\\RankMath\\\\(?:Helper|Redirections\\\\(?:DB|Redirection))::/m.test(php)) {
  errors.push("PHP contains doubled separators in a static Rank Math class reference.");
}

for (const requiredToken of [
  "\\RankMath\\Helper::is_module_active('redirections')",
  "do_action('rank_math/redirection/saved', $redirection, $data);",
  "update_option('rank-math-options-titles', $options, false)",
  "\\RankMath\\Helper::clear_cache('native-elementor-bridge/local-business')"
]) {
  if (!php.includes(requiredToken)) errors.push(`Missing Rank Math safety contract: ${requiredToken}.`);
}

if (errors.length) {
  throw new Error(`Bridge release validation failed:\n- ${errors.join("\n- ")}`);
}

console.log(JSON.stringify({
  ok: true,
  expected_version: expectedVersion,
  versions,
  php_lint: phpLint,
  php_smoke: phpSmoke,
  route_callback_count: callbackNames.length,
  method_count: methodNames.size,
  woo_routes: requiredRoutes,
  rank_math_routes: requiredRankMathRoutes
}, null, 2));
