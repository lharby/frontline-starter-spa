/**
 * This module provides a convenience method for registering key events (keyboard events)
 * by letting developers define key events as strings separated by dots.
 *
 * If you just use "keydown" or "keyup" then this module will just re-delegate the event registration onwards to the
 * events module.
 *
 * All events handled in the addKeyEventListener will get an additional property on the Event argument:
 * `disFullKey` with the value being the parsed "fullEvent", ie `keydown.shift.a`

 * @example <caption>Common usage:</caption>
 * import { addKeyEvent } from "./utils/keyEvents.js";
 *
 * addKeyEventListener(window, "keydown.a", event => {
 *     // I will only trigger on keydown, if "a" key was pressed
 * });
 *
 * @example <caption>It gets even better if you need a number of modifier keys to be pressed as well:</caption>
 * import { addKeyEvent } from "./utils/keyEvents.js";
 *
 * addKeyEventListener(window, "keydown.control.c", event => {
 *     // I will only trigger on keydown, if "control" + "c" key was pressed
 * });
 *
 * @module utils/events/keyEvents
 * @author Dennis Haulund Nielsen <dennis.nielsen@akqa.com>
 */

import { forEach } from "../forEach";
import { filter } from "../filter";
import { addEvent, removeEvent } from "./events.js";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/fromEvent";
import { isArray } from "../typeCheckers";

const MODIFIER_KEYS = ["alt", "control", "meta", "shift"];

const EVENT_LISTENER_OPTIONS = {
    capture: false,
    passive: false,
    once: false
};

const knownDOMObjects = new Map();

/**
 * Sometimes we forget what a key event is called - this method helps sanitize common misconceptions.
 *
 * @private
 * @param {string} keyName
 * @returns {string}
 */
function normalizeKeyboardModifier(keyName) {
    switch (keyName) {
        case "esc":
            return "escape";
        case "ctrl":
            return "control";
        default:
            return keyName;
    }
}

/**
 * We only want to call the event handler if the keys pressed satisfied the fullKey event name.
 *
 * @private
 * @param {string} fullKey
 * @param {function} handler
 * @returns {function}
 */
function eventCallback(fullKey, handler) {
    return event => {
        if (getEventFullKey(event) === fullKey) {
            // Let's attach the fullKey name to the event in case the developer wants to do logic based on the eventName
            event.disFullKey = fullKey;
            event.name = fullKey;
            handler(event);
        }
    };
}

/**
 * @private
 * @param {string} eventName
 * @returns {{domEventName: string, fullKey: string} | null}
 */
function parseEventName(eventName) {
    const parts = eventName.toLowerCase().split(".");
    const domEventName = parts.shift();

    if (!(domEventName === "keydown" || domEventName === "keyup")) {
        window.console.warn(
            `keyEvents: no domEvent name in ${eventName} - did you mean keydown.${eventName} or keyup.${eventName}?`
        );
    }

    if (
        parts.length === 0 ||
        !(domEventName === "keydown" || domEventName === "keyup")
    ) {
        return null;
    }

    // Let's "normalize" the modifier keys, in case people forget its written "control" and not "ctrl" etc.
    const key = normalizeKeyboardModifier(parts.pop());

    forEach(parts, (part, i) => {
        parts[i] = normalizeKeyboardModifier(part);
    });

    let fullKey = "";
    MODIFIER_KEYS.forEach(modifierName => {
        const index = parts.indexOf(modifierName);

        if (index > -1) {
            parts.splice(index, 1);
            fullKey += `${modifierName}.`;
        }
    });
    fullKey += key;

    if (parts.length !== 0 || key.length === 0) {
        return null;
    }

    return {
        domEventName,
        fullKey
    };
}

/**
 * This method returns which key was pressed on an event.
 *
 * This is where we would handle crossbrowser inconsitensies or add tricks like the numpad helper below.
 *
 * @private
 * @param {KeyboardEvent | Event} event
 * @returns {string}
 */
function getEventKey(event) {
    let key = event.key;

    // Binding to numpad keys requires additional trickery - we normalize this here, now we can write keydown.numpad1 etc.
    const isNumpad = event.location === 3;

    if (isNumpad && event.code) {
        key = event.code;
    }

    return key;
}

/**
 * Given an (Keyboard)Event and a modifier name - returns a boolean specifying wether the modifier key was active or not.
 *
 * @private
 * @param {KeyboardEvent | Event} event
 * @param {string} modifierKey
 * @returns {boolean}
 */
function isModifierActive(event, modifierKey) {
    switch (modifierKey) {
        case "alt":
            return event.altKey;
        case "control":
            return event.ctrlKey;
        case "meta":
            return event.metaKey;
        case "shift":
            return event.shiftKey;
        default:
            return false;
    }
}

/**
 * Given a browser (Keyboard)Event - returns a string consisting of all active modifier keys
 * and the key which was pressed in lowercase - ie.: `control.shift.arrowdown`.
 *
 * @private
 * @param {KeyboardEvent | Event} event
 * @returns {string}
 */
function getEventFullKey(event) {
    let fullKey = "";
    let key = getEventKey(event);

    // its much easier to define keyvents in lowercase:
    // nice: keydown.numpad1
    // not nice: keydown.Numpad1
    key = key.toLowerCase();

    // Because the syntax for defining a keyevent is `x.y.z` we have to do a bit of sanitizing between the browser event and our way of defining the keyvent
    if (key === " ") {
        key = "space";
    } else if (key === ".") {
        key = "dot";
    }

    MODIFIER_KEYS.forEach(modifierName => {
        if (modifierName !== key) {
            if (isModifierActive(event, modifierName)) {
                fullKey += `${modifierName}.`;
            }
        }
    });

    fullKey += key;
    return fullKey;
}

/**
 * Creates an eventListener based on a combination defined by dot separation: `keydown.shift.q`.
 *
 * If the fullKey is just keydown/keyup we don't need to recursively check if all keys were pressed
 * before calling the event handler and will instead delegate the event registration to Frontline's Event module.
 *
 * @param {Element|HTMLElement|NodeList|Window|Document} elements
 * @param {string} eventName
 * @param {function} eventHandler
 *
 * @example <caption>Usage</caption>
 * import { addKeyEventListener } from "./utils/events/keyEvents";
 *
 * addKeyEventListener(window, "keydown.control.c", event => {
 *     // I will only trigger on keydown if "control" + "c" key-combo was pressed
 * });
 */
export function addKeyEventListener(elements, eventName, eventHandler) {
    if (isArray(eventName)) {
        forEach(eventName, name => {
            addKeyEventListener(elements, name, eventHandler);
        });
        return;
    }

    const parsedEvent = parseEventName(eventName);

    // We could not parse the fullKey from the given eventName - this is because the eventName was likely keydown or keyup without any additional keys,
    // no need for additional logic - let's pass this on to the normal Frontline addEvent
    if (!parsedEvent) {
        addEvent(elements, eventName, eventHandler);
        return;
    }

    forEach(elements, element => {
        const elementHandlers = knownDOMObjects.get(element) || {};

        const outsideHandler = eventCallback(parsedEvent.fullKey, eventHandler);

        const eventSubscriber = Observable.fromEvent(
            element,
            parsedEvent.domEventName,
            EVENT_LISTENER_OPTIONS
        );
        const eventSubscription$ = eventSubscriber.subscribe(outsideHandler);

        if (!isArray(elementHandlers[eventName])) {
            elementHandlers[eventName] = [];
        }

        // Unlike the normal addEvent we need a reference to both the outsideHandler and the actual handler.
        // When a developer calls the removeKeyEventListener - he passes in his own eventHandler,
        // but in reality - what we want to do is remove the outsideListener - this is the event responsible
        // for checking that the all the required keys had been pressed before calling the original handler.
        elementHandlers[eventName].push({
            handler: eventHandler,
            outsideHandler,
            subscription: eventSubscription$
        });

        knownDOMObjects.set(element, elementHandlers);
    });
}

/**
 * Removes a specific KeyEventListener from the element(s).
 *
 * If the fullKey is was not found in this modules internal map,
 * we instead delegate the event de-registration to Frontline's Event module.
 *
 * @param {Element|HTMLElement|NodeList|Window|Document} elements
 * @param {string} eventName
 * @param {function} [eventHandler]
 *
 * @example <caption>Usage</caption>
 * import { addKeyEventListener } from "./utils/events/keyEvents";
 *
 * removeKeyEventListener(window, "keydown.control.c", yourEventHandlerFn);
 */
export function removeKeyEventListener(elements, eventName, eventHandler) {
    if (isArray(eventName)) {
        forEach(eventName, name => {
            removeKeyEventListener(elements, name, eventHandler);
        });
        return;
    }

    // Find the name of the DOMEvent we registered (keydown, keyup)
    const domEventName = eventName.split(".").shift();

    forEach(elements, element => {
        const mappedElement = knownDOMObjects.get(element);
        // We could not find element in our map - this is because we passed the event registration to the normal addEvent method,
        // let's do the same and use removeEvent
        if (!mappedElement) {
            removeEvent(element, domEventName, eventHandler);
            return;
        }

        forEach(mappedElement[eventName], event => {
            if (event) {
                if (eventHandler !== undefined) {
                    let callbackList = mappedElement[eventName];

                    callbackList = filter(callbackList, callbackObject => {
                        if (callbackObject.handler === eventHandler) {
                            // This is the event! Let's unregister it
                            callbackObject.subscription.unsubscribe();
                        }
                        return callbackObject.handler !== eventHandler;
                    });

                    // If there are any callbacks left, store them now, and then return to avoid hitting
                    // the final "remove everything"-block.
                    if (callbackList.length > 0) {
                        mappedElement[event] = callbackList;
                        return;
                    }
                }

                // No more usable event handlers - or the user did not supply a specific event handler to remove,
                // so we assume that all event handlers should be removed.
                event.subscription.unsubscribe();
                delete mappedElement[eventName];
            }
        });
    });
}

/**
 * Removes all KeyEvents from the given Element(s) by invoking the removeKeyEventListener -
 * which in turn takes care of re-delegating to Frontlines Event module if needed.
 *
 * @param {Element|HTMLElement|NodeList|Window|Document} elements
 *
 * @example <caption>Usage</caption>
 * import { removeAllKeyEventListeners } from "./utils/events/keyEvents";
 *
 * removeAllKeyEventListeners(window);
 */
export function removeAllKeyEventListeners(elements) {
    forEach(elements, element => {
        const elementHandlers = knownDOMObjects.get(element);

        if (elementHandlers) {
            forEach(Object.keys(elementHandlers), eventType => {
                if (!elementHandlers[eventType]) {
                    return;
                }

                forEach(elementHandlers[eventType], event => {
                    removeKeyEventListener(element, eventType, event.handler);
                });
            });

            knownDOMObjects.delete(element);
        }
    });
}
