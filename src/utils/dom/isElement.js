/**
 * A utility to detect if the given argument is an element or not.
 *
 * @module utils/dom/isElement
 * @author Anders Gissel <anders.gissel@akqa.com>
 */

import { isElement as newIsElement } from "../typeCheckers";

/**
 * Deprecated function since 3.7.0.
 *
 * @see utils/typecheckers
 * @deprecated Moved to `/utils/typecheckers`.
 * @type {isElement}
 */
export const isElement = newIsElement;
