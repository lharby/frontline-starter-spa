/**
 * Helper-utilities for inserting, moving and emptying DOM-elements.
 *
 * When inserting elements, they are first added to a document fragment, keeping the repainting and
 * recalculating of the DOM to a minimum.
 *
 * These have also been tested to be way faster than solutions using `innerHTML` and `insertAdjecentHTML`.
 *
 * @module utils/dom/elementManipulation
 * @since 3.6.0
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

import { getSiblings } from "./siblings";
import { forEach } from "../forEach";
import { createElement } from "./createElement";

/**
 * Parse a string into an array of DOM nodes.
 *
 * @since 3.6.5
 * @param {Node|string} input - String to parse. If input is already a node or an element, nothing will be done to it.
 * @returns {Node[]} An array of DOM nodes.
 *
 * @example
 * import { parseHTML } from "./utils/dom/elementManipulation";
 *
 * const HTMLString = "An example with <b>text</b> and <i>HTML</i>...";
 * const nodes = parseHTML(HTMLString);
 *
 * const nodeNames = nodes.map(node => node.nodeName);
 * // Outputs ["#text", "B", "#text", "I", "#text"]
 *
 * const textOnly = nodes.map(node => node.nodeName === "#text" ? node.textContent : "").join("");
 * // Outputs "An example with  and ..."
 *
 * const htmlOnly = nodes.map(node => node.nodeName !== "#text" ? node.outerHTML : "").join("");
 * // Outputs "<b>HTML</b><i>stuff</i>"
 */
export const parseHTML = input =>
    typeof input === "string"
        ? Array.from(createElement("div", { html: input }).childNodes)
        : [input];

/**
 * Delete an element from the DOM.
 *
 * @param {Node|Node[]|NodeList} element - Element(s) to delete.
 */
export function deleteElement(element) {
    forEach(element, currentElement =>
        currentElement.parentNode
            ? currentElement.parentNode.removeChild(currentElement)
            : null
    );
}

/**
 * **Append an element** (or multiple) inside another element, which means it will be placed as the last child.
 *
 * @param {Node|NodeList|string|Array.<(Node|string)>} element - The element(s) to append.
 * @param {Node} container - Append the element inside this container.
 */
export function appendElement(element, container) {
    const fragment = document.createDocumentFragment();

    // Use createTextNode() before appending text to fragment
    forEach(element, currentElement =>
        fragment.appendChild(
            typeof currentElement === "string"
                ? document.createTextNode(currentElement)
                : currentElement
        )
    );

    container.appendChild(fragment);
}

/**
 * **Prepend an element** (or multiple) inside another element, which means it will be placed as the first child.
 *
 * @param {Node|NodeList|string|Array.<(Node|string)>} element - The element(s) to prepend.
 * @param {Node} container - Prepend the element inside this container.
 */
export function prependElement(element, container) {
    const fragment = document.createDocumentFragment();
    let lastInsertedElement;

    forEach(element, currentElement => {
        // Make sure strings are converted to text nodes before moving on
        const node =
            typeof currentElement === "string"
                ? document.createTextNode(currentElement)
                : currentElement;

        if (lastInsertedElement) {
            insertElementAfter(node, lastInsertedElement);
        } else if (fragment.firstChild) {
            insertElementBefore(node, fragment.firstChild);
        } else {
            fragment.appendChild(node);
        }

        lastInsertedElement = node;
    });

    if (container.firstChild) {
        insertElementBefore(fragment, container.firstChild);
    } else {
        appendElement(fragment, container);
    }
}

/**
 * Insert one or more elements **after** another element.
 *
 * @param {Node|NodeList|string|Array.<(Node|string)>} newElement - The element(s) to insert after another.
 * @param {Node} existingElement - The existing element to insert after.
 */
export function insertElementAfter(newElement, existingElement) {
    const parent = existingElement.parentNode;

    if (parent) {
        const fragment = document.createDocumentFragment();
        let lastInsertedElement;

        forEach(newElement, currentElement => {
            // Make sure strings are converted to text nodes before moving on
            const node =
                typeof currentElement === "string"
                    ? document.createTextNode(currentElement)
                    : currentElement;

            if (lastInsertedElement) {
                fragment.insertBefore(node, lastInsertedElement.nextSibling);
            } else {
                fragment.appendChild(node);
            }

            lastInsertedElement = node;
        });

        parent.insertBefore(fragment, existingElement.nextSibling);
    }
}

/**
 * Insert one or more elements **before** another element.
 *
 * @param {Node|NodeList|string|Array.<(Node|string)>} newElement - The element(s) to insert before another.
 * @param {Node} existingElement - The existing element to insert before.
 */
export function insertElementBefore(newElement, existingElement) {
    const fragment = document.createDocumentFragment();

    // Use createTextNode() before inserting text into fragment
    forEach(newElement, currentElement =>
        fragment.appendChild(
            typeof currentElement === "string"
                ? document.createTextNode(currentElement)
                : currentElement
        )
    );

    existingElement.parentNode.insertBefore(fragment, existingElement);
}

/**
 * **Swap two elements** with each other.
 *
 * @param {Node} element1 - This will be replaced with `element2`
 * @param {Node} element2 - This will be replaced with `element1`
 */
export function swapElements(element1, element2) {
    // Remember the location of element2
    const parent2 = element2.parentNode;
    const next2 = element2.nextSibling;

    // If element1 is the next sibling of element2
    if (next2 === element1) {
        parent2.insertBefore(element1, element2);
    }

    // Otherwise, insert element2 right before element1
    else {
        element1.parentNode.insertBefore(element2, element1);

        // And now insert element1 where element2 was
        if (next2) {
            // If there was an element after element2, then insert element1 right before that
            parent2.insertBefore(element1, next2);
        } else {
            // Otherwise, just append as last child
            parent2.appendChild(element1);
        }
    }
}

/**
 * **Replace an element** with another one.
 *
 * @param {Node} oldElement - The existing element to be replaced.
 * @param {Node} newElement - The new element to take its place.
 */
export function replaceElement(oldElement, newElement) {
    insertElementAfter(newElement, oldElement);
    oldElement.parentElement.removeChild(oldElement);
}

/**
 * **Wrap an element** in a new element.
 *
 * @param {Node} existingElement - The existing element, which is about to be wrapped.
 * @param {Node} newWrapper - The new element which the existing one should be wrapped inside.
 *
 * @example
 * import { wrapElement } from "./utils/dom/elementManipulation";
 * import { createElement } from "./utils/dom/createElement";
 *
 * const newWrapper = createElement("div", { className: "wrapper" });
 * const wrapThis = document.getElementById("wrapThis");
 *
 * wrapElement(wrapThis, newWrapper);
 */
export function wrapElement(existingElement, newWrapper) {
    existingElement.parentNode.insertBefore(newWrapper, existingElement);
    newWrapper.appendChild(existingElement);
}

/**
 * **Inner wrap an element** in a new element.
 *
 * Actually, the children are what will be wrapped.
 *
 * @param {Node} existingElement - The existing element, which is about have its children wrapped.
 * @param {Node} newWrapper - The new element which the existing one should be wrapped inside.
 */
export function wrapInnerElement(existingElement, newWrapper) {
    while (existingElement.childNodes.length > 0) {
        newWrapper.appendChild(existingElement.childNodes[0]);
    }

    appendElement(newWrapper, existingElement);
}

/**
 * **Unwrap an element** by moving said element out on its parent and deleting the parent.
 *
 * @param {Node} element - The element to unwrap.
 * @param {boolean} [keepSiblings=true] - The element to unwrap.
 *
 * @example
 * import { unwrapElement } from "./utils/dom/elementManipulation";
 * const unwrapThis = document.getElementById("unwrapThis");
 * wrapElement(unwrapThis);
 * // The element just lost its parent and now lives with its grandparent.
 */
export function unwrapElement(element, keepSiblings = true) {
    const parent = element.parentElement;

    if (keepSiblings) {
        const allSiblings = getSiblings(element, true);
        forEach(allSiblings, sibling => insertElementBefore(sibling, parent));
        deleteElement(parent);
    } else {
        replaceElement(parent, element);
    }
}

/**
 * Empty one or more elements by removing all children.
 *
 * This is more than 75% faster than `innerHTML = ""` according to performance tests on jsPerf.com.
 *
 * @param {Node|Node[]|NodeList} element - The element(s) to be emptied.
 */
export function emptyElement(element) {
    forEach(element, currentElement => {
        while (currentElement.firstChild) {
            currentElement.removeChild(currentElement.firstChild);
        }
    });
}
