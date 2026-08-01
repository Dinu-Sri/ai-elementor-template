#!/usr/bin/env node

const fs = require("fs");

const allowedWidgets = new Set([
  "heading",
  "text-editor",
  "button",
  "image",
  "image-carousel",
  "video",
  "spacer",
  "icon",
  "icon-list",
  "counter",
  "shortcode",
  "form",
  "toggle",
  "accordion",
  "nav-menu",
  "social-icons",
  "loop-grid",
  "posts",
  "theme-post-title",
  "theme-post-featured-image",
  "theme-post-content",
  "post-info",
  "post-navigation",
  "share-buttons"
]);

function createState() {
  return {
    issues: [],
    score: 100
  };
}

function addIssue(state, severity, path, message, penalty = 0) {
  state.issues.push({ severity, path, message, penalty });
  state.score -= penalty;
}

function hasInlineStyle(value) {
  return typeof value === "string" && /style\s*=/.test(value);
}

function isPlaceholderUrl(value) {
  return value === "#" || value === "javascript:void(0)";
}

function hasReset(settings) {
  return Boolean(settings && settings._margin && settings._margin_tablet && settings._margin_mobile);
}

function widthPercent(node) {
  const value = node && node.settings && node.settings.width;
  if (!value || value.unit !== "%") return null;
  return Number(value.size);
}

function isFlexRow(node) {
  return Boolean(node && node.elType === "container" && node.settings && node.settings.flex_direction === "row");
}

function walk(node, path, state) {
  if (!node || typeof node !== "object") return;

  if (node.elType === "section" || node.elType === "column") {
    addIssue(state, "error", path, `Legacy Elementor elType "${node.elType}" is forbidden.`, 100);
  }

  if (node.elType === "widget") {
    const settings = node.settings || {};
    if (!Array.isArray(node.elements)) {
      addIssue(state, "error", path, "Widget must include elements: [].", 20);
    }
    if (!allowedWidgets.has(node.widgetType)) {
      addIssue(state, "warning", path, `Unknown or non-approved widget "${node.widgetType}".`, 15);
    }
    if (node.widgetType === "html") {
      addIssue(state, "error", path, "HTML widget is blocked by default.", 30);
    }
    if (!hasReset(settings)) {
      addIssue(state, "warning", path, "Widget is missing native spacing reset margins.", 5);
    }
  }

  if (node.elType === "container") {
    const settings = node.settings || {};
    if (!Array.isArray(node.elements)) {
      addIssue(state, "error", path, "Container must include elements array.", 20);
    }
    if (!settings.flex_direction) {
      addIssue(state, "warning", path, "Container is missing flex_direction.", 5);
    }
    if (!hasReset(settings)) {
      addIssue(state, "warning", path, "Container is missing native spacing reset margins.", 5);
    }
    if (node.isInner === false) {
      if (!settings.padding || !settings.padding_tablet || !settings.padding_mobile) {
        addIssue(state, "warning", path, "Top-level section is missing desktop/tablet/mobile padding.", 8);
      }
    }
    if (settings.width && (!settings.width_tablet || !settings.width_mobile)) {
      addIssue(state, "warning", path, "Column container has width but lacks tablet/mobile width.", 8);
    }
    if (settings.content_width === "boxed" && settings.boxed_width && (!settings.boxed_width_tablet || !settings.boxed_width_mobile)) {
      addIssue(state, "warning", path, "Boxed container has desktop width but lacks tablet/mobile boxed widths.", 8);
    }
    if (isFlexRow(node) && Array.isArray(node.elements)) {
      const widths = node.elements
        .map(widthPercent)
        .filter((value) => Number.isFinite(value));
      if (widths.length >= 2) {
        const total = widths.reduce((sum, value) => sum + value, 0);
        const justify = settings.flex_justify_content || "flex-start";
        const wraps = settings.flex_wrap === "wrap";
        if (total > 100 && !wraps) {
          addIssue(state, "error", path, `Flex row child widths total ${total}%, which cannot fit.`, 40);
        } else if (total > 96 && !wraps) {
          addIssue(state, "warning", path, `Flex row child widths total ${total}%; this is wrap-prone with native spacing.`, 10);
        } else if (total < 94 && justify === "flex-start") {
          addIssue(state, "warning", path, `Flex row child widths total ${total}% with flex-start; unused space will collect on the right.`, 10);
        }
      }
    }
  }

  const settings = node.settings || {};
  for (const [key, value] of Object.entries(settings)) {
    if (hasInlineStyle(value)) {
      addIssue(state, "error", `${path}.settings.${key}`, "Inline style attribute found.", 25);
    }
    if (key === "custom_css") {
      addIssue(state, "warning", `${path}.settings.${key}`, "Custom CSS is discouraged in generated templates.", 15);
    }
    if (key === "link" && value && isPlaceholderUrl(value.url)) {
      addIssue(state, "warning", `${path}.settings.link.url`, "Placeholder link found.", 10);
    }
  }

  if (Array.isArray(node.elements)) {
    node.elements.forEach((child, index) => walk(child, `${path}.elements[${index}]`, state));
  }
}

function validateTemplate(template) {
  const state = createState();
  const data = template.elementor_data || template.content || template;

  if (!Array.isArray(data)) {
    addIssue(state, "error", "elementor_data", "Template elementor_data must be an array.", 100);
  } else {
    data.forEach((node, index) => walk(node, `elementor_data[${index}]`, state));
  }

  const score = Math.max(0, state.score);
  const failed = state.issues.some((issue) => issue.severity === "error") || score < 90;

  return {
    ok: !failed,
    score,
    minimum_score: 90,
    issue_count: state.issues.length,
    issues: state.issues
  };
}

function runCli() {
  const input = process.argv[2];

  if (!input) {
    console.error("Usage: node src/validator/elementor-native-lint.js <template.json>");
    process.exit(1);
  }

  const template = JSON.parse(fs.readFileSync(input, "utf8").replace(/^\uFEFF/, ""));
  const report = validateTemplate(template);

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exit(1);
  }
}

if (require.main === module) {
  runCli();
}

module.exports = {
  validateTemplate
};
