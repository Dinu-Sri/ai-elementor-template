# SMS Pet Intake Notes

## Live site snapshot

- Site: `https://smspetgrooming.ae`
- Bridge: `native-elementor/v1`
- Snapshot saved to `build/site-intake/sms-pet-grooming/site-snapshot.json`
- Service pages extracted locally:
  - `build/site-intake/sms-pet-grooming/pages/home.json`
  - `build/site-intake/sms-pet-grooming/pages/dog-grooming.json`
  - `build/site-intake/sms-pet-grooming/pages/cat-grooming.json`
  - `build/site-intake/sms-pet-grooming/pages/bird-grooming.json`
  - `build/site-intake/sms-pet-grooming/pages/rabbit-grooming.json`

## Current design language

- Main active typeface in Elementor content is `Inter`.
- Default kit still contains Elementor defaults and older global tokens, but the live pages are visually driven by:
  - orange primary actions `#FF9807`
  - warm cream surfaces `#FFEACD`
  - black or near-black text `#000000` / `#1F1E1E`
  - service accents including violet `#9A81CE`, blue `#3382EA`, mint `#00D8B4`, green `#00D828`, and coral `#FF474A`
- Header/footer rely on the existing theme-builder templates and one main menu with a service dropdown.

## Current section rhythm

- Homepage:
  - playful mobile-grooming hero
  - three-step process
  - service discovery block
  - trust/benefit icon boxes
  - testimonial section
  - booking form CTA
- Service pages:
  - simple page hero with title and intro
  - repeated package/pricing cards with `Select` CTAs
  - add-on services in the same card language
  - cross-links to the other animal service pages

## Design-system direction

- Keep the current warmth and playful pet-friendly tone.
- Normalize future pages around `Inter` for headings and body copy.
- Reuse one shared service-page structure, then differentiate pages through accent color, imagery, and service-specific copy.
- Treat the review page at `/native-review-sms-pet-design-system/` as the approval checkpoint before redesigning the separate service pages.

## Reference landing-page adaptation

- Reference JSON files were reviewed from `C:\Users\User\Desktop\SMSPet\smspetgrooming_ae\Reference page designs`.
- The repeated reference pattern is:
  - offer-led hero
  - short trust-value row
  - service snapshot columns
  - expectation/included section
  - package pricing cards
  - step-by-step flow
  - guide/media section
  - form shortcode block
- SMS Pet adaptation review page:
  - `/native-review-sms-pet-landing-page/`
  - historical blueprint: `sites/sms-pet-grooming/blueprints/sms-pet-landing-page.blueprint.json`
  - approved live baseline: `sites/sms-pet-grooming/content/elementor/baselines/dog-landing-live-1044.json`
- Current landing-page direction:
  - Dog Grooming-specific page using the live Dog Grooming package data.
  - Includes Basic Grooming small/medium/large pricing, Full Grooming small/medium/large pricing, add-ons, customer feedback shortcode, booking form shortcode, and cross-sell links for Cat, Bird, and Rabbit Grooming.
- Google review image used in the hero:
  - media id `1042`
  - `https://smspetgrooming.ae/wp-content/uploads/2026/07/Google-5-Star-1024x160-1.webp`
