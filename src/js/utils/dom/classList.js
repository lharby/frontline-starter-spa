/**
 * A classlist "polyfill" and utility tool.
 *
 * Native classlist cannot be polyfilled properly on IE10 and IE11, since they support the basic functions but
 * do not have support for `toggle`, for example. This file provides working classList implementation, with
 * hacks to make everything work in IE9 and below as well. However, the usual perks of Frontline are available
 * as well, which allows you to add several classes at once, to several elements at once.
 *
 * When importing, please use the `addClass`, `removeClass`, `toggleClass` and `hasClass` names,
 * because they're much easier to understand without having to alias them.
 *
 * @module utils/dom/classList
 * @author Nicolaj Lund Hummel
 * @author Anders Gissel <anders.gissel@akqa.com>
 * @example <caption>Basic usage:</caption>
 * import { addClass, removeClass } from "./utils/dom/classList";
 *
 * const element = document.querySelector(".anElement");
 * addClass(element, "someClass someOtherClass");
 * removeClass(element, "anotherClass");
 */

import { forEach } from "../forEach";
import { splitter } from "../splitter";

/**
 * This function adds a class to the given element.
 * Checking for classList since this isn't supported in IE9 / IE8
 *
 * @param {Element|Element[]|NodeList} input
 * @param {string|string[]} classNames
 */
export function addClass(input, classNames) {
    forEach(input, element => {
        splitter(classNames, className => {
            if (element.classList) {
                element.classList.add(className);
            } else {
                element.className += ` ${className}`;
            }
        });
    });
}

/**
 * @type {function}
 * @ignore
 * @deprecated
 */
export const add = addClass;

/**
 * This function checks if given element has the class specified.
 * Checking for classList since this isn't supported in IE9 / IE8.
 * This function does NOT support nodelists or arrays.
 *
 * @param {Element} element
 * @param {string} className
 * @returns {boolean}
 */
export function hasClass(element, className) {
    if (element && (element.classList || element.className)) {
        if (element.classList) {
            return element.classList.contains(className);
        } else {
            return new RegExp(`(^| ) ${className}( |$)`, "gi").test(
                element.className
            );
        }
    }

    return false;
}

/**
 * @type {function}
 * @ignore
 * @deprecated
 */
export const contains = hasClass;

/**
 * This function removes a class from the given element.
 * Checking for classList since this isn't supported in IE9 / IE8
 *
 * @param {Element|Element[]|NodeList} input
 * @param {string|string[]} classNames
 */
export function removeClass(input, classNames) {
    forEach(input, element => {
        splitter(classNames, className => {
            if (element.classList) {
                element.classList.remove(className);
            } else {
                element.className = element.className.replace(
                    new RegExp(
                        `(^|\\b)${className.split(" ").join("|")}(\\b|$)`,
                        "gi"
                    ),
                    " "
                );
            }
        });
    });
}

/**
 * @type {function}
 * @ignore
 * @deprecated
 */
export const remove = removeClass;

/**
 * Toggle a class.
 *
 * @param {Element|Element[]|NodeList} input - The HTML element to work with
 * @param {string|string[]} classNames - The class name(s) we'll be toggling
 * @param {boolean} [condition] - Optional condition. If set to true or false, the toggle will use the given value to add or remove the class. If undefined, a regular toggle will be performed.
 */
export function toggleClass(input, classNames, condition) {
    forEach(input, element => {
        splitter(classNames, className => {
            let classShouldBeIncluded;
            const classIsIncludedAlready = hasClass(element, className);

            // If a condition is given, we'll use that to figure out if the class should be added or not.
            if (condition !== undefined) {
                // We'll only continue if the condition doesn't match the current state. So we'll only remove the
                // class if it added already and the condition is "false", and vice versa.
                if (condition !== classIsIncludedAlready) {
                    classShouldBeIncluded = condition;
                }
            } else {
                // No condition was given, so we'll just toggle the class.
                classShouldBeIncluded = !classIsIncludedAlready;
            }

            // Only continue if a new mode is defined. Otherwise there's no point.
            if (classShouldBeIncluded !== undefined) {
                if (classShouldBeIncluded) {
                    addClass(element, className);
                } else {
                    removeClass(element, className);
                }
            }
        });
    });
}

/**
 * @type {function}
 * @ignore
 * @deprecated
 */
export const toggle = toggleClass;
