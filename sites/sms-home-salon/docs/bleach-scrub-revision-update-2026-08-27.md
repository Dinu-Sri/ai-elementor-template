# Bleach and Scrub Service Revision - 2026-08-27

## Production Scope

- Site: `https://homesalon.ae`
- Bleach hub: page `1377`, `/bleach/`
- Scrub hub: page `1378`, `/scrub/`
- Main Menu: `12`
- Deployment: authenticated Native Elementor Bridge API only
- Existing published page IDs, routes, and parent relationships were preserved.

## Approved Package Contract

| Category | Page ID | Service | Duration | Price |
| --- | ---: | --- | ---: | ---: |
| Bleach | 1150 | Full Arms Bleaching | 45 min | AED 96 |
| Bleach | 1152 | Full Legs Bleaching | 60 min | AED 120 |
| Bleach | 1154 | Full Body Back and Full Body Front Bleaching | 120 min | AED 240 |
| Scrub | 1156 | Face Scrub | 30 min | AED 60 |
| Scrub | 1158 | Full Arms Scrub | 45 min | AED 72 |
| Scrub | 1160 | Full Body Back and Full Body Front Scrub | 90 min | AED 180 |
| Scrub | 1162 | Full Body Scrub | 90 min | AED 300 |
| Scrub | 1164 | Full Body Scrub With Mask | 120 min | AED 480 |

The arms descriptions retain the approved "Both arms" note. Every package card displays one Duration and one Price field. Placeholder Package, From, and From AED fields were removed. The first package is the sole Most Popular card on each hub and detail page.

## Menu Contract

The Bleach branch contains three detail links in this order: Full Arms Bleaching (`1150`), Full Legs Bleaching (`1152`), and Full Back and Front Bleaching (`1154`).

The Scrub branch contains five detail links in this order: Face Scrub (`1156`), Full Arms Scrub (`1158`), Full Back and Front Scrub (`1160`), Full Body Scrub (`1162`), and Full Body Scrub With Mask (`1164`). Main Menu `12` remains at 89 items because existing pages were moved between branches rather than added or removed.

## Verification

- Captured a fresh production snapshot before writes and a supplemental authenticated export for page `1164`, which falls beyond the bridge bulk snapshot's 100-page response window.
- Drift-checked every one of the ten target pages immediately before saving.
- Exported every saved Elementor payload and confirmed zero new native lint errors.
- Independently audited all generated and export-back package contracts against the approved matrix.
- Updated the menu through dry-run and guarded replacement, then confirmed the 3/5 branch split and unchanged 89-item total.
- Cleared Elementor, object, and Rank Math caches through the bridge.
- Confirmed HTTP 200 and required public content for all eight detail pages and both hubs.
- Checked both hubs and the longest Bleach and Scrub detail pages at 1440 px, 768 px, and 390 px. Revised content has no horizontal overflow at desktop or mobile. At 768 px, only the inherited shared-header email label extends the effective viewport; revised page content does not overflow.
- Visually checked the live desktop Scrub hub and captured desktop, tablet, and mobile screenshots for the audited pages.
