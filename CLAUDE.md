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

**How to update:** Edit this CLAUDE.md file directly. Add new entries to the relevant section. If no section fits, create a new one (e.g., "## Known Issues", "## Advanced Patterns"). Include the date of the change.

**Also update** `docs/design-system.json` if the change is about spacing, typography, colors, or component patterns.

---

## What This System Does

We build Elementor pages as JSON files and push them to WordPress via a custom REST API plugin. The workflow:
1. AI generates a page template as JSON
2. User pushes it to WordPress with `sync.ps1`
3. User reviews the live result in browser
4. User requests changes → AI edits the JSON → re-push
5. Repeat until perfect

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
│   ├── workflow-guide.md        ← Step-by-step workflow documentation
│   └── ai-prompt-templates.md   ← Ready-to-use prompt templates
├── plugin/
│   └── ai-elementor-sync/       ← WordPress plugin (already installed on server)
├── templates/
│   ├── sample-landing-page.json ← Reference example (8 sections, container-based)
│   ├── project-brief-template.json ← Template for new project briefs
│   └── design-system-page.json  ← Master design system review page
└── projects/
    └── <project-name>/          ← One folder per client project
        ├── brief.json           ← Project requirements, content, branding
        ├── design-system-page.json ← Customized design system page
        ├── page-mapping.json    ← Maps page names to WordPress post IDs
        └── pages/               ← Generated page templates
            ├── home.json
            ├── about.json
            └── ...
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
```

You do NOT push pages yourself. Generate the JSON file → tell the user the sync command to run.

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
        "padding": {"unit": "px", "top": "32", "right": "32", "bottom": "32", "left": "32", "isLinked": true}
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
        "button_background_hover_color": "#5A52D5"
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
- H1, H2, and display headings MUST have `_tablet` and `_mobile` font size variants
- Example: `typography_font_size` = 36px, `typography_font_size_tablet` = 30px, `typography_font_size_mobile` = 24px

### 6. Responsive Grid Items
- Every column container must set `width`, `width_tablet`, and `width_mobile`
- 3-column grid: 30% desktop → 47% tablet → 100% mobile
- 2-column split: 55%/40% desktop → 100%/100% mobile

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
- **Desktop first**, then tablet, then mobile — this is the development priority order
- Desktop must look perfect before addressing tablet/mobile
- Every section MUST have `padding_tablet` and `padding_mobile` variants
- Every row layout must have `flex_gap_mobile` for tighter spacing on small screens
- Text alignment: set `align_tablet` and `align_mobile` to `"center"` on split layouts that stack vertically

### 14. No Special Unicode Characters
- **NEVER use** em-dashes (`\u2014`), en-dashes (`\u2013`), curly quotes, or other special Unicode in JSON text
- These render as mojibake (e.g., `\u00e2\u20ac\u201c`) on WordPress
- Use plain hyphens `-`, straight quotes `"`, or HTML entities instead

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

| Section Type | Padding Desktop | Padding Mobile |
|-------------|----------------|----------------|
| Hero | 120px top/bottom, 24px sides | 80px top/bottom, 16px sides |
| Standard | 80px top/bottom, 24px sides | 48px top/bottom, 16px sides |
| Compact/Stats | 48-64px top/bottom | 32-40px top/bottom |
| CTA Banner | 64px top/bottom | 40px top/bottom |

---

## Common Section Patterns

### Hero (dark, split layout)
```
container (full, dark bg, 120px padding)
  └── container (boxed 1200px, row, gap 48px)
      ├── container (55% width, column) → overline + h1 + paragraph + button row
      └── container (40% width) → image
```

### Services Grid (3 columns)
```
container (full, light bg, 80px padding)
  └── container (boxed, column)
      ├── overline heading + h2 + subtitle
      └── container (row, wrap, gap 24px)
          ├── card container (30% width) → icon + h3 + text
          ├── card container (30% width) → icon + h3 + text
          └── card container (30% width) → icon + h3 + text
```

### CTA Banner (gradient)
```
container (full, gradient bg, 64px padding, center aligned)
  └── container (boxed narrow 800px, column, center)
      ├── h2 (white)
      ├── paragraph (white muted)
      └── container (row, center) → button + button
```

### Testimonials (3 cards)
```
container (full, subtle bg, 80px padding)
  └── container (boxed, column)
      ├── section heading group
      └── container (row, wrap, gap 24px)
          ├── card (30%) → star-rating + quote text + name + role
          ├── card (30%) → star-rating + quote text + name + role
          └── card (30%) → star-rating + quote text + name + role
```

### Footer (4 columns, dark)
```
container (full, dark bg, 64px padding)
  └── container (boxed, column)
      ├── container (row, wrap, gap 32px)
      │   ├── container (22%) → logo/about text
      │   ├── container (22%) → "Quick Links" heading + icon-list
      │   ├── container (22%) → "Services" heading + icon-list
      │   └── container (22%) → "Contact" heading + icon-list
      └── container (row, border-top) → copyright text
```

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
- [ ] H1/H2 headings have `_tablet` and `_mobile` font sizes
- [ ] Grid items have `width`, `width_tablet`, `width_mobile`
- [ ] All spacing is multiples of 8
- [ ] Colors match the project brief
- [ ] Fonts match the project brief (heading font + body font)
- [ ] Inner containers are boxed at 1200px
- [ ] Sections alternate backgrounds for visual rhythm
- [ ] File is valid JSON (no trailing commas, proper escaping)
- [ ] **All button/link URLs verified** — only point to existing pages or valid anchors
- [ ] **No special Unicode characters** (em-dash, curly quotes) — use plain ASCII
- [ ] **Responsive variants set** — `padding_tablet`, `padding_mobile`, `flex_gap_mobile`, `align_mobile` on all relevant elements
- [ ] **Counter widgets have both typography groups** — `typography_*` for number + `typography_title_*` for title

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
