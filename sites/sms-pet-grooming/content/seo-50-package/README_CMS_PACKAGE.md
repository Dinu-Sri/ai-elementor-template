# SMS Pet Grooming — CMS-Ready 50-Article Package

## Package Contents

- `articles/` — 50 individual CMS-ready Markdown files.
- `SMS_Pet_Grooming_All_50_CMS_Ready.md` — combined reference copy.
- `cms_manifest.csv` — import and status-control table.
- `cms_manifest.json` — machine-readable manifest.
- `internal_link_map.csv` — planned parent and supporting links.
- `visual_production_manifest.csv` — 150 image-production tasks.
- `AI_CMS_PUBLISHING_PROMPT.md` — prompt for the CMS publishing agent.
- `QUALITY_REVIEW_REPORT.md` — audit results and publishing safeguards.

## Recommended CMS Categories

| Category | Slug | Commercial Parent |
|---|---|---|
| Cat Grooming | `cat-grooming` | `https://smspetgrooming.ae/cat-grooming/` |
| Dog Grooming | `dog-grooming` | `https://smspetgrooming.ae/dog-grooming/` |
| Bird Grooming | `bird-grooming` | `https://smspetgrooming.ae/bird-grooming/` |
| Rabbit Grooming | `rabbit-grooming` | `https://smspetgrooming.ae/rabbit-grooming/` |

## Important Status

All files are structurally CMS-ready. They are intentionally marked
`cms_ready_pending_expert_review`.

The publishing agent must keep them as drafts until the expert-review and
commercial-verification flags in each file have been cleared.

## Internal-Linking Method

Each article contains:

- a contextual link to one locked commercial parent;
- supporting links to relevant articles in the same topical network;
- no unresolved relative article links;
- a `Related grooming guides` section only where planned links were missing from the original draft.

## Visual Production

Each article contains three visual tasks:

1. one 16:9 featured image;
2. one 4:3 early explanatory visual;
3. one 4:3 mid-article decision, schedule or comparison visual.

Visual instructions appear both in YAML and as `CMS_VISUAL` comments at the
intended placement point.
