# Eternal Moment Demo

Portable reference site for the master suite compiler and full-site workflow. It contains page, header, footer, menu, manifest, and smoke-test examples without sharing implementation details with another website.

```powershell
pnpm site:eternal:compile
pnpm site:eternal:lint
```

Deployment commands require `NEB_SITE_URL` and `NEB_API_KEY`. Review the IDs in `manifests/eternal-moment-demo.site.json` before targeting any WordPress installation.
