import { cookie } from "../controls.js";

/***
 *  Page Navigation defaults.
 */
export class PageNavigation {
    constructor(app) {
        this.app = app;
        this.navButtons = Array.from(document.querySelectorAll(".pageButton"));
        this.pages = Array.from(document.querySelectorAll(".page"));
        this.navButtons.forEach((button) =>
            button.addEventListener("click", this.pageClicked.bind(this), false)
        );

        this.checkWiring();
        this.reset();
        this.refresh();
    }

    reset() {
        this.activeButtonIndex = 1;
        this.fromString(cookie.get(PageNavigation.name, this.toString()));

        // The active page is remembered by button *position*, so adding or
        // removing a button shifts every index after it and a stale cookie can
        // point past the end. Left unchecked that throws in refresh().
        if (
            !Number.isInteger(this.activeButtonIndex) ||
            this.activeButtonIndex < 0 ||
            this.activeButtonIndex >= this.navButtons.length
        ) {
            console.log(
                `PageNavigation: stored index ${this.activeButtonIndex} is out of range, falling back to 0`
            );
            this.activeButtonIndex = 0;
        }
    }

    /**
     * A page is wired through three places that have to agree: the button's
     * data-id, the page div's id, and the id passed to its draw function in
     * math.js. Nothing enforces that, so report the two halves we can see.
     */
    checkWiring() {
        const pageIds = this.pages.map((page) => page.id);
        const buttonIds = this.navButtons.map((button) =>
            button.getAttribute("data-id")
        );

        for (const id of buttonIds) {
            if (!pageIds.includes(id)) {
                console.log(
                    `PageNavigation: button data-id "${id}" has no matching page div`
                );
            }
        }
        for (const id of pageIds) {
            if (!buttonIds.includes(id)) {
                console.log(
                    `PageNavigation: page "${id}" has no button, so it can never be shown`
                );
            }
        }
    }

    /**
     * Updates based on this.activeButtonIndex
     * @returns
     */
    refresh() {
        if (!this.navButtons.length) {
            console.log(`!! Nothing to refresh`);
            return;
        }

        // Refresh navButtons.
        const activeNavButton = this.navButtons[this.activeButtonIndex];

        for (const navButton of this.navButtons) {
            if (navButton === activeNavButton) {
                navButton.style.background = "white";
                navButton.style.color = "black";
            } else {
                navButton.style.background = "black";
                navButton.style.color = "white";
            }
        }

        // Only display the active page.
        this.pages.forEach((page) => (page.style.display = "none"));
        const activePageId = activeNavButton.getAttribute("data-id");
        this.activePage = document.querySelector(`#${activePageId}`);
        if (this.activePage) {
            this.activePage.style.display = "block";
        } else {
            console.log(
                `PageNavigation: no page div for "${activePageId}", nothing to show`
            );
        }

        cookie.set(PageNavigation.name, this.toString());
    }

    toString() {
        return JSON.stringify({
            activeButtonIndex: this.activeButtonIndex,
        });
    }

    fromString(jsonString) {
        ({ activeButtonIndex: this.activeButtonIndex } = JSON.parse(jsonString));
    }

    pageClicked(event) {
        const pageId = event.target.getAttribute("data-id");
        const pageIndex = this.navButtons.findIndex(
            (button) => button.getAttribute("data-id") == pageId
        );
        if (pageIndex >= 0) this.activeButtonIndex = pageIndex;
        else console.log(`No navButtons. Ignore`);

        this.refresh();
        this.app(PageNavigation.name);
    }
}
