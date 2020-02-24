/**
 * A bunch of utilities to check whether or not a symbol fits certain criteria.
 *
 * @module utils/typeCheckers
 * @author Anders Gissel <anders.gissel@akqa.com>
 */

/**
 * Find out whether or not the given argument is an element that would react somewhat normally to DOM-manipulations.
 *
 * @since 3.7.0
 * @param {*} element - The element to check.
 * @returns {boolean} `true` if the given argument is an element (or document, or window), and `false` otherwise.
 */
export function isElement(element) {
    return (
        element instanceof Element ||
        element instanceof Document ||
        element instanceof Window
    );
}

/**
 * Find out whether or not the given collection (or whatever) is an array.
 *
 * @since 3.7.0
 * @param {*} collection - The collection to check.
 * @returns {boolean} `true` if the given collection is an array, `false` otherwise.
 */
export function isArray(collection) {
    return collection && collection.constructor === Array;
}
