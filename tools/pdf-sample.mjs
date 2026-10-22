// Writes PDFs of the Sun/Star overlay into samples/.
//
//     node tools/pdf-sample.mjs
//
// This is what the SVG work was for. The PDFs are written directly by
// pdf-renderer.js rather than converted from the SVG -- see that file for why.

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = new URL("..", import.meta.url).href;
const { PenroseScreen } = await import(ROOT + "penrose-screen.js");
const { PdfRenderer } = await import(ROOT + "pdf-renderer.js");
const { penrose } = await import(ROOT + "penrose.js");
const { p, ang } = await import(ROOT + "point.js");
const { DEFAULT_PENTA_STYLE, DEFAULT_RHOMB_STYLE } = await import(ROOT + "styles.js");
const { globals } = await import(ROOT + "controls.js");

const OUT = join(dirname(fileURLToPath(ROOT + "x")), "samples");
mkdirSync(OUT, { recursive: true });

const SCALE = 12;

function list({ type, gen = 2, layer }) {
    const scene = new PenroseScreen("real");
    scene.penta({
        type, gen, isHeads: true, angle: ang(0, false), loc: p(0, 0),
        ...(layer ? { layer } : {}),
    });
    return scene.bounds.renderList;
}

/** Colors are baked in when the scene is built, so recolor before building. */
function inOneHue(hue, build) {
    const was = globals.shapeColors;
    globals.shapeColors = {
        shapeColors: {
            "pe5-color": hue, "pe3-color": hue, "pe1-color": hue,
            "star-color": hue, "boat-color": hue, "diamond-color": hue,
        },
    };
    try {
        return build();
    } finally {
        globals.shapeColors = was;
    }
}

function write(name, renderer) {
    const pdf = renderer.toString();
    writeFileSync(join(OUT, name), pdf, "latin1");
    const box = renderer.box;
    console.log(
        `samples/${name.padEnd(20)} ${String(renderer.ops.length).padStart(6)} ops` +
        `  ${(pdf.length / 1024).toFixed(1).padStart(7)} KB` +
        `  ${box.width.toFixed(0)}x${box.height.toFixed(0)} pt` +
        (renderer.unsupported.size
            ? `  [${[...renderer.unsupported].join(", ")}]` : ""));
}

// Both seeds on one page, as the overlay draws them.
const overlay = new PdfRenderer({
    scale: SCALE, background: "white", pad: 12,
    title: "Sun and Star, generation 2",
});
overlay.render(list({ type: penrose.Sun }));
overlay.render(list({ type: penrose.Star }));
write("overlay.pdf", overlay);

// The same, two hues at half opacity, which is the one worth printing.
const clear = new PdfRenderer({
    scale: SCALE, background: "white", pad: 12,
    title: "Sun in teal, Star in magenta",
    styles: { pentaStyle: { ...DEFAULT_PENTA_STYLE, fill: "transparent" } },
});
clear.render(inOneHue("#1b9aaa", () => list({ type: penrose.Sun })));
clear.render(inOneHue("#d81e5b", () => list({ type: penrose.Star })));
write("overlay-clear.pdf", clear);

// Pentagons under rhombs, the rhombs stroked by dihedral fold.
const layered = new PdfRenderer({
    scale: SCALE, background: "white", pad: 12,
    title: "Sun, pentagons under rhombs",
    styles: {
        pentaStyle: { ...DEFAULT_PENTA_STYLE, fill: "transparent" },
        rhombStyle: { ...DEFAULT_RHOMB_STYLE, stroke: "dihedral" },
    },
});
layered.render(list({ type: penrose.Sun }));
layered.render(list({ type: penrose.Sun, layer: "rhomb" }));
write("layered.pdf", layered);
