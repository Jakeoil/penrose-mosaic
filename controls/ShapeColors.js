import { penrose } from "../penrose.js";
import { cookie } from "../controls.js";

/**********************************************************************
 * Shape colors control for the DOM.
 * Contains a mapping of id to entry,
 * entry: {ele, color, defaultColor}
 */
export class ShapeColors {
    defaultColors = {
        "pe5-color": penrose.Pe5.defaultColor,
        "pe3-color": penrose.Pe3.defaultColor,
        "pe1-color": penrose.Pe1.defaultColor,
        "star-color": penrose.St5.defaultColor,
        "boat-color": penrose.St3.defaultColor,
        "diamond-color": penrose.St1.defaultColor,
    };
    constructor(app) {
        this.app = app;
        this.shapeColorEles = document.querySelectorAll(".shape-color");
        this.reset();

        for (const ele of this.shapeColorEles) {
            const entry = this.shapeColors[ele.id];
            if (entry) {
                ele.addEventListener(
                    "input",
                    this.onShapeColorsInput.bind(this),
                    false
                );
                ele.addEventListener(
                    "change",
                    this.onShapeColorsChange.bind(this),
                    false
                );
            } else {
                console.log(`unsupported id: ${ele.id} in shape-color class`);
            }
        }

        this.reset_ele = document.querySelector("#color-reset");
        if (this.reset_ele)
            this.reset_ele.addEventListener(
                "click",
                this.onColorReset.bind(this),
                false
            );
        this.refresh();
    }

    /**
     * Set the elements to their defaults
     */
    reset() {
        this.shapeColors = { ...this.defaultColors };
        const json_cookie = cookie.get(ShapeColors.name, this.toString());
        this.fromString(json_cookie);
    }

    /**
     * Set the elements to the last value received
     */
    refresh() {
        for (const ele of this.shapeColorEles) {
            const color = this.shapeColors[ele.id];
            if (color) {
                ele.value = color;
            }
        }
        cookie.set(ShapeColors.name, this.toString());
    }

    toString() {
        return JSON.stringify(this.shapeColors);
    }
    fromString(jsonString) {
        ({
            "pe5-color": this.shapeColors["pe5-color"],
            "pe3-color": this.shapeColors["pe3-color"],
            "pe1-color": this.shapeColors["pe1-color"],
            "star-color": this.shapeColors["star-color"],
            "boat-color": this.shapeColors["boat-color"],
            "diamond-color": this.shapeColors["diamond-color"],
        } = JSON.parse(jsonString));
    }

    onShapeColorsInput(event) {
        this.shapeColors[event.target.id] = event.target.value;
        this.refresh();
        this.app(ShapeColors.name);
    }

    onShapeColorsChange(event) {
        this.shapeColors[event.target.id] = event.target.value;
        this.refresh();
        this.app(ShapeColors.name);
    }
    // The reset button was clicked.
    onColorReset() {
        cookie.delete(ShapeColors.name);
        const deletedCookie = cookie.get(ShapeColors.name);
        this.reset();
        this.refresh();
        this.app(ShapeColors.name);
    }
}
