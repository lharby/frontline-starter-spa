/**
 * Split a string into an array, and then run an optional callback function on each item.
 *
 * If a string is given, it will be **split by spaces and commas to get an array**.
 * If an array is given, no pre-processing happens, but the callback will still be executed (however, in this case please use `forEach()` instead).
 * All other input types are ignored.
 *
 * @module utils/splitter
 * @author Anders Gissel <anders.gissel@akqa.com>
 *
 *
 * @example <caption>Split a string into an array:</caption>
 * import { splitter } from "./utils/splitter";
 *
 * const str = "apple pear orange";
 * splitter(str); // Returns ["apple", "pear", "orange"]
 *
 *
 * @example <caption>Split a string and log each item to the console:</caption>
 * import { splitter } from "./utils/splitter";
 *
 * const str = "apple pear orange";
 * splitter(str, item => window.console.log(item)); // Logs "apple", "pear", "orange" into the console. Returns ["apple","pear","orange"].
 */

import { isArray } from "./typeCheckers";

/**
 * Split a string into an array.
 *
 * @param {string|Array} input - String containing one or more items, separated by space/comma, or an array of entries.
 * @param {function} [callback] - Optional callback to run for each entry in the given array.
 * @returns {Array} The processed data in the form of an array.
 */
export function splitter(input, callback) {
    const inputArray =
        typeof input === "string"
            ? input
                  .replace(/,/gm, " ") // First, replace commas with spaces
                  .replace(/[\s]{2,}/gm, " ") // Then, replace two or more spaces with just one.
                  .trim() // Remove leading/trailing whitespace and similar crap
                  .split(" ")
            : isArray(input)
            ? input
            : [];

    if (typeof callback === "function") {
        inputArray.forEach(inputEntry => {
            if (inputEntry !== undefined) {
                callback(inputEntry);
            }
        });
    }

    return inputArray;
}
