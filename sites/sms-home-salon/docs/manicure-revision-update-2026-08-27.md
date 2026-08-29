# Manicure Service Revision - 2026-08-27

## Hub Package Metric Layout Follow-up

The 22 package cards on the Manicure level-1 page now keep Duration and Price on one row across desktop, tablet, and mobile. Native no-wrap metric rows use balanced 47% child widths, with tighter mobile horizontal padding so three-digit prices remain on one line. Public measurements confirmed aligned boxes and no horizontal overflow.

The same layout contract was subsequently applied to all 11 Manicure subservice pages, covering 22 detail-page package cards. Export-back validation preserved every approved duration, price, page identity, and publication status.

## Production Scope

- Site: `https://homesalon.ae`
- Manicure hub: page `1379`, `/manicure/`
- Main Menu: `12`
- Deployment: authenticated Native Elementor Bridge API only
- All 11 existing published detail pages, IDs, routes, and parents were preserved.

## Approved Package Contract

| Page ID | Service | Package | Duration | Price |
| ---: | --- | --- | ---: | ---: |
| 1054 | Hand Paraffin | Hand Paraffin | 30 min | AED 60 |
| 1056 | Classic Manicure | With Color | 45 min | AED 78 |
| 1056 | Classic Manicure | Without Color | 40 min | AED 72 |
| 1056 | Classic Manicure | French Tip | 60 min | AED 84 |
| 1058 | Spa Manicure | Spa Manicure | 60 min | AED 96 |
| 1060 | Classic Nails Extension | Classic Nails Extension | 90 min | AED 120 |
| 1062 | Gelish Manicure | Gelish Manicure | 90 min | AED 120 |
| 1064 | French Gel Manicure | French Gel Manicure | 90 min | AED 144 |
| 395 | Gel Nail Extensions | Gel Nail Extensions | 120 min | AED 300 |
| 1381 | French Gel Nail Extensions | French Gel Nail Extensions | 120 min | AED 320 |
| 1066 | Cat Eye Extensions | Cat Eye Extensions | 120 min | AED 350 |
| 396 | Acrylic Nail | Acrylic Nail Extensions | 120 min | AED 300 |
| 396 | Acrylic Nail | French Acrylic Nail Extensions | 120 min | AED 320 |
| 396 | Acrylic Nail | Acrylic Overlay Natural | 120 min | AED 280 |
| 396 | Acrylic Nail | Acrylic Refill Natural | 120 min | AED 250 |
| 396 | Acrylic Nail | Acrylic Repair | 30 min | AED 15 |
| 396 | Acrylic Nail | Acrylic Refill French | 120 min | AED 270 |
| 396 | Acrylic Nail | Acrylic Refill Ombre | 120 min | AED 260 |
| 396 | Acrylic Nail | Ombre Acrylic Extensions | 120 min | AED 400 |
| 1068 | Builder Gel Nails | Builder Gel (BIAB) | 120 min | AED 280 |
| 1068 | Builder Gel Nails | Builder Gel Overlay (BIAB) | 120 min | AED 300 |
| 1068 | Builder Gel Nails | Builder Gel Extensions (BIAB) | 120 min | AED 350 |

Every detail-page and hub card displays one Duration and one Price field. Placeholder Package, From, and From AED fields were removed. Hand Paraffin remains the sole Most Popular card on the hub; the first package remains the sole Most Popular card on each detail page.

## Menu Contract

The Manicure branch contains 11 detail links in the approved order: Hand Paraffin (`1054`), Classic Manicure (`1056`), Spa Manicure (`1058`), Classic Nail Extensions (`1060`), Gelish Manicure (`1062`), French Gel Manicure (`1064`), Gel Nail Extensions (`395`), French Gel Nail Extensions (`1381`), Cat Eye Extensions (`1066`), Acrylic Nail (`396`), and Builder Gel Nails (`1068`). Main Menu `12` remains at 89 items.

## Verification

- Captured a fresh authenticated production snapshot before writes.
- Drift-checked each of the 12 target pages immediately before saving.
- Exported every saved Elementor payload and confirmed zero new native lint errors.
- Independently audited all 22 generated package cards against the approved matrix before deployment.
- Updated the menu through dry-run and guarded replacement, then confirmed the 11-page branch order and unchanged 89-item total.
- Cleared Elementor, object, and Rank Math caches through the bridge.
- Confirmed HTTP 200 and required public content for all 11 detail pages and the Manicure hub.
- Checked the hub, Acrylic Nail, and Classic Manicure pages at 1440 px, 768 px, and 390 px. Revised content has no horizontal overflow at desktop or mobile. At 768 px, only the inherited shared-header email label extends the effective viewport; revised page content does not overflow.
- Captured desktop, tablet, and mobile screenshots for all three audited pages.
