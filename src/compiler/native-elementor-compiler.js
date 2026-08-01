#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { solveGrid, solveSplit, solveInlineCluster } = require("./layout-solver");

let idCounter = 1;

function nextId() {
  const value = (idCounter++).toString(16).padStart(7, "0");
  return value.slice(-7);
}

function cleanText(value) {
  if (value === undefined || value === null) return "";
  return String(value)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-");
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
    _margin: spacing(0, 0, 0, 0, false),
    _margin_tablet: spacing(0, 0, 0, 0, false),
    _margin_mobile: spacing(0, 0, 0, 0, false),
    _padding: spacing(0, 0, 0, 0, false),
    _padding_tablet: spacing(0, 0, 0, 0, false),
    _padding_mobile: spacing(0, 0, 0, 0, false)
  };
}

function element(base) {
  return {
    id: nextId(),
    ...base
  };
}

function container(settings, children = [], isInner = true) {
  return element({
    elType: "container",
    isInner,
    settings: {
      _margin: spacing(0, 0, 0, 0, false),
      _margin_tablet: spacing(0, 0, 0, 0, false),
      _margin_mobile: spacing(0, 0, 0, 0, false),
      ...settings
    },
    elements: children
  });
}

function section(settings, children = []) {
  return container(
    {
      content_width: "full",
      flex_direction: "column",
      html_tag: "section",
      stretch_section: "section-stretched",
      width: pct(100),
      width_tablet: pct(100),
      width_mobile: pct(100),
      padding: spacing(80, 24, 80, 24),
      padding_tablet: spacing(64, 24, 64, 24),
      padding_mobile: spacing(48, 16, 48, 16),
      ...settings
    },
    children,
    false
  );
}

function boxed(children = [], width = 1200, settings = {}) {
  return container(
    {
      content_width: "boxed",
      boxed_width: px(width),
      boxed_width_tablet: px(Math.min(width, 960)),
      boxed_width_mobile: pct(100),
      flex_direction: "column",
      ...settings
    },
    children,
    true
  );
}

function row(children = [], settings = {}) {
  return container(
    {
      content_width: "full",
      flex_direction: "row",
      flex_wrap: "wrap",
      flex_gap: gap(32),
      flex_gap_tablet: gap(24),
      flex_gap_mobile: gap(20),
      align_items: "center",
      ...settings
    },
    children,
    true
  );
}

function column(width, children = [], settings = {}) {
  return container(
    {
      content_width: "full",
      width: pct(width),
      width_tablet: pct(100),
      width_mobile: pct(100),
      flex_direction: "column",
      flex_gap: gap(16),
      box_sizing: "border-box",
      ...settings
    },
    children,
    true
  );
}

function widget(widgetType, settings = {}) {
  return element({
    elType: "widget",
    widgetType,
    settings: {
      ...resetBox(),
      ...settings
    },
    elements: []
  });
}

function headingGroup(content, design, options = {}) {
  const align = options.align || "center";
  const width = options.width || 760;
  const titleSize = options.titleSize || "h2";

  return boxed(
    [
      eyebrow(content.eyebrow, design, options.eyebrowColor),
      heading(content.title, titleSize, design, {
        align,
        align_mobile: align
      }),
      text(content.body || "", design, {
        align,
        align_mobile: align
      })
    ],
    width,
    {
      flex_gap: gap(12),
      align_items: "center",
      flex_align_items: "center"
    }
  );
}

function rowFromPlan(children, plan, overrides = {}) {
  const rowPlan = plan.row || plan;
  return row(children, {
    align_items: rowPlan.align || "center",
    flex_justify_content: rowPlan.justify || "flex-start",
    flex_justify_content_mobile: rowPlan.justifyMobile || rowPlan.justify || "center",
    flex_gap: gap(rowPlan.desktopGap),
    flex_gap_tablet: gap(rowPlan.tabletGap),
    flex_gap_mobile: gap(rowPlan.mobileGap),
    ...overrides
  });
}

function heading(title, size, design, overrides = {}) {
  const scale = {
    h1: [44, 36, 28, "700"],
    h2: [36, 30, 24, "700"],
    h3: [24, 22, 20, "700"],
    h4: [20, 19, 18, "700"],
    h6: [13, 13, 12, "700"]
  };
  const [desktop, tablet, mobile, weight] = scale[size] || scale.h2;
  return widget("heading", {
    title: cleanText(title),
    header_size: size,
    title_color: design.colors.dark,
    typography_typography: "custom",
    typography_font_family: design.fonts.heading,
    typography_font_size: px(desktop),
    typography_font_size_tablet: px(tablet),
    typography_font_size_mobile: px(mobile),
    typography_font_weight: weight,
    typography_line_height: { unit: "em", size: 1.18, sizes: [] },
    ...overrides
  });
}

function text(body, design, overrides = {}) {
  return widget("text-editor", {
    editor: `<p>${cleanText(body)}</p>`,
    text_color: design.colors.muted || "#66736F",
    typography_typography: "custom",
    typography_font_family: design.fonts.body,
    typography_font_size: px(16),
    typography_font_size_mobile: px(15),
    typography_line_height: { unit: "em", size: 1.7, sizes: [] },
    ...overrides
  });
}

function richText(markup, design, overrides = {}) {
  return widget("text-editor", {
    editor: markup || "",
    text_color: design.colors.muted || "#66736F",
    typography_typography: "custom",
    typography_font_family: design.fonts.body,
    typography_font_size: px(16),
    typography_font_size_mobile: px(15),
    typography_line_height: { unit: "em", size: 1.7, sizes: [] },
    ...overrides
  });
}

function button(data, design, kind = "primary", overrides = {}) {
  const isPrimary = kind === "primary";
  return widget("button", {
    text: cleanText(data && data.text ? data.text : "Learn More"),
    link: { url: data && data.url ? data.url : "/" },
    size: "md",
    background_color: isPrimary ? design.colors.primary : "transparent",
    button_text_color: isPrimary ? "#FFFFFF" : design.colors.primary,
    border_border: isPrimary ? "" : "solid",
    border_width: isPrimary ? undefined : spacing(1, 1, 1, 1, true),
    border_color: isPrimary ? undefined : design.colors.primary,
    border_radius: spacing(8, 8, 8, 8, true),
    text_padding: spacing(14, 26, 14, 26),
    text_padding_mobile: spacing(12, 22, 12, 22),
    typography_typography: "custom",
    typography_font_family: design.fonts.body,
    typography_font_weight: "700",
    ...overrides
  });
}

function navLink(data, design, overrides = {}) {
  return heading(data && data.label ? data.label : "Link", "h6", design, {
    header_size: "span",
    link: { url: data && data.url ? data.url : "/" },
    title_color: overrides.title_color || design.colors.dark,
    typography_font_family: design.fonts.body,
    typography_font_size: px(14),
    typography_font_size_tablet: px(14),
    typography_font_size_mobile: px(13),
    typography_font_weight: "700",
    typography_text_transform: "none",
    typography_letter_spacing: px(0),
    align: "center",
    align_mobile: "center",
    ...overrides
  });
}

function navMenu(data, design, overrides = {}) {
  return widget("nav-menu", {
    menu: data && data.menu ? data.menu : "",
    layout: data && data.layout ? data.layout : "horizontal",
    pointer: "none",
    breakpoint: data && data.breakpoint ? data.breakpoint : "tablet",
    full_width: "stretch",
    align_items: "flex-end",
    align_items_tablet: "flex-end",
    align_items_mobile: "flex-end",
    toggle_align: "right",
    toggle_align_tablet: "right",
    toggle_align_mobile: "right",
    dropdown_align: "right",
    text_align: "right",
    color_menu_item: design.colors.dark,
    color_menu_item_hover: design.colors.primary,
    color_menu_item_active: design.colors.primary,
    background_color_dropdown_item: "#FFFFFF",
    color_dropdown_item: design.colors.dark,
    color_dropdown_item_hover: design.colors.primary,
    typography_typography: "custom",
    typography_font_family: design.fonts.body,
    typography_font_size: px(14),
    typography_font_size_tablet: px(14),
    typography_font_size_mobile: px(15),
    typography_font_weight: "700",
    typography_line_height: { unit: "em", size: 1.2, sizes: [] },
    dropdown_typography_typography: "custom",
    dropdown_typography_font_family: design.fonts.body,
    dropdown_typography_font_size: px(15),
    dropdown_typography_font_weight: "700",
    toggle_color: design.colors.dark,
    toggle_background_color: "transparent",
    toggle_size: px(24),
    ...overrides
  });
}

function image(data, overrides = {}) {
  return widget("image", {
    image: {
      url: data && data.url ? data.url : "https://picsum.photos/900/700",
      id: "",
      size: ""
    },
    image_size: "full",
    image_border_radius: spacing(18, 18, 18, 18, true),
    ...overrides
  });
}

function shortcodeWidget(value, overrides = {}) {
  return widget("shortcode", {
    shortcode: value || "[replace_shortcode_here]",
    ...overrides
  });
}

function icon(iconClass, design) {
  return widget("icon", {
    selected_icon: {
      value: iconClass || "fas fa-paw",
      library: "fa-solid"
    },
    primary_color: design.colors.primary,
    size: px(34),
    align: "left",
    align_mobile: "left"
  });
}

function listMarkup(items = []) {
  return `<ul>${items.map((item) => `<li>${cleanText(item)}</li>`).join("")}</ul>`;
}

function reviewImage(data) {
  if (!data || !data.url) return null;
  return image(data, {
    image_border_radius: spacing(0, 0, 0, 0, true),
    align: "left",
    align_mobile: "center",
    width: {
      unit: "px",
      size: data.width || 240,
      sizes: []
    }
  });
}

function cardShadow() {
  return {
    box_shadow_box_shadow_type: "yes",
    box_shadow_box_shadow: {
      horizontal: 0,
      vertical: 14,
      blur: 32,
      spread: -18,
      color: "rgba(31,30,30,0.22)"
    }
  };
}

function eyebrow(value, design, color) {
  return heading(value, "h6", design, {
    title_color: color || design.colors.secondary,
    typography_text_transform: "uppercase",
    typography_letter_spacing: px(1.4)
  });
}

function compileHeroSplit(sectionData, design) {
  const c = sectionData.content;
  const buttonPlan = solveInlineCluster({
    justify: "flex-start",
    justifyMobile: "center",
    desktopGap: 16,
    tabletGap: 16,
    mobileGap: 12
  });
  const splitPlan = solveSplit({
    columns: [55, 40],
    maxTotal: 94,
    desktopGap: 56,
    tabletGap: 32,
    mobileGap: 28
  });
  const buttons = rowFromPlan(
    [
      button(c.primaryButton, design, "primary"),
      button(c.secondaryButton, design, "secondary")
    ],
    buttonPlan
  );

  const textCol = column(
    splitPlan.columns[0],
    [
      eyebrow(c.eyebrow, design),
      heading(c.title, "h1", design, {
        title_color: design.colors.dark,
        align_mobile: "center"
      }),
      text(c.body, design, { align_mobile: "center" }),
      buttons
    ],
    {
      flex_gap: gap(18),
      padding: spacing(8, 0, 8, 0)
    }
  );

  const mediaCol = column(splitPlan.columns[1], [image(c.image)], {
    flex_gap: gap(0)
  });

  return section(
    {
      background_background: "classic",
      background_color: design.colors.light,
      padding: spacing(112, 24, 96, 24),
      padding_tablet: spacing(88, 24, 72, 24),
      padding_mobile: spacing(72, 16, 56, 16)
    },
    [
      boxed([
        rowFromPlan([textCol, mediaCol], splitPlan)
      ])
    ]
  );
}

function compileOfferHero(sectionData, design) {
  const c = sectionData.content || {};
  const buttonPlan = solveInlineCluster({
    justify: "flex-start",
    justifyMobile: "center",
    desktopGap: 16,
    tabletGap: 14,
    mobileGap: 12
  });
  const splitPlan = solveSplit({
    columns: [52, 42],
    maxTotal: 94,
    desktopGap: 42,
    tabletGap: 30,
    mobileGap: 24
  });

  const actions = rowFromPlan([
    button(c.primaryButton, design, "primary"),
    button(c.secondaryButton, design, "secondary")
  ], buttonPlan);

  const offerChildren = [];
  if (c.offer) {
    offerChildren.push(
      container({
        content_width: "full",
        flex_direction: "column",
        background_background: "classic",
        background_color: design.colors.primary,
        border_radius: spacing(999, 999, 999, 999, true),
        padding: spacing(10, 16, 10, 16, true),
        padding_mobile: spacing(10, 14, 10, 14, true)
      }, [
        heading(c.offer, "h6", design, {
          title_color: "#FFFFFF",
          typography_font_family: design.fonts.body,
          typography_font_size: px(13),
          typography_font_size_mobile: px(12),
          align: "center",
          align_mobile: "center"
        })
      ])
    );
  }

  const trustGraphic = reviewImage(c.trustImage);
  if (trustGraphic) {
    offerChildren.push(trustGraphic);
  }

  const copyChildren = [
    eyebrow(c.eyebrow, design, design.colors.accent || design.colors.secondary),
    heading(c.title, "h1", design, {
      title_color: design.colors.dark,
      typography_font_size: px(54),
      typography_font_size_tablet: px(42),
      typography_font_size_mobile: px(31),
      align_mobile: "center"
    }),
    text(c.body, design, {
      text_color: design.colors.dark,
      align_mobile: "center"
    })
  ];

  if (c.price) {
    copyChildren.push(
      heading(c.price, "h3", design, {
        title_color: design.colors.primary,
        typography_font_size: px(30),
        typography_font_size_tablet: px(28),
        typography_font_size_mobile: px(24),
        align_mobile: "center"
      })
    );
  }

  copyChildren.push(...offerChildren, actions);

  const textCol = column(splitPlan.columns[0], copyChildren, {
    flex_gap: gap(16),
    padding: spacing(8, 0, 8, 0),
    align_items: "flex-start",
    flex_align_items_mobile: "center"
  });

  const mediaCol = column(splitPlan.columns[1], [image(c.image, {
    image_border_radius: spacing(28, 28, 28, 28, true)
  })], {
    flex_gap: gap(0)
  });

  return section(
    {
      background_background: "gradient",
      background_color: design.colors.secondary || design.colors.light,
      background_color_b: design.colors.light || "#FFF8F1",
      ...(c.backgroundImage ? {
        background_overlay_background: "classic",
        background_overlay_image: {
          url: c.backgroundImage.url,
          id: "",
          size: ""
        },
        background_overlay_position: c.backgroundImage.position || "bottom right",
        background_overlay_repeat: "no-repeat",
        background_overlay_size: c.backgroundImage.size || "320px auto",
        background_overlay_opacity: {
          unit: "px",
          size: c.backgroundImage.opacity || 0.22,
          sizes: []
        }
      } : {}),
      background_gradient_angle: {
        unit: "deg",
        size: 135,
        sizes: []
      },
      padding: spacing(120, 32, 92, 32),
      padding_tablet: spacing(88, 24, 68, 24),
      padding_mobile: spacing(68, 16, 52, 16)
    },
    [
      boxed([
        rowFromPlan([textCol, mediaCol], splitPlan)
      ], 1500)
    ]
  );
}

function compileStatsBand(sectionData, design) {
  const layout = solveGrid({
    desktopColumns: 4,
    tabletColumns: 2,
    itemCount: sectionData.content.items ? sectionData.content.items.length : 0,
    safetyPercent: 4,
    desktopGap: 0,
    tabletGap: 24,
    mobileGap: 16,
    justify: "space-between",
    align: "stretch"
  });
  const items = (sectionData.content.items || []).map((item) =>
    column(
      layout.column.desktopWidth,
      [
        widget("counter", {
          starting_number: 0,
          ending_number: Number.parseFloat(item.number) || 0,
          suffix: cleanText(item.suffix || ""),
          title: cleanText(item.label),
          number_color: "#FFFFFF",
          title_color: "rgba(255,255,255,0.78)",
          typography_typography: "custom",
          typography_font_family: design.fonts.heading,
          typography_font_size: px(38),
          typography_font_size_tablet: px(32),
          typography_font_size_mobile: px(28),
          typography_font_weight: "800",
          typography_title_typography: "custom",
          typography_title_font_family: design.fonts.body,
          typography_title_font_size: px(14),
          typography_title_font_size_mobile: px(13),
          typography_title_font_weight: "600",
          title_horizontal_alignment: "center",
          title_horizontal_alignment_mobile: "center",
          number_position: "center",
          number_position_mobile: "center"
        })
      ],
      {
        width_tablet: pct(layout.column.tabletWidth),
        width_mobile: pct(layout.column.mobileWidth),
        flex_gap: gap(0),
        align_items: "center",
        flex_align_items: "center"
      }
    )
  );

  return section(
    {
      background_background: "classic",
      background_color: design.colors.primary,
      padding: spacing(48, 24, 48, 24),
      padding_tablet: spacing(40, 24, 40, 24),
      padding_mobile: spacing(36, 16, 36, 16)
    },
    [
      boxed([
        rowFromPlan(items, layout)
      ])
    ]
  );
}

function compileFeatureGrid(sectionData, design) {
  const c = sectionData.content;
  const layout = solveGrid({
    desktopColumns: 3,
    tabletColumns: 2,
    itemCount: c.items ? c.items.length : 0,
    desktopGap: 24,
    tabletGap: 20,
    mobileGap: 16,
    align: "stretch"
  });
  const cards = (c.items || []).map((item) =>
    column(
      layout.column.desktopWidth,
      [
        icon(item.icon, design),
        heading(item.title, "h3", design),
        text(item.body, design)
      ],
      {
        width_tablet: pct(layout.column.tabletWidth),
        width_mobile: pct(layout.column.mobileWidth),
        background_background: "classic",
        background_color: "#FFFFFF",
        border_border: "solid",
        border_width: spacing(1, 1, 1, 1, true),
        border_color: "rgba(21,34,31,0.10)",
        border_radius: spacing(12, 12, 12, 12, true),
        padding: spacing(32, 32, 32, 32, true),
        padding_tablet: spacing(28, 24, 28, 24),
        padding_mobile: spacing(24, 20, 24, 20)
      }
    )
  );

  return section(
    {
      background_background: "classic",
      background_color: "#FFFFFF"
    },
    [
      boxed([
        headingGroup(c, design),
        rowFromPlan(cards, layout)
      ], 1200, { flex_gap: gap(40) })
    ]
  );
}

function compileIconHighlights(sectionData, design) {
  const c = sectionData.content || {};
  const items = c.items || [];
  const layout = solveGrid({
    desktopColumns: Math.min(5, Math.max(3, items.length || 1)),
    tabletColumns: 2,
    itemCount: items.length,
    desktopGap: 14,
    tabletGap: 16,
    mobileGap: 14,
    align: "stretch"
  });

  const cards = items.map((item) =>
    column(layout.column.desktopWidth, [
      widget("icon", {
        selected_icon: {
          value: item.icon || "fas fa-paw",
          library: "fa-solid"
        },
        primary_color: item.color || design.colors.primary,
        size: px(34),
        align: "center",
        align_mobile: "center"
      }),
      heading(item.title, "h4", design, {
        typography_font_family: design.fonts.body,
        typography_font_size: px(16),
        typography_font_size_mobile: px(16),
        typography_line_height: { unit: "em", size: 1.2, sizes: [] },
        align: "center",
        align_mobile: "center"
      }),
      text(item.body, design, {
        typography_font_size: px(13),
        typography_font_size_mobile: px(13),
        typography_line_height: { unit: "em", size: 1.45, sizes: [] },
        align: "center",
        align_mobile: "center"
      })
    ], {
      width_tablet: pct(layout.column.tabletWidth),
      width_mobile: pct(100),
      background_background: "classic",
      background_color: "#FFFFFF",
      border_border: "solid",
      border_width: spacing(1, 1, 1, 1, true),
      border_color: "rgba(0,0,0,0.08)",
      border_radius: spacing(8, 8, 8, 8, true),
      padding: spacing(26, 18, 26, 18, true),
      padding_mobile: spacing(18, 16, 18, 16),
      min_height: px(188),
      ...cardShadow(),
      align_items: "center",
      flex_align_items: "center",
      flex_gap: gap(10)
    })
  );

  return section(
    {
      background_background: "classic",
      background_color: c.background || "#FFFFFF",
      padding: spacing(34, 24, 40, 24),
      padding_tablet: spacing(28, 24, 34, 24),
      padding_mobile: spacing(24, 16, 30, 16)
    },
    [
      boxed([
        rowFromPlan(cards, layout)
      ], 1500)
    ]
  );
}

function compileDesignFoundation(sectionData, design) {
  const c = sectionData.content || {};
  const colors = Object.entries(design.colors || {}).slice(0, 8);
  const swatchLayout = solveGrid({
    desktopColumns: 4,
    tabletColumns: 2,
    itemCount: colors.length,
    desktopGap: 18,
    tabletGap: 16,
    mobileGap: 12,
    align: "stretch"
  });
  const swatches = colors.map(([name, value]) =>
    column(swatchLayout.column.desktopWidth, [
      container({
        content_width: "full",
        flex_direction: "column",
        min_height: px(88),
        background_background: "classic",
        background_color: value,
        border_radius: spacing(8, 8, 8, 8, true),
        border_border: "solid",
        border_width: spacing(1, 1, 1, 1, true),
        border_color: "rgba(0,0,0,0.10)"
      }),
      heading(name, "h6", design, {
        title_color: design.colors.dark,
        typography_font_family: design.fonts.body,
        typography_font_size: px(13)
      }),
      text(value, design, {
        typography_font_size: px(13),
        typography_font_size_mobile: px(13)
      })
    ], {
      width_tablet: pct(swatchLayout.column.tabletWidth),
      width_mobile: pct(100),
      flex_gap: gap(8)
    })
  );

  const typeSamples = column(47, [
    heading(c.typeTitle || "Typography", "h2", design),
    heading(c.headingSample || "Editorial heading sample", "h1", design, {
      typography_font_size: px(40),
      typography_font_size_tablet: px(34),
      typography_font_size_mobile: px(28)
    }),
    text(c.bodySample || "Body copy should feel calm, legible, and easy to edit in Elementor.", design),
    rowFromPlan([
      button({ text: c.primaryButton || "Primary CTA", url: c.primaryUrl || "/" }, design, "primary"),
      button({ text: c.secondaryButton || "Secondary CTA", url: c.secondaryUrl || "/" }, design, "secondary")
    ], solveInlineCluster({ justify: "flex-start", justifyMobile: "center" }))
  ], {
    width_tablet: pct(100),
    width_mobile: pct(100),
    flex_gap: gap(18)
  });

  const colorSamples = column(47, [
    heading(c.colorTitle || "Color System", "h2", design),
    rowFromPlan(swatches, swatchLayout)
  ], {
    width_tablet: pct(100),
    width_mobile: pct(100),
    flex_gap: gap(18)
  });

  return section(
    {
      background_background: "classic",
      background_color: "#FFFFFF"
    },
    [
      boxed([
        headingGroup({
          eyebrow: c.eyebrow || "Design System",
          title: c.title || "Reusable visual foundation",
          body: c.body || "This page records the type, color, button, card, image, and section patterns the generated site should reuse."
        }, design),
        rowFromPlan([typeSamples, colorSamples], solveSplit({
          columns: [47, 47],
          maxTotal: 94,
          desktopGap: 48,
          tabletGap: 28,
          mobileGap: 24
        }))
      ], 1200, { flex_gap: gap(44) })
    ]
  );
}

function compileInfoColumns(sectionData, design) {
  const c = sectionData.content || {};
  const columns = c.columns || [];
  const layout = solveGrid({
    desktopColumns: Math.min(3, Math.max(1, columns.length || 1)),
    tabletColumns: 1,
    itemCount: columns.length,
    desktopGap: 24,
    tabletGap: 20,
    mobileGap: 18,
    align: "stretch"
  });

  const items = columns.map((col) => {
    const detailItems = (col.items || []).map((item) =>
      container({
        content_width: "full",
        flex_direction: "column",
        background_background: "classic",
        background_color: c.innerBackground || design.colors.light,
        border_radius: spacing(8, 8, 8, 8, true),
        padding: spacing(22, 22, 22, 22, true),
        padding_mobile: spacing(16, 16, 16, 16),
        min_height: px(132),
        flex_gap: gap(8)
      }, [
        heading(item.title, "h4", design, {
          typography_font_size: px(17),
          typography_font_size_mobile: px(16),
          typography_line_height: { unit: "em", size: 1.25, sizes: [] }
        }),
        text(item.body, design, {
          typography_font_size: px(14),
          typography_font_size_mobile: px(14),
          typography_line_height: { unit: "em", size: 1.55, sizes: [] }
        })
      ])
    );

    return column(layout.column.desktopWidth, [
      heading(col.title, "h3", design, {
        typography_font_size: px(24),
        typography_font_size_mobile: px(21)
      }),
      ...detailItems
    ], {
      width_tablet: pct(100),
      width_mobile: pct(100),
      background_background: "classic",
      background_color: "#FFFFFF",
      border_border: "solid",
      border_width: spacing(1, 1, 1, 1, true),
      border_color: "rgba(0,0,0,0.08)",
      border_radius: spacing(10, 10, 10, 10, true),
      padding: spacing(28, 24, 28, 24, true),
      padding_mobile: spacing(22, 18, 22, 18),
      ...cardShadow(),
      flex_gap: gap(16)
    });
  });

  return section(
    {
      background_background: "classic",
      background_color: c.background || "#F8EFE7"
    },
    [
      boxed([
        headingGroup({
          eyebrow: c.eyebrow,
          title: c.title,
          body: c.body
        }, design),
        rowFromPlan(items, layout)
      ], c.width || 1180, { flex_gap: gap(36) })
    ]
  );
}

function compileGalleryGrid(sectionData, design) {
  const c = sectionData.content || {};
  const images = c.images || [];
  const layout = solveGrid({
    desktopColumns: 3,
    tabletColumns: 2,
    itemCount: images.length,
    desktopGap: 20,
    tabletGap: 16,
    mobileGap: 14,
    align: "stretch"
  });
  const cards = images.map((item) =>
    column(layout.column.desktopWidth, [
      image(item, {
        image_border_radius: spacing(8, 8, 8, 8, true)
      }),
      ...(item.caption ? [heading(item.caption, "h4", design)] : [])
    ], {
      width_tablet: pct(layout.column.tabletWidth),
      width_mobile: pct(100),
      flex_gap: gap(12)
    })
  );

  return section(
    {
      background_background: "classic",
      background_color: design.colors.light || "#F6F1EA"
    },
    [
      boxed([
        headingGroup({
          eyebrow: c.eyebrow || "Gallery",
          title: c.title || "Image rhythm",
          body: c.body || "A reusable gallery pattern for visual proof and portfolio sections."
        }, design),
        rowFromPlan(cards, layout)
      ], 1200, { flex_gap: gap(40) })
    ]
  );
}

function compilePricingCards(sectionData, design) {
  const c = sectionData.content || {};
  const cardsData = c.cards || [];
  const desktopColumns = c.columns || Math.min(4, Math.max(2, cardsData.length || 1));
  const layout = solveGrid({
    desktopColumns,
    tabletColumns: 2,
    itemCount: cardsData.length,
    desktopGap: c.gap || 24,
    tabletGap: 18,
    mobileGap: 16,
    align: "stretch"
  });

  const cards = cardsData.map((item) => {
    const featureMarkup = item.features && item.features.length
      ? listMarkup(item.features)
      : "<p>Package details will be updated here.</p>";
    const borderColor = item.color || design.colors.primary;

    const children = [];
    if (item.badge) {
      children.push(
        container({
          content_width: "full",
          flex_direction: "column",
          background_background: "classic",
          background_color: borderColor,
          border_radius: spacing(8, 8, 8, 8, true),
          padding: spacing(8, 14, 8, 14, true),
          padding_mobile: spacing(8, 12, 8, 12)
        }, [
          heading(item.badge, "h6", design, {
            title_color: "#FFFFFF",
            typography_font_family: design.fonts.body,
            typography_font_size: px(12),
            typography_font_size_mobile: px(12),
            align: "center",
            align_mobile: "center"
          })
        ])
      );
    }

    children.push(
      heading(item.title, "h3", design, {
        align: "center",
        align_mobile: "center",
        typography_font_size: px(c.compact ? 18 : 22),
        typography_font_size_mobile: px(19),
        typography_line_height: { unit: "em", size: 1.2, sizes: [] }
      }),
      text(item.body, design, {
        align: "center",
        align_mobile: "center",
        typography_font_size: px(c.compact ? 13 : 14),
        typography_font_size_mobile: px(14)
      }),
      richText(`<p><strong>${cleanText(item.priceLabel || "Starting from")}</strong></p>`, design, {
        align: "center",
        align_mobile: "center",
        text_color: design.colors.muted,
        typography_font_size: px(13),
        typography_font_size_mobile: px(13)
      }),
      heading(item.price, "h2", design, {
        align: "center",
        align_mobile: "center",
        title_color: borderColor,
        typography_font_size: px(c.compact ? 28 : 32),
        typography_font_size_tablet: px(30),
        typography_font_size_mobile: px(27)
      }),
      richText(featureMarkup, design, {
        typography_font_size: px(c.compact ? 13 : 14),
        typography_font_size_mobile: px(13),
        typography_line_height: { unit: "em", size: 1.45, sizes: [] }
      }),
      button(item.button, design, "primary", {
        align: "center",
        background_color: borderColor
      })
    );

    return column(layout.column.desktopWidth, children, {
      width_tablet: pct(layout.column.tabletWidth),
      width_mobile: pct(100),
      background_background: "classic",
      background_color: "#FFFFFF",
      border_border: "solid",
      border_width: spacing(item.highlight ? 2 : 1, item.highlight ? 2 : 1, item.highlight ? 2 : 1, item.highlight ? 2 : 1, true),
      border_color: item.highlight ? borderColor : "rgba(0,0,0,0.08)",
      border_radius: spacing(8, 8, 8, 8, true),
      padding: spacing(c.compact ? 22 : 26, c.compact ? 18 : 22, c.compact ? 22 : 26, c.compact ? 18 : 22, true),
      padding_mobile: spacing(22, 18, 22, 18),
      min_height: px(c.compact ? 330 : 390),
      ...cardShadow(),
      align_items: "center",
      flex_align_items: "center",
      flex_gap: gap(12)
    });
  });

  return section(
    {
      background_background: "classic",
      background_color: c.background || design.colors.light
    },
    [
      boxed([
        headingGroup({
          eyebrow: c.eyebrow,
          title: c.title,
          body: c.body
        }, design),
        rowFromPlan(cards, layout)
      ], c.width || 1120, { flex_gap: gap(36) })
    ]
  );
}

function compileContentSplit(sectionData, design) {
  const c = sectionData.content;
  const splitPlan = solveSplit({
    columns: [45, 50],
    maxTotal: 94,
    desktopGap: 56,
    tabletGap: 32,
    mobileGap: 24
  });
  const mediaChildren = [
    image(c.image, {
      image_border_radius: spacing(8, 8, 8, 8, true)
    })
  ];
  const media = column(splitPlan.columns[0], mediaChildren, {
    align_items: "center",
    flex_align_items: "center"
  });
  const copy = column(
    splitPlan.columns[1],
    [
      eyebrow(c.eyebrow, design),
      heading(c.title, "h2", design, { align_mobile: "center" }),
      text(c.body, design, { align_mobile: "center" }),
      button(c.button, design, "primary", { align: "left", align_mobile: "center" })
    ],
    { flex_gap: gap(18) }
  );
  const children = sectionData.variant === "image-left" ? [media, copy] : [copy, media];
  return section(
    {
      background_background: "classic",
      background_color: c.background || design.colors.light
    },
    [
      boxed([
        rowFromPlan(children, splitPlan)
      ], c.width || 1180)
    ]
  );
}

function compileProcessSteps(sectionData, design) {
  const c = sectionData.content || {};
  const steps = c.steps || [];
  const layout = solveGrid({
    desktopColumns: Math.min(4, Math.max(2, steps.length || 1)),
    tabletColumns: 2,
    itemCount: steps.length,
    desktopGap: 20,
    tabletGap: 18,
    mobileGap: 16,
    align: "stretch"
  });

  const cards = steps.map((item) =>
    column(layout.column.desktopWidth, [
      heading(item.number || "", "h2", design, {
        title_color: item.color || design.colors.primary,
        typography_font_size: px(30),
        typography_font_size_mobile: px(28)
      }),
      heading(item.title, "h4", design, {
        typography_font_size: px(17),
        typography_font_size_mobile: px(17),
        typography_line_height: { unit: "em", size: 1.2, sizes: [] }
      }),
      text(item.body, design, {
        typography_font_size: px(13),
        typography_font_size_mobile: px(13),
        typography_line_height: { unit: "em", size: 1.45, sizes: [] }
      })
    ], {
      width_tablet: pct(layout.column.tabletWidth),
      width_mobile: pct(100),
      background_background: "classic",
      background_color: "#FFFFFF",
      border_border: "solid",
      border_width: spacing(1, 1, 1, 1, true),
      border_color: "rgba(0,0,0,0.08)",
      border_radius: spacing(8, 8, 8, 8, true),
      padding: spacing(24, 22, 24, 22, true),
      padding_mobile: spacing(20, 18, 20, 18),
      min_height: px(230),
      ...cardShadow(),
      flex_gap: gap(10)
    })
  );

  return section(
    {
      background_background: "classic",
      background_color: c.background || "#FFFFFF"
    },
    [
      boxed([
        headingGroup({
          eyebrow: c.eyebrow,
          title: c.title,
          body: c.body
        }, design),
        rowFromPlan(cards, layout)
      ], c.width || 1120, { flex_gap: gap(36) })
    ]
  );
}

function compileFaqList(sectionData, design) {
  const c = sectionData.content;
  const faqs = (c.items || []).map((item) =>
    column(
      100,
      [
        heading(item.question, "h4", design),
        text(item.answer, design)
      ],
      {
        background_background: "classic",
        background_color: design.colors.light,
        border_radius: spacing(10, 10, 10, 10, true),
        padding: spacing(24, 24, 24, 24, true),
        padding_mobile: spacing(20, 18, 20, 18)
      }
    )
  );

  return section(
    { background_background: "classic", background_color: c.background || "#FFFFFF" },
    [
      boxed([
        eyebrow(c.eyebrow, design),
        heading(c.title, "h2", design, { align: "center" }),
        ...faqs
      ], 900, { align_items: "center", flex_gap: gap(18) })
    ]
  );
}

function compileCtaBand(sectionData, design) {
  const c = sectionData.content;
  return section(
    {
      background_background: c.backgroundImage ? "classic" : "classic",
      background_color: design.colors.dark,
      ...(c.backgroundImage ? {
        background_overlay_background: "classic",
        background_overlay_image: {
          url: c.backgroundImage.url,
          id: "",
          size: ""
        },
        background_overlay_position: c.backgroundImage.position || "bottom right",
        background_overlay_repeat: "no-repeat",
        background_overlay_size: c.backgroundImage.size || "260px auto",
        background_overlay_opacity: {
          unit: "px",
          size: c.backgroundImage.opacity || 0.18,
          sizes: []
        }
      } : {}),
      padding: spacing(72, 24, 72, 24),
      padding_tablet: spacing(56, 24, 56, 24),
      padding_mobile: spacing(48, 16, 48, 16)
    },
    [
      boxed([
        heading(c.title, "h2", design, {
          title_color: "#FFFFFF",
          align: "center"
        }),
        text(c.body, design, {
          text_color: "rgba(255,255,255,0.76)",
          align: "center"
        }),
        button(c.button, design, "primary", { align: "center" })
      ], 780, { align_items: "center", flex_gap: gap(18) })
    ]
  );
}

function compileShortcodeSection(sectionData, design) {
  const c = sectionData.content || {};
  const splitPlan = solveSplit({
    columns: c.fullWidth ? [100] : [42, 50],
    maxTotal: 94,
    desktopGap: 32,
    tabletGap: 24,
    mobileGap: 20
  });

  const left = column(splitPlan.columns[0], [
    eyebrow(c.eyebrow, design),
    heading(c.title, "h2", design, {
      title_color: c.dark ? "#FFFFFF" : design.colors.dark,
      align_mobile: "center"
    }),
    text(c.body, design, {
      text_color: c.dark ? "rgba(255,255,255,0.76)" : design.colors.muted,
      align_mobile: "center"
    }),
    ...(c.points && c.points.length
      ? [richText(listMarkup(c.points), design, {
          align_mobile: "center",
          typography_font_size: px(14),
          typography_font_size_mobile: px(14)
        })]
      : [])
  ], {
    flex_gap: gap(16)
  });

  const cardChildren = [];
  if (c.cardTitle) {
    cardChildren.push(
      heading(c.cardTitle, "h4", design, {
        typography_font_size: px(20),
        typography_font_size_mobile: px(18)
      })
    );
  }
  if (c.cardBody) {
    cardChildren.push(
      text(c.cardBody, design, {
        typography_font_size: px(14),
        typography_font_size_mobile: px(14)
      })
    );
  }
  cardChildren.push(shortcodeWidget(c.shortcode));

  const right = column(c.fullWidth ? 100 : splitPlan.columns[1], cardChildren, {
    background_background: "classic",
    background_color: "#FFFFFF",
    border_radius: spacing(8, 8, 8, 8, true),
    border_border: "solid",
    border_width: spacing(1, 1, 1, 1, true),
    border_color: "rgba(0,0,0,0.08)",
    padding: spacing(34, 28, 34, 28, true),
    padding_mobile: spacing(22, 18, 22, 18),
    min_height: px(c.minHeight || 220),
    ...cardShadow(),
    flex_gap: gap(14)
  });

  const children = c.fullWidth ? [right] : [left, right];

  return section(
    {
      background_background: "classic",
      background_color: c.background || design.colors.light
    },
    [
      boxed([
        ...(c.fullWidth ? [
          headingGroup({
            eyebrow: c.eyebrow,
            title: c.title,
            body: c.body
          }, design),
          right
        ] : [
          rowFromPlan(children, splitPlan)
        ])
      ], c.fullWidth ? 1180 : 1500, { flex_gap: gap(32) })
    ]
  );
}

function compileContactPanel(sectionData, design) {
  const c = sectionData.content;
  const splitPlan = solveSplit({
    columns: [45, 50],
    maxTotal: 94,
    desktopGap: 32,
    tabletGap: 24,
    mobileGap: 20
  });
  return section(
    { background_background: "classic", background_color: design.colors.light },
    [
      boxed([
        row([
          column(splitPlan.columns[0], [
            eyebrow(c.eyebrow, design),
            heading(c.title, "h2", design),
            text(c.body, design)
          ]),
          column(splitPlan.columns[1], [
            widget("form", {
              form_name: "Contact Form",
              form_fields: [
                { custom_id: "name", field_type: "text", field_label: "Name", required: "true", width: "100" },
                { custom_id: "email", field_type: "email", field_label: "Email", required: "true", width: "100" },
                { custom_id: "message", field_type: "textarea", field_label: "Message", required: "true", width: "100" }
              ],
              button_text: "Send Message",
              button_background_color: design.colors.primary,
              button_text_color: "#FFFFFF"
            })
          ], {
            background_background: "classic",
            background_color: "#FFFFFF",
            border_radius: spacing(12, 12, 12, 12, true),
            padding: spacing(32, 32, 32, 32, true),
            padding_mobile: spacing(24, 20, 24, 20)
          })
        ], {
          align_items: splitPlan.row.align,
          flex_justify_content: splitPlan.row.justify,
          flex_gap: gap(splitPlan.row.desktopGap),
          flex_gap_tablet: gap(splitPlan.row.tabletGap),
          flex_gap_mobile: gap(splitPlan.row.mobileGap)
        })
      ])
    ]
  );
}

function compileHeaderSimple(sectionData, design) {
  const c = sectionData.content;
  const navItems = (c.links || []).map((item) => navLink(item, design));
  const navPlan = solveInlineCluster({
    justify: "center",
    justifyMobile: "center",
    desktopGap: 24,
    tabletGap: 18,
    mobileGap: 14
  });
  const headerGrid = solveGrid({
    desktopColumns: 3,
    tabletColumns: 1,
    itemCount: 3,
    safetyPercent: 2,
    desktopGap: 0,
    tabletGap: 18,
    mobileGap: 16,
    justify: "space-between",
    align: "center"
  });

  const brand = column(24, [
    heading(c.brand || "Brand", "h3", design, {
      link: { url: c.homeUrl || "/" },
      title_color: design.colors.dark,
      typography_font_size: px(22),
      typography_font_size_tablet: px(21),
      typography_font_size_mobile: px(20),
      align_mobile: "center"
    })
  ], {
    width_tablet: pct(100),
    width_mobile: pct(100),
    flex_gap: gap(0)
  });

  const nav = column(46, [
    rowFromPlan(navItems, navPlan)
  ], {
    width_tablet: pct(100),
    width_mobile: pct(100),
    flex_gap: gap(0)
  });

  const action = column(20, [
    button(c.cta || { text: "Contact", url: "/contact/" }, design, "primary", {
      align: "right",
      align_mobile: "center",
      text_padding: spacing(11, 20, 11, 20),
      text_padding_mobile: spacing(10, 18, 10, 18)
    })
  ], {
    width_tablet: pct(100),
    width_mobile: pct(100),
    flex_gap: gap(0),
    align_items: "flex-end",
    flex_align_items_tablet: "center",
    flex_align_items_mobile: "center"
  });

  return section(
    {
      background_background: "classic",
      background_color: c.background || "#FFFFFF",
      padding: spacing(18, 24, 18, 24),
      padding_tablet: spacing(16, 20, 16, 20),
      padding_mobile: spacing(14, 16, 14, 16),
      border_border: "solid",
      border_width: spacing(0, 0, 1, 0, false),
      border_color: "rgba(0,0,0,0.08)"
    },
    [
      boxed([
        rowFromPlan([brand, nav, action], headerGrid)
      ], 1200)
    ]
  );
}

function compileHeaderNavMenu(sectionData, design) {
  const c = sectionData.content;
  const brand = column(34, [
    heading(c.brand || "Brand", "h3", design, {
      link: { url: c.homeUrl || "/" },
      title_color: design.colors.dark,
      typography_font_size: px(23),
      typography_font_size_tablet: px(21),
      typography_font_size_mobile: px(20),
      align: "left",
      align_mobile: "left"
    })
  ], {
    width_tablet: pct(68),
    width_mobile: pct(68),
    flex_gap: gap(0)
  });

  const nav = column(62, [
    navMenu({
      menu: c.menu || c.menuSlug || "",
      breakpoint: c.breakpoint || "tablet"
    }, design)
  ], {
    width_tablet: pct(28),
    width_mobile: pct(28),
    flex_gap: gap(0),
    align_items: "flex-end",
    flex_align_items_tablet: "flex-end",
    flex_align_items_mobile: "flex-end"
  });

  return section(
    {
      background_background: "classic",
      background_color: c.background || "#FFFFFF",
      padding: spacing(16, 24, 16, 24),
      padding_tablet: spacing(14, 20, 14, 20),
      padding_mobile: spacing(12, 16, 12, 16),
      border_border: "solid",
      border_width: spacing(0, 0, 1, 0, false),
      border_color: "rgba(0,0,0,0.08)"
    },
    [
      boxed([
        row([brand, nav], {
          flex_wrap: "nowrap",
          flex_justify_content: "space-between",
          flex_justify_content_mobile: "space-between",
          align_items: "center",
          flex_gap: gap(24),
          flex_gap_tablet: gap(16),
          flex_gap_mobile: gap(12)
        })
      ], 1200)
    ]
  );
}

function compileFooterMultiColumn(sectionData, design) {
  const c = sectionData.content;
  const columns = c.columns || [];
  const grid = solveGrid({
    desktopColumns: Math.max(4, columns.length + 1),
    tabletColumns: 2,
    itemCount: Math.max(4, columns.length + 1),
    safetyPercent: 4,
    desktopGap: 0,
    tabletGap: 24,
    mobileGap: 18,
    justify: "space-between",
    align: "flex-start"
  });

  const brandCol = column(grid.column.desktopWidth, [
    heading(c.brand || "Brand", "h3", design, {
      title_color: "#FFFFFF",
      typography_font_size: px(24),
      typography_font_size_tablet: px(22),
      typography_font_size_mobile: px(21)
    }),
    text(c.description || "", design, {
      text_color: "rgba(255,255,255,0.72)"
    })
  ], {
    width_tablet: pct(grid.column.tabletWidth),
    width_mobile: pct(100)
  });

  const linkColumns = columns.map((col) =>
    column(grid.column.desktopWidth, [
      heading(col.title, "h4", design, {
        title_color: "#FFFFFF",
        typography_font_family: design.fonts.body,
        typography_font_size: px(15),
        typography_font_size_tablet: px(15),
        typography_font_size_mobile: px(15)
      }),
      ...((col.links || []).map((item) => navLink(item, design, {
        title_color: "rgba(255,255,255,0.72)",
        align: "left",
        align_mobile: "left",
        typography_font_weight: "500"
      })))
    ], {
      width_tablet: pct(grid.column.tabletWidth),
      width_mobile: pct(100),
      flex_gap: gap(12)
    })
  );

  return section(
    {
      background_background: "classic",
      background_color: design.colors.dark,
      padding: spacing(64, 24, 40, 24),
      padding_tablet: spacing(56, 20, 36, 20),
      padding_mobile: spacing(48, 16, 32, 16)
    },
    [
      boxed([
        rowFromPlan([brandCol, ...linkColumns], grid),
        container({
          content_width: "full",
          flex_direction: "column",
          border_border: "solid",
          border_width: spacing(1, 0, 0, 0, false),
          border_color: "rgba(255,255,255,0.12)",
          padding: spacing(24, 0, 0, 0, false),
          padding_mobile: spacing(20, 0, 0, 0, false)
        }, [
          text(c.copyright || "", design, {
            text_color: "rgba(255,255,255,0.58)",
            typography_font_size: px(13),
            typography_font_size_mobile: px(12),
            align: "center"
          })
        ])
      ], 1200, { flex_gap: gap(36) })
    ]
  );
}

const compilers = {
  HeaderSimple: compileHeaderSimple,
  HeaderNavMenu: compileHeaderNavMenu,
  FooterMultiColumn: compileFooterMultiColumn,
  DesignFoundation: compileDesignFoundation,
  GalleryGrid: compileGalleryGrid,
  OfferHero: compileOfferHero,
  IconHighlights: compileIconHighlights,
  InfoColumns: compileInfoColumns,
  PricingCards: compilePricingCards,
  ProcessSteps: compileProcessSteps,
  ShortcodeSection: compileShortcodeSection,
  HeroSplit: compileHeroSplit,
  FeatureGrid: compileFeatureGrid,
  ContentSplit: compileContentSplit,
  StatsBand: compileStatsBand,
  CtaBand: compileCtaBand,
  FaqList: compileFaqList,
  ContactPanel: compileContactPanel
};

function compilePage(bp) {
  idCounter = 1;
  const design = bp.design;
  const elementorData = bp.sections.map((sectionData) => {
    const compile = compilers[sectionData.component];
    if (!compile) {
      throw new Error(`Unsupported component: ${sectionData.component}`);
    }
    return compile(sectionData, design);
  });

  const isTemplate = bp.kind === "template" || Boolean(bp.template);
  const pageMeta = bp.page || {};
  const templateMeta = bp.template || {};

  return {
    title: isTemplate ? templateMeta.title : pageMeta.title,
    slug: pageMeta.slug,
    status: isTemplate ? (templateMeta.status || "publish") : (pageMeta.status || "draft"),
    type: isTemplate ? templateMeta.type : undefined,
    template: isTemplate ? undefined : (pageMeta.template || "elementor_header_footer"),
    page_settings: {
      background_background: "classic",
      background_color: "#FFFFFF",
      hide_title: "yes",
      page_layout: "full_width"
    },
    metadata: {
      generator: "native-elementor-compiler",
      generator_version: "0.1.0",
      project: bp.project,
      design_route: bp.design.route
    },
    elementor_data: elementorData
  };
}

function runCli() {
  const input = process.argv[2];
  const output = process.argv[3];

  if (!input) {
    console.error("Usage: node src/compiler/native-elementor-compiler.js <blueprint.json> [out.json]");
    process.exit(1);
  }

  try {
    const blueprint = JSON.parse(fs.readFileSync(input, "utf8"));
    const compiled = compilePage(blueprint);
    const json = JSON.stringify(compiled, null, 2);
    if (output) {
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(output, json + "\n", "utf8");
    } else {
      process.stdout.write(json + "\n");
    }
  } catch (error) {
    console.error(`Compile failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  runCli();
}

module.exports = {
  compilePage
};
