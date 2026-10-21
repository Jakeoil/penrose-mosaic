// Writes the SVG renderer's sample output into samples/.
//
//     node tools/svg-sample.mjs
//
// They are committed, so they can be opened from the served site --
// http://localhost:8010/samples/overlay.svg, or the Pages URL -- without
// running anything. Regenerate after changing svg-renderer.js, the same way
// tools/stamp.mjs is run after changing a script.
//
// This is the Sun/Star overlay as the page draws it, which is what the SVG work
// is for: the first intended use is PDFs of that page.

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = new URL("..", import.meta.url).href;
const { PenroseScreen } = await import(ROOT + "penrose-screen.js");
const { SvgRenderer } = await import(ROOT + "svg-renderer.js");
const { penrose } = await import(ROOT + "penrose.js");
const { p, ang } = await import(ROOT + "point.js");
const { DEFAULT_RHOMB_STYLE, DEFAULT_PENTA_STYLE } = await import(ROOT + "styles.js");

const OUT = join(dirname(fileURLToPath(ROOT + "x")), "samples");
mkdirSync(OUT, { recursive: true });

const SCALE = 12;

/** One seed's render list, built the way the Sun/Star page builds it. */
function list({ type, gen = 2, layer, orient = "up" }) {
    const scene = new PenroseScreen("real");
    scene.penta({
        type, gen,
        isHeads: true,
        angle: ang(0, orient === "down"),
        loc: p(0, 0),
        ...(layer ? { layer } : {}),
    });
    return scene.bounds.renderList;
}

function write(name, renderer, title) {
    const svg = renderer.toString({ title });
    writeFileSync(join(OUT, name), svg + "\n");
    const defs = renderer.gradients.size;
    console.log(
        `samples/${name.padEnd(20)} ${String(renderer.body.length).padStart(5)} elements` +
        `  ${(svg.length / 1024).toFixed(1).padStart(7)} KB` +
        (defs ? `  ${defs} gradient defs` : ""));
}

// The overlay: both seeds, one shared scale, one viewport. The page's own point.
const overlay = new SvgRenderer({ scale: SCALE, background: "white", pad: 12 });
overlay.render(list({ type: penrose.Sun }));
overlay.render(list({ type: penrose.Star }));
write("overlay.svg", overlay, "Sun and Star, generation 2");

// Each seed alone, which is what the page shows side by side.
for (const [name, type] of [["sun.svg", penrose.Sun], ["star.svg", penrose.Star],
                            ["deca.svg", penrose.Deca]]) {
    const r = new SvgRenderer({ scale: SCALE, background: "white", pad: 12 });
    r.render(list({ type }));
    write(name, r, name.replace(".svg", "") + ", generation 2");
}

// The rhombs with everything on -- the gradient and the isogloss are the parts
// that needed thinking about, so they are the parts worth looking at.
const rhombs = new SvgRenderer({
    scale: SCALE, background: "white", pad: 12,
    styles: { rhombStyle: { ...DEFAULT_RHOMB_STYLE, fill: "gradient", isogloss: true } },
});
rhombs.render(list({ type: penrose.Sun, layer: "rhomb" }));
write("rhombs.svg", rhombs, "Sun rhombs, gradient and isogloss");

// Rhombs over the pentagons, which is the overlay the sidebar can ask for.
const both = new SvgRenderer({
    scale: SCALE, background: "white", pad: 12,
    styles: {
        pentaStyle: { ...DEFAULT_PENTA_STYLE, fill: "transparent" },
        rhombStyle: { ...DEFAULT_RHOMB_STYLE, stroke: "dihedral" },
    },
});
both.render(list({ type: penrose.Sun }));
both.render(list({ type: penrose.Sun, layer: "rhomb" }));
write("layered.svg", both, "Sun, pentagons under rhombs");
