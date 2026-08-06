# Penrose Mosaic — TODO

## Ground rule

**Do not change the look of this program.** Fixes are behavior-only. Correcting a
dangling `for=` so a label finally reaches its checkbox is fine; changing fonts,
colors, spacing, adding or removing visible controls, or rearranging a page is
not — not even as a small improvement alongside an approved change. Adding a nav
button or a page counts as changing the look. Console logging, internal renames
and selector corrections do not. If a fix genuinely needs a visible change, ask
first.

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
- [ ] The whole dual draw path is currently **dead code**. The only producer of
      `layer: "dual"` is `pentaDual` (`penrose-screen.js:636`), which has no
      callers since the expansion pages stopped hardcoding it. `drawDualDemo`
      passes only "penta" and "rhomb"
- [ ] `drawDualRhombusPattern` indexes `thinDualRhomb[gen + 1]`, one higher than
      `drawRhombusPattern`'s `[gen]`. This is **not** a latent crash: the call
      sits inside the `gen == 0` branch of `star()`, so gen is always 0 and the
      index is always 1, which exists. Worth understanding before reusing the
      function at other generations, nothing more

#### "Dual" is probably the wrong name
The idea is a map centered on a `Pe5` pentagon overlain with one centered on a
`St5` star. That is **not** a dual in the usual sense — a dual exchanges vertices
and faces. What it actually describes is a known pair: there are exactly **two**
Penrose tilings with global five-fold symmetry, conventionally called **Sun** and
**Star**, distinguished by precisely this — whether the center is a pentagon
vertex or a five-star.

`wieringa-roof` already uses that vocabulary (`expandSun`, `expandStarComposite`,
and the queen/sun/star empire framing), so the two projects would agree.

- [x] **DECIDED: the feature is called the Sun/Star overlay.** Use that name for
      the page, the control label and any new identifier
- [ ] Scope of the rename is still open. "Dual" appears in ~50 places, but not
      all of them mean the same thing. The *shape* identifiers — `goThickDual`,
      `goThinDual`, `thickDualRhomb`, `thinDualRhomb` — are a distinct rhomb
      geometry built from the p and s wheels instead of t, and may be a genuine
      dual. Renaming those to Sun/Star could be simply wrong. Rename the
      user-facing feature first; leave the shape math alone until we know

#### BUG: the Dual rhombs checkbox is wired to the wrong element
`controls/Overlays.js:29` reads

    this.eleDualRhomb = document.querySelector("#dual");

Every other overlay queries its `-ovl` id (`#penta-ovl`, `#rhomb-ovl`). The
checkbox is `#dual-ovl` (`index.html:110`). `#dual` does exist — it is the
**page div** at `index.html:254`. So:

- the real checkbox has no listener, and `dualRhombSelected` never changes
- `refresh()` sets `.checked` on a `<div>`, which does nothing
- the click listener is attached to the Dual test page, so clicking anywhere on
  that page silently toggles `dualRhombSelected`

- [ ] Fix the selector to `#dual-ovl`, or rename the ids as part of the Sun/Star
      rename so the collision cannot recur

#### The relation being sought has a name: MLD
P1 and P3 are **mutually locally derivable** — each can be reconstructed from the
other by local rules alone. That is the formal version of "the overlaid pattern
will produce a P1 tiling, one pattern on thick and the other on thin": each P3
rhomb carries a fixed piece of P1 decoration, one for thick and one for thin.
This is the same property already observed for the small rhombs.

Reference image: `Penrose_Tiling_(P1_over_P3).svg.webp` in the math-legacy root
(Wikipedia). P1 in black outline — gray pentagons, blue non-pentagon tiles —
with the P3 rhombs overlaid in yellow.

#### How the two rhomb groups differ (see docs/rhomb-groups.md)
- **large RG** centers land on blue `Pe5_0` pentagons **only**
- **small RG** centers land on **every** pentagon type `Pe*_0`
- one inflation step apart

That asymmetry is the thing to look at first. If the Sun/Star overlay carries
over to P1, the large RG restriction to blue is very likely where it shows up.

#### Specification 2026-08-06

**Per image, independent, set on screen above each image:**

| control | values |
| ------- | ------ |
| Shape type | Star, Sun, Queen |
| Orientation | Up / Down |
| Parity | Heads / Tails |
| Gen | size of the circular patch |
| Mode | real and quadrille only — mosaic does not make sense here |

**Shared, pulled from the sidebar:** layer (pentagons and stars, or small
rhombs); stroke, fill and color. Default **solid stroke with transparent fill**
for both rhombs and pentas. The sidebar can be tweaked to suit.

**What the patches actually are.** These are radius-clipped, not
recursion-bounded — a different construction from what `penta()` and `star()`
produce:

- **Star patch**, seed at gen 0: the pentagon centers within a given radius of
  the center of a `St5` **of indefinite generation**
- **Sun patch**, seed at gen 0: the pentagon centers within a given radius of
  the center of a `Pe5` **of indefinite generation**
- **Queen patch**: a patch whose first generation is one yellow (`Pe3`) and two
  orange (`Pe1`) pentagons

So a patch is defined by a radius clip around a center, with the underlying
tiling taken as arbitrarily large. `Gen` sets that radius. This is why the plain
`Pe5`/`St5` figures are only an approximation of the named patches — they are
bounded by where the recursion stops, not by a circle.

- [ ] Implement the clip. The recursion draws directly rather than returning
      placed tiles, so this needs either a collect-then-filter pass (as
      `wieringa-roof` does with `allP1Tiles`) or a radius test at the leaf, in
      `drawPentaPattern` and `drawRhombusPattern`. Options already flow through
      the recursion via `...options`, so a center and radius could ride along
- [ ] Queen needs a composite seed: `Pe3` plus two `Pe1`

#### Direction settled 2026-08-05
- Clearest reading is **strokes only, fill transparent or none**
- Borrow the framework from `wieringa-roof/unfold.html`: a checkbox reading
  **"overlay instead of side by side"** (`#p1-overlay`, handled in
  `src/workbench.ts`). Same idea here for penta vs rhombs
- Work in **patches**, not raw generations: Sun, Star, and deca/Queen. Build them
  as composite seeds in the style of `deca()`. Do not worry about matching
  generation numbers between them
- The duals of each layer are **sun/star, horizontal up or down**. All five-fold
- **Deca is its own dual** — horizontal up and down are its duals
- Controls later, but the shape is a **swap function**: the sidebar sets up the
  left one, and swap exchanges them

- [x] Side by side, plain `Pe5_x` and `St5_x`, vertically centred. The named Sun
      and Star patches are just these with the outer tiles trimmed to round them
      off, so no composite seed is needed to see them
- [ ] Next: the **"overlay instead of side by side"** toggle, default side by side
- [ ] Then: strokes only, fill transparent

**Correction.** A composite `starPatch()` was built and backed out. Two mistakes:
it built an overlay when side by side is the default, and it treated the patches
as needing a measured ring when they are plain `Pe5`/`St5`. The claim that the
Sun ring needs half-tenths was also wrong — every pentagon has a horizontal side,
and the wheel directions cover it. The wieringa-roof polar placement solves a
problem this project does not have.

#### New page: two independent overlay layers
"Dual rhombs" is too narrow a framing. What the page wants is **two overlay
slots, each with its own controls**, drawn on one canvas. The Sun/Star
comparison is then just one configuration of it — slot A centered on a `Pe5`,
slot B centered on a `St5` — rather than a feature in its own right.

Per slot, independently settable:
- shape type (`Pe*`, `St*`, `Deca`) and angle/heads
- **generation** — the interesting one. Two different generations overlaid,
  scaled to a common size, is what shows the inflation relation directly
- which layer to draw (penta, rhomb) and rhomb size (large/small)
- color and opacity, so the lower slot stays readable

- [ ] Scale normalization is the real work. Each slot picks its own generation,
      so the page must scale them to a common unit before compositing. The
      measure/render two-pass already computes bounds per scene — two scenes,
      two bounds, one common scale
- [ ] Add a `.pageButton` with a `data-id` to `<nav id="across">` in
      `index.html`, a matching `<div class="page">` holding a canvas, and a draw
      function in `renderings.js` called from `penroseApp`
- [ ] CAUTION: `PageNavigation` persists `activeButtonIndex` by **position**
      (`controls/PageNavigation.js`). Inserting a button mid-list shifts every
      index after it, so a stale cookie opens the wrong page. Append at the end,
      or press `defaults` after adding it

#### The nav/content relationship is brittle
Page identity lives in three places that must agree — the button's `data-id`, the
`.page` div's `id`, and the string passed to the draw function in `math.js`
(`drawDualDemo("dual")`). Nothing checks that they line up, and the `#dual`
selector bug above is exactly what that costs. Worth a look before adding a page
rather than after.

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
- [x] Retire dead math, reviewed one at a time:
      - `interpolateShape` — removed. Called `.foreach`, would have thrown
      - `makeShapeWheels` — removed. Empty stub
      - `compare` — removed. Already marked "Deprecate soon !!!"
      - `predecessorPoint` — **kept**, deliberately. It is byte-identical to
        `interpolateWheel`, but the pair carries the derivation and the
        plain-language account between them, and that is worth the duplication
      - `shapeWheelTests` and its helper `makeShapesSeedSuccessor` — removed.
        They ran on every measurements refresh and nothing escaped them
      - `successorPoint` — **kept**, though it now has no callers at all. It is
        the clean statement of the forward step, and `makeWheels` arguably
        ought to call it instead of inlining the same sums

### 5b. Angles and asymptotics — mostly answered, see docs/wheels.md
Answered while documenting the wheels:
- ratio of successive radii is **φ², not φ** — `(3+√5)/2`
- the discrete slopes converge to **algebraic numbers in ℚ(√5)**:
  `tan = (5−√5)/4` at 34.6438° and `(5+3√5)/4` at 71.1377°, against the true
  36° and 72° whose tangents need nested radicals
- the recurrence is `k(n+2) = 3k(n+1) − k(n) ± k(0)`, not plain Fibonacci, but
  Fibonacci appears exactly *between* wheels

Sharpened after re-reading `~/Documents/obsidian/projects/penrose/Mosaic Chat.md`:
the x-components are **alternate Fibonacci numbers** and the recurrence
`a(n+1) = 3a(n) − a(n−1)` is exact in x. One inflation is two Fibonacci steps,
which is why the ratio is φ². The limits are the dominant eigenvector of the
substitution, eigenvalue φ² — hence ℚ(√5).

**The mosaic is therefore not a rational approximant.** It generates its own
irrational geometry rather than converging back to Euclidean Penrose.

Left to look at:
- [ ] `S` follows the same second-order law but its cross-wheel difference is
      `S(n+1) = S(n) + 2P(n) − P(n−1)`, less tidy than P, D and T. Is there a
      better statement of it
- [x] **Substitution matrix — done, see docs/wheels.md.** x and y evolve under
      two *different* integer matrices, because `hr` negates x and `vr` negates
      y. `Mx = [[1,0,0],[1,1,1],[0,1,2]]`, `My = [[1,2,0],[1,1,1],[0,1,0]]`,
      verified against `successorPoint` over 50,000 seeds. Both characteristic
      polynomials share `λ² − 3λ + 1`, roots φ² and φ⁻², so the growth ratio is
      now proved. Mx's extra eigenvalue 1 is why `x0` stays 0; My's extra
      eigenvalue −1 **is** the ±2 correction. The limiting tangents follow in
      closed form from the dominant eigenvectors `ex = (0,1,φ)`,
      `ey = (2φ,φ²,1)`
- [x] Two results fell out: `tan θ₂ / tan θ₁ = φ³` **independent of the seed**,
      so no integer basis can change it; and the entire difference from
      Euclidean Penrose is a single shear `r`, where true Penrose needs
      `√(2+φ)` and the discrete geometry gets `(2+φ)/2`

### 5c. Research questions from the Mosaic Chat notes
From `~/Documents/obsidian/projects/penrose/Mosaic Chat.md`. Not code work —
these are the mathematical claims worth establishing or checking against the
literature.

- [x] **Is the basis optimal? — answered. See `docs/basis-search.md`**, tool at
      `tools/basis-search.mjs`. Closure is the exact Diophantine condition
      `p = 2(q − s)`. Scored by Fourier irregularity, exhaustive to bound 64
      (5.9M closing convex bases):
      - `(4,0),(3,2),(1,4)` **is a record holder** — the best at size 4 and the
        first with usable fidelity, halving the error of the only smaller option
      - Sweet spots are real and lumpy, exactly as predicted: gains of 2.11 at
        size 4, 2.08 at 22, 1.68 at 36, against ~1.2 elsewhere
      - Every record from size 8 up belongs to one family, Lucas in x and
        Fibonacci in y: `p=2L(n−1), q=L(n), r=F(n+1), s=L(n−2), t=F(n+2)`.
        **The mosaic basis is not in it** — the family member at size 4 is 3.5×
        worse, and the systematic sequence only takes over at size 8
      - **The family plateaus at 2.0245e-3 and never converges.** It gets `q/p`
        and `s/p` exactly right (φ/2 and 1/(2φ), both in ℚ(√5)) but `r/p` and
        `t/p` wrong, because `sin 36°` and `sin 72°` are degree 4 over ℚ and
        Fibonacci/Lucas ratios generate only ℚ(√5)
      - Same obstruction as the shear in `docs/wheels.md`: x is reachable, y is
        not. No integer basis is optimal in the limit, because the target is not
        in the field the lattice can reach
- [ ] Still open: the search is exhaustive only to bound 64. A large non-family
      basis might break the plateau — it would need to approximate a degree-4
      number, so look at continued fractions of `sin 36°`
- [ ] Still open: only the pentagon is scored. Star, boat and diamond close on
      the same three vectors so should follow, but that is assumed
- [ ] **Is it a polyomino tiling?** In mosaic mode every tile is a fixed set of
      unit squares. Is the mosaic literally a tiling of ℤ² by six fixed
      polyominoes? If so that is a stronger object than a rendering
- [ ] **Literature check.** The strong claim is not "Penrose tiles on graph
      paper" but: a finite set of canonical integer-coordinate P1 prototiles
      preserving matching rules *and* substitution. Related but distinct known
      areas: rational approximants, cut-and-project lattices, de Bruijn
      pentagrids, pixel renderings, decagonal digital tilings
- [ ] **Pentagrid experiment.** A de Bruijn pentagrid built from the discrete
      directions. At any finite generation the slopes are rational, so the grid
      is periodic — a rational approximant whose period grows with generation.
      In the limit it should become genuinely aperiodic but geometrically
      distinct from the standard pentagrid, since the limiting slopes are the
      ones above rather than 36°/72°. Note the three edge lengths differ
      (4, √13, √17), so an integral dual gives ten parallelogram types rather
      than two golden rhombs. Cannot have exact lattice coordinates, equal edge
      lengths, and five rational directions simultaneously — pick two

### 5d. A "why this isn't just pixel art" page — deferred
Suggested for the published site: one page explaining why the vectors are
`(4,0), (3,2), (1,4)`, why every tile is canonical, how this differs from
rasterization, quadrille versus mosaic, and how substitution still works.

Deferred — a new page changes the look. Raise it before building.
- [ ] Only then consider restructuring `shape-modes.js` around two geometries.
      Adjacent to the penta/star refactor in `docs/PLANS.md` — a real revamp

### 5a. Generation index on penta/star/deca — back burner
Add a `+`/`-` **index** parameter to the `penta()` and `star()` calls, possibly
`deca()` too, shifting which generation of shapes is drawn relative to the
recursion depth.

This would do deliberately what the small rhombs already do **by accident**: the
small/large rhomb pair are one inflation apart only because small recurses one
level further before drawing, via a hardcoded short-circuit per size. Turning
that offset into a parameter would give generational comparison generally,
without a special case for each.

Generational comparison is on the back burner, so this is parked with it.

### 6. Wheel line diagrams — deferred
Moved to last. Cannot be done justice without revamping the measurements page.
See item 3 for the content; do it after items 4 and 5.
