# JetWooBuilder Bridge API

Native Elementor Bridge `0.8.0` adds API-key-authenticated operations for JetWooBuilder templates and category-specific single-product routing.

## Templates

- `GET /jetwoo/templates` lists JetWooBuilder templates. Add `include_data=1` to include Elementor data.
- `GET /jetwoo/templates/{id}` exports one template and its Elementor data.
- `POST /jetwoo/templates` creates a template. Pass `source_id` to clone an existing JetWooBuilder template before overriding `elementor_data`.
- `PUT /jetwoo/templates/{id}` updates the title, status, template type, page settings, or Elementor data.

New templates default to `draft`. A clone copies the source template's Elementor and JetWooBuilder metadata but excludes editor locks.

## Single Rules

- `GET /jetwoo/single-rules` returns the configured category routes.
- `PUT /jetwoo/single-rules` replaces the route list with objects containing `category_id` and `template_id`.

The bridge validates that each category is a WooCommerce `product_cat` term and each template is a JetWooBuilder post. On a matching product page, the rule supplies the category template through JetWooBuilder's single-template filter. Products with no matching rule continue to use JetWooBuilder's configured default template.

Example:

```json
{
  "rules": [
    {
      "category_id": 197,
      "template_id": 7001
    }
  ]
}
```
