# Services Master Catalogue Update - 2026-08-28

## Production Target

- Page ID: `61`
- Title: `Our Services`
- Public URL: `https://homesalon.ae/services/`
- Operation: update the existing production page through Native Elementor Bridge `0.9.0`

## Approved Catalogue

The master catalogue was rebuilt from the tracked, approved category revision sources rather than from the older cards on the Services page.

| Section | Package cards |
| --- | ---: |
| Massage | 32 |
| Nails | 40 |
| Hair | 18 |
| Facial & Skin Care | 15 |
| Waxing | 45 |
| Threading | 9 |
| **Total** | **159** |

The ten category buttons remain linked to Massage, Facial, Bleach, Scrub, Hair, Manicure, Pedicure, Kids Mani Pedi, Waxing, and Threading. Timed services display duration and price; Hair, Waxing, and Threading retain their approved price-only presentation. Every package card links to its canonical level-2 service page.

## Production Verification

- Captured a fresh full-site snapshot immediately before the write.
- Confirmed page ID, title, path, and live Elementor drift before updating.
- Local candidate lint: zero new errors.
- Export-back lint after the WordPress save: zero new errors.
- Public response: HTTP `200`.
- Rendered page: 159 package cards and six catalogue sections.
- Corrected spot checks: Pregnancy Massage 60 min / AED 280, Face Clean Up 45 min / AED 120, and Acrylic Repair 30 min / AED 15.
- Desktop, tablet, and mobile checks found no package-card overflow. A 7 px tablet-only page overflow is inherited from the existing header email text and is outside the catalogue containers.
