/**
 * Tabbable element handling
 *
 * Get prev and next from document.activeElement in dom.
 * Get first, last and byIndex tabbable element in dom.
 *
 * @module utils/dom/TabDomElements
 * @author Casper Andersen <casper.andersen@akqa.com>
 *
 * @example
 * import { TabDomElements } from "./utils/dom/tabDomElements";
 *
 * let tabDomElements = new TabDomElements(container); // Default use document
 *
 * // Get prev element from activeElement
 * tabDomElements.getPrevTabElement();
 *
 * // Get next element from activeElement
 * tabDomElements.getNextTabElement();
 *
 * // Get element by index of all tabbable elements
 * tabDomElements.getTabElementByIndex();
 *
 * // Get first element of all tabbable elements
 * tabDomElements.getFirstTabElement();
 *
 * // Get last element of all tabbable elements
 * tabDomElements.getLastTabElement();
 */

import { onReady } from "../events/onReady";
import { filter } from "../filter";

// Tabbable dom elements querystring
const tabbableDOMQuery = "a, button, input, textarea, select, area";

/**
 * Select Tab dom elements
 * @param {HTMLElement|Document} [container] - To find tabbable element inside, default is document
 * @param {HTMLElement[]} [excludes] - Array of element to exclude from the elements that are set by default (line 35 - tabbableDOMQuery).
 *
 * @returns {HTMLElement[]} Return tabbable elements
 */
export function selectTabDomElements(container = document, excludes = []) {
    return filter(
        container.querySelectorAll(tabbableDOMQuery),
        element =>
            (element.offsetWidth > 0 || element.offsetHeight > 0) &&
            // Element must not be disabled
            !element.disabled &&
            // Tab index must not be -1
            element.getAttribute("tabindex") !== "-1" &&
            // Element must not be in focus
            element !== document.activeElement &&
            // And it must not be part of the excludes array.
            excludes.indexOf(element) === -1
    );
}

/**
 * Helper class for selecting tabbing elements
 *
 */
export class TabDomElements {
    /**
     * The constructor is fired once the class is instantiated.
     *
     * @param {HTMLElement} container - To find tabbable element inside, default is document
     * @param {HTMLElement[]} [excludes=[]] - Array of element to exclude from the elements that are set by default (line 35 - tabbableDOMQuery).
     */
    constructor(container, excludes = []) {
        // Run initializing code once the DOM is ready.
        onReady(() => this.init(container, excludes));
    }

    /**
     * Find previous Tab element
     * @returns {HTMLElement}
     */
    getPrevTabElement() {
        if (document.activeElement) {
            const index = this.TabDomElements.indexOf(document.activeElement);
            if (index > -1) {
                return this.TabDomElements[index - 1] || undefined;
            }
        }
        return undefined;
    }

    /**
     * Find next Tab element
     * @returns {HTMLElement}
     */
    getNextTabElement() {
        if (document.activeElement) {
            const index = this.TabDomElements.indexOf(document.activeElement);
            if (index > -1) {
                return this.TabDomElements[index + 1] || undefined;
            }
        }
        return undefined;
    }

    /**
     * Return Tab dom element by index
     * @param {Number} index
     * @returns {HTMLElement|undefined}
     */
    getTabElementByIndex(index) {
        if (Number.isInteger(index)) {
            return this.TabDomElements[index];
        }
        return undefined;
    }

    /**
     * Return first tab element
     * @returns {HTMLElement}
     */
    getFirstTabElement() {
        return this.TabDomElements[0];
    }

    /**
     * Return last tab element
     * @returns {HTMLElement}
     */
    getLastTabElement() {
        return this.TabDomElements[this.TabDomElements.length - 1];
    }

    /**
     * Get index of current active element
     * @returns {Number}
     */
    getCurrentActiveElementIndex() {
        return this.TabDomElements.indexOf(document.activeElement);
    }

    /**
     * The actual initialization function, fired once the DOM is ready.
     *
     * @param {HTMLElement} container - To find tabbable element inside, default is document
     * @param {HTMLElement[]} [excludes=[]] - Array of element to exclude from the elements that are set by default (line 35 - tabbableDOMQuery).
     *
     * @private
     */
    init(container, excludes = []) {
        // Tab dom elements
        this.TabDomElements = selectTabDomElements(container, excludes);
    }
}
