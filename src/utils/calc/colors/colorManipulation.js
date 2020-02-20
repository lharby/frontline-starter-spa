/**
 * Manipulate colors with these utilities.
 *
 * @module utils/calc/colors/colorManipulation
 * @since 3.8.0
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

import { parseColor } from "./colorConversion";
import { getMean } from "../average";

/**
 * An object containing the values for red, green, blue and alpha.
 *
 * @typedef {Object} RGBAObject
 * @property {number} red - The red color value (0-255)
 * @property {number} green - The green color value (0-255)
 * @property {number} blue - The blue color value (0-255)
 * @property {number} [alpha=1] - The alpha value (0-1)
 */

/**
 * Mix two colors together.
 *
 * This works pretty much like the `mix()` function in SASS.
 *
 * @since 3.8.0
 * @param {string|Object} color1 - The first color.
 * @param {string|Object} color2 - The second color.
 * @param {number} [weight=.5] - The relative weight of each color as a decimal. Closer to `1` gives more weight to `color1`, closer to `0` gives more weight to `color2`.
 * @returns {RGBAObject} The two colors mixed together.
 *
 * @example
 * import { mixColors } from "./utils/calc/colors/colorManipulation";
 * import { rgbToHex } from "./utils/calc/colors/colorConversion";
 *
 * const color = mixColors("#FFFFFF", "#F3F9FA", .91);
 *
 * // This will output "#fefeff"
 * window.console.log(rgbToHex(color));
 */
export function mixColors(color1, color2, weight = 0.5) {
    const c1 = parseColor(color1);
    const c2 = parseColor(color2);

    const red1 = c1.red / 255;
    const red2 = c2.red / 255;
    const green1 = c1.green / 255;
    const green2 = c2.green / 255;
    const blue1 = c1.blue / 255;
    const blue2 = c2.blue / 255;

    // If weight is more than 1, let's assume it's defined as percentages instead of decimals and convert it to decimals
    const mixWeight = weight > 1 ? Math.min(weight, 100) / 100 : weight;

    return {
        red: Math.round((red2 + (red1 - red2) * mixWeight) * 255),
        green: Math.round((green2 + (green1 - green2) * mixWeight) * 255),
        blue: Math.round((blue2 + (blue1 - blue2) * mixWeight) * 255),
        alpha:
            Math.round((c2.alpha + (c1.alpha - c2.alpha) * mixWeight) * 1000) /
            1000
    };
}

/**
 * Blend two colors together with the multiply mode.
 *
 * Result will be darker, since we're working with an additive color model (RGB).
 * This function is the opposite of `screenColors()`.
 *
 * @since 3.8.0
 * @see https://en.wikipedia.org/wiki/Blend_modes
 * @param {string|Object} color1 - The first color.
 * @param {string|Object} color2 - The second color.
 * @returns {RGBAObject} The two colors blended together.
 *
 * @example
 * import { multiplyColors } from "./utils/calc/colors/colorManipulation";
 * import { rgbToHex } from "./utils/calc/colors/colorConversion";
 *
 * const color = multiplyColors("#FF1100", "#88FF00");
 *
 * // This will output "#881100"
 * window.console.log(rgbToHex(color));
 */
export function multiplyColors(color1, color2) {
    const c1 = parseColor(color1);
    const c2 = parseColor(color2);

    return {
        red: Math.round((c1.red * c2.red) / 255),
        green: Math.round((c1.green * c2.green) / 255),
        blue: Math.round((c1.blue * c2.blue) / 255),
        alpha: Math.min(getMean([c1.alpha, c2.alpha]), 1)
    };
}

/**
 * Blend two colors together with the screen mode.
 *
 * Result will be lighter, since we're working with an additive color model (RGB).
 * This function is the opposite of `multiplyColors()`.
 *
 * @since 3.8.0
 * @see https://en.wikipedia.org/wiki/Blend_modes
 * @param {string|Object} color1 - The first color.
 * @param {string|Object} color2 - The second color.
 * @returns {RGBAObject} The two colors blended together.
 *
 * @example
 * import { screenColors } from "./utils/calc/colors/colorManipulation";
 * import { rgbToHex } from "./utils/calc/colors/colorConversion";
 *
 * const color = screenColors("#FF0000", "#00FF00");
 *
 * // This will output "#ffff00"
 * window.console.log(rgbToHex(color));
 */
export function screenColors(color1, color2) {
    const c1 = parseColor(color1);
    const c2 = parseColor(color2);

    return {
        red: Math.round(1 - (1 - c1.red) * (1 - c2.red)),
        green: Math.round(1 - (1 - c1.green) * (1 - c2.green)),
        blue: Math.round(1 - (1 - c1.blue) * (1 - c2.blue)),
        alpha: Math.min(getMean([c1.alpha, c2.alpha]), 1)
    };
}
