/**
 * Calculate the difference between two timestamps.
 *
 * @module utils/calc/time
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 *
 * @example
 * import { timeDifference } from "./utils/calc/time";
 * timeDifference(1523607256543, 1533906712955);
 *
 * // The following object is returned
 * {
 *     "days": 119,
 *     "hours": 4,
 *     "minutes": 57,
 *     "seconds": 36,
 *     "milliseconds": 412,
 *     "singleUnit": {
 *         "onlyDays": 119.20667143518519,
 *         "onlyHours": 2860.9601144444446,
 *         "onlyMinutes": 171657.60686666667,
 *         "onlySeconds": 10299456.412,
 *         "onlyMilliseconds": 10299456412
 *     }
 * }
 *
 */

/**
 *
 * @param {Number} fromTimestampMs - A timestamp in milliseconds
 * @param {Number} toTimestampMs - A timestamp in milliseconds
 * @returns {{days: (Number), hours: (Number), minutes: (Number), seconds: (Number), milliseconds: (Number), singleUnit: {onlyDays: Number, onlyHours: Number, onlyMinutes: Number, onlySeconds: Number, onlyMilliseconds: Number}}}
 */
export function timeDifference(fromTimestampMs, toTimestampMs) {
    let difference = Math.abs(fromTimestampMs - toTimestampMs);

    const onlyMilliseconds = difference;
    const onlySeconds = onlyMilliseconds / 1000;
    const onlyMinutes = onlySeconds / 60;
    const onlyHours = onlyMinutes / 60;
    const onlyDays = onlyHours / 24;

    difference = Math.floor(difference / 1000);
    const milliseconds = onlyMilliseconds - difference * 1000;
    const seconds = difference % 60;
    difference = Math.floor(difference / 60);
    const minutes = difference % 60;
    difference = Math.floor(difference / 60);
    const hours = difference % 24;
    difference = Math.floor(difference / 24);
    const days = difference;

    return {
        days,
        hours,
        minutes,
        seconds,
        milliseconds,
        singleUnit: {
            onlyDays,
            onlyHours,
            onlyMinutes,
            onlySeconds,
            onlyMilliseconds
        }
    };
}
