# Facial Service Revision - 2026-08-27

## Production Scope

- Site: `https://homesalon.ae`
- Facial hub: page `65`, `/facial/`
- Bleach hub: page `1377`, `/bleach/`
- Main Menu: `12`
- Deployment: authenticated Native Elementor Bridge API only

## Facial Contract

| Page ID | Service | Duration | Price |
| ---: | --- | ---: | ---: |
| 400 | Diamond Facial | 60 min | AED 360 |
| 403 | Dr. Renaud Facial | 60 min | AED 204 |
| 404 | Fruit Facial | 60 min | AED 180 |
| 402 | Gold Facial (Most Popular) | 60 min | AED 240 |
| 399 | Hydra Facial | 60 min | AED 300 |
| 401 | Pearl Facial | 60 min | AED 300 |
| 1052 | Face Clean Up | 45 min | AED 120 |

Hydra Facial also retains the client note that the optimum course is 10 sessions. Page `1052` was renamed from Clean Up Facial to Face Clean Up. Its existing `/facial/clean-up-facial/` URL was preserved to avoid breaking live links.

## Bleach And Scrub Menu Contract

The Bleach hub and menu branch contain Full Arm Bleaching (`1150`), Full Legs Bleaching (`1152`), Full Back and Front Bleaching (`1154`), Face Scrub (`1156`), and Full Body Scrub (`1162`). The two scrub pages retain their published `/scrub/` URLs.

The Scrub menu branch retains Full Arms Scrub (`1158`), Full Back and Front Scrub (`1160`), and Full Body Scrub With Mask (`1164`). The separate Scrub hub remains published.

## Verification

- Captured fresh production snapshots before and after writes.
- Validated exact page IDs, paths, publication states, prices, durations, package order, and Most Popular state.
- Exported every saved Elementor payload and confirmed zero new native lint errors.
- Cleared Elementor, object, and Rank Math caches through the bridge.
- Confirmed HTTP 200 and required public content for all seven Facial detail pages plus both hubs.
- Confirmed Main Menu `12` contains 90 items and the exact Facial, Bleach, and Scrub child contracts.
- Confirmed the revised hubs and Face Clean Up page have no horizontal overflow at 1440 px or 390 px. At 768 px, only the inherited shared-header email label extends the effective viewport by three pixels; revised page content does not overflow.
