# Site Workflow

The site workflow turns separate page and template pushes into one repeatable operation.

## Manifest

A site manifest lives in `sites/<site-slug>/manifests/` and defines:

- pages, with keys, slugs or paths, blueprint files, status, and optional existing WordPress IDs
- templates, with keys, blueprint files, Elementor Library type, display conditions, and optional existing WordPress IDs
- smoke checks for public rendering

Page keys become link tokens:

```json
{ "label": "Contact", "url": "{{page:contact}}" }
```

During compile, the workflow resolves those tokens from the manifest page map. If any `{{token}}` remains unresolved, compile fails before deployment.

## Commands

Compile all artifacts:

```powershell
npm run site:eternal:compile
```

Lint all compiled artifacts:

```powershell
npm run site:eternal:lint
```

Deploy pages and templates, then export saved Elementor data back from WordPress:

```powershell
$env:NEB_SITE_URL = "https://example.com"
$env:NEB_API_KEY = "..."
npm run site:eternal:deploy
```

Run public smoke checks:

```powershell
$env:NEB_SITE_URL = "https://example.com"
npm run site:eternal:smoke
```

Full workflow:

```powershell
$env:NEB_SITE_URL = "https://example.com"
$env:NEB_API_KEY = "..."
npm run site:eternal:all
```

Download an existing site snapshot:

```powershell
$env:NEB_SITE_URL = "https://example.com"
$env:NEB_API_KEY = "..."
$env:NEB_INCLUDE_DATA = "true"
npm run site:eternal:snapshot
```

## Verification

The deploy workflow now checks three layers:

- local native lint before push
- WordPress export-back native lint after save
- public HTML smoke markers after Theme Builder cache refresh
- optional responsive CDP checks for desktop, tablet, and mobile overflow/menu behavior

Reports are written under `build/sites/<site-slug>/`.

The default `lintMode` is `strict`. An owner-approved native export may use `lintMode: "approved-baseline"` when its remaining findings are warnings from Elementor normalization. This mode still blocks every error, preserves the raw score and `strict_ok` result, and must not be used to excuse HTML widgets or legacy layout structures.

Responsive check:

```powershell
node .\tools\responsive-check.js https://example.com/page/ .\build\sites\example\responsive-page
```

## Existing Site Intake

Bridge v0.6.0 provides snapshot endpoints for studying an existing site before generating changes:

- `GET /pages`
- `GET /templates`
- `GET /menus`
- `GET /site-snapshot`

Use `include_data=true` when the agent needs full Elementor JSON for design-system analysis.

Bridge v0.6.0 also supports authenticated post, category, author, media, Rank Math metadata, and safe page/template update operations. Site-specific content and IDs remain outside the generic workflow under `sites/<site-slug>/`.
