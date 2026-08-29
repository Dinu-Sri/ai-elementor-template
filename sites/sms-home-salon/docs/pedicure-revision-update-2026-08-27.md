# Pedicure Service Revision - 2026-08-27

## Hub Package Metric Layout Follow-up

The 14 package cards on the Pedicure level-1 page now keep Duration and Price on one row across desktop, tablet, and mobile. Native no-wrap metric rows use balanced 47% child widths and mobile-safe horizontal padding. Public measurements confirmed aligned boxes and no horizontal overflow.

The same layout contract was subsequently applied to all 6 Pedicure subservice pages, covering 14 detail-page package cards. Export-back validation preserved every approved duration, price, page identity, and publication status.

## Production Scope

- Site: `https://homesalon.ae`
- Pedicure hub: page `1380`, `/pedicure/`
- Main Menu: `12`
- Deployment: authenticated Native Elementor Bridge API only
- All 6 existing published detail pages, IDs, routes, and parents were preserved.

## Approved Package Contract

| Page ID | Service | Package | Duration | Price |
| ---: | --- | --- | ---: | ---: |
| 1070 | Foot Paraffin | Foot Paraffin | 30 min | AED 72 |
| 1076 | Classic Pedicure | Pedicure Without Color | 40 min | AED 72 |
| 1076 | Classic Pedicure | Pedicure With Color | 45 min | AED 78 |
| 1076 | Classic Pedicure | French Pedicure | 90 min | AED 84 |
| 1076 | Classic Pedicure | Polish Change | 30 min | AED 60 |
| 1076 | Classic Pedicure | Nail Filing | 30 min | AED 48 |
| 1078 | Gel Pedicure | Gel Color Apply Without Cleaning | 60 min | AED 96 |
| 1078 | Gel Pedicure | Gelish Pedicure | 60 min | AED 144 |
| 1078 | Gel Pedicure | French Gel Pedicure | 60 min | AED 168 |
| 1078 | Gel Pedicure | Gel Polish Remove | 10 min | AED 48 |
| 1072 | Spa Pedicure | Spa Pedicure | 60 min | AED 144 |
| 1080 | Callus Treatment | Callus Treatment | 90 min | AED 160 |
| 1080 | Callus Treatment | Callus Treatment With Polish | 90 min | AED 180 |
| 1074 | Foot Scrub | Foot Scrub | 90 min | AED 60 |

Every detail-page and hub card displays one Duration and one Price field. Placeholder Package, From, and From AED fields were removed. Foot Paraffin remains the sole Most Popular card on the hub; the first package remains the sole Most Popular card on each detail page.

## Menu Contract

The Pedicure branch contains 6 detail links in the approved order: Foot Paraffin (`1070`), Classic Pedicure (`1076`), Gel Pedicure (`1078`), Spa Pedicure (`1072`), Callus Treatment (`1080`), and Foot Scrub (`1074`). Main Menu `12` remains at 89 items.

## Verification

- Captured a fresh authenticated production snapshot before writes.
- Drift-checked each of the 7 target pages immediately before saving.
- Exported every saved Elementor payload and confirmed zero new native lint errors.
- Independently audited all 14 generated package cards against the approved matrix before deployment.
- Updated the menu through dry-run and guarded replacement, then confirmed the 6-page branch order and unchanged 89-item total.
- Cleared Elementor, object, and Rank Math caches through the bridge.
- Confirmed HTTP 200 and required public content for all 6 detail pages and the Pedicure hub.
- Checked the hub, Classic Pedicure, and Gel Pedicure pages at 1440 px, 768 px, and 390 px. Revised content has no horizontal overflow at desktop or mobile. At 768 px, only the inherited shared-header email label extends the effective viewport; revised page content does not overflow.
- Captured desktop, tablet, and mobile screenshots for all three audited pages.
