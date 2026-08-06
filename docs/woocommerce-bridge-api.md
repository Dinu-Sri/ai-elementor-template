# WooCommerce Bridge API

Native Elementor Bridge `0.7.0` adds API-key-authenticated WooCommerce operations under `/wp-json/native-elementor/v1/woocommerce`.

## Safety Defaults

- New products default to `draft`.
- New products require a stable `source_key` so imports can be repeated without creating duplicates.
- Product type changes are rejected instead of being applied implicitly.
- Existing variations are updated by `source_key` or SKU. Variations omitted from a later request are preserved.
- Categories and attachment IDs must already exist; unresolved references fail the request.

## Product Categories

- `GET /woocommerce/categories`
- `POST /woocommerce/categories`

The POST operation creates or updates a category by slug.

```json
{
  "name": "Personalized Gifts",
  "slug": "personalized-gifts",
  "description": "Personalized gifts and keepsakes."
}
```

## Products

- `GET /woocommerce/products`
- `POST /woocommerce/products`
- `GET /woocommerce/products/{id}`
- `PUT /woocommerce/products/{id}`

POST creates or updates by `source_key`, then by SKU when available. Variable products can include their attributes and variations in the same request.

```json
{
  "source_key": "nice-lk:ccc:1",
  "name": "10pcs nail clipper set",
  "type": "variable",
  "status": "draft",
  "categories": ["personalized-gifts"],
  "images": [6574],
  "attributes": [
    {
      "name": "Color",
      "options": ["Gray", "Dark Green", "Pink"],
      "visible": true,
      "variation": true
    }
  ],
  "variations": [
    {
      "source_key": "nice-lk:ccc:row:2",
      "sku": "CCC-0002",
      "regular_price": "",
      "stock_quantity": 55,
      "attributes": {
        "Color": "Gray"
      },
      "image_id": 6574
    }
  ]
}
```

Prices may be empty for draft staging, but products must not be published until pricing, categories, attributes, stock, and images are approved.
