/**
 * A utility for finding different kinds of averages.
 *
 * @module utils/calc/average
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

import { addition } from "./addition";

/**
 * Get the mean from an array of numbers. This is what is most often referred to as "average".
 *
 * All the values are added together and divided by the amount of numbers.
 *
 * @example
 * import { getMean } from "./utils/calc/average";
 *
 * const numbers = [4, 8, 15, 16, 23, 42];
 * const avarage = getMean(numbers); // 18
 *
 * @param {Number[]} numbers - Array of numbers to find the mean of
 * @returns {Number}
 */
export function getMean(numbers) {
    return addition(numbers) / numbers.length;
}

/**
 * Get the median from an array of numbers.
 *
 * The median is the middle value or, if two middle values,
 * the mean of those two with the numbers in ascending order.
 *
 * @example
 * import { getMedian } from "./utils/calc/average";
 *
 * const numbers = [4, 8, 15, 16, 23, 42];
 * const median = getMedian(numbers); // 16
 *
 * @param {Number[]} numbers - Array of numbers to find the median of
 * @returns {Number}
 */
export function getMedian(numbers) {
    const numbersCount = numbers.length;
    const halfOfNumbersCount = Math.floor(numbersCount / 2);

    // Put the array of numbers in ascending order (small to large)
    numbers.sort((a, b) => a - b);

    if (!numbersCount % 2) {
        // If the amount of numbers is even, the median is the mean of the two middle numbers
        return getMean([
            numbers[halfOfNumbersCount - 1],
            numbers[halfOfNumbersCount]
        ]);
    } else {
        // If the amount of numbers is odd, the median is the middle number
        return numbers[halfOfNumbersCount];
    }
}

/**
 * Get the mode from an array of numbers. The mode is the most repeated number.
 *
 * There can be more than one mode if multiple values
 * are repeated an equal amount of times.
 *
 * @example
 * import { getMode } from "./utils/calc/average";
 *
 * const numbers = [4, 8, 8, 8, 15, 16, 23, 42, 42, 42];
 * const mode = getMode(numbers); // { mode: [8, 42], frequency: 3 }
 *
 * @param {Number[]} numbers - Array of numbers to find the mode of
 * @returns {{mode: Number[], frequency: Number}}
 */
export function getMode(numbers) {
    const numMapping = {};
    let greatestFrequency = 0;
    let mode = [];

    numbers.forEach(number => {
        numMapping[number] = (numMapping[number] || 0) + 1;

        if (greatestFrequency < numMapping[number]) {
            greatestFrequency = numMapping[number];
            mode = [number];
        } else if (greatestFrequency === numMapping[number]) {
            mode.push(number);
        }
    });

    return {
        mode,
        frequency: greatestFrequency
    };
}

/**
 * Get the range from an array of numbers. This is the largest value minus the smallest value.
 *
 * @example
 * import { getRange } from "./utils/calc/average";
 *
 * const numbers = [4, 8, 15, 16, 23, 42];
 * const mode = getRange(numbers); // 38
 *
 * @param {Number[]} numbers - Array of numbers to find the range of
 * @returns {Number}
 */
export function getRange(numbers) {
    // Put the array of numbers in ascending order (small to large)
    numbers.sort((a, b) => a - b);

    return numbers[numbers.length - 1] - numbers[0];
}
