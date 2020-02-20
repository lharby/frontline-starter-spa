/**
 * @module utils/dom/inView
 */

import { onScroll } from "../events/onScroll";
import { isElementInViewport } from "./elementProperties";
import { addClass, removeClass, hasClass } from "./classList";

/**
 * @typedef {object} InViewElement - Element for internal use and better insights.
 * @private
 * @property {HTMLElement} container
 * @property {number} [inViewMargin=0]
 * @property {string} inViewType
 * @property {string} inViewClass
 */

/**
 * Prevents additional callbacks if instantiated multiple times
 * @private
 * @type {boolean}
 */
let isCallbackSet = false;

/**
 * The default margin for inview activation
 * @private
 * @type {Number}
 */
const defaultMargin = 0;

/**
 * The default type the element will be given
 * @private
 * @type {string}
 */
const defaultType = "show";

/**
 * The default class that'll be added to the element if not other option is given
 * @private
 * @type {string}
 */
const defaultClass = "inview";

/**
 * Array of inViewElements
 * @private
 * @type {InViewElement[]}
 */
const inViewElementsArray = [];

/**
 * Toggles element based on "inViewType" and scroll position
 * @private
 */
function toggleInViewState() {
    // Gets number of inView-items from setup
    const total = inViewElementsArray.length;
    if (total) {
        for (let i = 0; i < total; i += 1) {
            const inViewElement = inViewElementsArray[i];
            if (inViewElement.inViewType === "show") {
                // Makes sure elementInViewport check is only run once with "showOnly" elements
                if (
                    !hasClass(
                        inViewElement.container,
                        inViewElement.inViewClass
                    )
                ) {
                    // This is for "show" elements - parseInt to make sure elementInViewport calculates correctly
                    if (
                        isElementInViewport(
                            inViewElement.container,
                            parseInt(inViewElement.inViewMargin)
                        )
                    ) {
                        addClass(
                            inViewElement.container,
                            inViewElement.inViewClass
                        );
                    }
                }
            } else {
                // This is for "showHide" elements - parseInt to make sure elementInViewport calculates correctly
                if (
                    isElementInViewport(
                        inViewElement.container,
                        parseInt(inViewElement.inViewMargin)
                    )
                ) {
                    addClass(
                        inViewElement.container,
                        inViewElement.inViewClass
                    );
                } else {
                    removeClass(
                        inViewElement.container,
                        inViewElement.inViewClass
                    );
                }
            }
        }
    }
}

/**
 * Detect all inView elements on the page and setup eventlisteners
 *
 * @param {string|NodeList} elements  - Selector for inview-elements
 * @param {string} inViewClass  - Class added to the element when in view
 * @param {string} inViewType  - Element show / hide config ("show" or "showhide")
 * @param {Number} inViewMargin  - Number of pixel after viewport to load element
 */
export function setupInView(elements, inViewClass, inViewType, inViewMargin) {
    let inViewElements;

    if (typeof elements === "string") {
        inViewElements = document.querySelectorAll(elements);
    } else if (typeof elements === "object" && elements.length) {
        inViewElements = elements;
    } else {
        throw "inView elements not given as string or nodeList";
    }

    for (let i = 0, len = inViewElements.length; i < len; i += 1) {
        /**
         * Create a new internal element for ourselves.
         * @type {InViewElement}
         */
        const inViewElement = {
            container: inViewElements[i],
            inViewMargin:
                inViewElements[i].getAttribute("data-inview-margin") ||
                inViewMargin ||
                defaultMargin,
            inViewType:
                inViewElements[i].getAttribute("data-inview-type") ||
                inViewType ||
                defaultType,
            inViewClass:
                inViewElements[i].getAttribute("data-inview-class") ||
                inViewClass ||
                defaultClass
        };

        inViewElementsArray.push(inViewElement);
    }

    toggleInViewState();

    if (!isCallbackSet) {
        onScroll(window, toggleInViewState, 200);
        isCallbackSet = true;
    }
}
