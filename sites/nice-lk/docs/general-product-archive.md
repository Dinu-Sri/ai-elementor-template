# General Product Archive

## Live Target

- Elementor Theme Builder template: `6916`, `General Product Archive`
- Template type: `product-archive`
- Approved live baseline: `content/templates/general-product-archive-6916.live-baseline.json`
- Reproducible candidate: `content/templates/general-product-archive-6916.elementor.json`
- Archive-products widget: `455e1c3`

The owner-created container layout, archive widget, status, and Theme Builder conditions are preserved. The site-owned builder changes only the archive widget settings.

## Card System

- Four columns on desktop, two on tablet, and one on mobile.
- Equal-height white cards with restrained borders and shadows.
- Square product media using `object-fit: contain` so merchandise is not cropped.
- Three-line fixed title areas for short and long names.
- Bottom-aligned, full-width action buttons.
- Existing purple accent, dark action, sale badge, and pagination styling.
- Responsive spacing with no page-level horizontal overflow.

The custom rules live in Elementor's widget-level Custom CSS setting. The WooCommerce archive widget remains native and editable; no HTML widget or replacement product markup is introduced.

## Workflow

```powershell
pnpm run site:nice:general-archive:compile
pnpm run site:nice:general-archive:lint
pnpm run site:nice:general-archive:deploy
pnpm run site:nice:general-archive:smoke
```

The dedicated manifest updates only existing template `6916`. Deployment exports the WordPress-saved payload into ignored `build/` storage and compares it through the normal post-save lint path.

## Verified State

Checks completed on 2026-08-06:

- WordPress's exported Elementor data matched the local candidate exactly.
- The Personalized Gifts archive returned HTTP 200 with all 76 products.
- Twelve sampled desktop cards had identical 436px heights and action positions.
- Desktop, tablet, and mobile Chrome checks rendered 4, 2, and 1 columns.
- Tablet and mobile layouts had no page-level horizontal overflow.
