/**
 * Using a good old XHRRequest to prefetch a resource to optimize the Time-to-interactive, when this is needed.
 * This method can be used to prefetch many resources-types **except for HTML**.
 * To prefetch HTML-pages instead use the build-in Prefetch API with the <link>-tag, that some browsers support.
 *
 * The main reason you would use this method (for other resources then HTML), is that is has full browser support, and a much greater change that resources will actually be cached, than by using the Prefetch API.
 *
 * @module utils/network/prefetchRequest
 * @author Nicolaj Lund Hummel
 * @since 3.8.0
 *
 * @example
 * import { prefetchRequest } from "./utils/network/prefetchRequest";
 *
 * prefetchRequest("/static/dist/js/next-code-in-line.min.js");
 * prefetchRequest("/static/dist/css/awesome-but-beefy.min.css");
 *
 */

/**
 * Prefetch given resource by opening a request,
 * making the browser cache it without parsing the code
 *
 * @param {string} resourceUrl - path to the resource you want to prefetch
 * @since 3.8.0
 */
export function prefetchRequest(resourceUrl) {
    const xhrRequest = new XMLHttpRequest();
    xhrRequest.open("GET", resourceUrl, true);
    xhrRequest.send();
}
