# Waxing Service Revision - 2026-08-27

## Production Scope

- Site: `https://homesalon.ae`
- Waxing hub: page `66`, `/waxing/`
- Main Menu: `12`
- Deployment: authenticated Native Elementor Bridge API only
- All 11 approved detail pages already existed. No new WordPress pages were required.
- Existing page IDs, routes, publication states, and parents were preserved.

## Approved Package Contract

| Page ID | Service | Approved packages |
| ---: | --- | --- |
| 1096 | Upper Lip Waxing | Normal AED 24; Rica AED 36; Hard AED 48 |
| 1098 | Eyebrow Waxing | Normal AED 30; Rica AED 42; Hard AED 54 |
| 1100 | Chin Waxing | Normal AED 30; Rica AED 42; Hard AED 54 |
| 1102 | Underarms Waxing | Normal AED 48; Rica AED 60; Hard AED 72 |
| 1116 | Legs Waxing | Half Legs: Normal AED 48, Rica AED 60, Hard AED 72; Full Legs: Normal AED 96, Rica AED 108, Hard AED 120 |
| 1112 | Arms Waxing | Half Arms: Normal AED 48, Rica AED 60, Hard AED 72; Full Arms: Normal AED 72, Rica AED 84, Hard AED 96 |
| 1106 | Stomach Waxing | Half Stomach: Normal AED 60, Rica AED 72, Hard AED 84; Full Stomach: Normal AED 72, Rica AED 84, Hard AED 96 |
| 1104 | Chest Waxing | Normal AED 96; Rica AED 108; Hard AED 120 |
| 1120 | Bikini Waxing | Normal AED 108; Rica AED 120; Hard AED 132 |
| 1110 | Face Waxing | Normal AED 120; Rica AED 132; Hard AED 144 |
| 1122 | Full Body Waxing | Without Bikini: Normal AED 300, Rica AED 312, Hard AED 324; With Bikini: Normal AED 420, Rica AED 432, Hard AED 444 |

The matrix contains 45 packages. Every detail-page and hub card displays exactly one Price field. Duration, Package, From, and From AED fields are absent. Upper Lip Waxing - Normal is the sole Most Popular hub card; the first option remains the sole Most Popular card on each detail page.

Detail pages retain concise screenshot labels such as Normal, Rica, and Hard. The level-1 hub prefixes repeated labels with the service name so every package is unambiguous and links to the correct detail page.

## Menu Contract

The Waxing branch contains 11 detail links in the approved order: Upper Lip (`1096`), Eyebrow (`1098`), Chin (`1100`), Underarms (`1102`), Legs (`1116`), Arms (`1112`), Stomach (`1106`), Chest (`1104`), Bikini (`1120`), Face (`1110`), and Full Body (`1122`). Main Menu `12` remains at 89 items.

## Verification

- Captured a fresh authenticated production snapshot before writes.
- Confirmed all 11 approved detail pages were already published at the approved routes.
- Drift-checked each of the 12 target pages immediately before saving.
- Exported every saved Elementor payload and confirmed zero new native lint errors.
- Independently audited all 45 hub cards and all 45 detail cards against the approved matrix before deployment.
- Updated the menu through dry-run and guarded replacement, then confirmed the 11-page branch order and unchanged 89-item total.
- Cleared Elementor, object, and Rank Math caches through the bridge.
- Confirmed HTTP 200 and required public content for all 11 detail pages and the Waxing hub.
- Checked the hub, Legs Waxing, and Full Body Waxing pages at 1440 px, 768 px, and 390 px. Revised content has no horizontal overflow at desktop or mobile. At 768 px, only the inherited shared-header/dropdown width behavior extends the effective viewport; revised page content fits correctly.
- Captured valid desktop, tablet, and mobile screenshots for the audited pages.
