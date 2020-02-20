/**
 * Check if **user agent** is Mobile, Android or Blackberry, and not running on platform Windows, Mac or Linux.
 *
 * @module utils/isMobile
 * @author Casper Andersen <casper.andersen@akqa.com>
 *
 * @example
 * import { isMobile } from "./utils/isMobile";
 * if (isMobile) {
 *     // Take some mobileOnly action...
 * }
 *
 */

/**
 *
 * @type {Boolean}
 */
export const isMobile =
    ((/Mobile|Android|BlackBerry/i.test(window.navigator.userAgent) &&
        !/Win|Mac|Linux/i.test(window.navigator.platform)) ||
    (/Android/i.test(window.navigator.userAgent) &&
        /Linux/i.test(window.navigator.platform)));
