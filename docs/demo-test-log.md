# Demo Test Log

## 2026-07-12 - Eternal Moment Studio

Bridge status check succeeded.

Environment:

- Site URL: `https://eternalmomentstudio.com`
- Bridge version: `0.1.0`
- WordPress version: `7.0.1`
- PHP version: `8.2.31`
- Elementor active: yes
- Elementor version: `4.1.4`
- Elementor Pro active: yes
- Elementor Pro version: `4.1.2`

Generated draft:

- Blueprint: `sites/eternal-moment-demo/blueprints/eternal-moment-home.blueprint.json`
- Compiled output: `build/eternal-moment-home.elementor.json`
- WordPress page ID: `12`
- WordPress status: `draft`
- Elementor edit URL: `https://eternalmomentstudio.com/wp-admin/post.php?post=12&action=elementor`

Validation:

- Local compiled template lint: passed, score `100`
- WordPress-exported template lint: passed, score `100`
- No HTML widgets detected
- No inline style attributes detected
- No legacy `section` or `column` elements detected
- Responsive section padding and column widths present

Notes:

- The API key was used only for the live REST requests and was not written to tracked config.
- PowerShell `Set-Content -Encoding UTF8` produced a UTF-8 BOM in the exported JSON. The validator now strips a leading BOM before parsing.

## 2026-07-12 - Fix Pass 1

User review found:

- The four-column stats band wrapped the fourth counter to a second line.
- A section title was left-aligned while its subtitle was centered.

Fixes applied:

- Added compiler-level native spacing reset for containers and widgets.
- Added linter warning for missing reset margins.
- Changed stats columns from optimistic `23%` to safer `21%` with `space-between` row distribution.
- Added `headingGroup()` compiler primitive so eyebrow, title, and subtitle alignment are controlled together.
- Updated WordPress draft page ID `12`.
- Re-exported and validated the stored page. Lint passed with score `100`.

## 2026-07-12 - Layout Solver Pass

Implemented a formal layout solver:

- `solveGrid()` for repeated grids such as stats, features, cards, logos, and footer columns.
- `solveSplit()` for hero, story, media/text, and contact split layouts.
- `solveInlineCluster()` for button rows and compact inline actions.

Compiler changes:

- Hero split, stats band, feature grid, content split, and contact panel now consume solver output.
- Split layouts scale down requested widths when totals exceed a safe maximum.
- Grid layouts use safety reserves instead of exact arithmetic percentages.

Validator changes:

- Added row-fit checks that sum flex-row child widths.
- Rows over `100%` fail.
- Rows over `96%` warn because they are wrap-prone once native spacing and browser rounding are applied.

Validation:

- Eternal Moment compiled template passed with score `100`.
- SMS Pet compiled template passed with score `100`.
- WordPress draft page ID `12` updated, exported again, and passed lint with score `100`.

## 2026-07-12 - Card Row Distribution Fix

User review found:

- The three-card feature row had visible extra space on the right side.

Root cause:

- The solver reserved safe unused width to avoid wrapping, but the row used `flex-start`.
- This caused all reserve space to collect at the row end instead of being distributed.

Fixes applied:

- `solveGrid()` now accepts `itemCount`.
- Complete desktop rows distribute spare space with `space-between` by default.
- Incomplete rows default to centered instead of left-packed.
- `FeatureGrid` passes item count to the solver.
- The linter now warns when child widths total below `94%` and the row uses `flex-start`.

Validation:

- Eternal Moment compiled template passed with score `100`.
- SMS Pet compiled template passed with score `100`.
- WordPress draft page ID `12` updated, exported again, and passed lint with score `100`.

## 2026-07-12 - Header/Footer Template Pass

Created published navigation target pages:

- About page ID `14`: `https://eternalmomentstudio.com/native-test-about/`
- Portfolio page ID `15`: `https://eternalmomentstudio.com/native-test-portfolio/`
- Services page ID `16`: `https://eternalmomentstudio.com/native-test-services/`
- Contact page ID `17`: `https://eternalmomentstudio.com/native-test-contact/`

Created Elementor Library templates through the bridge:

- Header template ID `18`: `https://eternalmomentstudio.com/wp-admin/post.php?post=18&action=elementor`
- Footer template ID `19`: `https://eternalmomentstudio.com/wp-admin/post.php?post=19&action=elementor`

Validation:

- Exported pages `14` to `17`; each passed native lint with score `100`.
- Exported templates `18` and `19`; each passed native lint with score `100`.
- Public smoke test of `https://eternalmomentstudio.com/native-test-about/` did not show the generated header/footer text yet.

System finding:

- The installed bridge is still v0.1.0, which can save templates and conditions but has no Theme Builder diagnostic route and does not regenerate Elementor Pro Theme Builder condition cache.
- Local bridge v0.2.0 now adds `POST /clear-cache`, `GET /theme-builder`, condition-aware template updates, and cache regeneration.
- Plugin package built at `build/native-elementor-bridge-0.2.0.zip`. Reinstall this zip on the demo WordPress site before the next public rendering verification.

## 2026-07-12 - Site Workflow Orchestrator

After installing bridge v0.2.0:

- Live bridge status returned version `0.2.0`.
- `POST /clear-cache` succeeded and reported Elementor Pro Theme Builder condition cache regeneration.
- `GET /theme-builder` returned header template ID `18` and footer template ID `19`, both published with `include/general`.
- Public smoke checks passed for About, Portfolio, Services, and Contact pages. Each page contained header marker `elementor-18`, footer marker `elementor-19`, brand text, CTA text, and generated footer copy.

System upgrade:

- Added `sites/eternal-moment-demo/manifests/eternal-moment-demo.site.json`.
- Added `tools/site-workflow.js`.
- Header/footer blueprint links now use page-map tokens such as `{{page:contact}}`.
- Site workflow compiles all manifest artifacts, fails on unresolved tokens, lints locally, deploys pages/templates, exports saved WordPress Elementor data back, lints exports, clears cache, inspects Theme Builder, and writes smoke reports.

Validation:

- `npm run site:eternal:compile` succeeded.
- `npm run site:eternal:lint` returned score `100` for all four pages plus header and footer templates.
- Full live workflow returned export-back lint score `100` for all pages and templates.

## 2026-07-12 - AI Entrypoint and Responsive Header Upgrade

User validation found:

- A copied project folder needs one clear MD file any AI agent can read to understand the system.
- The system must explicitly support Fresh Build and Existing Site Intake workflows.
- The generated header used manually arranged heading/button widgets instead of Elementor Pro's responsive menu behavior.

Fixes applied locally:

- Added `AGENTS.md` as the canonical AI operating guide.
- Added `CHANGELOG.md` and version bookkeeping rules.
- Bumped system package and component registry to `0.3.0`.
- Bumped bridge plugin to `0.3.0`.
- Added bridge routes for `/pages`, `/templates`, `/menus`, and `/site-snapshot`.
- Added deterministic WordPress nav menu sync.
- Added `HeaderNavMenu`, which uses the native Elementor Pro `nav-menu` widget.
- Updated the Eternal Moment manifest to create `native-test-primary` and feed `{{menu:primary}}` into the header blueprint.

Validation status:

- Local compile/lint is required after this change.
- Live menu/header validation requires installing the bridge v0.3.0 zip on the demo site.

## 2026-07-12 - Design-System Page and Responsive Validation

Implemented:

- Added global responsive boxed-width defaults for boxed containers.
- Added validator coverage for missing responsive boxed widths.
- Refined row-width linting so legitimate wrapping grids do not fail as over-wide rows.
- Added `DesignFoundation` for typography, color tokens, and buttons.
- Added `GalleryGrid` for reusable native image gallery sections.
- Added `sites/eternal-moment-demo/blueprints/eternal-design-system.blueprint.json`.
- Added the design-system page to the Eternal Moment manifest and primary WordPress menu.
- Added `tools/responsive-check.js` for CDP-based desktop/tablet/mobile overflow and nav-toggle checks.

Live validation:

- Created/updated design-system page ID `52`: `https://eternalmomentstudio.com/native-test-design-system/`
- Manifest is pinned to existing page ID `52` for future updates.
- Full site workflow passed for design-system, about, portfolio, services, contact, header, and footer.
- WordPress export-back lint score was `100` for every page and template.
- Smoke checks passed for all five pages.
- Responsive checks passed for About and Design System pages:
  - no horizontal overflow on desktop/tablet/mobile
  - desktop nav rendered expanded
  - tablet/mobile nav toggle rendered visible
