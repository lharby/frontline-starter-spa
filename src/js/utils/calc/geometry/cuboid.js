/**
 * Calculate cuboid geometry.
 *
 * @module utils/calc/geometry/cuboid
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

/**
 * Get volume of cuboid.
 *
 * @param {Number} x - Width of the coboid
 * @param {Number} y - Height of the cuboid
 * @param {Number} z - Depth of the cuboid
 * @returns {Number}
 */
export function getVolume(x, y, z) {
    return x * y * z;
}

/**
 * Get surface area of cuboid.
 *
 * @param {Number} x - Width of the coboid
 * @param {Number} y - Height of the cuboid
 * @param {Number} z - Depth of the cuboid
 * @returns {Number}
 */
export function getArea(x, y, z) {
    return (x * y + x * z + y * z) * 2;
}
