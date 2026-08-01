# Website Projects

Each folder under `sites/` is an isolated implementation built with the shared master suite.

## Required Boundary

Store brand assets, content, blueprints, manifests, live WordPress IDs, site URLs, attachment mappings, baselines, and site-specific tools inside the website folder. Keep compiler behavior, schemas, validators, bridge endpoints, and generally reusable automation in the repository root.

Use this layout for a new website:

```text
sites/<site-slug>/
  README.md
  assets/
  blueprints/
  content/
  docs/
  manifests/
  tools/
```

Manifests use repository-root-relative paths so `tools/site-workflow.js` can run consistently from the suite root. Generated output belongs in ignored `build/sites/<site-slug>/`.

## Included References

- `eternal-moment-demo/` exercises portable blueprint compilation, menus, pages, headers, footers, export-back lint, and smoke checks.
- `sms-pet-grooming/` records a production existing-site workflow with approved native payloads, service landings, Theme Builder templates, SEO content, media, and site-specific validation.

Reference implementations are not starter themes. Begin every new website with its own brief and design direction.
