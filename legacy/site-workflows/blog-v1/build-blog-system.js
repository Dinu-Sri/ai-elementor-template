const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const baselineDir = path.join(
  root,
  "build",
  "site-intake",
  "sms-pet-blog",
  "baselines",
  "20260722-pre-deploy"
);
const outputDir = path.join(root, "build", "native-sources");

const colors = {
  orange: "#FF9807",
  orangeDark: "#C96800",
  cream: "#FFF4E6",
  creamDeep: "#FFEACD",
  paper: "#FFFDF9",
  dark: "#1F1E1E",
  brown: "#5C2B02",
  muted: "#625C56",
  white: "#FFFFFF",
  green: "#00B82E"
};

let sequence = 1;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function id() {
  return (sequence++).toString(16).padStart(7, "0").slice(-7);
}

function px(size) {
  return { unit: "px", size, sizes: [] };
}

function pct(size) {
  return { unit: "%", size, sizes: [] };
}

function spacing(top, right, bottom, left, linked = false) {
  return {
    unit: "px",
    top: String(top),
    right: String(right),
    bottom: String(bottom),
    left: String(left),
    isLinked: linked
  };
}

function gap(size) {
  return {
    column: String(size),
    row: String(size),
    unit: "px",
    isLinked: true
  };
}

function resetBox() {
  return {
    _margin: spacing(0, 0, 0, 0),
    _margin_tablet: spacing(0, 0, 0, 0),
    _margin_mobile: spacing(0, 0, 0, 0),
    _padding: spacing(0, 0, 0, 0),
    _padding_tablet: spacing(0, 0, 0, 0),
    _padding_mobile: spacing(0, 0, 0, 0)
  };
}

function container(settings, elements = [], isInner = true) {
  return {
    id: id(),
    elType: "container",
    isInner,
    settings: {
      _margin: spacing(0, 0, 0, 0),
      _margin_tablet: spacing(0, 0, 0, 0),
      _margin_mobile: spacing(0, 0, 0, 0),
      ...settings
    },
    elements
  };
}

function section(settings, elements = []) {
  return container({
    content_width: "full",
    flex_direction: "column",
    html_tag: "section",
    stretch_section: "section-stretched",
    width: pct(100),
    width_tablet: pct(100),
    width_mobile: pct(100),
    padding: spacing(80, 24, 80, 24),
    padding_tablet: spacing(64, 22, 64, 22),
    padding_mobile: spacing(48, 16, 48, 16),
    ...settings
  }, elements, false);
}

function boxed(elements, width = 1160, settings = {}) {
  return container({
    content_width: "boxed",
    boxed_width: px(width),
    boxed_width_tablet: px(Math.min(width, 960)),
    boxed_width_mobile: pct(100),
    flex_direction: "column",
    flex_gap: gap(24),
    ...settings
  }, elements);
}

function row(elements, settings = {}) {
  return container({
    content_width: "full",
    flex_direction: "row",
    flex_wrap: "wrap",
    align_items: "center",
    flex_gap: gap(28),
    flex_gap_tablet: gap(22),
    flex_gap_mobile: gap(18),
    ...settings
  }, elements);
}

function column(width, elements, settings = {}) {
  return container({
    content_width: "full",
    width: pct(width),
    width_tablet: pct(100),
    width_mobile: pct(100),
    flex_direction: "column",
    flex_gap: gap(16),
    box_sizing: "border-box",
    ...settings
  }, elements);
}

function widget(widgetType, settings = {}) {
  return {
    id: id(),
    elType: "widget",
    widgetType,
    settings: { ...resetBox(), ...settings },
    elements: []
  };
}

function heading(title, tag = "h2", settings = {}) {
  return widget("heading", {
    title,
    header_size: tag,
    title_color: colors.dark,
    typography_typography: "custom",
    typography_font_family: "Inter",
    typography_font_size: px(tag === "h1" ? 58 : 40),
    typography_font_size_tablet: px(tag === "h1" ? 46 : 34),
    typography_font_size_mobile: px(tag === "h1" ? 36 : 29),
    typography_font_weight: "700",
    typography_line_height: { unit: "em", size: 1.12, sizes: [] },
    ...settings
  });
}

function text(editor, settings = {}) {
  return widget("text-editor", {
    editor,
    text_color: colors.muted,
    typography_typography: "custom",
    typography_font_family: "Inter",
    typography_font_size: px(17),
    typography_font_size_tablet: px(16),
    typography_font_size_mobile: px(15),
    typography_font_weight: "400",
    typography_line_height: { unit: "em", size: 1.7, sizes: [] },
    ...settings
  });
}

function button(label, url, style = "primary") {
  const primary = style === "primary";
  return widget("button", {
    text: label,
    link: { url },
    align: "left",
    align_mobile: "center",
    selected_icon: { value: "fas fa-arrow-right", library: "fa-solid" },
    icon_align: "right",
    button_text_color: primary ? colors.white : colors.orangeDark,
    background_color: primary ? colors.orange : colors.white,
    button_background_hover_color: primary ? colors.orangeDark : colors.creamDeep,
    button_text_hover_color: primary ? colors.white : colors.brown,
    border_border: "solid",
    border_width: spacing(1, 1, 1, 1, true),
    border_color: primary ? colors.orange : colors.creamDeep,
    border_radius: spacing(999, 999, 999, 999, true),
    text_padding: spacing(14, 24, 14, 24),
    typography_typography: "custom",
    typography_font_family: "Inter",
    typography_font_size: px(14),
    typography_font_weight: "700"
  });
}

function dynamicTag(name, settings = {}) {
  return `[elementor-tag id="" name="${name}" settings="${encodeURIComponent(JSON.stringify(settings))}"]`;
}

function postTitle(settings = {}) {
  return widget("theme-post-title", {
    title: "Article title",
    __dynamic__: { title: dynamicTag("post-title") },
    title_color: colors.dark,
    typography_typography: "custom",
    typography_font_family: "Inter",
    typography_font_size: px(58),
    typography_font_size_tablet: px(46),
    typography_font_size_mobile: px(34),
    typography_font_weight: "750",
    typography_line_height: { unit: "em", size: 1.12, sizes: [] },
    ...settings
  });
}

function postInfo(settings = {}) {
  return widget("post-info", {
    icon_list: [
      {
        _id: id(),
        type: "date",
        selected_icon: { value: "far fa-calendar-alt", library: "fa-regular" },
        date_format: "custom",
        custom_date_format: "F j, Y"
      },
      {
        _id: id(),
        type: "terms",
        taxonomy: "category",
        selected_icon: { value: "far fa-folder-open", library: "fa-regular" }
      }
    ],
    icon_align: "center",
    icon_color: colors.orange,
    text_color: colors.brown,
    icon_typography_typography: "custom",
    icon_typography_font_family: "Inter",
    icon_typography_font_size: px(13),
    icon_typography_font_weight: "650",
    icon_typography_text_transform: "uppercase",
    icon_typography_letter_spacing: px(0.6),
    ...settings
  });
}

function featuredImage(settings = {}) {
  return widget("theme-post-featured-image", {
    __dynamic__: {
      image: dynamicTag("post-featured-image"),
      link: dynamicTag("post-url")
    },
    image_size: "full",
    link_to: "custom",
    width: pct(100),
    image_border_radius: spacing(20, 20, 20, 20, true),
    "object-fit": "cover",
    ...settings
  });
}

function buildArchivePage() {
  const loopGrid = widget("loop-grid", {
    template_id: "480",
    columns: 3,
    columns_tablet: 2,
    columns_mobile: 1,
    posts_per_page: 9,
    equal_height: "yes",
    pagination_type: "load_more_on_click",
    text: "Load More Guides",
    load_more_no_posts_custom_message: "You have reached the end of our pet care guides.",
    nothing_found_message_text: "More practical pet care guides are coming soon.",
    column_gap: px(28),
    column_gap_tablet: px(22),
    column_gap_mobile: px(18),
    row_gap: px(34),
    row_gap_tablet: px(28),
    row_gap_mobile: px(22),
    load_more_spinner_color: colors.orange,
    load_more_text_color: colors.white,
    load_more_background_color: colors.orange,
    load_more_border_radius: spacing(999, 999, 999, 999, true),
    load_more_padding: spacing(13, 24, 13, 24),
    load_more_typography_typography: "custom",
    load_more_typography_font_family: "Inter",
    load_more_typography_font_weight: "700"
  });

  const data = [
    section({
      background_background: "classic",
      background_color: colors.cream,
      padding: spacing(90, 24, 88, 24),
      padding_tablet: spacing(72, 22, 70, 22),
      padding_mobile: spacing(56, 16, 54, 16)
    }, [boxed([
      text("<p>SMS PET GROOMING &nbsp;•&nbsp; PRACTICAL PET CARE IN DUBAI</p>", {
        align: "center",
        text_color: colors.orangeDark,
        typography_font_size: px(12),
        typography_font_weight: "750",
        typography_letter_spacing: px(1.7)
      }),
      heading("The Pet Care Journal", "h1", {
        align: "center",
        typography_font_size: px(64),
        typography_font_size_tablet: px(50),
        typography_font_size_mobile: px(38),
        typography_font_weight: "800"
      }),
      text("<p>Helpful, veterinarian-conscious grooming guidance for happier dogs, cats, birds, and rabbits across Dubai.</p>", {
        align: "center",
        text_color: colors.brown,
        typography_font_size: px(18),
        typography_font_size_mobile: px(16),
        _padding: spacing(0, 160, 0, 160),
        _padding_tablet: spacing(0, 80, 0, 80),
        _padding_mobile: spacing(0, 0, 0, 0)
      }),
      row([
        button("Book Mobile Grooming", "#book-blog-cta", "primary"),
        button("Explore Our Services", "/#services", "secondary")
      ], {
        flex_justify_content: "center",
        flex_gap: gap(12),
        flex_gap_mobile: gap(10)
      })
    ], 920, { align_items: "center", flex_gap: gap(20) })]),

    section({
      background_background: "classic",
      background_color: colors.paper,
      padding: spacing(82, 24, 92, 24),
      padding_tablet: spacing(66, 22, 72, 22),
      padding_mobile: spacing(52, 16, 58, 16)
    }, [boxed([
      text("<p>LATEST ARTICLES</p>", {
        align: "center",
        text_color: colors.orangeDark,
        typography_font_size: px(12),
        typography_font_weight: "750",
        typography_letter_spacing: px(1.7)
      }),
      heading("Clear Advice for Better Grooming Days", "h2", { align: "center" }),
      text("<p>From coat care and climate-friendly routines to preparing for an at-home appointment, every guide is written to make pet care feel simpler.</p>", {
        align: "center",
        _padding: spacing(0, 180, 18, 180),
        _padding_tablet: spacing(0, 70, 14, 70),
        _padding_mobile: spacing(0, 0, 8, 0)
      }),
      loopGrid
    ], 1180, { flex_gap: gap(18) })]),

    section({
      _element_id: "book-blog-cta",
      background_background: "classic",
      background_color: colors.brown,
      padding: spacing(64, 24, 64, 24),
      padding_tablet: spacing(54, 22, 54, 22),
      padding_mobile: spacing(44, 16, 44, 16)
    }, [boxed([
      row([
        column(68, [
          text("<p>READY FOR A CALMER GROOMING DAY?</p>", {
            text_color: colors.creamDeep,
            typography_font_size: px(12),
            typography_font_weight: "750",
            typography_letter_spacing: px(1.5)
          }),
          heading("Bring Professional Pet Grooming Home", "h2", {
            title_color: colors.white,
            typography_font_size: px(38),
            typography_font_size_mobile: px(29)
          }),
          text("<p>Choose your pet, select a package, and let our mobile team bring the grooming setup to your Dubai home.</p>", {
            text_color: "#F4E8DA"
          })
        ]),
        column(27, [button("Book an Appointment", "/#booking", "primary")], {
          align_items: "flex-end",
          flex_align_items_tablet: "flex-start",
          flex_align_items_mobile: "center"
        })
      ], { flex_justify_content: "space-between" })
    ], 1120)])
  ];

  return {
    title: "Blog",
    slug: "blog",
    status: "publish",
    template: "elementor_header_footer",
    page_settings: {},
    elementor_data: data
  };
}

function buildLoopTemplate() {
  const image = featuredImage({
    image_border_radius: spacing(18, 18, 0, 0),
    height: px(245),
    height_tablet: px(225),
    height_mobile: px(230)
  });
  const info = postInfo({
    icon_list: [{
      _id: id(),
      type: "date",
      selected_icon: { value: "far fa-calendar-alt", library: "fa-regular" },
      date_format: "custom",
      custom_date_format: "M j, Y"
    }],
    icon_align: "left",
    icon_color: colors.orange,
    text_color: colors.orangeDark,
    icon_typography_font_size: px(12)
  });
  const title = postTitle({
    __dynamic__: {
      title: dynamicTag("post-title"),
      link: dynamicTag("post-url")
    },
    typography_font_size: px(22),
    typography_font_size_tablet: px(20),
    typography_font_size_mobile: px(21),
    typography_font_weight: "750",
    typography_line_height: { unit: "em", size: 1.3, sizes: [] },
    title_hover_color: colors.orangeDark
  });
  const excerpt = text("Article excerpt", {
    __dynamic__: { editor: dynamicTag("post-excerpt", { max_length: "125" }) },
    typography_font_size: px(14),
    typography_line_height: { unit: "em", size: 1.65, sizes: [] }
  });
  const readMore = widget("button", {
    text: "Read Guide",
    __dynamic__: { link: dynamicTag("post-url") },
    align: "left",
    selected_icon: { value: "fas fa-arrow-right", library: "fa-solid" },
    icon_align: "right",
    button_text_color: colors.orangeDark,
    background_color: "#FFFFFF00",
    button_background_hover_color: "#FFFFFF00",
    button_text_hover_color: colors.dark,
    text_padding: spacing(0, 0, 0, 0),
    typography_typography: "custom",
    typography_font_family: "Inter",
    typography_font_size: px(13),
    typography_font_weight: "750"
  });

  return {
    title: "Blog Loop",
    type: "loop-item",
    conditions: [],
    elementor_data: [container({
      content_width: "full",
      flex_direction: "column",
      height: pct(100),
      background_background: "classic",
      background_color: colors.white,
      border_radius: spacing(18, 18, 18, 18, true),
      box_shadow_box_shadow_type: "yes",
      box_shadow_box_shadow: { horizontal: 0, vertical: 12, blur: 32, spread: -18, color: "rgba(49,31,14,0.28)" },
      overflow: "hidden",
      padding: spacing(0, 0, 0, 0),
      padding_tablet: spacing(0, 0, 0, 0),
      padding_mobile: spacing(0, 0, 0, 0)
    }, [
      image,
      container({
        content_width: "full",
        flex_direction: "column",
        flex_grow: 1,
        flex_gap: gap(13),
        padding: spacing(22, 22, 24, 22),
        padding_tablet: spacing(20, 20, 22, 20),
        padding_mobile: spacing(20, 20, 22, 20)
      }, [info, title, excerpt, readMore])
    ], false)]
  };
}

function buildSingleTemplate() {
  const hero = section({
    background_background: "classic",
    background_color: colors.cream,
    padding: spacing(78, 24, 70, 24),
    padding_tablet: spacing(64, 22, 58, 22),
    padding_mobile: spacing(50, 16, 46, 16)
  }, [boxed([
    text("<p>SMS PET GROOMING &nbsp;•&nbsp; PET CARE GUIDE</p>", {
      align: "center",
      text_color: colors.orangeDark,
      typography_font_size: px(12),
      typography_font_weight: "750",
      typography_letter_spacing: px(1.6)
    }),
    postTitle({ align: "center" }),
    postInfo({ icon_align: "center" }),
    text("Article excerpt", {
      __dynamic__: { editor: dynamicTag("post-excerpt", { max_length: "180" }) },
      align: "center",
      text_color: colors.brown,
      typography_font_size: px(18),
      typography_font_size_mobile: px(16),
      _padding: spacing(0, 110, 0, 110),
      _padding_tablet: spacing(0, 60, 0, 60),
      _padding_mobile: spacing(0, 0, 0, 0)
    })
  ], 980, { align_items: "center", flex_gap: gap(18) })]);

  const imageSection = section({
    background_background: "classic",
    background_color: colors.paper,
    padding: spacing(48, 24, 30, 24),
    padding_tablet: spacing(38, 22, 24, 22),
    padding_mobile: spacing(28, 16, 18, 16)
  }, [boxed([featuredImage({
    height: px(580),
    height_tablet: px(440),
    height_mobile: px(250)
  })], 1120)]);

  const content = widget("theme-post-content", {
    text_color: colors.dark,
    typography_typography: "custom",
    typography_font_family: "Inter",
    typography_font_size: px(17),
    typography_font_size_tablet: px(16),
    typography_font_size_mobile: px(15),
    typography_font_weight: "400",
    typography_line_height: { unit: "em", size: 1.8, sizes: [] },
    link_color: colors.orangeDark,
    link_hover_color: colors.brown
  });
  const share = widget("share-buttons", {
    share_buttons: [
      { button: "facebook", _id: id() },
      { button: "twitter", _id: id() },
      { button: "whatsapp", _id: id() }
    ],
    skin: "minimal",
    alignment: "left",
    alignment_mobile: "center",
    color_source: "custom",
    primary_color: colors.orange,
    secondary_color: colors.white,
    button_size: px(1),
    icon_size: { unit: "em", size: 1.15, sizes: [] }
  });
  const navigation = widget("post-navigation", {
    prev_label: "Previous guide",
    next_label: "Next guide",
    show_arrow: "yes",
    show_title: "yes",
    in_same_term: ["post"],
    post_taxonomy: "category",
    label_color: colors.orangeDark,
    label_hover_color: colors.dark,
    text_color: colors.dark,
    sep_color: colors.creamDeep,
    borders_color: colors.creamDeep,
    borders_width: px(1),
    label_typography_typography: "custom",
    label_typography_font_family: "Inter",
    label_typography_font_size: px(12),
    label_typography_font_weight: "700",
    title_typography_typography: "custom",
    title_typography_font_family: "Inter",
    title_typography_font_size: px(16),
    title_typography_font_weight: "650"
  });
  const sidebar = column(29, [
    text("<p>NEED A GROOMER?</p>", {
      text_color: colors.orangeDark,
      typography_font_size: px(12),
      typography_font_weight: "750",
      typography_letter_spacing: px(1.4)
    }),
    heading("Professional Pet Care at Your Door", "h3", {
      typography_font_size: px(27),
      typography_font_size_mobile: px(25),
      typography_font_weight: "750"
    }),
    text("<p>Our mobile team brings the grooming setup to your Dubai home for dogs, cats, birds, and rabbits.</p>", {
      typography_font_size: px(15)
    }),
    widget("icon-list", {
      icon_list: [
        { text: "Home-based convenience", selected_icon: { value: "fas fa-check", library: "fa-solid" }, _id: id() },
        { text: "Clear grooming packages", selected_icon: { value: "fas fa-check", library: "fa-solid" }, _id: id() },
        { text: "Simple WhatsApp booking", selected_icon: { value: "fas fa-check", library: "fa-solid" }, _id: id() }
      ],
      icon_color: colors.green,
      text_color: colors.dark,
      icon_typography_typography: "custom",
      icon_typography_font_family: "Inter",
      icon_typography_font_size: px(14),
      space_between: px(12)
    }),
    button("Book Mobile Grooming", "/#booking", "primary")
  ], {
    background_background: "classic",
    background_color: colors.cream,
    border_radius: spacing(18, 18, 18, 18, true),
    padding: spacing(28, 28, 28, 28),
    padding_tablet: spacing(26, 26, 26, 26),
    padding_mobile: spacing(24, 22, 24, 22),
    align_self: "flex-start"
  });

  const contentSection = section({
    background_background: "classic",
    background_color: colors.paper,
    padding: spacing(38, 24, 80, 24),
    padding_tablet: spacing(30, 22, 64, 22),
    padding_mobile: spacing(22, 16, 52, 16)
  }, [boxed([
    row([
      column(66, [content, share, navigation], { flex_gap: gap(28) }),
      sidebar
    ], { align_items: "flex-start", flex_justify_content: "space-between" })
  ], 1120)]);

  const related = section({
    background_background: "classic",
    background_color: colors.cream,
    padding: spacing(72, 24, 82, 24),
    padding_tablet: spacing(60, 22, 66, 22),
    padding_mobile: spacing(48, 16, 54, 16)
  }, [boxed([
    text("<p>KEEP READING</p>", {
      align: "center",
      text_color: colors.orangeDark,
      typography_font_size: px(12),
      typography_font_weight: "750",
      typography_letter_spacing: px(1.5)
    }),
    heading("More Practical Pet Care Guides", "h2", { align: "center" }),
    widget("posts", {
      classic_columns: "3",
      classic_columns_tablet: "2",
      classic_columns_mobile: "1",
      classic_posts_per_page: 3,
      classic_thumbnail_size_size: "medium_large",
      classic_excerpt_length: 16,
      classic_meta_data: ["date"],
      classic_show_read_more: "yes",
      classic_read_more_text: "Read Guide",
      classic_column_gap: px(24),
      classic_row_gap: px(28),
      classic_item_ratio: { unit: "px", size: 0.58, sizes: [] },
      classic_content_padding: spacing(18, 18, 22, 18),
      classic_title_color: colors.dark,
      classic_title_typography_typography: "custom",
      classic_title_typography_font_family: "Inter",
      classic_title_typography_font_size: px(19),
      classic_title_typography_font_weight: "700",
      classic_meta_color: colors.orangeDark,
      classic_excerpt_color: colors.muted,
      classic_read_more_color: colors.orangeDark,
      posts_exclude: ["current_post"],
      posts_related_taxonomies: ["category"]
    })
  ], 1120, { flex_gap: gap(18) })]);

  return {
    title: "Blog Single Page",
    type: "single-post",
    conditions: ["include/singular/post"],
    elementor_data: [hero, imageSection, contentSection, related]
  };
}

for (const file of ["blog-page-474.json", "blog-loop-480.json", "single-post-521.json"]) {
  if (!fs.existsSync(path.join(baselineDir, file))) {
    throw new Error(`Missing protected blog baseline: ${file}`);
  }
}

const baselineChecks = [
  ["blog-page-474.json", 474],
  ["blog-loop-480.json", 480],
  ["single-post-521.json", 521]
];
for (const [file, expectedId] of baselineChecks) {
  const baseline = readJson(path.join(baselineDir, file));
  if (baseline.id !== expectedId) throw new Error(`${file} is not the expected live baseline.`);
}

const archivePage = buildArchivePage();
const loopTemplate = buildLoopTemplate();
const singleTemplate = buildSingleTemplate();
const themeArchiveTemplate = {
  title: "SMS Pet Blog Archive - 2026",
  type: "archive",
  conditions: ["include/archive"],
  elementor_data: JSON.parse(JSON.stringify(archivePage.elementor_data))
};
const themeSingleTemplate = {
  ...JSON.parse(JSON.stringify(singleTemplate)),
  title: "SMS Pet Blog Single - 2026"
};

const outputs = [
  ["sms-pet-blog-archive.payload.json", archivePage],
  ["sms-pet-blog-loop.payload.json", loopTemplate],
  ["sms-pet-blog-single.payload.json", singleTemplate],
  ["sms-pet-blog-theme-archive.payload.json", themeArchiveTemplate],
  ["sms-pet-blog-theme-single.payload.json", themeSingleTemplate]
];

for (const [file, payload] of outputs) {
  writeJson(path.join(outputDir, file), payload);
}

console.log(JSON.stringify({
  ok: true,
  outputs: outputs.map(([file, payload]) => ({
    file: path.relative(root, path.join(outputDir, file)),
    title: payload.title,
    top_level_sections: payload.elementor_data.length
  }))
}, null, 2));
