/**
 * **Online tracker module.**<br>
 * The online tracker helps you detect whether or not the browser is currently online, and run callbacks
 * when the state changes.
 *
 * @module utils/network/onlineTracker
 * @author Christian Broström <christian.brostrom@akqa.com>
 * @author Anders Gissel <anders.gissel@akqa.com>
 *
 * @example
 * import { onlineTracker } from "./utils/network/onlineTracker";
 *
 * function theBrowserIsOnline() {}
 * function theBrowserIsOffline() {}
 *
 * onlineTracker.whenOnline(theBrowserIsOnline);
 * onlineTracker.whenOffline(theBrowserIsOffline);
 *
 * let amIOnline = onlineTracker.getState(); // returns true or false.
 *
 */

import { onReady } from "../events/onReady";
import { addClass, removeClass } from "../dom/classList";

// className is added to the element based on online-state
const classNameOnline = "page--online";
const classNameOffline = "page--offline";
const onlineMethods = [];
const offlineMethods = [];
let navigatorState = navigator.onLine; // true if online (raw javascript function)

/**
 * Run through the given array of callbacks and fire every single one.
 * @private
 * @param {Array} stateArray
 */
function executeArray(stateArray) {
    stateArray.forEach(funcRef => {
        funcRef();
    });
}

/**
 * Update online state based on what the navigator tells us.
 * @private
 */
function setNavigatorState() {
    // set navigator state only when changed and check if supported - if not supported default to true
    if (
        navigatorState !== navigator.onLine &&
        typeof navigator.onLine === "boolean"
    ) {
        navigatorState = navigator.onLine;
    } else {
        navigatorState = true;
    }
    // conditional check based on navigator-state
    if (navigatorState) {
        // Set online state
        // ------------------
        removeClass(document.body, classNameOffline);
        addClass(document.body, classNameOnline);

        // Execute proper array-functions on change
        executeArray(onlineMethods);
    } else {
        // Set offline state
        // ------------------
        removeClass(document.body, classNameOnline);
        addClass(document.body, classNameOffline);

        // Execute proper array-functions on change
        executeArray(offlineMethods);
    }
}

/**
 * Initialize the online tracker
 * @private
 */
function initTracker() {
    // first check of navigator state - and sets interval for recurring checks
    setNavigatorState();
    // Register listeners with fallback for older / wierd browsers

    if (document.documentMode && document.documentMode <= 8) {
        //	<= IE8 and obscure browsers
        document.body.attachEvent("onoffline", setNavigatorState);
        document.body.attachEvent("ononline", setNavigatorState);
    } else {
        // IE9<, FF, Chrome, Safari (Modern browsers)
        window.addEventListener("offline", setNavigatorState);
        window.addEventListener("online", setNavigatorState);
    }
}

// init the "trackers" to look for changes in navigator-state
onReady(initTracker, 75);

/**
 * Adds function to onlineMethods array
 *
 * @param {function} callback - stuff to execute when online
 */
export function whenOnline(callback) {
    if (typeof callback === "function") {
        // make sure the callback is a function
        //push callback from specific option to online array
        onlineMethods.push(callback);
    }
}

/**
 * Adds function to offlineMethods array
 *
 * @param {function} callback - stuff to execute when offline
 */
export function whenOffline(callback) {
    if (typeof callback === "function") {
        // make sure the callback is a function
        // push callback from specific option to offline array
        offlineMethods.push(callback);
    }
}

/**
 * Returns navigatorState
 *
 * @returns {boolean}
 */
export function getState() {
    return navigatorState;
}

/**
 * An object with all the utilities in this module.
 *
 * @type {{whenOffline: function(callback), whenOnline: function(callback), getState: function(): boolean}}
 */
export const onlineTracker = {
    whenOffline,
    whenOnline,
    getState
};
