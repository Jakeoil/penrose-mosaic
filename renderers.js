import { globals, measureTaskGlobals } from "./controls.js";
import { penrose } from "./penrose.js";
import { USE_FUNCTION_LIST } from "./penrose-screen.js";
import { lerp } from "./penrose-screen.js";

export class CanvasRenderer {
    constructor(g, scale) {
        this.g = g;
        this.scale = scale;
    }
    /***
     * Used by Mosaic figure.
     * This is the routine that ultimately renders the 'tile'
     * @param {*} fill One of the colors
     * @param {*} offset Location in P format
     * @param {*} shape centered array of 'pixels' centered.
     * Prerequisites: Globals g and scale
     */
    figure(fill, offset, shape) {
        const { pentaStyle } = globals;
        const { g, scale } = this;
        g.save();
        g.fillStyle = fill; //e.g penrose.ORANGE;
        g.strokeStyle = penrose.OUTLINE;

        for (const point of shape) {
            g.fillRect(
                offset.x * scale + point.x * scale,
                offset.y * scale + point.y * scale,
                scale,
                scale
            );
            if (scale >= 5) {
                g.strokeRect(
                    offset.x * scale + point.x * scale,
                    offset.y * scale + point.y * scale,
                    scale,
                    scale
                );
            }
        }
        g.restore();
    }

    /***
     * Used for quadrille
     *
     */
    outline(fill, offset, shape) {
        const { pentaStyle } = globals;
        const { g, scale } = this;
        g.save();

        if (!pentaStyle || pentaStyle.stroke == pentaStyle.SOLID) {
            g.strokeStyle = "#000000";
            g.lineWidth = 1;
        }

        if (!pentaStyle || pentaStyle.fill == pentaStyle.SOLID) {
            g.fillStyle = fill;
        } else if (pentaStyle && pentaStyle.fill == pentaStyle.TRANSPARENT) {
            g.fillStyle = fill + "80";
        }

        let start = true;
        for (const point of shape) {
            if (start) {
                g.beginPath();
                g.moveTo(
                    (point.x + offset.x) * scale,
                    (point.y + offset.y) * scale
                );
                start = false;
            } else {
                g.lineTo(
                    (point.x + offset.x) * scale,
                    (point.y + offset.y) * scale
                );
            }
        }
        g.closePath();

        // fill by default
        if (!pentaStyle || pentaStyle.fill != pentaStyle.NONE) {
            g.fill();
        }
        if (!pentaStyle || pentaStyle.stroke != pentaStyle.NONE) {
            g.stroke();
        }
        g.restore();
    }

    /**
     * Draw a 2 size x 2 size grid matching the scale
     * @param {point} offset - Point indicating center of grid
     * @param {*} size
     */
    grid(offset, size) {
        const { g, scale } = this;
        g.save();
        g.strokeStyle = penrose.OUTLINE;
        for (let y = -size; y < size; y++) {
            for (let x = -size; x < size; x++) {
                g.strokeRect(
                    offset.x * scale + x * scale,
                    offset.y * scale + y * scale,
                    scale,
                    scale
                );
            }
        }
        //
        g.strokeStyle = "#FF0000";
        g.beginPath();
        g.moveTo(offset.x * scale, (offset.y - size) * scale);
        g.lineTo(offset.x * scale, (offset.y + size) * scale);
        g.stroke();

        g.beginPath();
        g.moveTo((offset.x - size) * scale, offset.y * scale);
        g.lineTo((offset.x + size) * scale, offset.y * scale);
        g.stroke();

        g.restore();
    }

    line(loc, end, strokeStyle) {
        const { g, scale } = this;
        const currentWidth = g.lineWidth;
        const currentStrokeStyle = g.strokeStyle;
        g.strokeStyle = strokeStyle ? strokeStyle : "black";
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(loc.x * scale, loc.y * scale);
        g.lineTo(end.x * scale, end.y * scale);
        g.stroke();

        g.lineWidth = currentWidth;
        g.strokeStyle = currentStrokeStyle;
    }

    getGradient(fill, offset, shape, isHeads) {
        const { g, scale } = this;

        const point0 = shape[0].tr(offset).mult(scale);
        const point1 = shape[2].tr(offset).mult(scale);
        const canvasGradient = g.createLinearGradient(
            point0.x,
            point0.y,
            point1.x,
            point1.y
        );
        if (isHeads) {
            canvasGradient.addColorStop(0, "#fff");
            canvasGradient.addColorStop(2 / 3, fill);
            // color stop 1 has to be 1/3 of the way to "#000"
            const endColor = lerp(fill, "#000", 1 / 3);
            canvasGradient.addColorStop(1, endColor);
        } else {
            canvasGradient.addColorStop(0, "#000");
            canvasGradient.addColorStop(2 / 3, fill);
            const endColor = lerp(fill, "#fff", 1 / 3);
            canvasGradient.addColorStop(1, endColor);
        }
        return canvasGradient;
    }

    /**
     * Draw isogloss (contour) lines across a rhombus perpendicular to the
     * shape[0]→shape[2] diagonal. Lines are evenly spaced along that axis.
     * Thick rhombs (72°) get slightly heavier lines; thin rhombs (36°) get
     * lighter lines to balance visual weight against their tighter spacing.
     */
    drawIsogloss(offset, shape) {
        const { g, scale } = this;
        const LINE_COUNT = 7;

        const v0 = shape[0].tr(offset).mult(scale);
        const v1 = shape[1].tr(offset).mult(scale);
        const v2 = shape[2].tr(offset).mult(scale);
        const v3 = shape[3].tr(offset).mult(scale);

        // Detect thick vs thin from the cross product of edges at v0.
        // |sin(angle)| is larger for thick (72°) than thin (36°).
        const e1x = v1.x - v0.x, e1y = v1.y - v0.y;
        const e3x = v3.x - v0.x, e3y = v3.y - v0.y;
        const cross = Math.abs(e1x * e3y - e1y * e3x);
        const len1 = Math.sqrt(e1x * e1x + e1y * e1y);
        const len3 = Math.sqrt(e3x * e3x + e3y * e3y);
        const sinAngle = cross / (len1 * len3 || 1);
        // sin(72°) ≈ 0.95, sin(36°) ≈ 0.59
        const isThick = sinAngle > 0.75;

        g.save();

        // Clip to the rhombus
        g.beginPath();
        g.moveTo(v0.x, v0.y);
        g.lineTo(v1.x, v1.y);
        g.lineTo(v2.x, v2.y);
        g.lineTo(v3.x, v3.y);
        g.closePath();
        g.clip();

        g.strokeStyle = isThick ? "black" : "#666";
        g.lineWidth = isThick ? 1.5 : 1;

        for (let i = 1; i <= LINE_COUNT; i++) {
            const t = i / (LINE_COUNT + 1);
            let left, right;
            if (t <= 0.5) {
                const s = t * 2;
                left = { x: v0.x + (v3.x - v0.x) * s, y: v0.y + (v3.y - v0.y) * s };
                right = { x: v0.x + (v1.x - v0.x) * s, y: v0.y + (v1.y - v0.y) * s };
            } else {
                const s = (t - 0.5) * 2;
                left = { x: v3.x + (v2.x - v3.x) * s, y: v3.y + (v2.y - v3.y) * s };
                right = { x: v1.x + (v2.x - v1.x) * s, y: v1.y + (v2.y - v1.y) * s };
            }
            g.beginPath();
            g.moveTo(left.x, left.y);
            g.lineTo(right.x, right.y);
            g.stroke();
        }

        g.restore();
    }

    rhombus(fill, offset, shape, strokeStyle, isHeads) {
        const { g, scale } = this;
        const { rhombStyle } = { ...globals, ...measureTaskGlobals };
        g.save();
        let gradient = rhombStyle.fill == rhombStyle.GRADIENT;
        g.strokeStyle = strokeStyle ? strokeStyle : "black";
        switch (rhombStyle.fill) {
            case rhombStyle.GRADIENT:
                g.fillStyle = this.getGradient(fill, offset, shape, isHeads);
                break;
            case rhombStyle.TRANSPARENT:
                g.fillStyle = fill + "40"; //
                break;
            default:
                g.fillStyle = fill;
        }
        g.lineWidth = scale < 5 ? 1 : 2;
        let start = true;
        for (const point of shape) {
            if (start) {
                g.beginPath();
                g.moveTo(
                    (point.x + offset.x) * scale,
                    (point.y + offset.y) * scale
                );
                start = false;
            } else {
                g.lineTo(
                    (point.x + offset.x) * scale,
                    (point.y + offset.y) * scale
                );
            }
        }

        g.closePath();
        if (rhombStyle.fill != rhombStyle.NONE) {
            g.fill();
        }
        if (rhombStyle.stroke == "dihedral") {
            this.drawDihedralStroke(offset, shape, isHeads);
        } else if (rhombStyle.stroke != rhombStyle.NONE) {
            g.stroke();
        }
        g.restore();

        if (rhombStyle.isogloss) {
            this.drawIsogloss(offset, shape);
        }
    }

    /**
     * Draw rhombus edges with thickness indicating the dihedral fold type.
     * The RT dihedral angle is 144° at all edges. On the corrugated surface
     * each edge folds ±36° from flat:
     *   Ridge (convex, outside RT): 144° dihedral → thin line
     *   Valley (concave, inside RT): 216° dihedral → thick line
     *
     * When isHeads=true, v0 is high and v2 is low:
     *   Edges v0→v1, v3→v0 (near peak) = ridges → thin
     *   Edges v1→v2, v2→v3 (near valley) = valleys → thick
     * When isHeads=false, the roles swap.
     */
    drawDihedralStroke(offset, shape, isHeads) {
        const { g, scale } = this;
        const RIDGE_WIDTH = 1;
        const VALLEY_WIDTH = scale < 5 ? 2 : 3;
        const v = shape.map((pt) => ({
            x: (pt.x + offset.x) * scale,
            y: (pt.y + offset.y) * scale,
        }));

        // Edges: 0→1, 1→2, 2→3, 3→0
        // When isHeads: edges 0→1 and 3→0 are ridges; 1→2 and 2→3 are valleys
        const ridgeEdges = isHeads ? [[0,1],[3,0]] : [[1,2],[2,3]];
        const valleyEdges = isHeads ? [[1,2],[2,3]] : [[0,1],[3,0]];

        g.strokeStyle = "black";

        g.lineWidth = RIDGE_WIDTH;
        for (const [a, b] of ridgeEdges) {
            g.beginPath();
            g.moveTo(v[a].x, v[a].y);
            g.lineTo(v[b].x, v[b].y);
            g.stroke();
        }

        g.lineWidth = VALLEY_WIDTH;
        for (const [a, b] of valleyEdges) {
            g.beginPath();
            g.moveTo(v[a].x, v[a].y);
            g.lineTo(v[b].x, v[b].y);
            g.stroke();
        }
    }

    render(renderList) {
        if (USE_FUNCTION_LIST) {
            for (const item of renderList) {
                item(this);
            }
        } else {
            this.render2(renderList);
        }
    }
    render2(renderList) {
        for (const item of renderList) {
            switch (item.command) {
                case "outline":
                    this.outline(item.fill, item.loc, item.shape);
                    break;
                case "figure":
                    this.figure(item.fill, item.loc, item.shape);
                    break;
                case "grid":
                    this.grid(item.offset, item.size);
                    break;
                case "line":
                    this.line(item.loc, item.end, item.strokeStyle);
                    break;
                case "rhombus":
                    this.rhombus(
                        item.fill,
                        item.offset,
                        item.shape,
                        item.strokeStyle,
                        item.isHeads
                    );
                    break;
            }
        }
    }
}
