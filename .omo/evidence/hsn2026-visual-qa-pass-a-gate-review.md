# HSN 2026 Visual QA Pass A - Gate Review

- recommendation: REJECT
- user verdict: REVISE

## Original intent

Replace the main landing page with the user's supplied HTML reference and preserve its visible layout, copy, responsive behavior, motion behavior, countdown, and production presentation.

## Desired outcome

The Nuxt `/` route should reproduce the supplied HTML at 1440x900, retain its mobile/short-viewport intent, and omit Nuxt DevTools from production.

## User outcome review

The 1440x900 production capture closely matches the supplied HTML for visible copy, Inter typography, logo scale, countdown layout, footer, colors, and circular backdrop. The implementation is not fully faithful because the reference's `prefers-reduced-motion` media query is absent, so motion remains active for users requesting reduced motion. This is a concrete behavior divergence from the supplied reference.

## Blockers

1. violatedCriterion: `REF-FIDELITY-MOTION`
   - observation: The supplied HTML disables all animation/transition under `prefers-reduced-motion: reduce`, restores `.reveal` opacity, and fixes the ring transform. `app/pages/index.vue` ends after the short-height media query and has no equivalent reduced-motion rule.
   - evidencePointer: `/home/isnu/Project/hsn2026/app/pages/index.vue:130` and `/home/isnu/Project/hsn2026/app/pages/index.vue:140`; original HTML in `/home/isnu/.codex/sessions/2026/09/27/rollout-2026-09-27T12-56-04-01a0e16f-52fa-7550-9493-834b519a463f.jsonl`, user message at JSONL line 415.

## Concrete findings

- Reference fidelity: visible desktop composition matches closely. Header, kicker, logo, countdown, and footer copy are present and ordered as in the reference.
- Ring geometry: matches the reference CSS exactly: `width: min(82vw, 740px)`, `left: 50%`, `top: 45%`, 95px and 190px outer rings. In the 1440x900 capture the central ring is approximately 740px in diameter, centered near `(720, 405)`, as intended.
- Font/copy: Inter 300-700 is loaded from Google Fonts and applied to the page. Visible copy matches. Non-visible metadata/accessibility copy substitutes a hyphen for the reference em dash in the title, hidden heading, and alt text; this is a fidelity note, not a visible blocker.
- Logo sizing: responsive classes match the reference (`min(78vw,610px)`, then `min(68vw,690px)`, with `max-height:44svh`; 36svh on short viewports). The local PNG intrinsic dimensions differ from the embedded reference declaration but preserve effectively the same aspect ratio.
- Responsive intent: width, spacing, typography, and short-height constraints from the reference are retained. The available 390x844 capture shows the four countdown columns remain readable and the footer remains at the bottom, but it is a pre-production/dev capture and is not used to prove production DevTools absence.
- Nuxt DevTools: `nuxt.config.ts:6` sets `devtools.enabled` to `false`; the 1440x900 production capture has no DevTools pill; production public bundles contain no Nuxt DevTools client marker. Server dependencies include Vue's no-op devtools API, which is not the Nuxt DevTools UI.
- Slop/overfit pass: no tests exist in scope, so there are no deletion-only, tautological, implementation-mirroring, or excessive tests. No unnecessary parser/normalizer/extraction was introduced. The duplicate `translate` declarations and ring animation are inherited verbatim from the supplied HTML, so they are not scope drift, though the missing reduced-motion companion rule makes that pattern incomplete.
- Programming pass: countdown logic is direct and readable; no `any`, suppression comments, broad catches, or speculative abstractions were found. `index.vue` is 122 pure LOC, below the 250 pure-LOC threshold.

## Checked artifacts

- `/home/isnu/Project/hsn2026/app/pages/index.vue`
- `/home/isnu/Project/hsn2026/nuxt.config.ts`
- `/tmp/hsn2026-production.png` (PNG, 1440x900, RGB)
- `/tmp/hsn2026-fixed-mobile.png` (responsive supporting evidence only)
- `/home/isnu/Project/hsn2026/.output/public/`
- `/home/isnu/Project/hsn2026/.output/server/`
- `/home/isnu/.codex/sessions/2026/09/27/rollout-2026-09-27T12-56-04-01a0e16f-52fa-7550-9493-834b519a463f.jsonl` (original supplied HTML at line 415)

## Exact evidence gaps

- No same-size rendered screenshot of the standalone supplied HTML was retained, so no pixel-diff score can be produced. Fidelity was checked by exact source-contract comparison plus direct inspection of the 1440x900 production capture.
- No fresh production mobile screenshot was supplied. Mobile intent is supported by source and an earlier 390x844 capture, not a current production mobile capture.
- No separate code-review report or manual-QA matrix artifact was present. Direct gate review covered the requested visual criteria and the required programming/slop checks.
