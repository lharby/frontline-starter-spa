/**
 * Handler to trigger callbacks once the browser is ready for them.
 *
 * The onReady() function is one of the cornerstones of Frontline. You basically feed it a function, or a lot
 * of functions, and they will be executed automatically once the browser's readystate changes to something
 * close to "ready". You can add a priority to move your scripts up in the queue, but the default should suit
 * most use cases perfectly.
 *
 * You can keep adding references using onReady() even after the page is loaded. In that case they will be
 * run at once.
 *
 *
 * @module utils/events/onReady
 * @author Anders Gissel <anders.gissel@akqa.com>
 *
 * @example
 * import { onReady } from "./utils/events/onReady";
 *
 * onReady(yourFunctionHere);
 *
 *
 * @example <caption>To set a task to high priority:</caption>
 * onReady(yourFunctionHere, 50);
 *
 *
 * @example <caption>To disable automatic execution so you can trigger the ready-state yourself, do this:</caption>
 * import { documentIsReady, setRunAutomatically, onReady } from "./utils/events/onReady";
 *
 * setRunAutomatically(false); // This must happen BEFORE the first use of onReady()!
 * onReady(yourCallbackHere);
 * window.setTimeout(documentIsReady, 5000);
 *
 */

let functionReferences = [];

// Set the initial readyState based on the browser's current state. If the script has been loaded
// asynchronously, the DOM might be ready for us already, in which case there's no reason to delay
// any further processing. The following will evaluate as true if the DOM is ready, or the page is
// complete.
let readyState =
    document.readyState === "interactive" || document.readyState === "complete";

// Defines whether or not the window.onReady event has been bound, so we won't do it twice. That
// would just be stupid.
let isReadyEventBound = false;

/**
 * Whether or not the callbacks are run automatically
 *
 * @type {boolean}
 */
export let runAutomatically = true;

/**
 * Sort and run the given array of callback functions.
 *
 * @private
 * @param {Array} funcArray
 */
function runFunctionArray(funcArray) {
    funcArray.sort((a, b) => a.priority - b.priority);

    funcArray.forEach(funcRef => funcRef.func());
}

/**
 * Empty the callback arrays
 *
 * @private
 */
function emptyCallbackArrays() {
    // Keep iterating through the function references until there are none left.
    while (functionReferences.length) {
        // Set up a temporary array that mirrors the list of callbacks, and empty the real one.
        const tempArray = functionReferences.slice(0);
        functionReferences = [];

        // Run the callbacks. The callbacks themselves may set up more callbacks, which
        // is why we keep looping the array until we're done.
        runFunctionArray(tempArray);
    }

    // At this point we'll assume we're ready for anything!
    readyState = true;
}

/**
 * Make sure the "ready"-event is set.
 *
 * @private
 */
function bindReadyEvent() {
    if (!isReadyEventBound) {
        // Set up our own document-ready-function to run when the DOM is ready, or whatever.
        if (window.addEventListener) {
            window.addEventListener("load", emptyCallbackArrays, false);
        } else {
            window.attachEvent("onload", emptyCallbackArrays);
        }

        isReadyEventBound = true;
    }
}

/**
 * External function to mark the code as being ready. Must be used if runAutomatically is set to false.
 */
export function documentIsReady() {
    // Continue at once if the DOM is ready; otherwise wait for the browser to catch up by
    // attaching an event listener.
    if (readyState) {
        emptyCallbackArrays();
    } else {
        bindReadyEvent();
    }
}

/**
 * Set whether or not the tasks should be run automatically when the page is ready or not.
 *
 * @param {boolean} state - Whether or not to run the tasks automatically.
 */
export function setRunAutomatically(state = true) {
    runAutomatically = state;
}

/**
 * Register a function to run when the page is ready.
 *
 * @param {Function} functionReference - The function you want to run.
 * @param {Number} [priority=100] - Priority of your callback. Default should be 100, anything under 25 is very-high priority and should be avoided unless you know what you're doing!
 */
export function onReady(functionReference, priority = 100) {
    if (typeof functionReference === "function") {
        if (readyState && runAutomatically) {
            functionReference();
        } else {
            if (runAutomatically) {
                bindReadyEvent();
            }

            functionReferences.push({
                func: functionReference,
                priority
            });
        }
    }
}
