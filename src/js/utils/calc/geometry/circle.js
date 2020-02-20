/**
 * Calculate circle geometry.
 *
 * @module utils/calc/geometry/circle
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

import { getPercentage } from "../percentage";
import { degreesToRadians } from "../radians";

/**
 * Return calculated area of circle from radius.
 *
 * @param {Number} radius - Radius of the circle
 * @returns {Number}
 */
export function getArea(radius) {
    return Math.PI * radius * radius;
}

/**
 * Return perimeter of a circle from its radius.
 *
 * @param {Number} radius - Radius of the circle
 * @returns {Number}
 */
export function getCircumference(radius) {
    return 2 * Math.PI * radius;
}

/**
 * Get array of points on the perimeter of a circle.
 *
 * @param {Number} radius - Radius of the circle
 * @param {Number} numberOfPoints - The amount of points to return
 * @param {Number} [offset=0] - Offset
 * @returns {Object[]}
 */
export function getPoints(radius, numberOfPoints, offset = 0) {
    const result = [];

    // Calculate positions of points
    const degreesToFirstPoint = getPercentage(1, numberOfPoints) * 3.6;
    for (let i = 1; i <= numberOfPoints; i += 1) {
        let degrees =
            getPercentage(i, numberOfPoints) * 3.6 -
            degreesToFirstPoint +
            (offset % 360);
        const radians = degreesToRadians(degrees - 90);

        degrees = degrees < 0 ? 360 + degrees : degrees;

        result.push({
            degrees,
            x: radius * Math.cos(radians),
            y: radius * Math.sin(radians)
        });
    }

    // Return points
    return result;
}
