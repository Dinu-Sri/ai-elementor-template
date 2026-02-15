# AI Elementor Template System

> **v1.2.0** — Build any WordPress/Elementor website using AI. The system gets smarter with every site you build.

Build WordPress/Elementor websites using AI. Generate pages as JSON, push to WordPress via REST API, review, refine, repeat. Every bug fix, layout pattern, and widget discovery is captured in the knowledge base (`CLAUDE.md`) so the next project starts where the last one left off.

```
 You Describe ──→ AI Generates JSON ──→ Push to WordPress ──→ Review in Browser
      ↑                                                              │
      └──────────────────── Feedback ────────────────────────────────┘
```

**Built with this system so far:** Recruitment sites, landing pages — with ecommerce, booking, SaaS, and portfolio sites on the roadmap. Each project teaches the AI new patterns that benefit all future projects.

---

## Features

- **Container-based Flexbox layouts** — Modern Elementor containers (no legacy sections/columns)
- **Iconify icon support** — 100,000+ icons from Tabler, Material, Phosphor, and more via custom widget
- **Header & Footer templates** — Full Theme Builder support with proper create/delete/re-create workflow
- **Responsive by default** — Desktop-first with tablet and mobile breakpoints on all elements
- **Design system driven** — 8pt grid spacing, typography scale, color palette from project brief
- **Diagnostics & logging** — Built-in error logging, system diagnostics, and dry-run tests
- **Animation safety** — Smart rules for which elements can be animated without rendering issues
- **Self-improving AI** — Every session discovers and records new Elementor property names, layout patterns, and fixes

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
│   ├── workflow-guide.md        ← Full workflow documentation
│   └── ai-prompt-templates.md   ← Ready-to-use prompts for AI
├── plugin/
│   └── ai-elementor-sync/       ← WordPress REST API plugin (v1.2.0)
│       ├── ai-elementor-sync.php    ← Core plugin (pages, templates, diagnostics)
│       ├── iconify-elementor-widget.php ← Custom Iconify icon widget
│       └── iconify-support.php      ← Iconify JS loader for frontend
├── templates/
│   ├── sample-landing-page.json ← Reference example (8 sections)
│   ├── project-brief-template.json ← Template for new project briefs
│   └── design-system-page.json  ← Visual design system review page
└── projects/                    ← Client projects (gitignored)
    └── <project-name>/
        ├── brief.json           ← Business info, branding, content
        ├── page-mapping.json    ← Maps page names to WordPress post IDs
        ├── design-system-page.json
        └── pages/*.json         ← Generated page templates
```

## Workflow

1. **Init project** → `init-project.ps1` scaffolds folder with brief + design system
2. **Fill brief** → Define pages, content, branding in `brief.json`
3. **Push design system** → Client reviews colors, fonts, buttons, cards
4. **Build pages** → AI generates one page at a time from the brief
5. **Push & review** → `sync.ps1` pushes to WordPress, review in browser
6. **Refine** → Tell AI what to change, re-push
7. **Sync learnings** → Push improvements back to this repo (see below)
8. **Repeat** → Until every page is perfect

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
| **E-commerce sites** | Product grids, pricing cards, cart flows, trust badges |
| **Booking sites** | Calendar layouts, availability forms, confirmation flows |
| **Portfolio sites** | Gallery grids, project showcases, filterable layouts |
| **SaaS/Tool sites** | Feature comparisons, pricing tables, onboarding flows |
| **Static/Corporate sites** | About sections, team grids, service breakdowns |

Every project contributes to `CLAUDE.md` — the shared brain. After 10, 20, 50 websites, the AI will know every Elementor property name, every responsive breakpoint trick, every layout pattern that works.

---

## Requirements

- WordPress 6.x with Elementor Pro
- PowerShell 5.1+ (Windows) or PowerShell 7+ (Mac/Linux)
- VS Code with GitHub Copilot (Claude)
- PHP 8.0+ on the WordPress server

## How AI Self-Improvement Works

`CLAUDE.md` is a living knowledge base. Every AI session that discovers a bug, a better pattern, or a new widget setting updates this file. The next AI thread reads the updated version and inherits all previous learnings.

The knowledge base currently includes:
- **14+ strict rules** — Container-only layouts, responsive typography, 8pt grid, animation safety, interlinking
- **15+ known issues & fixes** — With root causes and solutions
- **20+ Elementor property name mappings** — Correcting common guesses vs actual property names
- **6+ common section patterns** — Hero, services grid, CTA, testimonials, footer, and more
- **Widget examples** — Heading, text, button, image, icon, counter, icon-list, star-rating, divider, spacer, Iconify

See the "Self-Improvement Rule" section in `CLAUDE.md` for details.

## Security

- API keys are stored in WordPress options table (hashed)
- Always use HTTPS for remote sites
- `config/sites.json` is committed with **placeholder values only** — never commit real credentials
- `projects/` folder is gitignored (contains client-specific data)
- Plugin logs are protected with `.htaccess` (Deny from all)
- Regenerate API key from Settings → AI Elementor Sync if compromised

## Changelog

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
