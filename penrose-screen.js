"use strict";
import { p, angFromTenth } from "./point.js";
import { Bounds } from "./bounds.js";
import { penrose } from "./penrose.js";
import { globals, measureTaskGlobals } from "./controls.js";
import { mosaic, quadrille, real } from "./shape-modes.js";

const SQRT5 = Math.sqrt(5); // 2.236
const PHI = (SQRT5 + 1) / 2; // 1.618

// Used for tests
export const USE_FUNCTION_LIST = true;

/***
 * Thanks to:
 * https://css-tricks.com/converting-color-spaces-in-javascript/
 *
 * Converts #rgb and #rrggbb formats
 *
 * Move to utilities
 */
function hexToRGB(h) {
    let r = 0,
        g = 0,
        b = 0;

    // 3 digits
    if (h.length == 4) {
        r = "0x" + h[1] + h[1];
        g = "0x" + h[2] + h[2];
        b = "0x" + h[3] + h[3];

        // 6 digits
    } else if (h.length == 7) {
        r = "0x" + h[1] + h[2];
        g = "0x" + h[3] + h[4];
        b = "0x" + h[5] + h[6];
    }

    return [r, g, b];
}

/**
 * Linear interpolate two colors
 *
 * @param {*} start
 * @param {*} end
 * @param {*} alpha  Value from 0 to 1
 * @returns ccs command string
 *
 * todo!!! implement opacity. It is a fraction from 0 (transparent) to 1.
 */
export function lerp(start, end, alpha, opacity) {
    if (alpha < 0) alpha = 0;
    if (alpha > 1) alpha = 1;
    const rgbStart = hexToRGB(start);
    const rgbEnd = hexToRGB(end);
    const [r, g, b] = rgbStart.map(
        (item, index) => item * (1 - alpha) + rgbEnd[index] * alpha,
    );
    const command = `rgb(${r},${g},${b})`;
    return command;
}

function testLerp() {
    lerp("#000", "#ff6600", 0);
    lerp("#000", "#ff6600", 0.1);
    lerp("#000", "#ff6600", 0.25);
    lerp("#000", "#ff6600", 0.5);
    lerp("#000", "#ff6600", 0.75);
    lerp("#000", "#ff6600", 1.0);
}

//testLerp();

/**
 * This routine returns the fill color of a penrose type
 * Uses globals.shapecolors if defined,
 * Instance must be star or penta, deca returns null
 * Returns color based on type
 *
 * @param {*} type
 * @returns assigned color
 */
function pColor(type) {
    const { shapeColors } = globals;
    if (shapeColors) {
        switch (type) {
            case penrose.Pe5:
                return shapeColors.shapeColors["pe5-color"];
            case penrose.Pe3:
                return shapeColors.shapeColors["pe3-color"];
            case penrose.Pe1:
                return shapeColors.shapeColors["pe1-color"];
            case penrose.St5:
                return shapeColors.shapeColors["star-color"];
            case penrose.St3:
                return shapeColors.shapeColors["boat-color"];
            case penrose.St1:
                return shapeColors.shapeColors["diamond-color"];
        }
        return null;
    } else return type.defaultColor;
}

/**
 * Represents a 2D scene.
 * mode: real or quadrille. Uses different tables to derive point values.
 * measure: If set, do not add to the renderlist.
 * bounds: Defines the scaled rectangle.
 * bounds.renderList
 *
 * @param (Real|Quadrille|Mosaic|Typographic) - Rendering style of figures.
 *
 * Mosaic should be removed since it is unique to Quadrille
 * Typographic is in progress
 *
 */
export class PenroseScreen {
    constructor(mode) {
        this.mode = mode;
        this.measure = false;
        this.bounds = new Bounds();
    }

    /**
     * Gets the figure for the type.
     * Depends on this.mode. Generally real or quadrille
     *
     * @param {penrose.type} type
     * @param {Shapes} penta
     * @returns penta|star|boat|diamond Array of 10 shapes
     *
     * Mode mosaic being phased out.
     */
    pShape(type) {
        switch (type) {
            case penrose.Pe5:
            case penrose.Pe3:
            case penrose.Pe1:
                return penrose[this.mode].penta;
            case penrose.St5:
                return penrose[this.mode].star;
            case penrose.St3:
                return penrose[this.mode].boat;
            case penrose.St1:
                return penrose[this.mode].diamond;
        }
        return null;
    }

    /**
     * Gets the mosaic shape wheel.
     * For the mosaic overlay.
     *
     * @param {penrose.type} type
     * @returns the mosaic shape wheel
     */
    mShape(type) {
        if (this.mode == real.key) {
            return null;
        }
        switch (type) {
            case penrose.Pe5:
            case penrose.Pe3:
            case penrose.Pe1:
                return penrose[mosaic.key].penta;
            case penrose.St5:
                return penrose[mosaic.key].star;
            case penrose.St3:
                return penrose[mosaic.key].boat;
            case penrose.St1:
                return penrose[mosaic.key].diamond;
        }
        return null;
    }

    setToMeasure() {
        this.measure = true;
    }
    setToRender() {
        this.measure = false;
    }

    /**
     * These add to the render list
     *
     * @param {*} fill
     * @param {*} loc
     * @param {*} shape
     * @returns
     */
    outline(fill, loc, shape) {
        const bounds = new Bounds();
        bounds.addVectors(loc, shape);
        this.bounds.expand(bounds);
        if (this.measure) {
            return;
        } else {
            const f = (r) => r.outline(fill, loc, shape);
            bounds.renderList.push(f);
        }
        this.bounds.expand(bounds);
    }

    figure(fill, loc, shape) {
        const bounds = new Bounds();
        bounds.addSquares(loc, shape);
        if (this.measure) {
            this.bounds.expand(bounds);
            return;
        }
        if (USE_FUNCTION_LIST) {
            const f = (r) => r.figure(fill, loc, shape);
            bounds.renderList.push(f);
        } else {
            const command = "figure";
            bounds.renderList.push({ command, fill, loc, shape });
        }
        this.bounds.expand(bounds);
    }

    grid(offset, size) {
        const bounds = new Bounds();
        bounds.addPoint(offset, p(-size, -size));
        bounds.addPoint(offset, p(size, size));
        if (this.measure) {
            this.bounds.expand(bounds);
            return;
        }
        if (USE_FUNCTION_LIST) {
            const f = (r) => r.grid(offset, size);
            bounds.renderList.push(f);
        } else {
            const command = "grid";
            bounds.renderList.push({ command, offset, size });
        }
        this.bounds.expand(bounds);
    }

    line(loc, end, strokeStyle) {
        const bounds = new Bounds();
        bounds.addPoint(loc, loc);
        bounds.addPoint(loc, end);
        if (this.measure) {
            this.bounds.expand(bounds);
            return;
        }
        if (USE_FUNCTION_LIST) {
            const f = (r) => r.line(loc, end, strokeStyle);
            bounds.renderList.push(f);
        } else {
            const command = "line";
            bounds.renderList.push({ command, loc, end, strokeStyle });
        }
        this.bounds.expand(bounds);
    }

    rhombus(fill, offset, shape, strokeStyle, isHeads) {
        const bounds = new Bounds();
        for (const point of shape) {
            bounds.addPoint(offset, point);
        }

        if (this.measure) {
            this.bounds.expand(bounds);
            return;
        }

        if (USE_FUNCTION_LIST) {
            const f = (r) =>
                r.rhombus(fill, offset, shape, strokeStyle, isHeads);
            bounds.renderList.push(f);
        } else {
            const command = "rhombus";
            bounds.renderList.push({
                command,
                fill,
                offset,
                shape,
                strokeStyle,
                isHeads,
            });
        }
        this.bounds.expand(bounds);
    }

    /**
     * This will revamp and combine penta and pentaRhomb
     * The inputs are streamlined
     *
     */
    drawPentaPattern({ type, angle, isHeads, loc, gen, layer, ...options }) {
        const { overlays } = globals; // don't forget the options

        if (layer == "rhomb" || layer == "dual") {
            return;
        }

        // Layer is "penta"
        if (this.mode == penrose.mosaic.key) {
            let shapes = this.mShape(type);
            if (shapes) {
                this.figure(pColor(type), loc, shapes[angle.tenths]);
            }
            return;
        }

        if (!overlays || overlays.pentaSelected) {
            const fill = pColor(type);
            let shapes = this.pShape(type);
            if (shapes) {
                const shape = shapes[angle.tenths];
                this.outline(fill, loc, shape);
            }
        }

        if (!overlays || overlays.mosaicSelected) {
            let shapes = this.mShape(type);
            if (shapes) {
                this.figure(pColor(type), loc, shapes[angle.tenths]);
            }
        }
    }

    /**************************************************************************
     * Recursive routine to draw pentagon type objects.
     * P5, P3 and P1  Up versions shown
     *
     *    p5  === blue === P0
     *
     *     o
     *  o     o
     *   o   o
     *
     *    p3  === yellow === P2
     *
     *     o         o         *         *         o
     *  o     o   *     o   *     o   o     *   o     *
     *   *   *     *   o     o   o     o   o     o   *
     *
     *    p1 === orange === P4
     *
     *     o         *         *         *         *
     *  *     *   *     o   *     *   *     *   o     *
     *   *   *     *   *     *   o     o   *     *   *
     *
     *
     * @param {0|1|2|3|4} fifths - angle cw from upright
     * @param {penrose.type} type - only Pe<1|3|5> types considered
     * @param {boolean} isDown - inverted if true
     * @param {Point} loc - center of figure
     * @param {number} gen - generation number. Recursively decrements to 0 (or  value specified by control)
     * @param {boolean} heads - Computed aspect of group. Convex or concave
     * @returns {Bounds} - Rectangle describing space taken by shape
     */

    penta({
        type,
        angle,
        isHeads = true,
        loc,
        layer = "penta",
        gen,
        ...options
    }) {
        switch (type) {
            case penrose.St5:
            case penrose.St3:
            case penrose.St1:
                return this.star({
                    type,
                    angle,
                    isHeads,
                    layer,
                    loc,
                    gen,
                    ...options,
                });
            case penrose.Deca:
                return this.deca({
                    type,
                    angle,
                    isHeads,
                    layer,
                    loc,
                    gen,
                    ...options,
                });
        }
        let { overlays } = globals;
        if (gen == 0) {
            if (layer == "penta") {
                this.drawPentaPattern({
                    type,
                    angle,
                    isHeads,
                    loc,
                    gen,
                    ...options,
                });
            }

            if (layer == "rhomb") {
                if (overlays && overlays.smallRhomb) {
                    this.drawRhombusPattern({
                        type,
                        angle,
                        isHeads,
                        loc,
                        gen,
                        ...options,
                    });
                }
            }
            return; // call figure
        }

        const wheels = penrose[this.mode].wheels;
        const pWheel = wheels.p[gen].w;
        const sWheel = wheels.s[gen].w;

        // short circuit
        if (layer == "rhomb") {
            if (gen == 1 && !overlays.smallRhomb) {
                this.drawRhombusPattern({
                    type,
                    angle,
                    isHeads,
                    loc,
                    gen,
                    ...options,
                });
                return;
            }
        }

        this.penta({
            type: penrose.Pe5,
            angle: angle.inv,
            isHeads: !isHeads,
            loc,
            layer,
            gen: gen - 1,
            ...options,
        });

        for (let i = 0; i < 5; i++) {
            const shift = angle.rot(i);
            const locPenta = loc.tr(pWheel[shift.tenths]);
            const locDiamond = loc.tr(sWheel[shift.inv.tenths]);
            this.penta({
                type: type.twist[i] == 0 ? penrose.Pe3 : penrose.Pe1,
                angle: shift.rot(type.twist[i]),
                isHeads: !isHeads,
                loc: locPenta,
                layer,
                gen: gen - 1,
                ...options,
            });

            if (type.diamond.includes(i)) {
                this.star({
                    type: penrose.St1,
                    angle: shift.inv,
                    loc: locDiamond,
                    isHeads,
                    layer,
                    gen: gen - 1,
                    ...options,
                });
                if (overlays && overlays.treeSelected)
                    this.line(loc, locDiamond, "red");
            }
            if (overlays && overlays.treeSelected)
                this.line(loc, locPenta, "black");
        }
    }

    /*************************************************************************
     * S5, S3 and S1  Up versions shown
     *    s5   star
     *
     *     *
     *  *  .  *
     *   *   *
     *
     *    s3   boat
     *
     *     *         *                             *
     *  *  .  *      .  *      .  *   *  .      *  .
     *                 *     *   *     *   *     *
     *
     *    s5   diamond
     *
     *     *
     *     .         .  *      .         .      *  .
     *                           *     *
     *
     * @param {0|1|2|3|4} fifths - angle cw from upright
     * @param {penrose.type} type - only St<1|3|5> types considered
     * @param {boolean} isDown - inverted if true
     * @param {Point} loc - center of figure
     * @param {number} gen - generation number. Recursively decrements to 0 (or  value specified by control)
     * @param {boolean} heads - Computed aspect of group. Convex or concave
     * @returns {Bounds} - Rectangle describing space taken by shape
     */
    star({
        type,
        angle,
        isHeads = true,
        loc,
        layer = "penta",
        gen,
        ...options
    }) {
        const { overlays } = { ...globals, ...options };
        const bounds = new Bounds();

        if (gen == 0) {
            if (layer == "penta") {
                this.drawPentaPattern({
                    type,
                    angle,
                    isHeads,
                    loc,
                    gen,
                    ...options,
                });
            }

            if (layer == "rhomb") {
                if (overlays && overlays.smallRhomb) {
                    this.drawRhombusPattern({
                        type,
                        angle,
                        isHeads,
                        loc,
                        gen,
                        ...options,
                    });
                }
            }

            if (layer == "dual") {
                this.drawDualRhombusPattern({
                    type,
                    angle,
                    isHeads,
                    loc,
                    gen,
                });
            }

            return;
        }

        if (layer == "rhomb") {
            if (gen == 1 && !overlays.smallRhomb) {
                this.drawRhombusPattern({
                    type,
                    angle,
                    isHeads,
                    loc,
                    gen,
                    ...options,
                });
                return;
            }
        }
        const wheels = penrose[this.mode].wheels;
        const tWheel = wheels.t[gen].w;
        const sWheel = wheels.s[gen].w;

        this.star({
            angle: angle.inv,
            type: penrose.St5,
            loc,
            layer,
            gen: gen - 1,
            isHeads,
            ...options,
        });

        for (let i = 0; i < 5; i++) {
            const shift = angle.rot(i);

            const locPenta = loc.tr(sWheel[shift.tenths]);
            const locBoat = loc.tr(tWheel[shift.tenths]);

            if (type.color[i] != null) {
                this.penta({
                    type: penrose.Pe1,
                    angle: shift.inv,
                    isHeads,
                    loc: locPenta,
                    layer,
                    gen: gen - 1,
                    ...options,
                });
                this.star({
                    type: penrose.St3,
                    angle: shift,
                    isHeads: !isHeads,
                    loc: locBoat,
                    layer,
                    gen: gen - 1,
                    ...options,
                });
                if (overlays && overlays.treeSelected) {
                    this.line(loc, locPenta, "red");
                    this.line(loc, locBoat, "blue");
                }
            }
        }
    }

    /**
     * The Star patch -- a composite seed, in the same spirit as deca().
     *
     * Not a substitution step. This is an *arrangement* of tiles measured from a
     * real tiling: a five-star gap at the centre with a ring of Pe1, Pe3 and St3
     * around it. It is one of the two configurations with global five-fold
     * symmetry, the other being the Sun.
     *
     * Ring, for a centre at tenth 0 with heads, in tenth offsets from the
     * centre's own angle:
     *
     *   Pe1   s-wheel[5 + 2j]   tenth 2j       heads
     *   Pe3   t-wheel[2j]       tenth 5 + 2j   flipped
     *   St3   t-wheel[5 + 2j]   tenth 5 + 2j   flipped
     *
     * expandStar(St5) cannot supply this ring by itself: it puts its boats at
     * t-wheel 270/342/54/126/198, which in a real tiling is exactly where the
     * Pe3 belong, with the boats 36 degrees away. Handing the ring to star()
     * fills the Pe3 slots with tiles that emit nothing.
     *
     * Follows deca()'s generation convention -- children at gen - 1, wheels at
     * [gen] -- not wieringa-roof's. See TODO 4b.
     */
    starPatch({ angle, isHeads = true, loc, gen, layer = "penta", ...options }) {
        const bounds = new Bounds();
        if (gen == 0) {
            return bounds;
        }

        const wheels = penrose[this.mode].wheels;
        const sWheel = wheels.s[gen].w;
        const tWheel = wheels.t[gen].w;
        const base = angle.tenths;
        const m10 = (n) => ((n % 10) + 10) % 10;

        // The star shaped gap at the centre. It fills in from generation 2.
        this.star({
            type: penrose.St5,
            angle,
            isHeads,
            loc,
            gen: gen - 1,
            layer,
            ...options,
        });

        for (let j = 0; j < 5; j++) {
            this.penta({
                type: penrose.Pe1,
                angle: angFromTenth(m10(2 * j + base)),
                isHeads,
                loc: loc.tr(sWheel[m10(5 + 2 * j + base)]),
                gen: gen - 1,
                layer,
                ...options,
            });
            this.penta({
                type: penrose.Pe3,
                angle: angFromTenth(m10(5 + 2 * j + base)),
                isHeads: !isHeads,
                loc: loc.tr(tWheel[m10(2 * j + base)]),
                gen: gen - 1,
                layer,
                ...options,
            });
            this.star({
                type: penrose.St3,
                angle: angFromTenth(m10(5 + 2 * j + base)),
                isHeads: !isHeads,
                loc: loc.tr(tWheel[m10(5 + 2 * j + base)]),
                gen: gen - 1,
                layer,
                ...options,
            });
        }
        return bounds;
    }

    pentaRhomb(type, angle, loc, gen) {
        this.penta({ type, angle, loc, gen });
        this.penta({
            type,
            angle,
            loc,
            gen,
            layer: "rhomb",
        });
    }

    pentaDual(type, angle, loc, gen) {
        this.penta({ type, angle, loc, gen });
        this.penta({
            type,
            angle,
            loc,
            gen,
            layer: "dual",
        });
    }
    /**
     * Decagon is a type unto itself.
     *      * The up version.
     *
     *       + x x +
     *     x o     o x
     *    *  x  o  x  *
     *     .    +    .
     *       +--*--+
     *
     * @param {0|1|2|3|4} fifths - angle cw from upright
     * @param {boolean} isDown - inverted if true
     * @param {Point} loc - center of figure
     * @param {number} gen - generation number. Recursively decrements to 0 (or  value specified by control)
     * @param {boolean} heads - Computed aspect of group. Convex or concave
     * @returns {Bounds} - Rectangle describing space taken by shape
     * *
     */
    deca({ angle, isHeads = true, loc, gen, layer = "penta", ...options }) {
        const { overlays } = globals;
        const bounds = new Bounds();
        if (gen == 0) {
            return bounds;
        }

        const wheels = penrose[this.mode].wheels;
        const dWheel = wheels.d[gen];
        const sWheel = wheels.s[gen];

        // Move the center of the decagon to the real center.
        let dUp = wheels.d[gen].up;
        let dDown = wheels.d[gen].down;
        let dOff = angle.isDown ? dUp[angle.fifths] : dDown[angle.fifths];
        let base = loc.tr(dOff);

        let offs; // Work variable

        // The central yellow pentagon
        this.penta({
            type: penrose.Pe3,
            angle: angle,
            gen: gen - 1,
            isHeads: !isHeads,
            loc: base,
            layer,
            ...options,
        });

        const sUp = wheels.s[gen].up;
        const sDown = wheels.s[gen].down;

        // The two diamonds
        offs = angle.isDown
            ? sDown[angle.rot(1).fifths]
            : sUp[angle.rot(1).fifths];
        this.star({
            type: penrose.St1,
            angle: angle.rot(3),
            isHeads,
            loc: base.tr(offs),
            layer,
            gen: gen - 1,
            ...options,
        });

        offs = angle.isDown
            ? sDown[angle.rot(4).fifths]
            : sUp[angle.rot(4).fifths];
        this.star({
            type: penrose.St1,
            angle: angle.rot(2),
            isHeads,
            loc: base.tr(offs),
            layer,
            gen: gen - 1,
            ...options,
        }); // sd4

        const pUp = wheels.p[gen].up;
        const pDown = wheels.p[gen].down;

        // The two orange pentagons
        offs = angle.isDown
            ? pUp[angle.rot(3).fifths]
            : pDown[angle.rot(3).fifths];
        this.penta({
            angle: angle.rot(2).inv,
            type: penrose.Pe1,
            loc: base.tr(offs),
            layer,
            gen: gen - 1,
            isHeads: !isHeads,
            ...options,
        });

        offs = angle.isDown
            ? pUp[angle.rot(2).fifths]
            : pDown[angle.rot(2).fifths];
        this.penta({
            angle: angle.rot(3).inv,
            type: penrose.Pe1,
            loc: base.tr(offs),
            gen: gen - 1,
            isHeads: !isHeads,
            layer,
            ...options,
        });

        // And the boat
        offs = angle.isDown
            ? pUp[angle.rot(2).fifths].tr(sUp[angle.rot(3).fifths])
            : pDown[angle.rot(2).fifths].tr(sDown[angle.rot(3).fifths]);
        this.star({
            angle: angle.inv,
            type: penrose.St3,
            loc: base.tr(offs),
            isHeads,
            layer,
            gen: gen - 1,
            ...options,
        });
    }

    /**
     * Draw the ammann segments
     * They will be drawn naively for the quadrille case.
     *
     * @param {*} offset - absolute location
     * @param {*} shape - shape consisting of 4 points
     */
    ammannSegments(offset, shape, thick) {
        const nl = [shape[0], shape[3]];
        const nr = [shape[0], shape[1]];
        const fl = [shape[3], shape[2]];
        const fr = [shape[1], shape[2]];
        const segmentPoints = [];
        if (thick) {
            segmentPoints.push(this.ammannTarget(fl, PHI - 1 / 4));
            segmentPoints.push(this.ammannTarget(fr, PHI / 2));
            segmentPoints.push(this.ammannTarget(nr, PHI - 1 / (2 * PHI)));
            segmentPoints.push(this.ammannTarget(nl, PHI - 1 / (2 * PHI)));
            segmentPoints.push(this.ammannTarget(fl, PHI / 2));
            segmentPoints.push(this.ammannTarget(fr, PHI - 1 / 4));
        } else {
            segmentPoints.push(this.ammannTarget(fl, 1 / 4));
            segmentPoints.push(this.ammannTarget(nl, PHI - 1 / (2 * PHI)));
            segmentPoints.push(this.ammannTarget(fl, PHI / 2));
            segmentPoints.push(this.ammannTarget(fr, PHI / 2));
            segmentPoints.push(this.ammannTarget(nr, PHI - 1 / (2 * PHI)));
            segmentPoints.push(this.ammannTarget(fr, 1 / 4));
        }

        for (let i = 0; i < segmentPoints.length - 1; i++) {
            this.line(
                offset.tr(segmentPoints[i]),
                offset.tr(segmentPoints[i + 1]),
                "red",
            );
        }
    }

    /**
     *
     * @param {Point[2]} segment
     * @param {number between 0 and PHI} offset
     * @returns point along segment proportional to offset
     */
    ammannTarget(segment, offset) {
        const abs = segment[1].tr(segment[0].neg);
        return segment[0].tr(abs.mult(offset / PHI));
    }

    /**
     * The color of the rhomb is based on the type.
     *
     * This is only called when layer = "rhomb";
     */
    drawRhombusPattern({ type, angle, isHeads, loc, gen, ...options }) {
        const bounds = new Bounds();
        const { overlays } = globals;
        const { ammannSelected, rhombSelected } = overlays;

        const thins = penrose[this.mode].thinRhomb[gen];
        const thicks = penrose[this.mode].thickRhomb[gen];
        const fill = pColor(type);
        const outline = null;
        for (let i = 0; i < 5; i++) {
            const shift = angle.rot(i);
            switch (type) {
                case penrose.Pe5:
                    const thick5 = thicks[shift.tenths];
                    if (rhombSelected) {
                        this.rhombus(fill, loc, thick5, outline, isHeads);
                    }
                    if (ammannSelected) {
                        this.ammannSegments(loc, thick5, true);
                    }
                    break;
                case penrose.Pe3:
                    switch (i) {
                        case 0:
                            const thin3 = thins[shift.tenths];
                            if (rhombSelected) {
                                this.rhombus(
                                    fill,
                                    loc,
                                    thin3,
                                    outline,
                                    isHeads,
                                );
                            }
                            if (ammannSelected) {
                                this.ammannSegments(loc, thin3, false);
                            }
                        // no break here
                        case 1:
                        case 4:
                            const thick3 = thicks[shift.tenths];
                            if (rhombSelected) {
                                this.rhombus(
                                    fill,
                                    loc,
                                    thick3,
                                    outline,
                                    isHeads,
                                );
                            }
                            if (ammannSelected) {
                                this.ammannSegments(loc, thick3, true);
                            }
                            break;
                        default:
                            break;
                    }
                    break;
                case penrose.Pe1:
                    switch (i) {
                        case 0:
                            const thick2 = thicks[shift.tenths];
                            if (rhombSelected) {
                                this.rhombus(
                                    fill,
                                    loc,
                                    thick2,
                                    outline,
                                    isHeads,
                                );
                            }
                            if (ammannSelected) {
                                this.ammannSegments(loc, thick2, true);
                            }
                            break;
                        case 4:
                        case 1:
                            const thinR2 = thins[shift.tenths];
                            if (rhombSelected) {
                                this.rhombus(
                                    fill,
                                    loc,
                                    thinR2,
                                    outline,
                                    isHeads,
                                );
                            }
                            if (ammannSelected) {
                                this.ammannSegments(loc, thinR2, false);
                            }
                            break;
                    }
            }
        }
    }
    drawDualRhombusPattern({ type, angle, isHeads, loc, gen, ...options }) {
        const { overlays } = { ...globals, ...measureTaskGlobals };
        const { ammannSelected, rhombSelected } = overlays;

        const thins = penrose[this.mode].thinDualRhomb[gen + 1];
        const thicks = penrose[this.mode].thickDualRhomb[gen + 1];
        let fill = pColor(type);
        const outline = null;
        for (let i = 0; i < 5; i++) {
            const shift = angle.rot(i);
            switch (type) {
                case penrose.St5:
                    fill = pColor(penrose.Pe5);
                    const thick5 = thicks[shift.tenths];
                    if (rhombSelected) {
                        this.rhombus(fill, loc, thick5, outline, isHeads);
                    }
                    if (ammannSelected) {
                        this.ammannSegments(loc, thick5, true);
                    }
                    break;
                case penrose.St3:
                    fill = pColor(penrose.Pe3);
                    switch (i) {
                        case 0:
                            const thin3 = thins[shift.tenths];
                            if (rhombSelected) {
                                this.rhombus(
                                    fill,
                                    loc,
                                    thin3,
                                    outline,
                                    isHeads,
                                );
                            }
                            if (ammannSelected) {
                                this.ammannSegments(loc, thin3, false);
                            }
                        // no break here
                        case 1:
                        case 4:
                            const thick3 = thicks[shift.tenths];
                            if (rhombSelected) {
                                this.rhombus(
                                    fill,
                                    loc,
                                    thick3,
                                    outline,
                                    isHeads,
                                );
                            }
                            if (ammannSelected) {
                                this.ammannSegments(loc, thick3, true);
                            }
                            break;
                        default:
                            break;
                    }
                    break;
                case penrose.St1:
                    fill = pColor(penrose.Pe1);
                    switch (i) {
                        case 0:
                            const thick2 = thicks[shift.tenths];
                            if (rhombSelected) {
                                this.rhombus(
                                    fill,
                                    loc,
                                    thick2,
                                    outline,
                                    isHeads,
                                );
                            }
                            if (ammannSelected) {
                                this.ammannSegments(loc, thick2, true);
                            }
                            break;
                        case 4:
                        case 1:
                            const thinR2 = thins[shift.tenths];
                            if (rhombSelected) {
                                this.rhombus(
                                    fill,
                                    loc,
                                    thinR2,
                                    outline,
                                    isHeads,
                                );
                            }
                            if (ammannSelected) {
                                this.ammannSegments(loc, thinR2, false);
                            }
                            break;
                    }
            }
        }
    }
}
