# Cat Landing Page Baseline

Captured from the live site on 2026-07-21 before cat landing-page development.

## Sources

- Dog landing page source of truth: page `1044`, `/native-review-sms-pet-landing-page/`
- Current cat service content: page `244`, `/cat-grooming/`
- Current dog service reference: page `216`, `/dog-grooming/`
- Full live site snapshot: `build/site-intake/sms-pet-grooming/site-snapshot.json`
- Dated immutable baseline: `build/site-intake/sms-pet-grooming/baselines/20260721-115923/`
- Working latest extracts: `build/site-intake/sms-pet-grooming/latest/`
- Tracked approved dog baseline: `sites/sms-pet-grooming/content/elementor/baselines/dog-landing-live-1044.json`

Raw intake snapshots remain ignored build artifacts. The owner-approved page 1044 export is promoted into the tracked site folder so future landing builders are reproducible without treating the older blueprint as authoritative.

## Implementation Rule

Use the saved live Elementor data for page `1044` as the template. Preserve its section order, container hierarchy, responsive settings, spacing, card dimensions, typography, buttons, form area, and manually edited hero. Adapt only the animal-specific text, icons, media, links, package data, and color accents needed for the cat page.

Do not rebuild the dog page from the older blueprint. Do not deploy changes to page `1044`.

## Dog Page Structure To Preserve

1. Header separator and hero
2. Five benefit highlights and image carousel
3. Three-column "when grooming at home makes sense" content
4. Discount offer
5. Basic grooming package cards
6. Full grooming package cards
7. Add-on service point lists
8. Four-step appointment flow
9. Customer review shortcode
10. Other pet services cards
11. Booking form shortcode
12. Existing site footer

The content sections use full-width backgrounds with a centered inner content width. Desktop section padding is mostly `40px 24px`; tablet uses `64px 24px`; mobile uses `48px 16px`. Package cards are white, `24px` radius, and approximately `342px` wide on desktop. Typography is Inter throughout, with a `54px` desktop H1, `36px` desktop H2, `17px` card headings, and `16px` body copy.

## Cat Theme Direction

Retain the dog page's visual hierarchy and component styling. Use the current cat-service blue `#3382EA` as the primary cat accent, with pale blue section backgrounds and white cards. Keep orange only where it remains part of the shared SMS Pet brand or a deliberate conversion accent.

Icons should be cat-appropriate while keeping the same size, alignment, and container treatment as the corresponding dog-page icons.

## Cat Package Content

### Cat Basic Grooming - AED 200

- Nail clipping and trim around the paws
- Ear, paw, and eye cleaning
- Trim or shave the bum area
- Bath and blow dry
- Deshedding and brushing
- Perfume when requested
- Anal glands expression

### Cat Full Grooming - AED 280

- Everything in Basic Grooming
- Shave and trimming all over

## Cat Add-Ons

Display add-ons as grouped point lists only, matching the live dog landing page. Do not create separate add-on cards and do not show add-on prices.

- Dematting or detangling matted hair
- Tick removal
- Flea and tick bath
- Deshedding
- Medicated bath
- Teeth brushing
- Eye cleaning and trimming
- Anal glands expression
- Bum-area shave or trim
- Nail clipping
- Ear cleaning

## Safety Before Deployment

Before any cat-page deployment, take another timestamped live snapshot and preserve the target page's existing Elementor data. Deploy only to a new cat landing-page ID or an explicitly confirmed target ID. Run export lint and public desktop/mobile smoke checks after deployment.
