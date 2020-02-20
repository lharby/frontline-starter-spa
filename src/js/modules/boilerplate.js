import { onReady } from "../utils/events/onReady";

/**
 * Boilerplate class demonstrating basic construction.
 * You can expand from here, or find verbose examples in example.js.
 *
 * @param {HTMLElement} container
 * @constructor
 */
export class Boilerplate {
    /**
     * The constructor is fired once the class is instantiated.
     *
     * @param {HTMLElement} container
     */
    constructor(container) {
        // Run initializing code once the DOM is ready.
        onReady(() => this.init(container));

        // You can put other initializer-code here if it isn't dependent on the DOM in any way.
    }

    /**
     * The actual initialization function, fired once the DOM is ready.
     *
     * @param {HTMLElement} container
     */
    init(container) {
        this.dom = {
            container // ES6 allows this syntax instead of writing "container: container"
        };

        // Put your other DOM-specific initializations here, and get your class moving!
    }
}
