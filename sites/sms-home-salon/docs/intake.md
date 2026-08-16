# SMS Home Salon Intake Notes

Date: 2026-08-01

## Live Site

- Production domain: https://homesalon.ae/
- Native Elementor bridge REST base: https://homesalon.ae/wp-json/native-elementor/v1
- Bridge authentication: use `X-API-Key` from the user-provided secret for this project. Do not write the key into tracked files, docs, examples, reports, or command output.

## Working Rules

- Treat the live site as the source of truth for published pages, menus, templates, and current URL structure.
- Use the Native Elementor Bridge for read-only intake first: `/status`, `/menus`, `/pages`, and `/site-snapshot`.
- Before any future write to WordPress, capture a fresh snapshot and confirm the target WordPress IDs.
- Keep SMS Home Salon-specific planning, sitemap notes, and source material under `sites/sms-home-salon/`.
- Do not deploy from old `legacy/v2.2.0` files unless the user explicitly asks for that legacy workflow.

## Current Goal

Create a detailed Markdown sitemap based on published live pages and the current navigation/menu structure. The sitemap should be suitable for a follow-up agent to build a visual sitemap and for planning new service/category pages.
