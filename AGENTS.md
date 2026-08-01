# Native Elementor Master Suite Agent Guide

Read this file before changing code, content, or a connected WordPress site.

This repository is a reusable master suite for developing and upgrading many websites. The root contains shared platform capabilities. Each website belongs in an isolated `sites/<site-slug>/` folder. Never place one client's brand assumptions, URLs, WordPress IDs, attachment mappings, or content defaults into reusable core code.

## Discovery Priority

Use the persistent Codebase Memory graph before filesystem search when locating code definitions, dependencies, routes, or call paths. Use text search for literals, configuration values, non-code files, or when graph results are insufficient.

## Architecture

- `src/compiler/` compiles structured blueprints into native Elementor JSON.
- `src/validator/` enforces native editability and responsive requirements.
- `src/layout/` solves safe grid and flex dimensions.
- `plugin/native-elementor-bridge/` provides authenticated WordPress REST operations.
- `tools/site-workflow.js` compiles, lints, deploys, exports, snapshots, and smoke-tests manifests.
- `tools/` contains reusable SEO, media, packaging, and responsive-check utilities.
- `schemas/` and `registry/` define portable contracts and approved components.
- `sites/` contains all website-specific implementation data.
- `legacy/` is read-only study material and is not part of the active runtime.

## Workflow Selection

Infer the workflow from the request when the evidence is clear. Ask only when choosing incorrectly could overwrite live work.

1. Fresh Build
   - Gather the business brief, audience, goals, pages, content, assets, references, and constraints.
   - Create a unique design direction and a new `sites/<site-slug>/` folder.
   - Author blueprints and a site manifest, then compile and lint before deployment.

2. Existing Site Intake
   - Verify the bridge and take a full site snapshot before proposing changes.
   - Study page structure, widgets, design tokens, templates, menus, responsive behavior, and manual edits.
   - Save approved source payloads or baselines inside the site's tracked folder.
   - Update only explicitly targeted WordPress IDs.

3. Content And SEO Operations
   - Audit source packages before publishing.
   - Keep article, media, taxonomy, internal-link, canonical, and Rank Math data site-owned.
   - Default new or changed posts to draft unless publication is explicitly approved.
   - Validate public URLs, metadata, schema, internal links, image ALT text, and template-provided disclosures after publishing.

## Source Of Truth

Use this precedence for existing websites:

1. A fresh export of the currently approved live Elementor page or template.
2. A tracked native payload explicitly marked as the approved live baseline.
3. A compiled blueprint that has passed local and export-back lint.
4. Historical files under `legacy/`, for study only.

Never overwrite a manually edited live page from an older blueprint. If live and local state differ, snapshot and reconcile first. Preserve the user's work unless the user explicitly requests replacement.

## Hard Rules

- Build layouts with Elementor containers and native widgets.
- Do not use HTML widgets, inline styles, or custom CSS as the normal generated layout path.
- Do not generate final Elementor JSON directly unless maintaining the compiler or preserving an approved native export.
- Require desktop, tablet, and mobile settings from the first build.
- Resolve links through manifest tokens where possible and fail unresolved placeholders.
- Keep shared logic brand-neutral and move site-specific behavior into `sites/<site-slug>/tools/`.
- Never write credentials into tracked files, command output reports, documentation, or examples.
- Never commit `build/`, `node_modules/`, plugin zips, snapshots, screenshots, deployment reports, or Codebase Memory local state.
- Commit only `.codebase-memory/graph.db.zst` from Codebase Memory.
- Never run or deploy anything under `legacy/` without explicit user direction.

## Safe WordPress Changes

Before any write:

- Confirm `NEB_SITE_URL` points to the intended site.
- Confirm every `existingId` belongs to the intended page or template.
- Capture a current snapshot or target export into ignored `build/` storage.
- Compile and lint locally.
- Explain whether the operation creates a new object or updates an existing one.

After any write:

- Export the saved Elementor data and run native lint again.
- Refresh Elementor and WordPress caches.
- Run manifest smoke checks and responsive checks where available.
- Verify titles, URLs, Theme Builder conditions, forms, shortcodes, media, and public rendering.
- Promote an owner-approved live export into the site's tracked source when it becomes the new baseline.

## Site Layout

Use this convention:

```text
sites/<site-slug>/
  assets/       production assets owned by this site
  blueprints/   structured Elementor blueprints
  content/      native payloads, article packages, and SEO configs
  docs/         intake notes, decisions, and site-specific safeguards
  manifests/    deploy targets, IDs, conditions, and smoke checks
  tools/        one-off or brand-specific transforms and validators
```

Generated candidates and reports always go under root `build/`, preferably `build/sites/<site-slug>/`.

## Validation Commands

Run the full local baseline before committing:

```powershell
pnpm install --frozen-lockfile
pnpm check
git diff --check
```

For a specific manifest:

```powershell
node .\tools\site-workflow.js <manifest.json> compile
node .\tools\site-workflow.js <manifest.json> lint
```

When bridge PHP changes, bump both the plugin header version and `NEB_VERSION`, rebuild the zip locally, and verify the installed bridge status. Do not commit the zip.

## Completion Standard

A website operation is complete only when the local source is reproducible, native lint passes before and after WordPress save, public checks pass, manual edits are preserved, documentation reflects the new baseline, and no secret or generated state is staged.

Record durable platform lessons in `docs/`, site-specific lessons in `sites/<site-slug>/docs/`, and release changes in `CHANGELOG.md`.

<!-- codebase-memory-mcp:start -->
# Codebase Knowledge Graph (codebase-memory-mcp)

This project uses codebase-memory-mcp to maintain a knowledge graph of the codebase.
ALWAYS prefer MCP graph tools over grep/glob/file-search for code discovery.

## Priority Order
1. `search_graph` - find functions, classes, routes, variables by pattern
2. `trace_path` - trace who calls a function or what it calls
3. `get_code_snippet` - read specific function/class source code
4. `query_graph` - run Cypher queries for complex patterns
5. `get_architecture` - high-level project summary

## When to fall back to grep/glob
- Searching for string literals, error messages, config values
- Searching non-code files (Dockerfiles, shell scripts, configs)
- When MCP tools return insufficient results

## Examples
- Find a handler: `search_graph(name_pattern=".*OrderHandler.*")`
- Who calls it: `trace_path(function_name="OrderHandler", direction="inbound")`
- Read source: `get_code_snippet(qualified_name="pkg/orders.OrderHandler")`
<!-- codebase-memory-mcp:end -->
