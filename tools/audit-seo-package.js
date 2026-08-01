const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { parse: parseCsv } = require("csv-parse/sync");

const root = path.resolve(__dirname, "..");
const packageRoot = path.resolve(process.argv[2] || "");

if (!process.argv[2] || !fs.existsSync(packageRoot)) {
  throw new Error("Usage: node tools/audit-seo-package.js <cms-package-directory>");
}

function readText(file) {
  return fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
}

function readJson(file) {
  return JSON.parse(readText(file));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function parseArticle(file) {
  const source = readText(file);
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`${path.basename(file)} is missing valid YAML front matter.`);
  return {
    frontMatter: yaml.load(match[1]),
    body: match[2],
    source
  };
}

function withoutComments(markdown) {
  return markdown.replace(/<!--[\s\S]*?-->/g, " ");
}

function words(markdown) {
  return withoutComments(markdown)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[[^\]]+\]\([^\)]+\)/g, " ")
    .replace(/[#>*_`|~-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function markdownLinks(markdown) {
  const links = [];
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
  let match;
  while ((match = regex.exec(markdown))) links.push({ anchor: match[1], url: match[2] });
  return links;
}

function duplicateValues(items, field) {
  const counts = new Map();
  for (const item of items) counts.set(item[field], (counts.get(item[field]) || 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1).map(([value, count]) => ({ value, count }));
}

const manifest = readJson(path.join(packageRoot, "cms_manifest.json"));
const linkMap = parseCsv(readText(path.join(packageRoot, "internal_link_map.csv")), {
  columns: true,
  skip_empty_lines: true
});
const visualManifest = parseCsv(readText(path.join(packageRoot, "visual_production_manifest.csv")), {
  columns: true,
  skip_empty_lines: true
});
const articleDir = path.join(packageRoot, "articles");
const files = fs.readdirSync(articleDir).filter((file) => file.endsWith(".md")).sort();
const manifestByFile = new Map(manifest.map((item) => [item.filename, item]));
const manifestSlugs = new Set(manifest.map((item) => item.slug));
const siteOrigins = new Set(manifest.map((item) => {
  try {
    return new URL(item.canonical_url || item.url).origin;
  } catch {
    return null;
  }
}).filter(Boolean));
const report = {
  generated_at: new Date().toISOString(),
  package_root: packageRoot,
  summary: {},
  categories: {},
  waves: {},
  issues: [],
  articles: []
};

for (const file of files) {
  const parsed = parseArticle(path.join(articleDir, file));
  const meta = parsed.frontMatter || {};
  const manifestItem = manifestByFile.get(file);
  const body = withoutComments(parsed.body);
  const links = markdownLinks(body);
  const internalLinks = links.filter((link) => {
    try {
      return siteOrigins.has(new URL(link.url).origin);
    } catch {
      return false;
    }
  });
  const declaredLinks = Array.isArray(meta.internal_links) ? meta.internal_links : [];
  const visualAssets = Array.isArray(meta.visual_assets) ? meta.visual_assets : [];
  const mappedLinks = linkMap.filter((item) => item.source_id === meta.content_id);
  const mappedVisuals = visualManifest.filter((item) => item.article_id === meta.content_id);
  const issues = [];

  if (!manifestItem) issues.push("Missing cms_manifest.json entry.");
  if ((body.match(/^#\s+/gm) || []).length !== 1) issues.push("Article must contain exactly one H1.");
  if ((body.match(/^##\s+/gm) || []).length < 3) issues.push("Article contains fewer than three H2 sections.");
  if (visualAssets.length !== 3) issues.push(`Expected 3 visual assets, found ${visualAssets.length}.`);
  if (mappedVisuals.length !== 3) issues.push(`Visual manifest contains ${mappedVisuals.length} tasks instead of 3.`);
  if (mappedLinks.length !== declaredLinks.length) {
    issues.push(`Internal-link map count ${mappedLinks.length} differs from YAML count ${declaredLinks.length}.`);
  }
  if ((parsed.body.match(/CMS_VISUAL:/g) || []).length !== 3) issues.push("CMS visual marker count does not equal 3.");
  if (!Array.isArray(meta.schema_types) || !meta.schema_types.includes("Article")) issues.push("Article schema is missing.");
  if (!Array.isArray(meta.schema_types) || !meta.schema_types.includes("BreadcrumbList")) issues.push("Breadcrumb schema is missing.");
  if (!meta.meta_description || meta.meta_description.length < 135 || meta.meta_description.length > 160) {
    issues.push(`Meta description length is ${meta.meta_description ? meta.meta_description.length : 0}.`);
  }
  if (!meta.seo_title || meta.seo_title.length < 30 || meta.seo_title.length > 60) {
    issues.push(`SEO title length is ${meta.seo_title ? meta.seo_title.length : 0}.`);
  }
  if (meta.canonical_url !== meta.url) issues.push("Canonical URL does not match the declared article URL.");
  if (!internalLinks.some((link) => link.url === meta.commercial_parent_url)) {
    issues.push("Commercial parent link is absent from the visible body.");
  }
  for (const declared of declaredLinks) {
    if (!internalLinks.some((link) => link.url === declared.url)) {
      issues.push(`Declared internal link is absent from body: ${declared.url}`);
    }
  }
  for (const mapped of mappedLinks) {
    if (!declaredLinks.some((link) => link.url === mapped.target_url && link.anchor === mapped.anchor)) {
      issues.push(`CSV/YAML link mismatch: ${mapped.target_url}`);
    }
  }
  for (const visual of mappedVisuals) {
    if (!visualAssets.some((asset) => asset.asset_id === visual.asset_id && asset.filename === visual.filename)) {
      issues.push(`CSV/YAML visual mismatch: ${visual.asset_id}`);
    }
  }
  for (const link of internalLinks.filter((item) => item.url.includes("/blog/"))) {
    const slug = new URL(link.url).pathname;
    if (slug !== meta.slug && !manifestSlugs.has(slug)) issues.push(`Unmapped internal article URL: ${link.url}`);
  }
  if (internalLinks.some((link) => new URL(link.url).pathname === meta.slug)) issues.push("Article contains a self-link.");

  const comparisons = [
    ["title", meta.title],
    ["seo_title", meta.seo_title],
    ["meta_description", meta.meta_description],
    ["slug", meta.slug],
    ["canonical_url", meta.canonical_url],
    ["category_slug", meta.category_slug],
    ["primary_keyword", meta.primary_keyword]
  ];
  if (manifestItem) {
    for (const [field, value] of comparisons) {
      if (manifestItem[field] !== value) issues.push(`Manifest mismatch: ${field}.`);
    }
  }

  const article = {
    order: Number(meta.publish_order),
    wave: meta.publication_wave,
    id: meta.content_id,
    filename: file,
    category: meta.category,
    category_slug: meta.category_slug,
    title: meta.title,
    slug: meta.slug,
    canonical_url: meta.canonical_url,
    seo_title_length: meta.seo_title ? meta.seo_title.length : 0,
    meta_description_length: meta.meta_description ? meta.meta_description.length : 0,
    computed_word_count: words(body),
    manifest_word_count: manifestItem ? manifestItem.word_count : null,
    h1_count: (body.match(/^#\s+/gm) || []).length,
    h2_count: (body.match(/^##\s+/gm) || []).length,
    h3_count: (body.match(/^###\s+/gm) || []).length,
    faq_present: /^##\s+.*FAQ/im.test(body) || /^##\s+Frequently Asked Questions/im.test(body),
    internal_link_count: internalLinks.length,
    declared_internal_link_count: declaredLinks.length,
    mapped_internal_link_count: mappedLinks.length,
    visual_asset_count: visualAssets.length,
    mapped_visual_count: mappedVisuals.length,
    featured_image_filename: meta.featured_image?.filename || "",
    expert_review_required: Boolean(meta.expert_review_required),
    commercial_verification_required: Boolean(meta.commercial_verification_required),
    requested_status: meta.status,
    safe_publish_status: meta.expert_review_required || meta.commercial_verification_required ? "draft" : "publish",
    issues
  };
  report.articles.push(article);
  report.categories[article.category] = (report.categories[article.category] || 0) + 1;
  report.waves[article.wave] = (report.waves[article.wave] || 0) + 1;
  for (const issue of issues) report.issues.push({ file, issue });
}

report.articles.sort((a, b) => a.order - b.order);
report.summary = {
  manifest_entries: manifest.length,
  article_files: files.length,
  total_words: report.articles.reduce((sum, article) => sum + article.computed_word_count, 0),
  visual_tasks: report.articles.reduce((sum, article) => sum + article.visual_asset_count, 0),
  visual_manifest_rows: visualManifest.length,
  internal_link_map_rows: linkMap.length,
  expert_review_required: report.articles.filter((article) => article.expert_review_required).length,
  commercial_verification_required: report.articles.filter((article) => article.commercial_verification_required).length,
  technically_clean_articles: report.articles.filter((article) => article.issues.length === 0).length,
  issue_count: report.issues.length,
  duplicate_titles: duplicateValues(report.articles, "title"),
  duplicate_slugs: duplicateValues(report.articles, "slug"),
  missing_manifest_files: manifest.filter((item) => !files.includes(item.filename)).map((item) => item.filename)
};

const output = path.join(root, "build", "seo-cms", "package-audit.json");
writeJson(output, report);
console.log(JSON.stringify({ output: path.relative(root, output), ...report.summary, categories: report.categories, waves: report.waves }, null, 2));

if (report.summary.issue_count > 0) process.exitCode = 2;
