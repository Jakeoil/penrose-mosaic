import { cookie, globals, measureTaskGlobals } from "../controls.js";
/**
 * Overlays for the figures
 * Penta Layer
 *   #penta-ovl     pentaSelected: boolean
 *   #mosaic-penta  mosaicSelected: boolean
 *   #tree-pena     treeSelected: boolean
 *
 * Rhomb Layer
 *   #rhomb-ovl     rhombSelected: boolean
 *   #ammon         ammannSelected: boolean
 *   #small-rhomb   smallRhomb: boolean

 *
 * Controls globals.overlays
 * Only effects the active layer
 *
 */
export class Overlays {
    constructor(app) {
        this.app = app;
        this.elePenta = document.querySelector("#penta-ovl");
        this.eleMosaic = document.querySelector("#mosaic-penta");
        this.eleTree = document.querySelector("#tree-penta");
        this.eleRhomb = document.querySelector("#rhomb-ovl");
        this.eleAmmann = document.querySelector("#ammann");
        // This controls the size of both Rhomb and Ammann
        this.eleRhombSizeField = document.querySelector("#rhomb-size");
        this.radioButtons = document.querySelectorAll("input[name='rhomb']");
        this.eleLargeRhomb = document.querySelector("#large-rhomb");
        this.eleSmallRhomb = document.querySelector("#small-rhomb");

        if (this.elePenta) {
            this.elePenta.addEventListener(
                "click",
                this.pentaClicked.bind(this),
                false
            );
        }
        if (this.eleMosaic) {
            this.eleMosaic.addEventListener(
                "click",
                this.mosaicClicked.bind(this),
                false
            );
        }
        if (this.eleTree) {
            this.eleTree.addEventListener(
                "click",
                this.treeClicked.bind(this),
                false
            );
        }

        if (this.eleRhomb) {
            this.eleRhomb.addEventListener(
                "click",
                this.rhombClicked.bind(this),
                false
            );
        }

        if (this.eleAmmann) {
            this.eleAmmann.addEventListener(
                "click",
                this.ammannClicked.bind(this),
                false
            );
        }

        for (let button of this.radioButtons) {
            button.addEventListener(
                "click",
                this.rhombSizeClicked.bind(this),
                false
            );
        }

        this.reset();
        this.refresh();
    }
    reset() {
        // The default presentation is the Mosaic.
        this.pentaSelected = false;
        this.mosaicSelected = true;
        this.treeSelected = false;
        this.rhombSelected = false;
        this.ammannSelected = false;
        this.smallRhomb = false;

        const cookieJson = cookie.get(Overlays.name, this.toString());
        this.fromString(cookieJson);
    }
    /**
     * Mosaic is a presentation of the discrete geometry. There is no mosaic of
     * the real one, so the flag is inert -- and the checkbox disabled -- in real
     * mode.
     */
    get mosaicAvailable() {
        return this.currentMode !== "real";
    }

    /**
     * The sidebar's mode, or the measurements iframe's -- the iframe has its own
     * ShapeMode and its own Overlays, and globals is empty there.
     */
    get currentMode() {
        const sm = globals.shapeMode || measureTaskGlobals.shapeMode;
        return sm ? sm.shapeMode : null;
    }

    /**
     * Switching to real turns mosaic off, since there is no mosaic of the real
     * geometry, and turns pentas on so the switch does not land on a blank
     * screen.
     *
     * This fires on the mode *change*, not on every refresh. A guard that ran
     * every time would keep re-enabling pentas, so unchecking them could never
     * stick -- turning everything off has to remain something you are allowed to
     * ask for.
     *
     * Going back to discrete does not restore mosaic. Predictable beats clever;
     * the checkbox is right there, and `defaults` brings the Mosaic back.
     */
    syncToMode() {
        const mode = this.currentMode;
        if (mode === this.lastMode) return;
        this.lastMode = mode;
        if (mode === "real" && this.mosaicSelected) {
            this.mosaicSelected = false;
            if (!this.rhombSelected) this.pentaSelected = true;
        }
    }

    refresh() {
        this.syncToMode();

        if (this.eleMosaic) {
            this.eleMosaic.disabled = !this.mosaicAvailable;
        }

        if (this.elePenta) {
            this.elePenta.checked = this.pentaSelected;
        }
        if (this.eleMosaic) {
            this.eleMosaic.checked = this.mosaicSelected;
        }
        if (this.eleTree) {
            this.eleTree.checked = this.treeSelected;
        }

        if (this.eleRhomb) {
            this.eleRhomb.checked = this.rhombSelected;
        }

        if (this.eleAmmann) {
            this.eleAmmann.checked = this.ammannSelected;
        }

        if (
            this.eleRhombSizeField &&
            this.eleSmallRhomb &&
            this.eleLargeRhomb
        ) {
            if (this.rhombSelected || this.ammannSelected) {
                this.eleRhombSizeField.style.display = "block";
                if (this.smallRhomb) {
                    this.eleSmallRhomb.checked = true;
                } else {
                    this.eleLargeRhomb.checked = true;
                }
            } else {
                this.eleRhombSizeField.style.display = "none";
            }
        }

        cookie.set(Overlays.name, this.toString());
    }
    toString() {
        return JSON.stringify({
            pentaSelected: this.pentaSelected,
            mosaicSelected: this.mosaicSelected,
            treeSelected: this.treeSelected,
            rhombSelected: this.rhombSelected,
            ammannSelected: this.ammannSelected,
            smallRhomb: this.smallRhomb,
        });
    }

    fromString(jsonString) {
        ({
            pentaSelected: this.pentaSelected,
            mosaicSelected: this.mosaicSelected,
            treeSelected: this.treeSelected,
            rhombSelected: this.rhombSelected,
            ammannSelected: this.ammannSelected,
            smallRhomb: this.smallRhomb,
        } = JSON.parse(jsonString));
    }
    pentaClicked(event) {
        console.log(`penta clicked: ${event}`);
        this.pentaSelected = !this.pentaSelected;
        this.refresh();
        this.app(Overlays.name);
    }
    mosaicClicked() {
        this.mosaicSelected = !this.mosaicSelected;
        this.refresh();
        this.app(Overlays.name);
    }
    treeClicked() {
        this.treeSelected = !this.treeSelected;
        this.refresh();
        this.app(Overlays.name);
    }
    rhombClicked() {
        this.rhombSelected = !this.rhombSelected;
        this.refresh();
        this.app(Overlays.name);
    }
    ammannClicked() {
        this.ammannSelected = !this.ammannSelected;
        this.refresh();
        this.app(Overlays.name);
    }
    rhombSizeClicked() {
        for (let button of this.radioButtons) {
            if (button.checked) {
                this.smallRhomb = button.id == "small-rhomb";
            }
        }
        this.refresh();
        this.app(Overlays.name);
    }
}
