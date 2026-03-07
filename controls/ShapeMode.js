import { cookie } from "../controls.js";
/**
 * Shape-Mode:
 *   "mosaic"
 *      Mosaic tiles
 *   "quadrille"
 *      Filled outlines like on graph paper
 *   "real"
 *      True five fold real symmetry todo
 */
// const MODE_MOSAIC = "mosaic";
// const MODE_QUADRILLE = "quadrille";
// export const MODE_REAL = "real";
// const MODE_LIST = [MODE_MOSAIC, MODE_QUADRILLE, MODE_REAL];

export class ShapeMode {
    MODE_MOSAIC = "mosaic";
    MODE_QUADRILLE = "quadrille";
    MODE_REAL = "real";
    MODE_LIST = [this.MODE_MOSAIC, this.MODE_QUADRILLE, this.MODE_REAL];
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

    reset() {
        this.shapeMode = this.MODE_REAL;
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
    }
    clickMode() {
        let new_idx =
            (this.MODE_LIST.indexOf(this.shapeMode) + 1) %
            this.MODE_LIST.length;
        this.shapeMode = this.MODE_LIST[new_idx];
        this.refresh();
        this.app(ShapeMode.name);
    }
}
