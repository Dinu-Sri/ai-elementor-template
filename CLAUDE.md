# AI Elementor Template System — Context Guide

> **READ THIS FILE FIRST.** This document gives you everything you need to build WordPress/Elementor pages using this system.

## ⚡ Self-Improvement Rule

**This file is a living document. You MUST update it when you learn something new.**

When you discover any of the following during a session, **immediately edit this file** to add the knowledge so future AI threads inherit it:

| What Happened | What to Update |
|---------------|---------------|
| A widget setting didn't render correctly | Add a note in the Widget Examples section or Strict Rules |
| Found a new Elementor widget that works | Add a new Widget Example with the correct JSON |
| A CSS/style approach caused issues | Add to Strict Rules with explanation |
| Discovered a better layout pattern | Update or add to Common Section Patterns |
| A specific setting name was wrong | Fix it in all examples where it appears |
| Found a responsive breakpoint issue | Add to the responsive rules in Strict Rules |
| The API or sync.ps1 had a bug or quirk | Add to a Troubleshooting section |
| User found a design pattern that works well | Add to Common Section Patterns |
| New Font Awesome icons were needed | Add to the Available Icons list |
| User asks to push updates to GitHub | Follow the "Syncing Project Learnings to GitHub" process in GitHub Workflow section |
| Any system change is being pushed to GitHub | **ALWAYS update README.md** in the repo with new features, commands, and changelog |
| A project is completed and approved | Follow the **Project Archiving Checklist** — archive as starter kit, take screenshot, update portfolio |

**How to update:** Edit this CLAUDE.md file directly. Add new entries to the relevant section. If no section fits, create a new one (e.g., "## Known Issues", "## Advanced Patterns"). Include the date of the change.

**Also update** `docs/design-system.json` if the change is about spacing, typography, colors, or component patterns.

---

## What This System Does

This system does **two things** for WordPress websites:

### 1. Web Design (Elementor Pages)
We build Elementor pages as JSON files and push them to WordPress via a custom REST API plugin. The workflow:
1. AI generates a page template as JSON
2. User pushes it to WordPress with `sync.ps1`
3. User reviews the live result in browser
4. User requests changes → AI edits the JSON → re-push
5. Repeat until perfect

### 2. SEO Content (Blog Posts & WooCommerce)
We build topical authority through semantic SEO content — blog posts, WooCommerce product/category descriptions — all managed as JSON files and pushed via the same API. The workflow:
1. Study the SEO knowledge base (`docs/holistic-seo-knowledge-base.md`)
2. Build a semantic topical map for the project
3. AI writes blog posts as JSON files (title, content, SEO meta, categories)
4. User pushes posts to WordPress with `sync.ps1`
5. AI runs interlink passes to connect all content
6. Repeat and expand topical coverage over time

Both workflows share the same CLI (`sync.ps1`), the same plugin, and the same project folder structure.

---

## Project Structure

```
Elementor Template/
├── CLAUDE.md                    ← YOU ARE HERE — read this first
├── sync.ps1                     ← CLI tool (PowerShell 5.1) for pushing templates
├── init-project.ps1             ← Scaffolds new projects
├── config/
│   └── sites.json               ← WordPress site connections (URL + API key)
├── docs/
│   ├── design-system.json       ← Technical design rules (spacing, typography, colors)
│   ├── holistic-seo-knowledge-base.md ← Universal SEO strategy reference (Koray method)
│   ├── workflow-guide.md        ← Step-by-step workflow documentation
│   └── ai-prompt-templates.md   ← Ready-to-use prompt templates
├── plugin/
│   └── ai-elementor-sync/       ← WordPress plugin (already installed on server)
├── templates/
│   ├── sample-landing-page.json ← Reference example (8 sections, container-based)
│   ├── project-brief-template.json ← Template for new project briefs
│   ├── design-system-page.json  ← Master design system review page
│   └── starter-kits/            ← Archived completed projects (portfolio)
│       └── <project-name>/      ← Full site backup with screenshot
│           ├── README.md, screenshot.png, design-tokens.json
│           ├── brief.json, page-mapping.json
│           └── home.json, header.json, footer.json
└── projects/
    └── <project-name>/          ← One folder per client project
        ├── brief.json           ← Project requirements, content, branding
        ├── design-system-page.json ← Customized design system page
        ├── page-mapping.json    ← Maps page names to WordPress post IDs
        ├── pages/               ← Generated Elementor page templates
        │   ├── home.json
        │   ├── about.json
        │   └── ...
        ├── topical-map.md       ← Semantic topical map & publishing blueprint
        ├── blog/                ← Blog content management
        │   ├── articles/        ← One JSON file per blog post (local copy)
        │   │   ├── 1-1-what-is-watercolor-paint.json
        │   │   ├── 2-1-types-of-brushes.json
        │   │   └── ...
        │   └── categories/      ← Blog category definitions
        │       ├── cat-watercolor-paints.json
        │       └── ...
        └── seo/                 ← WooCommerce SEO content
            ├── categories/      ← Product category descriptions + meta
            │   └── cat-<id>-<slug>.json
            └── products/        ← Product descriptions + meta
                ├── product-mapping.json
                └── <slug>.json
```

---

## How to Push Pages (Commands the User Runs)

```powershell
# Create a NEW page on WordPress
.\sync.ps1 -Site "<project-name>" -Action create -TemplateFile ".\projects\<project>\pages\home.json" -Title "Home"

# Update an EXISTING page (user provides the PageId from previous create)
.\sync.ps1 -Site "<project-name>" -Action update -TemplateFile ".\projects\<project>\pages\home.json" -PageId 123

# Check page status
.\sync.ps1 -Site "<project-name>" -Action get -PageId 123

# List all pages
.\sync.ps1 -Site "<project-name>" -Action list

# --- Diagnostics & Debugging (v1.2.0+) ---

# Run full system diagnostics (PHP, WP, Elementor, Theme Builder, disk, logs)
.\sync.ps1 -Site "<project-name>" -Action diagnostics

# View today's sync logs
.\sync.ps1 -Site "<project-name>" -Action logs

# View logs for a specific date
.\sync.ps1 -Site "<project-name>" -Action logs -Title "2026-02-15"

# Clear all log files
.\sync.ps1 -Site "<project-name>" -Action clear-logs

# Run all dry-run tests (template creation, Elementor check, memory, JSON parsing)
.\sync.ps1 -Site "<project-name>" -Action test

# Run a specific test
.\sync.ps1 -Site "<project-name>" -Action test -Title "template_create"

# --- WooCommerce SEO (v1.3.0+) ---

# List all WooCommerce categories with SEO status
.\sync.ps1 -Site "<project-name>" -Action list-wc-categories

# List all WooCommerce products with SEO status
.\sync.ps1 -Site "<project-name>" -Action list-wc-products

# Update a single category's SEO content
.\sync.ps1 -Site "<project-name>" -Action update-wc-category -PageId <term_id> -TemplateFile ".\projects\<project>\seo\categories\cat-<id>-<slug>.json"

# Update a single product's SEO content
.\sync.ps1 -Site "<project-name>" -Action update-wc-product -PageId <post_id> -TemplateFile ".\projects\<project>\seo\products\<slug>.json"

# Batch push all SEO updates (requires run-seo-push.ps1 script)
powershell -ExecutionPolicy Bypass -File .\run-seo-push.ps1

# --- Blog Posts (v1.4.0+) ---

# List all blog posts
.\sync.ps1 -Site "<project-name>" -Action list-posts

# Create a new blog post
.\sync.ps1 -Site "<project-name>" -Action create-post -TemplateFile ".\projects\<project>\blog\articles\1-1-article-slug.json"

# Update an existing blog post
.\sync.ps1 -Site "<project-name>" -Action update-post -TemplateFile ".\projects\<project>\blog\articles\1-1-article-slug.json" -PageId <post_id>

# Get a blog post (view or export)
.\sync.ps1 -Site "<project-name>" -Action get-post -PageId <post_id>

# Delete a blog post
.\sync.ps1 -Site "<project-name>" -Action delete-post -PageId <post_id> -Force

# List blog categories
.\sync.ps1 -Site "<project-name>" -Action list-blog-categories

# Create a new blog category
.\sync.ps1 -Site "<project-name>" -Action create-blog-category -Title "Category Name" -TemplateFile ".\projects\<project>\blog\categories\cat-name.json"

# Sideload a featured image from URL
.\sync.ps1 -Site "<project-name>" -Action sideload-media -Title "image-alt-text" -TemplateFile "https://example.com/image.jpg"
```

You do NOT push pages yourself. Generate the JSON file → tell the user the sync command to run.

---

## WooCommerce SEO Workflow (v1.3.0)

This system can bulk-update WooCommerce product and category SEO content (descriptions, short descriptions, SEO titles, and meta descriptions) via the same REST API plugin. The SEO plugin supported is **SiteSEO** (meta keys: `_seopress_titles_title`, `_seopress_titles_desc`).

### Overview & Approach

The WooCommerce SEO workflow follows these steps:
1. **Audit** — List all categories/products to see which are missing SEO content
2. **Generate** — AI writes SEO-optimized JSON files (one per category, one per product)
3. **Review** — User reviews/edits the generated content
4. **Push** — Run sync commands to push content to WordPress
5. **Verify** — Check live site and search engine rendering

### Project File Structure for SEO

```
projects/<project-name>/
└── seo/
    ├── categories/
    │   ├── cat-<id>-<slug>.json       ← One file per WooCommerce category
    │   ├── cat-86-pigments.json
    │   ├── cat-87-color-palettes.json
    │   └── ...
    └── products/
        ├── product-mapping.json        ← Maps product slugs to post IDs
        ├── <product-slug>.json         ← One file per product
        ├── winsor-newton-cotman-8ml-tube.json
        └── ...
```

### Step 1 — Audit Current SEO Status

```powershell
# List all categories with SEO status (YES/NO for description, SEO title, SEO desc)
.\sync.ps1 -Site "<project>" -Action list-wc-categories

# List all products with SEO status
.\sync.ps1 -Site "<project>" -Action list-wc-products
```

These commands show which items are missing content, helping you prioritize.

### Step 2 — Generate Category SEO JSON

Each category JSON has 3 fields:

```json
{
    "description": "<p>HTML description displayed on the category archive page. 2-3 paragraphs covering what the category contains, why these products matter, and a call to action. Include the store name and location for local SEO.</p>",
    "seo_title": "Category Name in Location | Store Name",
    "seo_description": "Buy [products] in [location]. [Key selling points]. [Delivery info]. Max 155 characters."
}
```

**Category SEO writing rules:**
- `description`: 2-3 `<p>` paragraphs of natural, informative content (NOT keyword-stuffed). Mention specific product brands/types stocked. Include location for local SEO. End with a call to browse/order.
- `seo_title`: Max 60 characters. Format: `[Category] in [Location] | [Store Name]`
- `seo_description`: Max 155 characters. Summarize what's available, mention location, include delivery info.
- File naming: `cat-<term_id>-<slug>.json` (e.g., `cat-87-color-palettes.json`)

### Step 3 — Generate Product SEO JSON

Each product JSON has up to 4 fields:

```json
{
    "description": "<p>Full HTML product description. Multiple paragraphs covering product features, materials, use cases, and specifications.</p><ul><li>Brand: ...</li><li>Size: ...</li><li>Key specs...</li></ul>",
    "short_description": "<p>1-2 sentence summary shown on the product card and at the top of the product page. Key selling point + what it is.</p>",
    "seo_title": "Buy Product Name in Location | Store Name",
    "seo_description": "Product summary for search results. Key features, brand, size. Max 155 characters."
}
```

**Product SEO writing rules:**
- `description`: 2-3 `<p>` paragraphs of detailed, helpful content. Describe what the product is, who it's for, how to use it. End with a `<ul>` of key specs (brand, size, material, quantity, grade). Write like an expert recommending it, not like a salesperson.
- `short_description`: 1-2 sentences. Appears on product cards and above the Add to Cart. Keep it punchy and informative.
- `seo_title`: Max 60 characters. Format: `Buy [Product] in [Location] | [Store]` or `[Product Name] - [Key Feature] | [Store]`
- `seo_description`: Max 155 characters. Summarize the product for Google snippet display.
- File naming: `<product-slug>.json` (e.g., `winsor-newton-cotman-8ml-tube.json`)
- Some products may omit `short_description` if it already exists on the site — check the `has` array in `product-mapping.json`

### Step 4 — Create Product Mapping

Create `projects/<project>/seo/products/product-mapping.json` to track all products:

```json
{
    "_note": "Fill in post IDs after running: .\\sync.ps1 -Site <project> -Action list-wc-products",
    "_usage": ".\\sync.ps1 -Site <project> -Action update-wc-product -PageId <ID> -TemplateFile .\\projects\\<project>\\seo\\products\\<file>.json",
    "products": {
        "product-slug": {
            "post_id": 1234,
            "file": "projects/<project>/seo/products/product-slug.json",
            "has": ["description", "short_description", "seo_title", "seo_description"]
        }
    }
}
```

The `has` array documents which fields the JSON file contains (useful for tracking what was updated).

### Step 5 — Push Individual Items

```powershell
# Push a single category
.\sync.ps1 -Site "<project>" -Action update-wc-category -PageId <term_id> -TemplateFile ".\projects\<project>\seo\categories\cat-<id>-<slug>.json"

# Push a single product
.\sync.ps1 -Site "<project>" -Action update-wc-product -PageId <post_id> -TemplateFile ".\projects\<project>\seo\products\<slug>.json"
```

### Step 6 — Batch Push Script

For pushing all SEO updates at once, create `run-seo-push.ps1` in the project root:

```powershell
Set-Location $PSScriptRoot

Write-Host "`n=== PUSHING CATEGORY SEO ==="  -ForegroundColor Cyan

.\sync.ps1 -Site <project> -Action update-wc-category -PageId <id> -TemplateFile ".\projects\<project>\seo\categories\cat-<id>-<slug>.json"
# ... repeat for each category

Write-Host "`n=== PUSHING PRODUCT SEO ===" -ForegroundColor Cyan

.\sync.ps1 -Site <project> -Action update-wc-product -PageId <id> -TemplateFile ".\projects\<project>\seo\products\<slug>.json"
# ... repeat for each product

Write-Host "`n=== ALL DONE ===" -ForegroundColor Green
```

Run with: `powershell -ExecutionPolicy Bypass -File .\run-seo-push.ps1`

### SEO Content Guidelines

| Rule | Detail |
|------|--------|
| **No keyword stuffing** | Write naturally — Google penalizes over-optimization |
| **Local SEO** | Mention location (city/country) in descriptions and meta for geo-targeting |
| **Brand names** | Include specific brand names stocked — users search for brands |
| **HTML in descriptions** | Use `<p>`, `<ul>`, `<li>` only — no inline styles, no `<div>`, no classes |
| **No special Unicode** | Use plain hyphens `-`, straight quotes — no em-dashes or curly quotes |
| **SEO title length** | Max 60 characters (Google truncates beyond this) |
| **Meta description length** | Max 155 characters (Google truncates beyond this) |
| **Unique content** | Every category and product must have unique descriptions — no duplicates |
| **Spec lists** | End product descriptions with a `<ul>` bullet list of key specs |
| **Short description** | 1-2 sentences max — shown on product cards, must be scannable |

### API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/wc-categories` | GET | List all categories with SEO status |
| `/wc-categories/{term_id}` | PUT | Update category description + SEO meta |
| `/wc-products` | GET | List all products with SEO status |
| `/wc-products/{post_id}` | PUT | Update product descriptions + SEO meta |

The plugin stores SEO meta using SiteSEO keys:
- `_seopress_titles_title` — SEO title (shown in search results)
- `_seopress_titles_desc` — SEO meta description (shown in search results)

For categories, these are stored as **term meta**. For products, as **post meta**.

---

## Blog Content & SEO Workflow (v1.4.0)

This system builds topical authority through semantic SEO content — blog posts, interlinks, and content clusters — managed as local JSON files and pushed to WordPress via the REST API. The SEO knowledge and methodology are kept **separate from project data** so they improve across all projects.

### The Three Layers

| Layer | Location | Purpose | Shared? |
|-------|----------|---------|---------|
| **SEO Knowledge Base** | `docs/holistic-seo-knowledge-base.md` | Universal SEO methodology (Koray Gubur's Holistic SEO framework). Strategy, theory, implementation playbook. | YES — shared across ALL projects, lives in the repo |
| **Project Topical Map** | `projects/<name>/topical-map.md` | Project-specific semantic topical map: clusters, articles, publishing phases, interlink strategy | NO — unique per project |
| **Article JSON Files** | `projects/<name>/blog/articles/*.json` | One JSON file per blog post — the local copy used for updates, interlinking, and fixes | NO — unique per project |

### Why Separate?

- The **SEO Knowledge Base** is methodology — it teaches the AI HOW to do SEO. It improves over time across all projects and gets pushed to GitHub.
- The **Topical Map** is a project-specific strategy document — it defines WHAT content to create for THIS website.
- The **Article JSON files** are the actual content — kept locally so we can update, interlink, and fix posts without re-fetching from WordPress.

### SEO Knowledge Base (`docs/holistic-seo-knowledge-base.md`)

This is the universal reference for all SEO work. Based on Koray Tugberk Gubur's Holistic SEO methodology, it covers:

- **6 Pillars**: Topical Map, Semantic Content Network, Content Briefs, Content Configuration, Authorship Rules, Topical Authority
- **Topical Authority**: Topical Coverage + Historical Data = Rankings
- **Entity-Attribute-Value (EAV)**: How to structure content around entities, attributes, and relationships
- **Semantic Content Networks**: Interconnected content forming a knowledge graph
- **Publishing Strategy**: Publish in clusters (not drip), complete topics before moving on
- **Interlinking**: Contextual in-body links > generic "related posts" lists
- **12 Case Studies**: Real sites that achieved 100-5000%+ traffic growth via semantic SEO alone

**When to reference it:**
- Starting ANY new SEO/content project — read it first
- Building a topical map — follow the entity mapping methodology
- Writing articles — follow the EAV content structure
- Troubleshooting rankings — check for topical gaps and missing contextual bridges

**When to update it:**
- Discovered a new SEO pattern that works
- Found a technique from Koray or other sources worth adding
- A strategy failed and the lesson should be recorded

### Per-Project SEO Structure

Every project that includes blog content follows this structure:

```
projects/<project-name>/
├── topical-map.md              ← Semantic topical map & publishing blueprint
├── blog/
│   ├── articles/               ← One JSON file per blog post
│   │   ├── 1-1-article-slug.json    ← Cluster 1, Article 1
│   │   ├── 1-2-article-slug.json    ← Cluster 1, Article 2
│   │   ├── 2-1-article-slug.json    ← Cluster 2, Article 1
│   │   └── ...
│   └── categories/             ← Blog category definitions
│       ├── cat-category-name.json
│       └── ...
└── seo/                        ← WooCommerce SEO (if applicable)
    ├── categories/
    └── products/
```

### Topical Map (`topical-map.md`)

The topical map is the strategy document for the project's content. It defines:

1. **Source Context** — Why this website talks about this topic (e.g., "We sell watercolor supplies and educate artists in Sri Lanka")
2. **Content Clusters** — Grouped by entity type (e.g., Paints, Paper, Brushes, Techniques)
3. **Articles per Cluster** — Each article with ID, title, target keywords, and status
4. **Publishing Phases** — Which articles to publish first (definitional > buying guides > tutorials > advanced)
5. **Interlink Strategy** — How clusters connect to each other via contextual bridges
6. **Category Mapping** — WordPress category IDs for each cluster

**Article ID Convention:** `<cluster>-<number>` (e.g., `1-1`, `2-3`, `6-12`). This maps directly to the JSON filename: `1-1-article-slug.json`.

**Creating a Topical Map:**
1. Read `docs/holistic-seo-knowledge-base.md` first
2. Identify the central entity and all sub-entities
3. Map entity types → clusters, entity instances → articles
4. Cover all query patterns: "what is", "how to", "best", "vs", "types of", "review"
5. Plan contextual bridges between clusters
6. Define 3-4 publishing phases (definitional first, commercial last)

### Blog Article JSON Format

Each article is a single JSON file with this structure:

```json
{
    "title": "Article Title — Descriptive and SEO-Friendly",
    "status": "publish",
    "categories": [93, 127],
    "excerpt": "1-2 sentence summary for WordPress excerpt and social sharing.",
    "seo_title": "Max 60 chars — Primary Keyword | Brand",
    "seo_description": "Max 155 chars — Compelling summary for Google search results snippet.",
    "featured_image_alt": "Descriptive alt text for the featured image",
    "content": "<p>Full HTML content of the article...</p>"
}
```

**Content Rules:**
- HTML only: `<p>`, `<h2>`, `<h3>`, `<ul>`, `<li>`, `<ol>`, `<strong>`, `<em>`, `<a>`
- No inline styles, no `<div>`, no classes
- Use `<h2>` for main sections, `<h3>` for subsections
- Internal links use full URLs: `<a href='https://site.com/slug/'>anchor text</a>`
- No special Unicode characters (em-dashes, curly quotes) — use plain ASCII
- Target 1500-2500 words per article
- Include 3-5 contextual internal links to related articles
- End with a practical takeaway or next-step recommendation

**Article Writing Approach (from Koray's methodology):**
1. **Definitional opener**: Clear "X is a [type] that [key attribute]" sentence
2. **EAV coverage**: Cover root attributes, rare attributes, unique attributes
3. **Semantic vocabulary**: Use the terminology authoritative sources consistently use
4. **Contextual bridges**: Link to related articles naturally within the text
5. **No keyword stuffing**: Write for readers, structure for search engines

### Blog Category JSON Format

```json
{
    "name": "Category Name",
    "slug": "category-slug",
    "description": "Brief category description for WordPress."
}
```

### Workflow: Building a Blog from Scratch

**Phase 1 — Foundation:**
1. Read `docs/holistic-seo-knowledge-base.md`
2. Study the project brief and business context
3. Build `topical-map.md` with all clusters, articles, and phases
4. Present the topical map to the user for approval
5. Create blog categories: `.\sync.ps1 -Site X -Action create-blog-category`

**Phase 2 — Content Creation (per publishing phase):**
1. Write articles as JSON files in `blog/articles/`
2. Include contextual internal links to already-published articles
3. Publish in batches: `.\sync.ps1 -Site X -Action create-post`
4. Record post IDs in the topical map
5. Repeat for each phase

**Phase 3 — Interlinking:**
1. After all articles are published, run a comprehensive interlink pass
2. Add contextual in-body links from older articles to newer ones
3. Optionally add "Keep Reading" sections at the bottom of each article
4. Update articles via: `.\sync.ps1 -Site X -Action update-post -PageId <id>`

**Phase 4 — Maintenance (Ongoing):**
1. Monitor rankings and identify weak articles
2. Update content with new information, better links
3. Fill topical gaps identified from search console data
4. All updates go through the local JSON → push to WordPress flow

### Why Keep Local Copies of Every Article

Every blog post JSON file is kept locally in `blog/articles/` because:

- **Interlinking**: When adding links to Article A from Article B, we need to read and edit Article A's content locally
- **Updates**: When facts change or new products launch, edit the local JSON and re-push
- **Auditing**: Quickly grep across all articles for broken links, outdated info, or missing interlinks
- **Backup**: If WordPress has issues, the full content exists locally
- **New projects**: Past articles serve as writing style references for future projects
- **No re-fetching**: Avoids repeated `get-post` API calls to read existing content

### Interlink Strategy (Koray Method)

From the SEO knowledge base, the ideal interlinking approach is:

1. **Contextual in-body links** (BEST): Natural links within paragraph text that flow with the content. Example: "When choosing paper, the <a href='...'>weight and texture</a> matter more than brand."
2. **Contextual bridge articles**: Dedicated articles that connect two otherwise separate clusters.
3. **"Keep Reading" sections** (ACCEPTABLE): Curated link lists at the bottom of articles. Less SEO value than in-body links but still useful for user navigation.
4. **Avoid**: Generic "related posts" plugins, sidebar link widgets, footer link dumps.

**Rule**: Every article should have at least 3 contextual in-body links to other articles. Add more as the content library grows.

---

## Header & Footer Templates (Theme Builder)

Headers and footers are **Elementor Theme Builder templates** — they are NOT regular pages. They use a completely different API endpoint and have special requirements. Getting this wrong causes critical site errors.

### Pages vs Templates — Key Differences

| | Regular Pages | Theme Builder Templates (Header/Footer) |
|---|---|---|
| **Post type** | `page` | `elementor_library` |
| **Create endpoint** | `POST /pages` | `POST /templates` |
| **Update method** | `PUT /pages/{id}` | **Delete + re-create** (see below) |
| **sync.ps1 action** | `create` / `update` | `create-template` / `delete` + `create-template` |
| **Template type meta** | `wp-page` | `header`, `footer`, or `section` |
| **Display conditions** | N/A (accessed by URL) | `_elementor_conditions: ['include/general']` |
| **Visibility** | Shows at its URL | Shows on ALL pages site-wide (via conditions) |

### How to Create a Header or Footer

**Step 1:** Generate the JSON file. The structure is the same as a regular page (containers + widgets), but typically a single top-level container.

**Step 2:** Push using `create-template`:
```powershell
# Create header
.\sync.ps1 -Site "<project>" -Action create-template -TemplateFile ".\projects\<project>\pages\header.json" -Title "Site Header"

# Create footer
.\sync.ps1 -Site "<project>" -Action create-template -TemplateFile ".\projects\<project>\pages\footer.json" -Title "Site Footer"
```

**Step 3:** Note the returned template ID (e.g., `post_id: 135`). Save it in `page-mapping.json`.

### How to UPDATE a Header or Footer

**CRITICAL: You CANNOT use `update` (PUT) on Theme Builder templates.** The `update_page` endpoint sets `_elementor_template_type` to `wp-page`, which breaks Theme Builder display conditions and causes the template to stop rendering site-wide.

**Correct process — Delete and Re-create:**

```powershell
# Step 1: Delete the old template
.\sync.ps1 -Site "<project>" -Action delete -PageId <old-template-id> -Force

# Step 2: Clear Elementor cache (prevents stale conditions crash)
# The plugin does this automatically on delete, but run manually if issues persist:
# POST /clear-cache via API

# Step 3: Re-create with updated JSON
.\sync.ps1 -Site "<project>" -Action create-template -TemplateFile ".\projects\<project>\pages\footer.json" -Title "Site Footer"

# Step 4: Update page-mapping.json with the NEW template ID
```

### Common Pitfalls & Their Fixes

| Pitfall | What Happens | Fix |
|---------|-------------|-----|
| Using `update` on a template | `_elementor_template_type` set to `wp-page`, template disappears from site | Delete + re-create via `create-template` |
| Not clearing cache after delete | Stale `_elementor_conditions` cache causes crash on page load | Plugin auto-clears on delete; manual: POST `/clear-cache` |
| `_elementor_data` stored as JSON object | "Critical error on this website" — Elementor can't parse `{"0":{...}}` | Plugin fix: `array_values()` before `wp_json_encode()` |
| Template created but not showing | Missing display conditions | Template JSON must trigger `_elementor_conditions: ['include/general']` (plugin handles this) |
| Multiple templates of same type | Conflicts — only one header/footer should be active | Delete old before creating new |

### Template JSON Structure

Header and footer JSON files use the same top-level format as pages:
```json
{
    "title": "Site Footer",
    "template": "elementor_header_footer",
    "elementor_data": [
        {
            "elType": "container",
            "isInner": false,
            "settings": { /* ... */ },
            "elements": [ /* ... */ ]
        }
    ]
}
```

The plugin's `create-template` endpoint automatically:
- Sets post type to `elementor_library`
- Sets `_elementor_template_type` to `header` or `footer` (based on title keywords)
- Sets `elementor_library_type` taxonomy term
- Adds `_elementor_conditions: ['include/general']` for site-wide display
- Stores `_elementor_data` as a proper JSON array (with `array_values()` fix)

---

## Elementor JSON Structure

Every page template JSON has this top-level format:

```json
{
    "title": "Page Title",
    "template": "elementor_header_footer",
    "page_settings": {
        "background_background": "classic",
        "background_color": "#FFFFFF"
    },
    "elementor_data": [
        { /* Section 1 - top-level container */ },
        { /* Section 2 - top-level container */ },
        { /* Section 3 - top-level container */ }
    ]
}
```

### Container Hierarchy (4 levels max)

**CRITICAL: Use ONLY `container` and `widget` elTypes. NEVER use `section` or `column` — those are legacy and will NOT render properly.**

```
Level 1: PAGE SECTION (full-width container)
└── Level 2: BOXED CONTENT (inner container, max-width 1200px)
    └── Level 3: ROW LAYOUT (inner container, flex_direction: row)
        └── Level 4: CARD or WIDGET (inner container or widget)
```

#### Level 1 — Full-Width Section Container
```json
{
    "elType": "container",
    "isInner": false,
    "settings": {
        "content_width": "full",
        "flex_direction": "column",
        "background_background": "classic",
        "background_color": "#FFFFFF",
        "padding": {"unit": "px", "top": "80", "right": "24", "bottom": "80", "left": "24", "isLinked": false},
        "padding_tablet": {"unit": "px", "top": "64", "right": "24", "bottom": "64", "left": "24", "isLinked": false},
        "padding_mobile": {"unit": "px", "top": "48", "right": "16", "bottom": "48", "left": "16", "isLinked": false},
        "html_tag": "section"
    },
    "elements": [ /* Level 2 containers */ ]
}
```

#### Level 2 — Boxed Inner Container
```json
{
    "elType": "container",
    "isInner": true,
    "settings": {
        "content_width": "boxed",
        "boxed_width": {"unit": "px", "size": 1200, "sizes": []},
        "flex_direction": "column"
    },
    "elements": [ /* headings, rows, widgets */ ]
}
```

#### Level 3 — Row Container (for multi-column layouts)
```json
{
    "elType": "container",
    "isInner": true,
    "settings": {
        "flex_direction": "row",
        "flex_wrap": "wrap",
        "flex_gap": {"column": "24", "row": "24", "unit": "px", "isLinked": true},
        "flex_gap_tablet": {"column": "20", "row": "20", "unit": "px", "isLinked": true},
        "flex_gap_mobile": {"column": "16", "row": "16", "unit": "px", "isLinked": true},
        "align_items": "stretch"
    },
    "elements": [ /* column containers or widgets */ ]
}
```

#### Level 4 — Column / Card Container
```json
{
    "elType": "container",
    "isInner": true,
    "settings": {
        "content_width": "full",
        "width": {"unit": "%", "size": 30, "sizes": []},
        "width_tablet": {"unit": "%", "size": 47, "sizes": []},
        "width_mobile": {"unit": "%", "size": 100, "sizes": []},
        "flex_direction": "column",
        "padding": {"unit": "px", "top": "32", "right": "32", "bottom": "32", "left": "32", "isLinked": true},
        "padding_tablet": {"unit": "px", "top": "28", "right": "24", "bottom": "28", "left": "24", "isLinked": false},
        "padding_mobile": {"unit": "px", "top": "24", "right": "20", "bottom": "24", "left": "20", "isLinked": false}
    },
    "elements": [ /* widgets */ ]
}
```

---


## Iconify Icon Support (2026-02-15)

### How to Use Iconify Icons in Templates

- You can now use any Iconify icon (e.g., Tabler, Material, Phosphor, etc.) in Elementor templates via the custom `iconify-icon` widget.
- The plugin automatically loads the Iconify JS library on all Elementor pages.
- **ALWAYS use Iconify icons (preferably Tabler Icons) instead of Font Awesome for standalone icon widgets.** This gives each site a unique, premium, one-of-one design feel.
- Select icon sets based on the website's business nature — e.g., Tabler for professional/corporate, Phosphor for playful/creative, Material Symbols for enterprise.
- Font Awesome is still used for `icon-list` and `social-icons` widgets (which only support FA natively).
- To add an Iconify icon, use this widget structure in your JSON:

```json
{
    "elType": "widget",
    "widgetType": "iconify-icon",
    "settings": {
        "iconify_icon": "tabler:rocket",
        "icon_size": 48,
        "icon_color": "#1A1A2E",
        "align": "center"
    },
    "elements": []
}
```

- Replace `tabler:rocket` with any valid Iconify icon name (see https://icon-sets.iconify.design/ for options).
- Supported alignment values: `"left"`, `"center"`, `"right"` (default: `"center"`).
- This widget is available after updating the ai-elementor-sync plugin.

### Icon Sizing Best Practices

| Context | Icon Size | Notes |
|---------|-----------|-------|
| Feature card icon | 40-48px | Hero element of each card |
| Process step icon | 40-44px | Larger than step number |
| Step number text | 20-24px | Smaller than the icon |
| Inline/small icon | 24-32px | Accent/decorative |

---
## Widget Examples

> **NOTE: Colors and fonts in these examples are PLACEHOLDERS.** Every new project gets its own colors and fonts from `projects/<name>/brief.json`. Never copy these example values literally — always replace `#1A1A2E`, `#6C63FF`, `Poppins`, `Inter`, etc. with the actual project's branding from its brief. The JSON **structure** and **property names** are what matters here — those are universal across all projects.

### Heading
```json
{
    "elType": "widget",
    "widgetType": "heading",
    "settings": {
        "title": "Your Heading Text",
        "header_size": "h2",
        "align": "center",
        "align_mobile": "center",
        "title_color": "#1A1A2E",
        "typography_typography": "custom",
        "typography_font_family": "Poppins",
        "typography_font_size": {"unit": "px", "size": 36, "sizes": []},
        "typography_font_size_tablet": {"unit": "px", "size": 30, "sizes": []},
        "typography_font_size_mobile": {"unit": "px", "size": 24, "sizes": []},
        "typography_font_weight": "700",
        "typography_line_height": {"unit": "em", "size": 1.2, "sizes": []},
        "_animation": "fadeInUp"
    },
    "elements": []
}
```

### Text Editor (paragraphs)
```json
{
    "elType": "widget",
    "widgetType": "text-editor",
    "settings": {
        "editor": "<p>Your paragraph text here. Keep it simple — no inline styles.</p>",
        "align": "center",
        "text_color": "#6B7280",
        "typography_typography": "custom",
        "typography_font_family": "Inter",
        "typography_font_size": {"unit": "px", "size": 18, "sizes": []},
        "typography_font_size_mobile": {"unit": "px", "size": 16, "sizes": []},
        "typography_line_height": {"unit": "em", "size": 1.8, "sizes": []}
    },
    "elements": []
}
```

### Button
```json
{
    "elType": "widget",
    "widgetType": "button",
    "settings": {
        "text": "Get Started",
        "link": {"url": "#contact", "is_external": false, "nofollow": false},
        "size": "lg",
        "background_color": "#6C63FF",
        "button_text_color": "#FFFFFF",
        "border_radius": {"unit": "px", "top": "8", "right": "8", "bottom": "8", "left": "8", "isLinked": true},
        "typography_typography": "custom",
        "typography_font_weight": "600",
        "button_background_hover_color": "#5A52D5",
        "text_padding": {"unit": "px", "top": "14", "right": "32", "bottom": "14", "left": "32", "isLinked": false},
        "text_padding_mobile": {"unit": "px", "top": "12", "right": "24", "bottom": "12", "left": "24", "isLinked": false}
    },
    "elements": []
}
```

### Image
```json
{
    "elType": "widget",
    "widgetType": "image",
    "settings": {
        "image": {"url": "https://picsum.photos/600/400", "id": ""},
        "image_size": "full",
        "width": {"unit": "%", "size": 100, "sizes": []},
        "border_radius": {"unit": "px", "top": "12", "right": "12", "bottom": "12", "left": "12", "isLinked": true},
        "box_shadow_box_shadow": {"horizontal": 0, "vertical": 8, "blur": 30, "spread": 0, "color": "rgba(0,0,0,0.12)"}
    },
    "elements": []
}
```

### Icon
```json
{
    "elType": "widget",
    "widgetType": "icon",
    "settings": {
        "selected_icon": {"value": "fas fa-rocket", "library": "fa-solid"},
        "primary_color": "#6C63FF",
        "icon_size": {"unit": "px", "size": 48, "sizes": []},
        "align": "center"
    },
    "elements": []
}
```

### Counter
```json
{
    "elType": "widget",
    "widgetType": "counter",
    "settings": {
        "starting_number": 0,
        "ending_number": 150,
        "suffix": "+",
        "title": "Projects Completed",
        "number_color": "#6C63FF",
        "title_color": "#6B7280",
        "typography_typography": "custom",
        "typography_font_family": "Poppins",
        "typography_font_size": {"unit": "px", "size": 48, "sizes": []},
        "typography_font_size_tablet": {"unit": "px", "size": 40, "sizes": []},
        "typography_font_size_mobile": {"unit": "px", "size": 32, "sizes": []},
        "typography_font_weight": "700",
        "title_horizontal_alignment_mobile": "center",
        "number_position_mobile": "center",
        "typography_title_typography": "custom",
        "typography_title_font_family": "Poppins",
        "typography_title_font_size": {"unit": "px", "size": 20},
        "typography_title_font_size_tablet": {"unit": "px", "size": 18},
        "typography_title_font_size_mobile": {"unit": "px", "size": 10},
        "typography_title_font_weight": "600"
    },
    "elements": []
}
```

**IMPORTANT:** Counter widget has TWO separate typography groups: `typography_*` controls the number, `typography_title_*` controls the title text below the number. Always set both for proper styling.

### Icon List
```json
{
    "elType": "widget",
    "widgetType": "icon-list",
    "settings": {
        "icon_list": [
            {
                "text": "Feature point one",
                "selected_icon": {"value": "fas fa-check-circle", "library": "fa-solid"},
                "_id": "item1"
            },
            {
                "text": "Feature point two",
                "selected_icon": {"value": "fas fa-check-circle", "library": "fa-solid"},
                "_id": "item2"
            }
        ],
        "icon_color": "#10B981",
        "text_color": "#1A1A2E",
        "icon_size": {"unit": "px", "size": 18, "sizes": []},
        "space_between": {"unit": "px", "size": 16, "sizes": []},
        "typography_typography": "custom",
        "typography_font_family": "Inter",
        "typography_font_size": {"unit": "px", "size": 16, "sizes": []}
    },
    "elements": []
}
```

### Star Rating
```json
{
    "elType": "widget",
    "widgetType": "star-rating",
    "settings": {
        "rating_scale": 5,
        "rating_value": 5,
        "star_size": {"unit": "px", "size": 16, "sizes": []},
        "star_color": "#F59E0B",
        "star_unmarked_color": "#E5E7EB",
        "star_style": "star_unicode"
    },
    "elements": []
}
```

### Divider
```json
{
    "elType": "widget",
    "widgetType": "divider",
    "settings": {
        "style": "solid",
        "weight": {"unit": "px", "size": 3, "sizes": []},
        "width": {"unit": "%", "size": 60, "sizes": []},
        "color": "#6C63FF",
        "align": "center",
        "gap": {"unit": "px", "size": 24, "sizes": []}
    },
    "elements": []
}
```

### Spacer
```json
{
    "elType": "widget",
    "widgetType": "spacer",
    "settings": {
        "space": {"unit": "px", "size": 40, "sizes": []}
    },
    "elements": []
}
```

### Form (Elementor Pro)
```json
{
    "elType": "widget",
    "widgetType": "form",
    "settings": {
        "form_name": "Contact Form",
        "form_fields": [
            {"field_type": "text", "field_label": "Full Name", "placeholder": "Enter your full name", "required": "true", "width": "100", "_id": "ct_name"},
            {"field_type": "email", "field_label": "Email Address", "placeholder": "your@email.com", "required": "true", "width": "50", "_id": "ct_email"},
            {"field_type": "tel", "field_label": "Phone Number", "placeholder": "+44 7XXX XXX XXX", "required": "true", "width": "50", "_id": "ct_phone"},
            {"field_type": "select", "field_label": "Subject", "field_options": "Option 1\nOption 2\nOption 3\nOther", "required": "true", "width": "100", "_id": "ct_subject"},
            {"field_type": "textarea", "field_label": "Your Message", "placeholder": "Tell us how we can help...", "required": "true", "rows": 5, "width": "100", "_id": "ct_message"},
            {"field_type": "honeypot", "field_label": "Honeypot", "_id": "ct_honeypot"}
        ],
        "button_text": "Send Message",
        "button_size": "lg",
        "button_width": "100",
        "button_background_color": "#0B1D3A",
        "button_text_color": "#FFFFFF",
        "button_border_radius": {"unit": "px", "top": "8", "right": "8", "bottom": "8", "left": "8", "isLinked": true},
        "button_typography_typography": "custom",
        "button_typography_font_family": "DM Sans",
        "button_typography_font_weight": "600",
        "button_background_hover_color": "#1A3A5C",
        "email_to": "info@example.com",
        "email_subject": "New Inquiry - {{ct_name}}",
        "success_message": "Thank you! We will get back to you within 1-2 business days.",
        "label_color": "#0B1D3A",
        "field_text_color": "#0B1D3A",
        "field_background_color": "#F7F9FC",
        "field_border_color": "#E2E8F0",
        "field_border_radius": 8,
        "field_typography_typography": "custom",
        "field_typography_font_family": "DM Sans",
        "label_typography_typography": "custom",
        "label_typography_font_family": "DM Sans",
        "label_typography_font_weight": "500",
        "mark_required_color": "#EF4444"
    },
    "elements": []
}
```

**IMPORTANT Form widget notes:**
- `field_type` options: `text`, `email`, `tel`, `textarea`, `select`, `number`, `date`, `url`, `password`, `honeypot`, `hidden`, `acceptance`, `upload`
- `width` controls field width: `"100"` = full width, `"50"` = half width (side-by-side), `"33"` = third width
- `field_options` for `select` type: separate options with `\n` (newline)
- `_id` must be unique per field and is used in `email_subject` as `{{field_id}}`
- Always include a `honeypot` field for spam protection
- `button_*` properties control the submit button (separate from regular button widget settings)
- **NEVER animate form widgets** — `_animation` causes permanent invisibility (see Known Issues)

### Social Icons
```json
{
    "elType": "widget",
    "widgetType": "social-icons",
    "settings": {
        "social_icon_list": [
            {
                "social_icon": {"value": "fab fa-facebook-f", "library": "fa-brands"},
                "link": {"url": "https://facebook.com/yourpage", "is_external": true, "nofollow": false},
                "_id": "fb1"
            },
            {
                "social_icon": {"value": "fab fa-instagram", "library": "fa-brands"},
                "link": {"url": "https://instagram.com/yourpage", "is_external": true, "nofollow": false},
                "_id": "ig1"
            },
            {
                "social_icon": {"value": "fab fa-linkedin-in", "library": "fa-brands"},
                "link": {"url": "https://linkedin.com/company/yourcompany", "is_external": true, "nofollow": false},
                "_id": "li1"
            }
        ],
        "shape": "circle",
        "icon_color": "custom",
        "icon_primary_color": "#1A3050",
        "icon_secondary_color": "#B0BEC5",
        "icon_primary_color_hover": "#C49A3C",
        "icon_secondary_color_hover": "#FFFFFF",
        "icon_size": {"unit": "px", "size": 14, "sizes": []},
        "align": "left",
        "align_tablet": "center",
        "align_mobile": "center"
    },
    "elements": []
}
```

**IMPORTANT Social Icons notes:**
- With `shape: "circle"`: `icon_primary_color` = circle background, `icon_secondary_color` = icon glyph color
- Without shape: `icon_primary_color` = icon color directly
- Always add hover states (`_hover` variants) for interactivity
- Available icons: `fab fa-facebook-f`, `fab fa-twitter`, `fab fa-instagram`, `fab fa-linkedin-in`, `fab fa-youtube`, `fab fa-whatsapp`, `fab fa-tiktok`, `fab fa-pinterest-p`
- Use `is_external: true` for social links (opens in new tab)
- Social icon URLs can use `#` as placeholder only if real URLs are not yet provided

### Nav Menu (Elementor Pro)
```json
{
    "elType": "widget",
    "widgetType": "nav-menu",
    "settings": {
        "menu": "",
        "align_items": "center",
        "submenu_indicator": "none",
        "color_menu_item": "#0B1D3A",
        "color_menu_item_hover": "#C49A3C",
        "color_menu_item_active": "#C49A3C",
        "pointer_color_menu_item_hover": "#C49A3C",
        "pointer": "none",
        "typography_menu_item_typography": "custom",
        "typography_menu_item_font_family": "DM Sans",
        "typography_menu_item_font_size": {"unit": "px", "size": 14, "sizes": []},
        "typography_menu_item_font_weight": "500",
        "typography_menu_item_letter_spacing": {"unit": "px", "size": 0.2, "sizes": []},
        "padding_horizontal_menu_item": {"unit": "px", "size": 12, "sizes": []},
        "padding_horizontal_menu_item_tablet": {"unit": "px", "size": 10, "sizes": []},
        "toggle_color": "#0B1D3A",
        "toggle_size": {"unit": "px", "size": 22, "sizes": []},
        "toggle_size_tablet": {"unit": "px", "size": 22, "sizes": []},
        "toggle_size_mobile": {"unit": "px", "size": 20, "sizes": []},
        "breakpoint": "tablet",
        "full_width": "stretch",
        "text_align": "center",
        "menu_name": "Menu",
        "menu_typography_typography": "custom",
        "menu_typography_font_family": "DM Sans",
        "menu_typography_font_size": {"unit": "px", "size": 15},
        "menu_typography_font_size_tablet": {"unit": "px", "size": 20},
        "menu_typography_font_size_mobile": {"unit": "px", "size": 16},
        "menu_typography_font_weight": "700",
        "menu_typography_text_transform": "uppercase",
        "menu_space_between": {"unit": "px", "size": 10, "sizes": []},
        "background_color_dropdown_item_hover": "#0B1D3A",
        "padding_horizontal_dropdown_item_mobile": {"unit": "px", "size": 0, "sizes": []},
        "padding_vertical_dropdown_item_mobile": {"unit": "px", "size": 6, "sizes": []},
        "dropdown_top_distance_tablet": {"unit": "px", "size": 22, "sizes": []},
        "dropdown_top_distance_mobile": {"unit": "px", "size": 16, "sizes": []},
        "__globals__": {"toggle_background_color": "globals/colors?id=background"}
    },
    "elements": []
}
```

**IMPORTANT Nav Menu notes:**
- `menu: ""` pulls from the default WordPress menu (Appearance > Menus). Menu items must be managed in WP admin, NOT in the JSON.
- TWO separate typography groups: `typography_menu_item_*` controls desktop horizontal items, `menu_typography_*` controls the mobile/tablet dropdown items
- `breakpoint: "tablet"` means the hamburger menu appears on tablet and below
- `pointer: "none"` removes the underline hover effect on desktop
- `full_width: "stretch"` makes dropdown menu items fill the full width
- `toggle_*` properties control the hamburger icon (color, size per breakpoint)
- `__globals__` can reference Elementor global colors for toggle background
- **Limitation:** Adding new pages to the nav requires manual WP menu update — the API cannot modify WordPress menus

---

## Available Font Awesome Icons

Use these for icon widgets and icon-lists:
- **Solid** (`fa-solid`): `fas fa-check`, `fas fa-check-circle`, `fas fa-star`, `fas fa-arrow-right`, `fas fa-phone`, `fas fa-envelope`, `fas fa-map-marker-alt`, `fas fa-rocket`, `fas fa-cog`, `fas fa-shield-alt`, `fas fa-chart-line`, `fas fa-users`, `fas fa-heart`, `fas fa-lightbulb`, `fas fa-code`, `fas fa-paint-brush`, `fas fa-mobile-alt`, `fas fa-search`, `fas fa-globe`, `fas fa-award`, `fas fa-handshake`, `fas fa-clock`
- **Brands** (`fa-brands`): `fab fa-facebook-f`, `fab fa-twitter`, `fab fa-instagram`, `fab fa-linkedin-in`, `fab fa-youtube`, `fab fa-whatsapp`, `fab fa-wordpress`

---

## STRICT RULES — Never Break These

### 1. Container Only
- `elType` must be `"container"` or `"widget"` — **NEVER** `"section"` or `"column"`
- These are Elementor legacy elements and will cause rendering issues

### 2. No Inline Styles in HTML
- **NEVER** put `style="..."` in `editor` content (text-editor widget)
- Use Elementor's native settings: `text_color`, `typography_font_size`, `typography_font_family`, etc.
- If styling is unavoidable in HTML, use single quotes: `style='color: red'` (never double quotes — they break JSON escaping)

### 3. Every Widget Must Have `"elements": []`
- Even though widgets don't have children, Elementor requires this empty array

### 4. 8pt Grid Spacing
- ALL padding, margin, gap values must be multiples of 8: `8, 16, 24, 32, 48, 64, 80, 96, 120`

### 5. Responsive Typography
- H1, H2, H3, and display headings MUST have `_tablet` and `_mobile` font size variants
- H4 headings MUST have `_mobile` font size variant (tablet optional)
- Body text (16px+) MUST have `_mobile` font size variant
- Example: `typography_font_size` = 36px, `typography_font_size_tablet` = 30px, `typography_font_size_mobile` = 24px
- See Typography Scale table for exact sizes per level

### 6. Responsive Grid Items
- Every column container must set `width`, `width_tablet`, and `width_mobile`
- 3-column grid: 30% desktop → 47% tablet → 100% mobile
- 2-column split: 55%/40% desktop → 100%/100% tablet → 100%/100% mobile
- 2-column equal: 47%/47% desktop → 47%/47% tablet → 100%/100% mobile
- Footer columns: brand col 100% tablet, utility cols 47% tablet, all 100% mobile

### 7. Boxed Content Width
- Inner content containers should be `content_width: "boxed"` with `boxed_width: 1200`
- This prevents content from stretching edge-to-edge on wide screens

### 8. Color Consistency
- Colors come from the project's `brief.json` under `branding.colors`
- Never invent new colors — use only the defined palette

### 9. Font Consistency
- Heading font for all H1-H6 headings, overlines, and labels
- Body font for all paragraphs, descriptions, and list text

### 10. Section Background Alternation
- Alternate section backgrounds for visual rhythm (white → light gray → white → dark → etc.)

### 11. Section Approval Before Building
- **ALWAYS** present the proposed section plan to the user and get explicit approval BEFORE generating any page JSON
- List each section with a brief description of what it will contain
- Wait for the user to confirm, modify, add, or remove sections
- Only proceed with JSON generation after approval is received
- This applies to every new page — no exceptions

### 12. Button & Link Interlinking
- **ALL button URLs must point to real, existing pages within the site** — never use placeholder `#` for internal navigation
- Before delivering any page, verify every `"url"` in button/link settings against the project's `page-mapping.json`
- Valid internal URL formats: `/`, `/about/`, `/education/`, `/recruitment/`, `/book-consultation/`, `/contact/`
- Anchor links (e.g., `#student-form`) are only valid if a matching `_element_id` exists on the target page
- Social media URLs can use `#` as placeholder ONLY if real URLs are not yet provided by the client
- When creating a new page, also audit existing pages for links that should point to the new page

### 13. Responsive Design Priority
- **Build responsive from the first JSON generation** — never build desktop-only and retrofit later
- Desktop, tablet, and mobile properties are set simultaneously during initial build
- Every section MUST have `padding` + `padding_tablet` + `padding_mobile`
- Every flex row MUST have `flex_gap` + `flex_gap_tablet` + `flex_gap_mobile`
- Every column/card MUST have `width` + `width_tablet` + `width_mobile`
- Every card with padding MUST have `padding` + `padding_mobile`
- Every button MUST have `text_padding` + `text_padding_mobile`
- Every body text (16px+) MUST have `typography_font_size_mobile`
- Split layouts (2-col that stacks): add `align_mobile: "center"` on headings, text, and buttons
- See **Responsive Design Master Reference** section for complete property tables

### 14. No Special Unicode Characters
- **NEVER use** em-dashes (`\u2014`), en-dashes (`\u2013`), curly quotes, or other special Unicode in JSON text
- These render as mojibake (e.g., `\u00e2\u20ac\u201c`) on WordPress
- Use plain hyphens `-`, straight quotes `"`, or HTML entities instead

### 15. Project Archiving (Mandatory)
- **Every completed project MUST be archived** as a starter kit in `templates/starter-kits/<project-name>/`
- Archive AFTER the project is fully built, responsive, and approved by the user
- Follow the complete **Project Archiving Checklist** below — no exceptions
- The repo README portfolio section MUST be updated with every new project
- This rule exists so the system builds a portfolio of real work and provides reusable design references

---

## Typography Scale

| Element | Size (desktop) | Size (tablet) | Size (mobile) | Weight | Line Height |
|---------|---------------|---------------|---------------|--------|-------------|
| Display | 56px | 42px | 32px | 800 | 1.1em |
| H1 | 44px | 36px | 28px | 700 | 1.2em |
| H2 | 36px | 30px | 24px | 700 | 1.2em |
| H3 | 28px | 24px | 20px | 600 | 1.3em |
| H4 | 22px | 20px | 18px | 600 | 1.3em |
| H5 | 18px | 16px | 16px | 600 | 1.4em |
| Overline/Label | 14px | 14px | 12px | 600 | 1.4em |
| Body Large | 18px | 18px | 16px | 400 | 1.8em |
| Body | 16px | 16px | 15px | 400 | 1.6em |
| Body Small | 14px | 14px | 13px | 400 | 1.6em |
| Caption | 12px | 12px | 11px | 400 | 1.4em |

---

## Section Spacing

| Section Type | Padding Desktop | Padding Tablet | Padding Mobile |
|-------------|----------------|----------------|----------------|
| Hero | 120px top/bottom, 24px sides | 96px top/bottom, 24px sides | 80px top/bottom, 16px sides |
| Standard | 80px top/bottom, 24px sides | 64px top/bottom, 24px sides | 48px top/bottom, 16px sides |
| Compact/Stats | 48-64px top/bottom, 24px sides | 40-48px top/bottom, 24px sides | 32-40px top/bottom, 16px sides |
| CTA Banner | 64px top/bottom, 24px sides | 48px top/bottom, 24px sides | 40px top/bottom, 16px sides |

---

## Responsive Design Master Reference (2026-02-25)

**CRITICAL: Every page, header, and footer MUST be fully responsive from the first build.** Never build desktop-only and retrofit responsive later — it doubles the work. Apply ALL responsive properties during initial JSON generation.

### Responsive Property Checklist by Element Type

When building ANY element, always include the responsive variant properties listed below. This is NOT optional.

#### Level 1 — Section Container
| Property | Desktop | Tablet | Mobile |
|----------|---------|--------|--------|
| `padding` | `80px top/bottom, 24px sides` | `padding_tablet`: `64px top/bottom, 24px sides` | `padding_mobile`: `48px top/bottom, 16px sides` |

#### Level 3 — Row Container (multi-column)
| Property | Desktop | Tablet | Mobile |
|----------|---------|--------|--------|
| `flex_gap` | `24-48px` (per design) | `flex_gap_tablet`: reduce by ~33% | `flex_gap_mobile`: reduce by ~50% |

**Gap scaling reference:**
| Desktop Gap | Tablet Gap | Mobile Gap |
|-------------|-----------|------------|
| 48px | 32px | 24px |
| 32px | 24px | 20px |
| 24px | 20px | 16px |
| 16px | 16px | 12px |

#### Level 4 — Column / Card Container
| Property | Desktop | Tablet | Mobile |
|----------|---------|--------|--------|
| `width` | Design size (30%, 45%, 50%, etc.) | `width_tablet`: See grid rules below | `width_mobile`: 100% (always full-width) |
| `padding` | Design padding | `padding_tablet`: reduce by ~15% | `padding_mobile`: reduce by ~25-30% |

**Column width rules for tablet:**
| Desktop Layout | Tablet `width_tablet` | Mobile `width_mobile` |
|---------------|----------------------|----------------------|
| 3-col grid (30% each) | 47% (2 per row) | 100% (stacked) |
| 2-col split (55%/40% or 50%/45%) | 100% / 100% (stacked) | 100% / 100% (stacked) |
| 2-col equal (47%/47%) | 47% (keep side-by-side) | 100% (stacked) |
| Sidebar layout (65%/30%) | 100% / 100% (stacked) | 100% / 100% (stacked) |
| Footer 3-col (38%/25%/25%) | Col1: 100%, Col2+3: 47% | All: 100% (stacked) |

#### Heading Widget (H1, H2, H3)
| Property | Required Responsive |
|----------|-------------------|
| `typography_font_size` | **ALWAYS** add `typography_font_size_tablet` AND `typography_font_size_mobile` |
| `align` | Add `align_mobile: "center"` on headings in split (2-column) layouts |

Use Typography Scale table for exact sizing per heading level.

#### Text Editor Widget (paragraphs, descriptions)
| Property | Desktop | Mobile |
|----------|---------|--------|
| `typography_font_size` | 16-18px | `typography_font_size_mobile`: 15px |
| `align` | as designed | `align_mobile: "center"` on split layouts |

#### Button Widget
| Property | Desktop | Mobile |
|----------|---------|--------|
| `text_padding` | `14px 32px` | `text_padding_mobile`: `12px 24px` |
| `align` | as designed | `align_mobile: "center"` on split layouts |

#### Counter Widget
| Property | Desktop | Tablet | Mobile |
|----------|---------|--------|--------|
| `typography_font_size` (number) | 48px | `typography_font_size_tablet`: 40px | `typography_font_size_mobile`: 32px |
| `typography_title_font_size` (title) | 20px | `typography_title_font_size_tablet`: 18px | `typography_title_font_size_mobile`: 10px |
| Alignment | — | — | `title_horizontal_alignment_mobile: "center"`, `number_position_mobile: "center"` |

### Header Responsive Requirements
| Element | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Logo container `width` | 20-25% | Keep same | `width_mobile`: 28-35% |
| Logo image `width` | Full size | Keep same | `width_mobile`: ~400px (or scaled) |
| Nav menu | Visible | Often hidden (hamburger) | Hidden (hamburger) |
| CTA container `width` | 20-25% | Keep same | `width_mobile`: 40-50% |
| Section height | 64px | Keep same | Auto (let content flow) |

### Footer Responsive Requirements
| Element | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Section `padding` | 48px top, 24px sides | `padding_tablet`: 40px top, 20px sides | `padding_mobile`: 40px top, 16px sides |
| Column 1 (brand) `width` | 38% | `width_tablet`: 100% | `width_mobile`: 100% |
| Columns 2-3 `width` | 25% each | `width_tablet`: 47% (side-by-side) | `width_mobile`: 100% |
| Row `flex_gap` | 32px | Keep same | `flex_gap_mobile`: 24px |
| Copyright `font_size` | 13px | Keep same | `typography_font_size_mobile`: 12px |

### Quick Rules Summary
1. **EVERY** section: `padding` + `padding_tablet` + `padding_mobile`
2. **EVERY** flex row: `flex_gap` + `flex_gap_tablet` + `flex_gap_mobile`
3. **EVERY** column: `width` + `width_tablet` + `width_mobile`
4. **EVERY** card/container with padding: `padding` + `padding_tablet` (optional) + `padding_mobile`
5. **EVERY** H1-H3 heading: `font_size` + `font_size_tablet` + `font_size_mobile`
6. **EVERY** body text (16px+): `font_size` + `font_size_mobile`
7. **EVERY** button: `text_padding` + `text_padding_mobile`
8. **EVERY** element in a 2-column split: `align_mobile: "center"` (text + buttons center when stacked)

---

## Common Section Patterns

### Hero (dark, split layout)
```
container (full, dark bg, padding + padding_tablet + padding_mobile)
  └── container (boxed 1200px, row, gap + gap_tablet + gap_mobile)
      ├── container (55% width, width_tablet:100%, width_mobile:100%) → overline + h1(+tablet+mobile sizes) + paragraph(+mobile size) + button row
      └── container (40% width, width_tablet:100%, width_mobile:100%) → image
```

### Services Grid (3 columns)
```
container (full, light bg, padding + padding_tablet + padding_mobile)
  └── container (boxed, column)
      ├── overline heading + h2(+tablet+mobile sizes) + subtitle(+mobile size)
      └── container (row, wrap, gap + gap_tablet + gap_mobile)
          ├── card (30%, width_tablet:47%, width_mobile:100%, padding + padding_mobile) → icon + h3(+mobile size) + text
          ├── card (30%, width_tablet:47%, width_mobile:100%, padding + padding_mobile) → icon + h3(+mobile size) + text
          └── card (30%, width_tablet:47%, width_mobile:100%, padding + padding_mobile) → icon + h3(+mobile size) + text
```

### CTA Banner (gradient)
```
container (full, gradient bg, padding + padding_tablet + padding_mobile, center aligned)
  └── container (boxed narrow 800px, column, center, gap + gap_mobile)
      ├── h2 (white, +tablet+mobile sizes)
      ├── paragraph (white muted, +mobile size)
      └── container (row, center, gap + gap_mobile) → button(+padding_mobile) + button(+padding_mobile)
```

### Testimonials (3 cards)
```
container (full, subtle bg, padding + padding_tablet + padding_mobile)
  └── container (boxed, column)
      ├── section heading group (h2 +tablet+mobile sizes)
      └── container (row, wrap, gap + gap_tablet + gap_mobile)
          ├── card (30%, width_tablet:47%, width_mobile:100%, padding + padding_mobile) → star-rating + quote + name
          ├── card (30%, width_tablet:47%, width_mobile:100%, padding + padding_mobile) → star-rating + quote + name
          └── card (30%, width_tablet:47%, width_mobile:100%, padding + padding_mobile) → star-rating + quote + name
```

### Footer (3 columns, dark)
```
container (full, dark bg, padding + padding_tablet + padding_mobile)
  └── container (boxed, column)
      ├── container (row, wrap, gap + gap_mobile)
      │   ├── container (38%, width_tablet:100%, width_mobile:100%) → brand heading(+mobile size) + description(+mobile size)
      │   ├── container (25%, width_tablet:47%, width_mobile:100%) → "Contact" heading + icon-list
      │   └── container (25%, width_tablet:47%, width_mobile:100%) → "Services" heading + icon-list
      └── container (row, border-top) → copyright text(+mobile size)
```

### FAQ Section (stacked cards)
```
container (full, white bg, padding + padding_tablet + padding_mobile)
  └── container (boxed 900px, column, gap 32px)
      ├── section heading group (overline + h2 +tablet+mobile sizes + subtitle)
      └── container (column, gap 16px)
          ├── card (100%, bg #F7F9FC, padding 24px, border-radius 8px) → h4 question + text-editor answer
          ├── card (100%, bg #F7F9FC, padding 24px, border-radius 8px) → h4 question + text-editor answer
          ├── card (100%, bg #F7F9FC, padding 24px, border-radius 8px) → h4 question + text-editor answer
          └── ... (repeat for each Q&A pair)
```
**Notes:** Use narrow boxed width (800-900px) for readability. Each card is a container with heading (h4, 18px) + text-editor (15px). No animation on cards — FAQ content must always be visible.

### Contact Form (split layout)
```
container (full, light bg, padding + padding_tablet + padding_mobile)
  └── container (boxed 1200px, row, gap + gap_tablet + gap_mobile)
      ├── container (45%, width_tablet:100%, width_mobile:100%) → overline + h2 + contact icon-list + social-icons
      └── container (50%, width_tablet:100%, width_mobile:100%, bg white, shadow, padding) → overline + h3 + text-editor + form widget
```
**Notes:** NEVER animate the form widget. Contact info column can use `_animation: "fadeInLeft"`, form column uses `_animation: "fadeInRight"` on the heading only (not the form itself).

---

## Animation Rules

- Default entrance: `fadeInUp` with staggered delays (0, 100, 200, 300ms)
- Split layouts: left column `fadeInLeft`, right column `fadeInRight`
- Only animate widgets, NEVER containers
- Maximum delay: 800ms
- Keep it subtle — less is more

### CRITICAL: Animation Placement Safety

**WARNING:** `_animation` settings add `elementor-invisible` (opacity: 0) to elements on page load. If the animation JS (waypoints) fails to trigger, elements stay permanently invisible on the live frontend while appearing fine in the editor.

**Safe to animate:**
- Hero section headings and buttons (above the fold, always visible on load)
- Section title groups (overline + H2 + subtitle at the top of each section)
- CTA section content (simple structure, few widgets)

**NEVER animate:**
- Form widgets (elementor-form) — complex widget, animation JS often fails
- Icon-list widgets — content becomes invisible
- Card interiors (widgets inside card containers) — too many elements for waypoints
- Contact info sections with multiple widget types
- Any section with deeply nested containers (4+ levels)

**Debugging invisible elements:** If content shows in Elementor editor but not on frontend, check the page HTML source for `class="elementor-invisible"`. If found, the fix is to remove `_animation` and `_animation_delay` from those widgets.

---

## Where to Find Content

When building pages for a project, get all content from:
- `projects/<name>/brief.json` → business info, services, testimonials, team, stats, contact
- Use placeholder images from `https://picsum.photos/<width>/<height>` if no real images provided
- Use Font Awesome icons (see the list above)

---

## Reference Files

- `templates/sample-landing-page.json` — Complete 8-section landing page example. Study this for structure.
- `docs/design-system.json` — Full design system with all spacing, typography, color, and component rules.

---

## Checklist Before Delivering a Page Template

- [ ] **Section plan approved by user BEFORE building** (present proposed sections → get confirmation → then build)
- [ ] All containers use `elType: "container"` (no section/column)
- [ ] Every widget has `"elements": []`
- [ ] No `style="..."` with double quotes in any HTML
- [ ] Colors match the project brief
- [ ] Fonts match the project brief (heading font + body font)
- [ ] Inner containers are boxed at 1200px
- [ ] Sections alternate backgrounds for visual rhythm
- [ ] File is valid JSON (no trailing commas, proper escaping)
- [ ] **All button/link URLs verified** — only point to existing pages or valid anchors
- [ ] **No special Unicode characters** (em-dash, curly quotes) — use plain ASCII
- [ ] **Counter widgets have both typography groups** — `typography_*` for number + `typography_title_*` for title

### Responsive Checklist (MANDATORY — every element, first build)
- [ ] **Every section**: `padding` + `padding_tablet` + `padding_mobile`
- [ ] **Every flex row**: `flex_gap` + `flex_gap_tablet` + `flex_gap_mobile`
- [ ] **Every column/card**: `width` + `width_tablet` + `width_mobile` (see Responsive Master Reference for sizing)
- [ ] **Every card with padding**: `padding` + `padding_mobile` (and optionally `padding_tablet`)
- [ ] **Every H1-H3 heading**: `typography_font_size` + `typography_font_size_tablet` + `typography_font_size_mobile`
- [ ] **Every body text (16px+)**: `typography_font_size` + `typography_font_size_mobile`
- [ ] **Every button**: `text_padding` + `text_padding_mobile`
- [ ] **Split layouts that stack**: `align_mobile: "center"` on headings, text, and buttons in the stacking columns
- [ ] **Grid items**: 3-col = 30%/47%/100%, 2-col split = stack to 100% on tablet, always 100% mobile

---

## Project Archiving Checklist (MANDATORY — every completed project)

> **When to archive:** After the project is fully built, responsive, pushed to WordPress, and approved by the user. This is a **strict requirement** (Rule #15) — no project is considered complete until it is archived.

### Retroactive Archiving (Old/Existing Projects)

When archiving a project that was built previously and may not have local files:

**Step 0a — Set up site connection** (if not already configured):
Add the site to `config/sites.json` with the correct URL and API key.

**Step 0b — Export all pages from WordPress:**
```powershell
# List all pages/templates to find IDs
.\sync.ps1 -Site "<site-name>" -Action list

# Export each page to a local JSON file
.\sync.ps1 -Site "<site-name>" -Action get -PageId <HOME_ID> -TemplateFile ".\projects\<project>\pages\home.json"
.\sync.ps1 -Site "<site-name>" -Action get -PageId <HEADER_ID> -TemplateFile ".\projects\<project>\pages\header.json"
.\sync.ps1 -Site "<site-name>" -Action get -PageId <FOOTER_ID> -TemplateFile ".\projects\<project>\pages\footer.json"
# Repeat for any other pages (about.json, services.json, etc.)
```

**Step 0c — Create `brief.json`** (if it doesn't exist):
Read the exported page JSONs to extract the business name, tagline, colors, fonts, services, contact info, and content. Create a `brief.json` following the template in `templates/project-brief-template.json`.

**Step 0d — Create `page-mapping.json`:**
```json
{
    "header": <HEADER_TEMPLATE_ID>,
    "footer": <FOOTER_TEMPLATE_ID>,
    "home": <HOME_PAGE_ID>
}
```

After completing Steps 0a-0d, continue with the standard archiving process below (Steps 1-8).

### Step-by-Step Process

**Step 1 — Create starter kit folder:**
```
templates/starter-kits/<project-name>/
```

**Step 2 — Copy all project files (raw, as-is):**
| File | Source | Required |
|------|--------|----------|
| `home.json` (and any other page JSONs) | `projects/<project>/pages/` | YES |
| `header.json` | `projects/<project>/pages/` | YES |
| `footer.json` | `projects/<project>/pages/` | YES |
| `brief.json` | `projects/<project>/` | YES |
| `page-mapping.json` | `projects/<project>/` | YES |

**Step 3 — Create `design-tokens.json`:**
Extract from the actual project files:
- All colors with usage notes (primary, dark, accent, light, CTA, text colors, borders)
- Typography (heading font + weight, body font + weight, full scale with responsive sizes)
- Spacing patterns (section padding, card padding, flex gaps — desktop/tablet/mobile)
- Component definitions (header, footer, buttons, cards with specific values)
- Page sections list (name, background color, layout pattern for each section)

**Step 4 — Take a full-page homepage screenshot:**
```powershell
$path = "templates\starter-kits\<project-name>\screenshot.png"
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --window-size=1440,8000 --screenshot="$path" --hide-scrollbars --virtual-time-budget=10000 "<site-url>"
```
- Use Chrome headless with a tall viewport (8000px) to capture ALL sections
- Save as `screenshot.png` in the starter kit folder
- Verify the file is at least 500 KB (a full-page capture of a real site)

**Step 5 — Create starter kit `README.md`:**
Must include:
- Project title and one-line description
- Screenshot image (`![Project Name](screenshot.png)`)
- "About This Project" table (client, industry, location, site type, live URL, build date)
- "Design System" table (all color tokens + font tokens)
- "Page Sections" numbered list with brief descriptions
- "Files" table listing every file with size and description
- "How to Use This Starter Kit" section (reference + starting point instructions)
- "WordPress IDs" table for reference

**Step 6 — Update repo `README.md` portfolio:**
Add a new entry under "## Portfolio — Built With This System":
```markdown
### <Project Name>

> **<Location> <Industry>** — <One-line description>

<a href="templates/starter-kits/<project-name>/">
  <img src="templates/starter-kits/<project-name>/screenshot.png" alt="<Project Name> Homepage" width="800">
</a>

| Detail | Value |
|--------|-------|
| **Industry** | <industry> |
| **Location** | <location> |
| **Type** | <site type> |
| **Features** | <key features> |
| **Design** | <fonts and color summary> |
| **Starter Kit** | [`templates/starter-kits/<project-name>/`](templates/starter-kits/<project-name>/) |
```

**Step 7 — Update the changelog in CLAUDE.md:**
Add a dated entry describing the archiving.

**Step 8 — Verify the archive:**
- [ ] All JSON files are valid and match the live site
- [ ] Screenshot shows the full homepage (all sections visible)
- [ ] design-tokens.json has all colors, fonts, spacing, and components
- [ ] Starter kit README has screenshot, design system table, and file listing
- [ ] Repo README portfolio section has the new project with embedded screenshot
- [ ] No API keys, passwords, or secrets in any archived file

### Starter Kit Folder Structure (Reference)
```
templates/starter-kits/<project-name>/
├── README.md              ← Project showcase with screenshot
├── screenshot.png         ← Full-page homepage capture
├── design-tokens.json     ← Colors, fonts, spacing, components
├── brief.json             ← Complete project brief
├── page-mapping.json      ← WordPress template/page IDs
├── home.json              ← Homepage (or other page JSONs)
├── header.json            ← Header template
└── footer.json            ← Footer template
```

---

## Known Issues & Fixes

> Add entries here when bugs are discovered and fixed. Format: `[DATE] Issue → Fix`

- `[2026-02-15]` WordPress `wp_unslash()` strips backslashes from JSON in `update_post_meta` → **Fix:** Plugin wraps all meta saves with `wp_slash(wp_json_encode($data))`
- `[2026-02-15]` Legacy `section`/`column` elTypes don't render in modern Elementor → **Fix:** Use `container` with flexbox for everything
- `[2026-02-15]` Button containers inside column flex parents appear left-aligned even with `justify_content: "center"` → **Fix:** The correct Elementor property name is `"flex_justify_content"`, NOT `"justify_content"`. For centering buttons side-by-side: use a row container with `"content_width": "full"` and `"flex_justify_content": "center"`. For single centered buttons: use `"align": "center"` directly on the button widget.
- `[2026-02-15]` Premium fonts like Geller Heading are not available in Elementor/Google Fonts → **Fix:** Use Google Fonts alternatives (Playfair Display for serif headings, DM Sans for modern body text)
- `[2026-02-15]` NEVER use PUT `/pages/{id}` to update Elementor library templates (header/footer/section). The update_page endpoint hardcodes `_elementor_template_type` to `wp-page`, which breaks Theme Builder display conditions. → **Fix:** Delete the old template and re-create it via POST `/templates` endpoint instead.
- `[2026-02-15]` Iconify icon widget rendered off-center with no alignment control → **Fix:** Updated `iconify-elementor-widget.php` to wrap icon in `<div>` with `text-align` and added `align` control (left/center/right, default center).
- `[2026-02-15]` "How It Works" step numbers (36px) visually dominated the icons (32px) → **Fix:** Reduced numbers to 22px/h6 with weight 700, increased icons to 44px. Icons should always be the visual hero in step layouts.
- `[2026-02-15]` Iconify icon widget rendered off-center with no alignment control → **Fix:** Updated `iconify-elementor-widget.php` to wrap icon in `<div>` with `text-align` and added `align` control (left/center/right, default center).
- `[2026-02-15]` Footer social icons appeared as gray circles with no visible icon inside on dark bg → **Fix:** With circle shape, `icon_primary_color` = background circle color, `icon_secondary_color` = icon glyph color. Set `icon_secondary_color` to a visible color (e.g., `#B0BEC5`) and `icon_primary_color` to a subtle bg (e.g., `#1A3050`). Add `icon_secondary_color_hover` for hover state.
- `[2026-02-15]` Footer logo didn't harmonize with dark background → **Fix:** User manually added white border (`border_border: solid`, `border_color: #FFFFFF` or `rgba(255,255,255,0.15)`) and border-radius (12px) to the logo image widget.
- `[2026-02-15]` Pricing card divider lines misaligned when description text varies in length across cards → **Fix:** Wrap the top content (icon, title, price, description) in an inner container with `_flex_size: "grow"`. This pushes the divider and features list to the bottom, aligned consistently across all cards regardless of content height.
- `[2026-02-15]` Em-dash character `—` rendered as `â€"` on WordPress frontend → **Fix:** Avoid special Unicode characters (em-dash, en-dash, curly quotes) in JSON text content. Use plain hyphens `-` or HTML entities instead.
- `[2026-02-15]` Footer template caused "critical error on this website" after creation via API → **Root Cause:** `_elementor_data` was stored as a JSON object `{"0":{...}}` instead of a JSON array `[{...}]`. This happens when PHP's `wp_json_encode()` receives an associative array (keys "0", "1", etc. as strings from REST API deserialization) and encodes it as an object. Elementor's `create_element_instance()` expects array elements, not object properties. → **Fix:** Always call `array_values()` on `$elementor_data` before `wp_json_encode()` in `create_page()`, `update_page()`, and `import_template()`. Also detect unwrapped single elements: `if (!isset($elementor_data[0]) && !empty($elementor_data)) { $elementor_data = [$elementor_data]; }`.
- `[2026-02-15]` `assign_element_ids()` crashed with `Cannot access offset of type string on string` on PHP 8.1 → **Fix:** Added `if (!is_array($element)) continue;` guard before accessing element properties.
- `[2026-02-15]` Deleted Elementor templates caused crashes due to stale conditions cache → **Fix:** Remove `_elementor_conditions` meta before deletion, regenerate Elementor conditions cache after deletion via `\ElementorPro\Modules\ThemeBuilder\Module::instance()->get_conditions_manager()->get_cache()->regenerate()`.
- `[2026-02-16]` Widgets with `_animation: "fadeInUp"` (or any entrance animation) rendered permanently invisible on frontend → **Root Cause:** Elementor adds `class="elementor-invisible"` (which sets `opacity: 0`) to animated elements on page load. The animation JS (waypoints library) is supposed to remove this class and trigger the animation when the element scrolls into view. When the waypoints JS fails to fire (e.g., due to page structure, lazy loading, or Element Cache conflicts), elements stay invisible permanently. Content appears correctly in the Elementor editor but is hidden on the live frontend. → **Fix:** Use animations selectively — only on above-the-fold hero content, section title groups, and CTA sections. NEVER animate form widgets, icon-list widgets, contact info content, or card interiors. If a page has invisible elements, strip all `_animation` and `_animation_delay` settings first, confirm rendering, then re-add selectively.
- `[2026-02-16]` Elementor "Element Cache" setting (1 Day) can cause API-pushed page updates to not reflect on frontend → **Fix:** Disable Element Cache during development/debugging. The setting is in Elementor > Settings > Performance > Element Cache. Set to "Disable" while iterating, re-enable when stable.

---

## Debugging Strategy: Manual Fix → Retrieve → Learn

When a layout or styling issue persists after 2 attempts:

1. **Stop guessing.** Ask the user to fix it manually in the Elementor visual editor.
2. **Retrieve the fix.** Once the user confirms it's saved, run:
   ```powershell
   .\sync.ps1 -Site "<project>" -Action get -PageId <id> -TemplateFile ".\temp-export.json"
   ```
3. **Analyze the exported JSON.** Search for the relevant section and compare the settings Elementor actually saved vs. what you generated. Look for:
   - Different property names (e.g., `flex_justify_content` vs `justify_content`)
   - Missing properties that Elementor added
   - Different property values or structures
4. **Update your knowledge.** Edit this CLAUDE.md file with the correct property names/patterns so the fix is permanent.
5. **Clean up.** Delete the temp export file.

**Why this works:** Elementor's internal property names don't always match CSS names or intuitive guesses. The visual editor is the source of truth for setting names. By exporting what Elementor actually saves, you learn the exact JSON structure needed.

---

## Debugging Strategy: Diagnostics Protocol (v1.2.0+)

When an API call fails or returns unexpected results, use the built-in diagnostics system:

### Step 1: Check Logs
```powershell
# View today's sync logs — shows step-by-step execution and errors
.\sync.ps1 -Site "<project>" -Action logs

# View logs for a specific date
.\sync.ps1 -Site "<project>" -Action logs -Title "2026-02-15"

# Filter by error level only
# (via API: GET /logs?level=ERROR)
```

### Step 2: Run Diagnostics
```powershell
# Full system health check — PHP, Elementor, Theme Builder, disk, debug.log
.\sync.ps1 -Site "<project>" -Action diagnostics
```
This reports: PHP version/memory/limits, Elementor + Pro status with versions, Theme Builder templates and their display conditions, `elementor_library_type` taxonomy terms, last 20 lines of WP debug.log, sync log files, disk space.

### Step 3: Run Targeted Tests
```powershell
# Run ALL dry-run tests
.\sync.ps1 -Site "<project>" -Action test

# Test template creation specifically (creates + immediately deletes a test template)
.\sync.ps1 -Site "<project>" -Action test -Title "template_create"

# Test Elementor environment (checks classes, post types, taxonomies)
.\sync.ps1 -Site "<project>" -Action test -Title "elementor_check"

# Test memory for large JSON payloads
.\sync.ps1 -Site "<project>" -Action test -Title "memory"
```

### Step 4: Identify and Fix
- **500 errors with no detail:** Check logs — the plugin now wraps all critical operations in try-catch and logs each step. Find the last INFO log before the error to identify exactly where it failed.
- **Template creation fails:** Run `test -Title "template_create"` — this tests `wp_insert_post`, `update_post_meta`, `wp_set_object_terms`, and `_elementor_conditions` in isolation.
- **Theme Builder templates not showing:** Run `diagnostics` — check `theme_builder.active_templates` for display conditions. Templates need `_elementor_conditions: ['include/general']` to appear site-wide.
- **Memory issues:** Run `test -Title "memory"` — compares memory before/after parsing ~500KB of JSON.

### Step 5: Clean Up
```powershell
.\sync.ps1 -Site "<project>" -Action clear-logs
```

### Plugin Error Logging Details
The plugin v1.2.0 logs to `wp-content/ai-sync-logs/sync-YYYY-MM-DD.log` with these levels:
- `INFO` — Normal operation steps (page created, meta saved, etc.)
- `WARN` — Non-fatal issues (cache regeneration failed, etc.)
- `ERROR` — Operation failures (wp_insert_post error, taxonomy error, etc.)
- `FATAL` — Unhandled exceptions (with stack trace)
- `PHP_ERROR` — PHP errors/warnings captured during REST API execution

The log directory is protected with `.htaccess` (Deny from all) and `index.php`.

**Known Elementor property name differences:**
| What You Might Guess | Actual Elementor Property |
|---------------------|--------------------------|
| `justify_content` | `flex_justify_content` |
| `align_items` (works) | `align_items` |
| `flex_direction` (works) | `flex_direction` |
| `flex_wrap` (works) | `flex_wrap` |
| `align_items` (for centering children in column container) | `flex_align_items` |
| `flex_size` (flex grow/shrink on child container) | `_flex_size` (options: `none`, `grow`, `shrink`, `custom`) — registered with `name: '_flex'` prefix in `Group_Control_Flex_Item` |
| `flex_grow` (custom flex grow value) | `_flex_grow` (only when `_flex_size` is `custom`) |
| `flex_shrink` (custom flex shrink value) | `_flex_shrink` (only when `_flex_size` is `custom`) |
| `flex_align_self` | `_flex_align_self` |
| `flex_order` | `_flex_order` |
| `border_*` on image widget (for image itself) | `image_border_border`, `image_border_width`, `image_border_radius`, `image_border_color` — the `border_*` properties control the widget wrapper, `image_border_*` controls the `<img>` element itself. Color can reference globals via `__globals__: {"image_border_color": "globals/colors?id=background"}` |
| Nav menu dropdown hover bg | `background_color_dropdown_item_hover` — sets hover background color for dropdown items |
| Nav menu dropdown top gap | `dropdown_top_distance_tablet`, `dropdown_top_distance_mobile` — gap between header bar and dropdown panel |
| Nav menu dropdown item padding | `padding_horizontal_dropdown_item_mobile`, `padding_vertical_dropdown_item_mobile` — dropdown item padding per breakpoint |
| Nav menu dropdown spacing | `menu_space_between` — vertical space between dropdown menu items |
| Nav menu dropdown text style | `menu_typography_text_transform` (e.g., `"uppercase"`), `full_width: "stretch"`, `text_align: "center"` |
| Nav menu pointer style | `pointer` — set to `"none"` to remove underline hover effect on desktop |
| Nav menu hamburger bg | `__globals__: {"toggle_background_color": "globals/colors?id=background"}` — uses global color for toggle bg |
| Counter title typography | `typography_title_typography`, `typography_title_font_family`, `typography_title_font_size`, `typography_title_font_weight` — separate typography group for the title text below the number. `typography_*` controls the number, `typography_title_*` controls the title |
| Counter mobile alignment | `title_horizontal_alignment_mobile: "center"`, `number_position_mobile: "center"` — centers title and number independently on mobile |

> Add more entries to the table above as they are discovered.

---

## Changelog

> This section tracks when CLAUDE.md itself was updated with new knowledge.

| Date | What Changed | Why |
|------|-------------|-----|
| 2026-02-15 | Initial creation | Full system documentation |
| 2026-02-15 | Added self-improvement rule | AI threads auto-update this file with new learnings |
| 2026-02-15 | Cleaned for GitHub | Removed secrets, added .gitignore, GitHub workflow section |
| 2026-02-15 | Added debugging strategy | Manual fix → retrieve → learn approach for unknown Elementor properties |
| 2026-02-15 | Fixed flex_justify_content | Discovered correct property name via manual fix + export |
| 2026-02-15 | Added Iconify icon support | Plugin v1.1.0 — custom widget for Tabler/Material/Phosphor icons |
| 2026-02-15 | Iconify widget alignment fix | Added align control + div wrapper for proper centering |
| 2026-02-15 | Footer social icon color fix | Documented icon_primary_color vs icon_secondary_color for circle shape |
| 2026-02-15 | Icon sizing best practices | Step numbers smaller than icons; icons are visual hero |
| 2026-02-15 | Added versioning rule | Plugin and system versions must be updated as we progress |
| 2026-02-15 | Discovered flex_align_items | Centers children horizontally in column flex containers — learned from manual edit sync |
| 2026-02-15 | Discovered `_flex_size` property | Flex child controls use `_flex` prefix (from `Group_Control_Flex_Item` registered with `name: '_flex'`). Correct property: `_flex_size: "grow"` not `flex_size: "grow"`. Found by reading Elementor source on GitHub. |
| 2026-02-15 | Star-rating Safari fix | `star_style: "star_unicode"` renders Unicode ★ instead of eicons font — fixes empty squares on Safari/macOS |
| 2026-02-15 | Pricing card alignment pattern | Wrap top content in `_flex_size: "grow"` container to align dividers across cards with varying content lengths |
| 2026-02-15 | Em-dash encoding fix | Avoid `—` and other special Unicode chars in JSON — they render as mojibake (`â€"`) on WordPress |
| 2026-02-15 | Plugin v1.2.0 diagnostics | Added error logging, diagnostics, logs, and test endpoints. sync.ps1 updated with diagnostics/logs/clear-logs/test actions |
| 2026-02-15 | Fixed critical template rendering bug | `_elementor_data` stored as JSON object instead of array. Fixed with `array_values()` before encoding + single-element detection. Also fixed `assign_element_ids()` PHP 8.1 crash and stale conditions cache on template deletion |
| 2026-02-15 | Added Header & Footer template guide | Comprehensive section documenting pages vs templates differences, correct create/update process, common pitfalls |
| 2026-02-16 | Animation invisibility bug documented | `_animation` adds `elementor-invisible` class (opacity:0). If waypoints JS fails, elements stay invisible. Added safe/unsafe animation placement rules |
| 2026-02-16 | Element Cache debugging note | Elementor Element Cache (1 Day) can prevent API-pushed updates from rendering. Disable during development |
| 2026-02-15 | Nav-menu dropdown settings documented | Learned via manual fix + export: `background_color_dropdown_item_hover`, `dropdown_top_distance_*`, `padding_*_dropdown_item_mobile`, `menu_space_between`, `menu_typography_text_transform`, `full_width`, `text_align`, `pointer`, `toggle_background_color` global |
| 2026-02-15 | Counter widget dual typography groups | Counter has TWO typography groups: `typography_*` for the number, `typography_title_*` for the title. Also `title_horizontal_alignment_mobile` and `number_position_mobile` for mobile centering. Learned from manual fix + export |
| 2026-02-15 | Added interlinking & responsive rules | New strict rules #12 (button/link interlinking), #13 (responsive priority: desktop > tablet > mobile), #14 (no Unicode). Updated checklist with 4 new items. Fixed broken `/about-us/` link in footer and `#consultation` anchor in homepage |
| 2026-02-15 | Added GitHub sync workflow to CLAUDE.md | Full step-by-step process for syncing project learnings to the universal repo. Added README update as mandatory step. Updated README.md with v1.2.0 features, full command reference, changelog, and universal vision |
| 2026-02-25 | **Project archiving system** | Added strict rule #15 (mandatory project archiving). Added "Project Archiving Checklist" section with 8-step process. Added self-improvement trigger for completed projects. Updated repo README with Portfolio section and starter-kit structure. Created first starter kit: Trogen Facility Services (home, header, footer, brief, design-tokens, screenshot). |
| 2026-02-25 | **Major responsive design overhaul** | Added "Responsive Design Master Reference" section with complete property checklists per element type (sections, rows, columns, cards, headings, text, buttons, counters, headers, footers). Updated ALL container examples (Level 1, 3, 4) with `padding_tablet`, `flex_gap_tablet/mobile`, `padding_mobile`. Updated widget examples (text-editor, button) with responsive properties. Updated Section Spacing table with Tablet column. Updated Common Section Patterns with responsive annotations. Rewrote delivery checklist with specific responsive sub-checklist. Updated strict rules #5, #6, #13 to mandate responsive-from-first-build. **Root cause:** Trogen Facility Services project required 40+ responsive properties retrofitted across 9 sections + footer because they weren't included in the initial build. This overhaul ensures all future projects are fully responsive from the first JSON generation. |
| 2026-02-25 | **Added Form, Social Icons, Nav Menu widget examples** | Documented Elementor Pro form widget with all field types, button styling, email settings, honeypot spam protection, and field width controls. Added social-icons widget with circle shape color model (primary = bg, secondary = glyph). Added nav-menu widget with dual typography groups, hamburger breakpoint, dropdown settings, and WP menu limitation. Added FAQ section pattern and Contact Form split layout pattern. Learned from Infinite Global Recruitment project (9+ pages). |
| 2026-02-25 | **Archived Infinite Global Recruitment** | Second starter kit archived: 7 content pages + header + footer (9 templates total). Multi-page recruitment & education consultancy site. Exported all pages from WordPress, created design-tokens.json, took homepage screenshot, updated repo README portfolio. Added widget examples note clarifying colors/fonts are placeholders. |
| 2026-03-01 | **WooCommerce SEO workflow documented** | Added full "WooCommerce SEO Workflow (v1.3.0)" section to CLAUDE.md covering: audit approach (list-wc-categories/products), category JSON format (description + seo_title + seo_description), product JSON format (+ short_description), product-mapping.json tracking, individual and batch push commands, run-seo-push.ps1 batch script pattern, SEO content writing guidelines (local SEO, no keyword stuffing, HTML rules, character limits), API endpoints reference with SiteSEO meta keys. Based on Watercolor.lk project: 8 categories + 14 products SEO-optimized. |

---

## GitHub Workflow

This project is maintained on GitHub. The repo is the **single source of truth** for the universal system. Every website project contributes learnings back to this repo, making the AI smarter for the next project.

### The Universal System Vision

This repo is NOT a single-project tool — it's a **universal AI website builder** that improves with every site built. After building recruitment sites, ecommerce sites, booking sites, portfolios, SaaS tools, etc., the knowledge base (`CLAUDE.md`) will contain every Elementor property name, every layout pattern, and every responsive trick needed to build any type of website instantly.

### For Users Starting a New Project

1. Clone/download the repo to your machine
2. Run `init-project.ps1` to scaffold a new project
3. The `projects/` folder is gitignored — your client data stays local
4. Start an AI chat and say: `@workspace Read CLAUDE.md first`

### When AI Discovers Improvements

During any session, if the AI fixes a bug, discovers a new pattern, or learns something:
1. AI updates `CLAUDE.md` (and `docs/design-system.json` if relevant)
2. User commits and pushes: `git add -A && git commit -m "AI learned: [what]" && git push`
3. All future clones/pulls inherit the improvement

### Syncing Project Learnings to GitHub (End-of-Project Workflow)

When the user says **"push the latest updates to the universal setup in GitHub"** (or similar), follow this exact process:

**Step 1 — Identify changed files.** Compare system files in the working directory against the `ai-elementor-template/` repo folder. Check these files:

| Working Directory File | Repo Destination |
|----------------------|-----------------|
| `CLAUDE.md` | `ai-elementor-template/CLAUDE.md` |
| `sync.ps1` | `ai-elementor-template/sync.ps1` |
| `plugin/ai-elementor-sync/*.php` | `ai-elementor-template/plugin/ai-elementor-sync/` |
| `docs/design-system.json` | `ai-elementor-template/docs/design-system.json` |
| `README.md` (in repo) | `ai-elementor-template/README.md` (update directly) |
| `init-project.ps1` | `ai-elementor-template/init-project.ps1` |
| `templates/*.json` | `ai-elementor-template/templates/` |
| `docs/*.md` | `ai-elementor-template/docs/` |

**Step 2 — Copy changed files:**
```powershell
# Copy each changed file (only copy files that actually changed)
Copy-Item "CLAUDE.md" -Destination "ai-elementor-template/CLAUDE.md" -Force
Copy-Item "sync.ps1" -Destination "ai-elementor-template/sync.ps1" -Force
Copy-Item "plugin/ai-elementor-sync/*.php" -Destination "ai-elementor-template/plugin/ai-elementor-sync/" -Force
Copy-Item "docs/design-system.json" -Destination "ai-elementor-template/docs/design-system.json" -Force
# Add any other changed files...
```

**Step 3 — Update README.md if features changed:**
- Update the README.md in the repo with new features, commands, or version info
- Keep the changelog section current

**Step 4 — Clean up temp files:**
```powershell
# Remove any temp export files from the working directory
Remove-Item "temp-*.json" -ErrorAction SilentlyContinue
```

**Step 5 — Commit and push:**
```powershell
Push-Location "ai-elementor-template"
git add -A
git status  # Review what's staged
git commit -m "v<VERSION>: <brief list of improvements from this project>"
git push origin master
Pop-Location
```

**Step 6 — Confirm to user:** Report the commit hash, number of files changed, and insertions/deletions.

**IMPORTANT — What NEVER gets synced:**
- `projects/` folder (client-specific data)
- `config/sites.json` with real API keys
- `page-mapping.json` files
- Temp export files (`temp-*.json`)
- Any client content, images, or branding

### Keeping Up to Date

```powershell
# Pull latest system improvements
git pull origin master

# Your projects/ folder is unaffected (gitignored)
```

### What Gets Committed (tracked)
- `CLAUDE.md` — AI knowledge base (updated by AI)
- `sync.ps1`, `init-project.ps1` — CLI tools
- `plugin/` — WordPress plugin source
- `templates/` — Reference templates and project brief template
- `docs/` — Design system, workflow guide, prompt templates
- `config/sites.json` — With placeholder values only
- `README.md` — Feature docs, command reference, changelog

### What Stays Local (gitignored)
- `projects/` — Client-specific data, briefs, generated pages
- `config/page-mapping.json` — Runtime page ID mapping
- Real API keys — Never committed
