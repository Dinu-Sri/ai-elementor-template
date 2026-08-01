# Template Workflows

Header, footer, popup, archive, and single-post templates are not normal pages. They need a separate compiler workflow because they live in the Elementor template library and often require display conditions.

## Header Workflow

Compiler mode: `template:header`.

Needs:

- WordPress pages created first so menu links are real.
- Menu source strategy:
  - create or map a WordPress nav menu through the bridge
  - use Elementor Pro `nav-menu` for responsive desktop/tablet/mobile behavior
- Template type: `header`
- Display condition: `include/general`
- Bridge route: `POST /templates` or `PUT /templates/{id}` with `type: "header"`
- Activation support: bridge v0.6.0 refreshes Elementor Pro Theme Builder condition cache after template save
- Responsive behavior:
  - desktop horizontal nav
  - tablet/mobile native Elementor nav-menu toggle
  - menu items are managed as WordPress nav menu items, not heading widgets

## Footer Workflow

Compiler mode: `template:footer`.

Needs:

- Existing page map for links.
- Footer columns generated through `solveGrid`.
- Template type: `footer`
- Display condition: `include/general`
- Bridge route: `POST /templates` or `PUT /templates/{id}` with `type: "footer"`
- Activation support: bridge v0.6.0 refreshes Elementor Pro Theme Builder condition cache after template save
- Native widgets only: heading, text-editor, icon-list, social-icons, button, image.

## Diagnostics Workflow

Bridge v0.6.0 provides:

- `POST /clear-cache`: clears Elementor generated files, WordPress object cache, and Elementor Pro Theme Builder conditions where available.
- `GET /theme-builder`: returns Elementor Library templates with post status, `_elementor_template_type`, `elementor_library_type` terms, `_elementor_conditions`, and edit URL.

Use this when a generated header/footer is stored correctly but does not appear on public pages.

## Popup Workflow

Planned compiler mode: `template:popup`.

Needs:

- Template type: `popup`
- Popup display/triggers are more complex than headers/footers and may require Elementor Pro popup metadata.
- We should first export a manually created Elementor popup to learn exact meta keys and settings.

## Implementation Order

1. Create a few real draft pages to provide menu targets.
2. Add page-map awareness to the compiler.
3. Build `HeaderSimple` and `FooterMultiColumn` native components.
4. Push them as Elementor library templates.
5. Run `clear-cache` and `theme-builder` diagnostics.
6. Smoke-test public pages for header/footer text.
7. Export templates back and compare stored metadata.
8. Create one manual popup in Elementor, export it, and implement popup metadata support after source comparison.
