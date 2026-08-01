const DEFAULT_BREAKPOINTS = {
  desktop: 1200,
  tablet: 768,
  mobile: 390
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function fitWidth(columns, safetyPercent = 3) {
  if (columns <= 1) return 100;
  return clamp(Math.floor((100 - columns * safetyPercent) / columns), 1, 100);
}

function normalizeGap(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function solveGrid(options = {}) {
  const desktopColumns = options.desktopColumns || 3;
  const tabletColumns = options.tabletColumns || (desktopColumns >= 3 ? 2 : 1);
  const mobileColumns = 1;
  const safetyPercent = options.safetyPercent || (desktopColumns >= 4 ? 4 : 3);
  const itemCount = Number.isFinite(options.itemCount) ? options.itemCount : null;
  const isCompleteDesktopRow = itemCount !== null && itemCount >= desktopColumns && itemCount % desktopColumns === 0;
  const distributeCompleteRows = options.distributeCompleteRows !== false;
  const defaultJustify = distributeCompleteRows && isCompleteDesktopRow
    ? "space-between"
    : (desktopColumns >= 4 ? "space-between" : "center");

  return {
    kind: "grid",
    breakpoints: DEFAULT_BREAKPOINTS,
    itemCount,
    isCompleteDesktopRow,
    column: {
      desktopWidth: fitWidth(desktopColumns, safetyPercent),
      tabletWidth: fitWidth(tabletColumns, 3),
      mobileWidth: fitWidth(mobileColumns, 0)
    },
    row: {
      justify: options.justify || defaultJustify,
      justifyMobile: options.justifyMobile || "center",
      align: options.align || "stretch",
      desktopGap: normalizeGap(options.desktopGap, desktopColumns >= 4 ? 0 : 24),
      tabletGap: normalizeGap(options.tabletGap, 20),
      mobileGap: normalizeGap(options.mobileGap, 16)
    }
  };
}

function solveSplit(options = {}) {
  const requested = options.columns || [50, 45];
  const maxTotal = options.maxTotal || 94;
  const total = requested.reduce((sum, value) => sum + value, 0);
  const ratio = total > maxTotal ? maxTotal / total : 1;

  return {
    kind: "split",
    breakpoints: DEFAULT_BREAKPOINTS,
    columns: requested.map((width) => Math.floor(width * ratio)),
    row: {
      justify: options.justify || "space-between",
      justifyMobile: options.justifyMobile || "center",
      align: options.align || "center",
      desktopGap: normalizeGap(options.desktopGap, 48),
      tabletGap: normalizeGap(options.tabletGap, 32),
      mobileGap: normalizeGap(options.mobileGap, 24)
    }
  };
}

function solveInlineCluster(options = {}) {
  return {
    kind: "inline-cluster",
    row: {
      justify: options.justify || "flex-start",
      justifyMobile: options.justifyMobile || "center",
      align: options.align || "center",
      desktopGap: normalizeGap(options.desktopGap, 16),
      tabletGap: normalizeGap(options.tabletGap, 16),
      mobileGap: normalizeGap(options.mobileGap, 12)
    }
  };
}

module.exports = {
  solveGrid,
  solveSplit,
  solveInlineCluster,
  fitWidth
};
