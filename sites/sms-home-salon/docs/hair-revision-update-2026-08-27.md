# Hair Service Revision - 2026-08-27

## Production Scope

- Site: `https://homesalon.ae`
- Hair hub: page `64`, `/hair/`
- Main Menu: `12`
- Deployment: authenticated Native Elementor Bridge API only
- Existing published page IDs, routes, and parents were preserved. Standalone Henna Application page `397` was retained as a draft.

## Approved Package Contract

| Page ID | Service | Package | Price |
| ---: | --- | --- | ---: |
| 398 | Keratin Treatment | Short Hair | AED 600 |
| 398 | Keratin Treatment | Medium Hair | AED 800 |
| 398 | Keratin Treatment | Long Hair | AED 1000 |
| 1084 | Hair Cut | Hair Trim | AED 60 |
| 1084 | Hair Cut | Straight Hair Cut | AED 180 |
| 1086 | Hair Coloring | Only Color Application | AED 120 |
| 1086 | Hair Coloring | Root Touch Up | AED 120 |
| 1086 | Hair Coloring | Henna Application | AED 120 |
| 1088 | Blow Dry Straight | Blow Dry (Straight) Short | AED 144 |
| 1088 | Blow Dry Straight | Blow Dry (Straight) Medium | AED 168 |
| 1088 | Blow Dry Straight | Blow Dry (Straight) Long | AED 180 |
| 1088 | Blow Dry Straight | Blow Dry (Straight) Extra Long | AED 204 |
| 1090 | Blow Dry Curl | Blow Dry (Curl) Short | AED 156 |
| 1090 | Blow Dry Curl | Blow Dry (Curl) Medium | AED 180 |
| 1090 | Blow Dry Curl | Blow Dry (Curl) Long | AED 192 |
| 1090 | Blow Dry Curl | Blow Dry (Curl) Extra Long | AED 216 |
| 1092 | Eyelash Lifting | Eyelash Lifting | AED 150 |
| 1094 | Eyebrow Tint | Eyebrow Tint | AED 100 |

Hair Trim remains the sole Most Popular package on the Hair hub. Henna Application is represented under Hair Coloring and its hub card links to `/hair/hair-coloring/`. Standalone page `397` is draft and returns the public Page Not Found response. Every Hair package card contains one Price field and no Duration, Package, From, or From AED field.

## Menu Contract

The Hair branch contains seven published detail links in this order: Keratin Treatment (`398`), Hair Cut (`1084`), Hair Coloring (`1086`), Blow Dry Straight (`1088`), Blow Dry Curl (`1090`), Eyelash Lifting (`1092`), and Eyebrow Tint (`1094`). Main Menu `12` contains 89 items after removing the drafted Henna page.

## Verification

- Captured a fresh production snapshot before writes.
- Drift-checked every target immediately before saving.
- Exported every saved Elementor payload and confirmed zero new native lint errors.
- Cleared Elementor, object, and Rank Math caches through the bridge.
- Confirmed HTTP 200 and required public content for all seven published detail pages and the Hair hub, plus a non-public response for the drafted Henna URL.
- Independently inspected the rendered package-section heading hierarchy: 18 hub cards and 18 detail cards, with one Price label per card and no Duration, Package, or From fields.
- Confirmed no horizontal overflow at 1440 px or 390 px on the Hair hub, Blow Dry Curl, and Hair Coloring pages. At 768 px, only the inherited shared-header email label extends the effective viewport by three pixels; revised page content does not overflow.
- Visually checked the desktop Hair hub and a mobile Blow Dry Curl page. Removed the redundant legacy Blow Dry Curl button found above the hub grid.
- Independently confirmed Hair Coloring renders Only Color Application, Root Touch Up, and Henna Application at AED 120; the Hair hub renders 18 price-only cards and links Henna Application to Hair Coloring.
