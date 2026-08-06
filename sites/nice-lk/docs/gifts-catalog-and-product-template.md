# Gifts Catalog And Product Template

## Catalog Scope

The CCC import is identified by `_neb_source_key` values beginning with `nice-lk:ccc:product:`. The `assign-gifts-category.js` workflow adds category `Gifts` (`product_cat` ID `197`) to those 88 products while preserving their original Personalized Gifts, Mini Me, or Corporate Gifts category assignments.

Public menu URL: `https://nice.lk/product-category/gifts/`

## Archive

Elementor Pro product archive template `6916` handles Gifts and the three populated imported-product categories. Its card grid uses four, two, and one columns across desktop, tablet, and mobile. Product images use `object-fit: contain`; titles reserve six lines based on the longest imported name; actions remain aligned at the bottom.

The photobook shop/archive template `6567` remains limited to the four album categories.

## Single Products

JetWooBuilder template `246` is the approved photobook baseline. It contains album-only Size, Pages, example-preview, and designer controls and must not be overwritten.

The Gifts candidate is built from that live baseline, then removes the album-only fields. It retains the native WooCommerce gallery, dynamic title, price, short description, and add-to-cart widgets and adds gift-personalization context plus a contact CTA. Bridge `0.8.0` created live JetWooBuilder template `6941` and routes only category `197` to it. The guarded deployment verifies both a Gifts product and a photobook product and restores the prior routing rules on failure.
