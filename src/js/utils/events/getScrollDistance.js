/**
 * Utility to get the scrolled distance from an object.
 *
 * @module utils/events/getScrollDistance
 * @author Dennis Haulund Nielsen <dennis.nielsen@akqa.com>
 */

import { isTouchEvent } from "./touch";

/**
 * Get the current Y-position of the given event, or the element if the event isn't a touch event.
 *
 * @param {TouchEvent|MouseEvent} event
 * @param {Element|window} [element]
 * @returns {number} Elements vertical scroll offset
 */
export function getClientY(event, element = window) {
    if (isTouchEvent(event)) {
        return event.changedTouches[0].clientY;
    } else {
        return element.scrollTop;
    }
}

/**
 * Returns a guess on the scroll distance relative to startY, if it's a mouse event its pretty easy as we have a wheelDelta,
 * but for touch it's more complicated, and we have to rely on the startYPx ("last known offset") and the current offset.
 *
 * @param {TouchEvent|MouseEvent} event
 * @param {number} startYPx - Last known offset
 * @returns {number} Scroll distance - negative is down, positive up
 */
export function getScrollDistance(event, startYPx) {
    let delta;

    if (!isTouchEvent(event)) {
        const d = event.wheelDelta || -1 * event.detail || -1 * event.deltaY;
        delta = Math.max(-1, Math.min(1, d));
    } else {
        const val = getClientY(event);
        delta = Math.max(-1, Math.min(1, val - startYPx));
    }

    return delta;
}
