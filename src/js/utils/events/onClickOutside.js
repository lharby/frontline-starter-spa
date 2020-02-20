/**
 * This utility will check if a clicked element matches a specific element or any of its
 * children and then executes a custom function once.
 *
 * This could be handy for closing popover boxes or open menus by clicking elsewhere.
 *
 * Use `onClickOutsideContinuously()` to keep the event listener running.
 * Use `removeOnClickOutside()` to remove event listeners.
 *
 * @module utils/events/onClickOutside
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

import { addEvent, removeEvent } from "./events";
import { forEach } from "../forEach";
import { isArray } from "../typeCheckers";

// We'll be using Map and not a regular object, since Map supports using objects as keys.
// This requires you to include the required polyfill. "default-3.6" from polyfill.io is fine.
const eventsMap = new Map();

/**
 * Listen for clicks outside the given element - but only once.
 *
 * @param {HTMLElement|Element} element - Element to match with clicked element.
 * @param {function} eventHandler - Callback function to execute when clicked outside element.
 * @param {HTMLElement|Element|HTMLDocument|Window} [clickElement=window] - Element to attach event listener to. Defaults to window.
 * @param {boolean} [runOnlyOnce=true] - Whether or not to run the event continuously or remove it after its first run.
 *
 * @example <caption>Basic usage</caption>
 * import { onClickOutside } from "./utils/onClickOutside";
 *
 * onClickOutside(
 *     this.dom.myElement,
 *     () => {
 *         // Do stuff
 *     }
 * );
 *
 *
 * @example <caption>Usage with custom click area</caption>
 * import { onClickOutside } from './utils/onClickOutside';
 * onClickOutside(
 *     this.dom.myElement,
 *     () => {
 *         // Do stuff
 *     },
 *     this.dom.myClickArea
 * );
 */
export function onClickOutside(
    element,
    eventHandler,
    clickElement = window,
    runOnlyOnce = true
) {
    if (typeof eventHandler === "function") {
        const elementHandlers = eventsMap.get(clickElement) || new Map();
        const thisElementHandlers = elementHandlers.get(element) || [];

        const handleEvent = e => {
            if (elementHandlers && typeof elementHandlers === "object") {
                elementHandlers.forEach((callbackList, handleElement) => {
                    if (!handleElement.contains(e.target)) {
                        if (isArray(callbackList) && callbackList.length) {
                            // Fire all associated event handlers!
                            const tempCallbackList = callbackList.slice(0);
                            forEach(tempCallbackList, callback => {
                                callback.eventHandler();

                                // Remove event if it is only to be fired once
                                if (callback.onlyOnce) {
                                    callbackList.splice(
                                        callbackList.indexOf(callback),
                                        1
                                    );

                                    // Clean eventsMap
                                    if (callbackList.length) {
                                        elementHandlers.set(
                                            handleElement,
                                            callbackList
                                        );
                                    } else {
                                        elementHandlers.delete(handleElement);
                                    }
                                    if (!elementHandlers.size) {
                                        removeEvent(
                                            clickElement,
                                            "click",
                                            handleEvent
                                        );
                                        eventsMap.delete(clickElement);
                                    }
                                }
                            });
                        }
                    }
                });
            }
        };

        thisElementHandlers.push({ runOnlyOnce, eventHandler, handleEvent });

        // Only listen for this event on the given element, is said element hasn't already got an event listener
        if (!eventsMap.get(clickElement)) {
            // In case this function was called from within an event, set the new click handler inside
            // a timeout to allow the original event to finish propagating.
            setTimeout(() => addEvent(clickElement, "click", handleEvent));
        }

        elementHandlers.set(element, thisElementHandlers);
        eventsMap.set(clickElement, elementHandlers);
    }
}

/**
 * Stop listening for clicks outside an element.
 *
 * @param {HTMLElement|Element} element - The DOM element we'll be working on.
 * @param [eventHandlerToRemove] - A specific event handler to remove. If set, only that particular callback will be removed from the event type. If not, all callbacks for the event type are removed.
 * @param {HTMLElement|Element|HTMLDocument|Window} [clickElement=window] - Element which the event listener is attached to. Defaults to window.
 */
export function removeOnClickOutside(
    element,
    eventHandlerToRemove,
    clickElement = window
) {
    const elementHandlers = eventsMap.get(clickElement);

    if (elementHandlers && typeof elementHandlers === "object") {
        const thisElementHandlers = elementHandlers.get(element);

        if (isArray(thisElementHandlers) && thisElementHandlers.length > 0) {
            const tempThisElementHandlers = thisElementHandlers.slice(0);
            forEach(tempThisElementHandlers, handler => {
                // If a specific event handler is set to be removed, remove that - or else: remove all handlers.
                if (
                    typeof eventHandlerToRemove !== "function" ||
                    eventHandlerToRemove === handler.handleEvent
                ) {
                    thisElementHandlers.splice(
                        thisElementHandlers.indexOf(handler),
                        1
                    );

                    // Clean eventsMap
                    if (thisElementHandlers.length) {
                        elementHandlers.set(element, thisElementHandlers);
                    } else {
                        elementHandlers.delete(element);
                    }
                    if (!elementHandlers.size) {
                        removeEvent(clickElement, "click", handler.handleEvent);
                        eventsMap.delete(clickElement);
                    }
                }
            });
        }
    }
}

/**
 * Listen for clicks outside the given element - continuously.
 *
 * @param {HTMLElement|Element} element - Element to match with clicked element.
 * @param {function} callback - Callback function to execute when clicked outside element.
 * @param {HTMLElement|Element|HTMLDocument|Window} [clickElement=window] - Element to attach event listener to. Defaults to window.
 */
export function onClickOutsideContinuously(
    element,
    callback,
    clickElement = window
) {
    onClickOutside(element, callback, clickElement, false);
}
