// Is the mosaic a polyomino tiling of Z^2?
//
// The research question at the bottom of TODO.md, as a repeatable measurement.
// Every mosaic tile is a fixed set of unit squares on integer coordinates, so
// the question has a mechanical answer: lay the figure into a grid, one cell per
// unit square, and count the cells claimed more than once.
//
// The answer as of 2026-10-21 is a split one, which is why it is worth a test
// rather than a paragraph. The Deca packs cleanly at every generation measured.
// Sun and Star do not: tiles of different types claim the same square, in
// one-cell-wide diagonal runs, in the interior rather than at the boundary.
//
// This is also the measurement the typographic mode needs. A character grid has
// to decide what goes in each cell, so it cannot paper over an overlap the way
// canvas does by drawing one tile on top of another. See docs/PLANS.md and
// docs/penrose.txt, which is the same thing worked by hand.

import test from "node:test";
import assert from "node:assert/strict";

const ROOT = new URL("..", import.meta.url).href;
const { penrose } = await import(ROOT + "penrose.js");
const { p, ang } = await import(ROOT + "point.js");
const { PenroseScreen } = await import(ROOT + "penrose-screen.js");

// The mosaic presentation of the discrete geometry: tiles, not outlines, and no
// rhombs. The rhombs are a separate layer and are not part of the packing claim.
const MOSAIC = {
    pentaSelected: false,
    mosaicSelected: true,
    rhombSelected: false,
    smallRhomb: true,
    treeSelected: false,
    ammannSelected: false,
};

const SEEDS = { Sun: penrose.Sun, Star: penrose.Star, Deca: penrose.Deca };

/** One character per unit square, reporting what collides. */
class CellGrid {
    constructor() {
        this.cells = new Map();
        this.overlaps = [];
        this.fractional = 0;
    }
    figure(fill, offset, shape) {
        for (const q of shape) {
            const x = offset.x + q.x, y = offset.y + q.y;
            if (!Number.isInteger(x) || !Number.isInteger(y)) this.fractional++;
            const key = `${x},${y}`;
            const prev = this.cells.get(key);
            if (prev !== undefined) this.overlaps.push({ x, y, prev, fill });
            this.cells.set(key, fill);
        }
    }
    outline() {} grid() {} line() {} rhombus() {}
    render(list) { for (const item of list) item(this); }
}

function audit(type, gen) {
    const scene = new PenroseScreen("discrete");
    scene.overlays = MOSAIC;
    scene.penta({ type, gen, isHeads: true, angle: ang(0, false), loc: p(0, 0) });
    const grid = new CellGrid();
    grid.render(scene.bounds.renderList);
    const b = scene.bounds;
    return {
        grid,
        cells: grid.cells.size,
        overlaps: grid.overlaps.length,
        conflicts: grid.overlaps.filter((o) => o.prev !== o.fill).length,
        width: Math.round(b.maxPoint.x - b.minPoint.x) + 1,
        height: Math.round(b.maxPoint.y - b.minPoint.y) + 1,
    };
}

test("every mosaic cell lands on an exact integer", () => {
    // The claim the whole typographic idea rests on. One character per unit
    // square is an encoding, not a rasterization, only if this holds.
    for (const [name, type] of Object.entries(SEEDS))
        for (const gen of [1, 2, 3, 4]) {
            const { grid } = audit(type, gen);
            assert.equal(grid.fractional, 0, `${name} generation ${gen}`);
        }
});

test("the Deca is a clean packing at every generation measured", () => {
    for (const gen of [1, 2, 3, 4]) {
        const { overlaps } = audit(penrose.Deca, gen);
        assert.equal(overlaps, 0, `Deca generation ${gen} has ${overlaps} overlapping cells`);
    }
});

test("Sun and Star overlap, and the counts are the ones recorded", () => {
    // If these change, the geometry changed. Raise it rather than updating the
    // numbers: the polyomino question in TODO.md turns on them.
    const want = {
        Sun: [20, 84, 340, 1364],
        Star: [22, 86, 342, 1366],
    };
    for (const [name, counts] of Object.entries(want))
        counts.forEach((n, i) => {
            const gen = i + 1;
            assert.equal(audit(SEEDS[name], gen).overlaps, n,
                         `${name} generation ${gen}`);
        });
});

test("the overlaps are between different tile types, not a tile drawn twice", () => {
    // A duplicate draw of the same tile would be harmless -- the same color
    // landing in the same cell. These are not that.
    for (const [name, type] of [["Sun", penrose.Sun], ["Star", penrose.Star]])
        for (const gen of [1, 2, 3]) {
            const { overlaps, conflicts } = audit(type, gen);
            assert.ok(conflicts > 0, `${name} generation ${gen}`);
            // Almost every one is a color conflict; at generation 1 all of them are.
            assert.ok(conflicts >= overlaps - 2,
                      `${name} generation ${gen}: ${conflicts} of ${overlaps} conflict`);
        }
});

test("the overlaps are interior seams, not a boundary artifact", () => {
    // Diagonal runs well inside the figure. A boundary effect would sit at the
    // outer radius; these start at less than half of it.
    const { grid, width } = audit(penrose.Sun, 1);
    const radii = grid.overlaps.map((o) => Math.hypot(o.x, o.y));
    assert.ok(Math.min(...radii) < width / 4,
              `nearest overlap at ${Math.min(...radii)}, figure is ${width} across`);
    assert.ok(Math.max(...radii) < width, "and none is outside the figure");
});

test("the overlapping fraction falls as the figure grows", () => {
    // The encouraging part, and the reason this reads as a seam thinning out
    // rather than a structural failure: overlaps grow about fourfold per
    // generation while cells grow about sevenfold, so the ratio roughly halves.
    for (const [name, type] of [["Sun", penrose.Sun], ["Star", penrose.Star]]) {
        const ratios = [1, 2, 3, 4].map((gen) => {
            const { overlaps, cells } = audit(type, gen);
            return overlaps / cells;
        });
        for (let i = 1; i < ratios.length; i++)
            assert.ok(ratios[i] < ratios[i - 1],
                      `${name}: ratio rose from ${ratios[i - 1]} to ${ratios[i]}`);
        // Measured: Sun 4.5% -> 2.8% -> 1.6% -> 1.0%, Star 5.9% -> 3.2% -> 1.8%
        // -> 1.0%. The claim is the shape of that, so assert the shape: it
        // starts small and loses most of itself over three generations.
        assert.ok(ratios[0] < 0.07, `${name} generation 1 ratio ${ratios[0]}`);
        assert.ok(ratios[3] < ratios[0] / 3,
                  `${name}: ${ratios[0]} to ${ratios[3]} is not most of the way down`);
    }
});

test("cell counts and grid extents, as measured", () => {
    // What a .txt export would be: these widths are characters at one per
    // square, and twice that at the two-per-square spelling docs/penrose.txt uses.
    const want = {
        //        gen  cells  width height
        Sun: [[1, 440, 27, 27], [2, 3024, 69, 69], [3, 20784, 179, 179]],
        Star: [[1, 372, 25, 25], [2, 2726, 67, 70], [3, 19378, 177, 184]],
        Deca: [[1, 116, 13, 13], [2, 840, 35, 37], [3, 5936, 93, 101]],
    };
    for (const [name, rows] of Object.entries(want))
        for (const [gen, cells, width, height] of rows) {
            const got = audit(SEEDS[name], gen);
            const at = `${name} generation ${gen}`;
            assert.equal(got.cells, cells, `${at} cells`);
            assert.equal(got.width, width, `${at} width`);
            assert.equal(got.height, height, `${at} height`);
        }
});

test("the figure fills about three fifths of its bounding box", () => {
    // A decagon in a square, roughly. Worth pinning as a sanity bound: a big
    // move here means tiles went missing or doubled.
    for (const [name, type] of Object.entries(SEEDS))
        for (const gen of [2, 3]) {
            const { cells, width, height } = audit(type, gen);
            const fill = cells / (width * height);
            assert.ok(fill > 0.55 && fill < 0.7,
                      `${name} generation ${gen} fills ${(fill * 100).toFixed(1)}%`);
        }
});
