/**
 * Dispatch a **custom event** on the given HTML element. Similar to jQuery's `.trigger()`.
 *
 * @module utils/events/triggerCustomEvent
 * @author Anders Gissel <anders.gissel@akqa.com>
 *
 * @example <caption>Trigger an event on an element</caption>
 * import { triggerCustomEvent } from "./utils/events/triggerCustomEvent";
 *
 * const target = document.querySelector("button");
 *
 * triggerCustomEvent(target, "click");
 *
 *
 * @example <caption>Trigger an event on an element and send along data as well.</caption>
 * import { triggerCustomEvent } from "./utils/events/triggerCustomEvent";
 *
 * const target = document.querySelector("button");
 *
 * addEvent(target, "my-own-event", dataObject => { ... });
 * triggerCustomEvent(target, "my-own-event", { dataKey: "data value" });
 */

import { forEach } from "../forEach";

if (document.documentMode && document.documentMode <= 11) {
    // "new CustomEvent()" is broken in IE, apparently. However, this polyfill/hack works.
    // See http://stackoverflow.com/a/26596324
    (function() {
        function CustomEvent(event, params) {
            const useParams = params || {
                bubbles: false,
                cancelable: false,
                detail: undefined
            };
            const customEvent = document.createEvent("CustomEvent");
            customEvent.initCustomEvent(
                event,
                useParams.bubbles,
                useParams.cancelable,
                useParams.detail
            );
            return customEvent;
        }

        CustomEvent.prototype = window.Event.prototype;

        window.CustomEvent = CustomEvent;
    })();
}

/**
 * Trigger a custom event on an element.
 *
 * @param {Element|Element[]|Document|Window|NodeList} target - The element(s) to fire the event on.
 * @param {string} eventName - Name of the custom event, ie. `"akqa:my-custom-event"`.
 * @param {object} [eventData] - Optional object of data to send along to the event handler.
 */
export function triggerCustomEvent(target, eventName, eventData = {}) {
    forEach(target, element => {
        let event;

        if (window.CustomEvent) {
            event = new CustomEvent(eventName, {
                detail: eventData,
                bubbles: true,
                cancelable: true
            });
        } else {
            event = document.createEvent("CustomEvent");
            event.initCustomEvent(eventName, true, true, eventData);
        }

        element.dispatchEvent(event);
    });
}
