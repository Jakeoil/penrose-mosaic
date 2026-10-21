// The pure arithmetic: points, angles, the four wheels, the prototiles, bounds.
//
// These are golden values, measured from the code as it stands on 2026-10-21 and
// written down so the penta/star refactor and the lib/ extraction have something
// to be checked against. A failure here is not "the number changed"; it is "the
// geometry changed", which is a different and much bigger claim.
//
// Runs in plain node with no DOM and no stub. That is not luck -- every control
// touches `document` inside a constructor and `controls.js` runs none at module
// scope -- but it is worth a test of its own, because the lib/ plan depends on
// it staying true.

import test from "node:test";
import assert from "node:assert/strict";

const ROOT = new URL("..", import.meta.url).href;
const { penrose } = await import(ROOT + "penrose.js");
const { p, ang, angFromTenth, norm } = await import(ROOT + "point.js");
const { Bounds } = await import(ROOT + "bounds.js");

const xy = (q) => [q.x, q.y];
const pairs = (wheel) => wheel.w.map(xy);

test("the core imports with no DOM", () => {
    // If this ever fails, something gained a module-scope `document` touch and
    // the library is no longer importable outside a browser.
    assert.equal(typeof globalThis.document, "undefined");
    assert.ok(penrose.Pe5 && penrose.real && penrose.discrete);
});

test("point reflections", () => {
    const a = p(3, 2);
    assert.deepEqual(xy(a.vr), [3, -2], "vertical reflection");
    assert.deepEqual(xy(a.hr), [-3, 2], "horizontal reflection");
    assert.deepEqual(xy(a.neg), [-3, -2]);
    // The mosaic reflections are off by one: a unit square is named by its
    // low corner, so reflecting the square is not reflecting the point.
    assert.deepEqual(xy(a.vrm), [3, -3]);
    assert.deepEqual(xy(a.hrm), [-4, 2]);
    assert.deepEqual(xy(a.negm), [-4, -3]);
});

test("point arithmetic", () => {
    assert.deepEqual(xy(p(1, 2).tr(p(10, 20))), [11, 22]);
    assert.deepEqual(xy(p(3, 2).mult(4)), [12, 8]);
    assert.deepEqual(xy(p(8, 4).div(2)), [4, 2]);
    assert.deepEqual(p(3, 2).toLoc, [3, 2]);
    assert.ok(p(0, 0).isZero);
    assert.ok(!p(1, 0).isZero);
    assert.ok(p(1, 2).equals(p(1, 2)));
    assert.ok(!p(1, 2).equals(p(2, 1)));
    // copy is a copy, not an alias
    const a = p(1, 1), b = a.copy;
    b.x = 9;
    assert.equal(a.x, 1);
});

test("norm folds into 0..4 both ways", () => {
    assert.deepEqual([-7, -1, 0, 4, 5, 12].map(norm), [3, 4, 0, 4, 0, 2]);
});

test("angles: fifths and isDown become tenths", () => {
    // tenths = 2 * fifths, offset by 5 when down. This layout is fixed by
    // Wheel's up/down getters, so it is not free to change.
    const rows = [
        //  fifths  isDown  tenths  cw  ccw  inv  rot(2)
        [0, false, 0, 2, 8, 5, 4],
        [0, true, 5, 7, 3, 0, 9],
        [1, false, 2, 4, 0, 7, 6],
        [1, true, 7, 9, 5, 2, 1],
        [3, false, 6, 8, 4, 1, 0],
        [4, true, 3, 5, 1, 8, 7],
    ];
    for (const [f, d, tenths, cw, ccw, inv, rot2] of rows) {
        const a = ang(f, d);
        const at = `ang(${f},${d})`;
        assert.equal(a.tenths, tenths, `${at} tenths`);
        assert.equal(a.cw.tenths, cw, `${at} cw`);
        assert.equal(a.ccw.tenths, ccw, `${at} ccw`);
        assert.equal(a.inv.tenths, inv, `${at} inv`);
        assert.equal(a.rot(2).tenths, rot2, `${at} rot(2)`);
    }
});

test("angFromTenth wraps", () => {
    for (const [t, want] of [[0, 0], [1, 1], [2, 2], [5, 5], [9, 9], [13, 3], [-1, 9]])
        assert.equal(angFromTenth(t).tenths, want, `angFromTenth(${t})`);
});

test("the discrete wheels are the hand-computed integers", () => {
    // These are the whole basis of the discrete geometry. Every one is an exact
    // integer -- that is the property the mosaic exists to have.
    assert.deepEqual(pairs(penrose.discrete.wheels.p[1]), [
        [0, -6], [3, -4], [5, -2], [5, 2], [3, 4],
        [0, 6], [-3, 4], [-5, 2], [-5, -2], [-3, -4],
    ], "P wheel, generation 1");
    assert.deepEqual(pairs(penrose.discrete.wheels.s[1]), [
        [0, -5], [3, -5], [5, -1], [5, 1], [3, 5],
        [0, 5], [-3, 5], [-5, 1], [-5, -1], [-3, -5],
    ], "S wheel, generation 1");
    assert.deepEqual(pairs(penrose.discrete.wheels.t[1]), [
        [0, -8], [5, -8], [8, -2], [8, 2], [5, 8],
        [0, 8], [-5, 8], [-8, 2], [-8, -2], [-5, -8],
    ], "T wheel, generation 1");
    assert.deepEqual(pairs(penrose.discrete.wheels.d[1]), [
        [0, -3], [2, -3], [3, -1], [3, 1], [2, 3],
        [0, 3], [-2, 3], [-3, 1], [-3, -1], [-2, -3],
    ], "D wheel, generation 1");
    // Generation 2, which is where the substitution has actually been applied.
    assert.deepEqual(pairs(penrose.discrete.wheels.p[2]), [
        [0, -14], [8, -12], [13, -4], [13, 4], [8, 12],
        [0, 14], [-8, 12], [-13, 4], [-13, -4], [-8, -12],
    ], "P wheel, generation 2");
    assert.deepEqual(pairs(penrose.discrete.wheels.d[2]), [
        [0, -9], [5, -7], [8, -3], [8, 3], [5, 7],
        [0, 9], [-5, 7], [-8, 3], [-8, -3], [-5, -7],
    ], "D wheel, generation 2");
});

test("every discrete wheel stays integral to generation 10", () => {
    for (const name of ["p", "s", "t", "d"])
        for (let gen = 0; gen <= 10; gen++)
            for (const q of penrose.discrete.wheels[name][gen].w)
                assert.ok(Number.isInteger(q.x) && Number.isInteger(q.y),
                          `discrete ${name}[${gen}] has a fractional point ${q}`);
});

test("the real wheels are not integral, and that is the point", () => {
    const first = penrose.real.wheels.p[1].w[0];
    const second = penrose.real.wheels.p[1].w[1];
    assert.equal(first.x, 0);
    assert.ok(Math.abs(first.y - -5.505528) < 1e-6, `got ${first.y}`);
    assert.ok(Math.abs(second.x - 3.236068) < 1e-6, `got ${second.x}`);
    assert.ok(!Number.isInteger(second.y));
});

test("a wheel is ten points, five up and five down", () => {
    for (const mode of ["discrete", "real"])
        for (const name of ["p", "s", "t", "d"]) {
            const wheel = penrose[mode].wheels[name][1];
            assert.equal(wheel.w.length, 10, `${mode} ${name}`);
            assert.equal(wheel.up.length, 5);
            assert.equal(wheel.down.length, 5);
        }
});

test("Wheel.string serializes", () => {
    // It used to throw: wheels.js called stringify without importing it, and
    // the only four callers were commented out, so nothing noticed.
    assert.equal(penrose.discrete.wheels.d[1].string,
        "[[0,-3],[2,-3],[3,-1],[3,1],[2,3],[0,3],[-2,3],[-3,1],[-3,-1],[-2,-3]]");
});

test("every shape mode has ten rotations of each prototile", () => {
    for (const mode of ["mosaic", "quadrille", "real"])
        for (const name of ["penta", "star", "boat", "diamond"])
            assert.equal(penrose[mode][name].length, 10, `${mode}.${name}`);
});

test("vector prototiles have the vertex counts their names imply", () => {
    for (const mode of ["quadrille", "real"]) {
        const want = { penta: 5, star: 10, boat: 7, diamond: 4 };
        for (const [name, n] of Object.entries(want))
            for (let tenth = 0; tenth < 10; tenth++)
                assert.equal(penrose[mode][name][tenth].length, n,
                             `${mode}.${name}[${tenth}]`);
    }
});

test("the mosaic prototiles are fixed polyominoes", () => {
    // The claim the typographic mode rests on: each tile is a set of unit
    // squares on integer coordinates. See docs/PLANS.md and TODO.md's
    // polyomino question.
    const want = { penta: [26, 6, 6], star: [32, 8, 8], boat: [18, 8, 4], diamond: [8, 2, 4] };
    for (const [name, [cells, w, h]] of Object.entries(want)) {
        const shape = penrose.mosaic[name][0];
        assert.equal(shape.length, cells, `${name} cell count`);
        const xs = shape.map((q) => q.x), ys = shape.map((q) => q.y);
        assert.equal(Math.max(...xs) - Math.min(...xs) + 1, w, `${name} bbox width`);
        assert.equal(Math.max(...ys) - Math.min(...ys) + 1, h, `${name} bbox height`);
        for (const q of shape)
            assert.ok(Number.isInteger(q.x) && Number.isInteger(q.y),
                      `${name} has a fractional cell ${q}`);
    }
});

test("the five-fold mosaic tiles hold their cell count under rotation; the others do not", () => {
    // Penta and star are five-fold, so every rotation is the same size. Boat and
    // diamond are not, and the square grid cannot hide it -- which is why the
    // counts below are uneven, and why they are worth pinning.
    const count = (name) => penrose.mosaic[name].map((s) => s.length);
    assert.deepEqual(count("penta"), Array(10).fill(26));
    assert.deepEqual(count("star"), Array(10).fill(32));
    assert.deepEqual(count("boat"), [18, 22, 20, 20, 22, 18, 22, 20, 20, 22]);
    assert.deepEqual(count("diamond"), [8, 10, 8, 8, 10, 8, 10, 8, 8, 10]);
});

test("the six types keep their default colors", () => {
    const want = {
        Pe5: "#0000ff", Pe3: "#ffff00", Pe1: "#e46c0a",
        St5: "#0000ff", St3: "#0000ff", St1: "#0000ff",
    };
    for (const [type, color] of Object.entries(want))
        assert.equal(penrose[type].defaultColor, color, type);
    assert.equal(penrose.OUTLINE, "#4a7eba");
});

test("an empty bounds reads as zero, not as NaN", () => {
    const b = new Bounds();
    assert.ok(b.isEmpty);
    assert.deepEqual([b.x, b.y, b.width, b.height], [0, 0, 0, 0]);
});

test("bounds width and height count squares, not distance", () => {
    // width is max - min + 1. That is deliberate -- the mosaic names a unit
    // square by its low corner, so a one-square span is one wide, not zero.
    const b = new Bounds();
    b.addPoint(p(10, 10), p(-5, 6));
    b.addPoint(p(10, 10), p(0, 50));
    assert.deepEqual([b.minPoint.x, b.minPoint.y], [5, 16]);
    assert.deepEqual([b.maxPoint.x, b.maxPoint.y], [10, 60]);
    assert.deepEqual([b.width, b.height], [6, 45]);
    assert.deepEqual([b.center.x, b.center.y], [8, 38.5]);
    assert.ok(Math.abs(b.diagonal - 45.398238) < 1e-6);
});

test("addSquares pads for the far corner of the last square", () => {
    const b = new Bounds();
    b.addSquares(p(0, 0), [p(0, 0), p(1, 0)]);
    assert.deepEqual([b.maxPoint.x, b.maxPoint.y], [2, 1]);
});

test("pad follows the CSS argument rules", () => {
    const at = () => { const b = new Bounds(); b.addPoint(p(0, 0), p(0, 0)); return b; };
    assert.deepEqual(xy(at().pad(1, 2, 3, 4).minPoint), [-4, -1]);
    assert.deepEqual(xy(at().pad(1, 2, 3, 4).maxPoint), [2, 3]);
    assert.deepEqual(xy(at().pad(5).minPoint), [-5, -5]);
    assert.deepEqual(xy(at().pad(5).maxPoint), [5, 5]);
});

test("pad will not shrink a bounds inside out", () => {
    const b = new Bounds();
    b.addPoint(p(0, 0), p(0, 0));
    b.addPoint(p(0, 0), p(2, 2));
    b.pad(-10);
    assert.ok(b.maxPoint.x >= b.minPoint.x);
    assert.ok(b.maxPoint.y >= b.minPoint.y);
});
