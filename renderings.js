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
        console.log(`isEmpty`);
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

export function drawDualDemo(id) {
    const { shapeMode, controls } = globals;

    const scene = new PenroseScreen(shapeMode.shapeMode);
    const scene2 = new PenroseScreen(shapeMode.shapeMode);

    let x = 8;
    let y = 9;
    const UP = false;
    const DOWN = true;
    let type = penrose.Pe5;
    let angle = ang(0, UP);
    let loc = p(x, y);
    let gen = 1;
    let rhomb = true;

    scene.penta({
        type: penrose.Pe5,
        angle: ang(0, false),
        loc: p(25, 25),
        gen: 3,
        layer: "penta",
    });
    scene2.penta({
        type: penrose.St5,
        angle: ang(0, false),
        loc: p(25 * 1.618, 25 * 1.618),
        gen: 3,
        layer: "rhomb",
        PentaStyle: { fill: "none", stroke: "solid" },
    });

    const page = document.querySelector(`#${id}`);
    if (page.style.display == "none") return;
    const canvas = document.querySelector(`#${id} > canvas`);

    let g = canvas.getContext("2d");
    g.fillStyle = "white";
    g.fillRect(0, 0, canvas.width, canvas.height);
    g.strokeStyle = penrose.OUTLINE;
    g.lineWidth = 1;

    let scale = 10;
    new CanvasRenderer(g, scale).render(scene.bounds.renderList);
    new CanvasRenderer(g, scale * 0.618).render(scene2.bounds.renderList);
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

        scene.pentaDual(penrose.Pe5, ang(0, UP), p(x, y), 2);

        let type = penrose.Pe5;
        let angle = ang(0, DOWN);
        let loc = p(x + 50, y);
        let gen = 2;
        let rhomb = true;

        scene.pentaDual(type, angle, loc, gen);
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
        scene.pentaDual(type, angle, loc, gen);

        angle = ang(0, DOWN);
        loc = p(100, y);
        scene.pentaDual(type, angle, loc, gen);
        y += 74; // one thru four
        x = 35;
        type = penrose.St3;

        for (let i = 0; i < 5; i++) {
            angle = ang(i, UP);
            loc = p(x + i * 67, y);
            scene.pentaDual(type, angle, loc, gen);
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

    const { shapeMode, shapeColors } = globals;
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
        const mosaicShapes = [
            mosaic.penta,
            mosaic.diamond,
            mosaic.star,
            mosaic.boat,
        ];

        console.log(`grid1`);
        const spacing = 12;
        for (const shape of mosaicShapes) {
            for (let i = 0; i < 10; i++) {
                let offset = p((i + 1) * spacing, y);
                figure(shapeColors.shapeColors["pe1-color"], offset, shape[i]);
                grid(p((i + 1) * spacing, y), 5);
            }
            y += spacing;
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
                    shape[i]
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
            `scene bounds: ${scene.bounds} ${scene.bounds.renderList.length}`
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
            `resize and render: ${scene.bounds.renderList.length} , ${scene.bounds}`
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
    const scene = new PenroseScreen(shapeMode.shapeMode);
    const penta = scene.penta.bind(scene);
    const star = scene.star.bind(scene);
    const deca = scene.deca.bind(scene);

    const drawScreen = function () {
        let x = 13;
        let y = 26;
        const begin = performance.now();
        const bounds = new Bounds();
        const type = controls.typeList[controls.typeIndex];
        const angle = ang(controls.fifths, controls.isDown);
        const isHeads = controls.isHeads;
        const layer = "dual";
        switch (type) {
            case penrose.Pe1:
            case penrose.Pe3:
            case penrose.Pe5:
                penta({ type, angle, isHeads, loc: p(x, y), gen: 0 });

                penta({ type, angle, isHeads, loc: p(x, y), gen: 0, layer });
                x += 21;
                penta({ type, angle, isHeads, loc: p(x, y), gen: 1 });

                penta({ type, angle, isHeads, loc: p(x, y), gen: 1, layer });
                x += 34;
                penta({ type, angle, isHeads, loc: p(x, y), gen: 2 });

                penta({ type, angle, isHeads, loc: p(x, y), gen: 2, layer });
                x = 73;
                y += 100;
                penta({ type, angle, isHeads, loc: p(x, y), gen: 3 });

                penta({ type, angle, isHeads, loc: p(x, y), gen: 3, layer });

                break;
            case penrose.St1:
            case penrose.St3:
            case penrose.St5:
                y += 10;
                star({ type, angle, isHeads, loc: p(x, y), gen: 0 });

                star({ type, angle, isHeads, loc: p(x, y), gen: 0, layer });
                x += 21;
                star({ type, angle, isHeads, loc: p(x, y), gen: 1 });

                star({ type, angle, isHeads, loc: p(x, y), gen: 1, layer });
                x += 54;
                star({ type, angle, isHeads, loc: p(x, y), gen: 2 });

                star({ type, angle, isHeads, loc: p(x, y), gen: 2, layer });
                x = 93;
                y += 130;
                star({ type, angle, isHeads, loc: p(x, y), gen: 3 });

                star({ type, angle, isHeads, loc: p(x, y), gen: 3, layer });

                break;
            case penrose.Deca:
                deca({ angle, isHeads, loc: p(x, y), gen: 1 });
                deca({ angle, isHeads, loc: p(x, y), gen: 1, layer });
                x += 31;
                deca({ angle, isHeads, loc: p(x, y), gen: 2 });
                deca({ angle, isHeads, loc: p(x, y), gen: 2, layer });
                x += 64;
                y += 30;
                deca({ angle, isHeads, loc: p(x, y), gen: 3 });
                deca({ angle, isHeads, loc: p(x, y), gen: 3, layer });
                y += 170;
                x += 30;
                deca({ angle, isHeads, loc: p(x, y), gen: 4 });
                deca({ angle, isHeads, loc: p(x, y), gen: 4, layer });
                break;
        }
        const built = performance.now();
        resizeAndRender(scene, canvas, 10);

        console.log(`shapes built: ${built - begin} ms`);
        const rendered = performance.now();
        console.log(
            `shapes rendered: ${
                rendered - built
            } ms, function list: ${USE_FUNCTION_LIST}`
        );
    };

    drawScreen();
}

/***
 * This draws big decas.
 * Let's make it friendlier
 */
export function drawGeneric3(id) {
    const page = document.querySelector(`#${id}`);
    if (page.style.display == "none") return;
    const canvas = document.querySelector(`#${id} > canvas`);

    const { shapeMode, controls } = globals;
    const scene = new PenroseScreen(shapeMode.shapeMode);
    const deca = scene.deca.bind(scene);
    let base = p(0, 0);

    const drawScreen = function () {
        console.log(performance.now());

        let x = 100;
        let y = 250;
        let angle = ang(controls.fifths, controls.isDown);
        const isHeads = controls.isHeads;
        let decagon = true;
        const begin = performance.now();
        const bounds = new Bounds();
        deca({ angle, isHeads, loc: p(x, y).tr(base), gen: 5 });

        deca({ angle, isHeads, loc: p(x, y).tr(base), gen: 5, layer: "rhomb" });

        const built = performance.now();
        console.log(`shapes built: ${built - begin} ms`);
        resizeAndRender(scene, canvas, 4);
        const rendered = performance.now();
        console.log(
            `shapes rendered: ${
                rendered - built
            } ms, function list: ${USE_FUNCTION_LIST}`
        );
        return bounds;
    };

    scene.setToMeasure();
    drawScreen();
    console.log(`bounds.maxPoint: ${scene.bounds.maxPoint}`);
    base = base.tr(scene.bounds.minPoint.neg);
    scene.setToRender();
    drawScreen();
}
