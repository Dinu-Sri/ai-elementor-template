const fs = require("fs");
const path = require("path");

const baseUrl = String(process.env.NEB_SITE_URL || "").replace(/\/$/, "");
const apiKey = process.env.NEB_API_KEY;
if (!baseUrl || !apiKey) throw new Error("NEB_SITE_URL and NEB_API_KEY are required.");

const rootDir = path.resolve(__dirname, "../../..");
const outputDir = path.join(rootDir, "build/sites/sms-home-salon/seo-50");
const planned = JSON.parse(fs.readFileSync(path.join(outputDir, "seo-50-schedule-report.json"), "utf8"));

function endpoint(value) {
  if (/\/wp-json\/native-elementor\/v1$/i.test(baseUrl)) return `${baseUrl}/${value}`;
  return `${baseUrl}/wp-json/native-elementor/v1/${value}`;
}

async function apiFetch(value) {
  const response = await fetch(endpoint(value), {
    headers: { "X-API-Key": apiKey },
    signal: AbortSignal.timeout(45000)
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`${value} failed with ${response.status}`);
  return payload;
}

async function main() {
  if (planned.dry_run || planned.count !== 50) {
    throw new Error("The schedule report must be an applied 50-post report.");
  }
  const listing = await apiFetch("posts?per_page=250");
  const liveById = new Map((listing.posts || []).map((post) => [Number(post.id), post]));
  const results = planned.results.map((expected) => {
    const live = liveById.get(Number(expected.id));
    const failures = [];
    if (!live) failures.push("missing");
    if (live && live.status !== "future") failures.push(`status=${live.status}`);
    if (live && live.date !== expected.date) failures.push(`date=${live.date}`);
    if (live && live.date_gmt !== expected.date_gmt) failures.push(`date_gmt=${live.date_gmt}`);
    if (live && !Number(live.featured_image_id)) failures.push("featured_image_missing");
    if (live && !String(live.seo_description || "").trim()) failures.push("seo_description_missing");
    if (live && !String(live.canonical_url || "").trim()) failures.push("canonical_missing");
    return {
      id: expected.id,
      order: expected.order,
      slug: expected.slug,
      expected_date: expected.date,
      expected_date_gmt: expected.date_gmt,
      live_status: live?.status || "missing",
      live_date: live?.date || "",
      live_date_gmt: live?.date_gmt || "",
      featured_image_id: live?.featured_image_id || 0,
      failures
    };
  });
  const failures = results.filter((item) => item.failures.length);
  const report = {
    verified_at: new Date().toISOString(),
    summary: {
      expected_posts: planned.results.length,
      live_posts: results.filter((item) => item.live_status !== "missing").length,
      future_status: results.filter((item) => item.live_status === "future").length,
      exact_dates: results.filter((item) => item.live_date === item.expected_date && item.live_date_gmt === item.expected_date_gmt).length,
      featured_images: results.filter((item) => item.featured_image_id).length,
      failures: failures.length
    },
    failures,
    posts: results
  };
  fs.writeFileSync(path.join(outputDir, "seo-50-schedule-verification.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  const lines = [
    "# SEO 50 Schedule Verification",
    "",
    `Verified: ${report.verified_at}`,
    "",
    `- Expected posts: ${report.summary.expected_posts}`,
    `- Live scheduled posts: ${report.summary.future_status}`,
    `- Exact Dubai/GMT date pairs: ${report.summary.exact_dates}`,
    `- Featured images: ${report.summary.featured_images}`,
    `- Failures: ${report.summary.failures}`,
    ""
  ];
  fs.writeFileSync(path.join(outputDir, "seo-50-schedule-verification.md"), `${lines.join("\n")}\n`, "utf8");
  console.log(JSON.stringify(report.summary, null, 2));
  if (failures.length) throw new Error("Schedule verification failed.");
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
