# Implementation Roadmap

## Current Platform

- Native Elementor container and widget compiler.
- Responsive layout solver and editability lint scoring.
- Full-site manifest workflow for pages, menus, headers, footers, Theme Builder templates, snapshots, export-back lint, cache refresh, and public smoke checks.
- WordPress bridge v0.6.0 for pages, templates, posts, categories, authors, media, Rank Math fields, FAQ schema, and safe updates.
- Multi-site repository boundary with isolated website assets, content, manifests, baselines, and one-off tooling.
- CMS article package audit, Markdown publishing, AI-image metadata, page SEO application, media ALT updates, and site validation.
- Production and demo reference implementations under `sites/`.

## Next Platform Work

- Build an Elementor and Elementor Pro control catalog from installed source to validate compiler property names automatically.
- Add a formal new-site scaffolder that creates the standard `sites/<site-slug>/` layout and manifest skeleton.
- Generalize archive, single-post, and loop-template blueprints from approved native exports.
- Implement popup deployment only after capturing and testing the complete Elementor Pro popup metadata contract.
- Add automated browser screenshot comparisons for desktop, tablet, and mobile approval baselines.
- Expand the native component registry without weakening the no-HTML-widget and no-inline-style rules.
- Add pluggable CMS adapters while keeping the current WordPress bridge contract stable.

## Release Standard

A platform feature moves from planned to implemented only when it has a reusable contract, a reference-site fixture, local validation, WordPress export-back verification, public rendering checks, and updated documentation.
