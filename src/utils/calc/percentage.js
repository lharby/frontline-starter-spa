/**
 * A utility for calculating with percentages.
 *
 * @module utils/calc/percentage
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

/**
 * How many percent is X of Y?
 *
 * @example
 * import { getPercentage } from "./utils/calc/percentage";
 *
 * const percentage = getPercentage(1, 2); // percentage = 50
 *
 * @param {Number} part
 * @param {Number} whole
 * @returns {Number}
 */
export function getPercentage(part, whole) {
    return (part / whole) * 100;
}

/**
 * Calculate what X% of Y is?
 *
 * @example
 * import { getPart } from "./utils/calc/percentage";
 *
 * const part = getPart(50, 2); // part = 1
 *
 * @param {Number} percentage
 * @param {Number} whole
 * @returns {Number}
 */
export function getPart(percentage, whole) {
    return (percentage / 100) * whole;
}

/**
 * X is Y% of what number?
 *
 * @example
 * import { getWhole } from "./utils/calc/percentage";
 *
 * const whole = getWhole(1, 50); // whole = 2
 *
 * @param {Number} part
 * @param {Number} percentage
 * @returns {Number}
 */
export function getWhole(part, percentage) {
    return part / (percentage / 100);
}
