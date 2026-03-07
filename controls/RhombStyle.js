import { cookie } from "../controls.js";
/**
 * no fill   (null)
 * solid fill with passed color (#hhhhhh)
 * gradient fill with passed color (#hhhhhh)
 * Color darkened according to angle. (heads origin is high)
 *
 * Independant of color
 */
export class RhombStyle {
    SOLID = "solid";
    NONE = "none";
    GRADIENT = "gradient";
    TRANSPARENT = "transparent";

    constructor(app) {
        this.app = app;
        this.eleFill = document.querySelector("#rhomb-fill");
        // none, color, gradiant.
        this.eleStroke = document.querySelector("#rhomb-stroke");
        if (this.eleFill)
            this.eleFill.addEventListener(
                "change",
                this.onFillChanged.bind(this),
                false
            );
        if (this.eleStroke)
            this.eleStroke.addEventListener(
                "change",
                this.onStrokeChanged.bind(this),
                false
            );
        this.reset();
        this.refresh();
    }
    reset() {
        this.fill = this.SOLID;
        this.stroke = this.SOLID;
        this.fromString(cookie.get(RhombStyle.name, this.toString()));
    }
    toString() {
        return JSON.stringify({
            fill: this.fill,
            stroke: this.stroke,
        });
    }
    fromString(jsonString) {
        ({ fill: this.fill, stroke: this.stroke } = JSON.parse(jsonString));
    }
    refresh() {
        let eleSelectedOption = document.querySelector(
            `#rhomb-fill > option[value="${this.fill}"]`
        );
        if (eleSelectedOption) eleSelectedOption.selected = true;
        eleSelectedOption = document.querySelector(
            `#rhomb-stroke > option[value="${this.stroke}"]`
        );
        if (eleSelectedOption) eleSelectedOption.selected = true;

        cookie.set(RhombStyle.name, this.toString(this));
    }

    onFillChanged(event) {
        this.fill = event.target.value;
        this.refresh();
        this.app(RhombStyle.name);
    }
    onStrokeChanged(event) {
        this.stroke = event.target.value;
        this.refresh();
        this.app(RhombStyle.name);
    }
}
