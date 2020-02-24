/**
 * A utility for converting between radians and degrees.
 *
 * Radians are especially used in calculations concerning circles, rotations and angles.
 * It is used a lot in 3D and WebGL.
 *
 * @module utils/calc/radians
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

/**
 * Convert degrees to radians.
 *
 * @example
 * import { degreesToRadians } from "./utils/calc/radians";
 *
 * const degrees = 360;
 * const radians = degreesToRadians(degrees);
 * // radians = 6.283185307179586
 *
 * @param {Number} degrees - Units of degrees to convert to radians
 * @returns {Number}
 */
export function degreesToRadians(degrees) {
    return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees.
 *
 * @example
 * import { radiansToDegrees } from "./utils/calc/radians";
 *
 * const radians = 100;
 * const degrees = radiansToDegrees(degrees);
 * // degrees = 5729.5779513082325
 *
 * @param {Number} radians - Units of radians to convert to degrees
 * @returns {Number}
 */
export function radiansToDegrees(radians) {
    return (radians * 180) / Math.PI;
}
