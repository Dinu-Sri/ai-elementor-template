const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "../../..");
const snapshotPath = path.join(rootDir, "build/sites/sms-home-salon/client-sitemap-reconciliation/live-navigation-snapshot.json");
const outputPath = path.join(rootDir, "sites/sms-home-salon/content/client-approved-navigation-migration.json");

function route(value) {
  const pathname = new URL(value, "https://homesalon.ae").pathname;
  return pathname === "/" ? "/" : `${pathname.replace(/\/$/, "")}/`;
}

const newPages = [
  { key: "bleach", title: "Bleach", slug: "bleach", route: "/bleach/", kind: "hub" },
  { key: "scrub", title: "Scrub", slug: "scrub", route: "/scrub/", kind: "hub" },
  { key: "manicure", title: "Manicure", slug: "manicure", route: "/manicure/", kind: "hub" },
  { key: "pedicure", title: "Pedicure", slug: "pedicure", route: "/pedicure/", kind: "hub" },
  {
    key: "french-gel-nail-extensions",
    title: "French Gel Nail Extensions at Home in Dubai",
    slug: "french-gel-nail-extensions",
    route: "/manicure/french-gel-nail-extensions/",
    kind: "detail",
    parent_key: "manicure",
    price_packages: [{ label: "French Gel Nail Extensions", price: "AED 320" }]
  }
];

const moves = [
  ["/facial/full-arm-bleaching/", "/bleach/full-arm-bleaching/", "bleach", "Full Arms Bleaching at Home in Dubai"],
  ["/facial/full-legs-bleaching/", "/bleach/full-legs-bleaching/", "bleach", "Full Legs Bleaching at Home in Dubai"],
  ["/facial/full-back-front-bleaching/", "/bleach/full-back-front-bleaching/", "bleach", "Full Body Back and Full Body Front Bleaching at Home in Dubai"],
  ["/facial/face-scrub/", "/scrub/face-scrub/", "scrub", "Face Scrub at Home in Dubai"],
  ["/facial/full-arm-scrub/", "/scrub/full-arm-scrub/", "scrub", "Full Arms Scrub at Home in Dubai"],
  ["/facial/full-back-front-scrub/", "/scrub/full-back-front-scrub/", "scrub", "Full Body Back and Full Body Front Scrub at Home in Dubai"],
  ["/facial/full-body-scrub/", "/scrub/full-body-scrub/", "scrub", "Full Body Scrub at Home in Dubai"],
  ["/facial/full-body-scrub-with-mask/", "/scrub/full-body-scrub-with-mask/", "scrub", "Full Body Scrub With Mask at Home in Dubai"],
  ["/nails/hand-paraffin/", "/manicure/hand-paraffin/", "manicure", "Hand Paraffin at Home in Dubai"],
  ["/nails/classic-manicure/", "/manicure/classic-manicure/", "manicure", "Classic Manicure at Home in Dubai"],
  ["/nails/spa-manicure/", "/manicure/spa-manicure/", "manicure", "Spa Manicure at Home in Dubai"],
  ["/nails/classic-nails-extension/", "/manicure/classic-nails-extension/", "manicure", "Classic Nails Extension at Home in Dubai"],
  ["/nails/gelish-manicure/", "/manicure/gelish-manicure/", "manicure", "Gelish Manicure at Home in Dubai"],
  ["/nails/french-gel-manicure/", "/manicure/french-gel-manicure/", "manicure", "French Gel Manicure at Home in Dubai"],
  ["/nails/cat-eye-extensions/", "/manicure/cat-eye-extensions/", "manicure", "Cat Eye Extensions at Home in Dubai"],
  ["/nails/acrylic-nail/", "/manicure/acrylic-nail/", "manicure", "Acrylic Nail at Home in Dubai"],
  ["/nails/gel-nail-extensions/", "/manicure/gel-nail-extensions/", "manicure", "Gel Nail Extensions at Home in Dubai"],
  ["/nails/builder-gel-nails/", "/manicure/builder-gel-nails/", "manicure", "Builder Gel Nails at Home in Dubai"],
  ["/nails/kids/", "/kids/", null, "Kids Nail Services at Home in Dubai"],
  ["/nails/foot-paraffin/", "/pedicure/foot-paraffin/", "pedicure", "Foot Paraffin at Home in Dubai"],
  ["/nails/classic-pedicure/", "/pedicure/classic-pedicure/", "pedicure", "Classic Pedicure at Home in Dubai"],
  ["/nails/gel-pedicure/", "/pedicure/gel-pedicure/", "pedicure", "Gel Pedicure at Home in Dubai"],
  ["/nails/spa-pedicure/", "/pedicure/spa-pedicure/", "pedicure", "Spa Pedicure at Home in Dubai"],
  ["/nails/callus/", "/pedicure/callus-pedicure/", "pedicure", "Callus Treatment at Home in Dubai"],
  ["/nails/foot-scrub/", "/pedicure/foot-scrub-pedicure/", "pedicure", "Foot Scrub at Home in Dubai"],
  ["/waxing/upper-lip/", "/waxing/upper-lip-waxing/", 66, "Upper Lip Waxing at Home in Dubai"],
  ["/waxing/eyebrows/", "/waxing/eyebrows-waxing/", 66, "Eyebrow Waxing at Home in Dubai"],
  ["/waxing/chin/", "/waxing/chin-waxing/", 66, "Chin Waxing at Home in Dubai"],
  ["/waxing/underarms/", "/waxing/underarms-waxing/", 66, "Underarms Waxing at Home in Dubai"],
  ["/waxing/chest/", "/waxing/chest-waxing/", 66, "Chest Waxing at Home in Dubai"],
  ["/waxing/half-stomach/", "/waxing/stomach-waxing/", 66, "Stomach Waxing at Home in Dubai"],
  ["/waxing/half-legs/", "/waxing/legs-waxing/", 66, "Legs Waxing at Home in Dubai"],
  ["/waxing/half-arms/", "/waxing/arms-waxing/", 66, "Arms Waxing at Home in Dubai"],
  ["/waxing/bikini/", "/waxing/bikini-waxing/", 66, "Bikini Waxing at Home in Dubai"],
  ["/waxing/full-face/", "/waxing/face-waxing/", 66, "Face Waxing at Home in Dubai"],
  ["/waxing/full-body-without-bikini/", "/waxing/full-body-waxing/", 66, "Full Body Waxing at Home in Dubai"]
];

const merges = [
  ["/waxing/full-stomach/", "/waxing/stomach-waxing/", "/waxing/half-stomach/", "merge Full Stomach packages into Stomach Waxing"],
  ["/waxing/full-legs/", "/waxing/legs-waxing/", "/waxing/half-legs/", "merge Full Legs packages into Legs Waxing"],
  ["/waxing/full-arms/", "/waxing/arms-waxing/", "/waxing/half-arms/", "merge Full Arms packages into Arms Waxing"],
  ["/waxing/full-body-with-bikini/", "/waxing/full-body-waxing/", "/waxing/full-body-without-bikini/", "merge With Bikini packages into Full Body Waxing"],
  ["/threading/full-face-with-eyebrows/", "/threading/full-face-without-eyebrows/", "/threading/full-face-without-eyebrows/", "merge With Eyebrows package into Full Face Threading"]
];

const removals = [
  ["/threading/brows-upper-lip/", "/threading/", "approved inventory omits this standalone package page"],
  ["/threading/brows-chin/", "/threading/", "approved inventory omits this standalone package page"],
  ["/threading/custom-pack/", "/threading/", "approved inventory omits this standalone package page"]
];

const pricingUpdates = [
  ["/massage/full-body-massage/", [{ label: "60-Minute Full Body Massage", price: "AED 240" }, { label: "90-Minute Full Body Massage", price: "AED 380" }]],
  ["/massage/head-massage/", [{ label: "60-Minute Head Massage", price: "AED 216" }, { label: "90-Minute Head Massage", price: "AED 264" }]],
  ["/massage/head-neck-massage/", [{ label: "60-Minute Head and Neck Massage", price: "AED 216" }, { label: "90-Minute Head and Neck Massage", price: "AED 264" }]],
  ["/massage/head-shoulder-massage/", [{ label: "60-Minute Head and Shoulder Massage", price: "AED 216" }, { label: "90-Minute Head and Shoulder Massage", price: "AED 264" }]],
  ["/massage/shoulder-massage/", [{ label: "60-Minute Shoulder Massage", price: "AED 216" }, { label: "90-Minute Shoulder Massage", price: "AED 264" }]],
  ["/massage/pregnancy-massage/", [{ label: "60-Minute Pregnancy Massage", price: "AED 280" }, { label: "90-Minute Pregnancy Massage", price: "AED 380" }]],
  ["/nails/acrylic-nail/", [
    { label: "Acrylic Extensions", price: "AED 300" },
    { label: "French Acrylic Extensions", price: "AED 320" },
    { label: "Acrylic Overlay Natural", price: "AED 280" },
    { label: "Acrylic Refill Natural", price: "AED 250" },
    { label: "Acrylic Repair", price: "AED 25" },
    { label: "Acrylic Refill French", price: "AED 270" },
    { label: "Acrylic Refill Ombre", price: "AED 260" },
    { label: "Ombre Acrylic Extensions", price: "AED 400" }
  ]]
];

function main() {
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8").replace(/^\uFEFF/, ""));
  const pages = snapshot.pages || [];
  const byRoute = new Map(pages.map((page) => [route(page.url), page]));
  const requirePage = (source) => {
    const page = byRoute.get(source);
    if (!page) throw new Error(`Live source page not found: ${source}`);
    return page;
  };

  const pageMoves = moves.map(([source, target, parent, title]) => {
    const page = requirePage(source);
    return {
      page_id: Number(page.id),
      source,
      target,
      title,
      slug: target.split("/").filter(Boolean).pop(),
      parent_key: typeof parent === "string" ? parent : null,
      parent_id: typeof parent === "number" ? parent : (parent === null ? 0 : null)
    };
  });

  const mergePlan = merges.map(([source, target, keeperSource, purpose]) => {
    const absorbed = requirePage(source);
    const keeper = requirePage(keeperSource);
    return {
      absorbed_page_id: Number(absorbed.id),
      absorbed_source: source,
      keeper_page_id: Number(keeper.id),
      keeper_source: keeperSource,
      target,
      purpose,
      retire_status: "draft"
    };
  });
  const removalPlan = removals.map(([source, target, reason]) => {
    const page = requirePage(source);
    return { page_id: Number(page.id), source, target, reason, retire_status: "draft" };
  });

  const redirects = [
    ...pageMoves.map((item) => ({ source: item.source, destination: item.target, type: 301, status: "active" })),
    ...mergePlan.map((item) => ({ source: item.absorbed_source, destination: item.target, type: 301, status: "active" })),
    ...removalPlan.map((item) => ({ source: item.source, destination: item.target, type: 301, status: "active" }))
  ];
  const uniqueSources = new Set(redirects.map((item) => item.source));
  if (redirects.length !== 44 || uniqueSources.size !== redirects.length) {
    throw new Error(`Expected 44 unique redirects, found ${redirects.length}/${uniqueSources.size}.`);
  }

  const retiredIds = [
    ...mergePlan.map((item) => item.absorbed_page_id),
    ...removalPlan.map((item) => item.page_id)
  ];
  if (new Set(retiredIds).size !== 8) throw new Error(`Expected 8 retired pages, found ${new Set(retiredIds).size}.`);

  const pricePlan = pricingUpdates.map(([source, packages]) => {
    const page = requirePage(source);
    return { page_id: Number(page.id), source, packages };
  });

  const manifest = {
    schema_version: 1,
    prepared_at: new Date().toISOString(),
    site: "https://homesalon.ae",
    assumptions: {
      canonical_active_page_count: 91,
      keep_nails_hub_published_outside_header: true,
      hand_paraffin_target: "/manicure/hand-paraffin/",
      keep_henna_standalone: true,
      category_only_header_menu: true,
      callus_label_check_required: true
    },
    counts: {
      new_pages: newPages.length,
      page_moves_or_renames: pageMoves.length,
      absorbed_merge_pages: mergePlan.length,
      omitted_package_pages: removalPlan.length,
      retired_pages: retiredIds.length,
      redirects: redirects.length,
      existing_pricing_pages: pricePlan.length,
      total_pricing_targets_including_new_page: pricePlan.length + 1
    },
    new_pages: newPages,
    page_moves: pageMoves,
    merges: mergePlan,
    removals: removalPlan,
    pricing_updates: pricePlan,
    redirects,
    menu: {
      strategy: "category-only",
      top_level: ["Home", "Services", "About Us", "Blog", "Contact Us"],
      service_categories: ["Massage", "Facial", "Bleach", "Scrub", "Hair", "Manicure", "Pedicure", "Kids", "Waxing", "Threading"],
      footer_legal: ["Privacy Policy", "Terms of Use"],
      excluded_from_header: ["Nails"]
    }
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ output: outputPath, counts: manifest.counts }, null, 2));
}

main();
