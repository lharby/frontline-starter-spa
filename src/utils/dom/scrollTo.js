/**
 * **Scroll the window** or **an element** smoothly to the desired position, with a promise-based callback.
 *
 * `Promise` is not supported in IE <= 11 and Safari <= 8. Make sure `Promise` is supplied by the
 * polyfill (version `default-3.4` and up).
 *
 * @module utils/dom/scrollTo
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 *
 *
 * @example <caption>Scroll window to 100px down on the Y-axis (using default duration of 1000ms)</caption>
 * import { scrollTo } from "./utils/dom/scrollTo";
 * scrollTo(100);
 *
 *
 * @example <caption>Your editor may warn you about ignoring the promise returned from `scrollTo()`. If you want to avoid this, use the `void` operator:</caption>
 * void scrollTo(100);
 *
 *
 * @example <caption>Scroll `window` to 1024px on the X-axis and 100px on the Y-axis (500ms duration)</caption>
 * void scrollTo([1024, 100], 500);
 *
 *
 * @example <caption>Scroll `#test` to 500px on the X- and Y-axis (1500ms duration), and output a string to the console when done</caption>
 * const scrollElement = document.getElementById("test");
 * scrollTo([500, 500], 1500, scrollElement).then(() => window.console.log("Scroll done"));
 * // or:
 * scrollTo([500, 500], 1500, "test").then(() => window.console.log("Scroll done"));
 *
 *
 * @example <caption>Scroll `window` to reveal `#target` with -150 pixel offset on Y-axis</caption>
 * const targetElement = document.getElementById("target");
 * void scrollTo(targetElement, 1000, window, -150);
 * // or:
 * void scrollTo("target", 1000, window, -150);
 *
 *
 * @example <caption>Scroll `window` to reveal `#target` with 100 pixel offset on X-axis and -200 pixel offset on Y-axis</caption>
 * const targetElement = document.getElementById("target");
 * void scrollTo(targetElement, 2000, window, [100, -200]);
 * // or:
 * void scrollTo("target", 2000, window, [100, -200]);
 */

import { getElementPosition, getElementScroll } from "./elementProperties";
import { addEventOnce, removeEvent } from "../events/events";
import { isArray } from "../typeCheckers";

const defaultDuration = 1000;

/**
 * Perform the scroll action
 *
 * @private
 * @param {Array} position - An array [x, y] of where to scroll to.
 * @param {HTMLElement|Window} element - Element to scroll inside.
 * @param {Boolean} isElementWindow - Is the element window.
 */
function doScroll(position, element, isElementWindow) {
    if (isElementWindow) {
        element.scrollTo(position[0], position[1]);
    } else {
        element.scrollLeft = position[0];
        element.scrollTop = position[1];
    }
}

/**
 * Smooth scroll effect
 *
 * @param {Number|Number[]|HTMLElement|String} target - Where to scroll to.
 *        If a number is given, it will be interpreted as pixels on the Y-axis.
 *        If an array is given, it will be interpreted as `[x, y]`. Must be array of numbers.
 *        If an HTML element is given, that will be the target instead.
 *        If a string is given, an element with that string as its ID will be found and used.
 * @param {Number|Boolean|Null} [durationMs=1000] - Duration of scroll effect in ms. Defaults to `1000`.
 * @param {HTMLElement|String|Window} [targetElement=window] - Element to scroll inside. Defaults to `window`.
 * @param {Number|Number[]} [offsetPx=0] - Offset value in pixels for Y-axis, or as an array (`[x, y]`) that offsets both X and Y-axis. Defaults to `0`.
 * @param {Boolean} [isInterruptible=true] - Whether the scrolling is interruptible by mousewheel scrolling. Defaults to `true`.
 * @returns {Promise} A promise that resolves when the scrolling is done.
 */
export function scrollTo(
    target,
    durationMs = defaultDuration,
    targetElement = window,
    offsetPx = 0,
    isInterruptible = true
) {
    // Make sure Promise is supported
    if (typeof Promise !== "function") {
        throw new Error(
            "scrollTo needs support for Promise - Please read the notes in js/utils/scrollTo.js"
        );
    }

    // Set duration to default if it isn't defined as a number
    const useDurationMs =
        typeof durationMs !== "number" ? defaultDuration : durationMs;

    // If target element is a string, find the element by its ID
    const useTargetElement =
        typeof targetElement === "string"
            ? document.getElementById(targetElement)
            : targetElement;

    // Throw error if target element wasn't found
    if (!useTargetElement) {
        throw new Error("getElementPosition did not find an element.");
    }

    const elementIsWindow = useTargetElement === window;
    let scrollCount = 0;
    let oldTimestamp = Date.now();

    // Get current scroll position
    const detectedScrollPosition = getElementScroll(useTargetElement);
    const scrollPos = [detectedScrollPosition.left, detectedScrollPosition.top];

    let useTarget;

    // If target is a number and not an array, make an array for scrolling on the Y-axis
    if (typeof target === "number") {
        useTarget = [scrollPos[0], target];
    }

    // If target is not an array by now we'll try to find the position of an element
    else if (!isArray(target)) {
        const elementPosition = getElementPosition(target, useTargetElement);

        useTarget = [elementPosition.left, elementPosition.top];
    }

    // Target is already an array - just use it as it is
    else {
        useTarget = target;
    }

    // If no X or Y position is stated, keep the current position
    if (typeof useTarget[0] !== "number") {
        useTarget[0] = scrollPos[0];
    }
    if (typeof useTarget[1] !== "number") {
        useTarget[1] = scrollPos[1];
    }

    // Modify the target scroll position if 'offset' parameter is given and is of type array or number
    if (isArray(offsetPx)) {
        // If array, add offset to X and Y-axis
        useTarget[0] += offsetPx[0];
        useTarget[1] += offsetPx[1];
    } else if (typeof offsetPx === "number") {
        // If number, only offset the Y-axis
        useTarget[1] += offsetPx;
    }

    // Calculate
    const cosParameters = [
        (scrollPos[0] - useTarget[0]) / 2,
        (scrollPos[1] - useTarget[1]) / 2
    ];

    return new Promise(resolve => {
        // If duration is set to 0, just jump to the stated target/position
        if (useDurationMs <= 0) {
            doScroll(useTarget, useTargetElement, elementIsWindow);
            resolve();
            return;
        }

        let scrollDone = false;
        let interruptScrollFlag = false;

        // If interruptible, add an eventListener once on mousewheel scroll that calls 'interruptScroll'
        if (isInterruptible) {
            addEventOnce(useTargetElement, "wheel", interruptScroll);
        }

        // Once this function is called, set 'interruptScrollFlag' to true, which resolves the promise
        function interruptScroll() {
            interruptScrollFlag = true;
        }

        function step() {
            if (interruptScrollFlag) {
                resolve();
                // Since resolving does not prevent the rest of the function from running, we also need to return
                return;
            }

            const newTimestamp = Date.now();
            const timeDifferenceMs = newTimestamp - oldTimestamp;
            let moveStep;

            // Pi is used to make easing
            scrollCount += Math.PI / (useDurationMs / timeDifferenceMs);

            // As soon as we cross over Pi, we're about where we need to be
            if (scrollCount >= Math.PI) {
                moveStep = useTarget;
                scrollDone = true;
            } else {
                // Calculate and set scroll position
                moveStep = [
                    Math.round(
                        useTarget[0] +
                            cosParameters[0] +
                            cosParameters[0] * Math.cos(scrollCount)
                    ),
                    Math.round(
                        useTarget[1] +
                            cosParameters[1] +
                            cosParameters[1] * Math.cos(scrollCount)
                    )
                ];
            }

            // Perform scroll action
            doScroll(moveStep, useTargetElement, elementIsWindow);

            if (scrollDone) {
                removeEvent(useTargetElement, "wheel", interruptScroll);
                resolve();
            } else {
                oldTimestamp = newTimestamp;
                window.requestAnimationFrame(step);
            }
        }

        window.requestAnimationFrame(step);
    });
}
