# Blueprint Authoring Guide

AI should create page blueprints instead of raw Elementor JSON.

## Blueprint Shape

```json
{
  "project": "example-site",
  "page": {
    "title": "Home",
    "slug": "home",
    "template": "elementor_header_footer",
    "status": "draft"
  },
  "design": {
    "route": "warm-clinic-modern",
    "colors": {
      "primary": "#256D5A",
      "secondary": "#E8A35A",
      "accent": "#5B8DEF",
      "dark": "#15221F",
      "light": "#F7F3EC"
    },
    "fonts": {
      "heading": "Nunito Sans",
      "body": "Inter"
    }
  },
  "sections": []
}
```

## Allowed Section Components

The first compiler supports:

- `HeroSplit`
- `FeatureGrid`
- `ContentSplit`
- `StatsBand`
- `CtaBand`
- `FaqList`
- `ContactPanel`

More components should be added only after their Elementor-native implementation is known.

## Forbidden Blueprint Behavior

Do not include:

- raw Elementor JSON
- HTML widget payloads
- inline CSS
- section-level custom CSS
- invented widget settings
- arbitrary nested layout structures

## Design Direction Requirement

Every blueprint must choose a `design.route`. This prevents generic output. Routes live in `registry/design-routes.json`.
