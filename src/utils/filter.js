/**
 * Filter an array, an object or a NodeList based on a given predicate function.
 *
 * @module utils/filter
 * @author Anders Gissel <anders.gissel@akqa.com>
 *
 * @example <caption>Filtering an array:</caption>
 * import { filter } from "./utils/filter";
 *
 * const inputArray = [1,2,3,4,5];
 * const filteredArray = filter(inputArray, value => value % 2);
 * // Returns [1, 3, 5]
 *
 *
 * @example <caption>Filtering an object:</caption>
 * import { filter } from "./utils/filter";
 *
 * const inputObject = { a: 1, b: 2, c: 3, d: 4, e: 5 };
 * const filteredObject = filter(inputObject, (value, key) => value % 2 || key === "d");
 * // Returns { a: 1, c: 3, d: 4, e: 5 }
 *
 *
 * @example <caption>Filtering a NodeList:</caption>
 * import { filter } from "./utils/filter";
 *
 * const inputObject = document.querySelectorAll("button");
 * const filteredObject = filter(inputObject, element => !element.disabled);
 * // Returns an array (!) of buttons that are not disabled.
 */

import { forEach } from "./forEach";
import { isArray } from "./typeCheckers";

/**
 *
 * @param {Array|object|NodeList} collection - Collection to filter. Can be an array, an object or a NodeList.
 * @param {function} predicateFunction - Predicate function. Must return a truthy value for filter to include option.
 * @returns {Array|Object} An object of the same type as the input collection, containing all entries that pass the predicate function. However, if you pass a NodeList, it will come back as an array instead.
 */
export function filter(collection, predicateFunction) {
    if (isArray(collection)) {
        return collection.filter(predicateFunction);
    } else if (typeof collection === "object") {
        const filteredObject = {};
        forEach(collection, (value, key) => {
            if (Boolean(predicateFunction(value, key)) === true) {
                filteredObject[key] = value;
            }
        });

        // If a NodeList was passed, return as an array. If not, just throw an object back instead.
        return collection.constructor === NodeList
            ? Object.values(filteredObject)
            : filteredObject;
    }

    return collection;
}
