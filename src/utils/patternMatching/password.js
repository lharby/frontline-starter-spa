/**
 * This is a utility for customizing a regular expressions used for validating passwords.
 *
 * @module utils/patternMatching/password
 * @since 3.6.0
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

/**
 * These are the properties that can be set in the `options` objects of the password RegExp generator, that specify your
 * requirements to validate the password.
 *
 * @typedef {Object} PasswordOptions
 * @property {number} [minLength=8] - Minimum length of the password.
 * @property {number} [maxLength] - Maximum length of the password.
 * @property {number} [minDigits=1] - Minimum amount of digits.
 * @property {number} [maxDigits] - Maximum amount of digits.
 * @property {number} [minUppercase=1] - Minimum amount of uppercase letters (A-Z).
 * @property {number} [maxUppercase] - Maximum amount of uppercase letters (A-Z).
 * @property {number} [minLowercase=1] - Minimum amount of lowercase letters (a-z).
 * @property {number} [maxLowercase] - Maximum amount of lowercase letters(a-z).
 * @property {number} [minSpecial=1] - Minimum amount of special characters.
 * @property {number} [maxSpecial] - Maximum amount of special characters.
 * @property {string} [specialChars=" !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~¨"] - All the characters accepted as "special".
 * @property {string} [forbiddenChars=" "] - Forbidden characters.
 * @property {boolean} [acceptUnicode=false] - Set to true to accept unicode characters (*not supported by IE11*)
 */

/**
 * A string containing character generally accepted as "special".
 *
 * This is used in `passwordRegex()` and exported in case you want to add more.
 * In such a case you'll need to import this variable, add or remove characters,
 * and then pass the altered string to the functions `passwordRegex()` or `passwordIsValid()`
 * in the **options** argument as the **specialChars** property.
 *
 * @type {string}
 */
export const specialCharacters = " !\"#$%&'()*+,./:;<=>?@[]\\^_`{|}~¨-";

/**
 * Generate a regular expression to validate passwords with.
 *
 * Define your requirements for a valid password by setting the following parameters.
 *
 * @param {PasswordOptions} [options={}] - Options that specify your requirements to validate the password.
 * @returns {RegExp} A regular expression that suits your needs.
 *
 * @example
 * import { passwordRegex } from "./utils/patternMatching/password";
 * import { setInputPattern } from "./utils/dom/setInputPattern";
 *
 * const passwordInput = document.querySelector("input.password");
 *
 * setInputPattern(passwordInput, passwordRegex({
 *     minLength: 10,
 *     minUppercase: 2,
 * }));
 */
export function passwordRegex(options = {}) {
    const passwordOptions = {
        minLength: 8,
        maxLength: undefined,
        minDigits: 1,
        maxDigits: undefined,
        minLowercase: 1,
        maxLowercase: undefined,
        minUppercase: 1,
        maxUppercase: undefined,
        minSpecial: 1,
        maxSpecial: undefined,
        specialChars: specialCharacters,
        forbiddenChars: " ",
        acceptUnicode: false,
        ...options
    };

    const hasMaxLength = typeof passwordOptions.maxLength === "number";
    const hasMaxDigits = typeof passwordOptions.maxDigits === "number";
    const hasMaxLowercase = typeof passwordOptions.maxLowercase === "number";
    const hasMaxUppercase = typeof passwordOptions.maxUppercase === "number";
    const hasMaxSpecial = typeof passwordOptions.maxSpecial === "number";

    const lowercaseLetters = passwordOptions.acceptUnicode
        ? "\\p{Ll}"
        : "[a-z]";
    const uppercaseLetters = passwordOptions.acceptUnicode
        ? "\\p{Lu}"
        : "[A-Z]";
    const specialChars = passwordOptions.specialChars.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );

    return new RegExp(
        `^${
            passwordOptions.forbiddenChars
                ? `(?!(?:.*[${passwordOptions.forbiddenChars}].*){1,})`
                : ""
        }(?=(?:.*${lowercaseLetters}.*){${passwordOptions.minLowercase}${
            !hasMaxLowercase ? "," : ""
        }})${
            hasMaxLowercase
                ? `(?!(?:.*${lowercaseLetters}.*){${passwordOptions.maxLowercase +
                      1},})`
                : ""
        }(?=(?:.*${uppercaseLetters}.*){${passwordOptions.minUppercase}${
            !hasMaxUppercase ? "," : ""
        }})${
            hasMaxUppercase
                ? `(?!(?:.*${uppercaseLetters}.*){${passwordOptions.maxUppercase +
                      1},})`
                : ""
        }(?=(?:.*\\d.*){${passwordOptions.minDigits}${
            !hasMaxDigits ? "," : ""
        }})${
            hasMaxDigits
                ? `(?!(?:.*\\d.*){${passwordOptions.maxDigits + 1},})`
                : ""
        }(?=(?:.*[${specialChars}].*){${passwordOptions.minSpecial}${
            !hasMaxSpecial ? "," : ""
        }})${
            hasMaxSpecial
                ? `(?!(?:.*[${specialChars}].*){${passwordOptions.maxSpecial +
                      1},})`
                : ""
        }.{${passwordOptions.minLength},${
            hasMaxLength ? passwordOptions.maxLength : ""
        }}$`,
        passwordOptions.acceptUnicode ? "u" : ""
    );
}

/**
 * Generate a regular expression to validate passwords with.
 *
 * Define your requirements for a valid password by setting the following parameters.
 *
 * @param {string|HTMLInputElement|Element} password - The password that needs to be validated (as a string or an input element).
 * @param {PasswordOptions} [options={}] - Options that specify your requirements to validate the password.
 * @returns {boolean} True if the password is valid, otherwise false.
 *
 * @example
 * import { isPasswordValid } from "./utils/patternMatching/password";
 *
 * const passwordInput = document.querySelector("input.password");
 * const passwordValidates = isPasswordValid(passwordInput.value, {
 *     minLength: 10,
 *     minUppercase: 2,
 * });
 *
 * if (passwordValidates) {
 *     // Password is valid
 * }
 */
export function isPasswordValid(password, options) {
    return passwordRegex(options).test(
        typeof password === "string" ? password : password.value
    );
}

/**
 * @type {function}
 * @ignore
 * @deprecated
 */
export const passwordIsValid = isPasswordValid;
