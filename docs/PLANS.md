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
