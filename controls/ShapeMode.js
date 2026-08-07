import { cookie, globals } from "../controls.js";
/**
 * Shape-Mode. There are two geometries, and only two:
 *
 *   "discrete"
 *      Integer coordinates, hand computed. Drawn either as outlines on graph
 *      paper or as mosaic tiles -- those are presentations of one geometry, not
 *      separate modes, and the overlay flags choose between them.
 *   "real"
 *      True five fold symmetry, from sines, cosines and phi.
 *
 * Mosaic used to be a third mode, which is what made "pentas and stars" dead in
 * one mode and live in another. See TODO 7a.
 */

export class ShapeMode {
    MODE_DISCRETE = "discrete";
    MODE_REAL = "real";
    MODE_LIST = [this.MODE_DISCRETE, this.MODE_REAL];
    constructor(app) {
        this.app = app;
        this.eleMode = document.querySelector("#shape-mode");
        this.reset();
        if (this.eleMode)
            this.eleMode.addEventListener(
                "click",
                this.clickMode.bind(this),
                false
            );
        this.refresh();
    }
    /**
     * Changing the shape mode also changes the globals that penta, star and
     * deca use.
     * Todo: penta star and deca also have some crud, for example drawing the
     * figures.
     */
    refresh() {
        if (this.eleMode) this.eleMode.innerHTML = this.shapeMode;
        cookie.set(ShapeMode.name, this.toString());
    }

    /**
     * Re-reads the mode from the cookie. Called by the constructor, and by
     * measureTasks so the iframe picks up a mode the parent changed.
     *
     * The default only applies on first construction. Setting it every time
     * would make it the fallback handed to cookie.get, so a missing cookie
     * would silently drop the current mode back to real instead of keeping it.
     */
    reset() {
        if (!this.shapeMode) this.shapeMode = this.MODE_DISCRETE;
        const cookieJson = cookie.get(ShapeMode.name, this.toString());
        this.fromString(cookieJson);
    }
    toString() {
        return JSON.stringify({
            shapeMode: this.shapeMode,
        });
    }
    fromString(jsonString) {
        ({ shapeMode: this.shapeMode } = JSON.parse(jsonString));
        // A cookie written before there were two geometries names a mode that no
        // longer exists. Both old discrete modes fold into "discrete".
        if (!this.MODE_LIST.includes(this.shapeMode)) {
            this.shapeMode = this.MODE_DISCRETE;
        }
    }
    clickMode() {
        let new_idx =
            (this.MODE_LIST.indexOf(this.shapeMode) + 1) %
            this.MODE_LIST.length;
        this.shapeMode = this.MODE_LIST[new_idx];
        this.refresh();
        // The overlays have to be told. Mosaic is a presentation of the discrete
        // geometry only, so changing geometry clears and disables it and turns
        // pentas on. Overlays.refresh() is otherwise only reached from its own
        // checkboxes, so without this the flags never learn the mode moved.
        if (globals.overlays) globals.overlays.refresh();
        this.app(ShapeMode.name);
    }
}
