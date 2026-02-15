# AI-Powered Elementor Website Development Workflow

## Overview

This toolkit lets you build complete WordPress/Elementor websites using AI (Claude Opus 4.6 in VS Code) with an iterative **Brief → Design System → Review → Build Pages → Push → Refine** workflow.

---

## Prerequisites

1. **WordPress site** with Elementor Pro installed
2. **AI Elementor Sync plugin** installed and activated (see `plugin/` folder)
3. **VS Code** with GitHub Copilot (Claude Opus 4.6)
4. **PowerShell 5.1+** on Windows

---

## The Complete Workflow

### Phase 1: Project Setup (5 minutes)

#### Step 1: Install the Plugin on WordPress

1. Zip the `plugin/ai-elementor-sync/` folder
2. WordPress Admin → Plugins → Add New → Upload → activate
3. Go to Settings → AI Elementor Sync → copy the API Key

#### Step 2: Initialize the Project

```powershell
.\init-project.ps1 -Name "client-name" `
    -Domain "https://clientsite.com" `
    -ApiKey "paste-api-key" `
    -Business "Client Business Name" `
    -Industry "Restaurant" `
    -PrimaryColor "#E63946" `
    -SecondaryColor "#457B9D" `
    -HeadingFont "Playfair Display" `
    -BodyFont "Source Sans Pro"
```

This creates:
```
projects/client-name/
  ├── brief.json              ← Project requirements (edit this!)
  ├── design-system-page.json ← Visual style guide page
  ├── page-mapping.json       ← Tracks WordPress page IDs
  └── pages/                  ← Generated page templates go here
```

#### Step 3: Fill Out the Project Brief

Open `projects/client-name/brief.json` and fill in:

| Section | What to Define |
|---------|---------------|
| `project` | Business name, domain, tagline, description, industry, target audience, tone |
| `branding` | Colors (primary, secondary, accent, dark, light), fonts, logo URL |
| `site_structure` | List of pages, their slugs, sections each page needs |
| `content` | Services, testimonials, team members, stats, contact info |
| `preferences` | Animation style, layout density, button shape, image treatment |

---

### Phase 2: Design System Review (15-30 minutes)

#### Step 4: Push the Design System Page

```powershell
.\sync.ps1 -Site "client-name" -Action create `
    -TemplateFile ".\projects\client-name\design-system-page.json" `
    -Title "Design System"
```

#### Step 5: Review with Client

Send the URL to the client (or review yourself). The design system page shows:

1. **Color Palette** - All 5 colors as visual swatches
2. **Typography Scale** - H1 through body text with actual fonts
3. **Button Styles** - Primary, secondary, outline, on dark backgrounds
4. **Card Styles** - Service card, testimonial card, image card
5. **Section Patterns** - Documentation of layout patterns
6. **Photo Treatment** - Rounded, shadowed, circle crop options
7. **Spacing System** - The 8pt grid values used everywhere

#### Step 6: Iterate Until Approved

If changes are needed:
1. Tell the AI: *"Change the primary color to #E63946 and heading font to Playfair Display"*
2. AI updates the design system page JSON
3. Re-push: `.\sync.ps1 -Site "client-name" -Action update -TemplateFile "..." -PageId XX`
4. Refresh and review again

---

### Phase 3: Build Pages (The Main Event)

#### Step 7: Start a New Chat Thread

Open a **new** GitHub Copilot chat in VS Code (Claude Opus 4.6) and paste this prompt:

```
@workspace I need to build Elementor pages for the project in projects/client-name/brief.json.

Read these files first:
1. projects/client-name/brief.json - Project requirements and content
2. docs/design-system.json - Technical design system rules
3. templates/design-system-page.json - Reference for visual styles

Then build the HOME PAGE as projects/client-name/pages/home.json following:
- Container-based layout (NO section/column legacy elements)
- All styling through Elementor native controls (NO inline style="" in HTML)
- 8pt grid spacing from the design system
- Typography scale from the design system
- Colors from the project brief
- Responsive breakpoints (desktop, tablet, mobile)

The page should include these sections: [list from brief]
```

#### Step 8: Push Each Page

```powershell
# Create new page
.\sync.ps1 -Site "client-name" -Action create `
    -TemplateFile ".\projects\client-name\pages\home.json" `
    -Title "Home"

# Note the Page ID from output, then for updates:
.\sync.ps1 -Site "client-name" -Action update `
    -TemplateFile ".\projects\client-name\pages\home.json" `
    -PageId 123
```

#### Step 9: Review and Refine

1. Open the page URL in browser
2. Note what needs changing
3. Tell the AI: *"The services section cards are too close together, increase the gap to 32px. Also the hero heading should be bigger on mobile."*
4. AI updates the JSON
5. Re-push with update action
6. Repeat until perfect

#### Step 10: Build Remaining Pages

Repeat Steps 7-9 for each page in the brief:
- About Us → `projects/client-name/pages/about.json`
- Services → `projects/client-name/pages/services.json`
- Contact → `projects/client-name/pages/contact.json`
- Blog (layout) → `projects/client-name/pages/blog.json`

---

## AI Prompting Tips

### Starting a New Page

```
@workspace Build the ABOUT US page for the client-name project.

Read projects/client-name/brief.json for content and branding.
Use the same design system as the home page.
Save as projects/client-name/pages/about.json.

Sections needed:
1. Page hero (dark bg, centered H1 "About Us", subtitle)
2. Our story (split layout - image left, text right)
3. Mission & Vision (2-column cards)
4. Team grid (3 columns, circle photos, name + role)
5. Stats bar (years, clients, projects, satisfaction)
6. CTA banner (gradient, "Work With Us")
7. Footer
```

### Requesting Changes

```
@workspace Update projects/client-name/pages/about.json:
- Make the team photos larger (250px instead of 200px)
- Add a subtle box shadow to the mission/vision cards  
- The hero should have a background image instead of solid color
- Reduce section padding from 80px to 64px on all sections
```

### Maintaining Consistency

```
@workspace The home page CTA section looks different from the about page.
Make the about page CTA match the home page exactly - same gradient,
same button styles, same padding.
```

---

## Project Folder Structure

```
Elementor Template/
├── config/
│   └── sites.json              ← All site connections
├── docs/
│   ├── design-system.json      ← Technical design rules (AI reference)
│   └── elementor-developer-docs-map.json
├── plugin/
│   └── ai-elementor-sync/      ← WordPress plugin (zip and upload)
├── projects/
│   └── client-name/            ← One folder per project
│       ├── brief.json          ← Requirements & content
│       ├── design-system-page.json ← Visual style guide (push first)
│       ├── page-mapping.json   ← Page name → WP post ID
│       └── pages/
│           ├── home.json
│           ├── about.json
│           ├── services.json
│           └── contact.json
├── templates/
│   ├── project-brief-template.json  ← Template for new briefs
│   ├── design-system-page.json      ← Master design system template
│   └── sample-landing-page.json     ← Example reference
├── init-project.ps1            ← Initialize new projects
├── sync.ps1                    ← Push/pull templates
└── README.md
```

---

## Quick Command Reference

```powershell
# Initialize a new project
.\init-project.ps1 -Name "project" -Domain "https://site.com" -ApiKey "key"

# Create a new page on WordPress
.\sync.ps1 -Site "project" -Action create -TemplateFile ".\projects\project\pages\home.json" -Title "Home"

# Update an existing page
.\sync.ps1 -Site "project" -Action update -TemplateFile ".\projects\project\pages\home.json" -PageId 123

# Check page status
.\sync.ps1 -Site "project" -Action get -PageId 123

# List all pages
.\sync.ps1 -Site "project" -Action list

# Check site connection
.\sync.ps1 -Site "project" -Action status
```

---

## Critical Rules for AI Template Generation

1. **Container only** — Never use `section` or `column` elType. Always `container` with flexbox.
2. **No inline styles** — Never use `style="..."` in HTML content. Use Elementor controls (`title_color`, `typography_*`, etc.)
3. **8pt grid** — All padding, margin, gap values must be multiples of 8 (8, 16, 24, 32, 48, 64, 80, 120)
4. **Boxed inner containers** — Outer container = full width, inner = boxed at 1200px
5. **Responsive widths** — Set `width`, `width_tablet`, `width_mobile` on all grid items
6. **Type scale** — H1: 52px, H2: 36px, H3: 28px, H4: 20px, Label: 14px, Body: 16px
7. **Empty elements array** — Every widget must have `"elements": []`
8. **Font consistency** — Heading font for all headings, body font for all paragraphs
