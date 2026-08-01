const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const root = path.resolve(__dirname, "..");
const packageArg = process.argv[2];
const assetArg = process.argv[3];
if (!packageArg || !assetArg) {
  throw new Error("Usage: node tools/plan-seo-visuals.js <cms-package-directory> <asset-directory> [from] [to]");
}
const packageRoot = path.resolve(root, packageArg);
const assetRoot = path.resolve(root, assetArg);
const articleDir = path.join(packageRoot, "articles");

function parseArticle(file) {
  const source = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) throw new Error(`Missing YAML front matter: ${file}`);
  return yaml.load(match[1]);
}

function requiresRealEvidence(asset) {
  const description = `${asset.alt_text || ""} ${asset.prompt || ""}`;
  return /owner permission|consented|licensed examples?|actual (?:appointment|session|customer|service)|service evidence|customer (?:photo|image|record)|facility (?:photo|image)|SMS (?:doorstep[- ]session|session|service) photo|original [^.]*\bphoto\b|before\s*(?:\/|and|&|-)\s*after/i.test(description);
}

const from = Number(process.argv[4] || 1);
const to = Number(process.argv[5] || Number.MAX_SAFE_INTEGER);
const files = fs.readdirSync(articleDir).filter((file) => file.endsWith(".md")).sort();
const articles = files
  .map((filename) => ({ filename, meta: parseArticle(path.join(articleDir, filename)) }))
  .filter(({ meta }) => Number(meta.publish_order) >= from && Number(meta.publish_order) <= to);

const assets = articles.flatMap(({ filename, meta }) => (meta.visual_assets || []).map((asset) => {
  const file = path.join(assetRoot, meta.content_id, asset.filename);
  const evidenceRequired = requiresRealEvidence(asset);
  return {
    publish_order: Number(meta.publish_order),
    article_file: filename,
    content_id: meta.content_id,
    article_title: meta.title,
    asset_id: asset.asset_id,
    type: asset.type,
    filename: asset.filename,
    output_path: path.relative(root, file),
    aspect_ratio: asset.aspect_ratio,
    alt_text: asset.alt_text,
    prompt: asset.prompt,
    status: fs.existsSync(file) ? "ready" : evidenceRequired ? "real_evidence_required" : "generate"
  };
}));

const result = {
  generated_at: new Date().toISOString(),
  range: { from, to },
  article_count: articles.length,
  asset_count: assets.length,
  summary: {
    ready: assets.filter((asset) => asset.status === "ready").length,
    generate: assets.filter((asset) => asset.status === "generate").length,
    real_evidence_required: assets.filter((asset) => asset.status === "real_evidence_required").length
  },
  articles: articles.map(({ filename, meta }) => ({
    publish_order: Number(meta.publish_order),
    content_id: meta.content_id,
    filename,
    title: meta.title,
    category: meta.category,
    expert_review_required: Boolean(meta.expert_review_required),
    commercial_verification_required: Boolean(meta.commercial_verification_required)
  })),
  assets
};

const output = path.join(root, "build", "seo-cms", `visual-plan-${from}-${to}.json`);
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ output: path.relative(root, output), ...result.summary, articles: result.article_count, assets: result.asset_count }, null, 2));
