/**
 * Utilities for dealing with **touch events**.
 *
 * @module utils/events/touch
 * @author Dennis Haulund Nielsen <dennis.nielsen@akqa.com>
 */

/**
 * Checks if an event is a touch event.
 * @param {TouchEvent|MouseEvent} event - Event to check
 * @returns {boolean} True if the event is a touch event.
 */
export function isTouchEvent(event) {
    return event.type.indexOf("touch") > -1;
}
