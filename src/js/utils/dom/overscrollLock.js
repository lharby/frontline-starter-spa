/**
 * This module helps you **contain scrolling to a specified DOM element**.
 *
 * Useful for things like dropdowns, typeaheads, codeblocks and modals!
 *
 * It works for both touch and wheel events, but please be considerate if using it on mobile as you
 * generally don't want to hijack the scroll on a touch based device, it's actually pretty annoying,
 * and should be solved through design / ux instead. By default this is not enabled.
 *
 * Uses `RxJS` to simplify event (de)registration and handling (warning: payload size increases).
 *
 *
 * @module utils/dom/overscrollLock
 * @author Dennis Haulund Nielsen <dennis.nielsen@akqa.com>
 *
 */

import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/fromEvent";
import "rxjs/add/observable/merge";
import { getWheelEventName } from "../events/detectEventName";
import { getClientY, getScrollDistance } from "../events/getScrollDistance";

// Maps are awesome, as always make sure to include the required polyfill (default-3.6 or better)
const knownDOMObjects = new Map();

/**
 * KILLS the scroll event preventing propagation and all of that
 *
 * @private
 * @param {TouchEvent|MouseEvent} event
 * @param {boolean} force
 * @returns {boolean}
 */
function killScrollEvent(event, force) {
    // Preventing touchmove disables click events on mobile Safari,
    // so we require user to force it. Not recommended though :)
    if (force || (event.type !== "touchmove" && event.type !== "touchstart")) {
        event.preventDefault();
        event.stopPropagation();
        event.returnValue = false;
        return false;
    }
}

/**
 * When an element reaches the top or bottom scroll position,
 * this method will cancel propagation of the event
 * thus "locking" the scroll to the container.
 *
 * @param {Element|Window} element
 * @param {boolean} [isForMobileToo=false] Enforce scroll lock even on mobile (please don't).
 *
 * @example <caption>To have an element "lock" its scroll:</caption>
 * import { overscrollLock } from "./utils/dom/overscrollLock";
 *
 * const element = document.querySelector(".element");
 * overscrollLock(element);
 *
 *
 * @example <caption>To have an element "lock" its scroll, EVEN on mobile (sad panda):</caption>
 * import { overscrollLock } from "./utils/dom/overscrollLock";
 *
 * const element = document.querySelector(".element");
 * overscrollLock(element);
 */
export function overscrollLock(element, isForMobileToo = false) {
    // startY is our last known "touch start offset top" which we need to determine scroll direction
    let startYPx;

    // Let's set up some cold observables
    const touchStartEvent$ = Observable.fromEvent(element, "touchstart");
    const wheelEvent$ = Observable.fromEvent(element, getWheelEventName());
    const touchMoveEvent$ = Observable.fromEvent(element, "touchmove");

    // We want to run our scrollHandler on both touchMove and the wheel event - yay for the `merge` operator
    const scrollEvents$ = Observable.merge(wheelEvent$, touchMoveEvent$);

    // Update last known "touch start offset top" on touchStart
    touchStartEvent$.subscribe(
        event => (startYPx = getClientY(event, element))
    );

    // Make that observable HOOOT
    const eventSubscription = scrollEvents$.subscribe(event => {
        // We have not reached the end, or the top of the element - let the user continue scrolling
        if (event.isLegitScroll) {
            return true;
        }

        const scrollHeight = element.scrollHeight;
        const apparentHeight = element.offsetHeight;
        const remainingScroll = Math.floor(
            scrollHeight - apparentHeight - element.scrollTop
        );

        // If the element is not scrollable then we just cancel out
        if (scrollHeight <= apparentHeight) {
            if (isForMobileToo && event.type !== "touchstart") {
                return killScrollEvent(event, isForMobileToo);
            }
            return true;
        }

        // We need to know the direction so we now if we need to look at scrollTop or the remainingScroll towards bottom
        // const scrollDirection = getScrollDirection(event, startYPx);
        const scrollDistance = getScrollDistance(event, startYPx);
        const scrollDirection = scrollDistance < 0 ? "down" : "up";

        // Kill that scroll!
        if (scrollDirection === "down" && remainingScroll <= 0) {
            element.scrollTop = scrollHeight;
            return killScrollEvent(event, isForMobileToo);
        } else if (scrollDirection === "up" && element.scrollTop === 0) {
            element.scrollTop = 0;
            return killScrollEvent(event, isForMobileToo);
        }

        // Mark the event as legit - we should continue scrolling
        event.isLegitScroll = true;
    });

    // Reference so we can remove our subscription later
    knownDOMObjects.set(element, eventSubscription);
}

/**
 * Removes the scroll subscription, or ALL scroll subscriptions if no element is passed
 *
 * @param {Element|Window} element
 *
 * @example <caption>To unlock an element:</caption>
 * import { overscrollUnlock } from "./utils/dom/overscrollLock";
 *
 * overscrollUnlock(element);
 *
 *
 * @example <caption>To unlock ALL elements:</caption>
 * import { overscrollUnlock } from "./utils/dom/overscrollLock";
 *
 * overscrollUnlock();
 */
export function overscrollUnlock(element) {
    if (element && knownDOMObjects.has(element)) {
        knownDOMObjects.get(element).unsubscribe();
        delete knownDOMObjects[element];
    } else {
        knownDOMObjects.forEach((subscription, el) => {
            subscription.unsubscribe();
            delete knownDOMObjects[el];
        });
    }
}
