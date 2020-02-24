/**
 * **Scroll threshold handler for elements and window.**
 *
 * This module is useful for hiding and showing elements on scroll. Like a page header, a navigation,
 * or a "scroll back to top" button.
 *
 * There are *three* thresholds. Start, down, and up.
 *
 * **The start threshold:** Scrolling past this point (both up and down) will trigger the callback with
 * `startThresholdPassed` in the response object set to `true` if scrolling below the point, or `false`
 * if scrolling up before the point.
 *
 * **The down threshold:** Scrolling past this point will trigger the callback with `downThresholdPassed`
 * set to `true`. Unless this point has been passed, the "up threshold" will not be triggered ... However,
 * after passing the "up threshold", the "start threshold" needs to be passed again for this threshold to
 * once again be applicable.
 *
 * **The up threshold:** After passing the "down threshold", scrolling back up a certain amount will
 * trigger the callback with `upThresholdPassed` in the response object set to `true`.
 *
 * All thresholds can be set as a number of pixels, or as a percentage of the height of the element.
 *
 * @module utils/events/onScrollThresholds
 * @since 3.6.5
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 *
 * @example <caption>Basic usage:</caption>
 * import { onScrollThresholds } from "./utils/events/onScrollThresholds";
 *
 * const elementWithScroll = document.querySelector(".scroll-me");
 *
 * onScrollThresholds(elementWithScroll, response => {
 *     if (response.startThresholdPassed) {
 *         // Start threshold passed
 *     }
 *
 *     if (response.downThresholdPassed) {
 *         // Down threshold passed
 *     }
 *
 *     if (response.upThresholdPassed) {
 *         // Up threshold passed
 *     }
 * });
 *
 * @example
 * <caption>
 * You can use multiple elements and callbacks, and **remove callbacks** again.
 *
 * Here we attach the same two callbacks to two elements, and when one of the has passed the "down threshold",
 * `callback2` will be removed from one of the elements.
 * </caption>
 * import {
 *     onScrollThresholds,
 *     removeScrollThresholdsCallback,
 *     startThresholdName
 * } from "./utils/events/onScrollThresholds";
 *
 * const anElement = document.querySelector(".scroll-me");
 * const anotherElement = document.querySelector(".scroll-me-too");
 *
 * const callback1 = response => {
 *     if (response.trigger === startThresholdName &&
 *         response.startThresholdPassed) {
 *         window.console.log(`Start threshold passed.`);
 *     }
 * };
 *
 * const callback2 = response => {
 *     if (response.downThresholdPassed) {
 *         removeScrollThresholdsCallback(anotherElement, callback1);
 *     }
 * };
 *
 * onScrollThresholds([anElement, anotherElement], [callback1, callback2]);
 *
 * @example
 * <caption>
 * The following code hides a fixed header when scrolling 100px down, and shows it when the user starts scrolling back up.
 *
 * Furthermore, when scrolling up, a "back to top" button becomes visible. This button is hidden again once the top
 * of the page is reached.
 * </caption>
 * import { addClass, removeClass } from "./utils/dom/classList";
 * import { onScrollThresholds } from "./utils/events/onScrollThresholds";
 *
 * const fixedHeader = document.querySelector(".header");
 * const backToTopButton = document.querySelector(".back-to-top");
 *
 * onScrollThresholds(window, response => {
 *     let showHeader = true;
 *     let showBackToTopButton = false;
 *
 *     if (response.startThresholdPassed) {
 *         showHeader = false;
 *     }
 *
 *     if (response.upThresholdPassed) {
 *         showHeader = true;
 *         showBackToTopButton = true;
 *     }
 *
 *     if (response.downThresholdPassed ||
 *         !response.startThresholdPassed) {
 *         showBackToTopButton = false;
 *     }
 *
 *     if (showHeader) {
 *         removeClass(fixedHeader, "header--hide");
 *     } else {
 *         addClass(fixedHeader, "header--hide");
 *     }
 *
 *     if (showBackToTopButton) {
 *         addClass(backToTopButton, "back-to-top--show");
 *     } else {
 *         removeClass(backToTopButton, "back-to-top--show");
 *     }
 * }, {
 *     startThreshold: 100,
 * });
 */

import { onScroll, removeScrollCallback } from "./onScroll";
import { getElementScroll, getElementSize } from "../dom/elementProperties";
import { currentWindowHeight } from "./onWindowResize";
import { forEach } from "../forEach";
import { isElement } from "../typeCheckers";
import { getPart } from "../calc/percentage";
import { onWindowResize, removeCallback } from "./onWindowResize";

/**
 * The name of the "up" threshold.
 * This is used in the callback to show what triggered it.
 * @type {string}
 */
export const upThresholdName = "up";

/**
 * The name of the "down" threshold.
 * This is used in the callback to show what triggered it.
 * @type {string}
 */
export const downThresholdName = "down";

/**
 * The name of the "start" threshold.
 * This is used in the callback to show what triggered it.
 * @type {string}
 */
export const startThresholdName = "start";

// We'll be using Map and not a regular object, since Map supports using objects as keys.
// This requires you to include the required polyfill. "default-3.6" from polyfill.io is fine.
const knownDOMObjects = new Map();

// A boolean for remembering if an event listener is set on window resize.
let listeningForWindowResize = false;

/**
 * @typedef {object} OnScrollThresholdsSettings
 * @property {number} [throttleValue=0] - Optional throttle value, given in milliseconds. If omitted, no throttling is employed.
 * @property {number|string} [startThreshold="50%"] - Position of the "start threshold". *If given in percentage*, that will be percents of the element's height.
 * @property {number|string} [downThreshold="300%"] - Position of the "down threshold". *If given in percentage*, that will be percents of the element's height.
 * @property {number|string} [upThreshold="50%"] - Position of the "up threshold". *If given in percentage*, that will be percents of the element's height.
 * @property {boolean} [updateOnResize=true] - Whether or not to check scroll position on window resize. Set to **false** to disable.
 */

/**
 * Convert threshold value into pixels or a percentage of the element's height.
 *
 * @ignore
 * @param {number|string} threshold
 * @param {number} elementHeight
 * @returns {number}
 */
function calculateThreshold(threshold, elementHeight) {
    const number = parseInt(threshold);
    return typeof threshold === "string" && threshold.slice(-1) === "%"
        ? getPart(number, elementHeight)
        : number;
}

/**
 * Check if the callback should be fired and what data should be sent with it.
 *
 * @ignore
 * @param {Element|Window} element
 * @param {function} callback
 * @param {OnScrollThresholdsSettings} settings
 */
function checkScroll(element, callback, settings) {
    const scrollPosition = getElementScroll(element);
    const elementHeight =
        element === window
            ? currentWindowHeight
            : getElementSize(element).height;
    const elementData = knownDOMObjects.get(element);
    const callbackData = elementData.get(callback);

    // Calculate thresholds.
    const startThreshold = calculateThreshold(
        settings.startThreshold,
        elementHeight
    );
    const downThreshold = calculateThreshold(
        settings.downThreshold,
        elementHeight
    );
    const upThreshold = calculateThreshold(settings.upThreshold, elementHeight);

    let scrollDownPeak = callbackData.scrollDownPeak;
    let scrollUpPeak = isNaN(callbackData.scrollUpPeak)
        ? Infinity
        : callbackData.scrollUpPeak;

    const callbackResponse = {
        startThresholdPassed: !!callbackData.startThresholdPassed,
        upThresholdPassed: !!callbackData.upThresholdPassed,
        downThresholdPassed: !!callbackData.downThresholdPassed,
        scrollPosition,
        trigger: ""
    };

    // Scrolling past the "start at" threshold.
    if (scrollPosition.top >= startThreshold) {
        if (!callbackResponse.startThresholdPassed && !scrollDownPeak) {
            callbackResponse.trigger = startThresholdName;
            callbackResponse.startThresholdPassed = true;
            callback(callbackResponse);
        }

        scrollDownPeak = Math.max(scrollDownPeak, scrollPosition.top);

        // Scrolling back up.
        if (scrollDownPeak > scrollPosition.top) {
            scrollUpPeak = scrollPosition.top;

            if (
                !callbackResponse.upThresholdPassed &&
                scrollDownPeak - scrollUpPeak >= upThreshold
            ) {
                callbackResponse.trigger = upThresholdName;
                callbackResponse.upThresholdPassed = true;
                callbackResponse.downThresholdPassed = false;
                scrollDownPeak = 0;
                callback(callbackResponse);
            } else if (callbackResponse.upThresholdPassed) {
                scrollDownPeak = 0;
            }
        }

        // Scrolling down.
        else if (
            scrollPosition.top >= downThreshold &&
            (!callbackResponse.upThresholdPassed ||
                (callbackResponse.upThresholdPassed &&
                    scrollPosition.top - scrollUpPeak >= startThreshold))
        ) {
            if (!callbackResponse.downThresholdPassed) {
                callbackResponse.trigger = downThresholdName;
                callbackResponse.upThresholdPassed = false;
                callbackResponse.downThresholdPassed = true;
                scrollUpPeak = 0;
                callback(callbackResponse);
            }
        } else if (
            callbackResponse.upThresholdPassed &&
            scrollPosition.top - scrollUpPeak >= startThreshold
        ) {
            callbackResponse.trigger = downThresholdName;
            callbackResponse.upThresholdPassed = false;
            callback(callbackResponse);
        }
    }

    // Back at the top (before the "start at" threshold).
    else if (
        callbackResponse.startThresholdPassed &&
        (scrollDownPeak || scrollUpPeak)
    ) {
        callbackResponse.trigger = startThresholdName;
        callbackResponse.startThresholdPassed = false;
        scrollUpPeak = Math.min(scrollUpPeak, scrollPosition.top);
        scrollDownPeak = 0;
        callback(callbackResponse);
        callbackResponse.upThresholdPassed = false;
    }

    // Save changes.
    elementData.set(callback, {
        ...callbackData,
        scrollDownPeak,
        scrollUpPeak,
        startThresholdPassed: callbackResponse.startThresholdPassed,
        upThresholdPassed: callbackResponse.upThresholdPassed,
        downThresholdPassed: callbackResponse.downThresholdPassed
    });
}

/**
 * Run checkScroll for all callbacks that are set to update on resize.
 */
function checkScrollOnAllElements() {
    knownDOMObjects.forEach(elementData => {
        elementData.forEach(callbackData => {
            if (callbackData.updateOnResize) {
                callbackData.handleScroll();
            }
        });
    });
}

/**
 * Add a callback for when an element or the window is scrolled passed a threshold, another threshold and back up.
 *
 * @param {Element|Element[]|NodeList|Window} elementList
 * @param {function|function[]} callbackList
 * @param {OnScrollThresholdsSettings} [options={}]
 */
export function onScrollThresholds(elementList, callbackList, options = {}) {
    const settings = {
        startThreshold: "50%",
        downThreshold: "300%",
        upThreshold: "50%",
        throttleValue: 0,
        updateOnResize: true,
        ...options
    };

    // Add an event listener for all elements and callbacks.
    forEach(elementList, element => {
        if (isElement(element)) {
            const elementData = knownDOMObjects.get(element) || new Map();

            forEach(callbackList, callback => {
                const handleScroll = () =>
                    checkScroll(element, callback, settings);
                elementData.set(callback, {
                    handleScroll,
                    startThresholdPassed: false,
                    upThresholdPassed: false,
                    downThresholdPassed: false,
                    scrollDownPeak: 0,
                    scrollUpPeak: null,
                    updateOnResize: settings.updateOnResize
                });

                onScroll(element, handleScroll, settings.throttleValue);
            });

            knownDOMObjects.set(element, elementData);
        }
    });

    // It can be a good idea to recheck scroll positions on window resize because things tend to move around a lot.
    if (!listeningForWindowResize && settings.updateOnResize) {
        onWindowResize(checkScrollOnAllElements);
        listeningForWindowResize = true;
    }
}

/**
 * Remove a given callback or remove all callbacks.
 *
 * @param {NodeList|Element[]|Element|Window} elementList - The element(s) to remove callbacks from.
 * @param {function|function[]} [callbackListToRemove] - Function or array of functions to remove for the given element.
 */
export function removeScrollThresholdsCallback(
    elementList,
    callbackListToRemove
) {
    forEach(elementList, element => {
        const elementData = knownDOMObjects.get(element);

        // Remove scroll listener for certain callbacks.
        if (callbackListToRemove) {
            forEach(callbackListToRemove, callback => {
                const callbackData = elementData.get(callback);
                if (typeof callbackData === "object") {
                    removeScrollCallback(element, callbackData.handleScroll);
                    elementData.delete(callback);
                }
            });
        }

        // Remove scroll listener for all callbacks.
        else {
            elementData.forEach((callbackData, callback) => {
                if (typeof callbackData === "object") {
                    removeScrollCallback(element, callbackData.handleScroll);
                    elementData.delete(callback);
                }
            });
        }

        // Remove element data if all its callbacks are removed.
        if (!elementData.size || !callbackListToRemove) {
            knownDOMObjects.delete(element);
        }
    });

    // Check whether or not the event listener for window resize should be stopped.
    if (listeningForWindowResize) {
        let keepListeningForWindowResize = false;

        knownDOMObjects.forEach(elementData => {
            elementData.forEach(callbackData => {
                if (callbackData.updateOnResize) {
                    keepListeningForWindowResize = true;
                }
            });
        });

        if (!keepListeningForWindowResize) {
            removeCallback(checkScrollOnAllElements);
            listeningForWindowResize = false;
        }
    }
}
