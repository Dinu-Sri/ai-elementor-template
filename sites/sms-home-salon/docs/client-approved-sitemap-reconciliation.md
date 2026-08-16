# SMS Home Salon Client Sitemap Reconciliation

Date: 2026-08-12
Status: deployed and verified on the live site
Client source: supplied 93-page inventory based on the shared Miro board
Live source: fresh Native Elementor Bridge 0.8.8 inventory and export-back checks

## Deployment Outcome

- Published the four approved category hubs and French Gel Nail Extensions page.
- Updated seven existing pricing pages and merged five pairs of service-package pages into their canonical keepers.
- Moved or renamed 36 existing pages while preserving their WordPress IDs and Elementor data.
- Drafted the five absorbed pages and three omitted Threading package pages after their redirects were active.
- Created and verified 44 direct Rank Math 301 redirects with no chains or duplicate sources.
- Rebuilt Main Menu ID `12` as an 88-item three-level hierarchy containing all 73 approved service-detail links while preserving its `menu-1` assignment.
- Replaced 12 retired internal links across two pages and five SEO posts; the final scan found zero remaining retired links.
- Resolved the approved Callus mapping as Callus Treatment `AED 160` and Callus Treatment With Polish `AED 180`.
- Final acceptance audit passed with 91 published pages, 50 posts, 44 targets returning HTTP 200, and 44 old sources returning the expected direct 301.

## Outcome

The client structure is implementable, but it is not only a menu update. It changes page parents, canonical URLs, page scope, and pricing content.

| Measure | Count |
| --- | ---: |
| Client inventory routes | 93 |
| Current published routes | 94 |
| Exact URL matches | 52 |
| Proposed URLs not currently live | 41 |
| Current URLs absent from proposal | 42 |
| New hub pages required | 4 |
| New detail pages required | 1 |
| Existing targets to move, rename, or merge | 36 |
| Current main-menu items | 24 |

The five genuinely new pages are:

1. `/bleach/`
2. `/scrub/`
3. `/manicure/`
4. `/pedicure/`
5. `/manicure/french-gel-nail-extensions/`

The other proposed additions already have usable live pages and should be migrated rather than rebuilt.

## Important Page-Count Conflict

The client's count of 93 includes all four of these routes as pages:

- `/nails/acrylic-nail/`
- `/manicure/acrylic-nail/`
- `/nails/gel-nail-extensions/`
- `/manicure/gel-nail-extensions/`

The same document recommends 301 redirects from the two `/nails/` detail URLs to `/manicure/`. These instructions conflict: after a 301 redirect, an old URL is not an active page.

Recommended resolution:

- Reuse live page ID `396` for canonical `/manicure/acrylic-nail/`.
- Reuse live page ID `395` for canonical `/manicure/gel-nail-extensions/`.
- Add 301 redirects from the old `/nails/` URLs.
- Do not create duplicate Elementor pages with duplicate content.
- Keep `/nails/` itself as a legacy umbrella landing page outside the header menu, updated to point to Manicure, Pedicure, and Kids.

With this canonical approach, the final site has **91 active/indexable pages**, not 93. If Henna Application is merged into Hair Coloring, it becomes 90.

## Exact Matches

The following areas already use the client-approved URLs:

- All seven global pages, including the new Blog page.
- Massage hub and all 14 massage detail pages.
- Facial hub and its seven approved facial pages.
- Hair hub and all eight listed hair pages.
- Nails hub and the two legacy Nails detail URLs, pending the canonical decision above.
- Threading hub plus Chin, Upper Lip, Lower Lip, Neck, Forehead, Eyebrows, Side Locks, and Full Face Without Eyebrows.
- Waxing hub only; all 15 current Waxing detail routes change under the client proposal.

## Required Route Moves

### Bleach

Create `/bleach/`, then preserve the existing page IDs while changing parent and URL:

| Current | Approved target |
| --- | --- |
| `/facial/full-arm-bleaching/` | `/bleach/full-arm-bleaching/` |
| `/facial/full-legs-bleaching/` | `/bleach/full-legs-bleaching/` |
| `/facial/full-back-front-bleaching/` | `/bleach/full-back-front-bleaching/` |

### Scrub

Create `/scrub/`, then preserve the existing page IDs while changing parent and URL:

| Current | Approved target |
| --- | --- |
| `/facial/face-scrub/` | `/scrub/face-scrub/` |
| `/facial/full-arm-scrub/` | `/scrub/full-arm-scrub/` |
| `/facial/full-back-front-scrub/` | `/scrub/full-back-front-scrub/` |
| `/facial/full-body-scrub/` | `/scrub/full-body-scrub/` |
| `/facial/full-body-scrub-with-mask/` | `/scrub/full-body-scrub-with-mask/` |

### Manicure

Create `/manicure/`, then migrate the existing pages:

| Current | Approved target | Note |
| --- | --- | --- |
| `/nails/hand-paraffin/` | `/manicure/hand-paraffin-manicure/` | Client suggests shortening target to `/manicure/hand-paraffin/`; approve one before migration. |
| `/nails/classic-manicure/` | `/manicure/classic-manicure/` | Move existing ID. |
| `/nails/spa-manicure/` | `/manicure/spa-manicure/` | Move existing ID. |
| `/nails/classic-nails-extension/` | `/manicure/classic-nails-extension/` | Move existing ID. |
| `/nails/gelish-manicure/` | `/manicure/gelish-manicure/` | Move existing ID. |
| `/nails/french-gel-manicure/` | `/manicure/french-gel-manicure/` | Move existing ID. |
| `/nails/cat-eye-extensions/` | `/manicure/cat-eye-extensions/` | Move existing ID. |
| `/nails/acrylic-nail/` | `/manicure/acrylic-nail/` | Move legacy ID `396`; do not duplicate. |
| `/nails/gel-nail-extensions/` | `/manicure/gel-nail-extensions/` | Move legacy ID `395`; do not duplicate. |
| `/nails/builder-gel-nails/` | `/manicure/builder-gel-nails/` | Move existing ID. |

Build one new detail page: `/manicure/french-gel-nail-extensions/`.

### Kids And Pedicure

Create `/pedicure/`, then migrate:

| Current | Approved target |
| --- | --- |
| `/nails/kids/` | `/kids/` |
| `/nails/foot-paraffin/` | `/pedicure/foot-paraffin/` |
| `/nails/classic-pedicure/` | `/pedicure/classic-pedicure/` |
| `/nails/gel-pedicure/` | `/pedicure/gel-pedicure/` |
| `/nails/spa-pedicure/` | `/pedicure/spa-pedicure/` |
| `/nails/callus/` | `/pedicure/callus-pedicure/` |
| `/nails/foot-scrub/` | `/pedicure/foot-scrub-pedicure/` |

## Required Content Merges

### Waxing

Every approved Waxing detail URL changes. Reuse existing pages rather than creating 11 replacements.

| Approved target | Existing source page(s) | Work |
| --- | --- | --- |
| `/waxing/upper-lip-waxing/` | `/waxing/upper-lip/` | Rename URL. |
| `/waxing/eyebrows-waxing/` | `/waxing/eyebrows/` | Rename URL. |
| `/waxing/chin-waxing/` | `/waxing/chin/` | Rename URL. |
| `/waxing/underarms-waxing/` | `/waxing/underarms/` | Rename URL. |
| `/waxing/chest-waxing/` | `/waxing/chest/` | Rename URL. |
| `/waxing/stomach-waxing/` | Half Stomach + Full Stomach | Merge both price variants and redirect both old URLs. |
| `/waxing/legs-waxing/` | Half Legs + Full Legs | Merge both price variants and redirect both old URLs. |
| `/waxing/arms-waxing/` | Half Arms + Full Arms | Merge both price variants and redirect both old URLs. |
| `/waxing/bikini-waxing/` | `/waxing/bikini/` | Rename URL. |
| `/waxing/face-waxing/` | `/waxing/full-face/` | Rename URL and approved page title. |
| `/waxing/full-body-waxing/` | With Bikini + Without Bikini | Merge both price variants and redirect both old URLs. |

This reduces 15 Waxing detail pages to 11 canonical pages.

### Threading

Keep the seven exact body-area pages unchanged. For Full Face Threading:

- Keep page ID `1140` at `/threading/full-face-without-eyebrows/` as the client-approved route.
- Rename the page title to `Full Face Threading`.
- Add both Without Eyebrows and With Eyebrows packages to that page.
- Redirect `/threading/full-face-with-eyebrows/` to it.

The following three current pages are absent from the approved inventory:

- `/threading/brows-upper-lip/`
- `/threading/brows-chin/`
- `/threading/custom-pack/`

Recommended resolution: remove them from navigation, change them to draft after the replacement structure is verified, and redirect them to `/threading/`. If the client still sells these packages, retain them as packages on the Threading hub rather than separate SEO pages.

## Pricing Conflicts

The automated live Elementor audit found eight client-specified price values that are not present in the corresponding current content.

| Page | Current values detected | Client values missing |
| --- | --- | --- |
| Full Body Massage | AED240 | AED380 |
| Head Massage | AED264 | AED216 |
| Head and Neck Massage | AED264 | AED216 |
| Head and Shoulder Massage | AED216 | AED264 |
| Shoulder Massage | AED264 | AED216 |
| Pregnancy Massage | AED299 | AED280 and AED380 |
| Acrylic Nail | AED300 | AED25, 250, 260, 270, 280, 320, and 400 |
| French Gel Nail Extensions | No live page | AED320 |

These pages need package-card, popup attribute, body-copy, structured data, and Rank Math checks after prices are corrected.

Also confirm the Callus labels. The client inventory says `AED160 · With Polish AED180`, while the earlier brief associated AED160 with Callus Pedi With Polish and AED180 with Callus Treatment. The same numbers exist, but their labels may be reversed.

## Decisions Needed

1. **Nails canonical rule:** approve moving IDs `395` and `396` to Manicure with 301 redirects. This is recommended over duplicate pages.
2. **Nails hub:** approve keeping `/nails/` as a hidden legacy umbrella page, or redirect it to `/manicure/`.
3. **Hand Paraffin slug:** choose `/manicure/hand-paraffin/` (recommended) or `/manicure/hand-paraffin-manicure/`.
4. **Henna Application:** keep the standalone legacy page and link the Hair Coloring package to it (recommended), or merge it into Hair Coloring and redirect the old page.
5. **Plural display names:** keep readable titles `Full Arms Bleaching` and `Full Arms Scrub` while retaining singular slugs. This is technically safe and recommended.
6. **Callus labels:** confirm which service is AED160 and which is AED180.
7. **Pricing:** approve the eight detected live-content corrections listed above.
8. **Header depth:** resolved on 2026-08-13; the full three-level service tree was approved and deployed.

## Approved Final Menu

### Header

```text
Home
Services
  Wellness
    Massage
      14 massage pages
  Skin
    Facial
      7 facial pages
    Bleach
      3 bleach pages
    Scrub
      5 scrub pages
  Hair
    Hair
      8 hair pages
  Nails
    Manicure
      11 manicure pages
    Pedicure
      6 pedicure pages
    Kids
  Hair Removal
    Waxing
      11 waxing pages
    Threading
      8 threading pages
About Us
Blog
Contact Us
```

This produces five top-level header items and 88 total menu items. The full detail hierarchy is deployed through the existing recursive Elementor desktop dropdown and mobile accordion behavior.

### Footer

```text
Company
  About Us
  Contact Us
  Blog
  Privacy Policy
  Terms of Use

Services
  Massage
  Facial
  Bleach
  Scrub
  Hair
  Manicure
  Pedicure
  Kids
  Waxing
  Threading
```

Do not include `/nails/` in the main header. It can remain reachable as a legacy umbrella page or be redirected after approval.

## Redirect Requirement

The recommended implementation needs approximately 44 one-hop 301 redirects:

- 3 Bleach moves
- 5 Scrub moves
- 10 Manicure moves
- 1 Kids move
- 6 Pedicure moves
- 15 Waxing renames/merges
- 4 Threading removals/merges

The current bridge can update page slugs, parents, metadata, and nested menus, but it does not manage Rank Math redirects. Before structural deployment, either:

1. Upgrade the bridge with safe Rank Math redirect list, dry-run, create/update, and verification endpoints; or
2. Configure and verify all redirects manually in Rank Math before changing the URLs.

The bridge upgrade is recommended because it allows the redirect plan to be reproducible and checked for loops, chains, duplicate sources, and missing targets.

## Implementation Order

1. Obtain approval for the eight decisions above.
2. Upgrade the bridge for Rank Math redirects, or prepare the redirects manually.
3. Snapshot every page in the route migration, merge, and pricing plans, plus the Main Menu and current Rank Math metadata.
4. Create the four category hubs and French Gel Nail Extensions as drafts.
5. Correct the eight pricing conflicts and verify all package popup attributes.
6. Add and validate the complete redirect plan before changing public paths.
7. Move direct pages by updating existing page IDs, slugs, and parents.
8. Merge Waxing and Threading content into the selected canonical page IDs.
9. Publish the five new pages and activate redirects in the same maintenance window.
10. Update links on Services, category hubs, cross-sell sections, Blog, and the 50 SEO articles.
11. Dry-run the replacement Main Menu through the bridge, inspect every hierarchy level, then apply it.
12. Refresh Elementor, WordPress, CDN, Rank Math sitemap, and permalink caches.
13. Verify all canonical targets return `200`, every old route returns one `301`, and no redirect chains exist.
14. Verify titles, canonicals, descriptions, schema, image alt text, popup attributes, desktop mega menu, and mobile accordion.
15. Regenerate the Draw.io navigation map and update `live-sitemap.md` from the approved live state.

## Completion Criteria

- Final active page count matches the approved canonical rule: 91, or 90 if Henna is merged.
- No duplicate Acrylic Nail or Gel Nail Extensions pages are indexable.
- All 44 retired/moved URLs redirect in one hop.
- All approved prices and package labels match the client inventory.
- Rank Math canonicals and XML sitemap contain target URLs only.
- Main-menu and footer links contain no retired routes.
- Existing Elementor manual edits and page IDs are preserved wherever content is migrated.
