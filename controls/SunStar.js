import { cookie } from "../controls.js";

/**
 * The Sun/Star page's own controls, persisted the same way the sidebar's are so
 * a reload or a page change does not lose them.
 *
 * Two slots, a and b, each with a shape, an orientation, a generation and three
 * layer filters; plus the shared overlay flag and the shared zoom. Parity is
 * fixed to heads and the geometry to real, so neither is a control.
 *
 * @params {function} app - The app to be refreshed
 */
export class SunStar {
    KEYS = ["a", "b"];

    constructor(app) {
        this.app = app;
        this.reset();
        this.wire();
        this.refresh();
    }

    defaults(key) {
        return {
            type: key === "a" ? "sun" : "star",
            orient: "up",
            gen: 2,
            penta: true,
            rhomb: false,
            bigrhomb: false,
        };
    }

    reset() {
        this.overlay = false;
        this.zoom = 1;
        for (const key of this.KEYS) this[key] = this.defaults(key);
        this.fromString(cookie.get(SunStar.name, this.toString()));
    }

    toString() {
        return JSON.stringify({
            overlay: this.overlay,
            zoom: this.zoom,
            a: this.a,
            b: this.b,
        });
    }

    fromString(jsonString) {
        const parsed = JSON.parse(jsonString);
        this.overlay = !!parsed.overlay;
        this.zoom = Number.isFinite(parsed.zoom) ? parsed.zoom : 1;
        for (const key of this.KEYS) {
            this[key] = { ...this.defaults(key), ...(parsed[key] || {}) };
        }
    }

    ele(key, name) {
        return document.querySelector(`#ss-${key}-${name}`);
    }

    wire() {
        const eleOverlay = document.querySelector("#sunstar-overlay");
        if (eleOverlay)
            eleOverlay.addEventListener("change", () => this.changed(), false);

        for (const key of this.KEYS) {
            for (const name of [
                "type",
                "orient",
                "gen",
                "penta",
                "rhomb",
                "bigrhomb",
            ]) {
                const ele = this.ele(key, name);
                if (ele)
                    ele.addEventListener("change", () => this.changed(), false);
            }
        }

        // Zoom is shared, so it is one number and the wheel over either viewport
        // moves both. Double click refits.
        for (const id of ["#sunstar-a", "#sunstar-b"]) {
            const canvas = document.querySelector(id);
            if (!canvas) continue;
            canvas.addEventListener(
                "wheel",
                (event) => {
                    event.preventDefault();
                    const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
                    this.zoom = Math.max(0.05, Math.min(40, this.zoom * factor));
                    this.refresh();
                    this.app(SunStar.name);
                },
                { passive: false }
            );
            canvas.addEventListener(
                "dblclick",
                () => {
                    this.zoom = 1;
                    this.refresh();
                    this.app(SunStar.name);
                },
                false
            );
        }
    }

    /**
     * Reads the controls back, then enforces the one rule between them: small
     * and big rhombs are exclusive, though both may be off. Checkboxes rather
     * than a radio pair, because a radio cannot be unset.
     */
    changed() {
        const eleOverlay = document.querySelector("#sunstar-overlay");
        if (eleOverlay) this.overlay = eleOverlay.checked;

        for (const key of this.KEYS) {
            const slot = this[key];
            const wasRhomb = slot.rhomb;
            const wasBig = slot.bigrhomb;
            for (const name of ["type", "orient"]) {
                const ele = this.ele(key, name);
                if (ele) slot[name] = ele.value;
            }
            const eleGen = this.ele(key, "gen");
            if (eleGen) {
                const gen = parseInt(eleGen.value, 10);
                slot.gen = Number.isFinite(gen)
                    ? Math.max(1, Math.min(5, gen))
                    : 2;
            }
            for (const name of ["penta", "rhomb", "bigrhomb"]) {
                const ele = this.ele(key, name);
                if (ele) slot[name] = ele.checked;
            }
            if (slot.rhomb && slot.bigrhomb) {
                // Whichever was just turned on wins.
                if (!wasRhomb) slot.bigrhomb = false;
                else if (!wasBig) slot.rhomb = false;
                else slot.bigrhomb = false;
            }
        }

        this.refresh();
        this.app(SunStar.name);
    }

    refresh() {
        const eleOverlay = document.querySelector("#sunstar-overlay");
        if (eleOverlay) eleOverlay.checked = this.overlay;

        for (const key of this.KEYS) {
            const slot = this[key];
            for (const name of ["type", "orient"]) {
                const ele = this.ele(key, name);
                if (ele) ele.value = slot[name];
            }
            const eleGen = this.ele(key, "gen");
            if (eleGen) eleGen.value = slot.gen;
            for (const name of ["penta", "rhomb", "bigrhomb"]) {
                const ele = this.ele(key, name);
                if (ele) ele.checked = slot[name];
            }
        }

        cookie.set(SunStar.name, this.toString());
    }
}
