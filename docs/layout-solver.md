# Layout Solver

The layout solver is the system layer that turns design intent into conservative Elementor flexbox settings.

Components should not hardcode their own percentages and gaps. They should ask the solver for a named layout plan and then compile that plan into native Elementor settings.

## Why It Exists

Elementor layouts are affected by:

- widget wrapper margins
- container padding
- borders
- browser rounding
- theme defaults
- Elementor global spacing
- flex gap behavior

Because of this, a mathematical `25% * 4 = 100%` layout can still wrap in real pages. The solver uses fit-aware widths with safety reserves.

## Current Solvers

### `solveGrid`

Used for card grids, stats bands, logo rows, feature lists, and other repeated items.

Example:

```js
solveGrid({
  desktopColumns: 4,
  tabletColumns: 2,
  safetyPercent: 4,
  desktopGap: 0,
  tabletGap: 24,
  mobileGap: 16,
  justify: "space-between",
  align: "stretch"
});
```

This gives:

- desktop width: `21%` for 4-up rows
- tablet width: `47%` for 2-up rows
- mobile width: `100%`

Complete desktop rows are distributed with `space-between` by default. This prevents the safety reserve from becoming visible as a large empty area on the right side of a row.

### `solveSplit`

Used for hero, story, contact, and media/text layouts.

The solver scales requested column widths down if their sum exceeds a safe maximum.

Example:

```js
solveSplit({
  columns: [55, 40],
  maxTotal: 94,
  desktopGap: 56,
  tabletGap: 32,
  mobileGap: 24
});
```

### `solveInlineCluster`

Used for button rows and small inline action groups.

## Rules

- Components consume solver plans.
- Solver output controls `width`, `width_tablet`, `width_mobile`, `flex_gap`, `flex_gap_tablet`, `flex_gap_mobile`, and `flex_justify_content`.
- Components may override only when there is a documented reason.
- New layout families should be added to `layout-solver.js` before being used by components.
- A row with child widths below `94%` must not use `flex-start`, because spare space will collect on the right and make the section look imbalanced.
