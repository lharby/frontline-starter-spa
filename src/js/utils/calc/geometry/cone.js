/**
 * Calculate cone geometry.
 *
 * @module utils/calc/geometry/cone
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

import { getArea as getCircleArea } from "./circle";
import { getVolume as getCylinderVolume } from "./cylinder";

/**
 * Return surface area of a cone
 *
 * @param {Number} radius - Radius of the cone
 * @param {Number} height - Height of the cone
 * @param {Boolean} [includeBottom=true] - Include bottom of cone?
 * @returns {Number}
 */
export function getArea(radius, height, includeBottom = true) {
    // Calculate surface area of the cone's "side"
    let area = Math.PI * radius * height;

    // Add the surface area of the end
    if (includeBottom) {
        area += getCircleArea(radius);
    }

    // Return surface area of cone
    return area;
}

/**
 * Return calculated volume of a cone
 *
 * @param {Number} radius - Radius of cone
 * @param {Number} height - Height of cone
 * @returns {Number}
 */
export function getVolume(radius, height) {
    return getCylinderVolume(radius, height) / 3;
}
