/**
 * Get content cached by Service Worker.
 *
 * @module utils/cacheStorage
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 * @author Anders Gissel <anders.gissel@akqa.com>
 */

/**
 * Get any content from cache.
 *
 * @example
 * import { getCachedContent } from "./utils/cacheStorage";
 *
 * getCachedContent(/data/, "application/json", "fetched-data");
 *
 * @param {RegExp|RegExp[]} [matchPattern] - A RegExp pattern the content must match to be included
 * @param {string} [contentType] - A string that must be included in the Content-Type header
 * @param {string} [cacheName="fetches"] - The name of the cache you want to search for content
 * @returns {Promise<Array>} This function returns a resolved promise containing an array
 */
export function getCachedContent(
    matchPattern,
    contentType,
    cacheName = "fetches"
) {
    // Check that cache storage is supported in browser
    if ("caches" in window) {
        // Cache supported - get content in cache
        return caches.open(cacheName).then(cache =>
            cache.keys().then(keys => {
                const promises = [];
                const content = [];

                keys.forEach(cachedItem => {
                    promises.push(
                        cache.match(cachedItem).then(response => {
                            if (
                                (!contentType ||
                                    response.headers
                                        .get("Content-Type")
                                        .includes(contentType)) &&
                                (!matchPattern ||
                                    response.url.match(matchPattern))
                            ) {
                                content.push(response.url);
                            }
                        })
                    );
                });

                // Resolve with array of found content
                return Promise.all(promises).then(() => content);
            })
        );
    } else {
        // Cache is not supported in browser - resolve with empty array
        return Promise.resolve([]);
    }
}

/**
 * Specifically get HTML pages from cache.
 *
 * @example
 * import { getCachedPages } from "./utils/cacheStorage";
 *
 * getCachedContent(new RegExp("/article/"));
 *
 * @param {RegExp|RegExp[]} [matchPattern] - A RegExp pattern the content must match to be included
 * @param {string} [cacheName="fetches"] - The name of the cache you want to search for HTML pages
 * @returns {Promise<Array>} This function returns a resolved promise containing an array
 */
export function getCachedPages(matchPattern, cacheName = "fetches") {
    return getCachedContent(matchPattern, "text/html", cacheName);
}
