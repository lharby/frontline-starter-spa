/**
 * **Check if an email address is valid.**
 * Or find email addresses in a string and maybe convert them to `mailto:` links.
 *
 * @module utils/patternMatching/email
 * @since 3.6.0
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 *
 * @example
 * import { convertEmailsToLinks } from "./utils/patternMatching/email";
 *
 * element.innerHTML = convertEmailsToLinks("Contact me at mail@example.com.");
 * // This will output "Contact me at <a href="mailto:mail@example.com">mail@example.com</a>."
 */

/**
 * Get a regular expression for validating email addresses,
 * or for finding email addresses in a string (if *global* is set to `true`).
 *
 * @param {boolean} [global=false] **False:** The regex will match against the entire string. **True:** Search a string for email addresses.
 * @returns {RegExp} A regular expression object for validating or finding email addresses.
 */
export function emailRegex(global = false) {
    const letters =
        "a-zA-Z\u0080-\u00FF\u0100-\u017F\u0180-\u024F\u0250-\u02AF\u0300-\u036F\u0370-\u03FF\u0400-\u04FF\u0500-\u052F\u0530-\u058F\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u0780-\u07BF\u07C0-\u07FF\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0D80-\u0DFF\u0E00-\u0E7F\u0E80-\u0EFF\u0F00-\u0FFF\u1000-\u109F\u10A0-\u10FF\u1100-\u11FF\u1200-\u137F\u1380-\u139F\u13A0-\u13FF\u1400-\u167F\u1680-\u169F\u16A0-\u16FF\u1700-\u171F\u1720-\u173F\u1740-\u175F\u1760-\u177F\u1780-\u17FF\u1800-\u18AF\u1900-\u194F\u1950-\u197F\u1980-\u19DF\u19E0-\u19FF\u1A00-\u1A1F\u1B00-\u1B7F\u1D00-\u1D7F\u1D80-\u1DBF\u1DC0-\u1DFF\u1E00-\u1EFF\u1F00-\u1FFF\u20D0-\u20FF\u2100-\u214F\u2C00-\u2C5F\u2C60-\u2C7F\u2C80-\u2CFF\u2D00-\u2D2F\u2D30-\u2D7F\u2D80-\u2DDF\u2F00-\u2FDF\u2FF0-\u2FFF\u3040-\u309F\u30A0-\u30FF\u3100-\u312F\u3130-\u318F\u3190-\u319F\u31C0-\u31EF\u31F0-\u31FF\u3200-\u32FF\u3300-\u33FF\u3400-\u4DBF\u4DC0-\u4DFF\u4E00-\u9FFF\uA000-\uA48F\uA490-\uA4CF\uA700-\uA71F\uA800-\uA82F\uA840-\uA87F\uAC00-\uD7AF\uF900-\uFAFF";
    return new RegExp(
        `${
            global ? "" : "^"
        }(?!\\.)((?!.*\\.{2})[0-9${letters}\\.!#$%&'*+-/=?^_\`{|}~\\-\\d]+)@(?!\\.)([0-9${letters}\\-\\.\\d]+)((\\.([${letters}]){2,63})+)${
            global ? "" : "$"
        }`,
        `${global ? "g" : ""}i`
    );
}

/**
 * Check if an email address is valid.
 *
 * @param {string|HTMLInputElement|Element} email - The email address to validate (as a string or an input element).
 * @returns {boolean} True if the email address is valid.
 *
 * @example
 * import { isEmailValid } from "./utils/patternMatching/email";
 *
 * const emailInput = document.querySelector("form input.email");
 * if (isEmailValid(emailInput)) {
 *     // The entered email address is valid
 * }
 */
export function isEmailValid(email) {
    return emailRegex().test(typeof email === "string" ? email : email.value);
}

/**
 * @type {function}
 * @ignore
 * @deprecated
 */
export const emailIsValid = isEmailValid;

/**
 * Find email addresses in a string.
 *
 * @param {string} string - The string to search for email addresses.
 * @returns {string[]} An array of email addresses.
 *
 * @example
 * import { getEmailsInString } from "./utils/patternMatching/email";
 *
 * const string = "My private email is mail@private.com, but my business email is mail@business.com";
 * const foundEmails = getEmailsInString(string);
 * // This will output ["mail@private.com", "mail@business.com"]
 */
export function getEmailsInString(string) {
    return string.match(emailRegex(true)) || [];
}

/**
 * Find email addresses in a string and convert them to links.
 *
 * @param {string} string - The string to search for email addresses.
 * @param {boolean|string} [subject=false] - Set the subject of the email as a string. If set to *true* the subject will be the page title followed by the URL.
 * @returns {string} The passed string with email addresses converted to mailto-links.
 *
 * @example
 * import { emailRegex } from "./utils/patternMatching/email";
 *
 * const emailInput = document.querySelector("form input.email");
 * if (emailRegex().test(emailInput.value)) {
 *     // The entered email address is valid
 * }
 */
export function convertEmailsToLinks(string, subject = false) {
    const setSubject = !!subject;
    const subjectString = `?subject=${
        typeof subject === "string"
            ? subject
            : `${document.title} @ ${window.location.href}`
    }`;
    return string.replace(
        emailRegex(true),
        match =>
            `<a href="mailto:${match +
                (setSubject ? subjectString : "")}">${match}</a>`
    );
}
