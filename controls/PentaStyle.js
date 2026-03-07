import { cookie } from "../controls.js";
/**
 * @params {function} app - The app to be refeshed
 */
export class PentaStyle {
    SOLID = "solid";
    NONE = "none";
    GRADIENT = "gradient";
    TRANSPARENT = "transparent";
    constructor(app) {
        this.app = app;
        this.eleFill = document.querySelector("#penta-fill");
        // none, color, gradiant.
        this.eleStroke = document.querySelector("#penta-stroke");
        this.eleFill.addEventListener(
            "change",
            this.onFillChanged.bind(this),
            false
        );
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
        this.fromString(cookie.get(PentaStyle.name, this.toString()));
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
            `#penta-fill > option[value="${this.fill}"]`
        );
        if (eleSelectedOption) eleSelectedOption.selected = true;
        eleSelectedOption = document.querySelector(
            `#penta-stroke > option[value="${this.stroke}"]`
        );
        if (eleSelectedOption) eleSelectedOption.selected = true;

        cookie.set(PentaStyle.name, this.toString(this));
    }
    onFillChanged(event) {
        this.fill = event.target.value;
        this.refresh();
        this.app(PentaStyle.name);
    }
    onStrokeChanged(event) {
        this.stroke = event.target.value;
        this.refresh();
        this.app(PentaStyle.name);
    }
}
