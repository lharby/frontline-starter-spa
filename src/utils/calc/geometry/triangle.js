/**
 * Calculate triangle geometry.
 *
 * @module utils/calc/geometry/triangle
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

/**
 * Get the perimeter of a triangle
 *
 * @param {Number} a - Length of side A on the triangle
 * @param {Number} b - Length of side B on the triangle
 * @param {Number} c - Length of side C on the triangle
 * @returns {Number}
 */
export function getPerimeter(a, b, c) {
    return a + b + c;
}

/**
 * Get the surface area of a triangle using Heron's formula
 *
 * @param {Number} a - Length of side A on the triangle
 * @param {Number} b - Length of side B on the triangle
 * @param {Number} c - Length of side C on the triangle
 * @returns {Number}
 */
export function getArea(a, b, c) {
    const semiPerimeter = getPerimeter(a, b, c) / 2;

    return Math.sqrt(
        semiPerimeter *
            (semiPerimeter - a) *
            (semiPerimeter - b) *
            (semiPerimeter - c)
    );
}
