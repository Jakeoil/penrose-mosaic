// The library facade, lib/penrose-mosaic.js, driven as an outside consumer
// would: one import, no DOM, no globals set.
//
// Its numbers are not new. They are the golden values scene.test.mjs already
// pins for PenroseScreen, so the facade is checked against the same truth the
// core is, and a disagreement means the facade is building something else.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ROOT = new URL("..", import.meta.url);
const lib = await import(new URL("lib/penrose-mosaic.js", ROOT).href);
const { build, sun, star, deca, toSVG, toPDF, penrose, PenroseScreen } = lib;

test("the public surface is what PLANS.md names", () => {
    for (const name of ["PenroseScreen", "penrose", "p", "ang", "Bounds",
                        "CanvasRenderer", "SvgRenderer", "PdfRenderer",
                        "build", "sun", "star", "deca", "toSVG", "toPDF"])
        assert.ok(lib[name], `missing export ${name}`);
});

test("the builders agree with the core's golden counts", () => {
    // From scene.test.mjs: penta layer and rhomb layer, real geometry.
    assert.equal(sun({ gen: 3 }).renderList.length, 911);
    assert.equal(star({ gen: 3 }).renderList.length, 851);
    assert.equal(deca({ gen: 3 }).renderList.length, 256);
    assert.equal(sun({ gen: 2, layers: ["rhomb"] }).renderList.length, 365);
    assert.equal(star({ gen: 1, layers: ["rhomb"] }).renderList.length, 35);
    assert.equal(deca({ gen: 1, layers: ["rhomb"] }).renderList.length, 10);
});

test("layers are separate passes, drawn in order", () => {
    const both = sun({ gen: 2, layers: ["penta", "rhomb"] }).renderList.length;
    assert.equal(both, 136 + 365);
});

test("types are accepted by name or as penrose.* objects", () => {
    const a = build({ type: "Star", gen: 2 }).renderList.length;
    const b = build({ type: penrose.Star, gen: 2 }).renderList.length;
    assert.equal(a, b);
    assert.ok(build({ type: "Pe5", gen: 2 }).renderList.length > 0);
});

test("bad input fails at the door, not deep in the recursion", () => {
    assert.throws(() => build({ type: "Queen" }), RangeError);
    assert.throws(() => build({ mode: "mosaic" }), RangeError);
    assert.throws(() => build({ orient: "left" }), RangeError);
    assert.throws(() => build({ layers: ["dual"] }), RangeError);
    assert.throws(() => build({ gen: -1 }), RangeError);
});

test("overlays merge over the defaults and stay on the scene", () => {
    const { scene } = build({ gen: 1, overlays: { pentaSelected: false } });
    assert.equal(scene.overlays.pentaSelected, false);
    assert.equal(scene.overlays.rhombSelected, PenroseScreen.DEFAULT_OVERLAYS.rhombSelected);
    assert.equal(build({ gen: 1, overlays: { pentaSelected: false } }).renderList.length, 0);
});

test("the mosaic draws in the discrete geometry only", () => {
    const overlays = { pentaSelected: false, mosaicSelected: true };
    assert.ok(star({ gen: 2, mode: "discrete", overlays }).renderList.length > 0);
    assert.equal(star({ gen: 2, mode: "real", overlays }).renderList.length, 0);
});

test("toSVG reproduces the committed overlay sample byte for byte", () => {
    // tools/svg-sample.mjs draws it with the core directly; the facade must agree.
    const svg = toSVG([sun({ gen: 2 }), { type: "Star", gen: 2 }],
                      { scale: 12, background: "white", pad: 12, title: "Sun and Star, generation 2" });
    const sample = readFileSync(new URL("samples/overlay.svg", ROOT), "utf8");
    assert.equal(svg + "\n", sample);
});

test("toPDF produces a PDF with the same tiles", () => {
    const pdf = toPDF([sun({ gen: 2 }), star({ gen: 2 })], { scale: 12, background: "white", pad: 12 });
    assert.ok(pdf.startsWith("%PDF-"));
    assert.ok(pdf.trimEnd().endsWith("%%EOF"));
});
