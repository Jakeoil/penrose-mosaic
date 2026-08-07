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
export function makeCanvas(canvasId) {
    const { shapeMode } = globals;
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.log("ID not found");
        return;
    }

    const scene = new PenroseScreen(shapeMode.shapeMode);
    let loc = p(0, 0);

    const gen = 0;
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

    function drawScene() {
        scene.pentaRhomb(type, angle, loc, gen);
        scene.bounds.pad(0.1);
        scene.bounds.round(0.1);
        resizeAndRender(scene, canvas, 10);
    }

    // todo suppress bounds.renderList
    scene.setToMeasure();
    drawScene();

    // Adjust the location and relist
    loc = loc.tr(scene.bounds.minPoint.neg);
    scene.setToRender();
    drawScene();
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
 * Two images, each with its own settings above it. Layer, stroke, fill and color
 * still come from the sidebar; both images share those.
 *
 * IMPORTANT -- read before adding a setting here. Every recursive call in
 * penrose-screen.js spreads ...options LAST, so any stray key riding in options
 * silently overrides the explicit argument of the same name, all the way down.
 * That is what corrupted the figures the first time this page had controls. Pass
 * per-figure settings as named parameters only. Nothing here goes through
 * options, and the two layer checkboxes work by choosing which calls to make
 * rather than by passing a flag down. See TODO 4a.
 */
const SUNSTAR_TYPE = {
    sun: penrose.Sun,
    star: penrose.Star,
    queen: penrose.Deca,
};

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

export function drawSunStar(id) {
    const page = document.querySelector(`#${id}`);
    if (!page || page.style.display == "none") return;
    const canvasA = document.querySelector("#sunstar-a");
    const canvasB = document.querySelector("#sunstar-b");
    if (!canvasA || !canvasB) {
        console.log(`drawSunStar: missing a canvas in #${id}`);
        return;
    }

    const SCALE = 4;
    const eleOverlay = document.querySelector("#sunstar-overlay");
    const overlay = eleOverlay ? eleOverlay.checked : false;
    const slots = [sunStarSlot("a"), sunStarSlot("b")];

    /**
     * Named parameters only. The checkboxes decide which calls happen; nothing
     * is handed to the recursion.
     *
     * Big and small rhombs are the same layer one generation apart -- small
     * recurses to gen 0 and draws shape index 0, large short-circuits at gen 1
     * and draws index 1. Which one you get is `smallRhomb`, so drawing both
     * means calling the rhomb layer twice with the flag flipped between. The
     * scene reads its overlays at draw time, so setting the property between
     * calls is enough.
     */
    function drawOne(scene, slot, loc, overlays) {
        const { type, angle, isHeads, gen, showPenta, showRhomb, showBigRhomb } = slot;
        const args = { type, angle, isHeads, loc, gen };

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

    /**
     * This page owns its overlays. The sidebar's Pentas-and-Stars and Rhombi
     * boxes gate drawing deep inside drawPentaPattern and drawRhombusPattern,
     * so with Rhombi unchecked -- its default -- nothing on this page could show
     * rhombs however the page's own checkbox was set. Setting them true here
     * hands control to the per-image checkboxes, which do the filtering by
     * choosing which calls to make. Tree, Ammann and Mosaic still come from the
     * sidebar, as do penta style, rhomb style and color.
     */
    function pageOverlays() {
        return {
            ...(globals.overlays || {}),
            pentaSelected: true,
            rhombSelected: true,
            smallRhomb: true,
            // This page has no mosaic checkbox, so it does not show mosaic
            // tiles. Inheriting the sidebar flag would make the page change
            // under a control it does not offer.
            mosaicSelected: false,
        };
    }

    /**
     * Measures in a throwaway scene so the canvas comes out tight, then draws
     * shifted against the origin. Each slot builds its own scene because each
     * carries its own mode; when two share a canvas they use the first slot's.
     */
    function renderInto(canvas, group) {
        const mode = group[0].mode;
        const overlays = pageOverlays();

        const ms = new PenroseScreen(mode);
        ms.setToMeasure();
        for (const slot of group) drawOne(ms, slot, p(0, 0), overlays);
        if (ms.bounds.isEmpty) return;
        const loc = ms.bounds.minPoint.neg;

        const scene = new PenroseScreen(mode);
        for (const slot of group) drawOne(scene, slot, loc, overlays);
        resizeAndRender(scene, canvas, SCALE);
    }

    if (overlay) {
        canvasB.style.display = "none";
        renderInto(canvasA, slots);
    } else {
        canvasB.style.display = "";
        renderInto(canvasA, [slots[0]]);
        renderInto(canvasB, [slots[1]]);
    }
}
