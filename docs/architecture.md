# Native-First Architecture

## Problem

The previous system could push Elementor JSON to WordPress, but it allowed AI to directly produce low-level Elementor data. When the model was uncertain, it often used HTML widgets, inline styles, and custom CSS instead of Elementor-native widgets and controls. That created pages that looked acceptable once but were hard to edit in Elementor later.

The second problem was visual sameness. The system had generic layout recipes, but no strong design-direction layer and no compiler-level enforcement of variety.

## Design Principle

ChatGPT should act as the strategist and designer. The system should act as the strict Elementor builder.

The model is allowed to choose page intent, section order, messaging, imagery direction, and component variants. It is not allowed to improvise raw Elementor internals when a native component can do the job.

## Pipeline

1. **Project Brief**
   Business, audience, goals, pages, content, brand assets, constraints.

2. **Design Direction**
   A project-specific style route: typography, spacing density, section rhythm, image treatment, component geometry, color behavior, and interaction restraint.

3. **Page Blueprint**
   A high-level JSON plan that names sections and native components. This is the only thing AI should generate directly.

4. **Native Component Registry**
   Defines allowed components and maps them to Elementor-native containers/widgets.

5. **Compiler**
   Converts blueprint sections into Elementor JSON. The compiler owns property names, responsive variants, nesting, and defaults.

6. **Validator**
   Fails output that is hard to edit: HTML widgets, inline styles, missing responsive widths, missing `elements`, legacy `section` or `column`, unknown widget types, placeholder links.

7. **WordPress Bridge**
   Pushes compiled JSON to WordPress, exports Elementor-saved JSON back, and exposes site/plugin diagnostics.

8. **Feedback Loop**
   We push, screenshot, inspect, manually edit if needed, export, and update the registry/compiler with exact Elementor properties.

## Architecture Boundary

AI can produce:

- page blueprints
- design directions
- content suggestions
- component selection
- semantic layout intent

AI should not directly produce:

- raw final Elementor JSON
- arbitrary HTML widgets
- large inline CSS blocks
- guessed Elementor property names
- unbounded nested containers

## Multi-Site Boundary

The root is a reusable platform, not a website implementation. Shared compiler, bridge, schema, registry, and workflow behavior belongs at the root. Brand content, URLs, WordPress IDs, approved native payloads, assets, and one-off transforms belong under `sites/<site-slug>/`.

This boundary allows one suite release to support unrelated businesses without leaking one site's design language or deployment assumptions into another.

## Native Editability Score

Every generated page should receive an editability score. A page fails when it relies on hidden code more than Elementor controls.

Initial scoring:

- Starts at 100.
- `html` widget: -30 each.
- inline `style=` inside content: -25 each.
- legacy `section` or `column`: fail.
- missing mobile responsive layout setting: -5 each.
- placeholder internal link: -10 each.
- unknown widget type: -15 each.

Minimum passing score: 90.

## Source-Code Research

Elementor and Elementor Pro source code should be parsed into a local control catalog:

- widget class name
- widget type name
- control names
- responsive controls
- group controls
- selector behavior
- allowed values
- default values

That catalog should become the source of truth for compiler property names. The legacy `CLAUDE.md` remains useful as a field notebook, but the new system should become machine-readable.
