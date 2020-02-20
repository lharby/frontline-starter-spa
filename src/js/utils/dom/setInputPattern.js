/**
 * Set a regular expression as a pattern on an input element.
 *
 * **Patterns do not accept flags/modifiers.** Global, ignoreCase and multiLine will be removed.
 *
 * @module utils/dom/setInputPattern
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 *
 * @example <caption>Basic usage with an imported regex from our pattern matching utilities.</caption>
 * import { setInputPattern } from "./utils/dom/setInputPattern";
 * import { emailRegex } from "./utils/patternMatching/email";
 *
 * const emailInput = document.querySelector("form input.email");
 * setInputPattern(emailInput, emailRegex());
 *
 * @example <caption>Set a pattern for only accepting names with one capital letter followed by one or more lowercase letters.</caption>
 * const nameInput = document.querySelector("form input.name");
 * setInputPattern(nameInput, /^[A-ZÆØÅ][a-zæøå]+$/);
 */

/**
 * Set a regex as a pattern on an input element.
 *
 * @param {HTMLInputElement|Element} inputElement - Input element to set pattern on.
 * @param {RegExp} regex - Regular expression. **Notice** that flags will be removed (global, ignoreCase, multiLine).
 */
export function setInputPattern(inputElement, regex) {
    const pattern = regex
        .toString()
        .match(/\/(?:\n|.)*\//)[0]
        .replace(/^\/|\/$/g, "");

    inputElement.setAttribute("pattern", pattern);
}
