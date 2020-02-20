// ES6 module syntax relies completely on "import" and "export" statements. It's nice to bundle your
// imports at the top of the file, so it's nice and easy to understand.
// Want to know more about import statements? Check the syntax here:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import

// So, let's go.
//
// You can import any library from NPM, as long as it adheres to ES6- or CommonJS-syntax.
// Importing CommonJS-syntax is not a feature in ES6 itself, but allowed by running the
// code through Babel, which resolves the imports and bundles everything up for you.
//
// So, if you need React, do this:
//
//    import React from "react";
//
// This will import the default export from "react" inside node_modules, and call it "React"
// inside this file (but nowhere else).
// Similarly, to get LoDash:
//
//    import lodash from "lodash";
//
// Same story.

// You can import your own stuff, too. In this case we import the default export from our file
// "../utils/events/onReady.js" and call it "onReady" here as well.
//
// *** WARNING: ***
// ********************************************************************************************
// While Windows-based machines don't care about the casing in the file you're referring to,
// UNIX-based systems do. So not only will your code fail on case-sensitive systems, but Babel
// uses the filename to reference the module internally. So if you import the file twice with
// different casings, it WILL be imported twice instead of just once.
// In other words: make sure your imports use the proper case in the filename. Let your editor
// do the heavy lifting here.
// ********************************************************************************************
//
// Aaaaanyway. Do this:
import { onReady } from "../utils/events/onReady";
// ... and you can now run onReady() from inside this file.

// Same for this utility:
import { getElementScroll } from "../utils/dom/elementProperties";

// If you just want all the exports from your module, you can import them like this:
import * as responsiveWindow from "../utils/events/onWindowResize";
// ... and you can then access responsiveWindow.currentBreakpoint, for example.

// We'll need this to trigger a destruction event on our example instantiation. You probably won't need this in your
// own code, unless you specifically have to destroy your instantiations... in which case this is a very neat way
// of triggering the event you need.
import { triggerCustomEvent } from "../utils/events/triggerCustomEvent";
// We'll also get the name of the event that'll trigger the destruction by reference instead of hardcoding it.
// Notice how we are only asking for certain named exports from inside that file by using {}.
import { destroyEventName } from "../utils/bootstrapper";

// We'll need some more of our utilities for this example file.
import { addEvent, removeAllEvents } from "../utils/events/events";
import { toggleClass } from "../utils/dom/classList";
import { forEach } from "../utils/forEach";
import { deleteElement } from "../utils/dom/elementManipulation";
import { alert } from "../utils/interaction/modal";

// If the code you import does something important on load, but doesn't export anything you need,
// you can just import it without assigning it. Like this:
// import "../utils/dom/imageHandler";
// We actually do this for the "imageHandler" module - see main.js for an example.

// Remember to remove imports you're no longer using. This helps keep your JS-payload small.

/**
 * An example class. A class is a collection of methods (functions) ONLY. You can not define variables or anything
 * like that outside the methods, but you can store anything on the "this" scope once your class is instantiated.
 * "class" is a feature of ES6, but will simply be transpiled to functions and prototypes in ES5, which amounts
 * to roughly the same thing, but is much messier. This right here is the cleanest way you can define your modules.
 *
 * ... which means you don't HAVE to use classes. You can just as easily use a single function like in the old days,
 * but unless you want to prototype in all your functions manually, the performance benefits of using a class like
 * this are very much desired.
 */
export class Example {
    /**
     * The constructor is fired automatically once you run "new Example()".
     *
     * @param {HTMLElement} domReference
     */
    constructor(domReference) {
        // Set up the DOM and stuff like that as soon as the browser is ready for it.
        onReady(() => this.init(domReference));
    }

    /**
     *
     * @param {HTMLElement} domReference
     */
    init(domReference) {
        this.loadDOM(domReference);
        this.bindEvents();
    }

    /**
     * Handler for when the example button is clicked.
     *
     * @param {Event} event
     */
    onExampleButtonClick(event) {
        // Prevent the default event handler, whatever that is, from running.
        event.preventDefault();

        // Toggle a class on the container element.
        toggleClass(this.dom.container, "example--testing");

        // Since we re-scoped this function when we set up the event handler (see ".bind()"
        // further down), we can't use "this" to point to the element that spawned the event.
        // So what do we do when we want to access that element?
        //
        // e.currentTarget is the element that spawned the event. "e.target" is dangerous,
        // because it might point to an element INSIDE the element you are listening on,
        // but "e.currentTarget" should be safe.
        //
        // ... so let's toggle a class on it. Just for kicks.
        toggleClass(event.currentTarget, "clicked");

        const currentScrollPosition = getElementScroll();

        // Remember how we imported stuff from the onScroll element? Let's use it.
        // Oh, and let's just print out the current window dimensions while we're at it:
        void alert(
            `Current scroll position: ${currentScrollPosition.left}, ${currentScrollPosition.top}.
            Current window dimensions: ${responsiveWindow.currentWindowWidth}x${responsiveWindow.currentWindowHeight}`,
            "You did it!"
        );
    }

    /**
     * A function to trigger the destruction of this instantiation. Here purely for demonstration purposes, since you
     * probably wouldn't trigger such a thing from the frontend. Or would you? Either way, the destruction event is
     * bound using "addEventListener" (and as such is a native event, of sorts), so jQuery can't reach it, even if
     * you wanted to use $(element).trigger(). Use the imported helper "triggerCustomEvent", as seen below, or,
     * if you really prefer to use jQuery, use a plugin such as jQuery.simulate.
     * ... however, "triggerCustomEvent" should do just fine.
     *
     * @param {Event} event
     */
    onKillButtonClick(event) {
        event.stopPropagation();
        event.preventDefault();

        // Trigger the event now.
        triggerCustomEvent(this.dom.container, destroyEventName);
    }

    /**
     * Find and store references to the DOM-elements we need.
     *
     * @param {HTMLElement} domReference
     */
    loadDOM(domReference) {
        this.dom = {};

        // As you can see, we don't use jQuery here. You're free to use it yourself if you want,
        // but native JS is much faster. Not necessarily better, but faster.
        this.dom.container = domReference;
        this.dom.exampleButton = this.dom.container.querySelector(
            ".demobutton"
        );
        this.dom.killInstanceButton = this.dom.container.querySelector(
            ".killbutton"
        );
    }

    /**
     * Bind whatever events we need to the DOM-elements we've found.
     */
    bindEvents() {
        // Bind a click event to the buttons. Notice the "bind" at the end - it ensures
        // that when the click handler runs, it can use "this" to point to our instantiation,
        // instead of the clicked element (which we can get anyway using e.currentTarget).
        // This lets us retain our references, even while inside a class construction.
        //
        // Another way of doing this is using arrow functions:
        //
        //     addEvent(this.dom.exampleButton, "click", event => this.onExampleButtonClick(event)));
        //
        // ... it gets the same job done.
        addEvent(
            this.dom.exampleButton,
            "click",
            this.onExampleButtonClick.bind(this)
        );

        // This button kills the instantiation.
        addEvent(
            this.dom.killInstanceButton,
            "click",
            this.onKillButtonClick.bind(this)
        );
    }

    /**
     * Destruction function, used for removing all event listeners, timeouts and whatever else
     * you might have created. This is useful on single page applications so the browser can
     * perform garbage collection and recover memory. In regular cases you probably won't need
     * it, though, but the following function does work.
     */
    destroy() {
        // Remove the "kill"-button from the DOM, just for kicks.
        deleteElement(this.dom.killInstanceButton);

        // Run through all the DOM references we have stored, and remove all event listeners set on them.
        forEach(this.dom, (domReference, objectBlockName) => {
            removeAllEvents(domReference);

            // Reset the memory pointer so the garbage collection can work properly. Presumably this
            // is not really needed, but... better safe than sorry.
            this.dom[objectBlockName] = null;
        });

        // Again, do some memory cleanup, just to be safe.
        this.dom = null;
    }
}
