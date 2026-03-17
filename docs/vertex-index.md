# Vertex Index (Wieringa Roof Height)

## Background

Every vertex of a Penrose rhomb tiling has an **index** n = ΣK_j ∈ {1, 2, 3, 4},
the sum of its K-tuple from de Bruijn's pentagrid construction. This index equals
the height of the **Wieringa roof** at that vertex (in units of ½, so physical
heights are ½, 1, 3/2, 2).

The project already tracks `isHeads` — the relative high/low orientation of each
rhomb. This tells us the *direction* of the height gradient across a tile
(v0 high → v2 low, or vice versa), but not the *absolute* height level.

## Goal

Compute and display the absolute vertex index (1–4) for every rhomb vertex in the
tiling. This enables:

- Labeling vertices with their Wieringa height
- Coloring vertices or tiles by index
- Verifying the isHeads/gradient rendering against ground truth
- Foundation for future 3D Wieringa roof visualization

## Approach: Propagation from a Seed

Since the project uses **recursive deflation** (not de Bruijn grids), we don't
have K-tuples directly. But the index has a simple local property:

> Across any rhomb edge, the index changes by exactly ±1.

Combined with `isHeads` (which tells us which diagonal is the high→low axis), we
can determine the relative index of all four vertices of every rhomb, then
propagate absolute values across shared edges.

### Algorithm

1. **Collect vertices**: During the render pass (or a separate analysis pass),
   build a vertex registry keyed by rounded (x, y) position. Each vertex entry
   accumulates the rhombs that share it.

2. **Determine relative heights per rhomb**: For a rhomb with vertices
   [v0, v1, v2, v3]:
   - `isHeads=true`: v0 is highest, v2 is lowest.
     Heights relative to v0: v0=0, v1=-1, v2=-2, v3=-1
     (thick rhomb) or v0=0, v1=-1, v2=-2, v3=-1 (thin rhomb — same pattern,
     the 4 vertices of any rhomb span exactly 2 index levels).
   - `isHeads=false`: v2 is highest, v0 is lowest. Reverse the above.

3. **Seed one vertex**: Pick a known vertex (e.g. the center of a star/sun
   configuration has index 4, the center of a decagon might be deterministic).
   Alternatively, use the constraint that indices are in {1,2,3,4} and that a
   5-fold star center must be index 4 (or 1 for an inverted star).

4. **Flood-fill propagation**: BFS/DFS from the seed vertex. For each rhomb
   touching a vertex with known index, compute the indices of the other 3
   vertices. Continue until all vertices are labeled.

5. **Verify consistency**: Every vertex should get a unique index in {1,2,3,4}.
   If a vertex is reached from multiple rhombs, the indices must agree.

### Seed Determination

For the standard sun/star tiling (5-fold symmetric, `St5` at center):
- The star center vertex has all 5 grid lines meeting → index = **4** (or 1,
  depending on orientation convention and γ values).
- With `isHeads` known for the central star's rhombs, propagation gives all
  other vertices.

For pentagon-centered tilings (`Pe5` at center):
- Need to determine the central vertex index. Could compute it from the
  deflation structure or try all 4 values and check for consistency.

## Implementation Plan

### Phase 1: Vertex Registry

Add a vertex collection pass that runs after tile expansion:

```javascript
// Map from "x,y" key → { index: null, rhombs: [...] }
const vertexMap = new Map();

function registerRhombVertices(offset, shape, isHeads) {
    const verts = shape.map(p => offset.tr(p));
    // round coords, register each vertex, link to this rhomb
}
```

Hook this into the rhomb rendering path (or add a parallel analysis pass).

### Phase 2: Index Propagation

```javascript
function propagateIndices(seedKey, seedIndex) {
    const queue = [seedKey];
    vertexMap.get(seedKey).index = seedIndex;
    while (queue.length > 0) {
        // For each rhomb touching this vertex,
        // compute other vertices' indices from isHeads
        // Enqueue newly labeled vertices
    }
}
```

### Phase 3: Display

- **Vertex dots** colored by index (4 colors for heights 1–4)
- **Vertex labels** showing the index number
- **Optional**: color rhombs by average vertex index or by peak vertex index
- Toggle in the UI (overlay checkbox)

### Phase 4: Validation

- Confirm all indices land in {1, 2, 3, 4}
- Confirm Σ(index) statistics match expected distribution
- Cross-check: adjacent vertices always differ by exactly 1
- Compare gradient direction (isHeads) against computed index direction

## Open Questions

- **Coordinate precision**: Vertex deduplication needs a tolerance for
  floating-point matching. What precision does the existing Point class provide?
  The Quadrille/Mosaic modes use integers, so exact matching works there.
  Real mode needs epsilon-based rounding.

- **Seed convention**: Which index (1 or 4) for a star center? This depends on
  the γ convention. Either works as long as it's consistent. The gradient
  rendering (white = high, dark = low) suggests `isHeads=true` → v0 is high →
  v0 should get the higher index.

- **Where to hook in**: The render list is currently fire-and-forget function
  closures. The vertex registry needs access to (offset, shape, isHeads) before
  or during rendering. Options:
  - Add a pre-render analysis pass that mirrors the recursion
  - Capture vertex data inside the existing render closures
  - Add a second render list for analysis items

- **Performance**: For high generation counts, vertex count grows fast. The
  propagation is O(V + E) which should be fine, but the vertex map needs
  efficient lookup.
