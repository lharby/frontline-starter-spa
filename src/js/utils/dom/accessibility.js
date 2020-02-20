/**
 * Accessibility helper functions
 * @module utils/dom/accessibility
 * @author Casper Andersen <casper.andersen@akqa.com>
 *
 * @example <caption>Set tag tabindex on all tab'able (a, button, form element, etc.) elements in the container</caption>
 * import { tabbingEnable } from "./utils/dom/accessibility";
 * tabbingEnable(container);
 *
 *
 * @example <caption>Remove tag tabindex on all tab'able elements in the container</caption>
 * import { tabbingDisable } from "./utils/dom/accessibility";
 * tabbingDisable(container);
 *
 *
 * @example <caption>Set aria-value on element</caption>
 * import { setAria } from "./utils/accessibility";
 * setAria(element, ariatag, value);
 *
 *
 * @example <caption>Set ariatag value to true on element</caption>
 * import { ariaEnable } from "./utils/accessibility";
 * ariaEnable(element, ariatag);
 *
 *
 * @example <caption>Set ariatag value to false on element</caption>
 * import { ariaDisable } from "./utils/accessibility";
 * ariaDisable(element, ariatag);
 *
 * */

import { selectTabDomElements } from "./tabDomElements";
import { forEach } from "../forEach";

/**
 * Ordered list of interactive elements we could encounter within a container.
 *
 * @ignore
 * @since 3.6.6
 * @type {string[]}
 */
const interactiveElementsToLookFor = [
    "input",
    "select",
    "textarea",
    "a",
    "button",
    "video",
    "audio"
];

/**
 * Enable tabbing on tabbable dom elements
 * @param {HTMLElement} container
 */
export function tabbingEnable(container) {
    const tabElements = selectTabDomElements(container);

    forEach(tabElements, item => item.removeAttribute("tabindex"));
}

/**
 * Disable tabbing on tabbable dom elements
 * @param {HTMLElement} container
 */
export function tabbingDisable(container) {
    const tabElements = selectTabDomElements(container);

    forEach(tabElements, item => item.setAttribute("tabindex", "-1"));
}

/**
 * Set aria tag
 * @param {HTMLElement} element
 * @param {String} aria
 * @param {String|boolean} value
 */
export function setAria(element, aria, value) {
    element.setAttribute(`aria-${aria}`, value);
}

/**
 * Enable aria tag - Value true
 * @param {HTMLElement} element
 * @param {String} aria
 */
export function ariaEnable(element, aria) {
    setAria(element, aria, true);
}

/**
 * Disable aria tag - Value false
 * @param {HTMLElement} element
 * @param {String} aria
 */
export function ariaDisable(element, aria) {
    setAria(element, aria, false);
}

/**
 * Given any kind of container, find and return the first interactive (and thus focus'able) element inside it.
 *
 * @since 3.6.6
 * @author Anders Gissel <anders.gissel@akqa.com>
 * @param {Element} container - The container to search inside. Must support `.querySelector()`, at the very least.
 * @returns {Element|undefined} The first interactive `Element` found, or `undefined` if no matching elements were found.
 *
 * @example <caption>Basic usage – find the first interactive element on the page, scroll to it and then focus on it:</caption>
 * import { getFirstInteractiveElementInContainer } from "./utils/dom/accessibility";
 * import { scrollTo } from "./utils/dom/scrollTo";
 *
 * const firstFoundElement = getFirstInteractiveElementInContainer(document.body);
 *
 * if (firstFoundElement && firstFoundElement.focus) {
 *     scrollTo(firstFoundElement).then(() => firstFoundElement.focus());
 * }
 */
export function getFirstInteractiveElementInContainer(container) {
    let foundElement;
    interactiveElementsToLookFor.forEach(elementName => {
        foundElement = foundElement || container.querySelector(elementName);
    });

    return foundElement;
}
