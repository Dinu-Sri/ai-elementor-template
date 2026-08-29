# Native Elementor Bridge API

Native Elementor Bridge `0.9.0` exposes authenticated WordPress operations for reusable site workflows. Install the plugin from `plugin/native-elementor-bridge/`, generate its API key in WordPress, and keep that key outside tracked files.

## Connection

```powershell
$env:NEB_SITE_URL = "https://example.com/wp-json/native-elementor/v1"
$env:NEB_API_KEY = "your-local-key"
```

All requests use the `X-API-Key` header. The REST base is:

```text
/wp-json/native-elementor/v1
```

Call `GET /status` before any operation and verify the site identity, bridge version, and optional plugin diagnostics. Production workflows must also confirm every target ID, capture a fresh snapshot, lint locally, export and lint the saved payload, clear caches, and verify public rendering.

## Endpoint Catalogue

| Method | Endpoint | Capability |
| --- | --- | --- |
| `GET` | `/status` | Bridge, site, Elementor, Rank Math, WooCommerce, and JetWooBuilder diagnostics |
| `GET` | `/pages` | List WordPress pages and optional Elementor payloads |
| `POST` | `/pages` | Create a native Elementor page |
| `GET` | `/pages/{id}` | Export one page and its Elementor data |
| `PUT` | `/pages/{id}` | Update an existing page while preserving its WordPress identity |
| `GET` | `/templates` | List Elementor templates |
| `POST` | `/templates` | Create an Elementor template |
| `GET` | `/templates/{id}` | Export one template |
| `PUT` | `/templates/{id}` | Update an existing template |
| `GET` | `/theme-builder` | Inspect Elementor Theme Builder availability and conditions |
| `GET` | `/menus` | Export WordPress menus as nested trees |
| `POST` | `/menus` | Dry-run or apply guarded nested-menu upserts |
| `GET` | `/site-snapshot` | Export the current site inventory and optional Elementor data |
| `POST` | `/clear-cache` | Refresh Elementor, WordPress, Rank Math sitemap, and supported object caches |
| `GET` | `/posts` | List draft, scheduled, and published posts |
| `POST` | `/posts` | Create draft, scheduled, or published posts with SEO data |
| `GET` | `/posts/{id}` | Export one post and its metadata |
| `PUT` | `/posts/{id}` | Update content, scheduling, taxonomy, media, and SEO fields |
| `GET` | `/categories` | List blog categories |
| `POST` | `/categories` | Create or update a blog category |
| `GET` | `/authors` | List eligible post authors |
| `GET` | `/media` | Search and list media attachments |
| `POST` | `/media/upload` | Upload media from supported source data |
| `PUT` | `/media/{id}` | Update attachment title, slug, caption, description, and ALT text |
| `GET` | `/woocommerce/categories` | List WooCommerce product categories |
| `POST` | `/woocommerce/categories` | Create or update product categories |
| `GET` | `/woocommerce/products` | List products and variations |
| `POST` | `/woocommerce/products` | Draft-safe simple or variable product upsert |
| `GET` | `/woocommerce/products/{id}` | Export one product and its variations |
| `PUT` | `/woocommerce/products/{id}` | Update an existing product and variation contract |
| `GET` | `/jetwoo/templates` | List JetWooBuilder templates |
| `POST` | `/jetwoo/templates` | Create or clone a JetWooBuilder template |
| `GET` | `/jetwoo/templates/{id}` | Export one JetWooBuilder template |
| `PUT` | `/jetwoo/templates/{id}` | Update an existing JetWooBuilder template |
| `GET` | `/jetwoo/single-rules` | Inspect product single-template routing rules |
| `PUT` | `/jetwoo/single-rules` | Apply guarded category-specific single-template rules |
| `GET` | `/rank-math/redirections` | List Rank Math redirections |
| `POST` | `/rank-math/redirections` | Dry-run or apply guarded redirect upserts |
| `GET` | `/rank-math/local-business` | Export Rank Math Local Business settings and opening hours |
| `PUT` | `/rank-math/local-business` | Dry-run or update validated Local Business opening hours |

## Optional Dependencies

- Elementor is required for native page and template operations.
- Elementor Pro is required for Theme Builder features.
- Rank Math and the relevant modules are required for redirections, Local Business, and Rank Math SEO operations.
- WooCommerce is required for product and product-category endpoints.
- JetWooBuilder is required for JetWoo template and routing endpoints.

Unavailable optional systems are reported through `GET /status`; their endpoints fail closed instead of silently changing unrelated WordPress data.

## Reusable Workflow

1. Verify `NEB_SITE_URL`, `GET /status`, bridge `0.9.0`, and the intended site identity.
2. Capture `GET /site-snapshot` into ignored `build/` storage.
3. Export every existing target and reconcile live edits before compiling a candidate.
4. Run native lint and site-specific content contracts locally.
5. Apply only explicit IDs or create explicitly approved new objects.
6. Export each saved object and run native lint again.
7. Call `POST /clear-cache`.
8. Run public smoke, link, SEO, and responsive checks.
9. Promote the approved source payload or site-owned transformation into `sites/<site-slug>/`.

Do not commit API keys, production snapshots, build reports, plugin zip packages, or credentials. Site URLs, WordPress IDs, content matrices, and brand-specific transformations belong only in their isolated site folders.
