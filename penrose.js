"use strict";
import { real, quadrille, mosaic } from "./shape-modes.js";
export const stringify = JSON.stringify;

/**
 * This is stuff that is not specific to the mode or the default
 */
class Penrose {
    constructor() {
        // Default colors
        const ORANGE = "#e46c0a";
        const BLUE = "#0000ff";
        const YELLOW = "#ffff00";

        this.ORANGE_PENTA = "Pe1";
        this.BLUE_STAR = "St5";
        this.YELLOW_PENTA = "Pe3";
        this.BLUE_PENTA = "Pe5";
        this.BLUE_BOAT = "St3";
        this.BLUE_DIAMOND = "St1";
        this.DECAGON = "Deca";

        this.OUTLINE = "#4a7eba";

        this.up = [0, 2, 4, 6, 8]; //
        this.down = [5, 7, 9, 1, 3];

        this.Pe5 = {
            name: this.BLUE_PENTA,
            color: [
                this.YELLOW_PENTA,
                this.YELLOW_PENTA,
                this.YELLOW_PENTA,
                this.YELLOW_PENTA,
                this.YELLOW_PENTA,
            ],
            twist: [0, 0, 0, 0, 0],
            defaultColor: BLUE,
            diamond: [],
        };
        this.Pe3 = {
            name: this.YELLOW_PENTA,
            color: [
                this.YELLOW_PENTA,
                this.YELLOW_PENTA,
                this.ORANGE_PENTA,
                this.ORANGE_PENTA,
                this.YELLOW_PENTA,
            ],

            twist: [0, 0, -1, 1, 0],
            defaultColor: YELLOW,
            diamond: [0],
        };
        this.Pe1 = {
            name: this.ORANGE_PENTA,
            color: [
                this.YELLOW_PENTA,
                this.ORANGE_PENTA,
                this.ORANGE_PENTA,
                this.ORANGE_PENTA,
                this.ORANGE_PENTA,
            ],
            twist: [0, -1, 1, -1, 1],
            defaultColor: ORANGE,
            diamond: [1, 4],
        };
        // for stars, the color indicates existence.
        this.St5 = {
            name: this.BLUE_STAR,
            color: [
                this.BLUE_STAR,
                this.BLUE_STAR,
                this.BLUE_STAR,
                this.BLUE_STAR,
                this.BLUE_STAR,
            ],
            defaultColor: BLUE,
        };
        this.St3 = {
            name: this.BLUE_BOAT,
            color: [this.BLUE_STAR, this.BLUE_STAR, null, null, this.BLUE_STAR],
            defaultColor: BLUE,
        };
        this.St1 = {
            name: this.BLUE_DIAMOND,
            color: [this.BLUE_STAR, null, null, null, null],
            defaultColor: BLUE,
        };
        this.Deca = {
            name: this.DECAGON,
        };
        this.mosaic = mosaic;
        this.quadrille = quadrille;
        this.real = real;
    }
}
export const penrose = new Penrose();
