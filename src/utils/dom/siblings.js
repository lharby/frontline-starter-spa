/**
 * Utility to get **all the siblings** for the given DOM-element, or a subset thereof.
 *
 * @module utils/dom/siblings
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

import { forEach } from "../forEach";

/**
 * Get all siblings of element, or a subset thereof.
 *
 * @param {Node} element - The target element.
 * @param {Boolean} [includeOriginalElement=false] - Set to true to include the original element among the siblings
 * @param {Node|Null} [fromElement=null] - Return the siblings starting at this element
 * @param {Node|Null} [untilElement=null] - Return the siblings stopping at this element
 * @returns {Node[]} Array of elements that are siblings to the given element.
 */
export function getSiblings(
    element,
    includeOriginalElement = false,
    fromElement = null,
    untilElement = null
) {
    if (includeOriginalElement && !fromElement && !untilElement) {
        // Return array including the original element and all its siblings
        return Array.from(element.parentNode.children);
    } else {
        const siblings = [];

        // Set the element to start looking for siblings from
        let nextElement = fromElement || element.parentNode.firstElementChild;

        do {
            const currentElement = nextElement;
            const sameAsOriginalElement = element === currentElement;

            // Set next element to look at
            nextElement = nextElement.nextElementSibling;

            // Add this element to the list of sibling
            // unless it is the same as the original element (and this should be left out)
            if (!sameAsOriginalElement || includeOriginalElement) {
                siblings.push(currentElement);
            }

            // Stop looking for siblings, if the loop is set to stop at the current element
            if (currentElement === untilElement) {
                break;
            }
        } while (nextElement);

        // Return array of elements
        return siblings;
    }
}

/**
 * @type {function}
 * @ignore
 * @deprecated
 */
export const siblings = getSiblings;

/**
 * Get all the siblings **after** the given element.
 *
 * @param {Node} element - The target element.
 * @param {Boolean} [includeOriginalElement=false] - Set to true to include the original element among the siblings
 * @returns {Node[]} An array containing the elements following the given element (and possibly the element itself).
 */
export function getNextSiblings(element, includeOriginalElement = false) {
    return getSiblings(element, includeOriginalElement, element);
}

/**
 * @type {function}
 * @ignore
 * @deprecated
 */
export const nextSiblings = getNextSiblings;

/**
 * Get previous siblings of element
 *
 * @param {Node} element - The target element.
 * @param {Boolean} [includeOriginalElement=false] - Set to true to include the original element among the siblings
 * @returns {Node[]} An array containing the elements preceding the given element (and possibly the element itself).
 */
export function getPreviousSiblings(element, includeOriginalElement = false) {
    return getSiblings(element, includeOriginalElement, null, element);
}

/**
 * @type {function}
 * @ignore
 * @deprecated
 */
export const previousSiblings = getPreviousSiblings;

/**
 * Check if two elements are siblings.
 *
 * @param {Element} element1 - Check if this is a sibling to element2.
 * @param {Element} element2 - Check if this is a sibling to element1.
 * @param {boolean} [adjacentOnly=false] - Set this to **true** to only looks for adjacent siblings (meaning just before or after).
 * @returns {boolean} **True** if the element is a parent to the other element.
 */
export function areElementsSiblings(element1, element2, adjacentOnly = false) {
    if (adjacentOnly) {
        return (
            element1.nextElementSibling === element2 ||
            element1.previousElementSibling === element2
        );
    } else {
        // We'll start off with assuming that the elements aren't siblings, since most aren't
        let siblingsCheck = false;

        // Get siblings of element1
        const siblingElements = getSiblings(element1);

        // Loop though siblings and check if any of them are element2
        forEach(siblingElements, sibling =>
            sibling === element2 ? (siblingsCheck = true) : null
        );

        // If element2 wasn't found amongst element1's children, return false
        return siblingsCheck;
    }
}

/**
 * @type {function}
 * @ignore
 * @deprecated
 */
export const elementsAreSiblings = areElementsSiblings;
