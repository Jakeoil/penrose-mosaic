import { penrose } from "./penrose.js";
import { lerp } from "./color.js";
import {
    DEFAULT_PENTA_STYLE,
    DEFAULT_RHOMB_STYLE,
    DEFAULT_MOSAIC_STYLE,
    pickStyle,
} from "./styles.js";

/**
 * The same render list, drawn as SVG.
 *
 * It implements the five methods a render list calls -- outline, figure, grid,
 * line, rhombus -- so it is a drop-in for CanvasRenderer against any list
 * PenroseScreen builds. See docs/PLANS.md, "Rendering with SVG".
 *
 * Deliberately imports nothing that touches the DOM or `globals`. Styles come in
 * through the constructor and fall back to the defaults in styles.js, so this
 * works in node, which is where a PDF would be made.
 *
 * Coordinates are emitted in the same scaled user units the canvas uses, and the
 * viewBox is tracked from what is actually drawn, so the output frames itself.
 *
 * Not wired to any page. The first use for it is PDFs of the Sun/Star overlay.
 */

const PRECISION = 3;
const ROUND = 10 ** PRECISION;

/** Short numbers keep the file small; three decimals is well under a pixel. */
const n = (v) => {
    const r = Math.round(v * ROUND) / ROUND;
    return Object.is(r, -0) ? 0 : r;
};

const esc = (s) =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export class SvgRenderer {
    /**
     * @param {object} [options]
     * @param {number} [options.scale=1]
     * @param {{pentaStyle?, rhombStyle?, mosaicStyle?}} [options.styles]
     * @param {string} [options.background] - a paint for a backing rect, or
     *   omitted to leave the page transparent, which is what a PDF wants.
     * @param {number} [options.pad=0] - user units of air around the viewBox.
     */
    constructor({ scale = 1, styles, background, pad = 0 } = {}) {
        this.scale = scale;
        this.background = background;
        this.pad = pad;
        this.body = [];
        /** gradient key -> def, so rotations share one def rather than one each */
        this.gradients = new Map();
        this.minX = Infinity;
        this.minY = Infinity;
        this.maxX = -Infinity;
        this.maxY = -Infinity;
        this.injectedStyles = styles;
        this.resolved = null;
    }

    /** Resolved once per pass, as CanvasRenderer does it -- minus the globals. */
    get styles() {
        if (!this.resolved) {
            const own = this.injectedStyles;
            this.resolved = Object.freeze({
                pentaStyle: pickStyle("pentaStyle", DEFAULT_PENTA_STYLE, own),
                mosaicStyle: pickStyle("mosaicStyle", DEFAULT_MOSAIC_STYLE, own),
                rhombStyle: pickStyle("rhombStyle", DEFAULT_RHOMB_STYLE, own),
            });
        }
        return this.resolved;
    }

    // ---- geometry bookkeeping ---------------------------------------------

    /** Scales a shape point by its offset, and grows the viewBox to hold it. */
    at(point, offset) {
        const x = (point.x + offset.x) * this.scale;
        const y = (point.y + offset.y) * this.scale;
        this.see(x, y);
        return { x, y };
    }

    see(x, y) {
        if (x < this.minX) this.minX = x;
        if (y < this.minY) this.minY = y;
        if (x > this.maxX) this.maxX = x;
        if (y > this.maxY) this.maxY = y;
    }

    get isEmpty() {
        return !Number.isFinite(this.minX);
    }

    points(shape, offset) {
        return shape.map((pt) => {
            const q = this.at(pt, offset);
            return n(q.x) + "," + n(q.y);
        }).join(" ");
    }

    // ---- the five render-list methods --------------------------------------

    /** Outlines: the quadrille and real presentations. */
    outline(fill, offset, shape) {
        const { pentaStyle } = this.styles;
        const attrs = ['points="' + this.points(shape, offset) + '"'];

        if (pentaStyle.fill == pentaStyle.NONE) attrs.push('fill="none"');
        else if (pentaStyle.fill == pentaStyle.TRANSPARENT)
            attrs.push('fill="' + esc(fill) + '"', 'fill-opacity="0.5"');
        else attrs.push('fill="' + esc(fill) + '"');

        if (pentaStyle.stroke == pentaStyle.NONE) attrs.push('stroke="none"');
        else attrs.push('stroke="#000000"', 'stroke-width="1"');

        this.body.push("<polygon " + attrs.join(" ") + "/>");
    }

    /**
     * Mosaic tiles: a set of unit squares, so one path of square subpaths rather
     * than an element per cell. The border is either every square's edge -- the
     * grid -- or just the silhouette.
     */
    figure(fill, offset, shape) {
        const { mosaicStyle } = this.styles;
        const { scale } = this;
        const cells = shape.map((pt) => this.at(pt, offset));
        // at() sees the low corner of each square; the far corner counts too.
        for (const c of cells) this.see(c.x + scale, c.y + scale);

        const squares = cells.map((c) =>
            "M" + n(c.x) + " " + n(c.y) + "h" + n(scale) +
            "v" + n(scale) + "h" + n(-scale) + "z").join("");

        if (mosaicStyle.fill != mosaicStyle.NONE) {
            const opacity = mosaicStyle.fill == mosaicStyle.TRANSPARENT
                ? ' fill-opacity="0.5"' : "";
            this.body.push('<path d="' + squares + '" fill="' + esc(fill) + '"' +
                           opacity + "/>");
        }

        // The resolution rule still wins -- square edges are noise below it.
        if (mosaicStyle.border == mosaicStyle.GRID && scale >= 5) {
            this.body.push('<path d="' + squares + '" fill="none" stroke="' +
                           esc(penrose.OUTLINE) + '"/>');
        } else if (mosaicStyle.border == mosaicStyle.OUTLINE) {
            const d = this.silhouette(shape, offset);
            if (d) this.body.push('<path d="' + d + '" fill="none" stroke="' +
                                  esc(penrose.OUTLINE) + '"/>');
        }
    }

    /**
     * The exact boundary of a set of unit squares: an edge shared by two squares
     * is interior, so keeping the edges that appear exactly once leaves the
     * silhouette. Same rule CanvasRenderer uses.
     */
    silhouette(shape, offset) {
        const seen = new Map();
        for (const point of shape) {
            const x = point.x, y = point.y;
            for (const e of [
                [x, y, x + 1, y],
                [x + 1, y, x + 1, y + 1],
                [x + 1, y + 1, x, y + 1],
                [x, y + 1, x, y],
            ]) {
                const key =
                    e[0] < e[2] || (e[0] === e[2] && e[1] < e[3])
                        ? e[0] + "," + e[1] + "," + e[2] + "," + e[3]
                        : e[2] + "," + e[3] + "," + e[0] + "," + e[1];
                seen.set(key, (seen.get(key) || 0) + 1);
            }
        }
        const parts = [];
        for (const [key, count] of seen) {
            if (count !== 1) continue;
            const [x1, y1, x2, y2] = key.split(",").map(Number);
            const a = this.at({ x: x1, y: y1 }, offset);
            const b = this.at({ x: x2, y: y2 }, offset);
            parts.push("M" + n(a.x) + " " + n(a.y) + "L" + n(b.x) + " " + n(b.y));
        }
        return parts.join("");
    }

    /** A 2size x 2size grid at the scale, with the axes through its center. */
    grid(offset, size) {
        const { scale } = this;
        const squares = [];
        for (let y = -size; y < size; y++)
            for (let x = -size; x < size; x++) {
                const q = this.at({ x, y }, offset);
                squares.push("M" + n(q.x) + " " + n(q.y) + "h" + n(scale) +
                             "v" + n(scale) + "h" + n(-scale) + "z");
            }
        this.body.push('<path d="' + squares.join("") + '" fill="none" stroke="' +
                       esc(penrose.OUTLINE) + '"/>');

        const cx = offset.x * scale, cy = offset.y * scale;
        const span = size * scale;
        this.see(cx - span, cy - span);
        this.see(cx + span, cy + span);
        this.body.push('<path d="M' + n(cx) + " " + n(cy - span) + "V" + n(cy + span) +
                       "M" + n(cx - span) + " " + n(cy) + "H" + n(cx + span) +
                       '" fill="none" stroke="#FF0000"/>');
    }

    /** loc and end are both absolute, as the canvas renderer treats them. */
    line(loc, end, strokeStyle) {
        const origin = { x: 0, y: 0 };
        const a = this.at(loc, origin);
        const b = this.at(end, origin);
        this.body.push('<line x1="' + n(a.x) + '" y1="' + n(a.y) + '" x2="' +
                       n(b.x) + '" y2="' + n(b.y) + '" stroke="' +
                       esc(strokeStyle || "black") + '" stroke-width="1"/>');
    }

    rhombus(fill, offset, shape, strokeStyle, isHeads) {
        const { rhombStyle } = this.styles;
        const { scale } = this;
        const v = shape.map((pt) => this.at(pt, offset));
        const attrs = ['points="' +
            v.map((q) => n(q.x) + "," + n(q.y)).join(" ") + '"'];

        switch (rhombStyle.fill) {
            case rhombStyle.GRADIENT:
                attrs.push('fill="url(#' + this.gradientFor(fill, v, isHeads) + ')"');
                break;
            case rhombStyle.TRANSPARENT:
                // The canvas spelling is fill + "40", which is 25%.
                attrs.push('fill="' + esc(fill) + '"', 'fill-opacity="0.25"');
                break;
            case rhombStyle.NONE:
                attrs.push('fill="none"');
                break;
            default:
                attrs.push('fill="' + esc(fill) + '"');
        }

        if (rhombStyle.stroke == "dihedral") {
            attrs.push('stroke="none"');
            this.body.push("<polygon " + attrs.join(" ") + "/>");
            this.dihedralStroke(v, isHeads);
        } else if (rhombStyle.stroke == rhombStyle.NONE) {
            attrs.push('stroke="none"');
            this.body.push("<polygon " + attrs.join(" ") + "/>");
        } else {
            attrs.push('stroke="' + esc(strokeStyle || "black") + '"',
                       'stroke-width="' + (scale < 5 ? 1 : 2) + '"');
            this.body.push("<polygon " + attrs.join(" ") + "/>");
        }

        if (rhombStyle.isogloss) this.isogloss(v);
    }

    // ---- rhomb decoration --------------------------------------------------

    /**
     * One def per color, parity and rotation rather than one per rhomb.
     *
     * The canvas builds a fresh createLinearGradient for every rhomb, which in
     * SVG would be a def per rhomb -- six figures of them at generation 5. A
     * gradient varies only by those three things, so keying on the axis in
     * objectBoundingBox units collapses them to a couple of dozen.
     */
    gradientFor(fill, v, isHeads) {
        const xs = v.map((q) => q.x), ys = v.map((q) => q.y);
        const minX = Math.min(...xs), minY = Math.min(...ys);
        const w = Math.max(...xs) - minX || 1;
        const h = Math.max(...ys) - minY || 1;
        // shape[0] -> shape[2] is the long diagonal, which is the gradient axis.
        const box = [
            (v[0].x - minX) / w, (v[0].y - minY) / h,
            (v[2].x - minX) / w, (v[2].y - minY) / h,
        ].map((t) => Math.round(t * 1000) / 1000);

        const key = fill + "|" + (isHeads ? 1 : 0) + "|" + box.join(",");
        const found = this.gradients.get(key);
        if (found) return found.id;

        const id = "g" + this.gradients.size;
        const stops = isHeads
            ? [["0", "#fff"], ["0.6667", fill], ["1", lerp(fill, "#000", 1 / 3)]]
            : [["0", "#000"], ["0.6667", fill], ["1", lerp(fill, "#fff", 1 / 3)]];
        this.gradients.set(key, { id, box, stops });
        return id;
    }

    /**
     * Edge thickness shows the fold: ridges thin, valleys thick, and the parity
     * decides which pair is which, as it does on the canvas.
     */
    dihedralStroke(v, isHeads) {
        const RIDGE = 1;
        const VALLEY = this.scale < 5 ? 2 : 3;
        const ridges = isHeads ? [[0, 1], [3, 0]] : [[1, 2], [2, 3]];
        const valleys = isHeads ? [[1, 2], [2, 3]] : [[0, 1], [3, 0]];
        for (const [edges, width] of [[ridges, RIDGE], [valleys, VALLEY]]) {
            const d = edges.map(([a, b]) =>
                "M" + n(v[a].x) + " " + n(v[a].y) +
                "L" + n(v[b].x) + " " + n(v[b].y)).join("");
            this.body.push('<path d="' + d + '" fill="none" stroke="black" ' +
                           'stroke-width="' + width + '"/>');
        }
    }

    /**
     * Contour lines across the rhomb, evenly spaced along the long diagonal.
     *
     * The canvas clips these to the rhomb. No clipPath is needed here: both
     * endpoints are interpolated along the rhomb's own edges, so they lie on the
     * boundary, and a segment between two boundary points of a convex shape
     * stays inside it. Only half a stroke width can spill, at the corners.
     * tools/svg.test.mjs checks the endpoints really are on the boundary.
     */
    isogloss(v) {
        const LINE_COUNT = 7;
        const [v0, v1, v2, v3] = v;
        const cross = Math.abs(
            (v1.x - v0.x) * (v3.y - v0.y) - (v1.y - v0.y) * (v3.x - v0.x));
        const len1 = Math.hypot(v1.x - v0.x, v1.y - v0.y);
        const len3 = Math.hypot(v3.x - v0.x, v3.y - v0.y);
        const isThick = cross / (len1 * len3 || 1) > 0.75;

        const mix = (a, b, s) =>
            ({ x: a.x + (b.x - a.x) * s, y: a.y + (b.y - a.y) * s });
        const parts = [];
        for (let i = 1; i <= LINE_COUNT; i++) {
            const t = i / (LINE_COUNT + 1);
            const left = t <= 0.5 ? mix(v0, v3, t * 2) : mix(v3, v2, (t - 0.5) * 2);
            const right = t <= 0.5 ? mix(v0, v1, t * 2) : mix(v1, v2, (t - 0.5) * 2);
            parts.push("M" + n(left.x) + " " + n(left.y) +
                       "L" + n(right.x) + " " + n(right.y));
        }
        this.body.push('<path d="' + parts.join("") + '" fill="none" stroke="' +
                       (isThick ? "black" : "#666") + '" stroke-width="' +
                       (isThick ? 1.5 : 1) + '"/>');
    }

    // ---- output ------------------------------------------------------------

    /** Replays a render list. Same contract as CanvasRenderer.render. */
    render(renderList) {
        this.resolved = null;
        for (const item of renderList) item(this);
        return this;
    }

    get viewBox() {
        if (this.isEmpty) return { x: 0, y: 0, width: 0, height: 0 };
        const pad = this.pad;
        return {
            x: this.minX - pad,
            y: this.minY - pad,
            width: this.maxX - this.minX + pad * 2,
            height: this.maxY - this.minY + pad * 2,
        };
    }

    defs() {
        if (!this.gradients.size) return "";
        const out = [];
        for (const { id, box, stops } of this.gradients.values()) {
            const marks = stops.map(([o, c]) =>
                '<stop offset="' + o + '" stop-color="' + esc(c) + '"/>').join("");
            out.push('<linearGradient id="' + id + '" x1="' + box[0] +
                     '" y1="' + box[1] + '" x2="' + box[2] + '" y2="' + box[3] +
                     '">' + marks + "</linearGradient>");
        }
        return "<defs>" + out.join("") + "</defs>";
    }

    /**
     * The complete document. Width and height default to the viewBox, so the
     * thing comes out its own natural size and still scales freely.
     */
    toString({ width, height, title } = {}) {
        const box = this.viewBox;
        const back = this.background
            ? '<rect x="' + n(box.x) + '" y="' + n(box.y) + '" width="' +
              n(box.width) + '" height="' + n(box.height) + '" fill="' +
              esc(this.background) + '"/>'
            : "";
        return '<svg xmlns="http://www.w3.org/2000/svg" width="' +
            n(width ?? box.width) + '" height="' + n(height ?? box.height) +
            '" viewBox="' + n(box.x) + " " + n(box.y) + " " +
            n(box.width) + " " + n(box.height) + '">' +
            (title ? "<title>" + esc(title) + "</title>" : "") +
            this.defs() + back + this.body.join("") + "</svg>";
    }
}
