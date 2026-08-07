import { cookie } from "../controls.js";

/**
 * Styling for the mosaic tiles, independent of the penta styles. A mosaic tile
 * is a set of unit squares, so it styles differently from an outline: the fill
 * is per square, and the border is either every square's edge (the grid) or just
 * the boundary of the whole tile.
 *
 * @params {function} app - The app to be refreshed
 */
export class MosaicStyle {
    SOLID = "solid";
    NONE = "none";
    TRANSPARENT = "transparent";
    GRID = "grid";
    OUTLINE = "outline";

    constructor(app) {
        this.app = app;
        this.eleFill = document.querySelector("#mosaic-fill");
        this.eleBorder = document.querySelector("#mosaic-border");
        if (this.eleFill)
            this.eleFill.addEventListener(
                "change",
                this.onFillChanged.bind(this),
                false
            );
        if (this.eleBorder)
            this.eleBorder.addEventListener(
                "change",
                this.onBorderChanged.bind(this),
                false
            );
        this.reset();
        this.refresh();
    }
    reset() {
        this.fill = this.SOLID;
        this.border = this.GRID;
        this.fromString(cookie.get(MosaicStyle.name, this.toString()));
    }
    toString() {
        return JSON.stringify({ fill: this.fill, border: this.border });
    }
    fromString(jsonString) {
        ({ fill: this.fill, border: this.border } = JSON.parse(jsonString));
    }
    refresh() {
        let ele = document.querySelector(
            `#mosaic-fill > option[value="${this.fill}"]`
        );
        if (ele) ele.selected = true;
        ele = document.querySelector(
            `#mosaic-border > option[value="${this.border}"]`
        );
        if (ele) ele.selected = true;
        cookie.set(MosaicStyle.name, this.toString());
    }
    onFillChanged(event) {
        this.fill = event.target.value;
        this.refresh();
        this.app(MosaicStyle.name);
    }
    onBorderChanged(event) {
        this.border = event.target.value;
        this.refresh();
        this.app(MosaicStyle.name);
    }
}
