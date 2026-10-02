# Gate Review: `/timeline` Visual QA

- recommendation: **REJECT**
- visualVerdict: **REVISE**
- reviewMode: Read-only application review; no application source was edited.

## Original Intent

Audit the new `/timeline` route from the user's perspective for consistency with the current landing page, responsive behavior, semantic timeline structure, overflow, and copy hierarchy, using the supplied desktop and mobile screenshots plus `app/pages/timeline.vue`.

## Desired Outcome

A timeline page that feels native to the existing HSN 2026 landing, remains readable and unclipped on desktop and mobile, exposes a meaningful chronological structure, and communicates date, state, title, description, and location with a coherent hierarchy.

## User Outcome Review

The visual direction is cohesive: the dark teal field, cream/gold palette, Inter typography, fine geometric rings, uppercase eyebrow labels, and restrained editorial spacing clearly belong to the same product as the landing page. The desktop layout has a strong headline-to-agenda transition, and the mobile layout collapses cleanly to one rail without visible horizontal overflow.

The result is not ready for a PASS because the field presented as a status mixes incompatible meanings (`Persiapan`, `Sosialisasi`, `Berjalan`, `Kick-off`, `Agenda utama`). As of the review date, past August and September entries are also not represented consistently as completed/current states. This weakens timeline comprehension. In addition, meaningful microcopy rendered at 10px with approximately 48–50% opacity (agenda count and footer) computes to roughly 3.73–3.95:1 against the darkest declared background, below the 4.5:1 normal-text threshold; the screenshots visually confirm these labels are faint.

## Criteria Review

| Criterion | Result | Evidence |
|---|---|---|
| C1 — Design consistency with current landing | PASS with note | `app/pages/index.vue:2-30`, `app/pages/timeline.vue:120-207`, both screenshots. Shared teal/cream/gold language and Inter typography are consistent. |
| C2 — Responsive layout and overflow | PASS for supplied viewports; evidence gap for full page | Desktop 1440×1200 and mobile 390×844 screenshots show no horizontal clipping; mobile rules at `app/pages/timeline.vue:209-224` collapse heading/meta/rail appropriately. Captures show only the top of the list, not all five items/footer. |
| C3 — Semantic timeline | PASS | `app/pages/timeline.vue:31-47` uses `ol`, `li`, `article`, headings, and machine-readable `time[datetime]`; decorative rail is hidden from the accessibility tree. |
| C4 — Copy hierarchy and timeline meaning | FAIL | `app/pages/timeline.vue:71-116` mixes phase/type/state concepts in one `status` field; `Berjalan` is attached to 1 September while earlier entries use activity types rather than temporal states. `app/pages/timeline.vue:168-178,190,207` uses very small, low-contrast informative text. |

## Blockers

1. **violatedCriterion: C4 — Copy hierarchy and timeline meaning**  
   **observation:** The right-hand/mobile status label has no consistent semantic model: it alternates among phase (`Persiapan`), activity (`Sosialisasi`, `Kick-off`), current state (`Berjalan`), and importance (`Agenda utama`). Past events are not clearly distinguished from the current/upcoming event.  
   **evidencePointer:** `app/pages/timeline.vue:71-116`; desktop screenshot agenda metadata; mobile screenshot first-card metadata.

2. **violatedCriterion: C4 — Copy hierarchy and timeline meaning**  
   **observation:** Informative 10px copy such as `05 agenda` and footer text uses 48–50% translucent `#cbd9d4`, yielding approximately 3.73–3.95:1 over `#071c1e`; this is too faint for normal-sized text and weakens the intended hierarchy by making supporting information hard to read.  
   **evidencePointer:** `app/pages/timeline.vue:168-178`, `app/pages/timeline.vue:190`, `app/pages/timeline.vue:207`; desktop screenshot around section count/header mark.

## Notes (Non-blocking)

- The back link has a visually small hit area because no minimum inline/block padding is defined (`app/pages/timeline.vue:175-177`). Consider a 44×44px-equivalent target without changing its visual size.
- `app/pages/timeline.vue` measures 209 nonblank/non-comment lines, within the programming warning band (200–250), but there is no stated criterion requiring a split and the file still has one clear responsibility.
- Direct remove-ai-slops pass: no excessive/useless tests, deletion-only tests, tautological assertions, implementation-mirroring tests, unnecessary parsing/normalization, or one-off production extraction were found. No tests are present in the reviewed artifact.

## Checked Artifact Paths

- `/home/isnu/Project/hsn2026/app/pages/timeline.vue`
- `/home/isnu/Project/hsn2026/app/pages/index.vue`
- `/home/isnu/Project/hsn2026/DESIGN.md`
- `/home/isnu/Project/hsn2026/app/assets/style.css`
- `/home/isnu/Project/hsn2026/app/layouts/index.vue`
- `/home/isnu/Project/hsn2026/app/app.vue`
- `/tmp/hsn2026-timeline-desktop.png` (PNG, 1440×1200)
- `/tmp/hsn2026-timeline-mobile.png` (PNG, 390×844)

## Exact Evidence Gaps

- No original brief beyond the five requested QA dimensions was provided; criteria C1–C4 are derived directly from the task wording.
- No executor evidence, code-review report, or manual QA matrix was supplied.
- No full-page/scroll-position captures show agenda items 2–5 or the footer, so their rendered vertical continuity and end-of-rail alignment are not visually proven.
- No 768px/tablet capture, interaction-state capture, browser DOM measurement, or runtime accessibility report was supplied.
- The screenshots are fresh relative to `app/pages/timeline.vue` (captured about 44 seconds after the source modification), but `DESIGN.md` was modified about 21 seconds after the captures; its timeline section is descriptive and does not visibly contradict them.

