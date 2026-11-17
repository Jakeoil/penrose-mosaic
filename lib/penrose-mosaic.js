// penrose-mosaic as a library. See docs/PLANS.md, "The core as a library".
//
//     // local, from a sibling project
//     import { star, toSVG } from "../penrose-mosaic/lib/penrose-mosaic.js";
//
//     // published
//     import { star } from "https://jakeoil.github.io/penrose-mosaic/lib/penrose-mosaic.js";
//
// This file names what is public. The modules behind it are free to move --
// shape-modes.js and the penta/star refactor are both still ahead -- so import
// from here, not from them.
//
// Two layers:
//
// - primitives, re-exported as they are: PenroseScreen, penrose, p, ang, Bounds
//   and the three renderers. No wrapping.
// - convenience builders: build(), and sun(), star(), deca() over it, which
//   return a render list and its bounds with the overlays defaulted. toSVG() and
//   toPDF() replay one or more of those into a document.
//
// A render list is an array of closures, each taking a renderer. Any object with
// outline, figure, grid, line and rhombus methods can replay it -- that
// five-method contract is the whole interface a new target needs.
//
// The names are the code's, not the papers'. This code's `Sun` is the papers'
// STAR, its `Star` is their SUN, and `Deca` is the CARTWHEEL. See
// docs/rhomb-groups.md.
//
// A Pages URL tracks main, so a change here can change a consumer. Copy the
// files for anything that must not move.

import { PenroseScreen } from "../penrose-screen.js";
import { penrose } from "../penrose.js";
import { p, ang, Angle } from "../point.js";
import { Bounds } from "../bounds.js";
import { SvgRenderer } from "../svg-renderer.js";
import { PdfRenderer } from "../pdf-renderer.js";
import { DEFAULT_PENTA_STYLE, DEFAULT_RHOMB_STYLE, DEFAULT_MOSAIC_STYLE } from "../styles.js";

export { PenroseScreen, penrose, p, ang, Angle, Bounds, SvgRenderer, PdfRenderer };
export { CanvasRenderer } from "../renderers.js";
export { DEFAULT_PENTA_STYLE, DEFAULT_RHOMB_STYLE, DEFAULT_MOSAIC_STYLE };

/** The two geometries. Mosaic is a presentation of "discrete", not a mode. */
export const MODES = Object.freeze(["real", "discrete"]);

/** The six tiles, then the three composite patches. */
export const TYPES = Object.freeze(["Pe5", "Pe3", "Pe1", "St5", "St3", "St1", "Sun", "Star", "Deca"]);

/** The layers a figure can be drawn in. Each one is a separate pass. */
export const LAYERS = Object.freeze(["penta", "rhomb"]);

function resolveType(type) {
    if (typeof type === "string") {
        if (!TYPES.includes(type))
            throw new RangeError(`unknown type "${type}"; expected one of ${TYPES.join(", ")}`);
        return penrose[type];
    }
    if (type && typeof type === "object" && TYPES.some((name) => penrose[name] === type)) return type;
    throw new TypeError("type must be a name such as \"Sun\" or one of the penrose.* types");
}

/**
 * Builds one figure.
 *
 * @param {object} [options]
 * @param {string|object} [options.type="Sun"] - a name from TYPES, or penrose.Sun etc.
 * @param {number} [options.gen=2] - generation. The list grows about sevenfold
 *   per generation; 4 is tens of thousands of commands.
 * @param {"real"|"discrete"} [options.mode="real"]
 * @param {"up"|"down"} [options.orient="up"]
 * @param {number} [options.fifths=0] - rotation in fifths of a turn
 * @param {boolean} [options.isHeads=true]
 * @param {string[]} [options.layers=["penta"]] - from LAYERS, drawn in order
 * @param {object} [options.overlays] - flags over PenroseScreen.DEFAULT_OVERLAYS.
 *   `mosaicSelected` only draws in "discrete"; the real geometry has no mosaic.
 * @param {[number, number]} [options.loc=[0, 0]]
 * @returns {{ renderList: Function[], bounds: Bounds, scene: PenroseScreen }}
 */
export function build({
    type = "Sun",
    gen = 2,
    mode = "real",
    orient = "up",
    fifths = 0,
    isHeads = true,
    layers = ["penta"],
    overlays,
    loc = [0, 0],
} = {}) {
    if (!MODES.includes(mode))
        throw new RangeError(`unknown mode "${mode}"; expected ${MODES.join(" or ")}`);
    if (orient !== "up" && orient !== "down")
        throw new RangeError(`orient must be "up" or "down", not "${orient}"`);
    if (!Number.isInteger(gen) || gen < 0) throw new RangeError("gen must be a whole number");
    for (const layer of layers)
        if (!LAYERS.includes(layer))
            throw new RangeError(`unknown layer "${layer}"; expected ${LAYERS.join(" or ")}`);

    const scene = new PenroseScreen(mode);
    // Per-scene, never through the call: penta() spreads its options last, so a
    // stray key there overrides arguments all the way down. See TODO.md.
    scene.overlays = Object.freeze({ ...PenroseScreen.DEFAULT_OVERLAYS, ...overlays });
    const args = {
        type: resolveType(type),
        gen,
        isHeads,
        angle: ang(fifths, orient === "down"),
        loc: p(loc[0], loc[1]),
    };
    for (const layer of layers) scene.penta({ ...args, layer });
    return { renderList: scene.bounds.renderList, bounds: scene.bounds, scene };
}

/** This code's `Sun` -- the papers' STAR. */
export const sun = (options) => build({ ...options, type: "Sun" });
/** This code's `Star` -- the papers' SUN. */
export const star = (options) => build({ ...options, type: "Star" });
/** This code's `Deca` -- the papers' CARTWHEEL. */
export const deca = (options) => build({ ...options, type: "Deca" });

// One figure or several, each either a build() result or build() options.
// Several share one viewport, which is how the overlay is drawn.
function replay(renderer, figures) {
    for (const figure of [].concat(figures))
        renderer.render((figure.renderList ? figure : build(figure)).renderList);
    return renderer;
}

/**
 * Renders to an SVG document string.
 *
 * @param figures - build() options or result, or an array of them
 * @param {object} [options] - scale, styles, background, pad, title, width, height
 */
export function toSVG(figures, { scale = 12, styles, background, pad = 0, title, width, height } = {}) {
    const renderer = replay(new SvgRenderer({ scale, styles, background, pad }), figures);
    return renderer.toString({ title, width, height });
}

/**
 * Renders to a PDF, returned as a binary string; write it with "latin1".
 * The rhomb gradient fills solid in PDF for now.
 *
 * @param figures - build() options or result, or an array of them
 * @param {object} [options] - scale, styles, background, pad, title
 */
export function toPDF(figures, { scale = 12, styles, background, pad = 0, title } = {}) {
    return replay(new PdfRenderer({ scale, styles, background, pad, title }), figures).toString();
}
