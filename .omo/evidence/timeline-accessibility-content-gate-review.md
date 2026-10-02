# Timeline Accessibility and Content Gate Review

- recommendation: REJECT
- user verdict: REVISE

## Original intent

Perform a read-only accessibility/content QA of the `/timeline` route, inspecting `app/pages/timeline.vue` and the supplied desktop/mobile screenshots. Check keyboard access to the back link, heading order, semantic time markup, mobile clipping, contrast, and whether sample timeline content is clearly centralized and editable.

## Desired outcome

The timeline should be keyboard-navigable with a clearly visible focus indicator, have a logical heading hierarchy and machine-readable dates, avoid mobile clipping, meet readable contrast for visible text, and keep sample agenda content in one obvious editable source.

## User outcome review

Most requested behavior passes: the back link is keyboard reachable and navigates to `/`; headings follow H1, H2, then H3 order; all five dates use valid `<time datetime="YYYY-MM-DD">`; the supplied 390x844 screenshot shows no visible horizontal clipping; browser checks at 390px and 320px report `scrollWidth === clientWidth`; and all sample agenda fields are centralized in the single `timelineItems` array. Revision is required because the keyboard focus indicator is effectively invisible against the dark page and two classes of small visible text fall below WCAG AA contrast.

## Blockers

1. violatedCriterion: `keyboard-link-visible-focus`
   - observation: The back link is first in tab order and receives focus, but there is no authored `:focus-visible` style. Chromium renders only a 1px `auto` outline computed as `rgb(16, 16, 16)` around a 15px-high link on the dark teal background, which is not a reliably visible focus indicator.
   - evidencePointer: `app/pages/timeline.vue:6`, `app/pages/timeline.vue:175-177`; live Chromium CDP check at `http://127.0.0.1:3000/timeline` at 390px and 320px.

2. violatedCriterion: `text-contrast-wcag-aa`
   - observation: `.section-count` and `.timeline-footer` use 10px text at `rgba(203,217,212,.5/.48)`. Against `#071c1e`, the `.section-count` composite is approximately `#697b79` at 3.95:1; the footer is slightly lower. Normal-size text requires 4.5:1. The screenshots visibly show these strings as very faint.
   - evidencePointer: `app/pages/timeline.vue:190`, `app/pages/timeline.vue:207`; `/tmp/hsn2026-timeline-desktop.png`; `/tmp/hsn2026-timeline-mobile.png`.

## Requested checks

- Keyboard link: REVISE. Native link semantics, destination, and tab order pass; visible focus fails.
- Heading/order: PASS. One H1, one H2, and five H3 agenda headings occur in logical order.
- Time elements: PASS. Five `<time>` elements expose matching ISO dates from `2026-08-01` through `2026-10-22`.
- Mobile clipping: PASS for supplied evidence. The 390x844 PNG is valid and unclipped horizontally; live checks at 390px and 320px show no horizontal overflow. Content below the viewport is ordinary vertical scrolling.
- Contrast: REVISE. Main text, gold, teal statuses, descriptions, metadata, and locations clear 4.5:1 in the checked base background calculation; the 10px count/footer text does not. Decorative low-contrast header mark is `aria-hidden`.
- Centralized/editable data: PASS. All date, machine date, status, tone, title, description, and location values live together in `timelineItems` at lines 71-117 and drive both count and cards. This is clear for a small sample dataset.

## Programming and anti-slop pass

- No tests are present in the reviewed scope, so there are no excessive, deletion-only, tautological, implementation-mirroring, or removal-only tests.
- No unnecessary parsing, normalization, extraction, defensive branches, broad catches, type suppression, or speculative abstraction appears in the timeline data/render path.
- Keeping this small sample array local to the route is proportionate and more directly editable than introducing a store or content layer.
- `timeline.vue` is below the 250 pure-LOC oversized-module threshold.

## Checked artifact paths

- `/home/isnu/Project/hsn2026/app/pages/timeline.vue`
- `/home/isnu/Project/hsn2026/DESIGN.md`
- `/tmp/hsn2026-timeline-desktop.png` (PNG RGB, 1440x1200, newer than source)
- `/tmp/hsn2026-timeline-mobile.png` (PNG RGB, 390x844, newer than source)
- `http://127.0.0.1:3000/timeline` via headless Chromium at 1440x1200, 390x844, and 320x844
- `/home/isnu/Project/hsn2026/.omo/evidence/hsn2026-visual-qa-pass-a-gate-review.md` (inspected; concerns the landing route, not this timeline review)
- `/home/isnu/Project/hsn2026/.omo/evidence/hsn2026-visual-qa-pass-b-gate-review.md` (inspected; concerns the landing route, not this timeline review)

## Exact evidence gaps

- No active ULW plan exists (`ULW_LOOP_PLAN_MISSING`), so this report uses the fallback evidence path.
- No timeline-specific executor report, code-review report, manual-QA matrix, or notepad was supplied. Direct source, screenshot, contrast, and browser checks support the verdict.
- The screenshots show resting state only; focused-state visibility was established from live keyboard/CDP evidence rather than a supplied focused screenshot.
- Contrast calculations use the declared base background `#071c1e`; parts of the gradient are lighter, so the reported failing ratios are not pessimistic.
