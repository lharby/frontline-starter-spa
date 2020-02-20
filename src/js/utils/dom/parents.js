/**
 * Utility for finding **parents**, closest parent and parent/child relations.
 *
 * @module utils/dom/parents
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

/**
 * Find all parents of an element that match a selector.
 *
 * @param {string} selector - The selector to match.
 * @param {Element} element - The element whose parents we'll be looking for.
 * @param {number|Null} [limit=null] - Set a limit on the amount of parents you want to find.
 * @returns {Element[]} An array of all the parent elements that matched the selector.
 */
export function getAllParents(selector, element, limit = null) {
    const parents = [];
    let iterations = 0;
    let currentElement = element;

    while (
        (currentElement = currentElement.parentElement) &&
        !(currentElement.matches || currentElement.matchesSelector).call(
            currentElement,
            selector
        ) &&
        (!iterations || iterations < limit)
    ) {
        parents.push(currentElement);
        iterations += 1;
    }

    return parents;
}

/**
 * @type {function}
 * @ignore
 * @deprecated
 */
export const allParents = getAllParents;

/**
 * Find the closest parent of an element that matches a selector.
 *
 * @param {string} selector - The selector to match.
 * @param {Element} element - The element whose parent we'll be looking for.
 * @returns {Element|Null} The parent that matched the selector, or **null** if none were found.
 */
export function getClosestParent(selector, element) {
    if (typeof element.closest === "function") {
        return element.closest(selector);
    } else {
        const parent = getAllParents(selector, element, 1);
        return parent.length ? parent[0] : null;
    }
}

/**
 * @type {function}
 * @ignore
 * @deprecated
 */
export const closestParent = getClosestParent;

/**
 * Check if an element is the child or grandchild of another element.
 *
 * @param {Element} child - Check if this is a child...
 * @param {Element} parent - ... of this element.
 * @param {boolean} [immediateOnly=false] - Set to **true** to only look for immediate children.
 * @returns {boolean} **True** if the element is a child of the other element.
 */
export function isElementChildOf(child, parent, immediateOnly = false) {
    return isElementParentTo(parent, child, immediateOnly);
}

/**
 * @type {function}
 * @ignore
 * @deprecated
 */
export const elementIsChildOf = isElementChildOf;

/**
 * Check if an element is the parent or grandparent to another element.
 *
 * @param {Element} parent - Check if this is the parent...
 * @param {Element} child - ... to this element.
 * @param {boolean} [immediateOnly=false] - Set to **true** to only look for immediate parents.
 * @returns {boolean} **True** if the element is a parent to the other element.
 */
export function isElementParentTo(parent, child, immediateOnly = false) {
    return immediateOnly ? child.parentNode === parent : parent.contains(child);
}

/**
 * @type {function}
 * @ignore
 * @deprecated
 */
export const elementIsParentTo = isElementParentTo;
