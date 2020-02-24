/**
 * **Check if a date is valid.**
 * This uses Javascript's Date object, hence it's not really *pattern matching* - but it's better.
 *
 * The date can be passed as an object or a string.
 *
 * When passed as a string, the date needs to be in the format "DDMMYY", "DDMMYYYY"
 * or numbers separated by anything that is not a number, as long as the order is **day, month, year**.
 *
 * E.g.: "170686", "24021994", "19 3 2000", "30/11 year 2018" or "24. 12. '18". Go nuts.
 *
 * @module utils/patternMatching/date
 * @since 3.6.0
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 *
 *
 * @example <caption>Valid dates</caption>
 * import { isDateValid } from "./utils/patternMatching/date";
 * window.console.log(isDateValid("170686")); // = true
 * window.console.log(isDateValid("17. 6. 1986")); // = true
 * window.console.log(isDateValid("6. 17. 1986", true)); // = true
 * window.console.log(isDateValid({
 *     date: 17,
 *     month: 6,
 *     year: 1986,
 * })); // = true
 *
 *
 * @example <caption>Invalid dates</caption>
 * import { isDateValid } from "./utils/patternMatching/date";
 * window.console.log(isDateValid("30021995")); // = false
 * window.console.log(isDateValid("30. 2. 1995")); // = false
 * window.console.log(isDateValid("2. 30. 1995", true)); // = false
 * window.console.log(isDateValid({
 *     date: 30,
 *     month: 2,
 *     year: 1995,
 * })); // = false
 */

/**
 * Function for checking if a date is valid.
 *
 * @param {string|Object} date - The date as an Object or a string.
 * @param {number} [date.date] - The day of the month.
 * @param {number} [date.day] - Synonym for *date*.
 * @param {number} [date.month] - The month (1 to 12).
 * @param {number} [date.year] - The year in two or (preferably) four digits.
 * @param {boolean} [isMonthFirst=false] - If the date is passed as a **string** and as a backwards American date with the month first, set this to true.
 * @returns {Date|boolean} False if the date is invalid, otherwise returns a Date object.
 */
export function isDateValid(date, isMonthFirst = false) {
    const dateObject = {};
    let dateArray = [];

    if (typeof date === "string") {
        dateArray = date.split(/[^0-9]/);
        dateArray = dateArray.filter(item => !!item);

        if (
            dateArray.length === 1 &&
            (dateArray[0].length === 6 || dateArray[0].length === 8)
        ) {
            dateArray = [
                dateArray[0].substr(0, 2),
                dateArray[0].substr(2, 2),
                dateArray[0].substr(4)
            ];
        } else if (dateArray.length !== 3) {
            throw "Invalid date format";
        }
    }

    dateObject.day =
        (dateArray.length
            ? isMonthFirst
                ? Number(dateArray[1])
                : Number(dateArray[0])
            : null) ||
        date.date ||
        date.day;
    dateObject.month =
        (dateArray.length
            ? isMonthFirst
                ? Number(dateArray[0])
                : Number(dateArray[1])
            : null) || date.month;
    dateObject.year = dateArray[2] || String(date.year);

    const validDate = new Date(
        `${dateObject.month} ${dateObject.day} ${dateObject.year}`
    );

    if (
        validDate.getDate() === dateObject.day &&
        validDate.getMonth() === dateObject.month - 1 &&
        String(validDate.getFullYear()).endsWith(dateObject.year)
    ) {
        return validDate;
    } else {
        return false;
    }
}

/**
 * @type {function}
 * @ignore
 * @deprecated
 */
export const dateIsValid = isDateValid;
