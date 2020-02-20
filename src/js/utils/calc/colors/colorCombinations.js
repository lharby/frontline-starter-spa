/**
 * Utilities for finding different types of color combinations (color schemes).
 *
 * @module utils/calc/colors/colorCombinations
 * @since 3.7.0
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

import { hslToRgb, rgbToHsl } from "./colorConversion";

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
 * Get an analogous color scheme. These colors are next to each other on the color wheel.
 *
 * @since 3.7.0
 * @param {RGBAObject} color - Your base color.
 * @param {number} [amount=3] - The amount of colors you want (including the one you put in).
 * @param {number} [steps=12] - The number of steps you want the color spectrum split into.
 * @returns {RGBAObject[]} An array of RGBA color objects.
 */
export function getAnalogousColorScheme(color, amount = 3, steps = 12) {
    const { hue, saturation, lightness, alpha } = rgbToHsl(color);
    const colors = [color];
    const step = 360 / steps;

    for (let i = 1; i <= amount - 1; i += 1) {
        colors[colors.length] = hslToRgb({
            hue: (hue + step * i) % 360,
            saturation,
            lightness,
            alpha
        });
    }

    return colors;
}

/**
 * @type {function}
 * @ignore
 * @deprecated
 */
export const analogous = getAnalogousColorScheme;

/**
 * Get a complementary color scheme. The two colors are opposite each other on the color wheel.
 *
 * @since 3.7.0
 * @param {RGBAObject} color - Your base color.
 * @returns {RGBAObject[]} An array of two RGBA color objects.
 */
export function getComplementaryColorScheme(color) {
    const { hue, saturation, lightness, alpha } = rgbToHsl(color);
    return [
        color,
        hslToRgb({
            hue: (hue + 180) % 360,
            saturation,
            lightness,
            alpha
        })
    ];
}

/**
 * @type {function}
 * @ignore
 * @deprecated
 */
export const complementary = getComplementaryColorScheme;

/**
 * Get a split complementary color scheme.
 *
 * @since 3.7.0
 * @param {RGBAObject} color - Your base color.
 * @returns {RGBAObject[]} An array of three RGBA color objects.
 */
export function getSplitComplementaryColorScheme(color) {
    const { hue, saturation, lightness, alpha } = rgbToHsl(color);
    return [
        color,
        hslToRgb({
            hue: (hue + 72) % 360,
            saturation,
            lightness,
            alpha
        }),
        hslToRgb({
            hue: (hue + 216) % 360,
            saturation,
            lightness,
            alpha
        })
    ];
}

/**
 * @type {function}
 * @ignore
 * @deprecated
 */
export const splitComplementary = getSplitComplementaryColorScheme;

/**
 * Get a triadic color scheme. The three colors are evenly spaced on the color wheel, 120 degrees apart from each other.
 *
 * @since 3.7.0
 * @param {RGBAObject} color - Your base color.
 * @returns {RGBAObject[]} An array of three RGBA color objects.
 */
export function getTriadicColorScheme(color) {
    const { hue, saturation, lightness, alpha } = rgbToHsl(color);
    return [
        color,
        hslToRgb({
            hue: (hue + 120) % 360,
            saturation,
            lightness,
            alpha
        }),
        hslToRgb({
            hue: (hue + 240) % 360,
            saturation,
            lightness,
            alpha
        })
    ];
}

/**
 * @type {function}
 * @ignore
 * @deprecated
 */
export const triadic = getTriadicColorScheme;

/**
 * Get a tetradic color scheme. The four colors are evenly spaced on the color wheel, 90 degrees apart from each other.
 *
 * @since 3.7.0
 * @param {RGBAObject} color - Your base color.
 * @returns {RGBAObject[]} An array of four RGBA color objects.
 */
export function getTetradicColorScheme(color) {
    const { hue, saturation, lightness, alpha } = rgbToHsl(color);
    return [
        color,
        hslToRgb({
            hue: (hue + 90) % 360,
            saturation,
            lightness,
            alpha
        }),
        hslToRgb({
            hue: (hue + 180) % 360,
            saturation,
            lightness,
            alpha
        }),
        hslToRgb({
            hue: (hue + 270) % 360,
            saturation,
            lightness,
            alpha
        })
    ];
}

/**
 * @type {function}
 * @ignore
 * @deprecated
 */
export const tetradic = getTetradicColorScheme;
