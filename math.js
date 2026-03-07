"use strict";
import {
    makeCanvas,
    drawFirstInflation,
    drawSecondInflation,
    drawGridWork,
    drawGeneric123,
    drawGeneric3,
    drawDualDemo,
} from "./renderings.js";

import { initControls, logRefresh } from "./controls.js";

/**
 * Penrose Mosaic and More
 *
 * Jeff Coyle's Penrose page.
 * Explores Penrose Type 1.
 *
 * The modes.
 * Introduces the Mosaic. The penrose pattern based on square mosaic tiles.
 * Introduces the Quadrille. The vector based version of above.
 * Displays the 'Real' mode. The actual type 1 penrose tiling P1.
 * Overlay the Rhombs.
 */

/**
 * This was a real pain
 * Line up the clickers
 **/

/******************************************************************************
 * Called when the page loads.
 * Creates all canvases.
 * Creates listeners for control buttons
 */
export function penroseApp(source) {
    logRefresh(penroseApp, source);
    initControls(penroseApp);

    makeCanvas("p5");
    makeCanvas("p3");
    makeCanvas("p1");
    makeCanvas("s5");
    makeCanvas("s3");
    makeCanvas("s1");
    drawFirstInflation("inf1");
    drawSecondInflation("inf2");
    drawGridWork("gwork");
    drawGeneric123("g012");
    drawGeneric3("g3");
    drawDualDemo("dual");
}
window.addEventListener("load", penroseApp, false);
