/**
 * A utility for converting between different types of temperatures.
 * Convert Celsius to Fahrenheit, Kelvin, Newton, Rankine, Delisle, Réaumur, Rømer - and back again.
 *
 * Fahrenheit is used in USA and very few other smaller countries;
 * but also unofficially by some elder citizens in Canada and (to a lesser extent) Great Britain.
 *
 * Kelvin is mainly used in physics and chemistry, since formulas concerning temperatures become simpler
 * when using Kelvin instead of Celsius or Fahrenheit. The Kelvin scale starts at absolute zero,
 * where all thermal motion ceases.
 *
 * @module utils/calc/temperature
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 *
 */

/**
 * Convert Celsius to Fahrenheit.
 *
 * @example
 * import { celsiusToFahrenheit } from "./utils/calc/temperature";
 * const fahrenheit = celsiusToFahrenheit(100); // = 212
 *
 * @param {Number} celsius - A temperature in Celsius
 * @returns {Number}
 */
export function celsiusToFahrenheit(celsius) {
    return (celsius * 9) / 5 + 32;
}

/**
 * Convert Fahrenheit to Celsius.
 *
 * @example
 * import { fahrenheitToCelsius } from "./utils/calc/temperature";
 * const celsius = fahrenheitToCelsius(212); // = 100
 *
 * @param {Number} fahrenheit - A temperature in Fahrenheit
 * @returns {Number}
 */
export function fahrenheitToCelsius(fahrenheit) {
    return (fahrenheit - 32) * (5 / 9);
}

/**
 * Convert Celsius to Kelvin.
 *
 * @example
 * import { celsiusToKelvin } from "./utils/calc/temperature";
 *
 * const kelvin = celsiusToKelvin(100); // = 373.15
 *
 * @param {Number} celsius - A temperature in Celsius
 * @returns {Number}
 */
export function celsiusToKelvin(celsius) {
    return celsius + 273.15;
}

/**
 * Convert Kelvin to Celsius.
 *
 * @example
 * import { kelvinToCelsius } from "./utils/calc/temperature";
 * const celsius = kelvinToCelsius(373.15); // = 100
 *
 * @param {Number} kelvin - A temperature in Kelvin
 * @returns {Number}
 */
export function kelvinToCelsius(kelvin) {
    return kelvin - 273.15;
}

/**
 * Convert Celsius to Rankine.
 *
 * @example
 * import { celsiusToRankine } from "./utils/calc/temperature";
 * const rankine = celsiusToRankine(10); // = 509.67
 *
 * @param {Number} celsius - A temperature in Celsius
 * @returns {Number}
 */
export function celsiusToRankine(celsius) {
    return celsiusToFahrenheit(celsius) + 459.67;
}

/**
 * Convert Rankine to Celsius.
 *
 * @example
 * import { rankineToCelsius } from "./utils/calc/temperature";
 * const celsius = rankineToCelsius(); // = 10
 *
 * @param {Number} rankine - A temperature in Rankine
 * @returns {Number}
 */
export function rankineToCelsius(rankine) {
    return fahrenheitToCelsius(rankine - 459.67);
}

/**
 * Convert Celsius to Delisle.
 *
 * @example
 * import { celsiusToDelisle } from "./utils/calc/temperature";
 * const delisle = celsiusToDelisle(100); // = 0
 *
 * @param {Number} celsius - A temperature in Celsius
 * @returns {Number}
 */
export function celsiusToDelisle(celsius) {
    return ((100 - celsius) * 3) / 2;
}

/**
 * Convert Delisle to Celsius.
 *
 * @example
 * import { delisleToCelsius } from "./utils/calc/temperature";
 * const celsius = delisleToCelsius(0); // = 100
 *
 * @param {Number} delisle - A temperature in Delisle
 * @returns {Number}
 */
export function delisleToCelsius(delisle) {
    return 100 - delisle * (2 / 3);
}

/**
 * Convert Celsius to Newton.
 *
 * @example
 * import { celsiusToNewton } from "./utils/calc/temperature";
 * const celsius = newtonToCelsius(33); // = 100
 *
 * @param {Number} celsius - A temperature in Celsius
 * @returns {Number}
 */
export function celsiusToNewton(celsius) {
    return (celsius * 33) / 100;
}

/**
 * Convert Newton to Celsius.
 *
 * @example
 * import { newtonToCelsius } from "./utils/calc/temperature";
 * const celsius = newtonToCelsius(33); // = 100
 *
 * @param {Number} newton - A temperature in Newton
 * @returns {Number}
 */
export function newtonToCelsius(newton) {
    return newton * (100 / 33);
}

/**
 * Convert Celsius to Reaumur.
 *
 * @example
 * import { celsiusToReaumur } from "./utils/calc/temperature";
 * const reaumur = celsiusToReaumur(100); // = 80
 *
 * @param {Number} celsius - A temperature in Celsius
 * @returns {Number}
 */
export function celsiusToReaumur(celsius) {
    return (celsius * 4) / 5;
}

/**
 * Convert Reaumur to Celsius.
 *
 * @example
 * import { reaumurToCelsius } from "./utils/calc/temperature";
 * const celsius = reaumurToCelsius(80); // = 100
 *
 * @param {Number} reaumur - A temperature in Reaumur
 * @returns {Number}
 */
export function reaumurToCelsius(reaumur) {
    return reaumur * (5 / 4);
}

/**
 * Convert Celsius to Roemer.
 *
 * @example
 * import { celsiusToRoemer } from "./utils/calc/temperature";
 * const roemer = celsiusToRoemer(100); // = 60
 *
 * @param {Number} celsius - A temperature in Celsius
 * @returns {Number}
 */
export function celsiusToRoemer(celsius) {
    return celsius * (21 / 40) + 7.5;
}

/**
 * Convert Roemer to Celsius.
 *
 * @example
 * import { roemerToCelsius } from "./utils/calc/temperature";
 * const celsius = roemerToCelsius(60); // = 100
 *
 * @param {Number} roemer - A temperature in Roemer
 * @returns {Number}
 */
export function roemerToCelsius(roemer) {
    return (roemer - 7.5) * (40 / 21);
}
