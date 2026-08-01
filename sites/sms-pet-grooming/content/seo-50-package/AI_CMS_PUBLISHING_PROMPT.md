# AI CMS Publishing Prompt — SMS Pet Grooming

You are publishing the supplied Markdown files to the SMS Pet Grooming website.

## Non-Negotiable Rules

1. Process files in `publish_order`.
2. Create or select the exact `category` from YAML:
   - Cat Grooming
   - Dog Grooming
   - Bird Grooming
   - Rabbit Grooming
3. Use the exact `title`, `seo_title`, `meta_description`, `slug`, `canonical_url`, `excerpt`, and `category_slug`.
4. Keep the article as a draft while either of these YAML values is true:
   - `expert_review_required`
   - `commercial_verification_required`
5. Do not rewrite the locked commercial service pages.
6. Preserve every internal link in the article body.
7. Ensure the commercial parent link points to the YAML `commercial_parent_url`.
8. Do not replace a supporting article link with the commercial page or vice versa.
9. Do not add keyword-stuffed anchor text.
10. Preserve the visible FAQ section and implement the recommended `schema_types`.
11. Generate and upload all `visual_assets` from their prompts:
    - save as WebP;
    - use the exact filename;
    - use the exact alt text;
    - place the featured image as the CMS featured image;
    - insert in-article visuals at the `CMS_VISUAL` comments;
    - remove the visual comments after successful insertion.
12. Do not generate visuals showing unsafe restraint, painful dematting, medication, invasive treatment, rabbit bathing, rabbit trancing, DIY nail cutting, bird beak cutting, or bird wing cutting.
13. Do not invent certifications, guarantees, prices, service areas, product ingredients, veterinary claims, review counts or appointment duration.
14. Recheck live prices and package wording where `commercial_verification_required: true`.
15. Preserve all veterinary referral boundaries.
16. Set author to `SMS Pet Grooming Editorial Team`, locale to `en-AE`, robots to `index,follow`, and canonical URL exactly as supplied.
17. Verify:
    - one H1 only;
    - no broken internal links;
    - no self-links;
    - images have alt text;
    - mobile layout is readable;
    - tables are responsive;
    - WhatsApp, phone and lead-form tracking remains functional.

## Publication Workflow

For each Markdown file:

1. Read YAML.
2. Create/update a CMS draft at the exact slug.
3. Assign category and tags.
4. Set SEO metadata and canonical.
5. Upload/generate visuals.
6. Insert article copy without changing meaning.
7. Implement Article + BreadcrumbList schema and any additional listed schema.
8. Run internal-link and responsive-layout QA.
9. Keep as draft until review flags are cleared.
10. Record the final CMS post ID and preview URL in `cms_manifest.csv`.

Do not silently publish a medically sensitive bird, rabbit, cat or dog article without the specified expert review.
