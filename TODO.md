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
- [ ] Small rhombs do not work when rhombs are selected on the two shape
      expansion pages (`g012` / `drawGeneric123`, `g3` / `drawGeneric3`)
- [ ] Involves the large/small rhomb radio pair (`#small-rhomb` /
      `#large-rhomb`) in `Overlays`
- [x] Cause: an error of omission. Both pages hardcode `layer = "dual"` and
      draw only the penta and dual layers, never `layer: "rhomb"`. Every
      `smallRhomb` branch sits inside `if (layer == "rhomb")`, so the radio pair
      is inert there. `drawGridWork` works because it passes both layers
- [x] Confirmed: large and small rhombs are sized exactly one generation apart,
      and large is the earlier generation. `drawRhombusPattern` indexes shapes
      by the gen it is called at (`thickRhomb[gen]`). Large short-circuits at
      `gen == 1` → index 1; small recurses to `gen == 0` → index 0

Nothing to back-port from `wieringa-roof` here. The thick/thin rhomb shapes are
term-for-term identical in both projects, and the `isHeads` rules agree with the
table in `docs/PLANS.md`. The `[0,±1,±2,±1]` vertex-index caution from the
wieringa work is about 3D height indices and has no counterpart in this project.

### 4a. Dual rhombs — finish the research feature
Started and abandoned as too complex. The leftover is the hardcoded
`layer = "dual"` on the two expansion pages. Restate of the idea:

When a colored P1 tiling is overlain with small rhombs, the thick and the thin
rhomb each pick up a **unique pattern of the P1 colors**. So tiling with just
those two colored rhombs reproduces the P1 pattern.

Generation 0 of a pentagon is a single pentagon (`Pe5`, `Pe3`, `Pe1`). Generation
0 of the small rhombs is the cluster:

| P1 tile | cluster |
|---|---|
| rhomb star (`Pe5`) | 5 thick |
| rhomb boat (`Pe3`) | 3 thick + 1 thin |
| rhomb diamond (`Pe1`) | 1 thick + 2 thin |

The `St*` tiles generate no small rhombs at all. **The dual is the other way
around**: the `St*` generate the small rhombs and the `Pe*` generate nothing.

Equivalently: a `Pe*` seed overlain with the corresponding `St*` seed is the P1
dual.

- [ ] Implement soon
- [ ] `dualRhombSelected` is currently dead — set, persisted, checkbox wired,
      never read. `drawDualRhombusPattern` gates on `rhombSelected` instead
      (`penrose-screen.js:913`). Wire the checkbox to its own layer
- [ ] Note `drawDualRhombusPattern` indexes `thinDualRhomb[gen + 1]`, one higher
      than `drawRhombusPattern`'s `[gen]`

### 4b. Deca generations — decided against
`wieringa-roof`'s `expandDeca` expands children at `gen` using `wheels[gen + 1]`,
where this project expands at `gen - 1` using `wheels[gen]`, leaving deca a
generation behind everything else. `renderings.js` compensates with
`topGens = isDeca ? [1,2,3] : [0,1,2]`.

**Do not import this.** What is good for wieringa-roof is not good here — that
change was made to define deca, penta and star as queen, sun and star empire
patches. Leave this project's deca as it is.

### 5. Bring the mathematics up to date
There are two geometries, not four shape modes: **real** (sines, cosines, φ) and
**discrete** (integer, hand-computed). Quadrille and mosaic are both discrete —
they differ only in rendering and in how reflections are done (`shapeWheel` uses
`vr/neg/hr`, `shapeWheelMosaic` uses `vrm/negm/hrm`). A third typographic
geometry exists but is unreachable and has no current purpose.

Only three rotations are ever stored — nicknamed `up, won, too`, and in wheel
index terms `up0, down3, up1`. Everything else is vertical and horizontal
reflection. The discrete wheels were reverse-engineered by counting squares on a
mosaic printout; two generations were enough to extrapolate the rest with
k(n+2) = k(n) + k(n+1). At scale the discrete tiling is uncannily close to the
real one.

- [ ] Write `docs/wheels.md` capturing the above, including the origin story
- [ ] Fix `wheels.js:140` — mislabels the seeds as `up0, down3, up2`. It is
      `up1`. Contradicts the correct comment at `wheels.js:44`, and the table
      headers in `measurements.js`
- [ ] Retire dead math, reviewed one at a time, not as a sweep:
      - `predecessorPoint` — exact duplicate of `interpolateWheel`, no callers
      - `interpolateShape` — calls `.foreach`, would throw, no callers
      - `makeShapeWheels` — empty stub
      - discarded computations in `shapeWheelTests()`
- [ ] Only then consider restructuring `shape-modes.js` around two geometries.
      Adjacent to the penta/star refactor in `docs/PLANS.md` — a real revamp

### 6. Wheel line diagrams — deferred
Moved to last. Cannot be done justice without revamping the measurements page.
See item 3 for the content; do it after items 4 and 5.
