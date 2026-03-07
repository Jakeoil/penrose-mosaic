import { cookie } from "../controls.js";
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
 * Dual Layer
 *   #dual          dualRhombSelected: boolean
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
        this.eleDualRhomb = document.querySelector("#dual");
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

        if (this.eleDualRhomb) {
            this.eleDualRhomb.addEventListener(
                "click",
                this.dualRhombClicked.bind(this),
                false
            );
        }
        this.reset();
        this.refresh();
    }
    reset() {
        this.pentaSelected = true;
        this.mosaicSelected = false;
        this.treeSelected = false;
        this.rhombSelected = false;
        this.ammannSelected = false;
        this.smallRhomb = false;
        this.dualRhombSelected = false;

        const cookieJson = cookie.get(Overlays.name, this.toString());
        this.fromString(cookieJson);
    }
    refresh() {
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

        if (this.eleDualRhomb) {
            this.eleDualRhomb.checked = this.dualRhombSelected;
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
            dualRhombSelected: this.dualRhombSelected,
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
            dualRhombSelected: this.dualRhombSelected,
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
    dualRhombClicked() {
        this.dualRhombSelected = !this.dualRhombSelected;
        this.refresh();
        this.app(Overlays.name);
    }
}
