# Homepage Current-Design Upgrade

## Intent

Extend the approved live homepage rather than introduce a new visual identity. Preserve the current photobook-led experience while making the new product lines visible and useful.

Page `6580` was promoted to the live homepage after review. A fresh export of its nine-section public state is tracked at `content/pages/home-live-6580.elementor.json`, and the manifest records its public `/` path and published status so future deployments preserve the approved live state. The earlier ten-section preview remains a historical candidate and is not the deploy source.

## Section Order

1. Existing photobook slider
2. New product categories: Personalized Gifts, Mini Me, T-Shirt Printing, Corporate Gifts
3. Existing photobook category grid
4. New six-product showcase using CCC workbook media
5. Existing alternating promotional sections
6. Existing offer section
7. New bulk-order quote band
8. Existing contact strip
9. Existing testimonial section

## Rebuild

Run the site-owned builder before the normal manifest workflow:

```powershell
node .\sites\nice-lk\tools\build-current-home-upgrade.js
node .\tools\site-workflow.js .\sites\nice-lk\manifests\nice-lk.site.json compile
node .\tools\site-workflow.js .\sites\nice-lk\manifests\nice-lk.site.json lint
```

The builder reads the latest ignored intake snapshot, records page `238` as the historical baseline, and regenerates the earlier ten-section candidate. It does not replace the approved page `6580` live export used by the manifest.
