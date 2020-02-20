/**
 * Calculate cylinder geometry.
 *
 * @module utils/calc/geometry/cylinder
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

import { getArea as getCircleArea } from "./circle";

/**
 * Return surface area of a cylinder
 *
 * @param {Number} radius - Radius of cylinder
 * @param {Number} height - Height of cylinder
 * @param {Boolean} [includeEnds=true] - Include top and bottom of cylinder
 * @returns {Number}
 */
export function getArea(radius, height, includeEnds = true) {
    // Calculate surface area of the cylinder's "side"
    let area = Math.PI * (radius * 2) * height;

    // Add the surface areas of both ends
    if (includeEnds) {
        area += 2 * getCircleArea(radius);
    }

    // Return surface area of cylinder
    return area;
}

/**
 * Return calculated volume of a cylinder
 *
 * @param {Number} radius - Radius of cylinder
 * @param {Number} height - Height of cylinder
 * @returns {Number}
 */
export function getVolume(radius, height) {
    return Math.PI * radius * radius * height;
}
