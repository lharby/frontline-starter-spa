/**
 * Helper-utility for setting, getting and removing cookies.
 *
 * @module utils/cookie
 * @since 3.5.0
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

import { forEach } from "./forEach";

/**
 * These are the properties that can be set in the `attributes` objects of the cookie functions
 *
 * @typedef {Object} CookieAttributes
 * @property {string} [path="/"] - The path that the cookie belongs to.
 * @property {string} [domain] - The domain where the cookie will be visible (.example.com, subdomain.example.com)
 * @property {number|Date} [expires] - The cookies expiration set either as a Date or a number of days from today.
 */

/**
 * Encode cookie name
 *
 * @private
 * @param {string} name - The cookie name that need encoding.
 * @returns {string} The encoded string.
 */
function encodeCookieName(name) {
    return encodeURIComponent(String(name))
        .replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent)
        .replace(/[()]/g, encodeURIComponent);
}

/**
 * Encode cookie value
 *
 * @private
 * @param {string} value - The cookie value that need encoding.
 * @returns {string} The encoded string.
 */
function encodeCookieValue(value) {
    return encodeURIComponent(String(value)).replace(
        /%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g,
        decodeURIComponent
    );
}

/**
 * Decode encoded cookie parts (key/value)
 *
 * @private
 * @param {string} part - The string that need decoding.
 * @returns {string} The decoded string.
 */
function decodeCookieParts(part) {
    return part.replace(/(%[0-9A-Z]{2})+/g, decodeURIComponent);
}

/**
 * Get a cookie or all cookies and parse the value (or not)
 *
 * @param {string} [name] - The name of the cookie. Leave undefined to get all cookies.
 * @param {boolean} [doParseCookie=true] - Set to *false* if you want possible numbers, JSON objects and arrays returned as a string.
 * @returns {string|number|Object|Array|boolean} Cookie value.
 */
export function getCookie(name, doParseCookie = true) {
    // Object for storing cookies
    const cookieJar = {};

    // To prevent the for loop in the first place assign an empty array
    // in case there are no cookies at all.
    const cookies = document.cookie ? document.cookie.split("; ") : [];

    forEach(cookies, cookie => {
        // Search for cookie or loop through all cookies if no name is defined.
        // If the defined cookie name is already found, skip all of this.
        if (!name || typeof cookieJar[name] === "undefined") {
            // Split string into name and value
            const parts = cookie.split("=");
            const cookieName = parts[0];
            let cookieValue = parts.slice(1).join("=");

            // If cookie value is a string and shouldn't be parsed, just remove the surrounding quotes
            if (!doParseCookie && cookieValue.charAt(0) === `"`) {
                cookieValue = cookieValue.slice(1, -1);
            }

            // Decode cookie name and value
            try {
                const decodedName = decodeCookieParts(cookieName);
                cookieValue = decodeCookieParts(cookieValue);

                if (doParseCookie) {
                    // Try parsing cookie
                    try {
                        cookieValue = JSON.parse(cookieValue);
                    } catch (error) {
                        // Cookie value could not be parsed - return unparsed string
                    }
                }

                // Add cookie to cookie jar
                cookieJar[decodedName] = cookieValue;
            } catch (error) {
                // Failed retrieving or decoding cookie - return undefined
            }
        }
    });

    // Return specific cookie if a name is defined - otherwise return all cookies in an object
    return name ? cookieJar[name] : cookieJar;
}

/**
 * Set cookie.
 *
 * @param {string} name - The name of the cookie.
 * @param {string|number|Array|Object} value - The cookie value. **Keep in mind** that this will be converted to a string when saved as a cookie.
 * @param {CookieAttributes} [attributes={}] - Object with additional attributes.
 */
export function setCookie(name, value, attributes = {}) {
    // Changeable variables for name and value
    let cookieName = name;
    let cookieValue = value;

    // If expiration date is set as a number, turn it into a date
    if (typeof attributes.expires === "number") {
        attributes.expires = new Date(
            new Date() * 1 + attributes.expires * 864e5
        ); // 864e+5 = 86400000 ms = 24 hours
    }

    // Set object with attributes
    const cookieAttributes = {
        domain: attributes.domain || "",
        expires: attributes.expires ? attributes.expires.toUTCString() : "",
        path: attributes.path || "/"
    };

    // Turn values supplied as arrays and objects into strings
    try {
        const result = JSON.stringify(cookieValue);
        if (/^[{[]/.test(result)) {
            cookieValue = result;
        }
    } catch (error) {
        // Could not stringify, probably because the value was already a string
    }

    // Encode name and value
    cookieName = encodeCookieName(cookieName);
    cookieValue = encodeCookieValue(cookieValue);

    // Convert attributes to a string
    let attributesString = "";
    for (const attributeName in cookieAttributes) {
        if (!attributes[attributeName]) {
            continue;
        }

        attributesString += `; ${attributeName}`;

        if (attributes[attributeName] === true) {
            continue;
        }

        attributesString += `=${
            String(attributes[attributeName]).split(";")[0]
        }`;
    }

    // Set cookie
    document.cookie = `${cookieName}=${cookieValue + attributesString}`;
}

/**
 * Delete a cookie matching a certain name and attributes.
 * The expiration date will be set to yesterday, which will unset the cookie.
 *
 * @param {string} name - The name of the cookie.
 * @param {CookieAttributes} [attributes={}] - Object with additional attributes.
 */
export function deleteCookie(name, attributes = {}) {
    setCookie(name, "", {
        ...attributes,
        expires: -1
    });
}
