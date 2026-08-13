const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../..");
const sourcePath = path.join(
  root,
  "sites/sms-home-salon/content/templates/sms-home-salon-blog-archive-2026.payload.json"
);
const outputPath = path.join(
  root,
  "sites/sms-home-salon/content/pages/sms-home-salon-blog-page-2026.payload.json"
);

function walk(elements, callback) {
  for (const element of elements || []) {
    callback(element);
    walk(element.elements, callback);
  }
}

function main() {
  const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  const payload = {
    title: "Blog",
    slug: "blog",
    status: "publish",
    template: "elementor_header_footer",
    seo_title: "Home Salon Beauty Guides in Dubai | SMS Home Salon",
    seo_description: "Practical Dubai home salon guides covering massage, nails, hair, facials, waxing, threading, preparation, aftercare and service choices.",
    focus_keyword: "home salon beauty guides Dubai",
    canonical_url: "https://homesalon.ae/blog/",
    robots: ["index", "follow"],
    elementor_data: source.elementor_data
  };

  walk(payload.elementor_data, (element) => {
    if (element.widgetType === "loop-grid") {
      element.settings.template_id = "1318";
      element.settings.nothing_found_message_text = "Our home beauty guides are coming soon.";
    }
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ ok: true, outputPath }, null, 2));
}

main();
