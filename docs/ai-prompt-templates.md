# AI Prompt Templates for Elementor Page Generation

> Copy and paste these prompts into a new GitHub Copilot chat (Claude Opus 4.6) in VS Code.
> Replace `[PROJECT]` with your actual project folder name.

---

## Prompt 1: Session Kickoff (paste this FIRST in every new thread)

```
@workspace Read CLAUDE.md first — it explains the entire Elementor template system, JSON structure, widget examples, and all the rules.

Then read these project files:
1. projects/[PROJECT]/brief.json — Client requirements, branding, content, page list
2. docs/design-system.json — Full design system rules

Confirm you understand the system and the project before we proceed.
```

> That's it. `CLAUDE.md` in the project root contains everything a new AI thread needs — JSON structure, widget examples, container hierarchy, spacing rules, typography scale, animation rules, push commands, and the quality checklist. No need to repeat it all in the prompt.

---

## Prompt 2: Design System Page (use if you need to regenerate/modify the design system)

```
@workspace Read projects/[PROJECT]/brief.json for the branding details.

Generate a DESIGN SYSTEM review page as projects/[PROJECT]/design-system-page.json.

The page should visually display:
1. Header section — "Design System" title with project name subtitle
2. Color Palette — 5 color swatches (primary, secondary, accent, dark, light) with hex labels
3. Typography Scale — Show H1 through H6, body text, and small/caption using the project fonts and sizes from the design system
4. Buttons & CTAs — Primary filled, secondary filled, outline/ghost, small-pill; show on both light and dark backgrounds
5. Card Styles — Service card (icon+title+text), testimonial card (quote+name+role), image card with overlay
6. Section Patterns — Document all layout variations: full-width hero, split 60/40, 3-column grid, 4-column grid, centered content, alternating rows
7. Photo & Image Treatment — Rounded corners, featured with shadow, circle crop for avatars
8. Spacing System — Visual representation of the 8pt grid values (8, 16, 24, 32, 48, 64, 80, 120)

Use the colors and fonts from the brief. Container-based layout only.
```

---

## Prompt 3: Build a Specific Page

```
@workspace Build the [PAGE NAME] page for the [PROJECT] project.

Read these files for context:
- projects/[PROJECT]/brief.json (content and branding)
- docs/design-system.json (technical rules)
- projects/[PROJECT]/design-system-page.json (approved visual styles)

Save the output as: projects/[PROJECT]/pages/[page-slug].json

SECTIONS NEEDED:
1. [Section 1 — description]
2. [Section 2 — description]
3. [Section 3 — description]
4. [Section 4 — description]
5. [Section 5 — description]
6. CTA banner
7. Footer

CONTENT TO USE:
- [Specific content details, or "use content from brief.json"]
- [Image URLs if available, or "use placeholder images from picsum.photos"]

DESIGN NOTES:
- [Any specific design preferences for this page]
- [Reference existing pages for consistency: "Match the hero style from home.json"]
```

---

## Prompt 4: Full Site Build (all pages in sequence)

```
@workspace I want to build all pages for the [PROJECT] project.

Read projects/[PROJECT]/brief.json — it has the full page list under site_structure.pages.
Read docs/design-system.json and the approved design system page.

Build each page listed in the brief, one at a time, starting with the highest priority page.
Save each as projects/[PROJECT]/pages/[slug].json

For each page:
- Follow the sections defined in the brief
- Use content from the brief (services, testimonials, team, stats, etc.)
- Maintain visual consistency across all pages
- Shared elements (header, footer, CTA) should be identical
- Use placeholder images from https://picsum.photos/[width]/[height]

Start with page 1. After each page, I'll push it, review, and tell you to proceed or make changes.
```

---

## Prompt 5: Revisions / Fixes

```
@workspace Update projects/[PROJECT]/pages/[page].json with these changes:

1. [Change 1 — be specific about section and what to change]
2. [Change 2]
3. [Change 3]

Do NOT regenerate the entire file. Make targeted edits only.
Keep all other sections exactly as they are.
```

---

## Prompt 6: Add a New Section to an Existing Page

```
@workspace Add a new section to projects/[PROJECT]/pages/[page].json.

Insert AFTER section [N] (the [name] section):

NEW SECTION: [Name]
- Layout: [full-width / split / grid]
- Background: [color or gradient]
- Content: [describe what goes in it]
- Style: Match the design system from the brief

Keep everything else unchanged.
```

---

## Prompt 7: Cross-Page Consistency Check

```
@workspace Compare these page templates for visual consistency:
- projects/[PROJECT]/pages/home.json
- projects/[PROJECT]/pages/about.json
- projects/[PROJECT]/pages/services.json

Check for:
1. Same heading font sizes across all pages
2. Same section padding values
3. Same button styles (colors, padding, border-radius)
4. Same color usage (primary, secondary, accent)
5. Footer and CTA sections are identical
6. Consistent spacing between sections

Report any inconsistencies and fix them.
```

---

## Tips for Effective Prompting

### Be Specific About Layout
❌ "Make a nice hero section"  
✅ "Hero section: dark background (#1A1A2E), full-width, split layout 55% text left / 40% image right, H1 white, subtitle gray, two buttons side by side"

### Reference Existing Work
❌ "Make it look like the other pages"  
✅ "Match the hero section style from home.json — same padding (120px top/bottom), same overlay opacity, same button arrangement"

### Provide Content
❌ "Add some testimonials"  
✅ "Three testimonials from brief.json, each with star rating, quote text, person name, and job title. Use the testimonial card component from the design system."

### Request Changes Surgically  
❌ "The page doesn't look right, fix it"  
✅ "In the services section: increase card gap from 24px to 32px, add 16px padding inside each card, make card titles 20px instead of 18px"
