/**
 * Set (or reset) an object of styles on multiple elements at the same time.
 *
 * @module utils/dom/setStyles
 * @since 3.6.0
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 *
 * @example <caption>Basic usage:</caption>
 * import { setStyles, resetStyles } from "./utils/dom/setStyles";
 *
 * const uglyElements = document.querySelectorAll("figure, aside, article .box");
 * setStyles(uglyElements, {
 *     color: "#FFF",
 *     boxShadow: "0 1px 10px #000",
 * });
 *
 * // And reset styles like this:
 * resetStyles(uglyElements);
 *
 *
 * @example <caption>If you don't speak camelCase, use kebab-case like this:</caption>
 * setStyles(document.getElementById("anotherUglyElement"), {
 *     "background-color": "#FFF",
 *     "border-radius": "50%",
 *     "padding-top": 0,
 * });
 *
 *
 * @example
 * <caption>You can set your own styles as the default:</caption>
 * import {
 *     setStyles,
 *     resetStyles,
 *     saveStylesAsDefault
 * } from "./utils/dom/setStyles";
 *
 * const element = document.getElementById("uglyElement");
 *
 * // Set the background color to white
 * setStyles(element, {
 *     "background-color": "#FFF",
 * });
 *
 * // Save the current inline styling as the default
 * saveStylesAsDefault(element);
 *
 * // Change styling again
 * setStyles(element, {
 *     "background-color": "#000",
 * });
 *
 * // Now reset - this will set the background-color to white again
 * resetStyles(element);
 */

import { forEach } from "../forEach";

// We'll be using Map and not a regular object, since Map supports using objects as keys.
// This requires you to include the required polyfill. "default-3.6" from polyfill.io is fine.
const knownDOMObjects = new Map();

/**
 * Set multiple styles on one or more elements.
 *
 * @param {HTMLElement|HTMLElement[]|NodeList} element - One or more elements that need some stylin'.
 * @param {Object} styles - An object with styles. Properties can be in both camelCase and kebab-case.
 */
export function setStyles(element, styles) {
    forEach(element, currentElement => {
        // Reset styles
        if (styles === null) {
            resetStyles(currentElement);
        }

        // Set new styles
        else {
            // Save original styling in case the element needs to be reset to its default state later
            saveStylesAsDefault(currentElement, false);

            // Do the changes!
            forEach(
                styles,
                (value, key) =>
                    (currentElement.style[
                        key.replace(/-([a-z])/g, match =>
                            match[1].toUpperCase()
                        )
                    ] = value)
            );
        }
    });
}

/**
 * Save the current inline styling of one or more elements as the default.
 *
 * @param {HTMLElement|HTMLElement[]|NodeList} element - One or more elements to get the inline styling from.
 * @param {boolean} [overwriteExisting=true] - Set to **false** if you don't want to overwrite an already existing default.
 */
export function saveStylesAsDefault(element, overwriteExisting = true) {
    forEach(element, currentElement => {
        const originalInlineStyles = knownDOMObjects.get(currentElement);
        if (
            overwriteExisting ||
            !(originalInlineStyles && typeof originalInlineStyles === "string")
        ) {
            knownDOMObjects.set(
                currentElement,
                currentElement.getAttribute("style") || ""
            );
        }
    });
}

/**
 * Reset the styling of one or more elements.
 *
 * If an element had inline styling before you used `setStyles()` on it, we'll reset to that.
 * If you want to remove inline styles completely, set the second argument `hardReset` to *true*.
 *
 * @param {HTMLElement|HTMLElement[]|NodeList} element - One or more elements that you wish to remove inline styling from.
 * @param {boolean} [isHardReset=false] - Set this to **true** to remove inline styling completely.
 */
export function resetStyles(element, isHardReset = false) {
    forEach(element, currentElement => {
        let setStylesTo = "";

        if (!isHardReset) {
            // If the element's original inline styling has been saved, reset to that
            const originalInlineStyles = knownDOMObjects.get(currentElement);
            if (
                originalInlineStyles &&
                typeof originalInlineStyles === "string"
            ) {
                setStylesTo = originalInlineStyles || "";
            }
        }

        currentElement.style.cssText = setStylesTo;
    });
}
