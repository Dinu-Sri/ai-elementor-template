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
```

You do NOT push pages yourself. Generate the JSON file → tell the user the sync command to run.

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
        "typography_font_weight": "700"
    },
    "elements": []
}
```

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
        "star_unmarked_color": "#E5E7EB"
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

---

## Known Issues & Fixes

> Add entries here when bugs are discovered and fixed. Format: `[DATE] Issue → Fix`

- `[2026-02-15]` WordPress `wp_unslash()` strips backslashes from JSON in `update_post_meta` → **Fix:** Plugin wraps all meta saves with `wp_slash(wp_json_encode($data))`
- `[2026-02-15]` Legacy `section`/`column` elTypes don't render in modern Elementor → **Fix:** Use `container` with flexbox for everything

---

## Changelog

> This section tracks when CLAUDE.md itself was updated with new knowledge.

| Date | What Changed | Why |
|------|-------------|-----|
| 2026-02-15 | Initial creation | Full system documentation |
| 2026-02-15 | Added self-improvement rule | AI threads auto-update this file with new learnings |
| 2026-02-15 | Cleaned for GitHub | Removed secrets, added .gitignore, GitHub workflow section |

---

## GitHub Workflow

This project is maintained on GitHub. The repo is the **single source of truth** for the system.

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

### Keeping Up to Date

```powershell
# Pull latest system improvements
git pull origin main

# Your projects/ folder is unaffected (gitignored)
```

### What Gets Committed (tracked)
- `CLAUDE.md` — AI knowledge base (updated by AI)
- `sync.ps1`, `init-project.ps1` — CLI tools
- `plugin/` — WordPress plugin source
- `templates/` — Reference templates and project brief template
- `docs/` — Design system, workflow guide, prompt templates
- `config/sites.json` — With placeholder values only

### What Stays Local (gitignored)
- `projects/` — Client-specific data, briefs, generated pages
- `config/page-mapping.json` — Runtime page ID mapping
- Real API keys — Never committed
