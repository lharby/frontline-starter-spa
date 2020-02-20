/**
 * Tools for calculating with coordinates.
 *
 * @module utils/calc/coordinates
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

import { degreesToRadians, radiansToDegrees } from "./radians";
import { forEach } from "../forEach";
import { isArray } from "../typeCheckers";

/**
 * @typedef {Object} XYCoordinatesObject
 * @property {number} x - The position on the x-axis.
 * @property {number} y - The position on the y-axis.
 */

/**
 * @typedef {Object} LatLngCoordinatesObject
 * @property {number} lat - Latitude. The position on the x-axis.
 * @property {number} lng - Longitude. The position on the y-axis.
 */

/**
 * Get the distance between two sets of coordinates.
 *
 * @param {Number[]|XYCoordinatesObject} from - From coordinates `[x, y]` or `{ x: 100, y: 100 }`
 * @param {Number[]|XYCoordinatesObject} to - To coordinates `[x, y]` or `{ x: 100, y: 100 }`
 * @returns {Number} The distance between the two coordinates.
 */
export function getDistance(from, to) {
    const fromCoord = isArray(from) ? from : [from.x, from.y];
    const toCoord = isArray(to) ? to : [to.x, to.y];
    return Math.sqrt(
        Math.pow(toCoord[0] - fromCoord[0], 2) +
            Math.pow(toCoord[1] - fromCoord[1], 2)
    );
}

/**
 * Get the all the distances between multiple sets of coordinates sorted from shortest to longest.
 *
 * The coordinates are given as arrays `[x, y]` or objects like `{ x: 100, y: 100 }`.
 * You can add other values and properties as long as the first two values in the array are x and y, or as long as the
 * objects have the properties "x" and "y".
 *
 * The first argument `fromCoordinates` is the base from where the distances are measured. If this is set to `null`,
 * distances will be measured between all the coordinates given in the `toCoordinates` argument.
 *
 * @since 3.6.7
 * @param {XYCoordinatesObject|Object|Array|Null} fromCoordinates - The "base" coordinates to calculate distances from. Set this to `null` to get all possible distances between all of the following coordinates.
 * @param {...(XYCoordinatesObject|Object|Array)} toCoordinates - Multiple sets of coordinates as `[x, y]` or `{ x: 100, y: 100 }`
 * @returns {Object[]} All the distances along with the relevant coordinates like you entered them.
 *
 * @example <caption>Find all the distances from `[9, 30]` to other coordinates.</caption>
 * import { getAllDistances } from "./utils/calc/coordinates";
 * getAllDistances([9, 30], [10, 2], [20, 20], [-20, 20]);
 *
 * // This returns the following array of objects:
 * [
 *     {
 *         "distance": 14.866068747318506,
 *         "coordinates": [[9, 30], [20, 20]]
 *     }, {
 *         "distance": 28.0178514522438,
 *         "coordinates": [[9, 30], [10, 2]]
 *     },
 *     {
 *         "distance": 30.675723300355934,
 *         "coordinates": [[9, 30], [-20, 20]]
 *     }
 * ]
 *
 * @example <caption>Find all the distances between all the coordinates.</caption>
 * import { getAllDistances } from "./utils/calc/coordinates";
 * getAllDistances(null,
 *     { x: -10, y: -10, name: "a" },
 *     { x: 1, y: 1, name: "b" },
 *     { x: 2, y: 2, name: "c" },
 *     { x: 30, y: 50, name: "d" }
 * );
 *
 * // This returns the following array of objects:
 * [
 *     {
 *         "distance": 1.4142135623730951,
 *         "coordinates": [{ "x": 1, "y": 1, "name": "b" }, { "x": 2, "y": 2, "name": "c" }]
 *     },
 *     {
 *         "distance": 15.556349186104045,
 *         "coordinates": [{ "x": -10, "y": -10, "name": "a" }, { "x": 1, "y": 1, "name": "b" }]
 *     },
 *     {
 *         "distance": 16.97056274847714,
 *         "coordinates": [{ "x": -10, "y": -10, "name": "a" }, { "x": 2, "y": 2, "name": "c" }]
 *     },
 *     {
 *         "distance": 55.569775957799216,
 *         "coordinates": [{ "x": 2, "y": 2, "name": "c" }, { "x": 30, "y": 50, "name": "d" }]
 *     },
 *     {
 *         "distance": 56.938563381947034,
 *         "coordinates": [{ "x": 1, "y": 1, "name": "b" }, { "x": 30, "y": 50, "name": "d" }]
 *     },
 *     {
 *         "distance": 72.11102550927978,
 *         "coordinates": [{ "x": -10, "y": -10, "name": "a" }, { "x": 30, "y": 50, "name": "d" }]
 *     }
 * ]
 */
export function getAllDistances(fromCoordinates, ...toCoordinates) {
    const allToCoordinates =
        toCoordinates.length === 1 ? toCoordinates[0] : toCoordinates;
    const baseCoordinates = fromCoordinates
        ? [fromCoordinates]
        : allToCoordinates;
    const offset = fromCoordinates ? 0 : 1;
    const allDistances = [];

    forEach(baseCoordinates, (set1, index1) => {
        forEach(allToCoordinates.slice(index1 + offset), (set2, index2) => {
            allDistances.push({
                distance: getDistance(set1, set2),
                coordinates: [
                    fromCoordinates
                        ? fromCoordinates
                        : allToCoordinates[index1],
                    allToCoordinates[index2 + index1 + offset]
                ]
            });
        });
    });

    allDistances.sort((a, b) =>
        a.distance > b.distance ? 1 : b.distance > a.distance ? -1 : 0
    );

    return allDistances;
}

/**
 * Get distance between two sets of coordinates on a sphere using the Haversine Distance Formula.
 *
 * This function takes coordinates given in latitudes and longitudes as both arrays and objects.
 *
 * @param {Number[]|LatLngCoordinatesObject} from - From coordinates `[x, y]` or `{ latitude: x, longitude: y }`
 * @param {Number[]|LatLngCoordinatesObject} to - To coordinates `[x, y]` or `{ latitude: x, longitude: y }`
 * @param {Number} diameter - The diameter of the sphere.
 * @returns {Number} The distance between the two coordinates.
 */
export function getDistanceOnSphere(from, to, diameter) {
    const fromLatitude = typeof from.lat === "number" ? from.lat : from[0];
    const fromLongitude = typeof from.lng === "number" ? from.lng : from[1];
    const toLatitude = typeof to.lat === "number" ? to.lat : to[0];
    const toLongitude = typeof to.lng === "number" ? to.lng : to[1];

    const dLat = degreesToRadians(toLatitude - fromLatitude);
    const dLon = degreesToRadians(toLongitude - fromLongitude);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(degreesToRadians(fromLatitude)) *
            Math.cos(degreesToRadians(toLatitude)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

    return diameter * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Get distance between two sets of coordinates on Earth in kilometers using the Haversine Distance Formula.
 *
 * This function takes coordinates given in latitudes and longitudes as both arrays and objects (compatible with Google Maps).
 *
 * @param {Number[]|LatLngCoordinatesObject} from - From coordinates `[x, y]` or `{ latitude: x, longitude: y }`
 * @param {Number[]|LatLngCoordinatesObject} to - To coordinates `[x, y]` or `{ latitude: x, longitude: y }`
 * @returns {Number} The distance between the two coordinates in kilometers.
 */
export function getDistanceOnEarth(from, to) {
    return getDistanceOnSphere(from, to, 12742);
}

/**
 * Get the slope of a line (also called the gradient).
 *
 * The slope of a line is a number that measures its "steepness", usually denoted by the letter m.
 *
 * @param {Number[]|XYCoordinatesObject} from - From coordinates `[x, y]` or `{ x: 100, y: 100 }`
 * @param {Number[]|XYCoordinatesObject} to - To coordinates `[x, y]` or `{ x: 100, y: 100 }`
 * @returns {Number} The slope
 */
export function getSlope(from, to) {
    const fromCoord = isArray(from) ? from : [from.x, from.y];
    const toCoord = isArray(to) ? to : [to.x, to.y];
    return (toCoord[1] - fromCoord[1]) / (toCoord[0] - fromCoord[0]);
}

/**
 * Get the angle from one set of coordinates to another.
 *
 * **Be aware** that angles in coordinate systems move counter clockwise, hence this is the default
 * setting. But you can change that in the options argument by setting `clockwise: true`.
 *
 * @since 3.6.7
 * @param {Number[]|XYCoordinatesObject} from - The coordinates of one point.
 * @param {Number[]|XYCoordinatesObject} to - The coordinates of another point.
 * @param {Object} [options={}] - Options for adjusting the calculation.
 * @param {boolean} [options.clockwise=false] - Set to **true** to calculate angles in a clockwise direction.
 * @param {Number} [options.offset=0] - Set an offset to the angle in degrees.
 * @returns {number} The angle in degrees.
 */
export function getAngle(from, to, options = {}) {
    const settings = {
        clockwise: false,
        offset: 0,
        ...options
    };

    const fromCoord = isArray(from) ? from : [from.x, from.y];
    const toCoord = isArray(to) ? to : [to.x, to.y];

    const x = toCoord[0] - fromCoord[0];
    const y = settings.clockwise
        ? toCoord[1] - fromCoord[1]
        : fromCoord[1] - toCoord[1];
    const theta = Math.atan2(y, x);
    const angle = radiansToDegrees(theta) + (180 % 360) + settings.offset;

    return settings.offset === 0
        ? angle
        : angle >= 360
        ? angle - 360
        : angle < 0
        ? angle + 360
        : angle;
}

/**
 * Get the minimum and maximum values from at set of coordinates and return the **bounds** (boundaries).
 *
 * @since 3.7.0
 * @param {...(XYCoordinatesObject|Object|Array)} coordinates - Sets of coordinates as `[x, y]` or `{ x: 100, y: 100 }`
 * @returns {{min: Number[], max: Number[]}} An object with the minimum and maximum coordinates.
 */
export function getBounds(...coordinates) {
    const allCoordinates =
        coordinates.length === 1 ? coordinates[0] : coordinates;

    return allCoordinates.reduce(
        (previous, currentCoordinates) => {
            const current = Array.isArray(currentCoordinates)
                ? currentCoordinates
                : [currentCoordinates.x, currentCoordinates.y];

            if (current[0] < previous.min.x) {
                previous.min.x = current[0];
            }

            if (current[0] > previous.max.x) {
                previous.max.x = current[0];
            }

            if (current[1] < previous.min.y) {
                previous.min.y = current[1];
            }

            if (current[1] > previous.max.y) {
                previous.max.y = current[1];
            }

            return previous;
        },
        {
            min: {
                x: Infinity,
                y: Infinity
            },
            max: {
                x: -Infinity,
                y: -Infinity
            }
        }
    );
}

/**
 * Get the coordinates of a point between two other coordinates.
 *
 * @since 3.12.0
 * @param {Number[]|XYCoordinatesObject} from - The coordinates of one endpoint.
 * @param {Number[]|XYCoordinatesObject} to - The coordinates of another endpoint.
 * @param {Number} [percentage=50] - Where the returned point should be placed in percentages. Defaults to 50, which is the midpoint.
 * @returns {{x: Number, y: Number}} A set of coordinates.
 */
export function getPointBetween(from, to, percentage = 50) {
    const fromCoord = isArray(from) ? from : [from.x, from.y];
    const toCoord = isArray(to) ? to : [to.x, to.y];
    const perc = percentage / 100;

    return {
        x: fromCoord[0] + (toCoord[0] - fromCoord[0]) * perc,
        y: fromCoord[1] + (toCoord[1] - fromCoord[1]) * perc
    };
}
