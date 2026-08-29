# Changelog

## Unreleased

- Synchronized the master-seed documentation with Native Elementor Bridge 0.9.0, including the current packaging command and a reusable authenticated endpoint catalogue for pages, templates, menus, publishing, media, WooCommerce, JetWooBuilder, Rank Math, snapshots, and cache operations.
- Rebuilt the production Our Services master catalogue from the approved category sources with 159 package cards: 32 Massage, 40 Nails, 18 Hair, 15 Facial and Skin Care, 45 Waxing, and 9 Threading; removed stale package values and retained the ten category routes.
- Reconciled all 8 Threading detail pages and the production hub with 9 approved price-only packages, retained the combined Full Face page, removed Duration/Package/From fields, and preserved the 89-item menu.
- Extended the approved one-row package metric layout to all 17 Manicure and Pedicure subservice pages, covering 36 detail-page package cards without changing their prices or durations.
- Kept all Manicure and Pedicure level-1 package Duration and Price boxes aligned on one responsive row, including three-digit prices on mobile.
- Kept the Kids Mani Pedi package Duration and Price boxes on one responsive row by using native no-wrap metric containers with balanced 47% child widths.
- Reconciled all 11 Waxing detail pages and the production hub with 45 approved price-only packages, confirmed no new pages were required, removed Duration/Package/From fields, made repeated hub labels service-specific, and aligned the menu without changing its item count.
- Renamed page 1082 to Kids Mani Pedi, migrated it from `/kids/` to `/kids-mani-pedi/`, added four approved duration/price packages, updated menu and internal links, refreshed Rank Math metadata, and created a verified direct 301 redirect from the old URL.
- Reconciled all 6 Pedicure detail pages and the production hub with 14 approved duration/price packages, added Nail Filing and Gel Polish Remove, removed placeholder Package/From fields, and aligned the menu and hub order without changing the menu count.
- Reconciled all 11 Manicure detail pages and the production hub with 22 approved duration/price packages, corrected Acrylic Repair to AED 15 for 30 minutes, removed placeholder Package/From fields, and aligned the menu and hub order without changing the menu count.
- Reconciled all eight Bleach and Scrub detail pages and both production hubs with the approved duration/price matrix, restored the three-Bleach/five-Scrub taxonomy, removed placeholder Package/From fields, and realigned the main menu without changing its item count.
- Reconciled seven published Hair service pages and the Hair hub with 18 approved price-only packages, moved Henna Application into Hair Coloring, drafted the standalone Henna page, removed placeholder duration/from fields, and aligned the Hair menu with the approved service matrix.
- Reconciled the Facial and Bleach production hubs with the approved service matrix: seven Facial packages with Gold Facial marked Most Popular, five Bleach-menu packages, corrected durations and prices, and the Face Clean Up rename while preserving published URLs.
- Published Head, Neck and Shoulder Massage and Cupping Therapy as native Elementor pages, expanded the Massage hub and main menu to all 16 approved services, and reconciled the displayed 60/90-minute prices against the client revision.
- Replaced cloned Right for You card content across all 74 SMS Home Salon sub-service pages with unique, service-relevant introductions and cards, retaining useful common booking cards and verifying every production save through export-back, public, and responsive checks.
- Applied the client-approved, emoji-free At a Glance revisions to eight existing SMS Home Salon service pages through the authenticated production bridge, with fresh snapshot baselines, native lint, export-back contracts, cache refresh, public content checks, and responsive QA.

## 0.9.0 - 2026-08-13

- Add authenticated GET and guarded PUT operations for Rank Math Local Business opening hours.
- Validate weekday names and 24-hour ranges, support dry-run planning, preserve unrelated Rank Math settings, clear caches, and verify the saved option.

## 0.8.9 - 2026-08-12

- Invalidate Rank Math XML sitemap files and transients through its supported cache API whenever the authenticated bridge cache endpoint runs.

## 0.8.8 - 2026-08-12

- Allow the authenticated media update endpoint to update video and other attachment records, not only images.
- Add sanitized attachment slug updates so media permalink collisions can be resolved without changing the physical media file URL.

## 0.8.7 - 2026-08-12

- Added mandatory PHP CLI syntax validation to the bridge release check.
- Added an explicit Rank Math Redirections module check before exposing redirect operations.
- Matched Rank Math's two-argument redirection saved hook contract.
- Included case-sensitivity settings in redirect update and post-save verification.

## 0.8.6 - 2026-08-12

- Fixed PHP namespace separators in the Rank Math redirection integration introduced in 0.8.5.

## 0.8.5 - 2026-08-12

- Added authenticated Rank Math redirection listing and batch upsert endpoints.
- Added dry-run planning and guards against homepage redirects, external targets, duplicate sources, loops, chains, and unsafe shared-rule updates.
- Added transactional writes and post-save verification through Rank Math's native redirection model.
- Exposed Rank Math and redirection-module availability in bridge status.

## 0.8.4 - 2026-08-10

- Fixed scheduled draft updates by explicitly setting WordPress's `edit_date` flag when `date` or `date_gmt` is supplied.
- Added scheduler response validation so an unexpected immediate publication is reverted and the batch stops.

## 0.8.3 - 2026-08-09

- Added Native Elementor Bridge support for scheduling blog posts with `future` status plus `date` and `date_gmt` fields.
- Included scheduled posts in bridge blog post listings and post responses so SEO rollout schedules can be verified.

## 0.8.2 - 2026-08-07

- Expanded Native Elementor Bridge menu operations for nested WordPress navigation trees.
- Added menu dry-run planning, append/replace modes, richer menu item exports, source-key matching, page-object menu items, and parent/child menu item updates.
- Preserved existing menu identity when targeting an existing menu by ID without passing a replacement name or slug.

## 0.8.0 - 2026-08-06

- Added authenticated JetWooBuilder template listing, export, cloning, and update operations.
- Added reusable product-category routing rules for JetWooBuilder single-product templates while preserving the configured default template.
- Added a guarded nice.lk Gifts category assignment workflow that preserves every imported product's original category.
- Added the Gifts category to the general product archive and expanded equal-height title slots for the longest imported product names.

## 0.7.0 - 2026-08-06

- Added authenticated WooCommerce product-category listing and idempotent category upserts.
- Added draft-first simple and variable product upserts with stable source keys, category assignments, product media, stock, prices, dimensions, tax settings, and custom attributes.
- Added nested variation upserts with stable source keys or SKUs, stock, prices, attribute values, descriptions, and images.
- Added WooCommerce diagnostics to bridge status and the WordPress settings screen.
- Added a resumable, draft-only nice.lk catalog importer with pre-write snapshots, media reuse, category creation, variation normalization, and post-write verification.
- Added approved-live-baseline lint comparison so inherited blocking findings remain reported while new blocking regressions still stop deployment.
- Added an isolated nice.lk photobook archive workflow that preserves the existing design while keeping the shop query, filters, result counts, and pagination limited to album products.
- Added an isolated nice.lk general-product archive workflow with balanced 4/2/1 responsive cards, equal title and action alignment, uncropped product media, and guarded deployment to the owner-created template.

## 0.6.0 - 2026-08-01

- Reframed the repository as a reusable multi-website master suite with isolated implementations under `sites/`.
- Promoted approved Elementor payloads and live baselines out of ignored build storage so manifests are reproducible from a clean clone.
- Preserved the complete v2.2.0 system and superseded site workflows under a read-only `legacy/` boundary.
- Expanded the Native Elementor Bridge to pages, templates, posts, categories, authors, media, Rank Math metadata, FAQ schema, cache refresh, and safe update operations.
- Added production SEO article auditing, Markdown publishing, AI-image metadata, page metadata, media ALT, internal-link, and public rendering validation workflows.
- Added the SMS Pet Grooming production reference with 50 published articles and the Eternal Moment portable compiler reference.
- Added repository security policy, portable Codebase Memory persistence, agent operating rules, and generated-artifact exclusions.

## 0.3.0 - 2026-07-12

- Added `AGENTS.md` as the canonical single-file AI operating guide.
- Added existing-site intake bridge endpoints for page/template lists, menus, and full site snapshots.
- Added WordPress menu sync support for generated navigation.
- Added `HeaderNavMenu`, a native Elementor Pro `nav-menu` header component.
- Updated the Eternal Moment demo manifest to create a primary WordPress menu and feed it into the header template.
- Added `DesignFoundation` and `GalleryGrid` components for the design-system page workflow.
- Added responsive boxed-width defaults and CDP responsive overflow checks.
- Added an Eternal Moment design-system page that records typography, colors, buttons, cards, image/text sections, gallery, and CTA patterns.

## 0.2.0 - 2026-07-12

- Added bridge cache clearing and Theme Builder diagnostics.
- Regenerated Elementor Pro Theme Builder condition cache after template saves.
- Added site workflow compile/lint/deploy/export/smoke orchestration.
- Confirmed generated header and footer render on public demo pages.

## 0.1.0 - 2026-07-12

- Preserved legacy system under `legacy/v2.2.0/`.
- Added native-first compiler, validator, layout solver, examples, and bridge scaffold.
