# Changelog

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
