/**
 * This is a utility for adding numbers together.
 *
 * @module utils/calc/addition
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

/**
 * Add an array of numbers together.
 *
 * @example
 * import { addition } from "./utils/calc/addition";
 * const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
 * const mean = addition(numbers) / numbers.length; // 45 / 9 = 5
 *
 * @param {Number[]} numbers - Array of numbers to add together
 * @returns {Number}
 */
export function addition(numbers) {
    return numbers.reduce((a, b) => a + b, 0);
}
