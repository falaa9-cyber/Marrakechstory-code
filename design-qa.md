# Marrakechstory Trip Planner — Design QA

- Source visual truth: `/Users/kjaerekunde/.codex/generated_images/01a0c0f4-d2ba-7661-9b61-a7f18be8bebc/exec-628dd3a4-40a1-4d15-ad68-c828a30ce63a.png`
- Implementation: `http://127.0.0.1:5173/trip-planner.html`
- Browser-rendered evidence: Chrome tab `Atlas to Sahara · Marrakechstory Planner`, captured and inspected on 2026-09-20
- Viewport: 2160 × 1200 browser content capture; responsive CSS additionally covers 1100px, 820px, and 520px breakpoints
- Source pixels: 1536 × 1024
- Implementation pixels: 2160 × 1200
- Normalization: compared by app-owned regions and proportional layout because the available Chrome window is wider than the 3:2 source concept
- State: Day 3 selected, Ait Ben Haddou selected, map tiles loaded

## Full-view comparison evidence

The implementation preserves the source's defining 76px navigation rail, compact 100px trip header, near-even map/planner split, floating warm-white surfaces, red route/numbered markers, scrollable day tabs, and compact three-stop timeline. The wider live viewport intentionally provides more map width and lower apparent type scale while keeping the same hierarchy.

## Focused region comparison evidence

The trip header, day tabs, selected itinerary row, status controls, route markers, route legend, and add-item affordance were inspected at readable scale. Existing Marrakechstory photo assets replace the concept photography, as required for brand/source fidelity. The real Leaflet/OpenStreetMap surface is more detailed than the generated concept map but maintains the intended warm-neutral visual balance.

## Required fidelity surfaces

- Fonts and typography: Fraunces provides the editorial trip-title hierarchy; DM Sans provides compact, readable UI text. Weights, line heights, and wrapping preserve the concept's hierarchy.
- Spacing and layout rhythm: map and timeline remain visible together; header, tab strip, timeline rows, radii, and restrained shadows match the selected direction. No persistent controls overflow.
- Colors and tokens: centralized cream, white, terracotta, espresso, sand/olive, blue, success, and warning tokens map to the source direction with accessible text contrast.
- Image quality and asset fidelity: real local Marrakechstory imagery is used for each stop; no placeholder or generated substitute remains. The existing logo and icon system are reused.
- Copy and content: trip reference, dates, traveler count, route, stops, travel durations, confirmation states, day notes, share, and PDF actions match the chosen concept and the product brief.

## Interaction verification

- Overview tab switches content and refits the map.
- Day 3 restores the itinerary and route.
- Add item opens the categorized side drawer and a selection closes it with feedback.
- Confirmation status toggles without implying that suggestions are booked.
- Map markers expose accessible place names and synchronize through the same selected-item state as itinerary rows.
- Share and PDF buttons provide non-destructive prototype feedback.
- Chrome accessibility tree exposes semantic tabs, controls, headings, and map fallback description.

## Comparison history

- Initial inspection: no P0/P1/P2 mismatch found. The live map has denser labels and the user Chrome viewport is wider than the source; these are acceptable environment differences rather than design defects.

## Follow-up polish

- P3: replace straight cached prototype polylines with routed geometry when a routing provider is configured.
- P3: connect PDF/share controls to production services during the integration phase.

final result: passed
