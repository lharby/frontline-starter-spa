/**
 * Methods for detecting browser specific event names.
 *
 * @module utils/events/detectEventName
 * @author Anders Gissel <anders.gissel@akqa.com>
 *
 * @example <caption>Usage with `addEvent` or `addEventOnce`. The lookups are cached, so
 * multiple calls to the same detector will not slow down your code.</caption>
 * import { detectTransitionEndEventName, detectAnimationEndEventName } from "./utils/events/detectEventName";
 * import { addEvent, addEventOnce } from "./utils/events/events";
 *
 * const element = document.getElementById("demo");
 *
 * // Detect every time a CSS transition completes.
 * addEvent(element, detectTransitionEndEventName(), () => window.console.log("Transition ended."));
 *
 * // Detect the first time a CSS animation completes.
 * addEventOnce(element, detectAnimationEndEventName(), () => window.console.log("Animation ended."));
 */

// Internal variables for caching lookups.
let foundTransitionEndEventName = "";
let isTransitionEventLookedUp = false;
let foundAnimationEndEventName = "";
let isAnimationEventLookedUp = false;

/**
 * Detect the name of the "transition end" event name on the current browser, if applicable.
 *
 * @example
 * import { detectTransitionEndEventName } from "./utils/events/detectEventName";
 * detectTransitionEndEventName();
 * // Returns "transitionend", "oTransitionEnd" or "webkitTransitionEnd"
 *
 * @returns {"transitionend"|"oTransitionEnd"|"webkitTransitionEnd"|string}
 */
export function detectTransitionEndEventName() {
    if (!isTransitionEventLookedUp) {
        isTransitionEventLookedUp = true;

        const el = document.createElement("div");

        const transitions = {
            transition: "transitionend",
            OTransition: "oTransitionEnd",
            MozTransition: "transitionend",
            WebkitTransition: "webkitTransitionEnd"
        };

        for (const t in transitions) {
            if (el.style[t] !== undefined) {
                foundTransitionEndEventName = transitions[t];
                return foundTransitionEndEventName;
            }
        }

        return "";
    } else {
        return foundTransitionEndEventName;
    }
}

/**
 * Detect the name of the "animation end" event name on the current browser, if applicable.
 *
 * @example
 * import { detectAnimationEndEventName } from "./utils/events/detectEventName";
 *
 * detectAnimationEndEventName();
 * // Returns "animationend", "oAnimationEnd" or "webkitAnimationEnd"
 *
 * @returns {"animationend"|"oAnimationEnd"|"webkitAnimationEnd"|string}
 */
export function detectAnimationEndEventName() {
    if (!isAnimationEventLookedUp) {
        isAnimationEventLookedUp = true;

        const el = document.createElement("div");

        const animations = {
            animation: "animationend",
            OAnimation: "oAnimationEnd",
            MozAnimation: "animationend",
            WebkitAnimation: "webkitAnimationEnd"
        };

        for (const t in animations) {
            if (el.style[t] !== undefined) {
                foundAnimationEndEventName = animations[t];
                return foundAnimationEndEventName;
            }
        }

        return "";
    } else {
        return foundAnimationEndEventName;
    }
}

/**
 * Detect the name of the "mouse wheel" event name on the current browser, if applicable.
 *
 * @example
 * import { getWheelEventName } from "./utils/events/detectEventName";
 *
 * getWheelEventName();
 * // Returns "wheel", "mousewheel" or "DOMMouseScroll"
 *
 * @returns {"wheel"|"mousewheel"|"DOMMouseScroll"}
 */
export function getWheelEventName() {
    return "onwheel" in document.createElement("div")
        ? "wheel" // Modern browsers support "wheel"
        : document.onmousewheel !== undefined
        ? "mousewheel" // Webkit and IE support at least "mousewheel"
        : "DOMMouseScroll"; // let's assume that remaining browsers are older Firefox
}
