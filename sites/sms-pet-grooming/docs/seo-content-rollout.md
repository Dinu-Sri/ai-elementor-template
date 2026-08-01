# SMS Pet SEO Content Rollout

## Source Of Truth

The reviewed 50-article CMS package is stored at `sites/sms-pet-grooming/content/seo-50-package/`. Production assets are stored at `sites/sms-pet-grooming/assets/seo-50/`. Page Rank Math fields and media ALT requirements are stored at `sites/sms-pet-grooming/content/seo/site-page-seo-and-media-alt.json`.

## Published State

- All 50 mapped articles are published.
- Categories cover Cat Grooming (17), Dog Grooming (16), Bird Grooming (9), and Rabbit Grooming (8).
- Article permalinks and canonicals use root-level `/{slug}/` URLs.
- Internal article links were normalized to the same root-level structure; stale `/blog/{slug}/` links are not permitted.
- `/blog/` remains the archive page, not the article permalink prefix.
- Rank Math titles, descriptions, focus keywords, canonicals, robots, and social fields are managed through bridge post/page endpoints.
- The active single-post Theme Builder template supplies one visual and service disclosure; article bodies do not duplicate it.
- Generated editorial visuals use descriptive ALT text, AI-assisted captions where appropriate, and `trainedAlgorithmicMedia` metadata.

## Repeatable Checks

```powershell
pnpm seo:audit:sms
$env:NEB_SITE_URL = "https://smspetgrooming.ae"
$env:NEB_API_KEY = "your-local-key"
pnpm seo:validate:sms
pnpm seo:validate-site -- .\sites\sms-pet-grooming\content\seo\site-page-seo-and-media-alt.json
```

The SMS-specific batch validator checks all published posts, direct canonicals, featured images, Rank Math fields, FAQ data, internal links, the template disclosure count, and the public archive. Generated reports remain under ignored `build/deployments/`.

## Future Article Gate

1. Audit the package and resolve every content, link, schema, visual, and metadata issue.
2. Obtain expert and commercial review where the article makes service, welfare, pricing, or outcome claims.
3. Generate only explanatory assets; use consented real evidence where an actual customer, appointment, result, or facility is claimed.
4. Publish as draft first with `NEB_POST_STATUS=draft`.
   Set `NEB_ARTICLE_CLASS_PREFIX=sms` to preserve the existing SMS article CSS contract.
5. Verify the preview, one page H1, headings, internal links, responsive tables, ALT text, schema, canonical, and template disclosure.
6. Publish only after owner approval, then run the site-specific post and media validators.
