# nice.lk

Site-owned workspace for the nice.lk redesign and product-line expansion.

## Scope

- Preserve the current live homepage until a separate replacement page is reviewed and approved.
- Stage product data and images from `CCC Items.xlsx` before any WooCommerce import.
- Target new product lines:
  - Personalized Gifts
  - Mini Me
  - T-Shirt Printing
  - Corporate Gifts

## Safety

Credentials must stay in the current shell or ignored local configuration only. Do not commit snapshots, exports, deployment reports, screenshots, or generated product import output.

## Product Import

Validate the normalized CCC catalog locally:

```powershell
pnpm site:nice:products:check
```

Apply the catalog to the verified nice.lk bridge as drafts:

```powershell
$env:NEB_SITE_URL = "https://nice.lk"
$env:NEB_API_KEY = "your-local-key"
pnpm site:nice:products:import
```

The importer uses stable source keys, reuses its ignored media map, snapshots the existing catalog before every write, and verifies the saved draft products and variations after import.
