# SMS Home Ladies Salon Phase 2 Upgrade TODO

Date prepared: 2026-08-07

Status: superseded by the approved live implementation completed on 2026-08-13. See `phase2-approved-closeout.md` for the final state and verification record.

## Inputs Reviewed

- Client brief: `SMS_Home_Salon_Phase2_Developer_Brief.docx`
- Extracted planning text: `build/sites/sms-home-salon/phase2-intake/SMS_Home_Salon_Phase2_Developer_Brief.txt`
- Fresh read-only bridge snapshot: `build/sites/sms-home-salon/phase2-intake/native-bridge-snapshot-2026-08-07.json`
- Previous factual sitemap: `sites/sms-home-salon/docs/live-sitemap.md`

## Current Live Site State

- Site: SMS Home Ladies Salon
- URL: `https://homesalon.ae`
- Native Elementor Bridge: `0.8.0`
- Published pages: 28
- Draft pages: 36
- Main menus: 1
- Elementor templates: 6

Published top-level structure:

```text
/
+-- about/
+-- services/
+-- massage/
|   +-- deep-tissue-massage/
|   +-- hot-stone-massage/
|   +-- lymphatic-drainage-massage/
|   +-- madero-massage/
|   +-- pregnancy-massage/
|   +-- thai-massage/
+-- facial/
|   +-- diamond-facial/
|   +-- dr-renaud-facial/
|   +-- fruit-facial/
|   +-- gold-facial/
|   +-- hydra-facial/
|   +-- pearl-facial/
+-- hair/
|   +-- henna-application/
|   +-- keratin-treatment/
+-- nails/
|   +-- acrylic-nail/
|   +-- gel-nail-extensions/
+-- threading/
+-- waxing/
+-- contact/
+-- privacy/
+-- terms/
```

Current main menu has 26 items. Service category pages are top-level menu items, and selected detail pages are direct menu children under Massage, Facial, Hair, and Nails.

## Source Of Truth Rule

Because the live site has manual edits, do not treat older local JSON templates under `projects/sms-home-salon/` as authoritative. Before editing any page or template, export the current live object through the bridge into `build/sites/sms-home-salon/phase2-intake/` or a stage-specific `build/sites/sms-home-salon/phase2-stage-*` folder, compare against any reusable local source, and base the update on the fresh live export.

If a local draft/template conflicts with live Elementor data, preserve the live version and reconcile forward. Do not delete old local page JSON until a stage specifically approves cleanup.

## Approval Questions Before Build

1. Final fate of `/nails/`: keep as a combined landing page, redirect it to `/manicure/`, or retire it with redirects to Manicure/Pedicure pages.
2. Confirm relocating existing `/nails/gel-nail-extensions/` to `/manicure/gel-nail-extensions/` with a 301 redirect.
3. Confirm relocating existing `/nails/acrylic-nail/` to `/manicure/acrylic-nail/` with a 301 redirect.
4. Confirm whether "Classic Nails Extension" at AED120 should be named "Fake Nails" or kept as "Classic Nails Extension".
5. Confirm Threading combo pages are permanent offers: Brows + Upper Lip, Brows + Chin, Custom Threading Pack.
6. Pick canonical opening hours. The brief reports both `10:00 AM - 10:30 PM` and `12:30 PM - 11:00 PM`.
7. Decide `/gallery/`: build a Gallery page or remove the nav link.
8. Decide `/pricing/`: redirect to `/services/` or remove the footer link.
9. Confirm final menu strategy: keep all service category pages top-level, or nest categories/details under Services.

## Stage 0 - Baseline And Safety

- Verify bridge status before each write stage.
- Capture a stage-specific live export of every target page/template.
- Record page IDs, slugs, menus, templates, and redirect requirements before writing.
- Run native lint on any edited Elementor payload before deployment.
- After each WordPress save, export back from live and lint again.
- Refresh Elementor/WordPress caches and smoke-test public URLs after each stage.
- Keep generated snapshots, reports, and temporary bridge data under `build/`.

## Stage 1 - Fix Live Bugs

- Homepage cache/template consistency: confirm only one homepage design is served and identify whether CDN/cache/template conditions cause alternate home renders.
- `/gallery/` 404: either create a Gallery page or remove the homepage top-nav link after approval.
- `/pricing/` 404: either redirect to `/services/` or remove the footer Company link after approval.
- Facial detail cross-sell links: change broken `/facial-skin-care/...` links to `/facial/...`.
- Nails detail cross-sell link: change `/nails/acrylic-nail-extensions/` to `/nails/acrylic-nail/`, or to the approved new Manicure URL if relocation is approved.
- Hub-page "Other Services" copy: align each card title, link, and description across Massage, Facial, Hair, Nails, Threading, and Waxing.
- Hot Stone Massage pricing: remove incorrect AED264/90min from the alternate homepage version; use AED300/60min and AED380/90min.
- Waxing hub pricing: add Hard-wax as the third price column.
- Opening hours: apply the approved canonical hours site-wide.

## Stage 2 - New Category Hubs

Create or build from live-derived templates:

| Category | URL | Notes |
|---|---|---|
| Manicure | `/manicure/` | Split from current Nails content. |
| Pedicure | `/pedicure/` | Split from current Nails content. Brief summary says 15 products, detailed list has 16 rows. |
| Bleach | `/bleach/` | New category from Facial's old Bleach & Polishing section. |
| Scrub | `/scrub/` | New category from Facial's old Bleach & Polishing section. |

Also update service navigation and category cross-sell modules once the new category URLs exist.

## Stage 3 - Existing Category Page Updates

- `/facial/`: remove the Bleach & Polishing section and keep only facial treatments.
- `/waxing/`: add Hard-wax pricing throughout the hub.
- `/hair/`: add Hair Cut, Hair Coloring, Blow Dry Straight, Blow Dry Curl, Eyelash Lifting, and Eyebrow Tint pathways.
- `/threading/`: prepare links/cards for all threading detail pages, including combo pages if approved.
- `/massage/`: add links/cards for the 8 missing massage detail pages.
- `/services/`: update master price list/category links so it reflects the expanded catalog.
- `/nails/`: handle according to the approved decision: combined landing, redirect, or retirement.

## Stage 4 - Detail Pages By Category

### Massage

New pages requested:

- `/massage/reflexology-massage/`
- `/massage/full-body-massage/`
- `/massage/full-back-massage/`
- `/massage/foot-massage/`
- `/massage/head-shoulder-massage/`
- `/massage/head-massage/`
- `/massage/head-neck-massage/`
- `/massage/shoulder-massage/`

Live drafts that may be reusable: Foot Massage, Full Body Massage, Head and Shoulder Massage, Reflexology Massage.

### Facial

New page requested:

- `/facial/clean-up-facial/`

Live draft that may be reusable: Clean Up Facial.

### Manicure

Target detail URLs:

- `/manicure/hand-paraffin/`
- `/manicure/classic-manicure/`
- `/manicure/spa-manicure/`
- `/manicure/classic-nails-extension/`
- `/manicure/gelish-manicure/`
- `/manicure/french-gel-manicure/`
- `/manicure/gel-nail-extensions/` from existing `/nails/gel-nail-extensions/`
- `/manicure/cat-eye-extensions/`
- `/manicure/acrylic-nail/` from existing `/nails/acrylic-nail/`, expanded with all Acrylic variants
- `/manicure/builder-gel-nails/`, expanded with BIAB variants

Live drafts that may be reusable: Builder Gel BIAB, Cat Eye Extensions, Classic Manicure, French Manicure, Gelish Manicure, Spa Manicure.

### Pedicure

Target detail URLs:

- `/pedicure/foot-paraffin/`
- `/pedicure/spa-pedicure/`
- `/pedicure/foot-scrub/`
- `/pedicure/classic-pedicure/`, with normal/color/French/polish variants
- `/pedicure/gel-pedicure/`, with gel color, Gelish, and French Gel variants
- `/pedicure/callus/`, with Callus Pedi and Callus Treatment variants
- `/pedicure/kids/`, with Kids Nail Polish, Kids Manepedi, Gel Mani Kids, and Gel Pedi Kids variants

Live drafts that may be reusable: Callus Treatment, Classic Pedicure, Foot Paraffin and Scrub, French Pedicure, Gelish Pedicure, Kids Mani Pedi, Spa Pedicure.

### Hair

Target detail URLs:

- `/hair/hair-cut/`, with Hair Trim and Straight Hair Cut variants
- `/hair/hair-coloring/`, with Only Application and Root Touch Up variants
- `/hair/blow-dry-straight/`
- `/hair/blow-dry-curl/`
- `/hair/eyelash-lifting/`
- `/hair/eyebrow-tint/`

Live drafts that may be reusable: Blow Dry and Styling, Eyebrow Tint, Eyelash Lifting, Hair Coloring, Hair Cut and Trim.

Brief note: Section 6.5 says "8 new pages", but the suggested URL grouping implies 6 new detail URLs plus variants. Reconcile before implementation.

### Waxing

New detail pages requested:

- `/waxing/upper-lip/`
- `/waxing/eyebrows/`
- `/waxing/chin/`
- `/waxing/underarms/`
- `/waxing/chest/`
- `/waxing/half-stomach/`
- `/waxing/full-stomach/`
- `/waxing/full-face/`
- `/waxing/half-arms/`
- `/waxing/full-arms/`
- `/waxing/half-legs/`
- `/waxing/full-legs/`
- `/waxing/bikini/`
- `/waxing/full-body-without-bikini/`
- `/waxing/full-body-with-bikini/`

Live drafts that may be reusable: Arms and Legs Waxing, Bikini Waxing, Body Wax Chest Back Stomach, Face Waxing, Full Body Waxing, Underarm Waxing.

### Threading

New detail pages requested:

- `/threading/chin/`
- `/threading/upper-lip/`
- `/threading/lower-lip/`
- `/threading/neck/`
- `/threading/forehead/`
- `/threading/side-locks/`
- `/threading/eyebrows/`
- `/threading/full-face-without-eyebrows/`
- `/threading/full-face-with-eyebrows/`
- `/threading/brows-upper-lip/`
- `/threading/brows-chin/`
- `/threading/custom-pack/`

Live drafts that may be reusable: Chin and Neck Threading, Eyebrow Threading, Full Face Threading, Lip Threading.

### Bleach

New detail pages requested:

- `/bleach/full-arm-bleaching/`
- `/bleach/full-legs-bleaching/`
- `/bleach/full-back-front-bleaching/`

Live draft that may be reusable: Body Bleaching.

### Scrub

New detail pages requested:

- `/scrub/face-scrub/`
- `/scrub/full-arm-scrub/`
- `/scrub/full-back-front-scrub/`
- `/scrub/full-body-scrub/`
- `/scrub/full-body-scrub-with-mask/`

Live drafts that may be reusable: Body Scrub, Face Scrub.

## Stage 5 - Menu, Redirects, And Sitemap

- Add approved new category hubs to the main menu.
- Decide how many detail pages should appear in the main dropdowns; the current menu already has 26 items and may become too large if every product is added.
- Add internal links from category hubs, Services page, and repeated cross-sell modules.
- Configure 301 redirects for any moved or retired URLs.
- Validate all public URLs, old URLs, and cross-sell links after deployment.
- Update `sites/sms-home-salon/docs/live-sitemap.md` after owner-approved launch.

## Stage 6 - QA Checklist

- Desktop, tablet, and mobile rendering for every edited template/page.
- Elementor native lint before and after live save.
- Broken-link scan for homepage, footer, category hubs, and detail pages.
- Pricing scan against the brief.
- Opening-hours scan site-wide.
- Menu click-through test.
- Cache/CDN purge and homepage consistency re-test.
- Export approved live pages/templates into site-owned tracked source when they become the new baseline.

## Recommended Approval Order

1. Approve Stage 1 bug fixes and canonical hours decisions.
2. Approve `/nails/`, Manicure/Pedicure relocation, and redirect decisions.
3. Approve Stage 2 category hubs.
4. Approve Stage 3 category hub updates.
5. Approve Stage 4 detail pages in batches by category.
6. Approve Stage 5 menu/redirect/sitemap finalization.
