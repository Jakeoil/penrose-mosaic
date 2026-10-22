// The PDF renderer: structure, and agreement with the other two.
//
// The PDF is written by hand rather than converted, so the parts a reader will
// reject -- the xref offsets above all -- are the parts worth testing. macOS
// Quartz renders the output, which is the real acceptance test, but it needs a
// GUI framework so it is not run here.

import test from "node:test";
import assert from "node:assert/strict";

const ROOT = new URL("..", import.meta.url).href;
const { penrose } = await import(ROOT + "penrose.js");
const { p, ang } = await import(ROOT + "point.js");
const { PenroseScreen } = await import(ROOT + "penrose-screen.js");
const { PdfRenderer } = await import(ROOT + "pdf-renderer.js");
const { SvgRenderer } = await import(ROOT + "svg-renderer.js");
const { DEFAULT_PENTA_STYLE, DEFAULT_RHOMB_STYLE } = await import(ROOT + "styles.js");

const SCALE = 12;

function scene({ type = penrose.Star, gen = 2, layer } = {}) {
    const s = new PenroseScreen("real");
    s.penta({ type, gen, isHeads: true, angle: ang(0, false), loc: p(0, 0),
              ...(layer ? { layer } : {}) });
    return s;
}

const draw = (sceneObj, options) =>
    new PdfRenderer({ scale: SCALE, ...options }).render(sceneObj.bounds.renderList);

test("it runs with no DOM and produces a PDF", () => {
    assert.equal(typeof globalThis.document, "undefined");
    const pdf = draw(scene()).toString();
    assert.ok(pdf.startsWith("%PDF-1.4"));
    assert.ok(pdf.trimEnd().endsWith("%%EOF"));
});

test("every xref offset points at its own object", () => {
    // The one part a reader will reject outright if it is wrong.
    const pdf = draw(scene(), { title: "x", background: "white" }).toString();
    const start = Number(pdf.match(/startxref\s+(\d+)/)[1]);
    assert.equal(pdf.slice(start, start + 4), "xref");
    const offsets = [...pdf.slice(start).matchAll(/^(\d{10}) 00000 n/gm)]
        .map((m) => Number(m[1]));
    assert.ok(offsets.length >= 4);
    offsets.forEach((off, i) => {
        assert.ok(pdf.startsWith(`${i + 1} 0 obj`, off),
                  `object ${i + 1} is not at offset ${off}`);
    });
    assert.match(pdf, /trailer\s*<< \/Size \d+ \/Root 1 0 R/);
});

test("the stream length matches the stream", () => {
    const pdf = draw(scene()).toString();
    const declared = Number(pdf.match(/<< \/Length (\d+) >>/)[1]);
    const body = pdf.match(/stream\n([\s\S]*?)\nendstream/)[1];
    assert.equal(body.length, declared);
});

test("the page box is the drawing, and the flip puts it the right way up", () => {
    const r = draw(scene());
    const box = r.box;
    const bounds = scene().bounds;
    assert.ok(Math.abs(box.width - (bounds.maxPoint.x - bounds.minPoint.x) * SCALE) < 1e-6);
    const pdf = r.toString();
    assert.ok(pdf.includes(`/MediaBox [0 0 ${Math.round(box.width * 1000) / 1000} `));
    // PDF's y axis points up, so the content is drawn under a vertical flip.
    assert.match(r.contentStream(), /^1 0 0 -1 [-\d.]+ [-\d.]+ cm/);
});

test("it puts the tiles where the SVG renderer puts them", () => {
    // Both take the same list, so both must agree. The PDF coordinates are the
    // same numbers; only the flip, applied once at the top, differs.
    const svg = new SvgRenderer({ scale: SCALE }).render(scene().bounds.renderList);
    const pdfCoords = draw(scene()).ops
        .filter((op) => / [ml]$/.test(op))
        .map((op) => op.split(" ").slice(0, 2).map(Number));
    const svgCoords = svg.body.flatMap((el) => {
        const m = el.match(/points="([^"]+)"/);
        return m ? m[1].split(" ").map((pair) => pair.split(",").map(Number)) : [];
    });
    assert.equal(pdfCoords.length, svgCoords.length);
    for (let i = 0; i < svgCoords.length; i++)
        assert.deepEqual(pdfCoords[i], svgCoords[i], `vertex ${i}`);
});

test("transparency becomes one ExtGState per distinct alpha pair", () => {
    const solid = draw(scene());
    assert.equal(solid.alphas.size, 0, "no graphics state needed when opaque");

    const clear = draw(scene(), {
        styles: { pentaStyle: { ...DEFAULT_PENTA_STYLE, fill: "transparent" } },
    });
    assert.equal(clear.alphas.size, 1, "121 tiles, one shared state");
    const pdf = clear.toString();
    assert.match(pdf, /\/ExtGState << \/GS0 << \/Type \/ExtGState \/ca 0\.5 \/CA 1 >> >>/);
    assert.ok(pdf.includes("/GS0 gs"));
});

test("fill and stroke modes reach the operators", () => {
    const at = (pentaStyle) => draw(scene({ gen: 1 }), { styles: { pentaStyle } }).ops;
    const both = at({ ...DEFAULT_PENTA_STYLE });
    assert.ok(both.includes("B"), "fill and stroke in one operator");

    const fillOnly = at({ ...DEFAULT_PENTA_STYLE, stroke: "none" });
    assert.ok(fillOnly.includes("f") && !fillOnly.includes("B"));

    const strokeOnly = at({ ...DEFAULT_PENTA_STYLE, fill: "none" });
    assert.ok(strokeOnly.includes("S") && !strokeOnly.includes("f"));
});

test("the gradient is reported as substituted rather than drawn wrong", () => {
    // PDF wants an axial shading per gradient. Until that exists the fill is
    // solid, and saying so is the difference between a limitation and a bug.
    const r = draw(scene({ gen: 1, layer: "rhomb" }), {
        styles: { rhombStyle: { ...DEFAULT_RHOMB_STYLE, fill: "gradient" } },
    });
    assert.deepEqual([...r.unsupported], ["rhomb gradient (drawn solid)"]);

    const plain = draw(scene({ gen: 1, layer: "rhomb" }));
    assert.equal(plain.unsupported.size, 0);
});

test("colors are converted to PDF components", () => {
    const ops = draw(scene({ gen: 1 })).ops.filter((op) => op.endsWith(" rg"));
    assert.ok(ops.length > 0);
    for (const op of ops) {
        const parts = op.split(" ").slice(0, 3).map(Number);
        assert.equal(parts.length, 3);
        for (const v of parts) assert.ok(v >= 0 && v <= 1, op);
    }
    // #0000ff is the blue pentagon, and must come out as pure blue.
    assert.ok(ops.includes("0 0 1 rg"));
});

test("an empty list gives an empty page rather than NaN", () => {
    const r = new PdfRenderer({ scale: SCALE }).render([]);
    assert.ok(r.isEmpty);
    assert.deepEqual(r.box, { x: 0, y: 0, width: 0, height: 0 });
    assert.ok(r.toString().includes("/MediaBox [0 0 0 0]"));
});

test("the title is escaped", () => {
    const pdf = draw(scene({ gen: 1 }), { title: "Sun (and) \\ Star" }).toString();
    assert.ok(pdf.includes("/Title (Sun \\(and\\) \\\\ Star)"));
});
