/**
 * **onScroll handler for elements and window.**
 *
 * This module provides a method for listening to the "scroll"-event of any element, be it a regular DOM
 * element or the window, and report the current scroll position back. Call throttling is built in, which means
 * you can set up your listeners as eagerly or lazily as you want or need. The entire thing is based on
 * observables, provided by **RxJS**, which adds a layer of complexity to the code inside this file (and a larger
 * payload by about 18KB, pre-gzip), but will also give you maximum flexibility with regards to throttling and
 * how you register and unregister scroll-events.
 *
 * While the previous version of this module exposed the current scroll position of the window automatically,
 * this is no longer the case. You can use the `getElementScroll` utility, which is a dependency of this
 * utility anyway, to get the current position of any element you wish.
 *
 * If you want maximum control, RxJS is a dependency of this utility, so you can just write your own observables
 * and subscribers instead. This utility is intended to make things as easy as possible.
 *
 * @module utils/events/onScroll
 * @author Anders Gissel <anders.gissel@akqa.com>
 *
 *
 */

import { Observable } from "rxjs/Observable";
import { animationFrame } from "rxjs/scheduler/animationFrame";
import "rxjs/add/observable/fromEvent";
import "rxjs/add/operator/throttleTime";
import { isArray, isElement } from "../typeCheckers";
import { forEach } from "../forEach";
import { filter } from "../filter";
import { getElementScroll } from "../dom/elementProperties";

// We'll be using Map and not a regular object, since Map supports using objects as keys.
// This requires you to include the required polyfill. "default-3.6" from polyfill.io is fine.
const knownDOMObjects = new Map();

/**
 * @typedef {object} SubscriberDefinition
 * @private
 * @property {Observable} baseObservable
 * @property {object} throttlers
 * @property {object} subscribers
 * @property {object} callbacks
 */

/**
 * Create a new subscriber for the given DOM-element and throttle-combination, or return an existing one if found.
 *
 * @private
 * @param {Element|Window} element
 * @param {number} [throttleValueMs=0]
 * @returns {SubscriberDefinition}
 */
function createSubscriberForDOMElement(element, throttleValueMs = 0) {
    let existingData = knownDOMObjects.get(element);

    // If no data exists yet, create it now.
    if (!existingData || typeof existingData !== "object") {
        const baseObservable = Observable.fromEvent(element, "scroll");

        existingData = {
            baseObservable,
            throttlers: {},
            subscribers: {},
            callbacks: {}
        };
    }

    // Only continue if there is a throttle value, or there isn't but we haven't set up the "base listener" yet.
    if (
        throttleValueMs ||
        (throttleValueMs === 0 && !existingData.throttlers[throttleValueMs])
    ) {
        // Make sure we have a callback array for the given throttle value.
        if (!isArray(existingData.callbacks[throttleValueMs])) {
            existingData.callbacks[throttleValueMs] = [];
        }

        // Make sure we have a throttled version of the base observable
        if (throttleValueMs && !existingData.throttlers[throttleValueMs]) {
            existingData.throttlers[
                throttleValueMs
            ] = existingData.baseObservable.throttleTime(
                throttleValueMs,
                animationFrame,
                { trailing: true }
            );
        }

        // Make sure we have a subscriber for when something happens for the given throttle value.
        if (!existingData.subscribers[throttleValueMs]) {
            existingData.subscribers[throttleValueMs] =
                // Use a throttled observer if a throttle value is given, or the base observable if not.
                (throttleValueMs
                    ? existingData.throttlers[throttleValueMs]
                    : existingData.baseObservable
                )
                    // Subscribe to the thing!
                    .subscribe(event => {
                        const { top, left } = getElementScroll(element);
                        existingData.callbacks[
                            throttleValueMs
                        ].forEach(funcRef => funcRef({ event, top, left }));
                    });
        }
    }

    return existingData;
}

/**
 * Add a callback when the element is scrolled.
 *
 * @param {Element|Element[]|NodeList|Window} elementList - List of element(s) to add callback to.
 * @param {function|function[]} callbackList - Function or array of functions to add.
 * @param {number} [throttleValueMs=0] - Optional throttle value, given in milliseconds. If omitted, no throttling is employed.
 *
 * @example <caption>To add a listener/callback:</caption>
 * import { onScroll } from "./utils/events/onScroll";
 *
 * let element = document.querySelector(".element");
 * onScroll(element, yourEventHandlerHere);
 *
 * // Both "element" and "yourEventHandlerHere" can be single instances (like "window" or a
 * // single element for the former, and a single function for the latter), or multiple ones
 * // (like a node list for the former and an array of functions for the latter). The callback
 * // functions, when called, will receive a single object as their argument, containing the
 * // original event as well as the current left- and top scroll position of the targeted element.
 *
 *
 * @example <caption>To add a throttled listener:</caption>
 * // This will ensure the callback is fired four times per second. Trailing calls are enabled.
 * onScroll(element, yourEventHandlerHere, 250);
 */
export function onScroll(elementList, callbackList, throttleValueMs = 0) {
    forEach(elementList, element => {
        if (isElement(element)) {
            // Make sure we have an observable to work with
            const baseData = createSubscriberForDOMElement(
                element,
                throttleValueMs
            );

            // Add all given callbacks to the element's observable
            forEach(callbackList, callback =>
                baseData.callbacks[throttleValueMs].push(callback)
            );

            // Store the data for later use.
            knownDOMObjects.set(element, baseData);
        }
    });
}

/**
 * Remove a given callback for a given throttle value, remove all callbacks, or just all callbacks for the given throttle value.
 *
 * @param {NodeList|Element[]|Element|Window} elementList
 * @param {function|function[]} [callbackListToRemove] Function or array of functions to remove for the given element (and possibly given throttle value)
 * @param {number} [throttleValueMs=-1] The specific throttle to remove the callback(s) for. Defaults to -1 and not 0, because a zero-value just means no throttle.
 *
 *
 * @example <caption>To remove the throttled event:</caption>
 * import { removeScrollCallback } from "./utils/events/onScroll";
 *
 * removeScrollCallback(element, yourEventHandlerHere, 250);
 *
 *
 * @example <caption>To remove "yourEventHandlerHere", regardless of throttle value (_both_ immediate and throttled calls):</caption>
 * import { removeScrollCallback } from "./utils/events/onScroll";
 *
 * removeScrollCallback(element, yourEventHandlerHere);
 *
 *
 * @example <caption>To remove all callbacks for a certain throttle value:</caption>
 * import { removeScrollCallback } from "./utils/events/onScroll";
 *
 * removeScrollCallback(element, null, 250);
 *
 *
 * @example <caption>To remove _all_ scroll callbacks from the element:</caption>
 * import { removeScrollCallback } from "./utils/events/onScroll";
 *
 * removeScrollCallback(element);
 */
export function removeScrollCallback(
    elementList,
    callbackListToRemove,
    throttleValueMs = -1
) {
    forEach(elementList, element => {
        if (isElement(element)) {
            // Get the throttle- and callback lists for the current element.
            let baseData = knownDOMObjects.get(element);

            if (baseData && typeof baseData === "object") {
                let remainingCallbacks = 0;

                // If the throttle value is 0 or above, we are given a specific throttle value to remove the callback(s) for.
                if (throttleValueMs > -1) {
                    // If a specific callback (or list thereof) is given, remove only those for the specific throttle value.
                    if (callbackListToRemove) {
                        forEach(callbackListToRemove, callback => {
                            if (isArray(baseData.callbacks[throttleValueMs])) {
                                // Filter the callbacks to only include those that don't match the given callback
                                baseData.callbacks[throttleValueMs] = filter(
                                    baseData.callbacks[throttleValueMs],
                                    funcRef => funcRef !== callback
                                );
                            }
                        });
                    } else {
                        // If we're here, no specific callbacks were given. Just remove all of them.
                        baseData.subscribers[throttleValueMs].unsubscribe();
                        delete baseData.callbacks[throttleValueMs];
                        delete baseData.subscribers[throttleValueMs];
                    }
                } else {
                    // If we're here, no throttle value was given, so we'll just remove the given callbacks (or all
                    // of them) for all throttle values.
                    if (callbackListToRemove) {
                        // Remove the given callbacks for all throttle values.
                        forEach(callbackListToRemove, callback => {
                            forEach(
                                baseData.callbacks,
                                (callbackList, throttleIdx) => {
                                    baseData.callbacks[throttleIdx] = filter(
                                        callbackList,
                                        funcRef => funcRef !== callback
                                    );
                                }
                            );
                        });
                    } else {
                        // Remove all callbacks for all throttle values. Yowza.
                        baseData.callbacks = {};
                    }
                }

                // Clean up by removing subscribers and throttles if there are no callbacks left.
                forEach(baseData.callbacks, (callbackList, throttleIdx) => {
                    remainingCallbacks += callbackList.length;

                    if (callbackList.length === 0) {
                        baseData.subscribers[throttleIdx].unsubscribe();
                        delete baseData.callbacks[throttleIdx];
                        delete baseData.subscribers[throttleIdx];
                    }
                });

                // If no callbacks exist at all, just remove the base data.
                if (remainingCallbacks === 0) {
                    forEach(baseData.subscribers, subscription =>
                        subscription.unsubscribe()
                    );
                    baseData = null;
                }
            }

            if (baseData) {
                knownDOMObjects.set(element, baseData);
            } else {
                knownDOMObjects.delete(element);
            }
        }
    });
}
