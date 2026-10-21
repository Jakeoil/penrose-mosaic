/**
 * Color helpers. No imports, on purpose.
 *
 * These lived in penrose-screen.js, which reaches globals through controls.js.
 * The renderers are the only callers, and an SvgRenderer that imported them from
 * there would have pulled the whole scene module -- and the DOM with it -- into a
 * module that has no business touching either. penrose-screen.js re-exports
 * `lerp` so existing importers are unaffected.
 *
 * Thanks to:
 * https://css-tricks.com/converting-color-spaces-in-javascript/
 *
 * Converts #rgb and #rrggbb formats
 *
 * Move to utilities
 */
function hexToRGB(h) {
    let r = 0,
        g = 0,
        b = 0;

    // 3 digits
    if (h.length == 4) {
        r = "0x" + h[1] + h[1];
        g = "0x" + h[2] + h[2];
        b = "0x" + h[3] + h[3];

        // 6 digits
    } else if (h.length == 7) {
        r = "0x" + h[1] + h[2];
        g = "0x" + h[3] + h[4];
        b = "0x" + h[5] + h[6];
    }

    return [r, g, b];
}

/**
 * Linear interpolate two colors
 *
 * @param {*} start
 * @param {*} end
 * @param {*} alpha  Value from 0 to 1
 * @returns ccs command string
 *
 * todo!!! implement opacity. It is a fraction from 0 (transparent) to 1.
 */
export function lerp(start, end, alpha, opacity) {
    if (alpha < 0) alpha = 0;
    if (alpha > 1) alpha = 1;
    const rgbStart = hexToRGB(start);
    const rgbEnd = hexToRGB(end);
    const [r, g, b] = rgbStart.map(
        (item, index) => item * (1 - alpha) + rgbEnd[index] * alpha,
    );
    const command = `rgb(${r},${g},${b})`;
    return command;
}

function testLerp() {
    lerp("#000", "#ff6600", 0);
    lerp("#000", "#ff6600", 0.1);
    lerp("#000", "#ff6600", 0.25);
    lerp("#000", "#ff6600", 0.5);
    lerp("#000", "#ff6600", 0.75);
    lerp("#000", "#ff6600", 1.0);
}

//testLerp();
