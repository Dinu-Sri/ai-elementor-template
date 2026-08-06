# Changelog

## 0.7.0 - 2026-08-06

- Added authenticated WooCommerce product-category listing and idempotent category upserts.
- Added draft-first simple and variable product upserts with stable source keys, category assignments, product media, stock, prices, dimensions, tax settings, and custom attributes.
- Added nested variation upserts with stable source keys or SKUs, stock, prices, attribute values, descriptions, and images.
- Added WooCommerce diagnostics to bridge status and the WordPress settings screen.
- Added a resumable, draft-only nice.lk catalog importer with pre-write snapshots, media reuse, category creation, variation normalization, and post-write verification.

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
