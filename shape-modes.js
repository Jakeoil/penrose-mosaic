import { p, toP } from "./point.js";
import {
    shapeWheel,
    Wheels,
    shapeWheelMosaic,
    interpolateWheel,
} from "./wheels.js";

/***************************************************
 * SHAPE MODE REAL
 ***************************************************/
/**
 * Adjusts the proportions of the object linearly and returns results
 * proportions: A table of lengths of a figure
 * inputKey: The item whose value you want to fix.
 * value: Default 1. Otherwise fixes the value to this value.
 * targetKey: Field to be returned. Otherwise returns new proportions object
 * with input fixed.
 */
function solve(proportions, inputKey, value, targetKey) {
    if (!proportions) {
        return null;
    }
    let oldValue = proportions[inputKey];
    // zero is not allowed for any value
    if (!oldValue) {
        return null;
    }

    let factor;
    if (value) {
        factor = (1 / oldValue) * value;
    } else {
        // set to 1 if none sent
        factor = 1 / oldValue;
    }
    let oldResult = proportions[targetKey];
    if (oldResult) {
        return oldResult * factor;
    } else {
        let newVariables = {};
        let keys = Object.keys(proportions);
        for (const key of keys) {
            newVariables[key] = proportions[key] * factor;
        }
        return newVariables;
    }
}

function mod10(n) {
    return n % 10;
}

/**
 * This is the one for quadrille
 * Invoked by mosaic constuctor and quadrille constructor
 *
 * @param {} wheels
 * @param {*} exp
 * @returns
 */
function goThick(wheels, exp) {
    const tWheel = wheels.t[exp].w;
    const sWheel = wheels.s[exp].w;
    const pWheel = wheels.p[exp].w;
    const dWheel = wheels.d[exp].w;

    return [rhThick(0), rhThick(1), rhThick(2)];

    function rhThick(tenth) {
        const o = p(0, 0);
        const o1 = o.tr(pWheel[mod10(tenth + 9)]).tr(dWheel[mod10(tenth + 9)]);
        const o2 = o1.tr(tWheel[mod10(tenth + 1)]);
        const o3 = o2.tr(tWheel[mod10(tenth + 4)]);
        return [o, o1, o2, o3];
    }
}

function goThin(wheels, exp) {
    const tWheel = wheels.t[exp].w;
    const sWheel = wheels.s[exp].w;
    const pWheel = wheels.p[exp].w;
    const dWheel = wheels.d[exp].w;
    return [rhThin(0), rhThin(1), rhThin(2)];

    function rhThin(tenth) {
        const o = p(0, 0);
        const o1 = o.tr(dWheel[mod10(tenth + 3)]).tr(pWheel[mod10(tenth + 3)]);
        const o2 = o1.tr(tWheel[mod10(tenth + 7)]);
        const o3 = o2.tr(tWheel[mod10(tenth + 8)]);
        return [o, o1, o2, o3];
    }
}

function goThickDual(wheels, exp) {
    const tWheel = wheels.t[exp].w;
    const sWheel = wheels.s[exp].w;
    const pWheel = wheels.p[exp].w;
    const dWheel = wheels.d[exp].w;

    return [rhThick(0), rhThick(1), rhThick(2)];

    function rhThick(tenth) {
        const o = p(0, 0);
        const o1 = o.tr(sWheel[mod10(tenth + 9)]);
        const o2 = o1.tr(pWheel[mod10(tenth + 1)]);
        const o3 = o2.tr(pWheel[mod10(tenth + 4)]);
        return [o, o1, o2, o3];
    }
}

function goThinDual(wheels, exp) {
    const tWheel = wheels.t[exp].w;
    const sWheel = wheels.s[exp].w;
    const pWheel = wheels.p[exp].w;
    const dWheel = wheels.d[exp].w;
    return [rhThin(0), rhThin(1), rhThin(2)];

    function rhThin(tenth) {
        const o = p(0, 0);
        const o1 = o.tr(sWheel[mod10(tenth + 3)]);
        const o2 = o1.tr(pWheel[mod10(tenth + 7)]);
        const o3 = o2.tr(pWheel[mod10(tenth + 8)]);
        return [o, o1, o2, o3];
    }
}

/**
 * This one belongs in real
 * @param {*} wheels
 * @param {*} exp
 * @returns
 *
 * Can this be unified with quad and mosaic. The only difference is the line
 * in the rh routine d + p == t. Perhaps I was hasty if the real of d+p == t,
 * then we don't have to separate them.
 */
function goThickReal(wheels, exp) {
    const tWheel = wheels.t[exp].w;
    const sWheel = wheels.s[exp].w;
    const pWheel = wheels.p[exp].w;
    const dWheel = wheels.d[exp].w;

    return [rhThick(0), rhThick(1), rhThick(2)];

    function rhThick(tenth) {
        const o = p(0, 0);
        const o1 = o.tr(tWheel[mod10(tenth + 9)]);
        const o2 = o1.tr(tWheel[mod10(tenth + 1)]);
        const o3 = o2.tr(tWheel[mod10(tenth + 4)]);
        return [o, o1, o2, o3];
    }
}

function goThinReal(wheels, exp) {
    const tWheel = wheels.t[exp].w;
    const sWheel = wheels.s[exp].w;
    const pWheel = wheels.p[exp].w;
    const dWheel = wheels.d[exp].w;
    return [rhThin(0), rhThin(1), rhThin(2)];

    function rhThin(tenth) {
        const o = p(0, 0);
        const o1 = o.tr(tWheel[mod10(tenth + 3)]);
        const o2 = o1.tr(tWheel[mod10(tenth + 7)]);
        const o3 = o2.tr(tWheel[mod10(tenth + 8)]);
        return [o, o1, o2, o3];
    }
}

function goThickRealDual(wheels, exp) {
    const tWheel = wheels.t[exp].w;
    const sWheel = wheels.s[exp].w;
    const pWheel = wheels.p[exp].w;
    const dWheel = wheels.d[exp].w;

    return [rhThick(0), rhThick(1), rhThick(2)];

    function rhThick(tenth) {
        const o = p(0, 0);
        const o1 = o.tr(pWheel[mod10(tenth + 9)]);
        const o2 = o1.tr(pWheel[mod10(tenth + 1)]);
        const o3 = o2.tr(pWheel[mod10(tenth + 4)]);
        return [o, o1, o2, o3];
    }
}

function goThinRealDual(wheels, exp) {
    const tWheel = wheels.t[exp].w;
    const sWheel = wheels.s[exp].w;
    const pWheel = wheels.p[exp].w;
    const dWheel = wheels.d[exp].w;
    return [rhThin(0), rhThin(1), rhThin(2)];

    function rhThin(tenth) {
        const o = p(0, 0);
        const o1 = o.tr(pWheel[mod10(tenth + 3)]);
        const o2 = o1.tr(pWheel[mod10(tenth + 7)]);
        const o3 = o2.tr(pWheel[mod10(tenth + 8)]);
        return [o, o1, o2, o3];
    }
}

/**
 * This most likely used for testing results
 * Deprecate soon !!!
 */
function compare(a, b) {
    for (let i = 0; i < 10; i++) {
        const aEle = a.list[i];
        const bEle = b.list[i];
        if (!aEle.equals(bEle)) {
            console.log(`angle: ${i}, a: ${aEle}, b: ${bEle}`);
        }
    }
}

class Real {
    constructor() {
        /**
         * Unit pentagon coordinates
         * Values come from the only f*ing place on the internet that bothers:
         * https://mathworld.wolfram.com/RegularPentagon.html
         * https://mathworld.wolfram.com/Pentagram.html
         *
         * The coordinate system used in Penrose differs from the math standard.
         * First, As in virtually all graphics programs, the y axis is reversed.
         * Up is negative. Up is also the default 0 angle.
         * Second, angles are measured clockwise from y axis. Angles are
         * integers.  There are three angle coordinate system: up down and wheel.
         *
         * up refers to the vertices of a right side up pentagon, that is, a
         * pentagon  with a horizontal base and a apex on top. The top
         * coordinate, up[0] is P(0, <negative value>). The angles are mod 5
         * integers referred to as fifths. A fifth is actually n * 2*PI/5 or 72
         * degrees.
         *
         * A vertical reflection of the up system gives you the down system, based
         * on an 'upside down' pentagon. Thus the down[0] coordinate is
         * P(0, <positive value>).
         *
         * Both systems combined give the 10 angles of the mod 10 wheel system.
         * Elements 0 to 9 are clockwise: [ up0, down3, up1, down4, up2, down0,
         * up3, down1, up4, down2]]. The angle here is 36 degrees or a tenth of a
         *  circle: n * PI / 5
         *
         * Given the value of up0 (wheel0), down3 (wheel1) and up1 (wheel2), the
         * entire wheel can be constructed based on vertical and horizontal
         * reflections of those three.
         *
         * There is another coordinate system hiding away which is at a right angle
         * to the one described above. Fortunately we don't use that one.
         *
         *                            u0 [s0,-c0]
         *                               *
         *        [-s2,-c2] d2 *                   * d3 [s2,-c2]
         *
         *
         *
         *  [-s1,-c1] u4 *                               * u1 [s1, -c1]
         *
         *                               o
         *
         *            d1 *                               * d4 [s1, c1]
         *
         *
         *
         *          [-s2,c2] u3 *                   * u2 [s2, c2]
         *                               *
         *                            d0 [s0,c0]
         *
         */
        const SQRT5 = Math.sqrt(5); // 2.236
        const PHI = (SQRT5 + 1) / 2; // 1.618
        const sqrt = Math.sqrt;

        // const ct_0 = Math.cos(0);
        // const ct_1 = Math.cos((2 * Math.PI) / 5);
        // const ct_2 = Math.cos(Math.PI / 5);
        // const st_0 = Math.sin(1);
        // const st_1 = Math.sin((2 * Math.PI) / 5);
        // const st_2 = Math.sin((4 * Math.PI) / 5);

        const c_0 = 1; // 1.0
        const c_1 = (SQRT5 - 1) / 4; // .309
        const c_2 = (SQRT5 + 1) / 4; // .809
        const s_0 = 0; // 0.0
        const s_1 = sqrt(10 + 2 * SQRT5) / 4; // .951 sin 72 cos 18
        const s_2 = sqrt(10 - 2 * SQRT5) / 4; // .588 sin 36 cos 54
        /**
         * Unit pentagon
         */
        const unitUp = [
            [s_0, -c_0],
            [s_1, -c_1],
            [s_2, c_2],
            [-s_2, c_2],
            [-s_1, -c_1],
        ].map(toP);

        const unitDown = unitUp.map((it) => it.neg);

        // Relation between side and unit radius
        // 2 * s_2 is the length of a unit pentagons base, hence the side
        const uPgon = {
            a: 2 * s_2, // 1.176
            R: 1.0,
        };

        const R = solve(uPgon, "a", 4, "R");

        // The proportions of the relevent pgon parts.
        // Note that uPgon is now unnecessary since uPgon.a * pgon.R == 1
        const pgon = {
            a: 1.0,
            d: PHI,
            R: sqrt(50 + 10 * SQRT5) / 10, // .8507
            r: sqrt(25 + 10 * SQRT5) / 10, // .688
            x: sqrt(25 - 10 * SQRT5) / 10, // .162
        };

        // The pentagram proportions. Note that a, the side is common
        // between both pgon and pgram
        const pgram = {
            a: (3 - SQRT5) / 2, // .382
            b: SQRT5 - 2, // .236
            c: 1, // Missing from diagram, but by definition 2 * b + a
            R: sqrt((25 - 11 * SQRT5) / 10), // .2008
            r: sqrt((5 - 2 * SQRT5) / 5) / 2, // .162
            rho: sqrt((5 - SQRT5) / 10), // .525
            y: sqrt((25 - 11 * SQRT5) / 2) / 2,
            x: (SQRT5 - 1) / 4,
        };

        const newPgram = solve(pgram, "a", 4);
        const starTips = unitUp.map((it) => it.mult(newPgram.rho));
        const starDimples = unitDown.map((it) => it.mult(newPgram.R));

        const pentaUp = unitUp.map((item) => item.mult(R));

        const starUp = [
            starTips[0],
            starDimples[3],
            starTips[1],
            starDimples[4],
            starTips[2],
            starDimples[0],
            starTips[3],
            starDimples[1],
            starTips[4],
            starDimples[2],
        ];

        const diamondUp = [
            starTips[0],
            starDimples[3],
            starDimples[0],
            starDimples[2],
        ];

        const diamondToo = [
            starDimples[3],
            starTips[1],
            starDimples[4],
            starDimples[1],
        ];

        const diamondWon = [
            starDimples[3],
            starDimples[0],
            starTips[3],
            starDimples[1],
        ].map((it) => it.neg);

        const boatUp = [
            starTips[0],
            starDimples[3],
            starTips[1],
            starDimples[4],
            starDimples[1],
            starTips[4],
            starDimples[2],
        ];

        const boatWon = [
            starDimples[4],
            starTips[2],
            starDimples[0],
            starTips[3],
            starDimples[1],
            starTips[4],
            starDimples[2],
        ].map((it) => it.neg);

        const boatToo = [
            starTips[0],
            starDimples[3],
            starTips[1],
            starDimples[4],
            starTips[2],
            starDimples[0],
            starDimples[2],
        ];

        // pSeed is the distance between two pentagon centers.
        // It is basically 2 * pgon.r
        const pMag = solve(pgon, "a", 4, "r") * 2;
        const pSeed = makeSeed(pMag);

        // sSeed is the distance between a pentagon and the near diamond
        // This is pgon.R + pgram.r
        const sMag = solve(pgon, "a", 4, "R") + solve(pgram, "a", 4, "R");
        const sSeed = makeSeed(sMag);

        // tSeed distance is the centers of two stars with their feet touching
        // So simply (pgram.R + pgram.y) * 2;
        const tMag =
            (solve(pgram, "a", 4, "R") + solve(pgram, "a", 4, "y")) * 2;
        const tSeed = makeSeed(tMag);

        // dseed is simply pgon 2 * r + R with a set to 4.
        const dMag = solve(pgon, "a", 4, "r");
        const dSeed = makeSeed(dMag);

        function makeSeed(mag) {
            return [
                unitUp[0].mult(mag),
                unitDown[3].mult(mag),
                unitUp[1].mult(mag),
            ];
        }

        this.penta = shapeWheel(pentaUp);
        this.star = shapeWheel(starUp);
        this.boat = shapeWheel(boatUp, boatWon, boatToo);
        this.diamond = shapeWheel(diamondUp, diamondWon, diamondToo);

        this.wheels = new Wheels(pSeed, sSeed, tSeed, dSeed);

        // --------------------------------------
        // Making the rhomb shapes ones.

        this.thickRhomb = [];
        this.thinRhomb = [];
        this.thickDualRhomb = [];
        this.thinDualRhomb = [];
        let up, won, too;
        for (let i = 0; i < 2; i++) {
            [up, won, too] = goThickReal(this.wheels, i);
            this.thickRhomb.push(shapeWheel(up, won, too));
            [up, won, too] = goThinReal(this.wheels, i);
            this.thinRhomb.push(shapeWheel(up, won, too));
            [up, won, too] = goThickRealDual(this.wheels, i);
            this.thickDualRhomb.push(shapeWheel(up, won, too));
            [up, won, too] = goThinRealDual(this.wheels, i);
            this.thinDualRhomb.push(shapeWheel(up, won, too));
        }

        this.key = "real";

        //this.renderShape = outline;
    }
}
export const real = new Real();

class Typographic {
    constructor() {
        const pentaUp = [
            "     _ _     ",
            "   _|. .|_   ",
            " _|. . . .|_ ",
            "|. . . . . .|",
            "|_ . . . . _|",
            "  |. . . .|  ",
            "  |_______|  ",
        ];
        const pentaDown = [
            "   _ ___ _   ",
            "  |. . . .|  ",
            " _|. . . .|_ ",
            "|. . . . . .|",
            "|_ . . . . _|",
            "  |_ . . _|  ",
            "    |_ _|    ",
        ];
        const starUp = [
            "       _ _       ",
            "      |. .|      ",
            " _____|. .|_____ ",
            "|_ . . . . . . _|",
            "  |_ . . . ._|   ",
            "    |. . . .|    ",
            "   _|. ___ .|_   ",
            "  |. _|   |_ .|  ",
            "  |_|       |_|  ",
        ];
        const starDown = [
            "   _         _   ",
            "  |.|_     _|.|  ",
            "  |_ .|___|. _|  ",
            "    |. . . .|    ",
            "   _|. . . .|_   ",
            " _|. . . . . .|_ ",
            "|_____ . . _____|",
            "      |. .|      ",
            "      |___|      ",
        ];
        const boatUp = [
            "       - -       ",
            "      |. .|      ",
            "______|. .|______",
            "|_ . . . . . . _|",
            "  |___________|  ",
        ];
        const boat4 = [
            "       _ _____ ",
            "     _|. . . _|",
            "   _|. . . _|  ",
            "  |. . . .|    ",
            " _|. ___ .|_   ",
            "|. _|   |_ .|  ",
            "|_|       |_|  ",
        ];

        const diamondWon = [
            // or ate
            "       _ ",
            "     _|.|",
            "   _|. _|",
            "  |. .|  ",
            " _|. _|  ",
            "|. _|    ",
            "|_|      ",
        ];

        const diamondUp = [
            // or down
            " _ _ ",
            "|. .|",
            "|. .|",
            "|. .|",
            "|___|",
        ];

        const diamondWhat = [
            " _____ _   ", //
            "|_ . . .|_ ",
            "  |_______|",
        ];
        const boat2 = [
            "       _ _ ",
            "      |. .|",
            " _____|. .|",
            "|_ . . . .|",
            "  |_ . . _|",
            "    |. .|  ",
            "   _|. _|  ",
            "  |. _|    ",
            "  |_|      ",
        ];

        this.key = "typographic";
    }
}

/*******************************************************
 * This is the path model that would work on graph paper
 * I could say here: quadrille = new class() {...}
 */
class Quadrille {
    constructor() {
        const pentaUp = [
            [0, -3],
            [3, -1],
            [2, 3],
            [-2, 3],
            [-3, -1],
        ].map(toP);

        const starUp = [
            [0, -6],
            [1, -2],
            [5, -2],
            [2, 0],
            [3, 4],
            [0, 2],
            [-3, 4],
            [-2, 0],
            [-5, -2],
            [-1, -2],
        ].map(toP);

        const diamondUp = [
            [0, -6],
            [1, -2],
            [0, 2],
            [-1, -2],
        ].map(toP);

        const diamondWon = [
            [3, -4],
            [0, -2],
            [-1, 2],
            [2, 0],
        ].map(toP);

        const diamondToo = [
            [5, -2],
            [2, 0],
            [-2, 0],
            [1, -2],
        ].map(toP);

        const boatUp = [
            [0, -6],
            [1, -2],
            [5, -2],
            [2, 0],
            [-2, 0],
            [-5, -2],
            [-1, -2],
        ].map(toP);

        const boatWon = [
            [3, -4],
            [2, 0],
            [5, 2],
            [1, 2],
            [-2, 0],
            [-3, -4],
            [0, -2],
        ].map(toP);

        const boatToo = [
            [5, -2],
            [2, 0],
            [3, 4],
            [0, 2],
            [-1, -2],
            [0, -6],
            [1, -2],
        ].map(toP);
        this.penta = shapeWheel(pentaUp);
        this.star = shapeWheel(starUp);
        this.boat = shapeWheel(boatUp, boatWon, boatToo);
        this.diamond = shapeWheel(diamondUp, diamondWon, diamondToo);

        const pSeed = [p(0, -6), p(3, -4), p(5, -2)];
        const sSeed = [p(0, -5), p(3, -5), p(5, -1)];
        const tSeed = [p(0, -8), p(5, -8), p(8, -2)];
        const dSeed = [p(0, -3), p(2, -3), p(3, -1)];

        this.wheels = new Wheels(pSeed, sSeed, tSeed, dSeed);

        this.thinRhomb = [];
        this.thickRhomb = [];
        this.thinDualRhomb = [];
        this.thickDualRhomb = [];
        let up, one, too;
        for (let i = 0; i < 2; i++) {
            [up, one, too] = goThick(this.wheels, i);
            this.thickRhomb.push(shapeWheel(up, one, too));

            [up, one, too] = goThin(this.wheels, i);
            this.thinRhomb.push(shapeWheel(up, one, too));

            [up, one, too] = goThickDual(this.wheels, i);
            this.thickDualRhomb.push(shapeWheel(up, one, too));

            [up, one, too] = goThinDual(this.wheels, i);
            this.thinDualRhomb.push(shapeWheel(up, one, too));
        }

        this.key = "quadrille";
        //this.renderShape = outline;
    }
}
export const quadrille = new Quadrille();

/*******************************************************
 * This is the square tiles model, the Mosaic
 * It is now a special overlay for quadrille.
 */

class Mosaic {
    constructor() {
        // prettier-ignore
        const penta_up = [[2, 0], [3, 0],
        [1, 1], [2, 1], [3, 1], [4, 1],
        [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2],
        [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3],
        [1, 4], [2, 4], [3, 4], [4, 4],
        [1, 5], [2, 5], [3, 5], [4, 5]].map(toP);

        // prettier-ignore
        const diamond_up = [[0, 0], [1, 0],
        [0, 1], [1, 1],
        [0, 2], [1, 2],
        [0, 3], [1, 3]].map(toP);

        // prettier-ignore
        const diamond_too = [[1, 0], [2, 0], [3, 0], [4, 0],
        [0, 1], [1, 1], [2, 1], [3, 1]].map(toP);

        // This one should have been called diamond nine.
        // prettier-ignore
        const diamond_for = [[0, 0],
        [0, 1], [1, 1],
        [1, 2], [2, 2],
        [1, 3], [2, 3],
        [2, 4], [3, 4],
        [3, 5]].map(toP);

        // prettier-ignore
        const star_up = [[3, 0], [4, 0],
        [3, 1], [4, 1],
        [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2],
        [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3],
        [2, 4], [3, 4], [4, 4], [5, 4],
        [2, 5], [3, 5], [4, 5], [5, 5],
        [1, 6], [2, 6], [5, 6], [6, 6],
        [1, 7], [6, 7]].map(toP);

        // prettier-ignore
        const boat_up = [[3, 0], [4, 0],
        [3, 1], [4, 1],
        [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2],
        [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3]].map(toP);

        // prettier-ignore
        const boat_too = [[0, 0], [1, 0],
        [0, 1], [1, 1],
        [0, 2], [1, 2], [2, 2], [3, 2], [4, 2],
        [0, 3], [1, 3], [2, 3], [3, 3],
        [1, 4], [2, 4],
        [1, 5], [2, 5],
        [2, 6], [3, 6],
        [3, 7]].map(toP);

        // prettier-ignore
        const boat_for = [[3, 0], [4, 0], [5, 0], [6, 0],
        [2, 1], [3, 1], [4, 1], [5, 1],
        [1, 2], [2, 2], [3, 2], [4, 2],
        [1, 3], [2, 3], [3, 3], [4, 3],
        [0, 4], [1, 4], [4, 4], [5, 4],
        [0, 5], [5, 5]].map(toP);

        const primitives = {
            penta_up: penta_up.map((pt) => pt.tr(p(-3, -3))),
            diamond_up: diamond_up.map((pt) => pt.tr(p(-1, -4))),
            diamond_won: diamond_for.map((pt) => pt.tr(p(-3, -4)).hrm),
            diamond_too: diamond_too.map((pt) => pt.tr(p(-1, -2))),
            boat_up: boat_up.map((pt) => pt.tr(p(-4, -4))),
            boat_won: boat_for.map((pt) => pt.tr(p(-3, -2)).vrm),
            boat_too: boat_too.map((pt) => pt.tr(p(-1, -4))),
            star_up: star_up.map((pt) => pt.tr(p(-4, -4))),
        };

        this.penta = shapeWheelMosaic(primitives.penta_up);
        this.diamond = shapeWheelMosaic(
            primitives.diamond_up,
            primitives.diamond_won,
            primitives.diamond_too
        );
        this.boat = shapeWheelMosaic(
            primitives.boat_up,
            primitives.boat_won,
            primitives.boat_too
        );
        this.star = shapeWheelMosaic(primitives.star_up);

        this.key = "mosaic";
        //this.renderShape = figure;

        // Create rhombs
        const pSeed = [p(0, -6), p(3, -4), p(5, -2)];
        const sSeed = [p(0, -5), p(3, -5), p(5, -1)];
        const tSeed = [p(0, -8), p(5, -8), p(8, -2)];
        const dSeed = [p(0, -3), p(2, -3), p(3, -1)];

        this.wheels = new Wheels(pSeed, sSeed, tSeed, dSeed);

        // Use quadrille instead.

        this.thinRhomb = [];
        this.thickRhomb = [];
        this.thinDualRhomb = [];
        this.thickDualRhomb = [];
        let up, one, too;
        for (let i = 0; i < 2; i++) {
            [up, one, too] = goThick(this.wheels, i);
            this.thickRhomb.push(shapeWheel(up, one, too));

            [up, one, too] = goThin(this.wheels, i);
            this.thinRhomb.push(shapeWheel(up, one, too));

            [up, one, too] = goThickDual(this.wheels, i);
            this.thickDualRhomb.push(shapeWheel(up, one, too));

            [up, one, too] = goThinDual(this.wheels, i);
            this.thinDualRhomb.push(shapeWheel(up, one, too));
        }
    }

    createRhombs() {}
}

export const mosaic = new Mosaic();
