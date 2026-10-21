/**
 * The style sets a renderer draws by, with defaults.
 *
 * This module has no imports on purpose. The style objects the sidebar builds
 * are control instances carrying both their current values and the constants
 * those values are compared against, so a default has to carry both too --
 * `renderers.js` tests `pentaStyle.fill == pentaStyle.SOLID`, not a string.
 *
 * Two things want this. `CanvasRenderer` read `globals.pentaStyle` and friends
 * out of module state inside its own methods, which made it unusable outside the
 * app; and a second renderer -- the SVG one in docs/PLANS.md -- would have
 * inherited exactly that coupling. Both want the same thing: styles resolved
 * from what the caller passed, falling back to the app's, falling back to these.
 *
 * Frozen, because every renderer that falls back shares the one object.
 */

// Fill and stroke modes shared by all three. Mosaic adds its own border modes.
const MODES = {
    SOLID: "solid",
    NONE: "none",
    GRADIENT: "gradient",
    TRANSPARENT: "transparent",
};

/** Outlines: the quadrille and real presentations. */
export const DEFAULT_PENTA_STYLE = Object.freeze({
    ...MODES,
    fill: "solid",
    stroke: "solid",
});

/** Rhombs, which also carry the isogloss flag and the dihedral stroke. */
export const DEFAULT_RHOMB_STYLE = Object.freeze({
    ...MODES,
    fill: "solid",
    stroke: "solid",
    isogloss: false,
});

/** Mosaic tiles, whose border is a grid or a silhouette rather than a stroke. */
export const DEFAULT_MOSAIC_STYLE = Object.freeze({
    ...MODES,
    GRID: "grid",
    OUTLINE: "outline",
    fill: "solid",
    border: "grid",
});

/**
 * First source that has the named style wins; the default is the last resort.
 * Sources may be undefined, which is the point -- a consumer passes nothing and
 * still gets a complete set.
 */
export function pickStyle(name, fallback, ...sources) {
    for (const source of sources) if (source && source[name]) return source[name];
    return fallback;
}
