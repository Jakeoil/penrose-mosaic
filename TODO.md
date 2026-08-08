# Penrose Mosaic — TODO

## Ground rule

**Do not change the look of this program.** Fixes are behavior-only. Correcting a
dangling `for=` so a label finally reaches its checkbox is fine; changing fonts,
colors, spacing, adding or removing visible controls, or rearranging a page is
not — not even as a small improvement alongside an approved change. Console
logging, internal renames and selector corrections do not count. If a fix
genuinely needs a visible change, ask first.

## The hazard to know about

Every recursive call in `penrose-screen.js` spreads `...options` **last**:

    this.penta({ type: penrose.Pe3, angle, ..., ...options });

So any stray key riding in `options` silently overrides the explicit argument of
the same name, all the way down the recursion. This corrupted the figures once
already, at generation 4 and beyond, and took a long time to find because the
composites were correct in isolation — only the page's call path was wrong.

**Per-figure settings must be named parameters**, or swallowed at the top of
every method that forwards options. `deca()`, `sun()` and `starPatch()` swallow
`type` for exactly this reason. Per-scene state goes on the scene instead —
`PenroseScreen.overlays` is the model.

## Where things are written down

- `docs/wheels.md` — the two geometries, three stored rotations, the four wheels,
  the substitution matrices and the closed-form limiting slopes
- `docs/basis-search.md` — whether `(4,0),(3,2),(1,4)` is optimal
- `docs/rhomb-groups.md` — large vs small rhomb groups, Sun/Star naming, MLD
- `docs/PLANS.md` — the penta/star refactor, the isHeads propagation table
- `tools/stamp.mjs` — run after changing any script; the stamp shows on hover
  over `defaults`. Check it before debugging a change that "did nothing"
- `tools/basis-search.mjs` — `node tools/basis-search.mjs 64`

---

## Open

### A. Wheel line diagrams — deferred to last
Small figures showing the line each wheel represents, left of its table on the
measurements page. P is the distance between pentagon centers, S pentagon corner
to star (`pgon.R + pgram.R`), T star center to boat center
(`2 x (pgram.R + pgram.y)`), D pentagon center to corner (`pgon.r`).

Deferred because it cannot be done justice without revamping the measurements
page. Decide first whether the diagrams are schematic — two dots, a line, a
label, a legend — or real renderings through `PenroseScreen`.

### B. Large and small rhombs as independent flags
They share one flag today, so they cannot be shown together from the sidebar.
Default is **small**. Doing it properly means a second flag and a second call to
the rhomb layer on every page that draws rhombs, the way the Sun/Star page
already does it by flipping `smallRhomb` between calls.

### C0. Sun/Star viewports — panning
The two panels are fixed viewports now: one shared scale, each centred on its own
seed, scale written upper left. Wheel zooms both together, double click refits.
The fit is recomputed every draw and only the zoom persists, so changing shape or
generation refits by itself.

- [ ] **Panning is not implemented.** Centre is fixed on the seed. When it is
      added it has to stay synchronous between the two panels, like the zoom

### C. The P1 over P3 overlay
The geometry is all there — pentas and stars plus big rhombs on the Sun/Star
page is the configuration. What is missing is styling: the rhombs need no fill
and a stroke that reads against the pentagons, or they cover them. Check whether
the sidebar can already express that before adding anything.

### D. Untangle the sidebar's overlay controls
Still two switches in series in places. The Sun/Star page owns its overlays via
`PenroseScreen.overlays`; the sidebar has not been given the same treatment.

### E. Restructure `shape-modes.js` around two geometries
`Real`, `Quadrille`, `Mosaic` and `Typographic` are still four peer classes,
though the mathematics has two geometries and mosaic is a presentation. Adjacent
to the penta/star refactor in `docs/PLANS.md`. The big one.

### F. Research questions
From `~/Documents/obsidian/projects/penrose/Mosaic Chat.md`. Not code work.

- **Is the mosaic literally a polyomino tiling?** Every tile is a fixed set of
  unit squares, so is it a tiling of Z^2 by six fixed polyominoes?
- **Literature check.** The strong claim: a finite set of canonical
  integer-coordinate P1 prototiles preserving matching rules *and* substitution,
  whose inflation converges to a degree-2 geometry rather than to Euclidean
  Penrose. That last clause is the distinguishing part
- **Pentagrid experiment.** Brief written up at `pentagrid/RESEARCH.md`
- **Basis search** is exhaustive only to bound 64, and scores the pentagon only.
  Star, boat and diamond close on the same three vectors so should follow
- `S` follows the same second-order law as the other wheels but its cross-wheel
  difference is `S(n+1) = S(n) + 2P(n) - P(n-1)`. Is there a tidier statement
- A **"why this isn't just pixel art"** page for the site: why those vectors, why
  every tile is canonical, how this differs from rasterization, quadrille versus
  mosaic, how substitution still works. Deferred — a new page changes the look

---

## Done

- **Small rhombs** work on the expansion pages. Both pages hardcoded
  `layer = "dual"` and never drew the rhomb layer at all
- **Sun, Star and Queen** are real composites, verified against the rhomb counts
  in the small rhomb groups: 55, 35 and 10. Queen is the deca. They are in the
  sidebar shape type list, so every page can show them
- **Two geometries**, `[discrete, real]`, discrete default, opening on the
  Mosaic. Mosaic is a presentation reached through its overlay flag, not a mode.
  That removed the short-circuit which made "pentas and stars" dead in one mode
  and live in another
- **Mosaic styles** — fill none/solid/transparent, border none/grid/outline.
  Outline is the exact silhouette: an edge shared by two squares is interior, so
  the edges appearing once are the boundary
- **The example shapes no longer bounce.** Height pinned from a measurement with
  every layer on, figure nailed to the bottom, width hugging content
- **`line()` bounds** were `loc+loc` and `loc+end`, so every segment claimed
  twice its extent. Ammann bars nearly doubled any figure showing them
- **Dual layer removed** — checkbox, layer, `pentaDual`,
  `drawDualRhombusPattern`, `drawDualDemo` and its orphan page. The
  `goThickDual`/`thinDualRhomb` shape math is kept: it is a separate geometry off
  the p and s wheels and may be a genuine dual
- **Measurements page** — tables follow the mode; the decagon figures do too now
  that mosaic is not a mode. The intermittent stale-table bug was cookie expiry
  plus a fallback in `ShapeMode.reset()`, both fixed, and the diagnostics are out
- **The mathematics** — `docs/wheels.md` and `docs/basis-search.md`. The mosaic
  is not a rational approximant; it generates its own irrational geometry
- Dead math retired: `interpolateShape`, `makeShapeWheels`, `compare`,
  `shapeWheelTests`

## Sharp edges found along the way

- `Bounds.pad()` sets empty bounds to `(0,0)`, so `isEmpty` reads false
  afterwards. Check emptiness **before** padding
- `resizeAndRender` used to return on empty bounds before clearing, leaving the
  previous frame on screen. Any "turn everything off" control would have looked
  broken
- `PentaStyle` has no null guard on its elements, unlike every other control. It
  throws if `#penta-fill` is absent
- Page identity lives in three places that must agree — the button's `data-id`,
  the page div's `id`, and the id passed to the draw function in `math.js`.
  `PageNavigation.checkWiring()` reports mismatches
- `PageNavigation` remembers the active page by button **position**, so inserting
  a button shifts every index after it
- Canvas area: Sun and Star at generation 5 come out near 25MP, past Safari's
  ~4096px cap. Queen at generation 5 is fine
