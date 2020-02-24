/**
 * This script provides an easy and safe way to **get, add and delete values from a query string**. This will most likely be
 * from the `window.locations.href` (which is also the default value), but can be set to a custom string.
 *
 * @module utils/queryString
 * @author Søren Beier Husted <soren.husted@akqa.com>
 */

import { forEach } from "./forEach";
import { isArray } from "./typeCheckers";

const searchParams = {};

/**
 * Initialize function that handles the URL objects
 *
 * @param {String} url - The url from which to look for search parameters.
 * @returns {String} The base url without any query string
 * @private
 */
function init(url) {
    // Get url without query string
    const baseUrl = url.includes("?")
        ? url.substring(0, url.indexOf("?"))
        : url;

    // If baseUrl is new, initialize it
    if (!searchParams[baseUrl]) {
        searchParams[baseUrl] = new URL(url).searchParams;
    }

    // Return the base url
    return baseUrl;
}

/**
 * Helper function that will remove an elemeent from an array - SHOULD BE A GENERAL UTILITY
 *
 * @param {Array} array - Array to remove element from
 * @param {String} element - Element to remove
 * @returns {Array} Array after element has been removed
 * @private
 */
function removeFromArray(array, element) {
    // Find the element's index in the array
    const index = array.indexOf(element);

    // If the element exists in the array, remove it
    if (index > -1) {
        array.splice(index, 1);
    }

    // Return the array, with or without changes
    return array;
}

/**
 * Helper function that infers the correct datatype from string - SHOULD BE A GENERAL UTILITY
 *
 * @param {String} value - The value that will be examined
 * @returns {*} Inferred datatype from string
 * @private
 */
function getDatatype(value) {
    if (value === "undefined") {
        return undefined;
    }

    const regexp = /^(true|false|null)$/;

    return regexp.test(value) ? JSON.parse(value) : Number(value) || value;
}

/**
 * Get query string
 *
 * @example
 * import { getQueryString } from "./utils/queryString";
 *
 * // Get current query string
 * let q = getQueryString();
 *
 * @param {String} url - The url to get and set query string. Defaults to current window location
 * @returns {String} The current query string
 */
export function getQueryString(url = window.location.href) {
    const currentUrl = init(url);

    return searchParams[currentUrl].toString();
}

/**
 * Get value from one or multiple prameter(s)
 *
 * @example
 * import { getParameter } from "./utils/queryString";
 *
 * // Values from a single key
 * let val1 = getParameter("queryKey");
 *
 * // Values from multiple keys
 * let val2 = getParameter(["queryKey1", "queryKey2"]);
 *
 * @param {String|String[]} key - key(s) to get parameter value(s)
 * @param {String} url - The url to get and set query string. Defaults to current window location
 * @returns {Object} An object with the key(s) and their value(s)
 */
export function getParameter(key, url = window.location.href) {
    const currentUrl = init(url);

    let params = {};

    /**
     * Get value(s) from a key
     *
     * @param {String} key - The key from which to get value
     * @returns {Array} The resulting value(s) with data type conversion
     */
    function setParamsObj(key) {
        const results = searchParams[currentUrl].getAll(key);
        let realResults = [];

        if (results.length) {
            if (results.length === 1) {
                realResults = getDatatype(results[0]);
            } else {
                forEach(results, result => {
                    realResults.push(getDatatype(result));
                });
            }

            return realResults;
        }
    }

    // If key is an array
    if (isArray(key)) {
        forEach(key, k => {
            params[k] = setParamsObj(k);
        });
    }

    // If key is a string
    else if (typeof key === "string") {
        params = setParamsObj(key);
    }

    // Return the object with results
    return params;
}

/**
 * Add parameter(s) to query string
 *
 * @example
 * import { addParameter } from "./utils/queryString";
 *
 * // Add a single value to a key
 * addParameter("queryKey1", "val1");
 *
 * // Add multiple values to a key
 * addParameter("queryKey1", ["val1", "val2"]);
 *
 * // Add multiple values to a key and keep old values
 * addParameter("queryKey1", ["val1", "val2"], false);
 *
 * @param {String} key - The key that will get new value(s)
 * @param {String|Array} value - Value(s) to add to query string
 * @param {Boolean} override - An option to delete all current values before adding the new value(s). Defaults to true
 * @param {String} url - The url to get and set query string. Defaults to current window location
 */
export function addParameter(
    key,
    value,
    override = true,
    url = window.location.href
) {
    const currentUrl = init(url);

    // Clear current value(s)
    if (override) {
        searchParams[currentUrl].delete(key);
    }

    // If multiple values
    if (isArray(value)) {
        forEach(value, val => {
            searchParams[currentUrl].append(key, val);
        });
    }

    // If only a single value
    else if (typeof key === "string") {
        searchParams[currentUrl].append(key, value);
    }
}

/**
 * Delete parameter(s) from query string
 *
 * @example
 * import { deleteParameter } from "./utils/queryString";
 *
 * // Delete a single value from a single key
 * deleteParameter("queryKey1", "val1");
 *
 * // Delete multiple values from a single key
 * deleteParameter("queryKey1", ["val1", "val2"]);
 *
 * // Delete all values from a single key
 * deleteParameter("queryKey1");
 *
 * // Delete all values from multiple keys
 * deleteParameter(["queryKey1", "queryKey2"]);
 *
 * @param {String|String[]} key - The key(s) to remove value(s) from. If array, all values for each item will be deleted
 * @param {String|String[]} value - Value(s) to delete from a single key - Will be ignored if key is an array
 * @param {String} url -The url to get and set query string. Defaults to current window location
 */
export function deleteParameter(
    key,
    value = false,
    url = window.location.href
) {
    const currentUrl = init(url);

    // If key is a string and a value is parsed
    if (typeof key === "string" && value) {
        // Cache all current values
        let values = searchParams[currentUrl].getAll(key);

        // Remove parsed value(s) from the array of all values
        if (isArray(value)) {
            forEach(value, val => {
                values = removeFromArray(values, val);
            });
        } else if (typeof value === "string") {
            values = removeFromArray(values, value);
        }

        // Delete all values for the parsed key
        searchParams[currentUrl].delete(key);

        // Add the remaining values back into the object
        forEach(values, val => {
            searchParams[currentUrl].append(key, val);
        });
    }

    // If no value parameter is parsed, delete all values for the parsed key
    else {
        if (isArray(key)) {
            forEach(key, k => {
                searchParams[currentUrl].delete(k);
            });
        } else if (typeof key === "string") {
            searchParams[currentUrl].delete(key);
        }
    }
}
