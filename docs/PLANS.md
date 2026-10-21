# Penrose Mosaic — Plans

## Origins

This program was originally written to express the **P3 Mosaic** — Penrose tilings
rendered as square pixel tiles on a grid. Related modes:

- **Quadrille** — vector outlines on graph paper
- **Typographic** — ASCII art / block characters (future)
- **Real** — true five-fold symmetric rendering

These square-ruled approximations of five-fold symmetry are prototyped in the
Grid work test area.

---

## Refactoring: penta/star decomposition

The `penta()` and `star()` methods in `penrose-screen.js` have grown unwieldy.
They interleave:

- Recursive tile decomposition (pure math: child types, angles, positions)
- Layer routing (penta, rhomb, dual)
- Overlay logic (tree lines, Ammann bars)
- Mode switching (P1 vs P3, Mosaic vs Real)
- Rhomb decoration (fill, gradient, isogloss, dihedral stroke)

Every new feature adds more conditionals to an already dense recursive core.

### Possible directions

- **Separate recursion from rendering** — the recursive decomposition is clean
  math. Rendering decisions could be pulled out into a second pass.
- **Visitor/strategy pattern** — the recursion walks the tile tree, a renderer
  object decides what to draw at each node based on mode/layer/overlays.
- **Mode-specific renderers** — dispatch to different renderer objects instead of
  branching on P1/P3, Mosaic/Real inside the recursion.

This is a big refactor. Think through the approach carefully before touching anything.

---

## Rendering with SVG

Toyed with 2026-10-20, not started. The question was whether an SVG renderer is
practical for the penta/star figures. It is, for the generations those pages
actually use, and the architecture already has the seam for it.

### The seam is already there

`bounds.renderList` does not hold data, it holds closures that take a renderer:

    const f = (r) => r.outline(fill, loc, shape);
    bounds.renderList.push(f);

and `CanvasRenderer.render()` is just `item(this)`. That is double dispatch with
the renderer injected, so a second renderer drops in **without touching
`penrose-screen.js`**. The whole interface is five methods:

| Method                                              | SVG equivalent                | Work     |
| --------------------------------------------------- | ----------------------------- | -------- |
| `outline(fill, offset, shape)`                      | `<polygon>`                   | trivial  |
| `line(loc, end, strokeStyle)`                       | `<line>`                      | trivial  |
| `grid(offset, size)`                                | `<pattern>`, or rects + axes  | trivial  |
| `figure(fill, offset, shape)`                       | one `<path>`                  | easy     |
| `rhombus(fill, offset, shape, strokeStyle, isHeads)`| see below                     | the work |

`figure` is actually nicer in SVG than in canvas: the silhouette dedup in
`CanvasRenderer.figure` already computes exactly the edge set a single `<path>`
wants.

`USE_FUNCTION_LIST` leaves a second route open. With it false the list holds
`{command, ...}` objects and `render2` dispatches on them, which is the form to
use if the render list ever needs to be serialized or sent somewhere.

The measure pass is the other half of the gift. `setToMeasure()` already yields
the bounds, and the bounds *are* the `viewBox` — which is the whole reason to
want SVG here, since the figure then scales without being redrawn.

### What is actually hard: `rhombus`

Three things in `CanvasRenderer` are canvas-specific.

**The gradient.** `getGradient` builds a fresh `createLinearGradient` per
rhombus. SVG needs `<linearGradient gradientUnits="userSpaceOnUse">` in
`<defs>`, and done naively that is one def per rhombus — six figures of them at
generation 5. But a gradient varies only by fill color, `isHeads` and rotation:
6 × 2 × 10 = **120 distinct defs**, referenced by id. Bounded, and a one-time
cost, but it is the bulk of the effort.

**The isogloss clip.** `drawIsogloss` clips to the rhombus, which in SVG would
mean a `<clipPath>` per rhombus and the same multiplication. It is very likely
unnecessary: `left` and `right` are interpolated *along the rhombus edges*, so
both endpoints lie on the boundary, and a segment between two boundary points of
a convex polygon stays inside it. The clip only trims half a line width near the
corners. Check that before building clip paths — if it holds, isogloss is seven
plain `<line>`s.

**`fill + "80"`.** The 8-digit hex works in current browsers, but `fill-opacity`
is the native SVG spelling.

### The limit is node count

Render-list entries for one figure, real geometry, counted 2026-10-20. Growth is
about 6.8× per generation.

|             |  g1 |  g2 |   g3 |     g4 |      g5 |
| ----------- | --: | --: | ---: | -----: | ------: |
| Sun penta   |  21 | 136 |  911 |  6,201 |  42,376 |
| Sun rhomb   |  55 | 365 | 2,440 | 16,475 | 111,925 |
| Star penta  |  16 | 121 |  851 |  5,906 |  40,761 |
| Star rhomb  |  35 | 280 | 2,075 | 14,845 | 104,240 |
| Queen penta |   6 |  36 |  256 |  1,786 |  12,356 |
| Queen rhomb |  10 |  80 |  610 |  4,430 |  31,360 |

The Sun/Star page defaults to generation 2 — a few hundred nodes, nothing at all.
Generation 3 is a couple of thousand and still comfortable. Generation 5 is
40k–112k nodes, a 5–10MB document and a sluggish DOM. And the note in
`bounds.js` about `push(...)` breaking down "somewhere over a million" says the
deep pages are far outside anything SVG should be asked to hold.

So the shape of it: **a second renderer, not a replacement.** Canvas keeps the
deep expansions. SVG serves Sun/Star, which is exactly the small-generation,
look-closely-at-the-geometry page, and it brings real file export for print —
which for a program whose output is figures about geometry is probably the
actual prize, ahead of anything on screen.

### Do this first

`CanvasRenderer` reads `globals.pentaStyle`, `globals.rhombStyle` and
`globals.mosaicStyle` straight out of module state inside its methods. A second
renderer would inherit that coupling, and it is already wrong for Sun/Star,
which deliberately ignores the sidebar and states every flag itself. Passing the
styles in rather than reading globals is a small change, and it is the same move
the refactor section above asks for — separate the recursion from the rendering.

Against the ground rule at the top of `TODO.md` — do not change the look — this
wants to be a toggle, with the SVG output pixel-compared against canvas, not a
swap.

---

## The core as a library

Assessed 2026-10-20, not started. The question was whether other projects could
import this from GitHub. They could, and less work stands in the way than the
closure design suggests — the coupling that matters is the module globals, not
the closures.

Everything below was measured by standing up a pretend outside consumer: plain
node, no DOM, no canvas, no globals.

### The closures are the asset

A consumer supplies its own renderer and replays the list:

    class TallyRenderer {
      outline(fill) { ... }  figure(fill) { ... }  grid() { ... }
      line() { ... }         rhombus(fill) { ... }
      render(list) { for (const item of list) item(this); }
    }

    const s = new PenroseScreen("real");
    s.overlays = { pentaSelected: true, ... };
    s.penta({ type: penrose.Star, angle: ang(0, false), isHeads: true,
              loc: p(0, 0), gen: 3 });
    new TallyRenderer().render(s.bounds.renderList);

That yielded 851 outline commands, the three default fills, and bounds of
±93.96 by −89.88/+98.79, with nothing from the browser involved. So the render
list is renderer-agnostic drawing commands, and the five-method interface is the
whole API surface a target needs. Most tiling libraries hand over vertex arrays
and leave the hard part — which tile, what parity, what color — to the caller.
This hands over the decisions.

The cost is that the list can only be replayed, not inspected or serialized.
`USE_FUNCTION_LIST = false` already switches it to `{command, ...}` objects
dispatched by `render2`, so both shapes exist. Documenting that flag answers the
objection.

### What already works

Every geometry module imports in plain node with no stubs at all: `point.js`,
`wheels.js`, `shape-modes.js`, `penrose.js`, `bounds.js`, `penrose-screen.js`,
and `renderers.js` too. Every `document` touch is deferred into a control
constructor and `controls.js` runs none at module scope. That is normally what
kills a browser project as a library. Import costs 15ms and 4.2MB of heap.

`pColor` falls back to `type.defaultColor` when `globals.shapeColors` is absent,
which is why the consumer above got the real palette.

### What blocks it

**`scene.overlays` is a required input that throws.** `activeOverlays` is
`this.overlays || globals.overlays || measureTaskGlobals.overlays`, so omitting
it fails deep in the recursion with

    TypeError: Cannot read properties of undefined (reading 'pentaSelected')

which is the first thing any new user would hit. Defaulting the getter to an
all-on literal fixes it and retires the globals fallback at the same time.

**The globals reads.** Three in `penrose-screen.js` (`pColor`, and the
`activeOverlays` fallback) and four in `renderers.js` (`figure`, `outline`, and
`rhombus`). Few enough to be an afternoon. The real objection is that they read
a mutable module singleton, so two consumers on one page cannot hold different
settings.

**`CanvasRenderer.rhombus` requires globals, inconsistently.** `figure` guards
with `mosaicStyle ? ... : "solid"` and `outline` with `!pentaStyle || ...`, but
`rhombus` reads `rhombStyle.fill` bare. So the one method a consumer most wants
is the only one that throws without a DOM-built control object. Give it the same
guard shape as its siblings.

**`penrose` is a mutable singleton** carrying both the type data and the mode
shape tables (`penrose.real`, `penrose.discrete`). Workable, but it means one
tiling configuration per page.

**Packaging.** No `package.json`, no `LICENSE`, no entry point, no API doc. ESM
straight from GitHub works today, but without a manifest there is no name,
version or `exports` map, and without a license nobody may legally use it.

**No runnable tests.** `testBounds()`, `testLerp()` and `testAngle()` all exist
with their call sites commented out, and the verified isHeads table further down
this file is asking to be executable.

### The split

Two entry points, one repo:

- **core** — `point.js`, `wheels.js`, `shape-modes.js`, `penrose.js`,
  `bounds.js`, `penrose-screen.js`. About 2,700 lines, no DOM. Needs the
  overlays default and the globals reads gone, nothing else.
- **render-canvas** — `renderers.js`, with styles injected rather than read.
- **app** — `controls/`, `renderings.js`, `math.js`, `index.html`. Stays here.

This is the same change the refactor section above asks for, and the same
prerequisite the SVG section lists. Three independent reasons landing on one
refactor is a good sign it is the right one.

### Whether it is worth it

The audience is narrow but underserved. Nearly every Penrose library does P3
rhombs or de Bruijn; this does P1 — pentagon, star, boat, diamond — with correct
inflation and parity. And the discrete integer-grid geometry is original, per
`docs/wheels.md`: it generates its own geometry rather than converging on
Euclidean Penrose. The closure condition `p = 2(q − s)` and the closed-form
limiting slopes are the novel content, and that is arguably a paper before it is
a package.

So the realistic pull is this project's own future work plus a small number of
tiling people. The refactor is worth doing for the first reason alone.

### The plan: `lib/penrose-mosaic.js`

Settled 2026-10-21. Expose the construction code as browser-compatible ES
modules under `lib/`, importable by sibling projects locally and from this
repo's Pages URL, **without changing what the application does**.

    // local, from a sibling project
    import { star } from "../penrose-mosaic/lib/penrose-mosaic.js";

    // published
    import { star } from "https://jakeoil.github.io/penrose-mosaic/lib/penrose-mosaic.js";

The hosting is already in place and needs nothing: Pages serves
`penrose-screen.js` as `application/javascript` with
`access-control-allow-origin: *`, checked 2026-10-21. There is no build step
here, which for once is the easy case — the modules are already plain ESM and
already import in node with no DOM.

**Why a facade rather than importing the modules directly.** One file naming
what is public pins the surface, so the internal layout stays free to move --
which it will, since `shape-modes.js` is still four peer classes and the
penta/star refactor is still ahead. Consumers never learn that `penta()` lives
on a scene object.

It also solves the first blocker for free. `scene.overlays` is a required input
that throws when omitted; a convenience function supplies it, so nothing in
`PenroseScreen` has to change for the library to be usable. Two layers:

- **primitives, re-exported as they are** — `PenroseScreen`, `penrose`, `p`,
  `ang`, `Bounds`. No new API, no wrapping.
- **convenience builders** — `star()`, `penta()`, `queen()`, taking
  `{ gen, mode, orient, layers }` and returning the render list and bounds, with
  overlays defaulted. This is the shape the example above implies, and it is
  where defaults live so the primitives stay honest.

**Tests first, before any of it.** Landed 2026-10-21: 47 of them across
`tools/geometry.test.mjs`, `tools/scene.test.mjs`, `tools/mosaic.test.mjs` and
`tools/spelling.test.mjs`, run by `npm test`. The point is to capture current
behavior while it is still current, so the refactor has something to be checked
against.
Golden values over the core: the measured extents, the render-list counts, the
overlap audit per figure and generation. Node, no DOM, no new dependency --
`node --test`, as the pentagrid does with its own suites.

**Then the three compatible fixes**, each an added fallback rather than a
removed path, so the legacy pages are untouched by construction:

| change                                              | effect on the pages |
| --------------------------------------------------- | ------------------- |
| default the `overlays` getter                       | none -- only the case that throws today |
| guard `rhombus` as `figure` and `outline` already are | none -- same |
| styles injected, falling back to `globals`          | none -- the sidebar keeps working |

**Then point the pentagrid at it.** `tools/bootstrap.test.mjs` transcribes this
project's values by hand and says so in its header; `discrete.test.mjs` asserts
against the same snapshot. Those become imports, and the oracle stops being a
copy that can go stale.

**What does not change.** `index.html`, `measurements.html` and `cookies.html`
stay exactly as they are -- that is the ground rule, and the whole reason the
fixes above are additive. New test pages are additive too: root-level HTML
files, the way the pentagrid keeps `grow.html`, `method.html` and the rest
beside one `src/`. They need no branch, because a new file cannot disturb an old
page, and the Sun/Star page already showed a page can ignore the sidebar and own
its own overlays.

One borrowed item: `tools/spelling.test.mjs` in the pentagrid is 73
self-contained lines, written because the rule "lived only in a note and nothing
checked it" and 204 British forms had drifted in across 28 files. This repo just
repeated that, 37 forms across seven files. Copy it with the first test.

**Known limitation.** A Pages URL tracks `main`, so a change here can change a
consumer. The pentagrid's `MODULES.md` already says this about its own modules,
and the answer is the same: copy the files for anything that must not move. The
golden tests are what make the untracked case tolerable.

---

## New chapter: 3D Penrose Surfaces

The isogloss and gradient rendering of rhombs is beautiful — it makes the
corrugated 3D surface visible in 2D. This deserves its own project, expanding
into real 3D visualization. Possible topics:

- **Real 3D rendering** — WebGL or Three.js rendering of the corrugated surface
  with proper lighting and shading
- **Rhombic triacontahedron** — interactive 3D model showing decomposition into
  prolate and oblate golden rhombohedra
- **5D → 2D projection** — visualizing the de Bruijn construction, showing how
  the 2D tiling emerges from a slice through 5D space
- **Penrose stairs** — the impossible staircase illusion that emerges from the
  elevation structure of the tiling
- **Shading and materials** — realistic surface rendering with ridge/valley
  lighting based on the dihedral angles (144° / 216°)

---

## isHeads propagation rules (verified)

For reference, the correct isHeads rules across all three expansion methods:

| Method  | Child             | isHeads rule        | Class logic            |
| ------- | ----------------- | ------------------- | ---------------------- |
| penta() | central Pe5       | `!isHeads` (invert) | same class → invert    |
| penta() | surrounding Pe3/1 | `!isHeads` (invert) | same class → invert    |
| penta() | St1 diamonds      | `isHeads` (keep)    | different class → keep |
| star()  | central St5       | `isHeads` (keep)    | central → keep         |
| star()  | Pe1 tips          | `isHeads` (keep)    | different class → keep |
| star()  | St3 boats         | `!isHeads` (invert) | same class → invert    |
| deca()  | central Pe3       | `!isHeads` (invert) | penta-type → invert    |
| deca()  | St1 diamonds      | `isHeads` (keep)    | star-type → keep       |
| deca()  | Pe1 pentagons     | `!isHeads` (invert) | penta-type → invert    |
| deca()  | St3 boat          | `isHeads` (keep)    | star-type → keep       |
