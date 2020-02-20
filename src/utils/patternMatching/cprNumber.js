/**
 * This is a utility with regular expressions and tools for customizing them.
 *
 * @module utils/patternMatching/cprNumber
 * @since 3.6.0
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

import { isDateValid } from "./date";

/**
 * A regular expression for validating the format of a Danish CPR number.
 *
 * Works with the birth date and the four control digits combined or separated by a anything that's not a number.
 *
 * **Be aware** that this does not check if the date is valid.
 *
 * @type {RegExp}
 * @example
 * import { cprRegex } from "./utils/patternMatching/cprNumber";
 *
 * const cpr = "1706862134";
 * const isCprValid = cprRegex.test(cpr); // = true
 */
export const cprRegex = /^(?:(?:31(?:0[13578]|1[02])|(?:30|29)(?:0[13-9]|1[0-2])|(?:0[1-9]|1[0-9]|2[0-8])(?:0[1-9]|1[0-2]))[0-9]{2}[^\d]*[0-9]|290200-?[4-9]|2902(?:(?!00)[02468][048]|[13579][26])-?[0-3])[0-9]{3}$/;

/**
 * Check if a CPR number is valid.
 *
 * Works with the birth date and the four control digits combined or separated by a anything that's not a number.
 *
 * **This also checks if the date is valid,** using Javascript's Date object, which strictly speaking isn't *pattern matching* - it's better.
 *
 * @param {string|HTMLInputElement|Element} cprNumber - The CPR number (as a string or an input element).
 * @param {"f"|"female"|"m"|"male"} [gender] - Check if CPR number is valid according to a specific gender.
 * @returns {boolean} Boolean telling if CPR number is valid.
 *
 * @example
 * import { isCprValid } from "./utils/patternMatching/cprNumber";
 *
 * const cpr = "3002862134";
 * const gender = "female";
 * const cprIsValid = isCprValid(cpr, gender); // = false (date is invalid)
 */
export function isCprValid(cprNumber, gender) {
    const cpr = typeof cprNumber === "string" ? cprNumber : cprNumber.value;

    // Check that the format is correct and that the date is valid
    if (!cprRegex.test(cpr) || !isDateValid(cpr.slice(0, 6))) {
        return false;
    }

    // Should we check if the gender matches the CPR number?
    const checkGender = typeof gender === "string";

    // If not, return true
    if (!checkGender) {
        return true;
    }

    // Otherwise check that the gender matches the CPR number
    const genderLetter = gender.charAt(0).toLowerCase();
    const lastDigit = parseInt(cpr.slice(-1));
    const lastDigitIsEven = lastDigit % 2;

    return !!(
        (genderLetter === "f" && !lastDigitIsEven) ||
        (genderLetter === "m" && lastDigitIsEven)
    );
}

/**
 * @type {function}
 * @ignore
 * @deprecated
 */
export const cprIsValid = isCprValid;
