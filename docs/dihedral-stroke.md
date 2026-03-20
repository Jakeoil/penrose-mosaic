# Dihedral Stroke — Design Plan

## Prompt

Every child tile has four edges. every edge has two tiles. On the rhomb  
layer. hash table based on edge hash (location?)contains minimal info on  
tiles to determine dihedral angle. when rhomb is generated, edgeTable is  
updated with face data. at end, each entry will contain 1 (outer edge) or  
two edges (inner). Proper edge strokes based on angle will be drawn after  
star/penta/deca routine ends. empty (or otherwise0 table is passed into  
star/penta/deca. Document results of planning (and opinions) in  
dihedral-stroke.md

## Goal

Replace the current `isHeads`-based heuristic for ridge/valley edge rendering
with actual dihedral angle computation, using an edge hash table built during
rhomb generation.

## Current Approach (heuristic)

`drawDihedralStroke()` in `renderers.js` uses `isHeads` to guess which edges
are ridges (thin 1px) and which are valleys (thick 2-3px). This is a local
approximation — each tile guesses its edge types without knowing its neighbors.

## Proposed Approach (edge table)

### Phase 1: Collect edges during rhomb generation

An empty edge table (hash map) is passed into `penta()`/`star()`/`deca()` at
the top-level call. As rhombs are generated at gen 0 (or gen 1 for the rhomb
layer short circuit), each rhomb registers its 4 edges in the table.

**Edge key:** Hash based on the two endpoint locations. Needs a canonical form
so that edge A→B and edge B→A resolve to the same key. Likely: sort the two
points lexicographically, then create a string key like `"x1,y1|x2,y2"`.

**Edge value:** Minimal face data needed to compute the dihedral angle:

- Tile tilt angle (thick vs thin → arctan(1/φ) vs arctan(φ))
- The "off-edge" vertex (the vertex not on this edge that determines which way
  the tile's face slopes relative to the edge)
- Or equivalently: the z-values at the edge endpoints plus the z-value of the
  opposite vertex

After generation completes, each entry contains either:

- **1 face** — boundary edge (outer edge of the tiling patch)
- **2 faces** — interior edge, dihedral angle can be computed

### Phase 2: Compute dihedral angles and render

After `penta()`/`star()`/`deca()` returns, iterate the edge table. For each
interior edge (2 faces):

- Compute the dihedral angle from the two face orientations
- If angle matches the RT dihedral → light/thin stroke
- Otherwise → thick stroke (2px)

For boundary edges (1 face): render with a default style (perhaps medium weight
or dashed to indicate incomplete information).

### Edge strokes are drawn as a separate post-pass, not inline with rhomb fill.

## Tile Geometry Reference

The golden rhombus has diagonals in ratio φ:1. For unit side length:

- Half-diagonals: p = 1/√(2+φ) ≈ 0.5257, q = φ·p ≈ 0.8507

**Thick rhomb (72°):** golden rhombus tilted around its short diagonal

- Tilt angle: arctan(1/φ) ≈ 31.72°

**Thin rhomb (36°):** golden rhombus tilted around its long diagonal

- Tilt angle: arctan(φ) ≈ 58.28°

Both tilts are complementary (sum to 90°). Both give a height span of
2/√5 ≈ 0.894 per unit edge length.

### Vertex z-levels

The Wieringa roof has 4 parallel height layers. Each vertex sits on one layer.
For a single tile: vertex 0 and vertex 2 are at opposite extremes, vertices 1
and 3 are at the mean: `z₁ = z₃ = (z₀ + z₂) / 2`.

### Dihedral angles

At each interior edge, two golden rhombus faces meet. The dihedral angle
depends on both faces' tilts relative to the shared edge. The RT dihedral
angle (≈ 116.57°? — needs verification, was previously stated as 144°) serves
as the reference: edges matching it get light strokes, others get heavy strokes.

**Open question:** What are the actual dihedral angle values on the Wieringa
roof? Need to compute these from the known tilt angles for each combination of
adjacent tile types (thick-thick, thin-thin, thick-thin).

## Opinions and Concerns

**Edge hashing on floating-point coordinates.** The vertex locations are
computed through chains of translations (`Point.tr()`). Floating-point
rounding could cause two tiles that share an edge to produce slightly different
endpoint coordinates. May need a tolerance-based hash — e.g., round coordinates
to a fixed number of decimal places before hashing.

**Rendering order.** Currently rhomb fill and stroke happen together in the
render list. The new dihedral strokes would be a separate post-pass drawn on
top of all fills. This is actually cleaner — no need to thread edge info through
the closure-based render list. But it means the edge table needs to store
screen-space coordinates (or the offset/scale to convert).

**Performance at gen 5.** A gen-5 decagon has thousands of rhombs and thus
tens of thousands of edges. The hash table should be fine for this scale, but
worth keeping an eye on.

**Point system is integer-based.** Looking at the Point class and wheel system,
coordinates may be exact integers (grid-based), which would make edge hashing
reliable without floating-point concerns. Needs verification.

**Scope.** This replaces `drawDihedralStroke()` entirely. The isHeads-based
heuristic goes away for edge rendering (though isHeads is still needed for
gradient fill direction and isogloss orientation).
