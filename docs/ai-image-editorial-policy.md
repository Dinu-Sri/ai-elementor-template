# AI-Assisted Image Editorial Policy

## Google-aligned approach

Google Search does not treat responsible AI assistance as an automatic ranking violation. The important requirements are useful, accurate, people-first content; added first-hand value; and no attempt to manipulate rankings through low-value scaled publishing.

Google recommends giving readers context when they would reasonably ask how content was created. For images, it supports IPTC Digital Source Type metadata and recognizes `trainedAlgorithmicMedia` for model-generated visuals. ALT text should remain an accurate, contextual description of the image and must not be keyword-stuffed.

Sources:

- https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/essentials/spam-policies
- https://developers.google.com/search/docs/appearance/google-images
- https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata

## Publishing rules

- Do not call an AI-generated visual an original photograph, actual appointment, customer image, case study, evidence, result, or before-and-after.
- Use descriptive ALT text for accessibility and image understanding. Put provenance in the caption, single-post template disclosure, and embedded metadata.
- Caption photorealistic generated scenes as `AI-assisted illustration`, not `photo`.
- Embed IPTC/XMP Digital Source Type `trainedAlgorithmicMedia` in every generated asset before upload.
- Use consented real service photography where an article makes experience, result, handling, facility, customer, or before-and-after claims.
- Do not synthetically recreate a real customer, pet, review, injury, medical condition, or grooming outcome.
- Keep every article expert-reviewed and add service-specific facts, current prices, actual procedures, and editorial sources before publication.

## Standard single-post template note

The single-post Elementor template owns this disclosure and displays it once on every article. Do not add another copy to individual article bodies.

> **Visual and service note:** Some supporting visuals in this article may be AI-assisted illustrations created to explain the subject. They do not document a specific customer, appointment, event, or guaranteed result. Where real evidence matters, we aim to use consented photographs and records from actual work.
>
> For current services, suitability, or evidence from actual work, speak with our team.

Adapt the wording and button destination inside each site's approved single-post template. The template owns one disclosure; article bodies must not duplicate it.

## Evidence-required asset gate

Visual prompts containing terms such as `our session`, `owner permission`, `before and after`, `actual result`, `case`, `customer`, `facility`, or `service evidence` must not be sent to an image generator. They require a consented real asset or remain an explicit CMS placeholder until one is supplied.
