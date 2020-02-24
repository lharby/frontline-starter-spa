/**
 * Utilities for converting between different types of color values.
 *
 * @module utils/calc/colors/colorConversion
 * @since 3.7.0
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

import { getPart } from "../percentage";

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
 * An object containing the values for hue, saturation, lightness and alpha.
 *
 * @typedef {Object} HSLAObject
 * @property {number} hue - The hue value (0-360)
 * @property {number} saturation - The saturation value (0-1)
 * @property {number} lightness - The lightness value (0-1)
 * @property {number} [alpha=1] - The alpha value (0-1)
 */

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
 * An object with W3S' list of color names supported by all browsers
 *
 * @since 3.7.0
 * @see https://www.w3schools.com/colors/colors_names.asp
 * @type {Object}
 */
export const colorNames = {
    aliceblue: "#F0F8FF",
    antiquewhite: "#FAEBD7",
    aqua: "#00FFFF",
    aquamarine: "#7FFFD4",
    azure: "#F0FFFF",
    beige: "#F5F5DC",
    bisque: "#FFE4C4",
    black: "#000000",
    blanchedalmond: "#FFEBCD",
    blue: "#0000FF",
    blueviolet: "#8A2BE2",
    brown: "#A52A2A",
    burlywood: "#DEB887",
    cadetblue: "#5F9EA0",
    chartreuse: "#7FFF00",
    chocolate: "#D2691E",
    coral: "#FF7F50",
    cornflowerblue: "#6495ED",
    cornsilk: "#FFF8DC",
    crimson: "#DC143C",
    cyan: "#00FFFF",
    darkblue: "#00008B",
    darkcyan: "#008B8B",
    darkgoldenrod: "#B8860B",
    darkgray: "#A9A9A9",
    darkgrey: "#A9A9A9",
    darkgreen: "#006400",
    darkkhaki: "#BDB76B",
    darkmagenta: "#8B008B",
    darkolivegreen: "#556B2F",
    darkorange: "#FF8C00",
    darkorchid: "#9932CC",
    darkred: "#8B0000",
    darksalmon: "#E9967A",
    darkseagreen: "#8FBC8F",
    darkslateblue: "#483D8B",
    darkslategray: "#2F4F4F",
    darkslategrey: "#2F4F4F",
    darkturquoise: "#00CED1",
    darkviolet: "#9400D3",
    deeppink: "#FF1493",
    deepskyblue: "#00BFFF",
    dimgray: "#696969",
    dimgrey: "#696969",
    dodgerblue: "#1E90FF",
    firebrick: "#B22222",
    floralwhite: "#FFFAF0",
    forestgreen: "#228B22",
    fuchsia: "#FF00FF",
    gainsboro: "#DCDCDC",
    ghostwhite: "#F8F8FF",
    gold: "#FFD700",
    goldenrod: "#DAA520",
    gray: "#808080",
    grey: "#808080",
    green: "#008000",
    greenyellow: "#ADFF2F",
    honeydew: "#F0FFF0",
    hotpink: "#FF69B4",
    indianred: "#CD5C5C",
    indigo: "#4B0082",
    ivory: "#FFFFF0",
    khaki: "#F0E68C",
    lavender: "#E6E6FA",
    lavenderblush: "#FFF0F5",
    lawngreen: "#7CFC00",
    lemonchiffon: "#FFFACD",
    lightblue: "#ADD8E6",
    lightcoral: "#F08080",
    lightcyan: "#E0FFFF",
    lightgoldenrodyellow: "#FAFAD2",
    lightgray: "#D3D3D3",
    lightgrey: "#D3D3D3",
    lightgreen: "#90EE90",
    lightpink: "#FFB6C1",
    lightsalmon: "#FFA07A",
    lightseagreen: "#20B2AA",
    lightskyblue: "#87CEFA",
    lightslategray: "#778899",
    lightslategrey: "#778899",
    lightsteelblue: "#B0C4DE",
    lightyellow: "#FFFFE0",
    lime: "#00FF00",
    limegreen: "#32CD32",
    linen: "#FAF0E6",
    magenta: "#FF00FF",
    maroon: "#800000",
    mediumaquamarine: "#66CDAA",
    mediumblue: "#0000CD",
    mediumorchid: "#BA55D3",
    mediumpurple: "#9370DB",
    mediumseagreen: "#3CB371",
    mediumslateblue: "#7B68EE",
    mediumspringgreen: "#00FA9A",
    mediumturquoise: "#48D1CC",
    mediumvioletred: "#C71585",
    midnightblue: "#191970",
    mintcream: "#F5FFFA",
    mistyrose: "#FFE4E1",
    moccasin: "#FFE4B5",
    navajowhite: "#FFDEAD",
    navy: "#000080",
    oldlace: "#FDF5E6",
    olive: "#808000",
    olivedrab: "#6B8E23",
    orange: "#FFA500",
    orangered: "#FF4500",
    orchid: "#DA70D6",
    palegoldenrod: "#EEE8AA",
    palegreen: "#98FB98",
    paleturquoise: "#AFEEEE",
    palevioletred: "#DB7093",
    papayawhip: "#FFEFD5",
    peachpuff: "#FFDAB9",
    peru: "#CD853F",
    pink: "#FFC0CB",
    plum: "#DDA0DD",
    powderblue: "#B0E0E6",
    purple: "#800080",
    rebeccapurple: "#663399",
    red: "#FF0000",
    rosybrown: "#BC8F8F",
    royalblue: "#4169E1",
    saddlebrown: "#8B4513",
    salmon: "#FA8072",
    sandybrown: "#F4A460",
    seagreen: "#2E8B57",
    seashell: "#FFF5EE",
    sienna: "#A0522D",
    silver: "#C0C0C0",
    skyblue: "#87CEEB",
    slateblue: "#6A5ACD",
    slategray: "#708090",
    slategrey: "#708090",
    snow: "#FFFAFA",
    springgreen: "#00FF7F",
    steelblue: "#4682B4",
    tan: "#D2B48C",
    teal: "#008080",
    thistle: "#D8BFD8",
    tomato: "#FF6347",
    turquoise: "#40E0D0",
    violet: "#EE82EE",
    wheat: "#F5DEB3",
    white: "#FFFFFF",
    whitesmoke: "#F5F5F5",
    yellow: "#FFFF00",
    yellowgreen: "#9ACD32"
};

/**
 * Parse a string (like `#fff`, `#f0dd6a`, `violet`, `rgb(255, 100, 50)` or `rgba(255,255,255,.5)`) to an object
 * containing red, green, blue and alpha.
 *
 * @since 3.7.0
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 * @param {string|Object} input - The color that should be parsed to an rgba object.
 * @returns {RGBAObject} An object containing the values for red, green, blue and alpha.
 */
export function parseColor(input) {
    let returnObject = {
        red: 0,
        green: 0,
        blue: 0,
        alpha: 1
    };

    if (Array.isArray(input)) {
        returnObject.red = input[0] || 0;
        returnObject.green = input[1] || 0;
        returnObject.blue = input[2] || 0;
        returnObject.alpha = isNaN(input[3]) ? 1 : input[3];
    } else if (typeof input === "object") {
        if ("lightness" in input) {
            returnObject = hslToRgb(input);
        } else {
            returnObject.red = input.red || input.r || 0;
            returnObject.green = input.green || input.g || 0;
            returnObject.blue = input.blue || input.b || 0;
            returnObject.alpha = isNaN(input.alpha)
                ? isNaN(input.a)
                    ? 1
                    : input.a
                : input.alpha;
        }
    } else if (typeof input === "string") {
        let stringInput = input.toLowerCase();

        if (typeof colorNames[stringInput] !== "undefined") {
            stringInput = colorNames[stringInput];
        }

        const hexMatch = stringInput.match(
            /^#((([0-9a-f]{3}){1,2})|(([0-9a-f]{4}){1,2}))$/i
        );
        const rgbMatch = stringInput.match(
            /^rgb[a]?\(\s*(\d{1,3}%?),\s*(\d{1,3}%?),\s*(\d{1,3}%?)\s*(?:,\s*(0?\.\d+|0|1?))?\s*\)/i
        );

        if (hexMatch && hexMatch.length > 1) {
            const match = hexMatch[1];

            if (match.length === 3 || match.length === 4) {
                const rgb = [
                    match.charAt(0),
                    match.charAt(1),
                    match.charAt(2),
                    match.charAt(3) || "F"
                ];
                returnObject.red = parseInt(rgb[0] + rgb[0], 16);
                returnObject.green = parseInt(rgb[1] + rgb[1], 16);
                returnObject.blue = parseInt(rgb[2] + rgb[2], 16);
                returnObject.alpha = parseInt(rgb[3] + rgb[3], 16) / 255;
            } else {
                const rgb = [
                    match.charAt(0) + match.charAt(1),
                    match.charAt(2) + match.charAt(3),
                    match.charAt(4) + match.charAt(5),
                    match.charAt(7) ? match.charAt(6) + match.charAt(7) : "FF"
                ];
                returnObject.red = parseInt(rgb[0], 16);
                returnObject.green = parseInt(rgb[1], 16);
                returnObject.blue = parseInt(rgb[2], 16);
                returnObject.alpha = parseInt(rgb[3], 16) / 255;
            }
        } else if (rgbMatch && rgbMatch.length) {
            returnObject.red = rgbMatch[1].endsWith("%")
                ? getPart(parseFloat(rgbMatch[1]), 255)
                : parseInt(rgbMatch[1], 10);
            returnObject.green = rgbMatch[2].endsWith("%")
                ? getPart(parseFloat(rgbMatch[2]), 255)
                : parseInt(rgbMatch[2], 10);
            returnObject.blue = rgbMatch[3].endsWith("%")
                ? getPart(parseFloat(rgbMatch[3]), 255)
                : parseInt(rgbMatch[3], 10);
            returnObject.alpha = rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1;
        }
    }

    return returnObject;
}

/**
 * Convert an RGB color value to a hexadecimal color.
 *
 * @since 3.7.0
 * @param {RGBAObject} color - An RGBA color object.
 * @param {boolean} includesAlpha - Set to `true` to include the alpha channel. This is currently not supported in IE or Edge (v18).
 * @returns {string}
 */
export function rgbToHex({ red, green, blue, alpha }, includesAlpha = false) {
    const hexColor = [
        `0${red.toString(16)}`.slice(-2),
        `0${green.toString(16)}`.slice(-2),
        `0${blue.toString(16)}`.slice(-2),
        includesAlpha
            ? `0${Math.round(alpha * 255).toString(16)}`.slice(-2)
            : ""
    ];

    return `#${hexColor.join("")}`;
}

/**
 * Convert an RGB color value to HSL (hue, saturation, lightness).
 *
 * Takes red, green, and blue in the range 0 to 255, and returns hue (0 to 360), saturation and lightness (0 to 1).
 * Alpha is always 0 to 1.
 *
 * @since 3.7.0
 * @see https://stackoverflow.com/a/9493060/1446188
 * @param {RGBAObject} color - An RGBA color object.
 * @returns {HSLAObject} The HSL representation + alpha
 */
export function rgbToHsl({ red, green, blue, alpha }) {
    const r = red / 255;
    const g = green / 255;
    const b = blue / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 2;
    const difference = max - min;
    const saturation =
        difference === 0 ? 0 : difference / (1 - Math.abs(2 * lightness - 1));

    let hue = 0;

    if (difference) {
        if (max === r) {
            hue = ((g - b) / difference) % 6;
        } else if (max === g) {
            hue = (b - r) / difference + 2;
        } else if (max === b) {
            hue = (r - g) / difference + 4;
        }

        hue *= 60;
    }

    return {
        hue,
        saturation,
        lightness,
        alpha: isNaN(alpha) ? 1 : alpha
    };
}

/**
 * Convert an HSL color value (hue, saturation, lightness) to RGB.
 *
 * Assumes hue is 0 to 360, saturation and lightness 0 to 1, and returns red, green and blue in the set 0 to 255.
 * Alpha is always 0 to 1.
 *
 * @since 3.7.0
 * @see https://stackoverflow.com/a/9493060/1446188
 * @param {HSLAObject} color - An HSLA color object.
 * @returns {RGBAObject} The RGB representation + alpha
 */
export function hslToRgb({ hue, saturation, lightness, alpha }) {
    let red = 0;
    let green = 0;
    let blue = 0;

    // Achromatic
    if (saturation === 0) {
        red = green = blue = lightness;
    }

    // Chromatic
    else {
        const q =
            lightness < 0.5
                ? lightness * (1 + saturation)
                : lightness + saturation - lightness * saturation;

        const p = 2 * lightness - q;
        const useHue = hue / 360;
        const oneThird = 1 / 3;
        const twoThirds = 2 / 3;
        const oneSixth = 1 / 6;

        for (let i = -1; i < 2; i += 1) {
            let currentHue =
                useHue + (i < 0 ? oneThird : i > 0 ? -oneThird : 0);

            if (currentHue < 0) {
                currentHue += 1;
            } else if (currentHue > 1) {
                currentHue -= 1;
            }

            currentHue =
                currentHue < oneSixth
                    ? p + (q - p) * 6 * currentHue
                    : currentHue < 0.5
                    ? q
                    : currentHue < twoThirds
                    ? p + (q - p) * (twoThirds - currentHue) * 6
                    : p;

            if (i < 0) {
                red = currentHue;
            } else if (i > 0) {
                blue = currentHue;
            } else {
                green = currentHue;
            }
        }
    }

    return {
        red: Math.round(red * 255),
        green: Math.round(green * 255),
        blue: Math.round(blue * 255),
        alpha: isNaN(alpha) ? 1 : alpha
    };
}

/**
 * Convert an RGB color value to Lab (CIELAB CIE76).
 *
 * Assumes red, green and blue are contained in the set 0 to 255, and returns l (lightness) in the set 0 to 1,
 * and a and b (green–red and blue–yellow color components) in the set -128 to 128. Alpha is always 0 to 1.
 *
 * @since 3.7.0
 * @see https://github.com/antimatter15/rgb-lab/blob/master/color.js
 * @param {RGBAObject} color - An RGBA color object.
 * @returns {CIELABAObject} The CIELAB representation + alpha
 */
export function rgbToLab({ red, green, blue, alpha }) {
    let r = red / 255;
    let g = green / 255;
    let b = blue / 255;
    let x;
    let y;
    let z;

    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

    x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
    y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.0;
    z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

    x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
    y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
    z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

    return {
        l: (116 * y - 16) / 100,
        a: 500 * (x - y),
        b: 200 * (y - z),
        alpha: isNaN(alpha) ? 1 : alpha
    };
}
