# Threading Service Revision - 2026-08-27

## Production Scope

- Level-1 page: `67`, `/threading/`
- Existing subservice pages reconciled: 8
- New pages required: 0
- Approved packages: 9
- Display contract: price only; no Duration, Package, From, or From AED fields
- Main Menu: `12`, preserved at 89 items

## Approved Packages

| Service | Package | Price |
| --- | --- | ---: |
| Chin Threading | Chin Threading | AED 24 |
| Upper Lip Threading | Upper Lip Threading | AED 24 |
| Lower Lip Threading | Lower Lip Threading | AED 24 |
| Neck Threading | Neck Threading | AED 30 |
| Forehead Threading | Forehead Threading | AED 30 |
| Side Locks Threading | Side Locks Threading | AED 30 |
| Eyebrows Threading | Eyebrows Threading | AED 30 |
| Full Face Threading | Full Face Without Eyebrows | AED 96 |
| Full Face Threading | Full Face With Eyebrows | AED 120 |

## Verification

- Captured a fresh production snapshot before writing.
- Confirmed all page IDs, routes, parents, titles, and published states.
- Validated 9 hub cards and 9 matching detail-page cards before and after save.
- Ran menu dry-run and replacement checks without changing the item count.
- Cleared WordPress and Elementor caches.
- Confirmed all 9 public URLs returned HTTP 200 with the approved prices.
- Confirmed the mobile hub and Full Face page contain no forbidden metric headings or horizontal overflow.
