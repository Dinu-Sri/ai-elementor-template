# Design Foundation

The native-first system uses two layers of design rules:

1. **Universal interface rules** - stable rules that every site should inherit.
2. **Project design direction** - brand-specific choices that make each site unique.

## Universal Interface Rules

These rules are intentionally boring and non-negotiable. They protect quality, editability, and responsive behavior.

### Native Spacing Reset

Every generated Elementor container and widget must explicitly control wrapper margin. Widgets must also reset wrapper padding unless the component intentionally sets it.

Reason: Elementor, the active theme, and global widget spacing can introduce default margins or spacing that make percentage-based flex layouts wrap unexpectedly.

Compiler rule:

- Containers get `_margin`, `_margin_tablet`, and `_margin_mobile` set to zero.
- Widgets get `_margin`, `_margin_tablet`, `_margin_mobile`, `_padding`, `_padding_tablet`, and `_padding_mobile` set to zero.
- Component-level spacing must come from explicit container padding, flex gaps, and widget-native controls.

### Fit-Aware Flex Widths

Never assume `4 * 25%` fits when flex gaps, borders, wrapper margins, and theme defaults are active.

Compiler rule:

- 4-column proof bands use conservative widths around `21%` to leave room for native spacing and browser rounding.
- 3-column cards use `30%` or lower.
- Rows use explicit `flex_gap_*` and `flex_justify_content` values.
- Tablet/mobile widths are always explicit.

### Heading Groups

Section eyebrow, title, and subtitle must be compiled as a single heading-group primitive.

Reason: centering the subtitle but not the heading creates inconsistent section headers.

Compiler rule:

- Centered section groups set `align` and `align_mobile` on eyebrow, title, and body text.
- The wrapper container also sets `align_items` and `flex_align_items` to `center`.

## External Design References

We should not clone any one public design system, but we can use respected systems as neutral references:

- Apple Human Interface Guidelines for hierarchy, restraint, and platform polish.
- Material Design for layout, spacing, elevation, and responsive structure.
- Shopify Polaris for commerce/admin clarity and action hierarchy.
- IBM Carbon for enterprise-grade component consistency and accessibility.
- WCAG for accessibility, contrast, readable structure, and interaction safety.
- shadcn/ui as a modern reference for restrained component composition, not as a visual template.

The universal layer should absorb principles, not aesthetics. The project layer should create the actual visual identity.
