# Trogen Facility Services — Starter Kit

> **Full site backup** of a single-page cleaning service website built with the AI Elementor Template System.

![Trogen Facility Services Homepage](screenshot.png)

## About This Project

| Field | Value |
|-------|-------|
| **Client** | Trogen Facility Services |
| **Industry** | Commercial & Residential Cleaning |
| **Location** | Melbourne, Australia |
| **Site Type** | Single-page lead generation landing page |
| **Live URL** | https://clean.computereach.org |
| **Built** | February 2026 |

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| **Primary** | `#2563EB` | Headings, borders, overlines, stats bar, CTA bar |
| **Dark** | `#0F172A` | Hero bg, footer bg, body text |
| **Accent** | `#25D366` | WhatsApp green — all primary CTA buttons |
| **Light** | `#EFF6FF` | Alternating section backgrounds, card fills |
| **Yellow CTA** | `#FACC15` | Secondary CTAs, pricing buttons |
| **Heading Font** | Figtree (800) | All H1–H6 headings, extra bold |
| **Body Font** | Inter (400) | All paragraph and description text |

## Page Sections (9 total)

1. **Hero** — Dark navy bg, 2-column split, gradient overlay, heading + WhatsApp CTA
2. **Stats Bar** — Blue bg, 4 counters (6+ years, 500+ clients, 100% bond back, 24hr response)
3. **Services Grid** — White bg, 3-column icon cards (Window, Commercial, One-Off, EOL)
4. **End of Lease Pricing** — Light blue bg, 3 pricing cards with checklists + yellow CTAs
5. **Quote Form** — Dark bg, 2-column split with Elementor form (email submission)
6. **Why Choose Us** — White bg, 2-column split with image + icon list
7. **Reviews** — Light bg, 3 testimonial cards with star ratings
8. **FAQ** — White bg, centered accordion/toggle widget
9. **CTA Bar** — Blue bg, centered heading + 2 CTA buttons

## Files

| File | Size | Description |
|------|------|-------------|
| `home.json` | 135 KB | Full 9-section responsive homepage |
| `header.json` | 15 KB | Sticky single-row header (logo, nav, CTAs) |
| `footer.json` | 12 KB | 3-column dark footer with responsive |
| `brief.json` | 9 KB | Complete project brief with all content |
| `page-mapping.json` | 171 B | WordPress template/page IDs |
| `design-tokens.json` | 4 KB | Extracted design tokens (colors, fonts, spacing, components) |
| `screenshot.png` | — | Full-page homepage screenshot |

## How to Use This Starter Kit

### As Reference
Browse the JSON files to understand layout patterns, responsive properties, and Elementor widget configurations used in a real production site.

### As a Starting Point
1. Copy this folder to a new project: `projects/<new-project>/pages/`
2. Update colors, fonts, and content in the JSON files
3. Update `brief.json` with new client info
4. Push to WordPress with `sync.ps1`

### Key Patterns to Study
- **Responsive grid columns**: `width` + `width_tablet` + `width_mobile` on every column
- **Section padding**: `padding` + `padding_tablet` + `padding_mobile` on every section
- **Typography scale**: Font sizes with `_tablet` and `_mobile` variants
- **WhatsApp-first CTAs**: Green buttons with `wa.me` links throughout
- **Form widget**: Email submission with `submit_actions: ["email"]`

## WordPress IDs (for reference only)

| Element | Template/Page ID |
|---------|-----------------|
| Header | 39 |
| Footer | 47 |
| Home Page | 13 |
