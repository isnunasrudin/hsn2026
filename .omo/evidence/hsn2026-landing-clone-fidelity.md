# HSN 2026 landing: screenshot review, sections A–F

Recommendation: REQUEST_CHANGES

Final screenshot re-review: all five paths were reopened after the date/status typography increase to the reported 15px phone and 14px desktop sizes. Findings below refer to these latest captures, replacing the previous screenshot assessment. The rendered product has no remaining A–F visual defect established by these frames; the overall recommendation remains REQUEST_CHANGES solely for the evidence gaps below.

Scope: read-only review of the five supplied route `/` captures. No source, diff, reference packet, runtime state, or notepad path was supplied to this focused pass. No tests were run and no implementation files were changed. This report does not certify a component tree, token architecture, or fidelity to an unspecified reference.

## Evidence inspected

- D1440: `/tmp/hsn2026-visual/final-desktop-1440-top.png` (1440×900)
- D1440E: `/tmp/hsn2026-visual/final-desktop-1440-end.png` (1440×900)
- D1920: `/tmp/hsn2026-visual/final-desktop-1920-top.png` (1920×1080)
- P390: `/tmp/hsn2026-visual/final-phone-390-top.png` (1170×2532, consistent with 390×844 at DPR 3)
- P390E: `/tmp/hsn2026-visual/final-phone-390-end.png` (1170×2532)

All five images were opened directly. PNG dimensions were read independently. Files show fully composited page content without browser chrome. Capture freshness is a supplied claim, not independently correlated with source modification times.

## Findings by severity

### CRITICAL

None established from screenshots. An image-only implementation cannot be ruled out by this review.

### HIGH

- [evidence] E1/E2: No paired light/dark captures or measured contrast results were supplied. Both-theme rendering and WCAG AA cannot be approved from this packet. All five supplied frames use the same dark visual treatment; this does not establish how system theme changes behave.
- [evidence] Full clone/design-system approval is outside the evidence available: no target/reference, source/diff, or token/component evidence was supplied. Do not interpret this focused screenshot review as a design-system approval.

### MEDIUM

None remaining in the supplied rendered states. Date/status metadata is now visibly larger and comparable in size to secondary text, with clean wrapping in all five captures. Exact computed font sizes remain a DOM measurement rather than a screenshot fact.

### LOW

None remaining. The previous C3 issue is resolved by “JELAJAHI SEMUA KEGIATAN”.

### Resolved on re-review

- A3: Desktop paragraph has a comfortable measure, approximately 60–65 characters on its long lines.
- B1: The collection CTA now has a solid gold background and dark label, making its priority clear.
- C3: The CTA now starts with the outcome verb “JELAJAHI”.
- C1: Mobile introductory body text, card subtitles and date/status metadata are visibly enlarged. The metadata now meets the visual size criterion without crowding card titles or clipping dates.
- The shorter “HSN 2026” corner label leaves a clear gap in the phone header.

## Checklist

PASS is restricted to the visible states. N/A also identifies criteria that cannot be assessed from static screenshots; it is not a claim that those runtime requirements are satisfied.

| Item | Verdict | Evidence and qualification |
|---|---|---|
| A1 | PASS | D1440/D1920/P390: intentional centered hero and aligned content block. |
| A2 | PASS | All captures: background reaches every viewport edge. |
| A3 | PASS | D1440/D1920: revised paragraph measure is comfortable; outer margins remain symmetric. |
| A4 | N/A | P390/P390E have visual top/bottom padding; actual notch, browser chrome and home-indicator safe-area behavior is not shown. |
| A5 | PASS | P390/P390E: content retains symmetric margins; no reserved scrollbar gutter is visible. |
| A6 | N/A | No nested scroll region or sticky bar is visible; a still cannot establish scroll ownership. |
| A7 | PASS | All: repeated card edges and interior text columns align; token provenance is unverified. |
| A8 | PASS | All: headings, paragraph, CTA and cards have clear grouping and separation. |
| A9 | PASS | P390/P390E: one column without visible horizontal overflow. D1440/D1920: no overlap. Empty/long/unbroken-string states are not supplied. |
| A10 | PASS | P390: partially visible second card gives an immediate continuation cue. |
| A11 | N/A | No native macOS window/sidebar surface. |
| B1 | PASS | All: one clear CTA with a solid gold background and dark outcome label. |
| B2 | N/A | No destructive or cancel action shown. |
| B3 | PASS | Hero identifies the event; section title describes its purpose. No toolbar title. |
| B4 | PASS | All: event identity leads, then purpose and activity selection. |
| B5 | PASS | All: coherent teal/gold brand palette; no competing toolbar accents. |
| B6 | PASS | All: clear visible type hierarchy and consistent UI typeface; paired-theme behavior unverified. |
| C1 | PASS | All five latest captures: body, subtitles and enlarged gold date/status metadata now appear appropriately sized; computed pixel values were not independently read. |
| C2 | PASS | Card dates are human-readable Indonesian dates; no internal IDs or raw timestamps shown. Event dates appropriately remain absolute. |
| C3 | PASS | Collection action now says “JELAJAHI SEMUA KEGIATAN”. |
| C4 | PASS | All: current labels wrap cleanly; phone title uses two lines. 200% zoom/large-text state was not supplied. |
| C5 | N/A | No CJK text or citations shown. |
| C6 | N/A | No empty/error state supplied. |
| C7 | N/A | No text fields shown. |
| C8 | N/A | Text selection cannot be determined from PNGs. |
| D1 | N/A | CTA and cards visually appear large enough, but actual clickable bounds and hit areas cannot be determined from PNGs. |
| D2 | N/A | No phone tab bar. |
| D3 | N/A | No action toolbar. |
| D4 | N/A | No adjacent bar buttons. |
| E1 | FAIL | Evidence gap: no labeled light/dark capture pair. |
| E2 | FAIL | Evidence gap: no paired themes or objective text/control contrast measurements. Visual readability alone is not WCAG proof. |
| E3 | PASS | Registration state is written explicitly; focus rendering is not shown. |
| E4 | PASS | Visible registration labels share the same gold treatment across all cards. |
| E5 | N/A | No floating translucent overlay shown over scrolled content. |
| E6 | N/A | System-theme behavior cannot be inferred; no theme control shown. |
| F1 | PASS | Consistent diagonal arrow marks; no emoji icons visible. |
| F2 | N/A | Card radii and gaps appear consistent; token origin cannot be proven visually. |
| F3 | PASS | Three visible activity cards share their anatomy and styling across widths. Other routes were not supplied. |
| F4 | PASS | PCNU name and HSN event mark are present; untouched fidelity requires the original asset/reference. |
| F5 | N/A | No selected or focused state captured. |
| F6 | PASS | Trailing diagonal arrows consistently signal navigation; destination semantics need runtime confirmation. |
| F7 | N/A | No windows, sheets, or popovers shown. |

## Blockers before approval

1. E1/E2 lack the paired-theme and contrast evidence required for their approval.
2. A full clone/design-system verdict additionally needs the source/diff, target/reference and token/component evidence; screenshot-only review cannot certify those properties.

## Preserve

The centered event identity, full-bleed background, restrained palette, aligned activity cards, one-column phone layout, and clean current-content wrapping are visually coherent in all supplied frames. The enlarged body/subtitle type, tighter paragraph measure, shorter corner label and solid verb-led CTA improve the latest captures without introducing clipping or overlap.
