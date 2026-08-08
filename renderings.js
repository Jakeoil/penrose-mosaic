import { p, ang } from "./point.js";
import { Bounds } from "./bounds.js";
import { penrose } from "./penrose.js";
import { quadrille, mosaic } from "./shape-modes.js";

import { globals } from "./controls.js";
import { PenroseScreen, USE_FUNCTION_LIST } from "./penrose-screen.js";
import { CanvasRenderer } from "./renderers.js";

/**
 * Renders the scene to the selected 2d canvas.
 *
 * @param {PenroseScreen} scene
 * @param scene.measure{boolean}
 * @param scene.bounds {Bounds}
 * @param scene.bounds.maxPoint{Point}
 * @param scene.bounds.renderList{function[]} A list of functions.
 *
 * @param canvas{Canvas} Dom element
 *
 */

export function resizeAndRender(scene, canvas, scale) {
    if (scene.measure) {
        return;
    }

    let g = canvas.getContext("2d");

    let bounds = scene.bounds;
    if (bounds.isEmpty) {
        // Nothing to draw is a legitimate state -- every overlay can be turned
        // off. Returning here left the previous frame on the canvas, so the last
        // thing drawn stayed visible and the flag looked like it had been
        // ignored. Clear, then leave.
        g.fillStyle = "white";
        g.fillRect(0, 0, canvas.width, canvas.height);
        return;
    }

    // I believe canvas width and height can be put in directly
    const computedWidth = bounds.maxPoint.x * scale + scale;
    const computedHeight = bounds.maxPoint.y * scale + scale;
    if (
        canvas.width != Math.floor(computedWidth) ||
        canvas.height != Math.floor(computedHeight)
    ) {
        canvas.width = computedWidth;
        canvas.height = computedHeight;
    }

    g.fillStyle = "white";
    g.fillRect(0, 0, canvas.width, canvas.height);

    new CanvasRenderer(g, scale).render(bounds.renderList);
}

/******************************************************************************
 * Screen Drawing Routines
 *****************************************************************************/

/***
 * Draws a little canvas with a shape.
 * Shape depends on passed in ID.
 * Measures twice before rendering.
 */
/**
 * Every layer on. The six illustration canvases are sized from this rather than
 * from what is actually showing, so their size depends on type, generation and
 * mode only -- never on which overlay boxes are ticked. They sit inline in a
 * sentence, so a canvas that changed height reflowed the whole line.
 */
const ALL_LAYERS = {
    pentaSelected: true,
    mosaicSelected: true,
    rhombSelected: true,
    smallRhomb: true,
    treeSelected: false,
    ammannSelected: true,
};

export function makeCanvas(canvasId) {
    const { shapeMode } = globals;
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.log("ID not found");
        return;
    }

    const gen = 0;
    const SCALE = 10;
    const [type, angle] =
        canvasId == "p5"
            ? [penrose.Pe5, ang(0, true)]
            : canvasId == "p3"
              ? [penrose.Pe3, ang(0, false)]
              : canvasId == "p1"
                ? [penrose.Pe1, ang(0, false)]
                : canvasId == "s5"
                  ? [penrose.St5, ang(0, false)]
                  : canvasId == "s3"
                    ? [penrose.St3, ang(1, true)]
                    : canvasId == "s1"
                      ? [penrose.St1, ang(1, false)]
                      : [];
    if (!type) return;

    // Returns null when nothing was drawn. The emptiness has to be read before
    // padding: pad() on empty bounds sets them to (0,0), which makes isEmpty
    // false and a genuinely empty figure look like a zero-sized one.
    const measure = (overlays) => {
        const ms = new PenroseScreen(shapeMode.shapeMode);
        if (overlays) ms.overlays = overlays;
        ms.setToMeasure();
        ms.pentaRhomb(type, angle, p(0, 0), gen);
        if (ms.bounds.isEmpty) return null;
        ms.bounds.pad(0.1);
        ms.bounds.round(0.1);
        return ms.bounds;
    };

    // The box, from everything this figure could ever draw.
    const box = measure(ALL_LAYERS);
    if (!box) return;
    const boxW = box.maxPoint.x - box.minPoint.x;
    const boxH = box.maxPoint.y - box.minPoint.y;

    // Only the height is pinned. These sit inline in a sentence, so a changing
    // height moves the line box and everything after it; a changing width just
    // shifts the text along, which is what it did before and is fine.
    //
    // The figure sits on the bottom of the box, not centred -- centring floats
    // it away from the text baseline.
    const shown = measure(null);
    let loc = p(0, 0);
    let width = boxW; // nothing drawn: hold the slot rather than show a sliver
    if (shown) {
        width = shown.maxPoint.x - shown.minPoint.x;
        const h = shown.maxPoint.y - shown.minPoint.y;
        loc = p(-shown.minPoint.x, boxH - h - shown.minPoint.y);
    }

    const scene = new PenroseScreen(shapeMode.shapeMode);
    scene.pentaRhomb(type, angle, loc, gen);
    // Pin the height whatever was drawn -- including nothing, so an empty figure
    // holds its place rather than collapsing the line.
    scene.bounds.addPoint(p(0, 0), p(0, 0));
    scene.bounds.addPoint(p(0, 0), p(width, boxH));
    resizeAndRender(scene, canvas, SCALE);
}

/**
 * The first expansion draws penta(1) and star(1) variants
 * Sets the globals g and scale
 */
export function drawFirstInflation(id) {
    const page = document.querySelector(`#${id}`);
    if (page.style.display == "none") return;
    const canvas = document.querySelector(`#${id} > canvas`);
    if (!canvas) {
        console.log("canvasId is null!");
        return;
    }
    const { shapeMode } = globals;
    const scene = new PenroseScreen(shapeMode.shapeMode);

    const drawScreen = function () {
        let x = 11;
        let y = 9;
        const UP = false;
        const DOWN = true;

        let type = penrose.Pe5;
        let angle = ang(0, UP);
        let loc = p(x, y);
        const gen = 1;

        scene.pentaRhomb(type, angle, loc, gen);

        type = penrose.Pe5;
        angle = ang(0, DOWN);
        loc = p(25, y);

        scene.pentaRhomb(type, angle, loc, gen);
        y += 18;
        type = penrose.Pe3;
        for (let i = 0; i < 5; i++) {
            angle = ang(i, UP);
            loc = p(x + i * 20, y);
            scene.pentaRhomb(type, angle, loc, gen);
        }

        y += 20;

        for (let i = 0; i < 5; i++) {
            angle = ang(i, DOWN);
            loc = p(x + i * 20, y);
            scene.pentaRhomb(type, angle, loc, gen);
        }
        y += 20;
        type = penrose.Pe1;
        for (let i = 0; i < 5; i++) {
            angle = ang(i, UP);
            loc = p(x + i * 20, y);
            scene.pentaRhomb(type, angle, loc, gen);
        }
        y += 20;
        for (let i = 0; i < 5; i++) {
            angle = ang(i, DOWN);
            loc = p(x + i * 20, y);
            scene.pentaRhomb(type, angle, loc, gen);
        }
        y += 25;
        type = penrose.St5;
        angle = ang(0, UP);
        loc = p(15, y);

        scene.pentaRhomb(type, angle, loc, gen);

        angle = ang(0, DOWN);
        loc = p(45, y);
        scene.pentaRhomb(type, angle, loc, gen);

        x = 10;
        y += 30;

        type = penrose.St1;
        for (let i = 0; i < 5; i++) {
            angle = ang(i, UP);
            loc = p(x + i * 20, y);
            scene.pentaRhomb(type, angle, loc, gen);
        }
        y += 25;
        for (let i = 0; i < 5; i++) {
            angle = ang(i, DOWN);
            loc = p(x + i * 20, y);
            scene.pentaRhomb(type, angle, loc, gen);
        }

        x = 15;
        y += 25;
        type = penrose.St3;
        for (let i = 0; i < 5; i++) {
            angle = ang(i, UP);
            loc = p(x + i * 25, y);
            scene.pentaRhomb(type, angle, loc, gen);
        }
        y += 25;
        for (let i = 0; i < 5; i++) {
            angle = ang(i, DOWN);
            loc = p(x + i * 25, y);
            scene.pentaRhomb(type, angle, loc, gen);
        }

        resizeAndRender(scene, canvas, 10);
    };

    drawScreen();
}

/**
 *
 * @param {*} id
 * @returns
 */
export function drawSecondInflation(id) {
    const page = document.querySelector(`#${id}`);
    if (page.style.display == "none") return;
    const canvas = document.querySelector(`#${id} > canvas`);

    const { shapeMode } = globals;
    const scene = new PenroseScreen(shapeMode.shapeMode);
    const penta = scene.penta.bind(scene);
    const star = scene.star.bind(scene);
    scene.setToRender();
    drawScreen();
    /**
     *
     */
    function drawScreen() {
        const UP = false;
        const DOWN = true;

        let x = 25;
        let y = 25;

        scene.pentaRhomb(penrose.Pe5, ang(0, UP), p(x, y), 2);

        let type = penrose.Pe5;
        let angle = ang(0, DOWN);
        let loc = p(x + 50, y);
        let gen = 2;
        let rhomb = true;

        scene.pentaRhomb(type, angle, loc, gen);
        y += 50;
        x = 25;
        type = penrose.Pe3;

        for (let i = 0; i < 5; i++) {
            angle = ang(i, UP);
            loc = p(x + i * 50, y);
            scene.pentaRhomb(type, angle, loc, gen);
        }
        y += 55;

        for (let i = 0; i < 5; i++) {
            angle = ang(i, DOWN);
            loc = p(x + i * 50, y);
            scene.pentaRhomb(type, angle, loc, gen);
        }
        y += 50;
        type = penrose.Pe1;
        for (let i = 0; i < 5; i++) {
            angle = ang(i, UP);
            loc = p(x + i * 50, y);
            scene.pentaRhomb(type, angle, loc, gen);
        }
        y += 55;
        for (let i = 0; i < 5; i++) {
            angle = ang(i, DOWN);
            loc = p(x + i * 50, y);
            scene.pentaRhomb(type, angle, loc, gen);
        }
        y += 60; // one thru four
        type = penrose.St5;
        angle = ang(0, UP);
        loc = p(35, y);
        scene.pentaRhomb(type, angle, loc, gen);

        angle = ang(0, DOWN);
        loc = p(100, y);
        scene.pentaRhomb(type, angle, loc, gen);
        y += 74; // one thru four
        x = 35;
        type = penrose.St3;

        for (let i = 0; i < 5; i++) {
            angle = ang(i, UP);
            loc = p(x + i * 67, y);
            scene.pentaRhomb(type, angle, loc, gen);
        }
        y += 70; // one thru four
        for (let i = 0; i < 5; i++) {
            angle = ang(i, DOWN);
            loc = p(x + i * 67, y);
            scene.pentaRhomb(type, angle, loc, gen);
        }
        type = penrose.St1;
        y += 75; // one thru four
        for (let i = 0; i < 5; i++) {
            angle = ang(i, UP);
            loc = p(x + i * 50, y);
            scene.pentaRhomb(type, angle, loc, gen);
        }
        y += 60; // one thru four
        for (let i = 0; i < 5; i++) {
            angle = ang(i, DOWN);
            loc = p(x + i * 50, y);
            scene.pentaRhomb(type, angle, loc, gen);
        }

        resizeAndRender(scene, canvas, 5);
    }
}

/***
 * A lot of cool stuff for computing sizes here
 */
export function drawGridWork(id) {
    const page = document.querySelector(`#${id}`);
    if (page.style.display == "none") return;
    const canvas = document.querySelector(`#${id} > canvas`);

    const { shapeMode, shapeColors, overlays } = globals;
    const scene = new PenroseScreen(shapeMode.shapeMode);
    const grid = scene.grid.bind(scene);
    const figure = scene.figure.bind(scene);
    const outline = scene.outline.bind(scene);
    const deca = scene.deca.bind(scene);
    const penta = scene.penta.bind(scene);
    drawBig();

    /**
     * Draws all of the penrose rotations
     * Draws a few decagons too.
     */
    function drawBig() {
        let y = 5;
        const spacing = 12;

        // This page draws its mosaic row from the mosaic shape data directly
        // rather than through drawPentaPattern, so it has to honour the flag
        // itself. Turning mosaic off means no mosaic tiles anywhere, and there
        // is no mosaic of the real geometry at all.
        const showMosaic =
            overlays &&
            overlays.mosaicSelected &&
            shapeMode.shapeMode !== shapeMode.MODE_REAL;

        if (showMosaic) {
            const mosaicShapes = [
                mosaic.penta,
                mosaic.diamond,
                mosaic.star,
                mosaic.boat,
            ];

            for (const shape of mosaicShapes) {
                for (let i = 0; i < 10; i++) {
                    let offset = p((i + 1) * spacing, y);
                    figure(
                        shapeColors.shapeColors["pe1-color"],
                        offset,
                        shape[i]
                    );
                    grid(p((i + 1) * spacing, y), 5);
                }
                y += spacing;
            }
        }

        y = 5;
        const qShapes = [
            quadrille.penta,
            quadrille.diamond,
            quadrille.star,
            quadrille.boat,
        ];

        for (const shape of qShapes) {
            for (let i = 0; i < 10; i++) {
                let offset = p((i + 1) * spacing, y);

                outline(
                    shapeColors.shapeColors["pe1-color"] + "44",
                    offset,
                    shape[i],
                );
            }
            y += spacing;
        }

        let fifths;
        let isDown;
        let base;
        let exp;

        // Now some decagons

        fifths = 0;
        isDown = false;
        base = p(15, 75);
        exp = 1;

        console.log(`decas`);
        deca({ angle: ang(fifths, isDown), loc: base, gen: exp });
        console.log(
            `scene bounds: ${scene.bounds} ${scene.bounds.renderList.length}`,
        );
        grid(base, 10);

        penta({
            type: penrose.Deca,
            angle: ang(fifths, isDown),
            loc: base,
            gen: exp,
            rhomb: true,
        });

        fifths = 0;
        isDown = false;
        base = p(45, 75);
        exp = 2;

        deca({ angle: ang(fifths, isDown), loc: base, gen: exp });
        grid(base, 18);

        deca({
            angle: ang(fifths, isDown),
            loc: base,
            gen: exp,
            rhomb: true,
        });

        fifths = 3;
        isDown = true;
        base = p(15, 115);
        exp = 1;

        deca({
            angle: ang(fifths, isDown),
            loc: base,
            gen: exp,
        });
        grid(base, 10);

        deca({
            angle: ang(fifths, isDown),
            loc: base,
            gen: exp,
            rhomb: true,
        });

        fifths = 3;
        isDown = true;
        base = p(45, 115);
        exp = 2;

        deca({
            angle: ang(fifths, isDown),
            loc: base,
            gen: exp,
        });
        grid(base, 18);

        deca({
            angle: ang(fifths, isDown),
            loc: base,
            gen: exp,
            rhomb: true,
        });

        fifths = 1;
        isDown = false;
        base = p(15, 155);
        exp = 1;

        deca({
            angle: ang(fifths, isDown),
            loc: base,
            gen: exp,
        });
        grid(base, 10);

        deca({
            angle: ang(fifths, isDown),
            loc: base,
            gen: exp,
            rhomb: true,
        });

        fifths = 1;
        isDown = false;
        base = p(45, 155);
        exp = 2;

        deca({
            angle: ang(fifths, isDown),
            loc: base,
            gen: exp,
        });
        grid(base, 18);

        deca({
            angle: ang(fifths, isDown),
            loc: base,
            gen: exp,
            rhomb: true,
        });
        console.log(
            `resize and render: ${scene.bounds.renderList.length} , ${scene.bounds}`,
        );
        resizeAndRender(scene, canvas, 10);
    }
}

/**
 * For the third expansion we want to use a different scheme.
 *
 * expansion
 * star or pentagon
 * 5 4 or 2
 * up or down
 *
 * @param {} canvasId
 */
export function drawGeneric123(id) {
    const page = document.querySelector(`#${id}`);
    if (page.style.display == "none") return;
    const canvas = document.querySelector(`#${id} > canvas`);
    const { shapeMode, controls } = globals;
    const type = controls.typeList[controls.typeIndex];
    const angle = ang(controls.fifths, controls.isDown);
    const isHeads = controls.isHeads;
    // "dual" here was a leftover of the abandoned dual rhomb research, and it
    // meant the rhomb layer was never drawn on this page -- which is why the
    // large/small rhomb radio did nothing here. See TODO 4a.
    const layer = "rhomb";

    const isPenta =
        type === penrose.Pe1 || type === penrose.Pe3 || type === penrose.Pe5;
    const isStar =
        type === penrose.St1 || type === penrose.St3 || type === penrose.St5;
    const isDeca = type === penrose.Deca;

    // Generation lists: top row gens, bottom figure gen
    const topGens = isDeca ? [1, 2, 3] : [0, 1, 2];
    const bottomGen = isDeca ? 4 : 3;

    // Helper: draw one generation at a given loc into a scene
    function drawOne(scene, gen, loc) {
        // penta() routes every type -- stars, Deca, Sun and Star included.
        scene.penta({ type, angle, isHeads, loc, gen });
        scene.penta({ type, angle, isHeads, loc, gen, layer });
    }

    // Measure each generation to get its bounding box
    function measureGen(gen) {
        const ms = new PenroseScreen(shapeMode.shapeMode);
        ms.setToMeasure();
        drawOne(ms, gen, p(0, 0));
        return ms.bounds;
    }

    const begin = performance.now();
    const topBoxes = topGens.map((g) => measureGen(g));
    const bottomBox = measureGen(bottomGen);

    // Compute top row layout: each figure centered on a common y, spaced apart
    const GAP = 4; // gap between figures in tile units
    const MARGIN_X = 2;

    // For each top figure, compute width and height from its bounding box
    const topSizes = topBoxes.map((b) => ({
        w: b.isEmpty ? 0 : b.maxPoint.x - b.minPoint.x,
        h: b.isEmpty ? 0 : b.maxPoint.y - b.minPoint.y,
        minX: b.isEmpty ? 0 : b.minPoint.x,
        minY: b.isEmpty ? 0 : b.minPoint.y,
    }));
    const bottomSize = {
        w: bottomBox.isEmpty ? 0 : bottomBox.maxPoint.x - bottomBox.minPoint.x,
        h: bottomBox.isEmpty ? 0 : bottomBox.maxPoint.y - bottomBox.minPoint.y,
        minX: bottomBox.isEmpty ? 0 : bottomBox.minPoint.x,
        minY: bottomBox.isEmpty ? 0 : bottomBox.minPoint.y,
    };

    // Top row: common vertical center
    const maxTopH = Math.max(...topSizes.map((s) => s.h));
    const topCenterY = MARGIN_X + maxTopH / 2;

    // Compute x positions: each figure placed so its center is at the right spot
    const topLocs = [];
    let curX = MARGIN_X;
    for (let i = 0; i < topSizes.length; i++) {
        const s = topSizes[i];
        // Center of figure goes at (curX + s.w/2, topCenterY)
        // loc needs to offset from the measured min so center aligns
        const cx = curX + s.w / 2;
        const locX = cx - (s.minX + s.w / 2); // = cx - measured center x
        const locY = topCenterY - (s.minY + s.h / 2); // align vertical centers
        topLocs.push(p(locX, locY));
        curX += s.w + GAP;
    }

    // Bottom figure: start near left margin, below top row
    const topBottom = topCenterY + maxTopH / 2;
    const bottomLocX = MARGIN_X - bottomSize.minX;
    const bottomLocY = topBottom + GAP - bottomSize.minY;
    const bottomLoc = p(bottomLocX, bottomLocY);

    // Final render pass
    const scene = new PenroseScreen(shapeMode.shapeMode);
    for (let i = 0; i < topGens.length; i++) {
        drawOne(scene, topGens[i], topLocs[i]);
    }
    drawOne(scene, bottomGen, bottomLoc);

    const built = performance.now();
    resizeAndRender(scene, canvas, 10);
    console.log(`shapes built: ${built - begin} ms`);
    const rendered = performance.now();
    console.log(
        `shapes rendered: ${rendered - built} ms, function list: ${USE_FUNCTION_LIST}`,
    );
}

/***
 * Gen 5 expansion of the selected shape type.
 * Uses measure/render two-pass for auto-sizing.
 */
export function drawGeneric3(id) {
    const page = document.querySelector(`#${id}`);
    if (page.style.display == "none") return;
    const canvas = document.querySelector(`#${id} > canvas`);

    const { shapeMode, controls } = globals;
    const scene = new PenroseScreen(shapeMode.shapeMode);
    const penta = scene.penta.bind(scene);
    const star = scene.star.bind(scene);
    const deca = scene.deca.bind(scene);
    let base = p(0, 0);

    const drawScreen = function () {
        const type = controls.typeList[controls.typeIndex];
        const angle = ang(controls.fifths, controls.isDown);
        const isHeads = controls.isHeads;
        const loc = p(0, 0).tr(base);
        const gen = 5;
        // See TODO 4a -- "dual" was a leftover, and it kept the rhomb layer
        // from ever being drawn on this page.
        const layer = "rhomb";
        const begin = performance.now();

        // penta() routes every type -- stars, Deca, Sun and Star included.
        penta({ type, angle, isHeads, loc, gen });
        penta({ type, angle, isHeads, loc, gen, layer });

        const built = performance.now();
        console.log(`shapes built: ${built - begin} ms`);
        resizeAndRender(scene, canvas, 4);
        const rendered = performance.now();
        console.log(
            `shapes rendered: ${
                rendered - built
            } ms, function list: ${USE_FUNCTION_LIST}`,
        );
    };

    scene.setToMeasure();
    drawScreen();
    base = base.tr(scene.bounds.minPoint.neg);
    scene.setToRender();
    drawScreen();
}

/***
 * Sun/Star.
 *
 * Fixed viewports rather than canvases sized to their drawing. The two panels
 * are synchronous: one shared scale, each centred on its own seed, so the
 * figures stay directly comparable and nothing moves when a layer is toggled.
 *
 * Scale starts at whatever fits the larger of the two figures and is then
 * multiplied by a zoom the wheel adjusts. Changing shape or generation refits,
 * because the fit is recomputed every draw and only the zoom persists.
 *
 * Side by side gives two half-width viewports; overlay gives one full-width
 * viewport with both figures drawn into it about the same centre.
 *
 * IMPORTANT -- everything here is a named parameter. Nothing goes through
 * ...options; see the hazard note at the top of TODO.md.
 */
const SUNSTAR_TYPE = {
    sun: penrose.Sun,
    star: penrose.Star,
    queen: penrose.Deca,
};

const SUNSTAR_VIEW_W = 1200; // whole drawing area
const SUNSTAR_VIEW_H = 620;
const SUNSTAR_GAP = 8;
const SUNSTAR_MARGIN = 0.94; // leave a little air at the fitted scale

let sunStarZoom = 1;

function sunStarSlot(key) {
    const ele = (name) => document.querySelector(`#ss-${key}-${name}`);
    const pick = (name, dflt) => (ele(name) ? ele(name).value : dflt);
    const checked = (name, dflt) => (ele(name) ? ele(name).checked : dflt);
    const gen = parseInt(pick("gen", "3"), 10);
    return {
        type: SUNSTAR_TYPE[pick("type", "sun")] || penrose.Sun,
        angle: ang(0, pick("orient", "up") === "down"),
        isHeads: pick("parity", "heads") === "heads",
        gen: Number.isFinite(gen) ? Math.max(1, Math.min(5, gen)) : 3,
        mode: pick("mode", "discrete"),
        showPenta: checked("penta", true),
        showRhomb: checked("rhomb", true),
        showBigRhomb: checked("bigrhomb", false),
    };
}

/**
 * This page owns its overlays. The sidebar's boxes gate drawing deep inside
 * drawPentaPattern and drawRhombusPattern, and Rhombi is unchecked by default,
 * so without this the page could never show rhombs however its own checkbox was
 * set. Mosaic is off because the page offers no mosaic checkbox.
 */
function sunStarOverlays() {
    return {
        ...(globals.overlays || {}),
        pentaSelected: true,
        rhombSelected: true,
        smallRhomb: true,
        mosaicSelected: false,
    };
}

/**
 * Big and small rhombs are the same layer one generation apart, chosen by
 * smallRhomb, so showing both means calling the layer twice with the flag
 * flipped. The scene reads its overlays at draw time.
 */
function sunStarDraw(scene, slot, overlays) {
    const { type, angle, isHeads, gen, showPenta, showRhomb, showBigRhomb } = slot;
    const args = { type, angle, isHeads, loc: p(0, 0), gen };
    if (showPenta) {
        scene.overlays = overlays;
        scene.penta(args);
    }
    if (showRhomb) {
        scene.overlays = { ...overlays, smallRhomb: true };
        scene.penta({ ...args, layer: "rhomb" });
    }
    if (showBigRhomb) {
        scene.overlays = { ...overlays, smallRhomb: false };
        scene.penta({ ...args, layer: "rhomb" });
    }
    scene.overlays = overlays;
}

function sunStarMeasure(slot, overlays) {
    const ms = new PenroseScreen(slot.mode);
    ms.setToMeasure();
    sunStarDraw(ms, slot, overlays);
    return ms.bounds;
}

/**
 * Draws into a viewport of fixed pixel size. The scene is built about the
 * origin, and the origin is put at the centre of the canvas, so zooming holds
 * the centre still.
 */
function sunStarRender(canvas, w, h, slots, overlays, scale) {
    canvas.width = w;
    canvas.height = h;
    const g = canvas.getContext("2d");
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = "white";
    g.fillRect(0, 0, w, h);

    for (const slot of slots) {
        const scene = new PenroseScreen(slot.mode);
        sunStarDraw(scene, slot, overlays);
        if (scene.bounds.isEmpty) continue;
        g.save();
        g.translate(w / 2, h / 2);
        new CanvasRenderer(g, scale).render(scene.bounds.renderList);
        g.restore();
    }

    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = "#444";
    g.font = "12px sans-serif";
    g.textBaseline = "top";
    g.fillText(`scale ${scale.toFixed(2)}`, 6, 6);
    g.restore();
}

export function drawSunStar(id) {
    const page = document.querySelector(`#${id}`);
    if (!page || page.style.display == "none") return;
    const canvasA = document.querySelector("#sunstar-a");
    const canvasB = document.querySelector("#sunstar-b");
    const slotEleB = document.querySelector("#sunstar-slot-b");
    if (!canvasA || !canvasB) {
        console.log(`drawSunStar: missing a canvas in #${id}`);
        return;
    }

    const eleOverlay = document.querySelector("#sunstar-overlay");
    const overlay = eleOverlay ? eleOverlay.checked : false;
    const overlays = sunStarOverlays();
    const slots = [sunStarSlot("a"), sunStarSlot("b")];

    const viewW = overlay
        ? SUNSTAR_VIEW_W
        : Math.floor((SUNSTAR_VIEW_W - SUNSTAR_GAP) / 2);
    const viewH = SUNSTAR_VIEW_H;

    // Fit the larger figure. Half-extents about the origin, since that is where
    // the seed sits and where the viewport is centred.
    let halfW = 0;
    let halfH = 0;
    for (const slot of slots) {
        const b = sunStarMeasure(slot, overlays);
        if (b.isEmpty) continue;
        halfW = Math.max(halfW, Math.abs(b.minPoint.x), Math.abs(b.maxPoint.x));
        halfH = Math.max(halfH, Math.abs(b.minPoint.y), Math.abs(b.maxPoint.y));
    }
    const fit =
        halfW > 0 && halfH > 0
            ? Math.min(viewW / (2 * halfW), viewH / (2 * halfH)) * SUNSTAR_MARGIN
            : 4;
    const scale = fit * sunStarZoom;

    if (overlay) {
        if (slotEleB) slotEleB.style.display = "none";
        sunStarRender(canvasA, viewW, viewH, slots, overlays, scale);
    } else {
        if (slotEleB) slotEleB.style.display = "";
        sunStarRender(canvasA, viewW, viewH, [slots[0]], overlays, scale);
        sunStarRender(canvasB, viewW, viewH, [slots[1]], overlays, scale);
    }
}

/**
 * Wheel zooms both viewports together; double click refits. Wired once, from
 * controls.js, which is where the page's other controls are wired.
 */
export function sunStarZoomBy(factor) {
    sunStarZoom = Math.max(0.05, Math.min(40, sunStarZoom * factor));
}

export function sunStarResetZoom() {
    sunStarZoom = 1;
}
