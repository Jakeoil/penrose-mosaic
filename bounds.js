import { p } from "./point.js";
/**
 * Mutable class
 * This measures and adjusts the bounding rectangle.
 * Only the element drawing function (figure) creates a new bounds and returns
 * either a Bounds with the max min or null max min if nothing got drawn.
 * Maintains a renderList of function
 */
export class Bounds {
    constructor() {
        this.maxPoint = null;
        this.minPoint = null;
        this.renderList = [];
    }

    /**
     * Called from within figure
     */
    addPoint(offset, point) {
        const logicalPoint = offset.tr(point);
        if (this.isEmpty) {
            this.minPoint = logicalPoint.copy;
            this.maxPoint = logicalPoint.copy;
            return;
        }

        if (logicalPoint.x < this.minPoint.x) {
            this.minPoint.x = logicalPoint.x;
        } else if (logicalPoint.x > this.maxPoint.x) {
            this.maxPoint.x = logicalPoint.x;
        }
        if (logicalPoint.y < this.minPoint.y) {
            this.minPoint.y = logicalPoint.y;
        } else if (logicalPoint.y > this.maxPoint.y) {
            this.maxPoint.y = logicalPoint.y;
        }
    }
    addVectors(offset, shape) {
        for (const point of shape) {
            this.addPoint(offset, point);
        }
    }
    addSquares(offset, shape) {
        this.addVectors(offset, shape);
        this.pad(0, 1, 1, 0);
    }

    get isEmpty() {
        return !this.maxPoint || !this.minPoint;
    }
    /**
     * Wrapper function for figure. figure returns a bounds object. This
     * object is integrated (added, mutates) this.
     * @param {} bounds
     * @returns
     */
    expand(bounds) {
        if (!bounds) {
            // Figure returned null?
            console.log("expand: input is undefined?");
            return;
        }

        if (bounds.isEmpty) {
            // figure didn't draw anything.
            return;
        }

        if (this.isEmpty) {
            // This is the first expansion of this.
            this.minPoint = bounds.minPoint;
            this.maxPoint = bounds.maxPoint;
            //console.log(bounds.renderList);
            //this.renderList.push(...bounds.renderList);
            this.renderList = this.renderList.concat(bounds.renderList);
            return;
        }

        if (bounds.minPoint.x < this.minPoint.x) {
            this.minPoint.x = bounds.minPoint.x;
        }
        if (bounds.minPoint.y < this.minPoint.y) {
            this.minPoint.y = bounds.minPoint.y;
        }
        if (bounds.maxPoint.x > this.maxPoint.x) {
            this.maxPoint.x = bounds.maxPoint.x;
        }
        if (bounds.maxPoint.y > this.maxPoint.y) {
            this.maxPoint.y = bounds.maxPoint.y;
        }

        //console.log(this.renderList.length, bounds.renderList.length);
        //this.renderList.push(...bounds.renderList); // This breaks down somewhere over a million
        this.renderList = this.renderList.concat(bounds.renderList);
    }

    /**
     * bounds is mutated.
     * @returns
     */
    round() {
        if (this.isEmpty) return;
        this.minPoint.x = Math.round(this.minPoint.x * 1000) / 1000;
        this.minPoint.y = Math.round(this.minPoint.y * 1000) / 1000;
        this.maxPoint.x = Math.round(this.maxPoint.x * 1000) / 1000;
        this.maxPoint.y = Math.round(this.maxPoint.y * 1000) / 1000;
    }
    /**
     * Framing adjust the bounds. Positive values increases the bounds and
     * negative values decreases. The values are scaled.
     * It takes into account the tightness of the bounds
     * Missing parameters follow css rules.
     *
     * The new bounds is mutated, but returned for convenience.
     */
    pad(top, right, bottom, left) {
        if (this.isEmpty) {
            this.minPoint = p(0, 0);
            this.maxPoint = p(0, 0);
        }
        if (top || top == 0) {
            this.minPoint.y -= top;
            if (right || right == 0) {
                this.maxPoint.x += right;
                if (bottom || bottom == 0) {
                    this.maxPoint.y += bottom;
                    if (left || left == 0) {
                        this.minPoint.x -= left;
                    } else {
                        this.minPoint.x -= right;
                    }
                } else {
                    this.maxPoint.y += top;
                    this.minPoint.x -= right;
                }
            } else {
                this.maxPoint.x += top;
                this.minPoint.x -= top;
                this.maxPoint.y += top;
            }
        } else {
            console.log(`error: no parameters`);
        }
        // check if we shrank too much
        const rect = this.maxPoint.tr(this.minPoint.neg);
        if (rect.x < 0) {
            this.maxPoint.x = this.minPoint.x;
        }
        if (rect.y < 0) {
            this.maxPoint.y = this.minPoint.y;
        }
        //
        return this;
    }

    // compatibility with rect.
    get x() {
        return this.isEmpty ? 0 : this.minPoint.x;
    }

    get y() {
        return this.isEmpty ? 0 : this.minPoint.y;
    }

    get width() {
        return this.isEmpty ? 0 : this.maxPoint.x + 1 - this.minPoint.x;
    }
    get height() {
        return this.isEmpty ? 0 : this.maxPoint.y + 1 - this.minPoint.y;
    }

    get center() {
        return p(this.x + this.width / 2, this.y + this.height / 2);
    }
    get diagonal() {
        return Math.sqrt(this.width * this.width + this.height * this.height);
    }
    toString() {
        return `min: ${this.minPoint}, max: ${this.maxPoint}`;
    }

    //testBounds();
    dumpNodes(nodeList) {
        console.log(`dump nodes ${JSON.stringify(nodeList)}`);
        if (nodeList instanceof Array) {
            console.log(`found array size: ${nodeList.length}`);
            if (!nodeList.isEmpty) {
                for (const node of nodeList) {
                    console.log(`recursive call on node: ${node.nodeList}`);
                    this.dumpNodes(node);
                }
            } else {
                console.log(`empty node`);
            }
        } else {
            console.log(`node: ${nodeList}`);
        }
    }
}

function testBounds() {
    console.log(`testBounds`);
    let bounds = new Bounds();
    console.log(
        `${bounds}, width: ${bounds.width}, height: ${bounds.height}, isEmpty: ${bounds.isEmpty}`
    );
    let offset = p(10, 10);
    bounds.addPoint(offset, p(-5, 6));
    console.log(
        `${bounds}, width: ${bounds.width}, height: ${bounds.height}, isEmpty: ${bounds.isEmpty}`
    );
    bounds.addPoint(offset, p(0, 50));
    console.log(
        `${bounds}, width: ${bounds.width}, height: ${bounds.height}, isEmpty: ${bounds.isEmpty}`
    );
    console.log(`${bounds.pad(1)}`);
    console.log(`${bounds.pad(1, 2, 3)}`);
    console.log(`${bounds.pad(1, 2, 3, 4)}`);
    console.log(`${bounds.pad(-10)}`);
    console.log(`${bounds.pad(-10)}`);
    console.log(`${bounds.pad(-10)}`);
}
