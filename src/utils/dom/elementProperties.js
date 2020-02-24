/**
 * Utilities for checking properties and states of elements.
 *
 * @module utils/dom/elementProperties
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 * @author Nicolaj Lund Hummel
 * @author Anders Gissel <anders.gissel@akqa.com>
 */

import {
    currentWindowWidth,
    currentWindowHeight
} from "../events/onWindowResize";
import { isElement } from "../typeCheckers";
import { forEach } from "../forEach";

/**
 * Check if an element is empty.
 *
 * @param {Node} element - Check if this element is empty.
 * @param {boolean} [strict=true] - Set this to **false** to ignore nodes with whitespace.
 * @returns {boolean} **True** if the element is empty.
 */
export function isElementEmpty(element, strict = true) {
    return strict
        ? !element.childNodes.length
        : !element.innerHTML.trim().length;
}

/**
 * @type {function}
 * @ignore
 * @deprecated
 */
export const elementIsEmpty = isElementEmpty;

/**
 * Check if an element is hidden in the DOM with `display: none;`
 *
 * @param {HTMLElement} element - The element to check.
 * @returns {boolean} **True** if element is hidden, otherwise **false**.
 */
export function isElementHidden(element) {
    return element.offsetParent === null;
}

/**
 * @type {function}
 * @ignore
 * @deprecated
 */
export const elementIsHidden = isElementHidden;

/**
 * Check if a given element is within the client viewport.
 *
 * @param {Element} element - Element to check against viewport bounds.
 * @param {number|{x: number, y: number}} expandMargin - Number of pixels to expand viewport-detection-area with. Can be set as an object specifying expansion for `x` and `y`.
 * @returns {boolean} True if element is in viewport.
 *
 *
 * @example <caption>Basic usage:</caption>
 * import { isElementInViewport } from "./utils/dom/elementProperties";
 *
 * if (isElementInViewport(element)) {
 *     // The element is visible in the viewport
 * };
 *
 * if (isElementInViewport(element, 100)) {
 *     // The element is within 100 pixels of the viewport
 * };
 *
 * if (isElementInViewport(element, { x: 100, y: 200 })) {
 *     // The element is within 100 pixels of the viewport on the x-axis,
 *     // and within 200 pixels on the y-axis.
 * };
 */
export function isElementInViewport(element, expandMargin = 0) {
    const rect = element.getBoundingClientRect();
    const expandMarginX = isNaN(expandMargin) ? expandMargin.x : expandMargin;
    const expandMarginY = isNaN(expandMargin) ? expandMargin.y : expandMargin;
    const spanY = rect.top + Math.max(rect.height, 1) + expandMarginY;
    const spanX = rect.left + Math.max(rect.width, 1) + expandMarginX;

    return (
        spanY >= Math.min(0, expandMarginY) + 1 &&
        rect.top <= currentWindowHeight + expandMarginY - 1 &&
        spanX >= Math.min(0, expandMarginX) + 1 &&
            rect.left <= currentWindowWidth + expandMarginX - 1
    );
}

/**
 * @type {function}
 * @ignore
 * @deprecated
 */
export const elementInViewport = isElementInViewport;

/**
 * Return the position of an element
 *
 * @param {Element|String} element - The HTML element to work with or its ID
 * @param {Element|String|Window} [relativeTo=window] - The HTML element to return the position relative to or its ID
 * @returns {{top: Number, left: Number}} An object with top and left positions in pixels
 *
 *
 * @example <caption>Basic usage:</caption>
 * import { getElementPosition } from "./utils/dom/elementProperties";
 *
 * const element = document.querySelector(".anElement");
 * getElementPosition(element);
 *
 *
 * @example <caption>Perform a search for an element with an ID equal to the string, i.e. "elementId", and get the position of that:</caption>
 * import { getElementPosition } from "./utils/dom/elementProperties";
 *
 * getElementPosition("elementId");
 */
export function getElementPosition(element, relativeTo = window) {
    const useElement =
        typeof element === "string"
            ? document.getElementById(element)
            : element;

    // Throw error if element wasn't found
    if (!useElement) {
        throw "getElementPosition did not find an element.";
    }

    const useRelativeTo =
        typeof relativeTo === "string"
            ? document.getElementById(relativeTo)
            : relativeTo;

    // Throw error if relative element wasn't found
    if (!useRelativeTo) {
        throw "getElementPosition did not find an element to show the position relative to.";
    }

    const rect = useElement.getBoundingClientRect();

    if (relativeTo === window) {
        // Return position relative to window
        return {
            top:
                rect.top +
                (window.pageYOffset || document.documentElement.scrollTop),
            left:
                rect.left +
                (window.pageXOffset || document.documentElement.scrollLeft)
        };
    } else {
        const relativeToRect = relativeTo.getBoundingClientRect();

        // Return position relative to declared element
        return {
            top: rect.top - relativeToRect.top,
            left: rect.left - relativeToRect.left
        };
    }
}

/**
 * Check if an element is within the bounds of another element.
 *
 * @since 3.9.0
 * @param {Element|String} element - The HTML element to work with or its ID.
 * @param {Element|String|Window} [relativeTo=window] - The HTML element to return the position relative to or its ID.
 * @param {boolean} [mustBeFullyInside=false] - Set this to `true` if 100% of the element _must_ be withing the bounds of the other element.
 * @returns {boolean} True if the element is within the bounds of the other element.
 */
export function isElementInside(
    element,
    relativeTo = window,
    mustBeFullyInside = false
) {
    const useElement =
        typeof element === "string"
            ? document.getElementById(element)
            : element;
    const useRelativeTo =
        typeof relativeTo === "string"
            ? document.getElementById(relativeTo)
            : relativeTo;
    const elementPosition = getElementPosition(useElement, useRelativeTo);

    const insideTop =
        elementPosition.top + useElement.offsetHeight >=
        (mustBeFullyInside ? useElement.offsetHeight : 1);
    const insideRight =
        elementPosition.left <=
        useRelativeTo.offsetWidth -
            (mustBeFullyInside ? useElement.offsetWidth : 1);
    const insideBottom =
        elementPosition.top <=
        useRelativeTo.offsetHeight -
            (mustBeFullyInside ? useElement.offsetHeight : 1);
    const insideLeft =
        elementPosition.left + useElement.offsetWidth >=
        (mustBeFullyInside ? useElement.offsetWidth : 1);

    return insideTop && insideRight && insideBottom && insideLeft;
}

/**
 * Get the current scroll values of the given element (or window). Will return an object containing
 * "left" and "top" properties, which are set to the scroll values, or false if no compatible element
 * was given.
 *
 * @param {Element|Window} [element=window]
 * @returns {{ left: number, top: number } | boolean}
 */
export function getElementScroll(element = window) {
    if (isElement(element)) {
        if (element instanceof Window) {
            return {
                left:
                    element.pageXOffset || document.documentElement.scrollLeft,
                top: element.pageYOffset || document.documentElement.scrollTop
            };
        } else {
            return {
                left: element.scrollX || element.scrollLeft,
                top: element.scrollY || element.scrollTop
            };
        }
    } else {
        return false;
    }
}

/**
 * Calculate the scale of an element from its transform matrix.
 *
 * @since 3.12.0
 * @param {string} transform
 * @returns {string}
 */
function getScaleFromTransformMatrix(transform) {
    let scale = 0;

    if (transform && transform !== "none") {
        const matrix = transform
            .split("(")[1]
            .split(")")[0]
            .split(",")
            .map(value => parseFloat(value));

        scale = Math.sqrt(matrix[0] * matrix[0] + matrix[1] * matrix[1]);
    }

    return scale.toFixed(3);
}

/**
 * Get both width and height of element
 *
 * @param {HTMLElement} element - The HTML element to work with
 * @param {Object} [options={}] - Object of options
 * @param {boolean} [options.includeTransformScale=false] - Include transform scale
 * @param {boolean} [options.includePadding=false] - Get size including padding (defaults to true)
 * @param {boolean} [options.includeBorder=false] - Get size including border (defaults to true)
 * @param {boolean} [options.includeMargin=true] - Get size including margin (defaults to false)
 * @param {null|":before"|":after"} [options.pseudoElement=null] - Get size of pseudo element ":before" or ":after"
 * @returns {{width: number, height: number}} An object with the width and height as numbers
 */
export function getElementSize(element, options = {}) {
    // Get styles
    const elementStyle = window.getComputedStyle(
        element,
        options.pseudoElement
    );

    return {
        width: getElementWidth(element, options, elementStyle),
        height: getElementHeight(element, options, elementStyle)
    };
}

/**
 * Get width of element
 *
 * @param {HTMLElement} element - The HTML element to work with
 * @param {Object} [options={}] - Object of options
 * @param {boolean} [options.includeTransformScale=false] - Include transform scale
 * @param {boolean} [options.includeMargin=false] - Get width including margin (defaults to false)
 * @param {boolean} [options.includeBorder=true] - Get width including border (defaults to true)
 * @param {boolean} [options.includePadding=true] - Get width including padding (defaults to true)
 * @param {null|":before"|":after"} [options.pseudoElement=null] - Get width of pseudo element ":before" or ":after"
 * @param {CSSStyleDeclaration} [elementStyle] - Style declaration of element (in case you already have called .getComputedStyle(), pass its returned value here)
 * @returns {number} The width as a number
 */
export function getElementWidth(element, options = {}, elementStyle = null) {
    // Keep supplied values or set to defaults
    options.includeMargin = options.includeMargin === true;
    options.includeBorder = options.includeBorder !== false;
    options.includePadding = options.includePadding !== false;

    // Get styles
    const style =
        elementStyle || window.getComputedStyle(element, options.pseudoElement);
    const scale = options.includeTransformScale
        ? getScaleFromTransformMatrix(style.transform)
        : 1;

    // Get width including border and padding
    let width = element.offsetWidth;

    // Calculate width with margin
    if (options.includeMargin) {
        width += parseFloat(style.marginLeft) + parseFloat(style.marginRight);
    }

    // Calculate width without border
    if (!options.includeBorder) {
        width -=
            parseFloat(style.borderLeftWidth) +
            parseFloat(style.borderRightWidth);
    }

    // Calculate width without padding
    if (!options.includePadding) {
        width -= parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    }

    return width * scale;
}

/**
 * Get height of element
 *
 * @param {HTMLElement} element - The HTML element to work with
 * @param {Object} [options={}] - Object of options
 * @param {boolean} [options.includeTransformScale=false] - Include transform scale
 * @param {boolean} [options.includeMargin=false] - Get height including margin (defaults to false)
 * @param {boolean} [options.includeBorder=true] - Get height including border (defaults to true)
 * @param {boolean} [options.includePadding=true] - Get height including padding (defaults to true)
 * @param {null|":before"|":after"} [options.pseudoElement=null] - Get height of pseudo element ":before" or ":after"
 * @param {CSSStyleDeclaration} [elementStyle] - Style declaration of element (in case you already have called .getComputedStyle(), pass its returned value here)
 * @returns {number} The height as a number
 */
export function getElementHeight(element, options = {}, elementStyle = null) {
    // Keep supplied values or set to defaults
    options.includeMargin = options.includeMargin === true;
    options.includeBorder = options.includeBorder !== false;
    options.includePadding = options.includePadding !== false;

    // Get styles
    const style =
        elementStyle || window.getComputedStyle(element, options.pseudoElement);
    const scale = options.includeTransformScale
        ? getScaleFromTransformMatrix(style.transform)
        : 1;

    // Get height including border and padding
    let height = element.offsetHeight;

    // Calculate height with margin
    if (options.includeMargin) {
        height += parseFloat(style.marginTop) + parseFloat(style.marginBottom);
    }

    // Calculate height without border
    if (!options.includeBorder) {
        height -=
            parseFloat(style.borderTopWidth) +
            parseFloat(style.borderBottomWidth);
    }

    // Calculate height without padding
    if (!options.includePadding) {
        height -=
            parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    }

    return height * scale;
}

/**
 * Set a single attribute for the given element. This tiny helper really only exists so `setAttributes()`
 * has someone to do the actual work.
 *
 * @since 3.7.0
 * @param {Element|Element[]|NodeList} elementCollection - The collection to manipulate.
 * @param {string} attributeName - The name of the attribute, ie. `disabled` or `data-something`
 * @param {string|boolean|Number} attributeValue - The value of the attribute, ie. `"someString"` or `true`.
 * @private
 */
const setAttribute = (elementCollection, attributeName, attributeValue) =>
    forEach(elementCollection, element => {
        if (isElement(element)) {
            // If the option value is a boolean, we'll check the value of the element's property. If that's a
            // boolean as well, we'll set the property "directly". This will get rid of those pesky use-cases
            // with `disabled="true"` instead of just `disabled`.
            if (
                typeof attributeValue === "boolean" &&
                typeof element[attributeName] === "boolean"
            ) {
                element[attributeName] = attributeValue;
            } else {
                element.setAttribute(attributeName, attributeValue);
            }
        }
    });
/**
 * Set one or more attributes on one or more elements.
 *
 * @since 3.7.0
 * @param {Element|Element[]|NodeList} element - The element(s) to manipulate
 * @param {string|object} attribute - The attribute(s) to manipulate. If sent as a string (ie. `"disabled"` or `"data-value"`), it will be used as the attribute name, and `attributeValue` will provide the value for it. You can also set this as a key/value object, with the key being the attribute to set, and the value being the... well, the value.
 * @param {string|boolean|Number|null} [attributeValue=null] - The value to set. Will be ignored if `attribute` is an object.
 *
 * @example <caption>Basic usage. In this case, though, you might as well just use `element.setAttribute(disabled, "disabled")`, or better yet: `element.disabled = true`</caption>
 * import { setAttributes } from "./utils/dom/elementProperties";
 *
 * const element = document.querySelector(".my-element");
 * setAttributes(element, "disabled", true);
 *
 *
 * @example <caption>Setting multiple properties on multiple elements. This is more like it!</caption>
 * import { setAttributes } from "./utils/dom/elementProperties";
 *
 * const elements = document.querySelectorAll("div");
 * setAttributes(elements, {
 *     "data-value": "some value",
 *     "data-ill-take-a-pound-of-nuts": "That's a lot of nuts!",
 *     "data-he-just-left": "With nuts!",
 * });
 *
 */
export function setAttributes(element, attribute, attributeValue = null) {
    if (typeof attribute === "object") {
        forEach(attribute, (value, attribute) =>
            setAttribute(element, attribute, value)
        );
    } else {
        setAttribute(element, attribute, attributeValue);
    }
}

/**
 * Remove one or more attributes from one or more elements.
 *
 * @since 3.7.0
 * @param {Element|Element[]|NodeList} elements - Element(s) to remove the given attributes for.
 * @param {string|string[]} attributes - The attributes to remove, ie. `style` or `data-something`. Can be a single attribute or an array of attribute names.
 *
 * @example <caption>Remove a list of attributes from a list of elements:</caption>
 * import { removeAttributes } from "./utils/dom/elementProperties";
 *
 * const elements = document.querySelectorAll("div");
 * removeAttributes(elements, ["data-value", "data-name", "data-sausage", "value"]);
 */
export function removeAttributes(elements, attributes) {
    forEach(elements, element => {
        if (isElement(element)) {
            forEach(attributes, attribute =>
                element.removeAttribute(attribute)
            );
        }
    });
}

/**
 * Match one or more elements' tags against one or more tag names.
 *
 * @since 3.10.0
 * @param {Element|Element[]|NodeList} elements - One or more elements to test.
 * @param {...string|string[]} tagNames - The tag names to match against.
 * @returns {boolean} True if an element's tag name matches one of the supplied tag names. False if none of the elements matched.
 *
 *
 * @example <caption>Basic usage:</caption>
 * import { isElementTag } from "./utils/dom/elementProperties";
 *
 * const allElements = document.querySelectorAll(".testElements");
 * const divElements = document.getElementsByTagName("div");
 * const singleAudioElement = document.getElementsByById("audio");
 * const singleVideoElement = document.getElementsByById("video");
 *
 * // Match one or more elements against a single tag name.
 * if (isElementTag(divElements, "div")) {
 *     // This is true, it's a DIV.
 * };
 *
 * // Match a single element against multiple tag names.
 * if (isElementTag(singleAudioElement, ["audio", "video"])) {
 *     // This is true, element tag matches "audio".
 * };
 *
 * // Match multiple elements against multiple tag names.
 * if (isElementTag(allElements, "section", "article", "span")) {
 *     // This is false.
 *     // None of the elements matched any of the tag names.
 * };
 *
 * // Match multiple elements against a single tag name.
 * if (isElementTag([audioElement, videoElement], "video")) {
 *     // This is true.
 *     // One of the elements matched the tag name.
 * };
 */
export function isElementTag(elements, ...tagNames) {
    const acceptedTagNames =
        tagNames.length === 1 && tagNames[0] instanceof Array
            ? tagNames[0]
            : tagNames;
    const elementTagNames = elements.length
        ? Array.from(elements).map(tis => tis.tagName.toLowerCase())
        : [elements.tagName.toLowerCase()];

    return acceptedTagNames.reduce(
        (tagNameMatch, tagName) =>
            tagNameMatch || elementTagNames.indexOf(tagName.toLowerCase()) > -1,
        false
    );
}

/**
 * Match a number of elements' tags against one or more tag names.
 *
 * @since 3.10.0
 * @param {Element|Element[]|NodeList} elements - One or more elements to test.
 * @param {...string|string[]} tagNames - The tag names to match against.
 * @returns {boolean} True if all elements match one of the supplied tag names. False if one of the elements doesn't match.
 *
 *
 * @example <caption>Basic usage:</caption>
 * import { areAllElementsTag } from "./utils/dom/elementProperties";
 *
 * const sections = document.querySelectorAll("section");
 * const articles = document.querySelectorAll("article");
 * const allElements = document.querySelectorAll("section, article");
 *
 * // Match similar elements against a single tag name.
 * if (areAllElementsTag(sections, "section")) {
 *     // This is true, their are all sections
 * };
 *
 * // The same as above, but this time it's false.
 * if (areAllElementsTag(article, "section"])) {
 *     // This is false, articles are not sections
 * };
 *
 * // Match multiple elements against multiple tag names.
 * if (areAllElementsTag(allElements, "section", "article")) {
 *     // This is true.
 *     // The elements are either sections or articles.
 * };
 *
 * // The same as above, but this time it's false.
 * if (areAllElementsTag(allElements, "section")) {
 *     // This is false.
 *     // Some of the elements are not sections.
 * };
 */
export function areAllElementsTag(elements, ...tagNames) {
    const acceptedTagNames =
        tagNames.length === 1 && tagNames[0] instanceof Array
            ? tagNames[0]
            : tagNames;
    const elementTagNames = elements.length
        ? Array.from(elements).map(tis => tis.tagName.toLowerCase())
        : [elements.tagName.toLowerCase()];

    return !elementTagNames.reduce(
        (tagNameNegativeMatch, tagName) =>
            tagNameNegativeMatch ||
            acceptedTagNames.indexOf(tagName.toLowerCase()) === -1,
        false
    );
}
