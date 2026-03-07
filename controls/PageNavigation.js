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

        this.reset();
        this.refresh();
    }

    reset() {
        this.activeButtonIndex = 1;
        this.fromString(cookie.get(PageNavigation.name, this.toString()));
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
        this.activePage.style.display = "block";

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
