/**
 * A utility for getting a YouTube ID from a URL.
 *
 * @module utils/patternMatching/youTubeId
 * @since 3.6.0
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

/**
 * A regular expression for extracting the ID of a YouTube video from an URL.
 *
 * This works with both the URLs of normal links, embedded videos and the shorter youtu.be/{ID}
 *
 * @type {RegExp}
 * @example
 * import { youTubeIdRegex } from "./utils/patternMatching/youTubeId";
 *
 * const youTubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
 * const youTubeId = youTubeUrl.match(youTubeIdRegex)[1]; // = "dQw4w9WgXcQ"
 */
export const youTubeIdRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/+|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i;

/**
 * Get YouTube ID from URL.
 *
 * This works with both the URLs of normal links, embedded videos and the shorter youtu.be/{ID}
 *
 * @param {string} url - URL to YouTube video.
 * @returns {string} A string containing the ID, or an empty string if nothing was found.
 *
 * @example
 * import { getYouTubeId } from "./utils/patternMatching/youTubeId";
 *
 * const youTubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
 * const youTubeId = getYouTubeId(youTubeUrl); // = "dQw4w9WgXcQ"
 * const noYouTubeId = getYouTubeId("http://google.com"); // = ""
 */
export function getYouTubeId(url) {
    const match = url.match(youTubeIdRegex);
    return match && match.length > 1 ? match[1] : "";
}
