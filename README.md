# AI Elementor Template System

Build WordPress/Elementor websites using AI. Generate pages as JSON → push to WordPress via REST API → review → refine → repeat.

```
 You Describe ──→ AI Generates JSON ──→ Push to WordPress ──→ Review in Browser
      ↑                                                              │
      └──────────────────── Feedback ────────────────────────────────┘
```

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
```

---

## Project Structure

```
├── CLAUDE.md                    ← AI reads this first (system knowledge base)
├── sync.ps1                     ← CLI for pushing templates to WordPress
├── init-project.ps1             ← Scaffolds new client projects
├── config/
│   └── sites.json               ← WordPress site connections
├── docs/
│   ├── design-system.json       ← Design rules (spacing, typography, colors)
│   ├── workflow-guide.md        ← Full workflow documentation
│   └── ai-prompt-templates.md   ← Ready-to-use prompts for AI
├── plugin/
│   └── ai-elementor-sync/       ← WordPress REST API plugin
├── templates/
│   ├── sample-landing-page.json ← Reference example (8 sections)
│   ├── project-brief-template.json ← Template for new project briefs
│   └── design-system-page.json  ← Visual design system review page
└── projects/                    ← Client projects (gitignored)
    └── <project-name>/
        ├── brief.json
        ├── design-system-page.json
        └── pages/*.json
```

## Workflow

1. **Init project** → `init-project.ps1` scaffolds folder with brief + design system
2. **Fill brief** → Define pages, content, branding in `brief.json`
3. **Push design system** → Client reviews colors, fonts, buttons, cards
4. **Build pages** → AI generates one page at a time from the brief
5. **Push & review** → `sync.ps1` pushes to WordPress, review in browser
6. **Refine** → Tell AI what to change, re-push
7. **Repeat** → Until every page is perfect

## Commands

| Command | Description |
|---------|-------------|
| `.\sync.ps1 -Site X -Action status` | Test connection |
| `.\sync.ps1 -Site X -Action create -TemplateFile path -Title "Name"` | Create page |
| `.\sync.ps1 -Site X -Action update -TemplateFile path -PageId 42` | Update page |
| `.\sync.ps1 -Site X -Action list` | List all pages |
| `.\sync.ps1 -Site X -Action get -PageId 42` | Get page details |
| `.\sync.ps1 -Site X -Action delete -PageId 42` | Delete page |

## Requirements

- WordPress 6.x with Elementor Pro
- PowerShell 5.1+ (Windows) or PowerShell 7+ (Mac/Linux)
- VS Code with GitHub Copilot (Claude)

## How AI Self-Improvement Works

`CLAUDE.md` is a living knowledge base. Every AI session that discovers a bug, a better pattern, or a new widget setting updates this file. The next AI thread reads the updated version and inherits all previous learnings. See the "Self-Improvement Rule" section in `CLAUDE.md`.

## Security

- API keys are stored in WordPress options table
- Always use HTTPS for remote sites
- `config/sites.json` is committed with **placeholder values only** — never commit real credentials
- `projects/` folder is gitignored (contains client-specific data)
- Regenerate API key from Settings → AI Elementor Sync if compromised
