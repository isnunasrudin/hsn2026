# Gate Review — Visual QA Pass B

- recommendation: REJECT
- review mode: read-only product inspection; only this required evidence report was written

## Original intent

Verify `app/pages/index.vue` and the 1440×900 production capture against the user's pasted HTML contract, specifically exact copy, footer, centered circular backdrop, countdown layout, font loading, and responsive semantics.

## Desired outcome

A visually faithful, accessible coming-soon page whose copy and footer match the contract, whose circular backdrop and four-part countdown are centered and legible, whose intended web font actually loads, and whose layout remains valid at responsive viewport widths.

## User outcome review

The supplied desktop capture is valid and visually coherent. At 1440×900 it shows the header copy, centered logo composition, centered circular backdrop, four countdown units, and footer without visible clipping. However, the required pasted HTML contract is not present in the supplied prompt or discoverable in the workspace, so exact-copy fidelity cannot be reproduced. In addition, the source has a concrete 320 px responsive overflow condition: the countdown grid is 296 px wide before its parent page padding, while the content width is only 280 px.

## Blockers

1. **violatedCriterion:** `responsive-semantics`
   - **observation:** At a 320 px viewport, `.stage` contributes 40 px horizontal padding, leaving 280 px. Four fixed 68 px columns plus three 8 px gaps require 296 px, so the countdown exceeds its content box by 16 px and can be clipped because `.stage` uses `overflow: hidden`.
   - **evidencePointer:** `app/pages/index.vue:2`, `app/pages/index.vue:23-24`, `app/pages/index.vue:106`

2. **violatedCriterion:** `exact-copy`
   - **observation:** The exact pasted HTML reference is absent from the review input and workspace evidence, so visible strings cannot be compared character-for-character against the required contract.
   - **evidencePointer:** user task input; `omo ulw-loop status --json` returned `ULW_LOOP_PLAN_MISSING`; no matching brief/contract/evidence artifact was found under `.omo` or the project tree.

## Findings

- `[product]` Desktop layout: PASS at 1440×900. Header, logo, circular backdrop, countdown, and footer are centered and unclipped in `/tmp/hsn2026-production.png`.
- `[product]` Footer: PASS in the supplied capture; `TRENGGALEK, JAWA TIMUR` is visible at the bottom and corresponds to `app/pages/index.vue:32-36`.
- `[product]` Centered circular backdrop: PASS in the supplied capture. Its visual center aligns with the viewport center near x=720; source positioning is at `app/pages/index.vue:110-125`.
- `[product]` Countdown desktop layout: PASS in the supplied capture; four units appear in one centered row with tabular numerals.
- `[product]` Responsive semantics: REVISE due to the reproducible 320 px width overflow described above. No mobile capture was supplied.
- `[evidence]` Exact copy: UNVERIFIED because the pasted HTML contract itself is absent.
- `[product]` Font loading: the page explicitly loads Inter and applies it globally (`app/pages/index.vue:44-49`, `app/pages/index.vue:99`). The project also globally loads Exo 2 and Orbitron (`app/assets/style.css:1,11-12,29,265,274`), creating redundant requests and competing typography contracts. The screenshot alone does not prove which network font completed loading.

## Direct slop / programming pass

- Redundant font loading is maintenance burden and may cause avoidable network work, but is not independently blocking without the missing HTML contract establishing the intended family.
- `translate: -50% -50%` is immediately overridden by `translate: none` at `app/pages/index.vue:118,124`; the animation's `transform` currently produces the centered rendered result. This is confusing/dead styling but does not fail the supplied desktop capture.
- No tests were inspected because this is a visual evidence review, not an implementation change. No tautological, deletion-only, implementation-mirroring, or removal-verification tests were present in the inspected scope.

## Checked artifacts

- `/home/isnu/Project/hsn2026/app/pages/index.vue`
- `/tmp/hsn2026-production.png` — PNG RGB, 1440×900, 401398 bytes; capture mtime is newer than source mtime
- `/home/isnu/Project/hsn2026/DESIGN.md`
- `/home/isnu/Project/hsn2026/app/assets/style.css`
- `omo ulw-loop status --json` — no active ULW plan

## Exact evidence gaps

- The user's pasted HTML contract/reference markup is not available in this turn or as a workspace artifact.
- No mobile/responsive screenshot is supplied, so responsive rendering cannot be visually confirmed.
- No browser network/computed-style evidence is supplied to prove successful Inter download rather than fallback rendering.
- No executor evidence, code-review report, manual-QA matrix, or notepad path exists in the discoverable evidence set; direct artifact inspection was used instead.

