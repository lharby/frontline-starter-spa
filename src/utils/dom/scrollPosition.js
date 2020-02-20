/**
 * This utility can calculate the position of the current scroll state on a page.
 *
 * It works on both X and Y axis and returns a number between 0 and 1 for each axis.
 * It sets up event listeners for scroll and resize events to ensure the value is always correct.
 * If at any time you need to remove these event listeners, it comes with a remove function.
 *
 *
 * @since 3.11.0
 * @author Søren Beier Husted <soren.husted@akqa.com>
 * @module utils/dom/ScrollPosition
 *
 *
 * @example
 * <caption>
 * Basic usage. Sets up event listener for scroll and resize on window and tracks scroll position on the document
 * element.
 * </caption>
 *
 * import { ScrollPosition } from "./utils/dom/scrollPosition";
 *
 * const myScrollPos = new ScrollPosition(({x, y}) => {
 *     window.console.log(x, y);
 * });
 *
 *
 * @example <caption>Basic usage (only one axis)</caption>
 * import { ScrollPosition } from "./utils/dom/scrollPosition";
 *
 * const myScrollPos = new ScrollPosition(({y}) => {
 *     window.console.log(y);
 * });
 *
 *
 * @example
 * <caption>
 * Usage with focus element. The focus element parameter specifies a page element on which the scroll position is
 * tracked in relation to the window, as opposed to the entire document element (which is the default).
 * </caption>
 *
 * import { ScrollPosition } from "./utils/dom/scrollPosition";
 *
 * const myScrollPos = new ScrollPosition(({x, y}) => {
 *     window.console.log(x, y);
 * }, this.dom.myFocusElement);
 *
 *
 * @example
 * <caption>
 * Usage with custom scroll element. The scroll element parameter specifies a page element on which the scroll is
 * tracked, as opposed to the window (which is default).
 *
 * In this case, the focus element must be contained inside the focus element.
 * </caption>
 *
 * import { ScrollPosition } from "./utils/dom/scrollPosition";
 *
 * const myScrollPos = new ScrollPosition(({x, y}) => {
 *     window.console.log(x, y);
 * }, this.dom.myFocusElement, this.dom.myScrollElement);
 *
 */

import {
    getElementWidth,
    getElementHeight,
    getElementScroll,
    getElementPosition
} from "./elementProperties";
import { onScroll, removeScrollCallback } from "../events/onScroll";
import {
    currentWindowWidth,
    currentWindowHeight,
    removeCallback,
    onWindowResize
} from "../events/onWindowResize";
import { forEach } from "../forEach";

// reserved keys for x and y axis respectively
const axis = [
    ["x", "left"],
    ["y", "top"]
];

/**
 * The callback for ScrollPosition. Gets an object with the scroll position when fired.
 *
 * @callback callback
 * @param {{x: number, y: number}} scrollPosition - The scroll position values for x and y axis
 */

export class ScrollPosition {
    /**
     * The constructor for ScrollPosition.
     *
     * @param {callback} callback - The callback function be executed
     * @param {HTMLElement|Element} [focusElement] - the element which we want to track scroll progress. If none is passed, the page is used
     * @param {HTMLElement|Element|HTMLDocument|Window} [scrollElement = window] - the element on which to check scroll position
     */
    constructor(callback, focusElement, scrollElement = window) {
        if (
            focusElement &&
            scrollElement !== window &&
            !scrollElement.contains(focusElement)
        ) {
            throw new Error(
                "focus element is not contained within the scroll element"
            );
        }

        this.callback = callback;
        this.focusElement = focusElement;
        this.scrollElement = scrollElement;

        // The current scroll position
        this.currentScrollPosition = {
            x: 0,
            y: 0
        };

        // Keeps track of whether the focus element is in view
        this.isInView = {
            x: true,
            y: true
        };

        // Keep track whether it necessary to run the callback function
        this.shouldRunCallback = true;

        this.init();
    }

    /**
     * Get initial result and setup event listeners.
     *
     * @private
     */
    init() {
        // Initial result
        this.calculateScrollPosition();

        // Add onScroll and onWindowResize event listeners
        onScroll(this.scrollElement, this.calculateScrollPosition);
        onWindowResize(this.calculateScrollPosition);
    }

    /**
     * Calculate the current scroll position.
     *
     * @private
     */
    calculateScrollPosition = () => {
        // Get current element scroll
        const scrollPos = getElementScroll(this.scrollElement);
        const scrollSize = this.calculateSizes();

        // Get position of the focus element relative to the scroll element
        const focusElementPos = this.focusElement
            ? getElementPosition(this.focusElement, this.scrollElement)
            : { top: 0, left: 0 };

        forEach(axis, ([axes, direction]) => {
            const hasScroll = scrollSize[axes] > 0;

            if (this.focusElement) {
                const isAbove =
                    scrollPos[direction] < focusElementPos[direction];
                const isBelow =
                    scrollPos[direction] >=
                    scrollSize[axes] + focusElementPos[direction];

                // Is the focus element completely in view
                this.isInView[axes] = hasScroll && !isAbove && !isBelow;

                this.currentScrollPosition[axes] = this.isInView[axes]
                    ? (scrollPos[direction] - focusElementPos[direction]) /
                      scrollSize[axes]
                    : scrollPos[direction] > focusElementPos[direction]
                    ? 1
                    : 0;
            } else if (hasScroll) {
                this.currentScrollPosition[axes] =
                    scrollPos[direction] / scrollSize[axes];
                this.isInView[axes] = true;
            } else {
                this.isInView[axes] = false;
            }
        });

        if (this.shouldRunCallback) {
            this.callback(this.currentScrollPosition);
        }

        // When the focus element is not in view
        this.shouldRunCallback = this.isInView.x || this.isInView.y;
    };

    /**
     * Calculate the scroll size.
     *
     * @private
     * @returns {{x: number, y: number}} scrollPosition
     */
    calculateSizes() {
        const isScrollOnWindow = this.scrollElement === window;
        const scrollWidth = isScrollOnWindow
            ? currentWindowWidth
            : getElementWidth(this.scrollElement);
        const scrollHeight = isScrollOnWindow
            ? currentWindowHeight
            : getElementHeight(this.scrollElement);

        // Cannot use getElementWidth() and getElementHeight() on window
        if (this.focusElement) {
            const pageWidth = getElementWidth(this.focusElement);
            const pageHeight = getElementHeight(this.focusElement);

            return {
                x: pageWidth - scrollWidth,
                y: pageHeight - scrollHeight
            };
        } else if (isScrollOnWindow) {
            const pageElement = document.documentElement;
            const pageWidth = pageElement.scrollWidth;
            const pageHeight = pageElement.scrollHeight;

            return {
                x: pageWidth - scrollWidth,
                y: pageHeight - scrollHeight
            };
        } else {
            throw new Error(
                `Focus element is invalid. Expected DOM element, but got ${this.focusElement}`
            );
        }
    }

    /**
     * Getter function - Returns the current scroll position.
     *
     * @example <caption>Get scroll position</caption>
     * import { ScrollPosition } from "./utils/dom/scrollPosition";
     *
     * const myScrollPos = new ScrollPosition(({x, y}) => {
     *     window.console.log(x, y);
     * });
     *
     * // This property returns the scroll position as an object
     * myScrollPos.scrollPosition;
     *
     * @returns {{x: number, y: number}} scrollPosition
     */
    get scrollPosition() {
        return this.currentScrollPosition;
    }

    /**
     * Helper function - Runs callback function.
     *
     * @example <caption>Run callback</caption>
     * import { ScrollPosition } from "./utils/dom/scrollPosition";
     *
     * const myScrollPos = new ScrollPosition(({x, y}) => {
     *     window.console.log(x, y);
     * });
     *
     * // This is useful if the page/element changes size (e.g. load async content, open accordion, etc.)
     * myScrollPos.runCallback();
     */
    runCallback() {
        this.callback(this.currentScrollPosition);
    }

    /**
     * Removes onScroll and onWindowResize event listeners.
     *
     * @example <caption>Remove</caption>
     * import { ScrollPosition } from "./utils/dom/scrollPosition";
     *
     * const myScrollPos = new ScrollPosition(({x, y}) => {
     *     window.console.log(x, y);
     * });
     *
     * myScrollPos.destroy();
     */
    destroy() {
        removeScrollCallback(this.scrollElement, this.calculateScrollPosition);
        removeCallback(this.calculateScrollPosition);
    }
}
