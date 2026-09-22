# Marrakechstory Visual Trip Planner — Design QA

- Source: `/Users/kjaerekunde/Downloads/ScreenRecording_09-20-2026 01-47-46_1.MP4`
- Extracted frames: `/private/tmp/marrakechstory-video-frames/clip-{0,5,10,15,20,25,30,35,40}.m4v.png`
- Implementation: authenticated `http://127.0.0.1:5173/admin.html` → Trip planner
- Browser evidence: Chrome, inspected 2026-09-20 at 1638 × 1197
- Source: 589 × 1280 Reel captures containing an inner tablet app
- State: persisted booking `MS-3Z7I7C`, Day 1 selected

## Comparison evidence

Instagram chrome, captions, hands, and filmed-device distortion were excluded. The implementation reproduces the inner app's dominant map, horizontal Overview/Day/Unplanned navigation, white itinerary panel, compact rows, and persistent trip header. The desktop experience is integrated into Marrakechstory's existing admin shell; responsive CSS converts it to a map with overlapping itinerary sheet on tablet/mobile.

The reference flow also contains destination discovery, calendar/preferences/budget steps, staged generation, photographic recommendations, and a map/day planner. The implemented slice currently provides real booking selection, persisted `daily_itinerary`, Overview/day tabs, map/card selection, drag ordering, explicit confirmation, draft-item creation, and existing booking/PDF handoffs.

## Fidelity surfaces

- Typography: compact hierarchy is aligned while existing admin fonts are intentionally retained.
- Layout: split map/planner composition and day tabs match the recorded interaction model.
- Tokens: existing admin status semantics remain; terracotta marks primary actions.
- Imagery: bookings without image fields cannot show photographic item thumbnails.
- Content: real Marrakechstory bookings replace the reference app's Bali examples.

## Findings

- [P1] Complete seven-step persisted creation wizard is not yet integrated.
- [P1] Discovery/import, AI provider contract, secure client sharing, and share-token lifecycle are not end-to-end.
- [P1] Activities without coordinates cannot produce accurate markers or routed geometry.
- [P2] Detail drawers do not expose every supplier, payment, assignment, document, and note field.
- [P2] Automated RLS, route-cache, secure-share, PDF-data, and generator retry tests are missing.
- [P2] Responsive CSS exists, but dedicated app-size browser QA remains.

## Verified

- Original Dashboard remains the default.
- Authenticated planner loads real RLS-backed bookings.
- Overview and dynamic day tabs work.
- Saved itinerary items appear on the correct day.
- Add-item writes through the existing booking update callback.
- Confirmation remains explicit.
- Existing booking editor and client-safe PDF flow stay linked.
- Production build succeeds.

## History

- Pass 1: cached bundles hid the new entry; asset versions were bumped.
- Pass 2: a persisted eight-day booking was selected and its tabs/items verified.

final result: blocked

Blocker: the P1/P2 items above remain before this can satisfy the full production acceptance criteria.
