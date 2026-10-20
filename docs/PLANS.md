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
use if the render list ever needs to be serialised or sent somewhere.

The measure pass is the other half of the gift. `setToMeasure()` already yields
the bounds, and the bounds *are* the `viewBox` — which is the whole reason to
want SVG here, since the figure then scales without being redrawn.

### What is actually hard: `rhombus`

Three things in `CanvasRenderer` are canvas-specific.

**The gradient.** `getGradient` builds a fresh `createLinearGradient` per
rhombus. SVG needs `<linearGradient gradientUnits="userSpaceOnUse">` in
`<defs>`, and done naively that is one def per rhombus — six figures of them at
generation 5. But a gradient varies only by fill colour, `isHeads` and rotation:
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
