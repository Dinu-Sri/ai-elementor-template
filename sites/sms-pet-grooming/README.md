# SMS Pet Grooming Reference

Production-scale existing-site reference implementation for `https://smspetgrooming.ae`.

This folder is site-owned data, not core platform behavior. It includes approved Elementor payloads, a protected owner-edited dog landing baseline, cat/bird/rabbit landing sources, active blog Theme Builder sources, the reviewed 50-article SEO package, production image assets, manifests, intake notes, and SMS-specific validation tools.

## Safety

- The tracked page 1044 dog landing export is the design baseline and must not be deployed over from the older generated blueprint.
- The owner-edited single-post template uses `approved-baseline` lint mode; its warning-only raw score remains visible and all errors remain blocking.
- Take a fresh snapshot before updating any existing page or template ID.
- Promote a newer owner-approved export when manual Elementor work changes the baseline.
- Keep credentials in `NEB_SITE_URL` and `NEB_API_KEY`; never add them here.

## Useful Commands

```powershell
pnpm seo:audit:sms
pnpm build:landing:sms:cat
pnpm build:landing:sms:bird-rabbit
pnpm seo:validate:sms
```

Landing builders write review candidates to ignored `build/sites/sms-pet-grooming/native-sources/`. They do not replace tracked approved payloads automatically.
