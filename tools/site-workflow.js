#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { compilePage } = require("../src/compiler/native-elementor-compiler");
const { validateTemplate } = require("../src/validator/elementor-native-lint");

const root = path.resolve(__dirname, "..");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value.startsWith("--")) {
      const key = value.slice(2);
      args[key] = argv[i + 1];
      i += 1;
    } else {
      args._.push(value);
    }
  }
  return args;
}

function siteSlug(manifest) {
  return manifest.slug || manifest.site || "site";
}

function outputPath(manifest, item) {
  return path.join(root, "build", "sites", siteSlug(manifest), `${item.key}.elementor.json`);
}

function reportPath(manifest) {
  return path.join(root, "build", "sites", siteSlug(manifest), "deployment-report.json");
}

function smokeReportPath(manifest) {
  return path.join(root, "build", "sites", siteSlug(manifest), "smoke-report.json");
}

function intakePath(manifest) {
  return path.join(root, "build", "site-intake", siteSlug(manifest), "site-snapshot.json");
}

function exportPath(manifest, item) {
  return path.join(root, "build", "sites", siteSlug(manifest), "exports", `${item.key}.export.json`);
}

function publicUrl(baseUrl, urlPath) {
  if (/^https?:\/\//.test(urlPath)) return urlPath;
  return `${baseUrl.replace(/\/$/, "")}/${urlPath.replace(/^\//, "")}`;
}

function tokenMap(manifest, baseUrl) {
  const map = {};
  for (const page of manifest.pages || []) {
    map[`page:${page.key}`] = page.path || `/${page.slug || page.key}/`;
    map[`page-url:${page.key}`] = publicUrl(baseUrl || manifest.site_url || "", page.path || `/${page.slug || page.key}/`);
  }
  for (const template of manifest.templates || []) {
    map[`template:${template.key}`] = template.existingId ? String(template.existingId) : "";
  }
  for (const menu of manifest.menus || []) {
    map[`menu:${menu.key}`] = menu.slug || menu.key;
  }
  return map;
}

function replaceTokens(value, map) {
  if (typeof value === "string") {
    return value.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const trimmed = key.trim();
      return Object.prototype.hasOwnProperty.call(map, trimmed) ? map[trimmed] : match;
    });
  }
  if (Array.isArray(value)) {
    return value.map((item) => replaceTokens(item, map));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, replaceTokens(child, map)]));
  }
  return value;
}

function allItems(manifest) {
  return [
    ...(manifest.pages || []).map((item) => ({ ...item, kind: "page" })),
    ...(manifest.templates || []).map((item) => ({ ...item, kind: "template" }))
  ];
}

function validateManifest(manifest) {
  const errors = [];
  const keys = new Set();

  if (!manifest.site) errors.push("Missing site name.");
  if (!Array.isArray(manifest.pages)) errors.push("Missing pages array.");
  if (!Array.isArray(manifest.templates)) errors.push("Missing templates array.");

  for (const item of allItems(manifest)) {
    if (!item.key) {
      errors.push(`${item.kind} is missing key.`);
      continue;
    }
    if (keys.has(item.key)) {
      errors.push(`Duplicate key: ${item.key}.`);
    }
    keys.add(item.key);

    if (!item.blueprint && !item.nativePayload) {
      errors.push(`${item.key} needs blueprint or nativePayload.`);
    } else {
      const sourcePath = path.resolve(root, item.nativePayload || item.blueprint);
      if (!fs.existsSync(sourcePath)) {
        const sourceType = item.nativePayload ? "native payload" : "blueprint";
        errors.push(`${item.key} ${sourceType} not found: ${item.nativePayload || item.blueprint}.`);
      }
    }
    if (item.lintMode && !["strict", "approved-baseline"].includes(item.lintMode)) {
      errors.push(`${item.key} has unsupported lintMode: ${item.lintMode}.`);
    }

    if (item.kind === "page" && !item.path && !item.slug) {
      errors.push(`${item.key} page needs path or slug for link resolution.`);
    }
    if (item.kind === "template" && !item.type) {
      errors.push(`${item.key} template needs type.`);
    }
  }

  for (const menu of manifest.menus || []) {
    if (!menu.key) {
      errors.push("Menu is missing key.");
      continue;
    }
    if (!menu.slug) {
      errors.push(`${menu.key} menu needs slug.`);
    }
    if (!Array.isArray(menu.items) || menu.items.length === 0) {
      errors.push(`${menu.key} menu needs items.`);
    }
  }

  if (errors.length) {
    throw new Error(`Invalid site manifest:\n- ${errors.join("\n- ")}`);
  }
}

function assertNoUnresolvedTokens(item, compiled) {
  const json = JSON.stringify(compiled);
  const unresolved = json.match(/\{\{[^}]+\}\}/g);
  if (unresolved) {
    throw new Error(`${item.key} contains unresolved tokens: ${Array.from(new Set(unresolved)).join(", ")}`);
  }
}

function compileManifest(manifest, options = {}) {
  validateManifest(manifest);
  const map = tokenMap(manifest, options.baseUrl);
  const results = [];
  for (const item of allItems(manifest)) {
    let compiled;
    if (item.nativePayload) {
      const payloadPath = path.resolve(root, item.nativePayload);
      compiled = replaceTokens(readJson(payloadPath), map);
    } else {
      const blueprintPath = path.resolve(root, item.blueprint);
      const blueprint = replaceTokens(readJson(blueprintPath), map);
      compiled = compilePage(blueprint);
    }
    if (item.title) compiled.title = item.title;
    if (item.slug) compiled.slug = item.slug;
    if (item.status) compiled.status = item.status;
    if (item.type) compiled.type = item.type;
    assertNoUnresolvedTokens(item, compiled);
    const out = outputPath(manifest, item);
    writeJson(out, compiled);
    results.push({ key: item.key, kind: item.kind, output: path.relative(root, out), title: compiled.title });
  }
  return results;
}

function applyLintPolicy(item, report) {
  const lintMode = item.lintMode || "strict";
  const blockingIssues = report.issues.filter((issue) => issue.severity === "error");
  return {
    ok: lintMode === "approved-baseline" ? blockingIssues.length === 0 : report.ok,
    strict_ok: report.ok,
    lint_mode: lintMode,
    blocking_issue_count: blockingIssues.length
  };
}

function lintManifest(manifest) {
  const results = [];
  for (const item of allItems(manifest)) {
    const file = outputPath(manifest, item);
    const report = validateTemplate(readJson(file));
    const policy = applyLintPolicy(item, report);
    results.push({ key: item.key, kind: item.kind, ...policy, score: report.score, issues: report.issues });
  }
  return results;
}

async function apiFetch(baseUrl, apiKey, endpoint, options = {}) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/wp-json/native-elementor/v1/${endpoint}`, {
    method: options.method || "GET",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json"
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    data = { raw: text };
  }

  if (!response.ok) {
    const message = data && data.message ? data.message : response.statusText;
    throw new Error(`${endpoint} failed with ${response.status}: ${message}`);
  }

  return data;
}

async function deployManifest(manifest, options) {
  if (!options.baseUrl || !options.apiKey) {
    throw new Error("Deploy requires --base-url and --api-key or NEB_SITE_URL and NEB_API_KEY.");
  }

  const lint = lintManifest(manifest);
  const failed = lint.filter((item) => !item.ok);
  if (failed.length) {
    throw new Error(`Native lint failed for: ${failed.map((item) => item.key).join(", ")}`);
  }

  const report = {
    site: manifest.site,
    generated_at: new Date().toISOString(),
    menus: [],
    pages: [],
    templates: [],
    exports: []
  };

  const map = tokenMap(manifest, options.baseUrl);
  for (const menu of manifest.menus || []) {
    const menuBody = replaceTokens(menu, map);
    const result = await apiFetch(options.baseUrl, options.apiKey, "menus", { method: "POST", body: menuBody });
    report.menus.push({
      key: menu.key,
      id: result.menu.id,
      name: result.menu.name,
      slug: result.menu.slug,
      item_count: result.menu.items.length
    });
  }

  for (const page of manifest.pages || []) {
    const body = readJson(outputPath(manifest, { ...page, kind: "page" }));
    const endpoint = page.existingId ? `pages/${page.existingId}` : "pages";
    const method = page.existingId ? "PUT" : "POST";
    const result = await apiFetch(options.baseUrl, options.apiKey, endpoint, { method, body });
    report.pages.push({
      key: page.key,
      id: result.id,
      title: result.title,
      url: result.url,
      edit_url: result.edit_url,
      lint_score: lint.find((item) => item.key === page.key).score
    });

    const exported = await apiFetch(options.baseUrl, options.apiKey, `pages/${result.id}`);
    writeJson(exportPath(manifest, page), exported);
    const exportedLint = validateTemplate(exported);
    const exportedPolicy = applyLintPolicy(page, exportedLint);
    report.exports.push({
      key: page.key,
      kind: "page",
      id: result.id,
      ok: exportedPolicy.ok,
      strict_ok: exportedPolicy.strict_ok,
      lint_mode: exportedPolicy.lint_mode,
      lint_score: exportedLint.score,
      issue_count: exportedLint.issue_count,
      output: path.relative(root, exportPath(manifest, page))
    });
  }

  for (const template of manifest.templates || []) {
    const body = readJson(outputPath(manifest, { ...template, kind: "template" }));
    if (template.type) body.type = template.type;
    if (template.conditions) body.conditions = template.conditions;
    const endpoint = template.existingId ? `templates/${template.existingId}` : "templates";
    const method = template.existingId ? "PUT" : "POST";
    const result = await apiFetch(options.baseUrl, options.apiKey, endpoint, { method, body });
    report.templates.push({
      key: template.key,
      id: result.id,
      title: result.title,
      type: result.elementor_template_type,
      conditions: result.elementor_conditions,
      edit_url: result.edit_url,
      lint_score: lint.find((item) => item.key === template.key).score
    });

    const exported = await apiFetch(options.baseUrl, options.apiKey, `templates/${result.id}`);
    writeJson(exportPath(manifest, template), exported);
    const exportedLint = validateTemplate(exported);
    const exportedPolicy = applyLintPolicy(template, exportedLint);
    report.exports.push({
      key: template.key,
      kind: "template",
      id: result.id,
      ok: exportedPolicy.ok,
      strict_ok: exportedPolicy.strict_ok,
      lint_mode: exportedPolicy.lint_mode,
      lint_score: exportedLint.score,
      issue_count: exportedLint.issue_count,
      output: path.relative(root, exportPath(manifest, template))
    });
  }

  const exportFailures = report.exports.filter((item) => !item.ok);
  if (exportFailures.length) {
    throw new Error(`WordPress export lint failed for: ${exportFailures.map((item) => item.key).join(", ")}`);
  }

  report.cache = await apiFetch(options.baseUrl, options.apiKey, "clear-cache", { method: "POST" });
  report.theme_builder = await apiFetch(options.baseUrl, options.apiKey, "theme-builder");
  writeJson(reportPath(manifest), report);
  return report;
}

async function smokeManifest(manifest, options) {
  if (!options.baseUrl) {
    throw new Error("Smoke test requires --base-url or NEB_SITE_URL.");
  }

  const checks = manifest.smoke || [];
  const results = [];
  for (const check of checks) {
    const url = publicUrl(options.baseUrl, check.path);
    const response = await fetch(url);
    const html = await response.text();
    const contains = (check.contains || []).map((text) => ({ text, ok: html.includes(text) }));
    const selectors = (check.markers || []).map((text) => ({ text, ok: html.includes(text) }));
    results.push({
      url,
      status: response.status,
      ok: response.ok && contains.every((item) => item.ok) && selectors.every((item) => item.ok),
      contains,
      markers: selectors
    });
  }
  writeJson(smokeReportPath(manifest), results);
  return results;
}

async function snapshotSite(manifest, options) {
  if (!options.baseUrl || !options.apiKey) {
    throw new Error("Snapshot requires --base-url and --api-key or NEB_SITE_URL and NEB_API_KEY.");
  }

  const endpoint = options.includeData ? "site-snapshot?include_data=true" : "site-snapshot";
  const snapshot = await apiFetch(options.baseUrl, options.apiKey, endpoint);
  writeJson(intakePath(manifest), snapshot);
  return {
    ok: true,
    output: path.relative(root, intakePath(manifest)),
    page_count: snapshot.pages ? snapshot.pages.length : 0,
    template_count: snapshot.templates ? snapshot.templates.length : 0,
    menu_count: snapshot.menus ? snapshot.menus.length : 0,
    include_data: Boolean(options.includeData)
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const manifestArg = args._[0];
  const action = args._[1] || "compile";

  if (!manifestArg) {
    throw new Error("Usage: node tools/site-workflow.js <manifest.json> <compile|lint|deploy|smoke|snapshot|all> [--base-url URL] [--api-key KEY]");
  }

  const manifest = readJson(path.resolve(root, manifestArg));
  const options = {
    baseUrl: args["base-url"] || process.env.NEB_SITE_URL || manifest.site_url,
    apiKey: args["api-key"] || process.env.NEB_API_KEY,
    includeData: args["include-data"] === "true" || process.env.NEB_INCLUDE_DATA === "true"
  };

  let result;
  if (action === "compile") {
    result = compileManifest(manifest, options);
  } else if (action === "lint") {
    result = lintManifest(manifest);
  } else if (action === "deploy") {
    compileManifest(manifest, options);
    result = await deployManifest(manifest, options);
  } else if (action === "smoke") {
    result = await smokeManifest(manifest, options);
  } else if (action === "snapshot") {
    result = await snapshotSite(manifest, options);
  } else if (action === "all") {
    compileManifest(manifest, options);
    const deploy = await deployManifest(manifest, options);
    const smoke = await smokeManifest(manifest, options);
    result = { deploy, smoke };
  } else {
    throw new Error(`Unknown action: ${action}`);
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
