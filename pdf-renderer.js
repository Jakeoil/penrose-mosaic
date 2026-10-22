import { penrose } from "./penrose.js";
import {
    DEFAULT_PENTA_STYLE,
    DEFAULT_RHOMB_STYLE,
    DEFAULT_MOSAIC_STYLE,
    pickStyle,
} from "./styles.js";

/**
 * The same render list, written as PDF.
 *
 * Third renderer against the five-method contract, after canvas and SVG, so it
 * takes any list PenroseScreen builds. See docs/PLANS.md.
 *
 * It writes the PDF itself rather than converting an SVG. Every converter on
 * hand either was broken (cairosvg, missing libcairo) or would have rasterized
 * (ImageMagick), and the alternatives all mean a brew or pip install -- which
 * this project does not have and should not need. A PDF content stream is close
 * to what a render list already is: move, line, fill, stroke. So it is written
 * directly, uncompressed, and depends on nothing.
 *
 * Imports nothing that touches the DOM or `globals`, as the SVG renderer does
 * not, so this runs in node.
 *
 * One thing is not supported: the rhomb gradient falls back to a solid fill.
 * PDF wants an axial shading dictionary per gradient, and the first use for this
 * is the Sun/Star overlay, which does not use one. `unsupported` lists anything
 * that was asked for and quietly substituted.
 */

const PRECISION = 3;
const ROUND = 10 ** PRECISION;

const n = (v) => {
    const r = Math.round(v * ROUND) / ROUND;
    return Object.is(r, -0) ? 0 : r;
};

// Only the names this codebase actually emits. Everything else is hex.
const NAMED = {
    black: [0, 0, 0], white: [1, 1, 1], red: [1, 0, 0], gray: [0.5, 0.5, 0.5],
};

/** PDF wants components in 0..1. Handles #rgb, #rrggbb, rgb(...) and a few names. */
function toRgb(color) {
    if (!color) return [0, 0, 0];
    const c = String(color).trim().toLowerCase();
    if (NAMED[c]) return NAMED[c];
    if (c.startsWith("rgb")) {
        const parts = c.replace(/[^0-9.,]/g, "").split(",").map(Number);
        return [0, 1, 2].map((i) => Math.min(1, Math.max(0, (parts[i] || 0) / 255)));
    }
    if (c.startsWith("#")) {
        const hex = c.slice(1);
        const wide = hex.length >= 6;
        const at = (i) => {
            const s = wide ? hex.slice(i * 2, i * 2 + 2) : hex[i] + hex[i];
            return parseInt(s, 16) / 255;
        };
        // An 8-digit hex carries alpha in the last pair; the caller handles that.
        return [at(0), at(1), at(2)];
    }
    return [0, 0, 0];
}

/** The canvas spells transparency as a trailing hex pair. Split it off. */
function splitAlpha(color) {
    const c = String(color || "").trim();
    if (c.startsWith("#") && c.length === 9)
        return { color: c.slice(0, 7), alpha: parseInt(c.slice(7), 16) / 255 };
    return { color: c, alpha: 1 };
}

export class PdfRenderer {
    /**
     * @param {object} [options]
     * @param {number} [options.scale=1]
     * @param {{pentaStyle?, rhombStyle?, mosaicStyle?}} [options.styles]
     * @param {string} [options.background] - a paint for a backing rect, or
     *   omitted to leave the page transparent.
     * @param {number} [options.pad=0] - user units of air around the page.
     * @param {string} [options.title]
     */
    constructor({ scale = 1, styles, background, pad = 0, title } = {}) {
        this.scale = scale;
        this.background = background;
        this.pad = pad;
        this.title = title;
        this.ops = [];
        /** "fillAlpha,strokeAlpha" -> name, so each pair is one ExtGState */
        this.alphas = new Map();
        /** things asked for that PDF got an approximation of */
        this.unsupported = new Set();
        this.minX = Infinity;
        this.minY = Infinity;
        this.maxX = -Infinity;
        this.maxY = -Infinity;
        this.injectedStyles = styles;
        this.resolved = null;
    }

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

    // ---- geometry ----------------------------------------------------------

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

    get box() {
        if (this.isEmpty) return { x: 0, y: 0, width: 0, height: 0 };
        const pad = this.pad;
        return {
            x: this.minX - pad,
            y: this.minY - pad,
            width: this.maxX - this.minX + pad * 2,
            height: this.maxY - this.minY + pad * 2,
        };
    }

    // ---- content stream helpers --------------------------------------------

    /** One ExtGState per distinct alpha pair, referenced as /GSn gs. */
    gs(fillAlpha, strokeAlpha) {
        if (fillAlpha === 1 && strokeAlpha === 1) return;
        const key = `${n(fillAlpha)},${n(strokeAlpha)}`;
        let name = this.alphas.get(key);
        if (!name) {
            name = `GS${this.alphas.size}`;
            this.alphas.set(key, name);
        }
        this.ops.push(`/${name} gs`);
    }

    setFill(color) {
        const [r, g, b] = toRgb(color);
        this.ops.push(`${n(r)} ${n(g)} ${n(b)} rg`);
    }

    setStroke(color) {
        const [r, g, b] = toRgb(color);
        this.ops.push(`${n(r)} ${n(g)} ${n(b)} RG`);
    }

    polygon(points) {
        points.forEach((q, i) =>
            this.ops.push(`${n(q.x)} ${n(q.y)} ${i ? "l" : "m"}`));
        this.ops.push("h");
    }

    /** f fills, S strokes, B does both, n discards. */
    paint(fill, stroke) {
        this.ops.push(fill && stroke ? "B" : fill ? "f" : stroke ? "S" : "n");
    }

    // ---- the five render-list methods --------------------------------------

    outline(fill, offset, shape) {
        const { pentaStyle } = this.styles;
        const points = shape.map((pt) => this.at(pt, offset));
        const doFill = pentaStyle.fill != pentaStyle.NONE;
        const doStroke = pentaStyle.stroke != pentaStyle.NONE;
        const alpha = pentaStyle.fill == pentaStyle.TRANSPARENT ? 0.5 : 1;

        this.ops.push("q");
        this.gs(alpha, 1);
        if (doFill) this.setFill(fill);
        if (doStroke) {
            this.setStroke("#000000");
            this.ops.push("1 w");
        }
        this.polygon(points);
        this.paint(doFill, doStroke);
        this.ops.push("Q");
    }

    figure(fill, offset, shape) {
        const { mosaicStyle } = this.styles;
        const { scale } = this;
        const cells = shape.map((pt) => this.at(pt, offset));
        for (const c of cells) this.see(c.x + scale, c.y + scale);

        if (mosaicStyle.fill != mosaicStyle.NONE) {
            this.ops.push("q");
            this.gs(mosaicStyle.fill == mosaicStyle.TRANSPARENT ? 0.5 : 1, 1);
            this.setFill(fill);
            for (const c of cells)
                this.ops.push(`${n(c.x)} ${n(c.y)} ${n(scale)} ${n(scale)} re`);
            this.ops.push("f", "Q");
        }

        // The resolution rule still wins -- square edges are noise below it.
        if (mosaicStyle.border == mosaicStyle.GRID && scale >= 5) {
            this.ops.push("q");
            this.setStroke(penrose.OUTLINE);
            this.ops.push("1 w");
            for (const c of cells)
                this.ops.push(`${n(c.x)} ${n(c.y)} ${n(scale)} ${n(scale)} re`);
            this.ops.push("S", "Q");
        } else if (mosaicStyle.border == mosaicStyle.OUTLINE) {
            this.ops.push("q");
            this.setStroke(penrose.OUTLINE);
            this.ops.push("1 w");
            for (const [a, b] of this.silhouette(shape, offset))
                this.ops.push(`${n(a.x)} ${n(a.y)} m`, `${n(b.x)} ${n(b.y)} l`);
            this.ops.push("S", "Q");
        }
    }

    /** Edges appearing once are the boundary; shared edges are interior. */
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
                        ? `${e[0]},${e[1]},${e[2]},${e[3]}`
                        : `${e[2]},${e[3]},${e[0]},${e[1]}`;
                seen.set(key, (seen.get(key) || 0) + 1);
            }
        }
        const edges = [];
        for (const [key, count] of seen) {
            if (count !== 1) continue;
            const [x1, y1, x2, y2] = key.split(",").map(Number);
            edges.push([this.at({ x: x1, y: y1 }, offset),
                        this.at({ x: x2, y: y2 }, offset)]);
        }
        return edges;
    }

    grid(offset, size) {
        const { scale } = this;
        this.ops.push("q");
        this.setStroke(penrose.OUTLINE);
        this.ops.push("1 w");
        for (let y = -size; y < size; y++)
            for (let x = -size; x < size; x++) {
                const q = this.at({ x, y }, offset);
                this.ops.push(`${n(q.x)} ${n(q.y)} ${n(scale)} ${n(scale)} re`);
            }
        this.ops.push("S", "Q");

        const cx = offset.x * scale, cy = offset.y * scale;
        const span = size * scale;
        this.see(cx - span, cy - span);
        this.see(cx + span, cy + span);
        this.ops.push("q");
        this.setStroke("#FF0000");
        this.ops.push("1 w",
            `${n(cx)} ${n(cy - span)} m`, `${n(cx)} ${n(cy + span)} l`,
            `${n(cx - span)} ${n(cy)} m`, `${n(cx + span)} ${n(cy)} l`,
            "S", "Q");
    }

    line(loc, end, strokeStyle) {
        const origin = { x: 0, y: 0 };
        const a = this.at(loc, origin);
        const b = this.at(end, origin);
        const { color, alpha } = splitAlpha(strokeStyle || "black");
        this.ops.push("q");
        this.gs(1, alpha);
        this.setStroke(color);
        this.ops.push("1 w", `${n(a.x)} ${n(a.y)} m`, `${n(b.x)} ${n(b.y)} l`,
                      "S", "Q");
    }

    rhombus(fill, offset, shape, strokeStyle, isHeads) {
        const { rhombStyle } = this.styles;
        const { scale } = this;
        const v = shape.map((pt) => this.at(pt, offset));

        let fillAlpha = 1;
        let doFill = true;
        switch (rhombStyle.fill) {
            case rhombStyle.GRADIENT:
                // PDF wants an axial shading dictionary per gradient. Solid for
                // now; the overlay this is for does not ask for one.
                this.unsupported.add("rhomb gradient (drawn solid)");
                break;
            case rhombStyle.TRANSPARENT:
                fillAlpha = 0.25; // the canvas spelling is fill + "40"
                break;
            case rhombStyle.NONE:
                doFill = false;
                break;
        }

        const dihedral = rhombStyle.stroke == "dihedral";
        const doStroke = !dihedral && rhombStyle.stroke != rhombStyle.NONE;

        this.ops.push("q");
        this.gs(fillAlpha, 1);
        if (doFill) this.setFill(fill);
        if (doStroke) {
            this.setStroke(strokeStyle || "black");
            this.ops.push(`${scale < 5 ? 1 : 2} w`);
        }
        this.polygon(v);
        this.paint(doFill, doStroke);
        this.ops.push("Q");

        if (dihedral) this.dihedralStroke(v, isHeads);
        if (rhombStyle.isogloss) this.isogloss(v);
    }

    /** Ridges thin, valleys thick; the parity says which pair is which. */
    dihedralStroke(v, isHeads) {
        const ridges = isHeads ? [[0, 1], [3, 0]] : [[1, 2], [2, 3]];
        const valleys = isHeads ? [[1, 2], [2, 3]] : [[0, 1], [3, 0]];
        const valleyWidth = this.scale < 5 ? 2 : 3;
        this.ops.push("q");
        this.setStroke("black");
        for (const [edges, width] of [[ridges, 1], [valleys, valleyWidth]]) {
            this.ops.push(`${width} w`);
            for (const [a, b] of edges)
                this.ops.push(`${n(v[a].x)} ${n(v[a].y)} m`,
                              `${n(v[b].x)} ${n(v[b].y)} l`);
            this.ops.push("S");
        }
        this.ops.push("Q");
    }

    /**
     * Contour lines across the rhomb. No clipping needed: both ends are
     * interpolated along the rhomb's own edges, and a rhomb is convex, so the
     * segment between them stays inside. Same reasoning as the SVG renderer.
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

        this.ops.push("q");
        this.setStroke(isThick ? "black" : "#666666");
        this.ops.push(`${isThick ? 1.5 : 1} w`);
        for (let i = 1; i <= LINE_COUNT; i++) {
            const t = i / (LINE_COUNT + 1);
            const left = t <= 0.5 ? mix(v0, v3, t * 2) : mix(v3, v2, (t - 0.5) * 2);
            const right = t <= 0.5 ? mix(v0, v1, t * 2) : mix(v1, v2, (t - 0.5) * 2);
            this.ops.push(`${n(left.x)} ${n(left.y)} m`,
                          `${n(right.x)} ${n(right.y)} l`);
        }
        this.ops.push("S", "Q");
    }

    // ---- output ------------------------------------------------------------

    render(renderList) {
        this.resolved = null;
        for (const item of renderList) item(this);
        return this;
    }

    /**
     * The content stream. PDF's y axis points up from the bottom left, so the
     * whole thing is drawn under a flip that also shifts the box origin to zero.
     */
    contentStream() {
        const box = this.box;
        const head = [`1 0 0 -1 ${n(-box.x)} ${n(box.height + box.y)} cm`];
        if (this.background) {
            const [r, g, b] = toRgb(this.background);
            head.push(`${n(r)} ${n(g)} ${n(b)} rg`,
                      `${n(box.x)} ${n(box.y)} ${n(box.width)} ${n(box.height)} re`,
                      "f");
        }
        return head.concat(this.ops).join("\n");
    }

    /** A complete single-page PDF, uncompressed. */
    toString() {
        const box = this.box;
        const content = this.contentStream();

        const extGState = [...this.alphas.entries()]
            .map(([key, name]) => {
                const [ca, CA] = key.split(",");
                return `/${name} << /Type /ExtGState /ca ${ca} /CA ${CA} >>`;
            }).join(" ");
        const resources = extGState
            ? `<< /ExtGState << ${extGState} >> >>`
            : "<< >>";

        const objects = [
            "<< /Type /Catalog /Pages 2 0 R >>",
            "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            `<< /Type /Page /Parent 2 0 R ` +
            `/MediaBox [0 0 ${n(box.width)} ${n(box.height)}] ` +
            `/Resources ${resources} /Contents 4 0 R >>`,
            `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
        ];
        if (this.title)
            objects.push(`<< /Title (${this.title.replace(/([()\\])/g, "\\$1")}) ` +
                         `/Producer (penrose-mosaic pdf-renderer) >>`);

        let pdf = "%PDF-1.4\n";
        const offsets = [];
        objects.forEach((body, i) => {
            offsets.push(pdf.length);
            pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
        });

        const startxref = pdf.length;
        pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
        for (const off of offsets)
            pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
        pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R` +
               (this.title ? ` /Info ${objects.length} 0 R` : "") +
               ` >>\nstartxref\n${startxref}\n%%EOF\n`;
        return pdf;
    }
}
