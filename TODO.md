# Penrose Mosaic — TODO

## Measurements Page

### 1. Tie tables to control mode (DONE)
- [x] Wire wheel tables to the shape mode control (mosaic, quadrille, real)
- [x] When mode is real, show rounded floating-point values in the tables
- [x] When mode is quadrille/mosaic, show integer values (current behavior)

### 1a. Intermittent: mode change doesn't update tables
- [x] Cause found: not a race. `cookie.set` used `max-age: 3600`, so the cookie
      expired under a page left open. `ShapeMode.reset()` then fell back to its
      default because it overwrote `this.shapeMode` before building the fallback
      it hands to `cookie.get` — the fallback was always "real", never the value
      the object held
- [x] `max-age` raised to 30 days (`COOKIE_MAX_AGE` in `controls.js`)
- [x] `ShapeMode.reset()` now only applies its default on first construction
- [x] Added a `defaults` button on the Controls heading to clear cookies and reload
- [ ] Not yet confirmed gone in normal use — leave open for a while
- [ ] Diagnostic logging still in `measureTasks()` and `wheelTables()`; remove
      once 1a is confirmed dead

### 2. Decagon figures match mode (low priority, parked)
- [x] `drawQuadrille()` and `drawImage()` passed the constant `shapeMode.MODE_REAL`
      instead of `shapeMode.shapeMode`, so they were pinned to real. Fixed
- [ ] Fixing that did **not** change what renders. Observed, after the fix:
      - mode mosaic → figure shows real
      - mode real → figure shows real
      - mode quadrille → figure shows mosaic
- [ ] Hypothesis (unconfirmed): the figures render one mode behind. Cycle order
      is mosaic → quadrille → real, and two of the three cases match the
      predecessor (mosaic shows real, quadrille shows mosaic). The real case does
      not fit, so this is at best partial. Looks like a sync/repaint issue rather
      than a mode-plumbing issue
- [ ] Not worth chasing. These figures started as an experiment in image
      generation and are decorative. Mosaic at larger sizes shows internal
      squares, which is fine
- [ ] Ignore overlay values and colors

### 3. Wheel line diagrams
- [ ] Draw small figures showing the line each wheel (P, S, T, D) represents
- [ ] Place each diagram to the left of its respective table
- [ ] P: distance between pentagon centers
- [ ] S: pentagon corner to star (pgon.R + pgram.R)
- [ ] T: star center to boat center (2 × (pgram.R + pgram.y))
- [ ] D: pentagon center to corner (pgon.r)

### 4. Small rhombs consistency
- [ ] Small rhombs render inconsistently — fix
- [ ] Detail to be filled in. Likely involves the large/small rhomb radio pair
      (`#small-rhomb` / `#large-rhomb`) in `Overlays`, and the rhomb sizing used
      by the shape modes
