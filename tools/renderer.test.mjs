// The renderer, driven with no DOM, no canvas and no globals.
//
// Two things need this to work. The lib/ plan needs a consumer to be able to
// render without the sidebar existing; the SVG plan needs a second renderer that
// does not inherit CanvasRenderer's reach into module state. Both are the same
// requirement, so both are tested here: styles come from what the caller passed,
// then from the app's, then from the frozen defaults in styles.js.
//
// The context below is a recorder, not a canvas. That it works at all is the
// point -- the renderer only ever asked for a 2D-context-shaped object.

import test from "node:test";
import assert from "node:assert/strict";

const ROOT = new URL("..", import.meta.url).href;
const { penrose } = await import(ROOT + "penrose.js");
const { p, ang } = await import(ROOT + "point.js");
const { PenroseScreen } = await import(ROOT + "penrose-screen.js");
const { CanvasRenderer } = await import(ROOT + "renderers.js");
const {
    DEFAULT_PENTA_STYLE, DEFAULT_RHOMB_STYLE, DEFAULT_MOSAIC_STYLE, pickStyle,
} = await import(ROOT + "styles.js");

/** Records every call and every style assignment. */
class FakeContext {
    constructor() {
        this.calls = [];
        this.fills = [];
        this.strokes = [];
        this._fillStyle = null;
        this._strokeStyle = null;
        this.lineWidth = 1;
        this.font = "";
        this.textBaseline = "";
    }
    set fillStyle(v) { this._fillStyle = v; this.fills.push(v); }
    get fillStyle() { return this._fillStyle; }
    set strokeStyle(v) { this._strokeStyle = v; this.strokes.push(v); }
    get strokeStyle() { return this._strokeStyle; }

    save() { this.calls.push("save"); }
    restore() { this.calls.push("restore"); }
    beginPath() { this.calls.push("beginPath"); }
    closePath() { this.calls.push("closePath"); }
    moveTo() { this.calls.push("moveTo"); }
    lineTo() { this.calls.push("lineTo"); }
    fill() { this.calls.push("fill"); }
    stroke() { this.calls.push("stroke"); }
    clip() { this.calls.push("clip"); }
    fillRect() { this.calls.push("fillRect"); }
    strokeRect() { this.calls.push("strokeRect"); }
    fillText() { this.calls.push("fillText"); }
    setTransform() { this.calls.push("setTransform"); }
    translate() { this.calls.push("translate"); }
    createLinearGradient() {
        this.calls.push("createLinearGradient");
        return { addColorStop: () => this.calls.push("addColorStop") };
    }
    count(name) { return this.calls.filter((c) => c === name).length; }
}

function scene({ type = penrose.Star, gen = 2, mode = "real", layer } = {}) {
    const s = new PenroseScreen(mode);
    s.penta({ type, gen, isHeads: true, angle: ang(0, false), loc: p(0, 0),
              ...(layer ? { layer } : {}) });
    return s;
}

function draw(sceneObj, styles) {
    const g = new FakeContext();
    new CanvasRenderer(g, 10, styles).render(sceneObj.bounds.renderList);
    return g;
}

test("pickStyle takes the first source that has it", () => {
    const a = { pentaStyle: "A" }, b = { pentaStyle: "B" };
    assert.equal(pickStyle("pentaStyle", "dflt", a, b), "A");
    assert.equal(pickStyle("pentaStyle", "dflt", undefined, b), "B");
    assert.equal(pickStyle("pentaStyle", "dflt", undefined, {}), "dflt");
    assert.equal(pickStyle("pentaStyle", "dflt"), "dflt");
});

test("the defaults are frozen and carry their own constants", () => {
    // renderers.js compares a value against a constant on the same object, so a
    // default that carried only values would silently take the wrong branch.
    for (const style of [DEFAULT_PENTA_STYLE, DEFAULT_RHOMB_STYLE, DEFAULT_MOSAIC_STYLE]) {
        assert.ok(Object.isFrozen(style));
        assert.equal(style.SOLID, "solid");
        assert.equal(style.NONE, "none");
        assert.equal(style.TRANSPARENT, "transparent");
        assert.equal(style.fill, style.SOLID, "defaults to solid fill");
    }
    assert.equal(DEFAULT_MOSAIC_STYLE.border, DEFAULT_MOSAIC_STYLE.GRID);
    assert.equal(DEFAULT_RHOMB_STYLE.isogloss, false);
});

test("a renderer with no styles and no globals resolves to the defaults", () => {
    const r = new CanvasRenderer(new FakeContext(), 10);
    assert.equal(r.styles.pentaStyle, DEFAULT_PENTA_STYLE);
    assert.equal(r.styles.rhombStyle, DEFAULT_RHOMB_STYLE);
    assert.equal(r.styles.mosaicStyle, DEFAULT_MOSAIC_STYLE);
    assert.ok(Object.isFrozen(r.styles));
});

test("outlines render with nothing supplied", () => {
    const g = draw(scene({ gen: 2 }));
    assert.equal(g.count("fill"), 121, "one fill per outline");
    assert.equal(g.count("stroke"), 121, "and one stroke, since both default solid");
    assert.deepEqual([...new Set(g.fills)].sort(), ["#0000ff", "#e46c0a", "#ffff00"]);
    assert.ok(g.strokes.includes("#000000"));
});

test("rhombs render with nothing supplied", () => {
    // This is the one that used to throw. rhombus read rhombStyle bare where
    // figure and outline both guarded, so the method a consumer most wants was
    // the only one that needed a DOM-built control object.
    const g = draw(scene({ gen: 2, layer: "rhomb" }));
    assert.equal(g.count("fill"), 280, "one fill per rhomb");
    assert.ok(g.count("stroke") >= 280);
    assert.equal(g.count("createLinearGradient"), 0, "solid by default, not gradient");
});

test("mosaic tiles render with nothing supplied", () => {
    const s = new PenroseScreen("discrete");
    s.overlays = { ...PenroseScreen.DEFAULT_OVERLAYS, pentaSelected: false, mosaicSelected: true };
    s.penta({ type: penrose.Star, gen: 1, isHeads: true, angle: ang(0, false), loc: p(0, 0) });
    const g = draw(s);
    // Solid fill and a grid border: one fillRect and one strokeRect per cell.
    assert.ok(g.count("fillRect") > 0);
    assert.equal(g.count("strokeRect"), g.count("fillRect"), "grid border by default");
});

test("an injected pentaStyle changes what is drawn", () => {
    const none = { pentaStyle: { ...DEFAULT_PENTA_STYLE, fill: "none", stroke: "none" } };
    const g = draw(scene({ gen: 2 }), none);
    assert.equal(g.count("fill"), 0, "fill: none means no fill");
    assert.equal(g.count("stroke"), 0, "stroke: none means no stroke");
    // The path is still built -- only the paint is suppressed.
    assert.equal(g.count("closePath"), 121);
});

test("an injected pentaStyle can ask for transparency", () => {
    const styles = { pentaStyle: { ...DEFAULT_PENTA_STYLE, fill: "transparent" } };
    const g = draw(scene({ gen: 1 }), styles);
    assert.ok(g.fills.every((f) => f.length === 9 && f.endsWith("80")),
              `expected 8-digit hex, got ${[...new Set(g.fills)]}`);
});

test("an injected rhombStyle reaches the gradient and the isogloss", () => {
    const gradient = { rhombStyle: { ...DEFAULT_RHOMB_STYLE, fill: "gradient" } };
    const g = draw(scene({ gen: 1, layer: "rhomb" }), gradient);
    assert.equal(g.count("createLinearGradient"), 35, "one gradient per rhomb");
    assert.ok(g.count("addColorStop") > 0);

    const iso = { rhombStyle: { ...DEFAULT_RHOMB_STYLE, isogloss: true } };
    const withIso = draw(scene({ gen: 1, layer: "rhomb" }), iso);
    const without = draw(scene({ gen: 1, layer: "rhomb" }));
    assert.ok(withIso.count("clip") > without.count("clip"),
              "isogloss clips to each rhomb");
    assert.ok(withIso.count("stroke") > without.count("stroke"));
});

test("an injected mosaicStyle can drop the grid for a silhouette", () => {
    const s = new PenroseScreen("discrete");
    s.overlays = { ...PenroseScreen.DEFAULT_OVERLAYS, pentaSelected: false, mosaicSelected: true };
    s.penta({ type: penrose.Star, gen: 1, isHeads: true, angle: ang(0, false), loc: p(0, 0) });
    const outline = { mosaicStyle: { ...DEFAULT_MOSAIC_STYLE, border: "outline" } };
    const g = draw(s, outline);
    assert.equal(g.count("strokeRect"), 0, "no per-cell grid");
    assert.ok(g.count("stroke") > 0, "a silhouette path instead");
});

test("styles are resolved once per pass, not per command", () => {
    const r = new CanvasRenderer(new FakeContext(), 10);
    const first = r.styles;
    assert.equal(r.styles, first, "cached within a pass");
    r.render([]);
    assert.notEqual(r.resolved, first, "and re-resolved when a new pass starts");
});

test("the renderer never consults globals when the caller states everything", () => {
    // What the SVG renderer needs to be able to rely on: a complete style set
    // passed in is the whole input, so a second renderer can be written against
    // styles.js alone and never import controls.js.
    const complete = {
        pentaStyle: DEFAULT_PENTA_STYLE,
        rhombStyle: DEFAULT_RHOMB_STYLE,
        mosaicStyle: DEFAULT_MOSAIC_STYLE,
    };
    const r = new CanvasRenderer(new FakeContext(), 10, complete);
    assert.equal(r.styles.pentaStyle, complete.pentaStyle);
    assert.equal(r.styles.rhombStyle, complete.rhombStyle);
    assert.equal(r.styles.mosaicStyle, complete.mosaicStyle);
});
