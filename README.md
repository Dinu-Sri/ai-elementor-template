# AI Elementor Template System

> **v1.8.2** — Build any WordPress/Elementor website AND semantic SEO content using AI. The system gets smarter with every site you build.

Build WordPress/Elementor websites and SEO content systems using AI. Generate pages and blog posts as JSON, push to WordPress via REST API, review, refine, repeat. Every bug fix, layout pattern, SEO strategy, and widget discovery is captured in the knowledge base (`CLAUDE.md`) so the next project starts where the last one left off.

```
 You Describe ──→ AI Generates JSON ──→ Push to WordPress ──→ Review in Browser
      ↑                                                              │
      └──────────────────── Feedback ────────────────────────────────┘

 SEO Strategy ──→ Topical Map ──→ AI Writes Articles ──→ Push to WordPress
      ↑                                                         │
      └────────────── Interlink Pass ───────────────────────────┘
```

**Built with this system so far:** Multi-page recruitment sites, education consultancies, landing pages, e-commerce SEO content (70+ blog posts, WooCommerce product/category descriptions) — with booking, SaaS, and portfolio sites on the roadmap. Each project teaches the AI new patterns that benefit all future projects.

---

## Features

### Web Design
- **Container-based Flexbox layouts** — Modern Elementor containers (no legacy sections/columns)
- **Iconify icon support** — 100,000+ icons from Tabler, Material, Phosphor, and more via custom widget
- **Header & Footer templates** — Full Theme Builder support with proper create/delete/re-create workflow
- **Responsive by default** — Desktop-first with tablet and mobile breakpoints on all elements
- **Design system driven** — 8pt grid spacing, typography scale, color palette from project brief
- **Diagnostics & logging** — Built-in error logging, system diagnostics, and dry-run tests
- **Animation safety** — Smart rules for which elements can be animated without rendering issues

### SEO & Content
- **Holistic SEO knowledge base** — Universal Koray Gubur methodology reference (`docs/holistic-seo-knowledge-base.md`)
- **Semantic topical maps** — Per-project strategy docs defining clusters, articles, publishing phases, and interlink plans
- **Blog post management** — Create, update, delete blog posts as JSON via REST API (v1.4.0)
- **Blog categories** — Create and manage WordPress blog categories via API
- **WooCommerce SEO** — Bulk-update product/category descriptions and SiteSEO meta (v1.3.0)
- **Product reviews & social proof** — Manage WooCommerce reviews via API with JetReview integration, reviewer identities, avatar sideloading, and sold counts (v1.8.0)
- **JSON-LD Schema Engine** — Comprehensive structured data: Organization, Product, BreadcrumbList, FAQPage, BlogPosting, AggregateRating (v1.6.0)
- **Local article copies** — Every blog post is kept as a local JSON file for updates, interlinking, and auditing
- **AI featured image generation** — Generate photorealistic images via FLUX.1 [dev] FP8 (Fireworks AI), auto-convert to WebP, push to WordPress as featured images (v1.5.0)
- **Featured image sideloading** — Upload images from URL directly to WordPress media library
- **Interlink workflows** — Comprehensive interlink passes across all articles after publishing

### System
- **Self-improving AI** — Every session discovers and records new Elementor property names, layout patterns, SEO strategies, and fixes
- **Project archiving** — Completed projects archived as starter kits with screenshots and design tokens

---

## Quick Start

### 1. Install the WordPress Plugin

1. Zip the `plugin/ai-elementor-sync/` folder
2. WordPress Admin → Plugins → Add New → Upload → Activate
3. Go to Settings → AI Elementor Sync → copy the API Key

### 2. Configure Your Site

Edit `config/sites.json`:

```json
{
    "sites": {
        "my-site": {
            "url": "https://your-wordpress-site.com",
            "api_key": "PASTE_YOUR_API_KEY_HERE",
            "description": "My Website"
        }
    }
}
```

### 3. Test Connection

```powershell
.\sync.ps1 -Site "my-site" -Action status
```

### 4. Initialize a Project

```powershell
.\init-project.ps1 -Name "my-site" `
    -Domain "https://your-wordpress-site.com" `
    -ApiKey "your-api-key" `
    -Business "My Business" `
    -PrimaryColor "#E63946" `
    -HeadingFont "Playfair Display" `
    -BodyFont "Source Sans Pro"
```

### 5. Start Building with AI

Open VS Code with GitHub Copilot (Claude) and say:

```
@workspace Read CLAUDE.md first. Then read projects/my-site/brief.json.
Build the Home page as projects/my-site/pages/home.json
```

### 6. Push to WordPress

```powershell
# Create new page
.\sync.ps1 -Site "my-site" -Action create `
    -TemplateFile ".\projects\my-site\pages\home.json" -Title "Home"

# Update existing page
.\sync.ps1 -Site "my-site" -Action update `
    -TemplateFile ".\projects\my-site\pages\home.json" -PageId 123

# Create header/footer (Theme Builder template)
.\sync.ps1 -Site "my-site" -Action create-template `
    -TemplateFile ".\projects\my-site\pages\header.json" -Title "Site Header"
```

---

## Project Structure

```
├── CLAUDE.md                    ← AI knowledge base (self-improving)
├── sync.ps1                     ← CLI for pushing templates to WordPress
├── init-project.ps1             ← Scaffolds new client projects
├── config/
│   └── sites.json               ← WordPress site connections
├── docs/
│   ├── design-system.json       ← Design rules (spacing, typography, colors)
│   ├── holistic-seo-knowledge-base.md ← Universal SEO strategy reference (Koray method)
│   ├── workflow-guide.md        ← Full workflow documentation
│   └── ai-prompt-templates.md   ← Ready-to-use prompts for AI
├── generate-featured-images.py   ← AI image generation tool (FLUX.1 + Fireworks)
├── plugin/
│   └── ai-elementor-sync/       ← WordPress REST API plugin (v1.8.0)
│       ├── ai-elementor-sync.php    ← Core plugin (pages, templates, blog, WooCommerce, diagnostics)
│       ├── schema-engine.php        ← JSON-LD schema + JetReview bridge + review management
│       ├── iconify-elementor-widget.php ← Custom Iconify icon widget
│       └── iconify-support.php      ← Iconify JS loader for frontend
├── templates/
│   ├── sample-landing-page.json ← Reference example (8 sections)
│   ├── project-brief-template.json ← Template for new project briefs
│   ├── design-system-page.json  ← Visual design system review page
│   └── starter-kits/            ← Archived completed projects (portfolio)
│       └── <project-name>/      ← Full backup with screenshot + design tokens
└── projects/                    ← Client projects (gitignored)
    └── <project-name>/
        ├── brief.json           ← Business info, branding, content
        ├── page-mapping.json    ← Maps page names to WordPress post IDs
        ├── design-system-page.json
        ├── topical-map.md       ← Semantic topical map & publishing blueprint
        ├── pages/*.json         ← Generated Elementor page templates
        ├── blog/
        │   ├── articles/*.json  ← One JSON per blog post (local copy)
        │   ├── images/*.webp    ← AI-generated featured images (WebP, 1200x628)
        │   ├── image-manifest.json ← Tracks image status, post IDs, push state
        │   └── categories/*.json← Blog category definitions
        └── seo/
            ├── categories/*.json← WooCommerce category SEO content
            └── products/*.json  ← WooCommerce product SEO content
```

## Workflow

### Web Design
1. **Init project** → `init-project.ps1` scaffolds folder with brief + design system
2. **Fill brief** → Define pages, content, branding in `brief.json`
3. **Push design system** → Client reviews colors, fonts, buttons, cards
4. **Build pages** → AI generates one page at a time from the brief
5. **Push & review** → `sync.ps1` pushes to WordPress, review in browser
6. **Refine** → Tell AI what to change, re-push
7. **Archive project** → Save as starter kit with screenshot + design tokens

### SEO Content
1. **Study SEO knowledge base** → Read `docs/holistic-seo-knowledge-base.md`
2. **Build topical map** → AI creates `topical-map.md` with clusters, articles, and publishing phases
3. **Create blog categories** → Push category definitions via API
4. **Write articles per phase** → AI generates article JSON files in `blog/articles/`
5. **Publish in clusters** → Push articles to WordPress (definitional first, commercial last)
6. **Generate featured images** → AI generates photorealistic images via FLUX.1, pushes to WordPress
7. **Interlink pass** → Add contextual in-body links across all articles
8. **Expand & maintain** → Fill topical gaps, update content, grow authority
9. **Sync learnings** → Push improvements back to this repo

## Commands

### Page Management

| Command | Description |
|---------|-------------|
| `.\sync.ps1 -Site X -Action status` | Test connection |
| `.\sync.ps1 -Site X -Action create -TemplateFile path -Title "Name"` | Create page |
| `.\sync.ps1 -Site X -Action update -TemplateFile path -PageId 42` | Update page |
| `.\sync.ps1 -Site X -Action list` | List all pages |
| `.\sync.ps1 -Site X -Action get -PageId 42` | Get page details |
| `.\sync.ps1 -Site X -Action get -PageId 42 -TemplateFile "export.json"` | Export page to JSON |
| `.\sync.ps1 -Site X -Action delete -PageId 42 -Force` | Delete page |

### Header / Footer Templates

| Command | Description |
|---------|-------------|
| `.\sync.ps1 -Site X -Action create-template -TemplateFile path -Title "Site Header"` | Create header/footer |
| `.\sync.ps1 -Site X -Action delete -PageId 42 -Force` | Delete template (step 1 of update) |
| `.\sync.ps1 -Site X -Action create-template -TemplateFile path -Title "Site Header"` | Re-create template (step 2 of update) |

> **Note:** Header/footer templates cannot be updated via PUT — they must be deleted and re-created. See CLAUDE.md for details.

### Blog Posts (v1.4.0)

| Command | Description |
|---------|-------------|
| `.\sync.ps1 -Site X -Action list-posts` | List all blog posts |
| `.\sync.ps1 -Site X -Action create-post -TemplateFile path` | Create a new blog post |
| `.\sync.ps1 -Site X -Action update-post -TemplateFile path -PageId 42` | Update an existing blog post |
| `.\sync.ps1 -Site X -Action get-post -PageId 42` | Get a blog post |
| `.\sync.ps1 -Site X -Action delete-post -PageId 42 -Force` | Delete a blog post |
| `.\sync.ps1 -Site X -Action list-blog-categories` | List blog categories |
| `.\sync.ps1 -Site X -Action create-blog-category -Title "Name" -TemplateFile path` | Create a blog category |
| `.\sync.ps1 -Site X -Action sideload-media -Title "alt text" -TemplateFile "https://..."` | Sideload featured image from URL |

### WooCommerce SEO (v1.3.0)

| Command | Description |
|---------|-------------|
| `.\sync.ps1 -Site X -Action list-wc-categories` | List categories with SEO status |
| `.\sync.ps1 -Site X -Action list-wc-products` | List products with SEO status |
| `.\sync.ps1 -Site X -Action update-wc-category -PageId 86 -TemplateFile path` | Update category SEO content |
| `.\sync.ps1 -Site X -Action update-wc-product -PageId 1234 -TemplateFile path` | Update product SEO content |

### Product Reviews & Social Proof (v1.8.0)

| Command | Description |
|---------|-------------|
| `.\sync.ps1 -Site X -Action reviews -PageId 1234 -TemplateFile path` | Add reviews to a product |
| `.\sync.ps1 -Site X -Action jetreview-sync` | Sync WC reviews into JetReview table |
| `.\sync.ps1 -Site X -Action jetreview-fix-authors -TemplateFile path` | Create reviewer accounts + download avatars |
| `.\sync.ps1 -Site X -Action jetreview-rows -PageId 1234` | Debug: view JetReview rows for a product |

### Featured Image Generation (v1.5.0)

Requires Python 3.11+ with `Pillow` and `requests`. API key in `config/fireworks.json` (gitignored).

| Command | Description |
|---------|-------------|
| `python generate-featured-images.py list --project X` | List articles and image status |
| `python generate-featured-images.py generate --project X --batch 1` | Generate next 10 images via FLUX.1 AI |
| `python generate-featured-images.py generate --project X --articles 1-1,1-2` | Generate specific articles only |
| `python generate-featured-images.py populate-ids --project X` | Auto-fill WordPress post IDs from API |
| `python generate-featured-images.py push --project X --batch 1` | Push next 10 images to WordPress |
| `python generate-featured-images.py status --project X` | Check overall generation/push status |

> Images are generated at 1344x704 via FLUX.1 [dev] FP8 (Fireworks AI), resized to 1200x628, converted to WebP (quality 85), and uploaded as featured images via the plugin's `/media/upload` endpoint.

### Diagnostics & Debugging (v1.2.0)

| Command | Description |
|---------|-------------|
| `.\sync.ps1 -Site X -Action diagnostics` | Full system health check |
| `.\sync.ps1 -Site X -Action logs` | View today's sync logs |
| `.\sync.ps1 -Site X -Action logs -Title "2026-02-15"` | View logs for specific date |
| `.\sync.ps1 -Site X -Action clear-logs` | Clear all log files |
| `.\sync.ps1 -Site X -Action test` | Run all dry-run tests |
| `.\sync.ps1 -Site X -Action test -Title "template_create"` | Test template creation |
| `.\sync.ps1 -Site X -Action test -Title "elementor_check"` | Test Elementor environment |
| `.\sync.ps1 -Site X -Action test -Title "memory"` | Test memory for large JSON |

---

## Syncing Improvements to the Universal Repo

After completing a project (or discovering improvements during one), sync learnings back to this repo so all future projects benefit:

```powershell
# 1. Copy updated system files from your working directory to the repo
Copy-Item "CLAUDE.md" -Destination "ai-elementor-template/CLAUDE.md" -Force
Copy-Item "sync.ps1" -Destination "ai-elementor-template/sync.ps1" -Force
Copy-Item "plugin/ai-elementor-sync/*.php" -Destination "ai-elementor-template/plugin/ai-elementor-sync/" -Force
Copy-Item "docs/design-system.json" -Destination "ai-elementor-template/docs/design-system.json" -Force

# 2. Commit and push
Push-Location "ai-elementor-template"
git add -A
git commit -m "Learnings from <project-name>: <brief description>"
git push origin master
Pop-Location
```

Or simply tell the AI: *"Push the latest updates to the universal setup in GitHub"* — it knows the process.

### What Gets Synced

| File | Purpose |
|------|---------|
| `CLAUDE.md` | AI knowledge base — new rules, widget properties, layout patterns, bug fixes |
| `sync.ps1` | CLI improvements, new actions, bug fixes |
| `plugin/ai-elementor-sync/*.php` | Plugin updates, new widgets, API fixes |
| `docs/design-system.json` | Updated spacing, typography, or component rules |
| `docs/holistic-seo-knowledge-base.md` | Universal SEO methodology — improves across all projects |
| `README.md` | Feature docs, command reference |

### What Stays Local (never synced)

- `projects/` — Client-specific data, briefs, generated pages
- `config/sites.json` with real API keys
- Temp export files

---

## The Vision: A Universal Website Builder

This repo is designed to become a **universal AI-powered website builder** that gets smarter with every project. The more websites you build, the more patterns, fixes, and optimizations the AI learns:

| Website Type | What the AI Learns |
|-------------|-------------------|
| **Recruitment sites** | Job listing layouts, consultation forms, two-audience pathways |
| **E-commerce + SEO** | Product grids, pricing cards, topical authority, WooCommerce SEO, semantic content networks |
| **Booking sites** | Calendar layouts, availability forms, confirmation flows |
| **Portfolio sites** | Gallery grids, project showcases, filterable layouts |
| **SaaS/Tool sites** | Feature comparisons, pricing tables, onboarding flows |
| **Static/Corporate sites** | About sections, team grids, service breakdowns |
| **Blog/Content sites** | Article layouts, interlink strategies, topical map patterns, publishing workflows |

Every project contributes to `CLAUDE.md` — the shared brain. After 10, 20, 50 websites, the AI will know every Elementor property name, every responsive breakpoint trick, every layout pattern that works.

---

## Portfolio — Built With This System

Every completed project is archived as a starter kit in `templates/starter-kits/` with full JSON source, design tokens, and screenshots.

<table>
<tr>
<td width="50%" valign="top">

### Trogen Facility Services

<a href="templates/starter-kits/trogen-facility-services/">
  <img src="templates/starter-kits/trogen-facility-services/screenshot.png" alt="Trogen Facility Services" width="100%">
</a>

**Melbourne Cleaning Company** — Single-page lead generation

| | |
|---|---|
| **Industry** | Commercial & Residential Cleaning |
| **Location** | Melbourne, Australia |
| **Type** | Single-page (9 sections) |
| **Design** | Figtree + Inter, Blue/Navy/Green |
| **Kit** | [`starter-kits/trogen-facility-services/`](templates/starter-kits/trogen-facility-services/) |

</td>
<td width="50%" valign="top">

### Infinite Global Recruitment

<a href="templates/starter-kits/infinite-global-recruitment/">
  <img src="templates/starter-kits/infinite-global-recruitment/screenshot.png" alt="Infinite Global Recruitment" width="100%">
</a>

**Surrey, UK Recruitment & Education** — Multi-page site (9 templates)

| | |
|---|---|
| **Industry** | Education & International Recruitment |
| **Location** | Hersham, Surrey, UK |
| **Type** | Multi-page (7 pages + header + footer) |
| **Design** | Playfair Display + DM Sans, Navy/Gold/Teal |
| **Kit** | [`starter-kits/infinite-global-recruitment/`](templates/starter-kits/infinite-global-recruitment/) |

</td>
<!-- <td width="33%" valign="top"> Next project goes here </td> -->
</tr>
</table>

---

## Requirements

- WordPress 6.x with Elementor Pro
- PowerShell 5.1+ (Windows) or PowerShell 7+ (Mac/Linux)
- VS Code with GitHub Copilot (Claude)
- PHP 8.0+ on the WordPress server
- Python 3.11+ with `Pillow` and `requests` (for featured image generation only)

## How AI Self-Improvement Works

`CLAUDE.md` is a living knowledge base. Every AI session that discovers a bug, a better pattern, or a new widget setting updates this file. The next AI thread reads the updated version and inherits all previous learnings.

The knowledge base currently includes:
- **15 strict rules** — Container-only layouts, responsive typography, 8pt grid, animation safety, interlinking, project archiving
- **15+ known issues & fixes** — With root causes and solutions
- **20+ Elementor property name mappings** — Correcting common guesses vs actual property names
- **8+ common section patterns** — Hero, services grid, CTA, testimonials, footer, FAQ, contact form split, and more
- **Widget examples** — Heading, text, button, image, icon, counter, icon-list, star-rating, divider, spacer, Iconify, form, social-icons, nav-menu
- **SEO workflow** — Holistic SEO knowledge base, topical map strategy, article JSON format, publishing phases, interlink methodology
- **WooCommerce SEO** — Category and product description templates, SiteSEO meta, batch push scripts
- **Featured image generation** — FLUX.1 AI prompts, WebP conversion, WordPress upload, SEO optimization

See the "Self-Improvement Rule" section in `CLAUDE.md` for details.

## Security

- API keys are stored in WordPress options table (hashed)
- Always use HTTPS for remote sites
- `config/sites.json` is committed with **placeholder values only** — never commit real credentials
- `projects/` folder is gitignored (contains client-specific data)
- Plugin logs are protected with `.htaccess` (Deny from all)
- Regenerate API key from Settings → AI Elementor Sync if compromised

## Changelog

### v1.8.2 (2026-03-18)
- **Single post template guide** — Added "Single Post Template (Theme Builder)" section to `CLAUDE.md` documenting the 2-section layout pattern (hero with dynamic post title + content area with featured image, white content card, post navigation)
- **Dynamic widget bindings** — Documented exact `__dynamic__` tag bindings for `theme-post-title`, `theme-post-featured-image`, `theme-post-content`, and `post-navigation` widgets
- **Post list page (cards skin)** — Posts widget with `_skin: cards` for beautiful card-based blog listing with hover effects (lift, image zoom, color transitions), category badges, and pagination
- **Media upload workflow** — Documented `POST /media/upload` base64 image upload pattern for bulk blog post image management

### v1.8.1 (2026-03-04)
- **Schema conflict fix** — Disable SiteSEO/SEOPress automatic schema output that generates `@type: Thing` instead of `@type: Product`, causing Google Rich Results "Invalid object type for `<parent_node>`" errors on all product pages
- **Comprehensive SEO plugin schema removal** — Filters (`seopress_schemas_auto_output`, `seopress_jsonld_html`, `seopress_toggle_schemas` + SiteSEO equivalents) plus action removal from `wp_head` at `wp_loaded`

### v1.8.0 (2026-03-03)
- **Product review management** — Create, list, delete WooCommerce product reviews via REST API with bulk support
- **JetReview integration** — Auto-detect Crocoblock JetReview table, dual-write reviews to both WC comments and JetReview, sync/backfill endpoint
- **Reviewer identity system** — Create WP subscriber accounts for reviewers, link to JetReview author column (fixes "Guest" display)
- **Avatar sideloading** — Download profile photos from DiceBear API URLs to WP media library, serve via `get_avatar_url` filter
- **Sold count management** — Set `total_sales` via `PUT /wc-products/{id}` for social proof display
- **JetReview sync** — `POST /schema/jetreview-sync` backfills missing JetReview rows from existing WC reviews
- **Fix-authors endpoint** — `POST /schema/jetreview-fix-authors` creates users, updates JetReview author IDs, sideloads avatars, updates review content (Sinhala Unicode support)
- **Schema Engine v1.7.0** — JSON-LD structured data for Organization, Product, BreadcrumbList, FAQPage, BlogPosting, AggregateRating
- **Avatar URL fix** — `sideload_avatar()` handles query-string URLs (DiceBear, ui-avatars) by parsing URL path and forcing `.png` extension
- **PowerShell 5.1 fixes** — `$pid` reserved variable workaround, UTF-8 encoding for API request bodies
- **CLAUDE.md** — Complete "Product Review & Social Proof Workflow" section with API reference, debugging guide, step-by-step setup process
- **Workflow guide updated** — Phase 5: Product Reviews & Social Proof added to `docs/workflow-guide.md`

### v1.5.0 (2026-03-01)
- **AI featured image generation** — Python CLI tool (`generate-featured-images.py`) using FLUX.1 [dev] FP8 via Fireworks AI
- **Photorealistic prompts** — 68 custom article-specific prompts with cluster themes, DSLR style, no-text rules
- **WebP conversion** — Generate at 1344x704, resize to 1200x628, convert to WebP q85 via Pillow
- **Plugin media upload** — New `POST /media/upload` endpoint for base64-encoded image upload with auto featured image
- **Plugin featured image** — New `PUT /posts/{id}/featured-image` endpoint for setting existing attachments
- **Image SEO** — Auto-generated filenames, alt text, titles, and captions from article metadata
- **Image manifest** — `image-manifest.json` tracks generation status, push status, attachment IDs, and WordPress URLs
- **Batch workflow** — `list`, `generate`, `populate-ids`, `push`, `status` commands for managing image pipeline
- **CLAUDE.md v1.5.0** — Full Featured Image Generation section with workflow, prompts, SEO strategy, and constraints

### v1.4.0 (2026-03-01)
- **Blog post CRUD** — Create, update, delete, list blog posts as JSON via REST API
- **Blog category management** — Create and list WordPress blog categories via API
- **Featured image sideloading** — Upload images from URL to WP media library
- **Holistic SEO knowledge base** — Universal Koray Gubur methodology at `docs/holistic-seo-knowledge-base.md`
- **Semantic topical maps** — Per-project strategy docs for content clusters, publishing phases, and interlinks
- **Local article copies** — All blog posts stored locally for updates, interlinking, and auditing
- **WooCommerce SEO** — Bulk-update product/category descriptions and SiteSEO meta (v1.3.0)
- **Updated project scaffolding** — `init-project.ps1` now creates `blog/`, `seo/`, and sub-folders
- **CLAUDE.md SEO workflow** — Comprehensive Blog Content & SEO Workflow section added

### v1.2.1 (2026-02-25)
- **Project archiving system** — Mandatory archiving of completed projects as starter kits with screenshots, design tokens, and README
- **Responsive Design Master Reference** — Complete property checklists for every element type (responsive-from-first-build)
- **New widget examples** — Form (Elementor Pro), Social Icons, Nav Menu with full documentation
- **New section patterns** — FAQ (stacked cards), Contact Form (split layout)
- **Archived: Trogen Facility Services** — Single-page cleaning company (Melbourne)
- **Archived: Infinite Global Recruitment** — Multi-page recruitment & education site (Surrey, UK; 9 templates)
- **Portfolio README layout** — Side-by-side project showcases with screenshots

### v1.2.0 (2026-02-15)
- **Iconify icon support** — Custom widget for 100,000+ icons (Tabler, Material, Phosphor, etc.)
- **Header/Footer template management** — Create, delete, and re-create Theme Builder templates via API
- **Diagnostics system** — Error logging, system health checks, dry-run tests
- **Animation safety rules** — Documented which elements can/cannot be animated
- **Interlinking rules** — All buttons must point to real pages
- **Counter widget dual typography** — Separate styling for number and title
- **Nav menu dropdown properties** — Full dropdown customization support
- **Responsive priority system** — Desktop-first with tablet/mobile variants on all elements
- **PHP 8.1 compatibility** — Fixed `assign_element_ids()` string offset crash
- **Template data fix** — `array_values()` prevents JSON object vs array encoding bug
- **Stale cache cleanup** — Deleting templates now clears Elementor conditions cache

### v1.1.0 (2026-02-15)
- Custom Iconify Elementor widget with alignment controls
- Iconify JS auto-loaded on all Elementor pages

### v1.0.0 (2026-02-15)
- Initial release — pages, templates, sync CLI, AI knowledge base
