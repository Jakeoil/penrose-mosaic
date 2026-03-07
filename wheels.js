// Q. why don't I need to import p?
// A. p the point is not used. In fact, the variable p is used for other things
import { p } from "./point.js";
/***************************************************************  
 * Discussion of the second expansions penta points.
 * These are the x and y offset from a center rectangle to an inverted rectangle.
 * There are five of them. Let's call the x coordinate cos and the y
           0   36   72  108  144  180
 * sin =   0,   8,  13,  13,  8,    0   -8 -13 -13 -8  and repeat 0
 *         0,   3    5    5   3     0   -3  -5  -5 -3      
 * 
 * cos = -14, -12,  -4,   4,  12, 14, 12,  4  -4  -12
 *        -6   -4,  -2,   2,   4,  6   4   2  -2    4 
 * 
 * 
 *       0               *
 *       4                   *
 *       8                       *
 *       12                          *
 *       13                           *
 *       14                            *
 *       13                           *
 *       12                          *
 *       8                       *     
 *       4                   *    
 *       0               *    
 *      -4           *
 *      -8       *
 *     -12   *
 *     -13  *
 *     -14 *  
 *     -13  *
 *     -12   *
 *      -8       *
 *      -4           *
 *       0               *    
 *     
 * 
 * 
 * */

/**
 * Creates a 10 point wheel out of the first three coordinates (or Ps)
 * Input is up[0], down[3], up[1]
 */
class Wheel {
    constructor(p0, p1, p2) {
        this.list = [p0.copy, p1.copy, p2.copy, p2.vr, p1.vr, p0.vr, p1.neg, p2.neg, p2.hr, p1.hr];
    }
    get up() {
        return [this.list[0], this.list[2], this.list[4], this.list[6], this.list[8]];
    }
    get down() {
        return [this.list[5], this.list[7], this.list[9], this.list[1], this.list[3]];
    }
    get w() {
        return this.list;
    }
    get string() {
        return stringify(this.w.map((it) => [it.x, it.y]));
    }
    // get inv() {
    //     return new Wheel(this.list[5], this.list[6], this.list[7]);
    // }
}
export class Wheels {
    constructor(pSeed, sSeed, tSeed, dSeed) {
        [this.p, this.s, this.t, this.d] = makeWheels(pSeed, sSeed, tSeed, dSeed);
    }
}

function makeWheels(pSeed, sSeed, tSeed, dSeed) {
    function pWheelNext(exp) {
        const p = pWheels[exp].w;
        return new Wheel(p[1].tr(p[0]).tr(p[9]), p[2].tr(p[1]).tr(p[0]), p[3].tr(p[2]).tr(p[1]));
    }

    // S is the offset
    function sWheelNext(exp) {
        const p = pWheels[exp].w;
        const s = sWheels[exp].w;
        return new Wheel(p[1].tr(p[0]).tr(s[9]), p[2].tr(p[1]).tr(s[0]), p[3].tr(p[2]).tr(s[1]));
    }

    function tWheelNext(exp) {
        const p = pWheels[exp].w;
        const s = sWheels[exp].w;
        return new Wheel(
            s[1].tr(p[9]).tr(p[0]).tr(p[1]).tr(s[9]),
            s[2].tr(p[0]).tr(p[1]).tr(p[2]).tr(s[0]),
            s[3].tr(p[1]).tr(p[2]).tr(p[3]).tr(s[1])
        );
    }

    function dWheelNext(exp) {
        const p = pWheels[exp].w;
        const d = dWheels[exp].w;
        //console.log(`(${d[0].tr(p[0])}, ${d[1].tr(p[1])}, ${d[2].tr(p[2])}`);
        return new Wheel(d[0].tr(p[0]), d[1].tr(p[1]), d[2].tr(p[2]));
    }

    // Wheel[0] is undefined

    const pWheels = [new Wheel(...interpolateWheel(...pSeed))];
    const sWheels = [new Wheel(...interpolateWheel(...sSeed))];
    const tWheels = [new Wheel(...interpolateWheel(...tSeed))];
    const dWheels = [new Wheel(...interpolateWheel(...dSeed))];

    const pWheel1 = new Wheel(...pSeed);
    const sWheel1 = new Wheel(...sSeed);
    const tWheel1 = new Wheel(...tSeed);
    const dWheel1 = new Wheel(...dSeed);
    // console.log(`real P1[1]: ${pWheel1.string}`);
    // console.log(`real S1[1]: ${sWheel1.string}`);
    // console.log(`real T1[1]: ${tWheel1.string}`);
    // console.log(`real D1[1]: ${dWheel1.string}`);

    // Wheel[1] = Wheel1
    pWheels.push(pWheel1);
    sWheels.push(sWheel1);
    tWheels.push(tWheel1);
    dWheels.push(dWheel1);

    const wheelMax = 10;
    for (let i = 1; i <= wheelMax; i++) {
        pWheels.push(pWheelNext(i));
        sWheels.push(sWheelNext(i));
        tWheels.push(tWheelNext(i));
        dWheels.push(dWheelNext(i));
    }

    return [pWheels, sWheels, tWheels, dWheels];
}

/**
 * Return a shape wheel based on a minimal set of
 * shapes. The shapes with five fold symmetry only need
 * up as input. All others require element 0, 1 and 2 positions.
 * aka up0, down3, up2
 */
export function shapeWheel(up, won, too) {
    if (up) {
        if (won) {
            return [
                up.map((item) => item.copy),
                won.map((item) => item.copy),
                too.map((item) => item.copy),
                too.map((item) => item.vr),
                won.map((item) => item.vr),
                up.map((item) => item.vr),
                won.map((item) => item.neg),
                too.map((item) => item.neg),
                too.map((item) => item.hr),
                won.map((item) => item.hr),
            ];
        }
        return [
            up.map((item) => item.copy),
            up.map((item) => item.vr),
            up.map((item) => item.copy),
            up.map((item) => item.vr),
            up.map((item) => item.copy),
            up.map((item) => item.vr),
            up.map((item) => item.copy),
            up.map((item) => item.vr),
            up.map((item) => item.copy),
            up.map((item) => item.vr),
        ];
    }
    return [];
}

function makeShapeWheels() {}
/***
 * shapeWheel M is a little bit stupid.
 * The only difference is how reflections are done
 */
export function shapeWheelMosaic(up, won, too) {
    if (up) {
        if (won) {
            return [
                up.map((item) => item.copy),
                won.map((item) => item.copy),
                too.map((item) => item.copy),
                too.map((item) => item.vrm),
                won.map((item) => item.vrm),
                up.map((item) => item.vrm),
                won.map((item) => item.negm),
                too.map((item) => item.negm),
                too.map((item) => item.hrm),
                won.map((item) => item.hrm),
            ];
        }
        return [
            up.map((item) => item.copy),
            up.map((item) => item.vrm),
            up.map((item) => item.copy),
            up.map((item) => item.vrm),
            up.map((item) => item.copy),
            up.map((item) => item.vrm),
            up.map((item) => item.copy),
            up.map((item) => item.vrm),
            up.map((item) => item.copy),
            up.map((item) => item.vrm),
        ];
    }
    return [];
}

export function interpolateShape(up, won, too) {
    const a0 = up.foreach((it) => it.x);
    const b0 = up.foreach((it) => it.y);
    const a1 = won.foreach((it) => it.x);
    const b1 = won.foreach((it) => it.y);
    const a2 = too.foreach((it) => it.x);
    const b2 = too.foreach((it) => it.y);
}

/**
 * Produces the next seed from the current seed.
 * @param {*} point0
 * @param {*} point1
 * @param {*} point2
 * @returns
 */
export function successorPoint(point0, point1, point2) {
    const point9 = point1.hr; // switch
    const point3 = point2.vr;
    return [
        point9.tr(point0).tr(point1),
        point0.tr(point1).tr(point2),
        point1.tr(point2).tr(point3),
    ];
}

export function predecessorPoint(point0, point1, point2) {
    const { x: a0, y: b0 } = point0;
    const { x: a1, y: b1 } = point1;
    const { x: a2, y: b2 } = point2;
    const x0 = a0;
    const x1 = -a0 - a0 + a1 + a1 - a2;
    const x2 = a2 - a1 + a0;

    const y0 = b0 - b2 - b2;
    const y1 = b2; //; #3
    const y2 = b1 - b0 + b2;
    return [p(x0, y0), p(x1, y1), p(x2, y2)];
}
/**
 * Produced the previous seed from the current seed
 * @param {} point0
 * @param {*} point1
 * @param {*} point2
 * @returns
 */
export function interpolateWheel(point0, point1, point2) {
    const { x: a0, y: b0 } = point0;
    const { x: a1, y: b1 } = point1;
    const { x: a2, y: b2 } = point2;

    const point9 = point1.hr; // switch x
    // x9 == -x1;
    // y9 == y1;

    const point3 = point2.vr;
    // x3 == x2
    // y3 == -y2

    //  x9 + x0 + x1 = a0 ; #1
    //  x0 + x1 + x2 = a1 ; #2
    //  x1 + x2 + x3 = a2 ; #3

    // Substitute equivalent value -x1 for x9
    // -x1 + x0 + x1 = a0 ; #1
    // This equation resolves itself
    const x0 = a0; // first solution #1

    // x0 + x1 + x2 = a1 ; #2
    // Substitute equivalent value x2 for x2
    // x1 + x2 + x2 = a2 ;#3

    // substitute a0 for x0 in eq #2
    // a0 + x1 + x2 = a1;
    // x's on the left
    // (x1 + x2) = (a1 - a0)  ; #2
    // Substitue above in equation #3
    // (a1 - a0) + x2 = a2 ; #3
    // x2 = a2 - (a1 - a0) ; #3
    const x2 = a2 - a1 + a0; // #3

    // Substitute x0 and x2 in eq 2
    // x0 + x1 + x2 = a1 ; #2
    // (a0) + x1 + (a2 - a1 + a0) = a1
    //let x_ = a1 - a0 - (a2 - a1 + a0);
    const x1 = -a0 - a0 + a1 + a1 - a2;

    // y9 + y0 + y1 = b0
    // y0 + y1 + y2 = b1
    // y1 + y2 + y3 = b2

    // equivalent y1 for y9
    // and equivalent -y2 for y3
    // y1 + y0 + y1 = b0;  #1
    // y0 + y1 + y2 = b1;  #2
    // y1 + y2 - y2 = b2;  #3

    // #3 is solved
    const y1 = b2; //; #3
    // # equation 2
    // y0 + b2 + y2 = b1 ;#2
    // y's on the left
    // y0 + y2 = b1 - b2 ; #2

    // # equation 1:
    // y1 + y0 + y1 = b0;  #1
    // b2 + y0 + b2 = b0;
    // y's on the left
    const y0 = b0 - b2 - b2; // #1
    // back to equation 2:
    // (b0 - b2 - b2) + y2 = (b1-b2)
    // y's on the left
    //const y2 = b1 - b2 - (b0 - b2 - b2);
    const y2 = b1 - b0 + b2;

    return [p(x0, y0), p(x1, y1), p(x2, y2)];
}
