/**
 * This module provides a set of functions for adding and removing events to any DOM element through an event
 * proxy. The underlying system is vanilla JS and uses addEventListener()/removeEventListener(), but the proxy
 * makes it possible to remove any and all events, even though they are bound to other scopes or exist inside
 * constructor instantiations.
 *
 * Under normal circumstances, you probably won't need this. But as soon as you start removing constructed
 * instances, and need to clean up after yourself, adding and removing events using these functions will help
 * you a lot.
 *
 * Please note that you will NOT be able to remove these events using removeEventListener(); nor will you
 * be able to use these functions to remove events created using addEventListener().
 *
 *
 * @module utils/events/events
 * @author Anders Gissel <anders.gissel@akqa.com>
 *
 * @example <caption>To add an event:</caption>
 * import { addEvent } from "./utils/events/events";
 * const element = document.querySelector(".element");
 * addEvent(element, "click", yourEventHandlerHere);
 *
 *
 * @example <caption>To remove that event again:</caption>
 * import { removeEvent } from "./utils/events/events";
 * removeEvent(element, "click", yourEventHandlerHere);
 *
 *
 * @example <caption>To remove all click-events from the element:</caption>
 * removeEvent(element, "click");
 *
 *
 * @example <caption>To remove all events from the element:</caption>
 * import { removeAllEvents } from "./utils/events/events";
 * removeAllEvents(element);
 *
 *
 * @example <caption>To add an event to be fired only once and then removed automatically:</caption>
 * import { addEventOnce } from "./utils/events/events";
 * const element = document.querySelector(".element");
 * addEventOnce(element, "click", yourEventHandlerHere);
 *
 */

import { forEach } from "../forEach";
import { filter } from "../filter";
import { splitter } from "../splitter";
import { isArray } from "../typeCheckers";

// We'll be using Map and not a regular object, since Map supports using objects as keys.
// This requires you to include the required polyfill. "default-3.6" from polyfill.io is fine.
const knownDOMObjects = new Map();

/**
 * The actual event handler that will be fired by any event bound using addEvent(). Internal use only.
 *
 * @private
 * @param {Event} event
 */
function handleEvent(event) {
    /** @type {Node|*} */
    const element = this;
    const elementHandlers = knownDOMObjects.get(element);
    const eventType = event.type;

    if (elementHandlers && typeof elementHandlers === "object") {
        const callbackList = elementHandlers[eventType];

        // Fire all associated event handlers!
        if (isArray(callbackList) && callbackList.length) {
            forEach(callbackList, callback => {
                callback.eventHandler(event);

                // Remove event if it is only to be fired once
                if (callback.once) {
                    removeEvent(element, eventType, callback.eventHandler);
                }
            });
        }
    }
}

/**
 * Remove an event from the given DOM element(s). Can individual or all callbacks for an event type, depending on whether
 * "eventHandlerToRemove" is set.
 *
 * @param {Node|Node[]|NodeList|Window|Document} elements - The DOM element(s) we'll be working on.
 * @param {string|string[]} eventTypes - A string containing one or more event names to remove, separated by comma/space, or given as an array.
 * @param {function} [eventHandlerToRemove] - A specific event handler to remove. If set, only that particular callback will be removed from the event type. If not, all callbacks for the event type are removed.
 */
export function removeEvent(elements, eventTypes, eventHandlerToRemove) {
    forEach(elements, element => {
        const elementHandlers = knownDOMObjects.get(element);

        if (elementHandlers) {
            splitter(eventTypes, event => {
                if (event) {
                    if (eventHandlerToRemove !== undefined) {
                        let callbackList = elementHandlers[event];

                        // If there's a list of callbacks for the event type, filter it so it doesn't contain the given "target callback".
                        if (isArray(callbackList) && callbackList.length > 0) {
                            callbackList = filter(
                                callbackList,
                                callbackObject =>
                                    callbackObject.eventHandler !==
                                    eventHandlerToRemove
                            );

                            // If there are any callbacks left, store them now, and then return to avoid hitting
                            // the final "remove everything"-block.
                            if (callbackList.length > 0) {
                                elementHandlers[event] = callbackList;
                                return;
                            }
                        }
                    }

                    // If we're here, no usable event handlers are left, or we should just kill anything anyway (if no
                    // eventHandlerToRemove was provided). Destroy the entire event handler to clean up memory.
                    element.removeEventListener(event, handleEvent);
                    delete elementHandlers[event];
                }
            });

            // Update the event handler cache.
            knownDOMObjects.set(element, elementHandlers);
        }
    });
}

/**
 * Remove ALL event handlers set on the given DOM element(s).
 *
 * @param {Node|Node[]|NodeList|Window|Document} elements - The element(s) to clean up.
 */
export function removeAllEvents(elements) {
    forEach(elements, element => {
        const elementHandlers = knownDOMObjects.get(element);

        if (elementHandlers) {
            // Remove all the event handlers we can possibly find.
            forEach(Object.keys(elementHandlers), eventType => {
                removeEvent(element, eventType);

                // Remove event listeners and clean up memory.
                element.removeEventListener(eventType, handleEvent);
            });

            knownDOMObjects.delete(element);
        }
    });
}

/**
 * Add an event to the given element(s).
 *
 * @param {Node|Node[]|NodeList|Window|Document} elements - The element(s) we'll be working on.
 * @param {string|string[]} eventTypes - A string containing one or more events to add (ie. "click", "mouseenter" etc.), separated by comma/space, or given as an array.
 * @param {function} eventHandler - The event handler function that'll handle the event.
 * @param {boolean} [useCapture=false] - Whether or not to use event capturing. See JS-docs for more.
 * @param {boolean} [runOnce=false] - Whether or not to only run the event once and then remove it.
 */
export function addEvent(
    elements,
    eventTypes,
    eventHandler,
    useCapture = false,
    runOnce = false
) {
    forEach(elements, element => {
        const elementHandlers = knownDOMObjects.get(element) || {};

        splitter(eventTypes, event => {
            if (!isArray(elementHandlers[event])) {
                elementHandlers[event] = [];
                element.addEventListener(event, handleEvent, useCapture);
            }

            elementHandlers[event].push({ runOnce, eventHandler });
        });

        knownDOMObjects.set(element, elementHandlers);
    });
}

/**
 * Add an event to the given element(s) and remove it after its first run
 *
 * @param {Node|Node[]|NodeList|Window|Document} elements - The element(s) we'll be working on.
 * @param {string|string[]} eventTypes - A string containing one or more events to add (ie. "click", "mouseenter" etc.), separated by space.
 * @param {function} eventHandler - The event handler function that'll handle the event.
 * @param {boolean} [useCapture=false] - Whether or not to use event capturing. See JS-docs for more.
 */
export function addEventOnce(
    elements,
    eventTypes,
    eventHandler,
    useCapture = false
) {
    addEvent(elements, eventTypes, eventHandler, useCapture, true);
}

/**
 * Create an eventListener on a parent DOMElement to handle events triggered on multiple elements
 * elements triggering the eventHandler is determined by selector given.
 * Bonus: Works even on elements created after the event listener was added.
 * Depends on experimental code `Element.prototype.closest`, which isn't supported in IE, so a polyfill is required.
 *
 * @param {string} selector - Selector-string of element to trigger eventHandler on
 * @param {string|string[]} eventTypes - A string containing one or more events to add (ie. "click", "mouseenter" etc.), separated by comma/space, or given as an array.
 * @param {function} eventHandler - The event handler function that'll be triggered once event is fired inside selected element. Will be called with object as single parameter, containing event and event target (to avoid scope trouble).
 * @param {Node|Node[]|NodeList|HTMLDocument|Window|Document} elementScope - Parent DOM-element to set eventListener on (optional, defaults to document).
 */
export function delegateEvent(
    selector,
    eventTypes,
    eventHandler,
    elementScope = document
) {
    addEvent(elementScope, eventTypes, event => {
        const listeningTarget = event.target.closest(selector);
        if (listeningTarget) {
            eventHandler({
                event,
                target: listeningTarget
            });
        }
    });
}
