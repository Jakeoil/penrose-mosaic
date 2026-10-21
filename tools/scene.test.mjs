// What the recursion actually builds: command counts, extents, colors, parity.
//
// Golden values measured 2026-10-21. The render list is the product of this
// program -- everything on screen is a replay of it -- so pinning its size and
// the box it fills is the cheapest way to know a refactor changed nothing.
//
// The scene is driven exactly the way an outside consumer would drive it, with
// overlays stated rather than read from globals, because that is the shape the
// lib/ facade will expose. See docs/PLANS.md.

import test from "node:test";
import assert from "node:assert/strict";

const ROOT = new URL("..", import.meta.url).href;
const { penrose } = await import(ROOT + "penrose.js");
const { p, ang } = await import(ROOT + "point.js");
const { PenroseScreen } = await import(ROOT + "penrose-screen.js");

// Every flag on. The panel filters by choosing which calls to make, not by
// turning these off -- that is how the Sun/Star page does it.
const ALL_ON = {
    pentaSelected: true,
    rhombSelected: true,
    smallRhomb: true,
    mosaicSelected: false,
    treeSelected: false,
    ammannSelected: false,
};

const SEEDS = { Sun: penrose.Sun, Star: penrose.Star, Deca: penrose.Deca };

function build({ type, gen, mode = "real", layer, overlays = ALL_ON, measure = false, isHeads = true }) {
    const scene = new PenroseScreen(mode);
    if (measure) scene.setToMeasure();
    scene.overlays = overlays;
    scene.penta({
        type, gen, isHeads,
        angle: ang(0, false),
        loc: p(0, 0),
        ...(layer ? { layer } : {}),
    });
    return scene;
}

/** Replays the list into a tally. This is the whole renderer contract. */
class Tally {
    constructor() {
        this.commands = { outline: 0, figure: 0, grid: 0, line: 0, rhombus: 0 };
        this.fills = new Map();
        this.heads = 0;
        this.tails = 0;
    }
    bump(name, fill) {
        this.commands[name]++;
        if (fill) this.fills.set(fill, (this.fills.get(fill) || 0) + 1);
    }
    outline(fill) { this.bump("outline", fill); }
    figure(fill) { this.bump("figure", fill); }
    grid() { this.bump("grid"); }
    line() { this.bump("line"); }
    rhombus(fill, offset, shape, strokeStyle, isHeads) {
        this.bump("rhombus", fill);
        isHeads ? this.heads++ : this.tails++;
    }
    render(list) { for (const item of list) item(this); }
}

test("a consumer can drive the scene with its own renderer and no DOM", () => {
    const tally = new Tally();
    tally.render(build({ type: penrose.Star, gen: 3 }).bounds.renderList);
    assert.equal(tally.commands.outline, 851);
    assert.equal(tally.commands.rhombus, 0, "penta layer draws no rhombs");
    // Colors come from type.defaultColor, since there is no globals.shapeColors.
    assert.deepEqual([...tally.fills.keys()].sort(), ["#0000ff", "#e46c0a", "#ffff00"]);
});

test("the render list is closures, replayable into any renderer", () => {
    const list = build({ type: penrose.Sun, gen: 2 }).bounds.renderList;
    assert.equal(list.length, 136);
    for (const item of list) assert.equal(typeof item, "function");
    // Replaying twice gives the same counts: the list holds no state.
    const a = new Tally(), b = new Tally();
    a.render(list); b.render(list);
    assert.deepEqual(a.commands, b.commands);
});

test("penta-layer command counts, real geometry", () => {
    const want = {
        Sun: [21, 136, 911, 6201, 42376],
        Star: [16, 121, 851, 5906, 40761],
        Deca: [6, 36, 256, 1786, 12356],
    };
    for (const [name, counts] of Object.entries(want))
        counts.forEach((n, i) => {
            const gen = i + 1;
            assert.equal(build({ type: SEEDS[name], gen }).bounds.renderList.length, n,
                         `${name} generation ${gen}`);
        });
});

test("rhomb-layer command counts, real geometry", () => {
    const want = {
        Sun: [55, 365, 2440, 16475],
        Star: [35, 280, 2075, 14845],
        Deca: [10, 80, 610, 4430],
    };
    for (const [name, counts] of Object.entries(want))
        counts.forEach((n, i) => {
            const gen = i + 1;
            const list = build({ type: SEEDS[name], gen, layer: "rhomb" }).bounds.renderList;
            assert.equal(list.length, n, `${name} generation ${gen}`);
        });
});

test("the layer flag decides the command, not the shape", () => {
    const penta = new Tally();
    penta.render(build({ type: penrose.Sun, gen: 2 }).bounds.renderList);
    assert.equal(penta.commands.outline, 136);
    assert.equal(penta.commands.rhombus, 0);

    const rhomb = new Tally();
    rhomb.render(build({ type: penrose.Sun, gen: 2, layer: "rhomb" }).bounds.renderList);
    assert.equal(rhomb.commands.rhombus, 365);
    assert.equal(rhomb.commands.outline, 0);
});

test("pentaSelected off suppresses the penta layer entirely", () => {
    const off = build({ type: penrose.Sun, gen: 3, overlays: { ...ALL_ON, pentaSelected: false } });
    assert.equal(off.bounds.renderList.length, 0);
    // But the flag is not a mute button for the rhombs, which are their own layer.
    const rhombs = build({
        type: penrose.Sun, gen: 3, layer: "rhomb",
        overlays: { ...ALL_ON, pentaSelected: false },
    });
    assert.equal(rhombs.bounds.renderList.length, 2440);
});

test("big rhombs at a generation are the small rhombs at the one before", () => {
    // Not an approximation -- the counts are equal exactly, at every seed and
    // every generation. This is the "one inflation apart" claim in
    // docs/rhomb-groups.md, as an identity rather than a pair of tables.
    const count = (type, gen, smallRhomb) => build({
        type, gen, layer: "rhomb", overlays: { ...ALL_ON, smallRhomb },
    }).bounds.renderList.length;

    for (const [name, type] of Object.entries(SEEDS))
        for (const gen of [2, 3, 4])
            assert.equal(count(type, gen, false), count(type, gen - 1, true),
                         `${name}: big at generation ${gen} vs small at ${gen - 1}`);

    // And they are genuinely different at the same generation, so the flag does
    // something -- the identity above is a shift, not an alias.
    assert.notEqual(count(penrose.Star, 3, false), count(penrose.Star, 3, true));
    assert.equal(count(penrose.Star, 3, true), 2075);
    assert.equal(count(penrose.Star, 3, false), 280);
});

test("mosaic is a presentation of the discrete geometry, not a mode", () => {
    // Same geometry, same recursion; the overlay flag picks figure over outline.
    const outlines = new Tally();
    outlines.render(build({ type: penrose.Sun, gen: 2, mode: "discrete" }).bounds.renderList);
    const tiles = new Tally();
    tiles.render(build({
        type: penrose.Sun, gen: 2, mode: "discrete",
        overlays: { ...ALL_ON, pentaSelected: false, mosaicSelected: true },
    }).bounds.renderList);
    assert.equal(outlines.commands.outline, 136);
    assert.equal(outlines.commands.figure, 0);
    assert.equal(tiles.commands.figure, 136);
    assert.equal(tiles.commands.outline, 0);
});

test("full-figure extents, real geometry", () => {
    // All three layers, which is what the Sun/Star page fits to.
    const want = {
        Sun: [
            [1, -13.708204, -14.413659, 13.708204, 13.362196],
            [2, -35.888544, -37.735448, 35.888544, 34.982684],
        ],
        Star: [
            [1, -13.708204, -11.660895, 13.708204, 14.413659],
            [2, -35.888544, -34.332845, 35.888544, 37.735448],
        ],
        Deca: [
            [1, -6.472136, -9.557970, 6.472136, 2.752764],
            [2, -18.944272, -28.827317, 18.944272, 11.011055],
        ],
    };
    for (const [name, rows] of Object.entries(want))
        for (const [gen, minX, minY, maxX, maxY] of rows) {
            const scene = new PenroseScreen("real");
            scene.setToMeasure();
            const args = { type: SEEDS[name], gen, isHeads: true, angle: ang(0, false), loc: p(0, 0) };
            scene.overlays = ALL_ON;
            scene.penta(args);
            scene.overlays = { ...ALL_ON, smallRhomb: true };
            scene.penta({ ...args, layer: "rhomb" });
            scene.overlays = { ...ALL_ON, smallRhomb: false };
            scene.penta({ ...args, layer: "rhomb" });
            const b = scene.bounds;
            const at = `${name} generation ${gen}`;
            assert.ok(Math.abs(b.minPoint.x - minX) < 1e-6, `${at} minX: ${b.minPoint.x}`);
            assert.ok(Math.abs(b.minPoint.y - minY) < 1e-6, `${at} minY: ${b.minPoint.y}`);
            assert.ok(Math.abs(b.maxPoint.x - maxX) < 1e-6, `${at} maxX: ${b.maxPoint.x}`);
            assert.ok(Math.abs(b.maxPoint.y - maxY) < 1e-6, `${at} maxY: ${b.maxPoint.y}`);
        }
});

test("Sun and Star are not reflections of each other", () => {
    // Worth pinning because it is the obvious wrong guess. Both are five-fold
    // about their seed, one up and one down, so the boxes look like they should
    // swap -- and they do not. The tile content differs, not just the handedness.
    const box = (type) => {
        const s = build({ type, gen: 2, measure: true });
        return [s.bounds.minPoint.y, s.bounds.maxPoint.y];
    };
    const [sunMin, sunMax] = box(penrose.Sun);
    const [starMin, starMax] = box(penrose.Star);
    assert.ok(Math.abs(sunMin - -33.281383) < 1e-6, `Sun minY ${sunMin}`);
    assert.ok(Math.abs(sunMax - 34.982684) < 1e-6, `Sun maxY ${sunMax}`);
    assert.ok(Math.abs(starMin - -34.332845) < 1e-6, `Star minY ${starMin}`);
    assert.ok(Math.abs(starMax - 37.735448) < 1e-6, `Star maxY ${starMax}`);
    assert.ok(Math.abs(sunMax + starMin) > 0.5, "they would mirror; they do not");
    // The x extents, on the other hand, do agree -- both are symmetric about
    // the vertical axis through the seed.
    const sun = build({ type: penrose.Sun, gen: 2, measure: true }).bounds;
    assert.ok(Math.abs(sun.minPoint.x + sun.maxPoint.x) < 1e-9);
});

test("the measure pass finds the same box and builds no list", () => {
    const drawn = build({ type: penrose.Star, gen: 3 });
    const measured = build({ type: penrose.Star, gen: 3, measure: true });
    assert.equal(measured.bounds.renderList.length, 0, "measuring draws nothing");
    assert.ok(drawn.bounds.renderList.length > 0);
    for (const k of ["x", "y"]) {
        assert.ok(Math.abs(drawn.bounds.minPoint[k] - measured.bounds.minPoint[k]) < 1e-9);
        assert.ok(Math.abs(drawn.bounds.maxPoint[k] - measured.bounds.maxPoint[k]) < 1e-9);
    }
});

test("the fitted box does not depend on which layers are showing", () => {
    // The regression this pins: the Sun/Star fit was measured from the ticked
    // layers, and the layers disagree on extent, so unticking pentas on one side
    // rescaled the rhombs on both. Measuring every layer is what fixed it.
    const measureAll = (type, gen) => {
        const scene = new PenroseScreen("real");
        scene.setToMeasure();
        const args = { type, gen, isHeads: true, angle: ang(0, false), loc: p(0, 0) };
        scene.overlays = ALL_ON;
        scene.penta(args);
        scene.overlays = { ...ALL_ON, smallRhomb: true };
        scene.penta({ ...args, layer: "rhomb" });
        scene.overlays = { ...ALL_ON, smallRhomb: false };
        scene.penta({ ...args, layer: "rhomb" });
        return scene.bounds;
    };
    // The layers really do disagree -- if they ever stop, this test is vacuous.
    const pentaOnly = build({ type: penrose.Star, gen: 2, measure: true }).bounds;
    const bigOnly = build({
        type: penrose.Star, gen: 2, layer: "rhomb", measure: true,
        overlays: { ...ALL_ON, smallRhomb: false },
    }).bounds;
    assert.ok(Math.abs(pentaOnly.maxPoint.y - bigOnly.maxPoint.y) > 1,
              "layers no longer disagree on extent; the fit test means nothing now");
    // And the full measure is the envelope of them, every time.
    for (const [name, type] of Object.entries(SEEDS))
        for (const gen of [1, 2, 3]) {
            const all = measureAll(type, gen);
            for (const layer of [undefined, "rhomb"])
                for (const smallRhomb of [true, false]) {
                    const part = build({ type, gen, layer, measure: true,
                                         overlays: { ...ALL_ON, smallRhomb } }).bounds;
                    if (part.isEmpty) continue;
                    const at = `${name} g${gen} ${layer || "penta"} small=${smallRhomb}`;
                    assert.ok(part.minPoint.x >= all.minPoint.x - 1e-9, `${at} minX`);
                    assert.ok(part.minPoint.y >= all.minPoint.y - 1e-9, `${at} minY`);
                    assert.ok(part.maxPoint.x <= all.maxPoint.x + 1e-9, `${at} maxX`);
                    assert.ok(part.maxPoint.y <= all.maxPoint.y + 1e-9, `${at} maxY`);
                }
        }
});

test("parity alternates down the rhomb layer", () => {
    // The isHeads propagation table in docs/PLANS.md, observed rather than
    // recited: rhombus is the only command that carries isHeads through.
    const want = {
        Sun: [[0, 55], [365, 0], [75, 2365]],
        Star: [[15, 20], [130, 150], [1155, 920]],
        Deca: [[0, 10], [80, 0], [45, 565]],
    };
    for (const [name, rows] of Object.entries(want))
        rows.forEach(([heads, tails], i) => {
            const gen = i + 1;
            const tally = new Tally();
            tally.render(build({ type: SEEDS[name], gen, layer: "rhomb" }).bounds.renderList);
            assert.equal(tally.heads, heads, `${name} generation ${gen} heads`);
            assert.equal(tally.tails, tails, `${name} generation ${gen} tails`);
        });
});

test("the composite seeds fix their own parity", () => {
    // Sun and Star set parity internally, so the seed's isHeads does not reach
    // them. That is why the Sun/Star page states heads and offers no control.
    for (const type of [penrose.Sun, penrose.Star]) {
        const heads = build({ type, gen: 2, isHeads: true });
        const tails = build({ type, gen: 2, isHeads: false });
        assert.equal(heads.bounds.renderList.length, tails.bounds.renderList.length);
        assert.ok(Math.abs(heads.bounds.maxPoint.y - tails.bounds.maxPoint.y) < 1e-9);
    }
});

test("a scene with no overlays falls back to the defaults", () => {
    // This used to throw from deep inside the recursion, and it was the first
    // thing any outside caller hit. The default now covers it.
    const scene = new PenroseScreen("real");
    assert.equal(scene.overlays, null, "nothing set on the scene");
    scene.penta({ type: penrose.Star, gen: 3, isHeads: true, angle: ang(0, false), loc: p(0, 0) });
    assert.equal(scene.bounds.renderList.length, 851,
                 "the default draws the penta layer, same as stating it");
});

test("the default is exactly ALL_ON with mosaic off, and is frozen", () => {
    assert.deepEqual({ ...PenroseScreen.DEFAULT_OVERLAYS }, ALL_ON);
    assert.ok(Object.isFrozen(PenroseScreen.DEFAULT_OVERLAYS),
              "shared by every scene that falls back to it, so it must not be mutable");
});

test("an explicit overlays still wins over the default", () => {
    const scene = new PenroseScreen("real");
    scene.overlays = { ...ALL_ON, pentaSelected: false };
    scene.penta({ type: penrose.Star, gen: 3, isHeads: true, angle: ang(0, false), loc: p(0, 0) });
    assert.equal(scene.bounds.renderList.length, 0, "the default did not override it");
});

test("a clip radius rounds the figure off and shrinks the list", () => {
    const full = build({ type: penrose.Sun, gen: 3 });
    const scene = new PenroseScreen("real");
    scene.overlays = ALL_ON;
    scene.penta({
        type: penrose.Sun, gen: 3, isHeads: true, angle: ang(0, false), loc: p(0, 0),
        clip: { center: p(0, 0), radius: 20 },
    });
    assert.ok(scene.bounds.renderList.length < full.bounds.renderList.length);
    assert.ok(scene.bounds.renderList.length > 0);
});
