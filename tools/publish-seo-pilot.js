const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { marked } = require("marked");

const root = path.resolve(__dirname, "..");

function parseArticle(file) {
  const source = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`Missing YAML front matter: ${file}`);
  return { meta: yaml.load(match[1]), markdown: match[2].trim() };
}

function slugFromPath(value) {
  return String(value || "").split("/").filter(Boolean).pop() || "";
}

function extractFaq(markdown) {
  const section = markdown.match(/\n## Frequently asked questions\s*\n([\s\S]*?)(?=\n## |$)/i);
  if (!section) return [];

  return [...section[1].matchAll(/^###\s+(.+?)\s*\r?\n\r?\n([\s\S]*?)(?=\r?\n###\s+|$)/gm)]
    .map((match) => ({
      question: match[1].trim(),
      answer: marked.parse(match[2].trim()).trim()
    }))
    .filter((item) => item.question && item.answer);
}

function captionForVisual(asset) {
  if (asset.caption_text) return asset.caption_text;
  const description = String(asset.alt_text || "Supporting grooming visual")
    .replace(/^Original\s+/i, "")
    .replace(/\bphoto(graph)?\b/gi, "visual")
    .replace(/\bimage\b/gi, "visual")
    .replace(/\s+/g, " ")
    .trim();
  return `AI-assisted illustration: ${description.charAt(0).toLowerCase()}${description.slice(1)}`;
}

function requiresRealEvidence(asset) {
  const description = `${asset.alt_text || ""} ${asset.prompt || ""}`;
  return /owner permission|consented|licensed examples?|actual (?:appointment|session|customer|service)|service evidence|customer (?:photo|image|record)|facility (?:photo|image)|SMS (?:doorstep[- ]session|session|service) photo|original [^.]*\bphoto\b|before\s*(?:\/|and|&|-)\s*after/i.test(description);
}

function renderArticle(markdown, visualUrls = {}, classPrefix = "neb") {
  let body = markdown.replace(/<!--\s*CMS_VISUAL:\s*([\s\S]*?)-->/g, (comment, block) => {
    const assetId = block.match(/^\s*asset_id:\s*(.+)$/m)?.[1]?.trim();
    if (!assetId || /-FEATURED$/i.test(assetId)) return "";
    const visual = visualUrls[assetId];
    if (!visual) return `<!-- ${assetId} pending upload -->`;
    return [
      `<figure class="${classPrefix}-article-visual">`,
      `<img src="${visual.url}" alt="${visual.alt}" loading="lazy" decoding="async">`,
      `<figcaption>${visual.caption}</figcaption>`,
      `</figure>`
    ].join("\n");
  });
  body = body.replace(/^\s*#\s+.+?\r?\n+/, "");

  const html = marked.parse(body, { gfm: true })
    .replace(/<table>/g, `<div class="${classPrefix}-table-scroll"><table>`)
    .replace(/<\/table>/g, "</table></div>")
    .trim();
  return html;
}

async function apiFetch(baseUrl, apiKey, endpoint, options = {}) {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/wp-json/native-elementor/v1/${endpoint}`, {
    method: options.method || "GET",
    headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`${endpoint} returned non-JSON (${response.status}): ${text.slice(0, 300)}`);
  }
  if (!response.ok) throw new Error(`${endpoint} failed with ${response.status}: ${data?.message || response.statusText}`);
  return data;
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function uploadVisual(baseUrl, apiKey, postId, asset, assetDir) {
  const file = path.join(assetDir, asset.filename);
  if (!fs.existsSync(file)) throw new Error(`Required visual not found: ${file}`);
  return apiFetch(baseUrl, apiKey, "media/upload", {
    method: "POST",
    body: {
      data: fs.readFileSync(file).toString("base64"),
      filename: asset.filename,
      post_id: postId,
      set_featured: asset.type === "featured_image",
      title: asset.alt_text.replace(/[.]$/, ""),
      alt: asset.alt_text,
      caption: asset.type === "featured_image" ? "" : asset.alt_text
    }
  });
}

async function main() {
  const baseUrl = process.env.NEB_SITE_URL;
  const apiKey = process.env.NEB_API_KEY;
  if (!baseUrl || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");
  const postStatus = process.env.NEB_POST_STATUS || "draft";
  if (!["draft", "publish"].includes(postStatus)) {
    throw new Error("NEB_POST_STATUS must be either draft or publish.");
  }

  const articleArg = process.argv[2];
  const assetRootArg = process.argv[3];
  if (!articleArg || !assetRootArg) {
    throw new Error("Usage: node tools/publish-seo-pilot.js <article.md> <asset-root>");
  }
  const articleFile = path.resolve(root, articleArg);
  const assetRoot = path.resolve(root, assetRootArg);
  const classPrefix = String(process.env.NEB_ARTICLE_CLASS_PREFIX || "neb")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-");
  const { meta, markdown } = parseArticle(articleFile);
  const slug = slugFromPath(meta.slug);
  if (!slug) throw new Error("Article slug is empty.");
  if (!meta.expert_review_required) throw new Error("Pilot script is intended for a review-gated article.");

  const categories = await apiFetch(baseUrl, apiKey, "categories");
  let category = (categories.categories || []).find((item) => item.slug === meta.category_slug);
  if (!category) {
    const created = await apiFetch(baseUrl, apiKey, "categories", {
      method: "POST",
      body: { name: meta.category, slug: meta.category_slug }
    });
    category = created.category;
  }

  const authors = await apiFetch(baseUrl, apiKey, "authors");
  const author = (authors.authors || []).find((item) => item.display_name === meta.author);
  const fallbackAuthor = (authors.authors || []).find((item) => item.id === 2) || (authors.authors || [])[0];
  const selectedAuthor = author || fallbackAuthor;
  const listing = await apiFetch(baseUrl, apiKey, "posts?per_page=250");
  const existing = (listing.posts || []).find((post) => post.slug === slug);
  const common = {
    title: meta.title,
    slug,
    status: postStatus,
    excerpt: meta.excerpt,
    categories: [category.id],
    tags: meta.tags || [],
    author_id: selectedAuthor?.id,
    seo_title: meta.seo_title,
    seo_description: meta.meta_description,
    focus_keyword: meta.primary_keyword,
    canonical_url: meta.canonical_url,
    robots: meta.robots,
    og_title: meta.seo_title,
    og_description: meta.meta_description,
    faq_schema: extractFaq(markdown)
  };

  const post = await apiFetch(baseUrl, apiKey, existing ? `posts/${existing.id}` : "posts", {
    method: existing ? "PUT" : "POST",
    body: { ...common, content: renderArticle(markdown, {}, classPrefix) }
  });

  const visualUrls = {};
  const uploads = [];
  const pendingAssets = [];
  const reportFile = path.join(root, "build", "deployments", "seo-pilot", `${meta.content_id}.json`);
  const previousReport = fs.existsSync(reportFile) ? JSON.parse(fs.readFileSync(reportFile, "utf8")) : null;
  const forceMediaUpload = process.env.NEB_FORCE_MEDIA_UPLOAD === "true";
  const reusableUploads = !forceMediaUpload && previousReport?.post?.id === post.id
    ? previousReport.uploads || []
    : [];
  const assetDir = path.join(assetRoot, meta.content_id);
  for (const asset of meta.visual_assets || []) {
    const reused = reusableUploads.find((item) => item.asset_id === asset.asset_id && item.url && item.attachment_id);
    const assetFile = path.join(assetDir, asset.filename);
    if (!reused && !fs.existsSync(assetFile)) {
      pendingAssets.push({
        asset_id: asset.asset_id,
        filename: asset.filename,
        reason: requiresRealEvidence(asset) ? "real_evidence_required" : "generation_pending"
      });
      continue;
    }
    const media = reused || await uploadVisual(baseUrl, apiKey, post.id, asset, assetDir);
    uploads.push({ asset_id: asset.asset_id, ...media });
    visualUrls[asset.asset_id] = {
      url: media.url,
      alt: asset.alt_text,
      caption: captionForVisual(asset)
    };
  }

  const featured = uploads.find((item) => /-FEATURED$/i.test(item.asset_id));
  const updated = await apiFetch(baseUrl, apiKey, `posts/${post.id}`, {
    method: "PUT",
    body: {
      ...common,
      featured_image_id: featured?.attachment_id,
      content: renderArticle(markdown, visualUrls, classPrefix)
    }
  });

  const verified = await apiFetch(baseUrl, apiKey, `posts/${post.id}`);
  const report = {
    ok: true,
    content_id: meta.content_id,
    action: existing ? "updated" : "created",
    publication_guard: meta.publication_guard,
    forced_status: postStatus,
    author_warning: author ? null : `Author not found: ${meta.author}; using ${selectedAuthor?.display_name || "WordPress default"}.`,
    reused_media: reusableUploads.length > 0,
    pending_assets: pendingAssets,
    category,
    uploads,
    post: verified,
    update_response: updated
  };
  writeJson(reportFile, report);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
