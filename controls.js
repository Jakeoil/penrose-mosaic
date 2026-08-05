import { ShapeColors } from "./controls/ShapeColors.js";
import { Overlays } from "./controls/Overlays.js";
import { PageNavigation } from "./controls/PageNavigation.js";
import { RhombStyle } from "./controls/RhombStyle.js";
import { ShapeMode } from "./controls/ShapeMode.js";
import { Figure } from "./controls/Figure.js";
import { PentaStyle } from "./controls/PentaStyle.js";
import { BUILD_ID } from "./build-id.js";

/**
 * Controls are
 */
/********************************
 * Convenience routines
 ********************************/
export function logRefresh(app, source) {
    switch (source) {
        case Overlays.name:
            console.log(
                `Refresh ${app.name} from ${Overlays.name}: ${globals.overlays}`
            );
            break;
        case RhombStyle.name:
            console.log(
                `Refresh ${app.name} from ${RhombStyle.name}: ${globals.rhombStyle}`
            );
            break;
        case PentaStyle.name:
            console.log(
                `Refresh ${app.name} from ${PentaStyle.name}: ${globals.pentaStyle}`
            );
            break;
        case ShapeColors.name:
            console.log(
                `Refresh ${app.name} from ${ShapeColors.name}: ${globals.shapeColors}`
            );
            break;
        case PageNavigation.name:
            console.log(
                `Refresh ${app.name} from ${PageNavigation.name}: ${globals.pageNavigation}`
            );
            break;
        case Figure.name:
            console.log(
                `Refresh ${app.name} from ${Figure.name}: ${globals.controls}`
            );
            break;
        case ShapeMode.name:
            console.log(
                `Refresh ${app.name} from ${ShapeMode.name}: ${globals.shapeMode}`
            );
            break;
        default:
            const val = source.constructor.name;
            switch (val) {
                case Event.name:
                    console.log(
                        `Refresh ${app.name} from ${Event.name}: ${source.type}`
                    );
                    break;
                default:
                    console.log(
                        `Refresh ${app.name} from unsupported ${val} ${source}`
                    );
            }
    }
}

export const measureTask = {};
export const measureTaskGlobals = {};
export const globals = {};

export function initControls(app) {
    if (app.name == "penroseApp") {
        if (!globals.shapeColors) globals.shapeColors = new ShapeColors(app);

        if (!globals.controls) globals.controls = new Figure(app, 0, 0, false);

        if (!globals.shapeMode) globals.shapeMode = new ShapeMode(app);

        if (!globals.overlays) globals.overlays = new Overlays(app);
        if (!globals.rhombStyle) globals.rhombStyle = new RhombStyle(app);
        if (!globals.pentaStyle) globals.pentaStyle = new PentaStyle(app);

        if (!globals.pageNavigation)
            globals.pageNavigation = new PageNavigation(app);

        if (!globals.defaultsWired) globals.defaultsWired = wireDefaults();
    } else if (app.name == "measureTasks") {
        if (!measureTaskGlobals.shapeMode)
            measureTaskGlobals.shapeMode = new ShapeMode(app);
        if (!measureTaskGlobals.overlays)
            measureTaskGlobals.overlays = new Overlays(app);
        if (!measureTaskGlobals.rhombStyle)
            measureTaskGlobals.rhombStyle = new RhombStyle(app);
    } else {
        console.log("missing app");
    }
}
/**
 * Drops every cookie and reloads, so the controls come back on their defaults.
 *
 * Sweeps whatever is actually in document.cookie rather than a list of control
 * names -- a list would silently miss any control added later.
 *
 * A reload rather than a refresh: initControls only constructs a control when
 * its global is missing, and each constructor reads its cookie once. Without a
 * reload the live controls would keep their values and write them straight back.
 */
function wireDefaults() {
    const eleDefaults = document.querySelector("#defaults");
    if (!eleDefaults) {
        console.log("wireDefaults: no #defaults element, button not wired");
        return false;
    }

    // The build stamp rides on this button so a stale script is visible at a
    // glance. If the number on screen is not the one node tools/stamp.mjs last
    // printed, the browser is serving an old module -- hard reload, don't debug.
    eleDefaults.innerHTML = `defaults <span class="build-id">${BUILD_ID}</span>`;
    console.log(`penrose-mosaic build ${BUILD_ID}`);
    eleDefaults.addEventListener(
        "click",
        () => {
            const cleared = cookie.clearAll();
            console.log(
                `defaults: cleared [${cleared}], remaining "${document.cookie}"`
            );
            location.reload();
        },
        false
    );
    return true;
}

/**
 * How long control settings survive, in seconds.
 *
 * This was one hour, which expired under a page left open while working: the
 * controls would silently fall back to their defaults mid-session. Long enough
 * now that it cannot expire under you, but still self-cleaning. The defaults
 * button is the way back to a known state, not expiry.
 */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * The cookie has strong ties to the controls.
 * It stores some of the control settings statically.
 * Move it to a new module, but not before coming up with a
 * consistant interface, for example, a this.cookie method.
 * or a cookie interface.
 *
 * Suggestion. Make a convention that the cookie name has to match the html
 * element id. But that the value encode and decode must be in the control's
 * class
 *
 */
class Cookie {
    constructor() {}

    get(type, dflt) {
        const cookie = getCookie(type);
        if (cookie) {
            return cookie;
        }
        return dflt;
    }
    set(type, value) {
        setCookie(type, value, { "max-age": COOKIE_MAX_AGE });
    }

    delete(type) {
        deleteCookie(type);
    }

    /**
     * Deletes every cookie currently set. Returns the names it removed.
     */
    clearAll() {
        const names = document.cookie
            .split(";")
            .map((pair) => pair.split("=")[0].trim())
            .filter((name) => name.length)
            .map(decodeURIComponent);
        names.forEach(deleteCookie);
        return names;
    }
}
// The cookie interface !!! We already found this to be dangerous.
export const cookie = new Cookie();

/**
 * cookie logic from  https://javascript.info/cookie
 * @param {*} name
 * @returns
 */
// returns the cookie with the given name,
// or undefined if not found
function getCookie(name) {
    let matches = document.cookie.match(
        new RegExp(
            "(?:^|; )" +
                name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") +
                "=([^;]*)"
        )
    );
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

// Callers pass {"max-age": seconds}. See COOKIE_MAX_AGE.
function setCookie(name, value, options = {}) {
    options = {
        path: "/",
        SameSite: "strict",
        // add other defaults here if necessary
        ...options,
    };

    if (options.expires instanceof Date) {
        options.expires = options.expires.toUTCString();
    }

    let updatedCookie =
        encodeURIComponent(name) + "=" + encodeURIComponent(value);

    for (let optionKey in options) {
        updatedCookie += "; " + optionKey;
        let optionValue = options[optionKey];
        if (optionValue !== true) {
            updatedCookie += "=" + optionValue;
        }
    }

    document.cookie = updatedCookie;
}
function deleteCookie(name) {
    setCookie(name, "", {
        "max-age": -1,
    });
}
