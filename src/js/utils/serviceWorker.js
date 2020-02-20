/**
 * Work with Service Workers.
 *
 * @module utils/serviceWorker
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

/**
 * Register a Service Worker
 *
 * @example
 * import { registerServiceWorker } from "./utils/serviceWorker";
 * registerServiceWorker("/sw.js", "/");
 *
 * @param {string} [path="/sw.js"] - Path to the Service Worker file
 * @param {string} [scope="/"] - Scope of the Service Worker. Must be in the path of the SW
 */
export function registerServiceWorker(path = "/sw.js", scope = "/") {
    // Check that Service Workers are supported in the browser and that path and scope are not empty
    if ("serviceWorker" in navigator && path && scope) {
        // Register Service Worker
        navigator.serviceWorker.register(path, { scope });
    }
}

/**
 * Send command and object with data to Service Worker.
 *
 * @example
 * import { messageServiceWorker } from "./utils/serviceWorker";
 * messageServiceWorker("add to cache", {
 *     files: ["path/to/file.json"],
 *     settings: {},
 * });
 *
 * @param {string} messageCommand - Command to send to the Service Worker
 * @param {object} [messageData={}] - Additional data to send
 */
export function messageServiceWorker(messageCommand, messageData = {}) {
    // Check that Service Workers are supported in the browser
    if ("serviceWorker" in navigator) {
        // Send command and data to Service Worker
        navigator.serviceWorker.controller.postMessage({
            messageCommand,
            messageData
        });
    }
}
