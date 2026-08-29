# Native Elementor Master Suite

A reusable development system for building, studying, upgrading, and operating WordPress websites with native Elementor data.

The suite separates reusable platform capabilities from individual website projects. AI authors structured blueprints and content; deterministic tools compile, validate, deploy, export, and verify the result. Generated pages remain editable through Elementor controls instead of hidden HTML or CSS.

## Capabilities

- Compile high-level page blueprints into Elementor containers and native widgets.
- Reject legacy sections, HTML-widget layouts, inline styles, unresolved links, and incomplete responsive settings.
- Deploy pages, Theme Builder templates, menus, posts, categories, media, Rank Math fields, and FAQ schema through an authenticated WordPress bridge.
- Snapshot existing Elementor sites before redesign work and export saved data after deployment.
- Run public smoke checks and desktop, tablet, and mobile overflow checks.
- Audit CMS-ready article packages, publish Markdown articles, manage AI-image metadata, and validate page SEO and media ALT text.
- Keep multiple website implementations isolated under `sites/` while sharing one compiler, bridge, registry, and workflow.

## Architecture

```text
Website brief or live-site snapshot
  -> site-specific design direction
  -> page blueprint or approved native payload
  -> component registry and layout solver
  -> Elementor compiler
  -> native editability lint
  -> WordPress bridge
  -> export-back lint and public verification
```

AI decides content, page intent, section rhythm, and component variants. The suite owns Elementor property names, responsive behavior, deployment, and safety checks.

## Repository Layout

| Path | Responsibility |
|---|---|
| `src/` | Reusable compiler, validator, and layout solver |
| `plugin/native-elementor-bridge/` | WordPress REST bridge, currently v0.9.0 |
| `tools/` | Generic compile, deploy, snapshot, SEO, media, and verification tools |
| `schemas/` | Blueprint contracts |
| `registry/` | Native component and design-route definitions |
| `sites/` | Isolated, versioned website implementations and reference projects |
| `docs/` | Platform architecture and operating guidance |
| `config/sites.example.json` | Sanitized local configuration example |
| `legacy/` | Read-only historical systems and superseded workflows |
| `.codebase-memory/graph.db.zst` | Portable code knowledge graph artifact |
| `build/` | Ignored generated payloads, reports, exports, screenshots, and packages |

## Quick Start

Requirements: Node.js, pnpm 9, WordPress 6+, Elementor, and PHP 7.4+ on the target site.

```powershell
corepack enable
pnpm install --frozen-lockfile
pnpm check
```

`pnpm check` audits the production SEO reference package, compiles the Eternal Moment reference site, and runs native Elementor lint against every compiled artifact.

## Add A Website

Create a self-contained site folder:

```text
sites/<site-slug>/
  assets/
  blueprints/
  content/
  docs/
  manifests/
  tools/
```

Keep reusable logic in the root. Keep brand content, live IDs, URLs, attachment mappings, design baselines, and one-off transforms inside the site folder. See [`sites/README.md`](sites/README.md).

Compile and lint any site manifest:

```powershell
node .\tools\site-workflow.js .\sites\<site-slug>\manifests\site.json compile
node .\tools\site-workflow.js .\sites\<site-slug>\manifests\site.json lint
```

## WordPress Bridge

Build the installable plugin package:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\package-plugin.ps1 -Version 0.9.0
```

Install the generated zip in WordPress, then keep credentials only in the current shell or an ignored local configuration:

```powershell
$env:NEB_SITE_URL = "https://example.com"
$env:NEB_API_KEY = "your-local-key"
```

The REST base is `/wp-json/native-elementor/v1`. The bridge supports pages, templates, Theme Builder conditions, nested menus, site snapshots, posts and scheduled publishing, categories, authors, media, WooCommerce product categories, draft-safe simple and variable product upserts, JetWooBuilder template cloning and category-specific single-product rules, Rank Math metadata, redirections and Local Business hours, cache refresh, and export-back inspection.

See [`docs/native-elementor-bridge-api.md`](docs/native-elementor-bridge-api.md) for the complete authenticated endpoint catalogue, prerequisites, and safe operating contract. WooCommerce-specific request details and draft-safety behavior are documented in [`docs/woocommerce-bridge-api.md`](docs/woocommerce-bridge-api.md).

For an existing site, snapshot first:

```powershell
$env:NEB_INCLUDE_DATA = "true"
node .\tools\site-workflow.js .\sites\<site-slug>\manifests\site.json snapshot
```

Deploy only after reviewing target IDs and local lint results:

```powershell
node .\tools\site-workflow.js .\sites\<site-slug>\manifests\site.json all
```

The `all` action compiles, lints, deploys, exports saved Elementor data, refreshes caches, and performs configured smoke checks.

## SEO And Editorial Workflow

Audit a CMS article package:

```powershell
node .\tools\audit-seo-package.js .\sites\<site-slug>\content\seo-package
```

Publish or update one reviewed article and its assets:

```powershell
$env:NEB_POST_STATUS = "draft"
node .\tools\publish-seo-pilot.js <article.md> <asset-root>
```

Apply and validate page metadata and media ALT text from a site-owned configuration:

```powershell
node .\tools\apply-site-seo-media.js <site-seo-config.json>
node .\tools\validate-site-seo-media.js <site-seo-config.json>
```

AI-assisted images can be tagged with IPTC Digital Source Type metadata. Set `NEB_IMAGE_CREATOR`; optionally set `NEB_IMAGE_CREDIT` and `NEB_IMAGE_RIGHTS`, then run `pnpm seo:tag-ai-images -- <image...>`. Follow [`docs/ai-image-editorial-policy.md`](docs/ai-image-editorial-policy.md) for disclosure and evidence rules.

## Reference Implementations

- `sites/eternal-moment-demo/` is the portable compiler and Theme Builder demonstration used by the automated check.
- `sites/sms-pet-grooming/` is a production-scale reference with owner-edited landing-page baselines, separate service pages, active blog templates, 50 published SEO articles, media assets, and site-specific verification tools.

Reference sites demonstrate the platform; they do not define its architecture. New websites should receive their own folder and design system.

## Repository Policy

- Track approved blueprints, native source payloads, content packages, production assets, manifests, and the compressed graph artifact.
- Do not track API keys, `.env` files, local site configs, dependencies, plugin zips, snapshots, exports, screenshots, reports, or other `build/` output.
- Treat live manual Elementor edits as authoritative for an existing site. Capture and promote a fresh export before deriving or deploying related pages.
- Treat `legacy/` as study-only. Never deploy legacy scripts or plugins to a current website.

Start with [`AGENTS.md`](AGENTS.md) for the complete AI operating contract and [`docs/architecture.md`](docs/architecture.md) for platform design details.
