# Photobook Archive

## Live Target

- Elementor Theme Builder template: `6567`, `Shop Photobooks Archive`
- Template type: `product-archive`
- Approved live baseline: `content/templates/shop-photobooks-archive-6567.live-baseline.json`
- Reproducible candidate: `content/templates/shop-photobooks-archive-6567.elementor.json`

The current design, filter controls, album-theme chips, price range, product grid, and display conditions are preserved. The shop's album-only scope is enforced through WooCommerce's native multi-category query so result counts and pagination are not cosmetically hidden or recalculated in the browser.

## Album Scope

The shop query includes products assigned to any of these album-size categories:

- `10x15`
- `12x17`
- `6x12`
- `8x12`

The archive filter omits these new product-line categories:

- `personalized-gifts`
- `mini-me`
- `t-shirt-printing`
- `corporate-gifts`

The separate General Product Archive template `6916` continues to serve the new category archives.

## Workflow

```powershell
pnpm run site:nice:archive:compile
pnpm run site:nice:archive:lint
pnpm run site:nice:archive:deploy
pnpm run site:nice:archive:smoke
```

The site-owned builder performs guarded, single-occurrence replacements against the approved live baseline. The dedicated manifest updates only existing template `6567` and exports the WordPress-saved payload back to ignored `build/` storage for post-save linting.

The candidate uses `lintMode: approved-baseline` with an explicit `approvedBaseline`. Inherited blocking findings must match the baseline by severity, Elementor path, and message; any new blocking finding fails the deployment.

## Verified State

Public browser checks on 2026-08-06 confirmed:

- `/shop/` resolves to the album-size query.
- Page 1 shows 24 of 31 album products.
- Page 2 shows the remaining 7 products.
- Pagination retains the album-size query.
- No new product-line chip or product appears in the photobook shop archive.
- The browser console reports no errors.
