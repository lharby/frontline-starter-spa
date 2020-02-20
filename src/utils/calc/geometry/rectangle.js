/**
 * Calculate rectange geometry.
 *
 * @module utils/calc/geometry/rectange
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

/**
 * Get perimeter of rectangle
 *
 * @param {Number} x - Width of rectange
 * @param {Number} y - Height of rectange
 * @returns {Number}
 */
export function getPerimeter(x, y) {
    return x + x + y + y;
}

/**
 * Get surface area of rectangle
 *
 * @param {Number} x - Width of rectange
 * @param {Number} y - Height of rectange
 * @returns {Number}
 */
export function getArea(x, y) {
    return x * y;
}
