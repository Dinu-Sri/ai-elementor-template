const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
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
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`${endpoint} failed with ${response.status}: ${data?.message || response.statusText}`);
  return data;
}

async function main() {
  const baseUrl = process.env.NEB_SITE_URL;
  const apiKey = process.env.NEB_API_KEY;
  if (!baseUrl || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");

  const articlePath = path.resolve(root, process.argv[2] || "content/blog/prepare-pet-mobile-grooming-dubai.json");
  const article = readJson(articlePath);
  const imagePath = path.resolve(root, article.featured_image.path);
  if (!fs.existsSync(imagePath)) throw new Error(`Featured image not found: ${imagePath}`);

  const listing = await apiFetch(baseUrl, apiKey, "posts?per_page=250");
  const existing = (listing.posts || []).find((post) => post.slug === article.slug);
  const postBody = { ...article };
  delete postBody.featured_image;
  const post = await apiFetch(
    baseUrl,
    apiKey,
    existing ? `posts/${existing.id}` : "posts",
    { method: existing ? "PUT" : "POST", body: postBody }
  );

  let media = null;
  if (!post.featured_image_id) {
    media = await apiFetch(baseUrl, apiKey, "media/upload", {
      method: "POST",
      body: {
        data: fs.readFileSync(imagePath).toString("base64"),
        filename: article.featured_image.filename,
        post_id: post.id,
        title: article.featured_image.title,
        alt: article.featured_image.alt,
        caption: article.featured_image.caption
      }
    });
  }

  const verified = await apiFetch(baseUrl, apiKey, `posts/${post.id}`);
  const report = {
    ok: true,
    action: existing ? "updated" : "created",
    post: verified,
    media
  };
  writeJson(path.join(root, "build", "deployments", "sms-pet-blog", "article.json"), report);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
