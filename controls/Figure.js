import { cookie } from "../controls.js";
import { penrose } from "../penrose.js";
import { norm } from "../point.js";

/**
 * A clustered set of globals
 * Cannot say whether it was a good idea to cluster them
 * Added cookie handling
 */1
export class Figure {
    constructor(app, fifths, typeIndex, isDown) {
        this.app = app;
        this.eleFifths = document.querySelector("#fifths");
        this.eleType = document.querySelector("#type");
        this.eleIsDown = document.querySelector("#isDown");
        this.eleIsHeads = document.querySelector("#isHeads");

        if (this.eleFifths)
            this.eleFifths.addEventListener(
                "click",
                this.clickFifths.bind(this),
                false
            );

        if (this.eleType)
            this.eleType.addEventListener(
                "click",
                this.clickType.bind(this),
                false
            );

        if (this.eleIsDown)
            this.eleIsDown.addEventListener(
                "click",
                this.clickIsDown.bind(this),
                false
            );

        if (this.eleIsHeads)
            this.eleIsHeads.addEventListener(
                "click",
                this.clickIsHeads.bind(this),
                false
            );

        this.reset(fifths, typeIndex, isDown);
        this.refresh();
    }
    reset(fifths, typeIndex, isDown) {
        this.fifths = fifths;
        this.typeIndex = typeIndex;
        this.isDown = isDown;
        this.isHeads = true;
        const cookieJson = cookie.get(Figure.name, this.toString());
        this.fromString(cookieJson);
    }
    toString() {
        return JSON.stringify({
            fifths: this.fifths,
            typeIndex: this.typeIndex,
            isDown: this.isDown,
            isHeads: this.isHeads,
        });
    }
    fromString(jsonString) {
        const parsed = JSON.parse(jsonString);
        this.fifths = parsed.fifths;
        this.typeIndex = parsed.typeIndex;
        this.isDown = parsed.isDown;
        if (parsed.isHeads !== undefined) this.isHeads = parsed.isHeads;
    }
    bumpFifths() {
        this.fifths = norm(this.fifths + 1);
    }

    get typeName() {
        return this.typeList[this.typeIndex].name;
    }
    bumpType() {
        this.typeIndex = (this.typeIndex + 1) % this.typeList.length;
    }
    get direction() {
        return this.isDown ? "Down" : "Up";
    }
    toggleDirection() {
        this.isDown = !this.isDown;
    }
    get headsTails() {
        return this.isHeads ? "Heads" : "Tails";
    }
    toggleHeads() {
        this.isHeads = !this.isHeads;
    }

    // eww, should add the decagon?
    typeList = [
        penrose.Pe1,
        penrose.Pe3,
        penrose.Pe5,
        penrose.St1,
        penrose.St3,
        penrose.St5,
        penrose.Deca,
        penrose.Sun,
        penrose.Star,
    ];
    //refresh() {}
    refresh() {
        if (this.eleFifths) this.eleFifths.innerHTML = `fifths: ${this.fifths}`;
        if (this.eleType) this.eleType.innerHTML = this.typeName;
        if (this.eleIsDown) this.eleIsDown.innerHTML = this.direction;
        if (this.eleIsHeads) this.eleIsHeads.innerHTML = this.headsTails;
        cookie.set(Figure.name, this.toString());
    }

    /**
     * Initialization and
     * Events for the three buttons
     */
    clickFifths() {
        console.log(`click fifths`);
        this.bumpFifths();
        this.refresh();
        this.app(Figure.name);
    }

    clickType() {
        console.log(`click type`);
        this.bumpType();
        this.refresh();
        this.app(Figure.name);
    }

    clickIsDown() {
        this.toggleDirection();
        this.refresh();
        this.app(Figure.name);
    }

    clickIsHeads() {
        this.toggleHeads();
        this.refresh();
        this.app(Figure.name);
    }
}
