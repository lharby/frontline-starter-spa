/**
 * Calculate sphere geometry.
 *
 * @module utils/calc/geometry/sphere
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

/**
 * Get surface area of sphere
 *
 * @param {Number} radius - Radius of sphere
 * @returns {Number}
 */
export function getArea(radius) {
    return Math.PI * Math.pow(radius * 2, 2);
}

/**
 * Get volume of sphere
 *
 * @param {Number} radius - Radius of sphere
 * @returns {Number}
 */
export function getVolume(radius) {
    return (Math.PI * Math.pow(radius * 2, 3)) / 6;
}
