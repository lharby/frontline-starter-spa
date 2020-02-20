/**
 * Find the nearest or farthest matching colors.
 *
 * Create a set of available or accepted colors, and in this set find the closest or farthest match to any other color.
 *
 * **Nerd alert:** Colors are converted to the [CIELAB color space](https://en.wikipedia.org/wiki/CIELAB_color_space)
 * (Lab), which is designed to be "perceptually uniform" with respect to human vision, meaning that the same amount of
 * numerical change in these values corresponds to about the same amount of visually perceived change. Colors are then
 * matched using the [Euclidean distance](https://en.wikipedia.org/wiki/Euclidean_distance) formula.
 *
 * @module utils/calc/colors/ColorMatch
 * @since 3.7.0
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 *
 *
 * @example <caption>Basic usage:</caption>
 * import { ColorMatch } from "./utils/calc/colors/colorMatch";
 *
 * const colors = new ColorMatch([
 *     "#FF0000",
 *     "#FFFF00",
 *     "#FF00FF",
 *     "#00FFFF",
 *     "#00FF00",
 * ]);
 *
 * // This will return ["#FF0000"], since that's the nearest color in the set.
 * colors.near("#FF1111");
 *
 * // Add a new color to the set.
 * colors.add("#FF1100");
 *
 * // Now, the same execution as before will return ["#FF1100"].
 * colors.near("#FF1111");
 *
 * // Let's find the two colors least matching #FF1111.
 * // That'll be ["#00FF00", "#00FFFF"].
 * colors.far("#FF1111", 2);
 *
 * // We can also remove all the colors and add new ones to it.
 * colors.flush().add(["#FF0", "#F00"]);
 *
 * // If we have no further use for this, we can clean up.
 * colors.destroy();
 */

import { parseColor, rgbToLab } from "./colorConversion";
import { degreesToRadians, radiansToDegrees } from "../radians";
import { forEach } from "../../forEach";

/**
 * An object containing the values for a CIELAB color type + alpha.
 *
 * Take a look at these, if you're interested: [CIELAB Color Space](https://en.wikipedia.org/wiki/CIELAB_color_space)
 * and [color difference](https://en.wikipedia.org/wiki/Color_difference).
 *
 * @typedef {Object} CIELABAObject
 * @property {number} l - The lightness value (0 to 1)
 * @property {number} a - The green–red value (-128 to 128)
 * @property {number} b - The blue–yellow value (-128 to 128)
 * @property {number} [alpha=1] - The alpha value (0-1)
 */

/**
 * Make sure a color is in the Lab format.
 *
 * @ignore
 * @param {string|RGBAObject|CIELABAObject} color
 * @returns {CIELABAObject}
 */
function parseColorToLab(color) {
    if (typeof color === "object") {
        if ("l" in color && "a" in color && "b" in color) {
            color.alpha = isNaN(color.alpha) ? 1 : color.alpha;
            return color;
        } else if ("red" in color && "green" in color && "blue" in color) {
            return rgbToLab(color);
        }
    } else {
        const rgba = parseColor(color);
        return rgbToLab(rgba);
    }

    throw "Unrecognized color type.";
}

export class ColorMatch {
    /**
     * Create a set of colors to search for the closest match in.
     *
     * @param {Array} [colors=[]] - An array of colors in which to find the closest match.
     */
    constructor(colors = []) {
        this.haystack = [];

        if (colors.length) {
            this.add(colors);
        }
    }

    /**
     * Remove all colors.
     *
     * @returns {ColorMatch} The color match object, for function chaining.
     */
    flush() {
        this.haystack = [];
        return this;
    }

    /**
     * Add more colors to search through.
     *
     * @param {Array|Object|string} colors - One or more colors to add to the set of colors to search in.
     * @returns {ColorMatch} The color match object, for function chaining.
     */
    add(colors) {
        const colorsArray = Array.isArray(colors) ? colors : [colors];

        forEach(colorsArray, color => {
            const parsedColor = parseColorToLab(color);
            parsedColor.source = color;
            this.haystack[this.haystack.length] = parsedColor;
        });

        return this;
    }

    /**
     * Find the nearest/farthest matching colors to this.
     *
     * Formula taken from <https://github.com/zschuessler/DeltaE/blob/master/src/dE00.js> and modified.
     *
     * @private
     * @param {Object|string} color - The color to match the other colors with.
     * @param {number} [amount=1] - The number of colors to return.
     * @param {boolean} [sortFarthestToNearest=false] - Set to `true` to get the colors farthest away instead of the nearest.
     * @returns {Array} The nearest or farthest colors as they were added to the set.
     */
    match(color, amount = 1, sortFarthestToNearest = false) {
        if (this.haystack) {
            const needle = parseColorToLab(color);
            const iterations = Math.min(amount, this.haystack.length);
            const results = new Array(iterations);

            const lightnessWeight = 0.01;

            const pow257 = Math.pow(25, 7);
            const needleBPow2 = Math.pow(needle.b, 2);
            const needleChroma = Math.sqrt(Math.pow(needle.a, 2) + needleBPow2);

            forEach(this.haystack, straw => {
                const deltaLightnessPrime = needle.l - straw.l;
                const lightnessBar = (straw.l + needle.l) / 2;
                const strawBPow2 = Math.pow(straw.b, 2);

                const strawChroma = Math.sqrt(
                    Math.pow(straw.a, 2) + strawBPow2
                );
                const chromaBar = (strawChroma + needleChroma) / 2;

                const primeA =
                    1 -
                    Math.sqrt(
                        Math.pow(chromaBar, 7) /
                            (Math.pow(chromaBar, 7) + pow257)
                    );
                const strawPrimeA = straw.a + (straw.a / 2) * primeA;
                const needlePrimeA = needle.a + (needle.a / 2) * primeA;
                const strawChromaPrime = Math.sqrt(
                    Math.pow(strawPrimeA, 2) + strawBPow2
                );
                const needleChromaPrime = Math.sqrt(
                    Math.pow(needlePrimeA, 2) + needleBPow2
                );
                const chromaBarPrime =
                    (strawChromaPrime + needleChromaPrime) / 2;
                const deltaChromaPrime = needleChromaPrime - strawChromaPrime;
                const SsubL =
                    1 +
                    (0.015 * Math.pow(lightnessBar - 50, 2)) /
                        Math.sqrt(20 + Math.pow(lightnessBar - 50, 2));
                const SsubC = 1 + 0.045 * chromaBarPrime;

                let strawPrimeHue =
                    straw.b === 0 || strawPrimeA === 0
                        ? 0
                        : radiansToDegrees(Math.atan2(straw.b, strawPrimeA));
                strawPrimeHue += strawPrimeHue >= 0 ? 0 : 360;
                let needlePrimeHue =
                    straw.b === 0 || strawPrimeA === 0
                        ? 0
                        : radiansToDegrees(Math.atan2(needle.b, needlePrimeA));
                needlePrimeHue += needlePrimeHue >= 0 ? 0 : 360;

                const deltahPrime =
                    strawChroma === 0 || needleChroma === 0
                        ? 0
                        : Math.abs(strawPrimeHue - needlePrimeHue) <= 180
                        ? needlePrimeHue - strawPrimeHue
                        : needlePrimeHue <= strawPrimeHue
                        ? needlePrimeHue - strawPrimeHue + 360
                        : needlePrimeHue - strawPrimeHue - 360;
                const deltaHPrime =
                    2 *
                    Math.sqrt(strawChromaPrime * needleChromaPrime) *
                    Math.sin(degreesToRadians(deltahPrime) / 2);
                const HBarPrime =
                    Math.abs(strawPrimeHue - needlePrimeHue) > 180
                        ? (strawPrimeHue + needlePrimeHue + 360) / 2
                        : (strawPrimeHue + needlePrimeHue) / 2;
                const T =
                    1 -
                    0.17 * Math.cos(degreesToRadians(HBarPrime - 30)) +
                    0.24 * Math.cos(degreesToRadians(2 * HBarPrime)) +
                    0.32 * Math.cos(degreesToRadians(3 * HBarPrime + 6)) -
                    0.2 * Math.cos(degreesToRadians(4 * HBarPrime - 63));
                const SsubH = 1 + 0.015 * chromaBarPrime * T;
                const RsubT =
                    -2 *
                    Math.sqrt(
                        Math.pow(chromaBarPrime, 7) /
                            (Math.pow(chromaBarPrime, 7) + Math.pow(25, 7))
                    ) *
                    Math.sin(
                        degreesToRadians(
                            60 * Math.exp(-Math.pow((HBarPrime - 275) / 25, 2))
                        )
                    );

                const lightness =
                    deltaLightnessPrime / (lightnessWeight * SsubL);
                const chroma = deltaChromaPrime / SsubC;
                const hue = deltaHPrime / SsubH;

                const distance = Math.sqrt(
                    Math.pow(lightness, 2) +
                        Math.pow(chroma, 2) +
                        Math.pow(hue, 2) +
                        RsubT * chroma * hue
                );

                for (let i = 0; i < iterations; i += 1) {
                    if (!results[i]) {
                        results[i] = {
                            distance,
                            straw
                        };
                        break;
                    } else if (
                        sortFarthestToNearest
                            ? distance > results[i].distance
                            : distance < results[i].distance
                    ) {
                        results.splice(i, 0, {
                            distance,
                            straw
                        });
                        results.pop();
                        break;
                    }
                }
            });

            return results.map(result => result.straw.source);
        }
    }

    /**
     * Find the closest matching colors to this.
     *
     * @param {Object|string} color - The color to match the other colors with.
     * @param {number} [amount=1] - The number of colors to return.
     * @returns {Array} The nearest colors as they were added to the set.
     */
    near(color, amount = 1) {
        return this.match(color, amount);
    }

    /**
     * Find the least matching colors to this.
     *
     * @param {Object|string} color - The color to match the other colors with.
     * @param {number} [amount=1] - The number of colors to return.
     * @returns {Array} The farthest colors as they were added to the set.
     */
    far(color, amount = 1) {
        return this.match(color, amount, true);
    }

    /**
     * Destroy utility and clean up by deleting the set of colors.
     */
    destroy() {
        delete this.haystack;
    }
}
