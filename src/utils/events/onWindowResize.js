/**
 * Responsive window handler to detect **window resizing**, **orientation changes** and **active breakpoints**.
 *
 * This module exposes a set of tools to detect when the window has been resized or the orientation has
 * changed. It also figures out which breakpoint is currently active, and provides a set of tools to compare
 * breakpoint sizes programmatically.
 *
 * All callbacks are throttled to avoid using too many CPU cycles.
 *
 * Breakpoints are imported from `src/site-settings.json` automatically. Please remember to add them in order.
 *
 *
 * @module utils/events/onWindowResize
 * @author Anders Gissel <anders.gissel@akqa.com>
 *
 * @example <caption>Basic usage</caption>
 * import { onWindowResize } from "./utils/events/onWindowResize";
 *
 * function resizeHasHappened() {}
 * onWindowResize(resizeHasHappened);
 *
 *
 * @example <caption>To figure out the active breakpoint, as well as some other stuff:</caption>
 * import { currentWindowWidth,
 *          currentWindowHeight,
 *          currentBreakpoint,
 *          breakpointIndex,
 *          onWindowResize
 *        } from "./utils/events/onWindowResize";
 *
 * function resizeHasHappened() {
 *     window.console.log(currentWindowWidth, currentWindowHeight);
 *
 *     if (currentBreakpoint >= breakpointIndex.md) {
 *         window.console.info("Breakpoint is at least 'md'.");
 *     }
 * }
 *
 * onWindowResize(resizeHasHappened);
 *
 */

import { forEach } from "../forEach";
import throttle from "lodash-es/throttle";
import { filter } from "../filter";
import { onReady } from "./onReady";
import siteSettings from "../../../site-settings";

let functionQueue = [];

/**
 * The current width of the window.
 *
 * @type {number}
 */
export let currentWindowWidth = 0;

/**
 * The current height of the window.
 *
 * @type {number}
 */
export let currentWindowHeight = 0;

/**
 * An array of screen sizes, in order to easily being able to identify the current breakpoint corresponding
 * to the active media query. Will be populated automatically from screen sizes set in "site-settings.json".
 */
export const breakpointIndex = {
    unknown: 0
};

/**
 * The timeout for the resize throttle. Set to "0" to disable (!) throttling.
 *
 * @type {number}
 * @private
 */
const resizeThrottleTimeoutMs = 500;

/**
 * An object containing pre-parsed target screen sizes for our breakpoints. Will also be populated
 * automatically. Used internally only.
 *
 * @private
 */
const screenSizes = {
    unknown: 0
};

let sizeCounter = 1;

// Run through the screen sizes in "site-settings.json", and populate our "size objects" with them.
forEach(siteSettings.screensizes, (size, sizeName) => {
    // This index allows us to perform simple size comparisons on the breakpoints.
    breakpointIndex[sizeName] = sizeCounter;

    // This parses the breakpoint size as raw pixels for use in screen width detections later.
    screenSizes[sizeName] = Number(size.replace(/[^0-9]/g, ""));

    // This increases the counter by one. Oh my, yes.
    sizeCounter += 1;
});

/**
 * The current break point. This will correspond to one of the predefined breakpoints, as seen above, so you can
 * use it to compare breakpoints directly:
 *
 * if (currentBreakpoint >= breakpointIndex.md) { ... }
 *
 * @type {number}
 */
export let currentBreakpoint = 0;

/**
 * The name of the current break point, in case you need it.
 *
 * @type {string}
 */
export let currentBreakpointName = "unknown";

/**
 * Get various window sizes - width, height etc.
 * This function is fired automatically upon page load. and throttled each time the window changes size.
 *
 * @private
 */
function getWindowSizes() {
    currentWindowWidth = window.innerWidth;
    currentWindowHeight = window.innerHeight;

    // Calculate which breakpoint is currently active, based on the screen width compared to the pre-parsed
    // breakpoint definitions.
    let lastFoundWidth = 0;
    forEach(screenSizes, (targetScreenWidth, associatedBreakpointName) => {
        if (
            currentWindowWidth >= targetScreenWidth &&
            targetScreenWidth > lastFoundWidth
        ) {
            lastFoundWidth = targetScreenWidth;
            currentBreakpoint = breakpointIndex[associatedBreakpointName];
            currentBreakpointName = associatedBreakpointName;
        }
    });
}

/**
 * This function is run every time the window is resized. It's on a throttle, though, so it won't be fired too
 * often.
 *
 * @private
 */
function performCalculationCallback() {
    // Get our current window size(s)
    getWindowSizes();

    // Fire all queued functions that other scripts may have registered.
    functionQueue.forEach(funcRef => {
        funcRef({
            currentWindowWidth,
            currentWindowHeight,
            currentBreakpoint,
            currentBreakpointName
        });
    });
}

// Set up a throttle, so our callback function isn't fired too often.
const throttledCalculationCallback = resizeThrottleTimeoutMs
    ? throttle(performCalculationCallback, resizeThrottleTimeoutMs)
    : performCalculationCallback;

// Utilize our own "onready"-function to bind an event for handling window resizes and orientation changes.
onReady(
    () => {
        window.addEventListener("resize", throttledCalculationCallback);
        window.addEventListener(
            "orientationchange",
            throttledCalculationCallback
        );

        // Get our current window size, because we might need the data at once.
        getWindowSizes();
    },
    // Set to priority "25", which will put it behind the DOM initiator, but still before all default functions.
    25
);

/**
 * Schedule a callback to fire each time the window changes shape (on a throttle, so don't worry).
 * Your function will be called every time the window is resized, or the window orientation changes.
 *
 * @param {Function} callback - The callback to fire when the window changes shape.
 */
export function onWindowResize(callback) {
    if (typeof callback === "function") {
        functionQueue.push(callback);
    }
}

/**
 * Check if the current breakpoint is less than or equal to a specified breakpoint name
 * Similar to CSS's `@media (max-width: ...px)`
 *
 * @param {string} breakpointName - The breakpoint name to check for, ie. `md`.
 * @returns {boolean} `true` if the current breakpoint is less or equal to the given breakpoint name.
 */
export function breakpointMax(breakpointName) {
    if (breakpointIndex.hasOwnProperty(breakpointName)) {
        return breakpointIndex[breakpointName] >= currentBreakpoint;
    }
}

/**
 * Check if the current breakpoint is greater than or equal to a specified breakpoint name
 * Similar to CSS's `@media (min-width: ...px)`
 *
 * @param {string} breakpointName - The breakpoint name to check for, ie. `md`.
 * @returns {boolean} `true` if the current breakpoint is above or equal to the given breakpoint name.
 */
export function breakpointMin(breakpointName) {
    if (breakpointIndex.hasOwnProperty(breakpointName)) {
        return breakpointIndex[breakpointName] <= currentBreakpoint;
    }
}

/**
 * Remove callback function from callback stack.
 *
 * @param {function} callback - The callback to remove.
 */
export function removeCallback(callback) {
    if (typeof callback === "function") {
        functionQueue = filter(
            functionQueue,
            functionReference => functionReference !== callback
        );
    }
}
