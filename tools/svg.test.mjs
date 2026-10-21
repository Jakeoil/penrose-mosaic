// The SVG renderer, against the same render list the canvas gets.
//
// A sanity check rather than a finished feature: nothing on any page uses this
// yet, and the first intended use is PDFs of the Sun/Star overlay. What is
// pinned here is that it runs outside a browser, that its geometry agrees with
// the canvas exactly, and that the two things docs/PLANS.md called hard really do
// come out the way the plan predicted.

import test from "node:test";
import assert from "node:assert/strict";

const ROOT = new URL("..", import.meta.url).href;
const { penrose } = await import(ROOT + "penrose.js");
const { p, ang } = await import(ROOT + "point.js");
const { PenroseScreen } = await import(ROOT + "penrose-screen.js");
const { CanvasRenderer } = await import(ROOT + "renderers.js");
const { SvgRenderer } = await import(ROOT + "svg-renderer.js");
const {
    DEFAULT_PENTA_STYLE, DEFAULT_RHOMB_STYLE, DEFAULT_MOSAIC_STYLE,
} = await import(ROOT + "styles.js");

const SCALE = 10;

function scene({ type = penrose.Star, gen = 2, mode = "real", layer, overlays } = {}) {
    const s = new PenroseScreen(mode);
    if (overlays) s.overlays = overlays;
    s.penta({ type, gen, isHeads: true, angle: ang(0, false), loc: p(0, 0),
              ...(layer ? { layer } : {}) });
    return s;
}

const draw = (sceneObj, options) =>
    new SvgRenderer({ scale: SCALE, ...options }).render(sceneObj.bounds.renderList);

/** Captures the coordinates the canvas path would be built from. */
class PathRecorder {
    constructor() { this.coords = []; this.calls = []; }
    set fillStyle(v) {} get fillStyle() { return null; }
    set strokeStyle(v) {} get strokeStyle() { return null; }
    save() {} restore() {} beginPath() {} closePath() {} fill() {} stroke() {}
    clip() {} fillRect() {} strokeRect() {} fillText() {} setTransform() {}
    translate() {}
    moveTo(x, y) { this.coords.push([x, y]); }
    lineTo(x, y) { this.coords.push([x, y]); }
    createLinearGradient() { return { addColorStop() {} }; }
}

test("the SVG renderer runs with no DOM and no globals", () => {
    assert.equal(typeof globalThis.document, "undefined");
    const svg = draw(scene({ gen: 2 }));
    assert.equal(svg.body.length, 121, "one element per outline");
    assert.ok(svg.toString().startsWith("<svg xmlns="));
});

test("it emits the same coordinates the canvas draws", () => {
    // The claim that makes it a drop-in: both get the same list, so both must
    // put the tiles in the same places. Compared to full precision at three
    // decimals, which is the renderer's rounding.
    const list = scene({ gen: 2 }).bounds.renderList;

    const canvas = new PathRecorder();
    new CanvasRenderer(canvas, SCALE, { pentaStyle: DEFAULT_PENTA_STYLE }).render(list);

    const svg = draw(scene({ gen: 2 }));
    const svgCoords = svg.body.flatMap((el) => {
        const m = el.match(/points="([^"]+)"/);
        return m ? m[1].split(" ").map((pair) => pair.split(",").map(Number)) : [];
    });

    assert.equal(svgCoords.length, canvas.coords.length, "same number of vertices");
    // The renderer folds -0 to 0, since "-0" in an attribute is noise. Match it.
    const round = (v) => {
        const r = Math.round(v * 1000) / 1000;
        return Object.is(r, -0) ? 0 : r;
    };
    for (let i = 0; i < canvas.coords.length; i++) {
        assert.equal(svgCoords[i][0], round(canvas.coords[i][0]), `vertex ${i} x`);
        assert.equal(svgCoords[i][1], round(canvas.coords[i][1]), `vertex ${i} y`);
    }
});

test("the gradient defs collapse, and stay collapsed as the figure grows", () => {
    // The plan's estimate was about 120 for ten rotations by six colors by two
    // parities. The real figures use fewer, and the count plateaus rather than
    // tracking the rhomb count -- which is the whole reason SVG is viable here.
    const styles = { rhombStyle: { ...DEFAULT_RHOMB_STYLE, fill: "gradient" } };
    const counts = [1, 2, 3, 4].map((gen) => {
        const r = draw(scene({ gen, layer: "rhomb" }), { styles });
        return { rhombs: r.body.length, defs: r.gradients.size };
    });
    assert.deepEqual(counts.map((c) => c.rhombs), [35, 280, 2075, 14845]);
    assert.deepEqual(counts.map((c) => c.defs), [20, 50, 76, 92]);
    assert.ok(counts[3].defs < 128, "bounded, not per-rhomb");
    assert.ok(counts[3].defs / counts[3].rhombs < 0.01,
              "one def per 160 rhombs at generation 4");
    // Every rhomb references a def that exists.
    const r = draw(scene({ gen: 3, layer: "rhomb" }), { styles });
    const out = r.toString();
    for (const m of out.matchAll(/url\(#(g\d+)\)/g))
        assert.ok(out.includes('id="' + m[1] + '"'), "dangling gradient " + m[1]);
});

test("the isogloss needs no clipPath, because its ends are on the boundary", () => {
    // docs/PLANS.md predicted this; here it is checked. The canvas clips each
    // rhomb, which in SVG would mean a clipPath per rhomb and the same
    // multiplication the gradients just avoided.
    const verts = [];
    const r = new SvgRenderer({
        scale: SCALE,
        styles: { rhombStyle: { ...DEFAULT_RHOMB_STYLE, isogloss: true } },
    });
    const original = r.rhombus.bind(r);
    r.rhombus = (fill, offset, shape, strokeStyle, isHeads) => {
        verts.push(shape.map((pt) => ({
            x: (pt.x + offset.x) * SCALE, y: (pt.y + offset.y) * SCALE,
        })));
        return original(fill, offset, shape, strokeStyle, isHeads);
    };
    r.render(scene({ gen: 2, layer: "rhomb" }).bounds.renderList);
    assert.ok(verts.length > 0);

    const distanceToSegment = (q, a, b) => {
        const cross = (b.x - a.x) * (q.y - a.y) - (b.y - a.y) * (q.x - a.x);
        return Math.abs(cross) / (Math.hypot(b.x - a.x, b.y - a.y) || 1);
    };
    const mix = (a, b, s) => ({ x: a.x + (b.x - a.x) * s, y: a.y + (b.y - a.y) * s });

    let checked = 0;
    for (const [v0, v1, v2, v3] of verts)
        for (let i = 1; i <= 7; i++) {
            const t = i / 8;
            const left = t <= 0.5 ? mix(v0, v3, t * 2) : mix(v3, v2, (t - 0.5) * 2);
            const right = t <= 0.5 ? mix(v0, v1, t * 2) : mix(v1, v2, (t - 0.5) * 2);
            assert.ok(Math.min(distanceToSegment(left, v0, v3),
                               distanceToSegment(left, v3, v2)) < 1e-9,
                      "left end off the boundary");
            assert.ok(Math.min(distanceToSegment(right, v0, v1),
                               distanceToSegment(right, v1, v2)) < 1e-9,
                      "right end off the boundary");
            checked += 2;
        }
    assert.equal(checked, verts.length * 14);
});

test("the document is tag-balanced", () => {
    const out = draw(scene({ gen: 2 }), { background: "white", pad: 4 })
        .toString({ title: "Star, generation 2" });
    const opens = (out.match(/<[a-zA-Z]/g) || []).length;
    const selfClosing = (out.match(/\/>/g) || []).length;
    const closing = (out.match(/<\/[a-zA-Z]/g) || []).length;
    assert.equal(opens, selfClosing + closing);
    assert.ok(out.endsWith("</svg>"));
    assert.ok(out.includes("<title>Star, generation 2</title>"));
});

test("the viewBox frames what was drawn", () => {
    const svg = draw(scene({ gen: 2 }));
    const bounds = scene({ gen: 2 }).bounds;
    const box = svg.viewBox;
    assert.ok(Math.abs(box.x - bounds.minPoint.x * SCALE) < 1e-6);
    assert.ok(Math.abs(box.y - bounds.minPoint.y * SCALE) < 1e-6);
    assert.ok(Math.abs(box.width - (bounds.maxPoint.x - bounds.minPoint.x) * SCALE) < 1e-6);
    // pad widens it on both sides
    const padded = draw(scene({ gen: 2 }), { pad: 7 }).viewBox;
    assert.ok(Math.abs(padded.width - box.width - 14) < 1e-6);
});

test("an empty list gives an empty box rather than Infinity", () => {
    const svg = new SvgRenderer({ scale: SCALE }).render([]);
    assert.ok(svg.isEmpty);
    assert.deepEqual(svg.viewBox, { x: 0, y: 0, width: 0, height: 0 });
    assert.ok(svg.toString().includes('viewBox="0 0 0 0"'));
});

test("penta styles reach the output", () => {
    const none = draw(scene({ gen: 1 }), {
        styles: { pentaStyle: { ...DEFAULT_PENTA_STYLE, fill: "none", stroke: "none" } },
    }).toString();
    assert.ok(none.includes('fill="none"'));
    assert.ok(none.includes('stroke="none"'));

    const clear = draw(scene({ gen: 1 }), {
        styles: { pentaStyle: { ...DEFAULT_PENTA_STYLE, fill: "transparent" } },
    }).toString();
    // fill-opacity, not the canvas's 8-digit hex -- it is the native spelling.
    assert.ok(clear.includes('fill-opacity="0.5"'));
    assert.ok(!clear.includes('"#0000ff80"'));
});

test("rhomb styles reach the output", () => {
    const base = { ...DEFAULT_RHOMB_STYLE };
    const at = (rhombStyle) =>
        draw(scene({ gen: 1, layer: "rhomb" }), { styles: { rhombStyle } }).toString();

    assert.ok(at({ ...base, fill: "transparent" }).includes('fill-opacity="0.25"'),
              "the canvas spelling is fill + 40, which is a quarter");
    assert.ok(at({ ...base, fill: "none" }).includes('fill="none"'));
    assert.ok(at({ ...base, fill: "gradient" }).includes("<linearGradient"));

    const dihedral = at({ ...base, stroke: "dihedral" });
    assert.ok(dihedral.includes('stroke-width="3"'), "valleys thick at this scale");
    assert.ok(dihedral.includes('stroke-width="1"'), "ridges thin");
});

test("mosaic tiles become one path per tile, not one per cell", () => {
    const s = scene({
        type: penrose.Star, gen: 1, mode: "discrete",
        overlays: { ...PenroseScreen.DEFAULT_OVERLAYS, pentaSelected: false, mosaicSelected: true },
    });
    const svg = draw(s);
    // 16 tiles -- the penta-layer count for a generation 1 Star -- each giving a
    // fill path plus a grid path at this scale.
    assert.equal(svg.body.length, 32);
    assert.ok(svg.body.every((el) => el.startsWith("<path")));
    // The silhouette border is a different path, and shorter than the grid.
    const outlined = draw(s, {
        styles: { mosaicStyle: { ...DEFAULT_MOSAIC_STYLE, border: "outline" } },
    });
    assert.ok(outlined.toString().length < svg.toString().length);
});

test("below the resolution rule the grid border is dropped, as on canvas", () => {
    const s = scene({
        type: penrose.Star, gen: 1, mode: "discrete",
        overlays: { ...PenroseScreen.DEFAULT_OVERLAYS, pentaSelected: false, mosaicSelected: true },
    });
    const small = new SvgRenderer({ scale: 4 }).render(s.bounds.renderList);
    assert.equal(small.body.length, 16, "fill only, no per-cell grid");
});

test("attribute values are escaped", () => {
    const svg = new SvgRenderer({ scale: 1 });
    svg.line({ x: 0, y: 0 }, { x: 1, y: 1 }, 'red" onload="alert(1)');
    const out = svg.toString({ title: "<script>&" });
    assert.ok(!out.includes('onload="alert(1)"'));
    assert.ok(out.includes("&quot;"));
    assert.ok(out.includes("&lt;script&gt;&amp;"));
});

test("output size tracks the element count, as the plan measured", () => {
    // Generations 1 to 3 are the usable range on a page; 4 is file-only.
    const sizes = [1, 2, 3].map((gen) => draw(scene({ gen })).toString().length);
    assert.ok(sizes[0] < 5_000, `generation 1 is ${sizes[0]} bytes`);
    assert.ok(sizes[1] < 30_000, `generation 2 is ${sizes[1]} bytes`);
    assert.ok(sizes[2] < 200_000, `generation 3 is ${sizes[2]} bytes`);
});
