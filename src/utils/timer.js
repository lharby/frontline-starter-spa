/**
 * Create a timeout that can be paused and resumed.
 *
 * @module utils/Timer
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 *
 * @example
 * import { Timer } from "./utils/timer";
 *
 * // Create a timer that executes a function after 2 seconds
 * const timer = new Timer((a, b) => {
 *     window.console.log(`${a}, ${b}`);
 * }, 2000, "Hello", "friend");
 *
 * // Pause timer after 1 second
 * setTimeout(() => {
 *     timer.pause();
 *
 *     // And resume it after 3 seconds
 *     setTimeout(() => {
 *         timer.resume();
 *     }, 3000);
 * }, 1000);
 *
 * // After 5 seconds the function will output "Hello, friend" to the console.
 */

export class Timer {
    /**
     * Create timer
     *
     * @param {function} callback - The function that will be executed.
     * @param {number} [timeoutMs=0] - The number of milliseconds to wait before executing the code.
     * @param {...*} [parameters] - Additional parameters to pass to the function.
     *
     * @example
     * import { Timer } from "./utils/timer";
     * const timer = new Timer(() => {
     *     window.alert("Timer is done!");
     * }, 1000);
     */
    constructor(callback, timeoutMs = 0, ...parameters) {
        this.callback = callback;
        this.remainingMs = timeoutMs;
        this.parameters = parameters;

        this.resume();
    }

    /**
     * Pause timer
     */
    pause() {
        if (this.startMs) {
            window.clearTimeout(this.timerId);
            this.remainingMs -= new Date().getTime() - this.startMs;
        }
    }

    /**
     * Resume timer
     */
    resume() {
        this.startMs = new Date().getTime();
        window.clearTimeout(this.timerId);
        this.timerId = window.setTimeout(
            this.callback,
            this.remainingMs,
            ...this.parameters
        );
    }

    /**
     * Destroy timer
     * @since 3.12.0
     */
    destroy() {
        window.clearTimeout(this.timerId);
        this.callback = null;
    }
}
