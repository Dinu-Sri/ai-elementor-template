# Kids Mani Pedi Revision - 2026-08-27

## Package Metric Layout Follow-up

The four package cards on page ID `1082` now keep the Duration and Price boxes on one row at desktop, tablet, and mobile breakpoints. The native Elementor metric row uses `nowrap`, while both child boxes use 47% widths to leave room for the existing gap. Public layout measurements confirmed aligned pairs and no mobile horizontal overflow.

## Production Scope

- Site: `https://homesalon.ae`
- Page: `1082`
- Previous title and URL: `Kids Nail Services at Home in Dubai`, `/kids/`
- New WordPress title and URL: `Kids Mani Pedi`, `/kids-mani-pedi/`
- Main Menu: `12`
- Deployment: authenticated Native Elementor Bridge API only
- Page ID, publication status, and parent were preserved.

## Approved Package Contract

| Package | Duration | Price |
| --- | ---: | ---: |
| Kids Nail & Polish Application | 10 min | AED 24 |
| Kids Manicure & Pedicure | 60 min | AED 84 |
| Gel Manicure Kids | 45 min | AED 60 |
| Gel Pedicure Kids | 45 min | AED 84 |

Every package card displays one Duration and one Price field. Placeholder Package, From, and From AED fields were removed. Kids Nail & Polish Application remains the sole Most Popular package.

## Identity And Links

- Updated the visible Elementor naming from Kids Nail Services to Kids Mani Pedi, including the hero heading and supporting section headings.
- Updated Rank Math SEO title, description, focus keyword, canonical URL, and index/follow robots metadata.
- Renamed the Main Menu item from Kids to Kids Mani Pedi while preserving the 89-item total.
- Updated native Elementor links on Our Services (`61`) and Nails (`63`) from `/kids/` to `/kids-mani-pedi/`.
- Created active Rank Math redirect `46`: `/kids/` -> `/kids-mani-pedi/` as a direct 301.

## Verification

- Captured fresh authenticated page, menu, and redirect baselines before writes.
- Confirmed `/kids/` had no existing redirect before creating the new rule.
- Drift-checked all three edited pages immediately before saving.
- Exported every saved Elementor payload and confirmed zero new native lint errors.
- Independently audited all four package cards, the new naming, both updated internal references, and the redirect plan before deployment.
- Cleared Elementor, object, and Rank Math caches through the bridge.
- Confirmed the new page returns HTTP 200 with all approved packages.
- Confirmed the old URL returns a direct HTTP 301 to the new URL.
- Confirmed the public Our Services and Nails pages link to the new canonical URL.
- Checked the new page at 1440 px, 768 px, and 390 px. Revised content has no horizontal overflow at desktop or mobile. At 768 px, only the inherited shared-header/menu width behavior extends the effective viewport; revised page content fits correctly.
- Visually checked the desktop and tablet renders and captured desktop, tablet, and mobile screenshots.
