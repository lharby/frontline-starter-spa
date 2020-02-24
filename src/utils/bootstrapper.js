/**
 * Class bootstrapper.
 *
 * @module utils/bootstrapper
 * @author Anders Gissel <anders.gissel@akqa.com>
 *
 * @example
 * <caption>
 * The bootstrapper is used to instantiate a class or constructor and tie it to a DOM element automatically.
 *
 * Given two DOM elements like this:
 * </caption>
 * {@lang html}
 * <div data-module="someExample"></div>
 * <section data-module="someOtherExample"></section>
 *
 * @example
 * <caption>You would use the bootstrapper like so:</caption>
 * import { bootstrapper } from "./utils/bootstrapper";
 * import { WhateverConstructorYouWant } from "./modules/someFile";
 * import { AnotherConstructor } from "./modules/someOtherFile";
 *
 * bootstrapper({
 *     "someExample": WhateverConstructorYouWant,
 *     "someOtherExample": AnotherConstructor,
 * });
 *
 * @example
 * <caption>
 * Every time you run the bootstrapper it performs a very wide DOM lookup, so you should only run it once
 * per page load, and gather up all your references in one block like you see above. Anything else can
 * get expensive, depending on the browser's lookup engine.
 *
 * The bootstrapper will attach an event (defined in "destroyEventName") to the DOM-container. When triggered,
 * it will attempt to run the `destroy()` method on the object, if it exists, and then destroy the instantiation
 * completely in an attempt to clean up after itself. However, removing event listeners and DOM references set
 * by the module is your own responsibility.
 *
 *  If you don't want to use the automatic lookup, but want to use the bootstrapper manually, use the helper
 * function **bootstrapConstructorOnElement()** instead, like so:
 * </caption>
 *
 * import { bootstrapConstructorOnElement } from "./utils/bootstrapper";
 * import { WhateverConstructorYouWant } from "./modules/someFile";
 *
 * let element = document.querySelector(".class");
 * bootstrapConstructorOnElement(element, WhateverConstructorYouWant, "name-of-module");
 */

/*
 Class bootstrapper

 Author: Anders Gissel <anders.gissel@akqa.com>
 ************************************************************************************************************

 The bootstrapper is used to instantiate a class or constructor and tie it to a DOM element automatically.
 Given two DOM elements like this:

     <div data-module="someExample"></div>
     <section data-module="someOtherExample"></section>

 You would use the bootstrapper like so:

     import { bootstrapper } from './utils/bootstrapper';
     import { WhateverConstructorYouWant } from './modules/someFile';
     import { AnotherConstructor } from './modules/someOtherFile';

     bootstrapper({
         'someExample': WhateverConstructorYouWant,
         'someOtherExample': AnotherConstructor
     });


 Every time you run the bootstrapper it performs a very wide DOM lookup, so you should only run it once
 per page load, and gather up all your references in one block like you see above. Anything else can
 get expensive, depending on the browser's lookup engine.

 The bootstrapper will attach an event (defined in "destroyEventName") to the DOM-container. When triggered,
 it will attempt to run the destroy() method on the object, if it exists, and then destroy the instantiation
 completely in an attempt to clean up after itself. However, removing event listeners and DOM references set
 by the module is your own responsibility.

 If you don't want to use the automatic lookup, but want to use the bootstrapper manually, use the helper
 function bootstrapConstructorOnElement() instead, like so:

     import { bootstrapConstructorOnElement } from './utils/bootstrapper';
     import { WhateverConstructorYouWant } from './modules/someFile';

     let element = document.querySelector('.class');
     bootstrapConstructorOnElement(element, WhateverConstructorYouWant, 'name-of-module');

 */

// oh god i need dis
import { triggerCustomEvent } from "./events/triggerCustomEvent";
import { forEach } from "./forEach";
import { addClass, hasClass, removeClass } from "./dom/classList";
import { splitter } from "./splitter";

/**
 * The event name that will kill any given instantiation. Can be customized to your liking, but only before you start
 * using the bootstrapper.
 *
 * @type {string}
 */
export const destroyEventName = "akqa.bootstrapper:destroyInstance";

/**
 * Once a constructor is initialized, this string will be appended to the active module name and added as a class.
 * @type {string}
 */
export const initializedAppendClass = "--initialized";

/**
 * The DOM property used for the node lookups. The default is "data-module", which makes the script look for
 * something like:
 *
 * `<element data-module="yourNameHere"></element>`
 *
 * You can change this property name to your liking, but please use a data-attribute, and remember to do it
 * before you actually start bootstrapping modules, or there may be unexpected side effects.
 *
 * @type {string}
 */
export const moduleLookupPropertyName = "data-module";

/**
 * Create a callback function to kill the given instantiation.
 *
 * @private
 * @param {Object} instance - The instantiation we'll be trying to kill.
 * @param {HTMLElement} domObject - The DOM reference we'll be working with.
 * @param {string} initializedTargetClass - The class previously added to the element, which should be removed upon destruction.
 * @returns {function}
 */
function createInstanceKillerCallback(
    instance,
    domObject,
    initializedTargetClass
) {
    // Allocate a name for the return function so we can refer to it when we remove the event listener again.
    let handlerFunction;

    handlerFunction = function(event) {
        // eslint-disable-line prefer-const

        // Make sure the event doesn't travel up the DOM tree and destroy something we'd need for later.
        event.stopPropagation();

        // If we have an instance, and it contains the "destroy" function, run it now.
        if (instance && typeof instance.destroy === "function") {
            instance.destroy();
        }

        // Try recovering the allocated memory from the instance.
        instance = null; // eslint-disable-line no-param-reassign

        // Remove the "initiated" class
        removeClass(domObject, initializedTargetClass);

        // ... and then remove the event handler pointing to... well, this function.
        domObject.removeEventListener(destroyEventName, handlerFunction);

        // Only continue with the next bit if we haven't explicitly been told NOT to.
        if (
            typeof event.detail !== "object" ||
            event.detail.doNotPropagateDown !== true
        ) {
            // Fire the destruction event on every single data-module that might exist inside the current container.
            // The destruction event is assumed to be fired prior to a DOM removal and/or cleanup, so we'll make sure
            // everything below this node is cleaned up as well. The rest is up to the instantiations running on the
            // DOM nodes we find, but we can't be responsible for those here.

            const childElements = domObject.querySelectorAll(
                `[${moduleLookupPropertyName}]`
            );

            // Trigger the destruction event on the subnodes we've found. By sending along "doNotPropagateDown", we
            // are ensuring that the subnodes will not do the same. The first top-level call will find and target all
            // instantiations, so once is enough.
            forEach(childElements, currentElement =>
                triggerCustomEvent(currentElement, destroyEventName, {
                    doNotPropagateDown: true
                })
            );
        }
    };

    return handlerFunction;
}

/**
 * Spawn a constructor for the given DOM element.
 *
 * @private
 * @param {HTMLElement|Element|HTMLDocument} domObject
 * @param {function} ConstructorReference
 * @param {string} initializedTargetClass
 * @returns {Object}
 */
function spawnInstance(
    domObject,
    ConstructorReference,
    initializedTargetClass
) {
    // Only continue if an instantiation hasn't been set up before.
    if (!hasClass(domObject, initializedTargetClass)) {
        // Add the "initialized"-class, just because.
        addClass(domObject, initializedTargetClass);

        // Create the new instantiation right away.
        const instance = new ConstructorReference(domObject);

        // Create an event handler for
        const killEventHandler = createInstanceKillerCallback(
            instance,
            domObject,
            initializedTargetClass
        );

        // Set up an event listener looking for the destroy-event, which will destroy the instantiation
        // if fired. This can help us clean up our memory allocations (allowing the browser to run garbage
        // collection) when we're using SPA's or similar.
        domObject.addEventListener(destroyEventName, killEventHandler);

        return instance;
    }
}

/**
 * Find all DOM-elements matching the given module names, and start the associated constructors for each of them.
 *
 * @private
 * @param {object} objectData - An associative array. Key must be the module name, and value must be the constructor to look for.
 * @param {boolean} [treatConstructorsAsAsyncLoaders=false] Treat the constructors not as classes but as async-loaders that should be resolved before spawning them.
 */
function spawnInstancesFromObject(
    objectData,
    treatConstructorsAsAsyncLoaders = false
) {
    const domElements = document.querySelectorAll(
        `[${moduleLookupPropertyName}]`
    );
    forEach(domElements, currentElement => {
        const moduleNames = currentElement.getAttribute(
            moduleLookupPropertyName
        );
        splitter(moduleNames, moduleName => {
            if (moduleName) {
                const ConstructorReference = objectData[moduleName];

                if (ConstructorReference) {
                    const constructorType = typeof ConstructorReference;

                    if (treatConstructorsAsAsyncLoaders) {
                        // Using the objectData-reference to avoid trouble with ESLint. But it's the same as
                        // using ConstructorReference.
                        objectData[moduleName]().then(ResolvedConstructor =>
                            spawnInstance(
                                currentElement,
                                ResolvedConstructor,
                                moduleName + initializedAppendClass
                            )
                        );
                    } else {
                        // Stop right now if the given reference isn't actually a function.
                        if (constructorType === "function") {
                            spawnInstance(
                                currentElement,
                                ConstructorReference,
                                moduleName + initializedAppendClass
                            );
                        } else {
                            window.console.error(
                                `ConstructorReference (for '${moduleName}') is not a function, but a ${constructorType}. The bootstrapper needs a constructor function to work with.`
                            );
                        }
                    }
                }
            }
        });
    });
}

/**
 * Bootstrap the given HTML element with the given constructor reference. Module name will be inferred from element
 * if none is given.
 *
 * @param {HTMLElement|Element|HTMLDocument} domReference
 * @param {Function} ConstructorReference
 * @param {string} [moduleName]
 * @returns {object}
 */
export function bootstrapConstructorOnElement(
    domReference,
    ConstructorReference,
    moduleName
) {
    const usedModuleName =
        moduleName || domReference.getAttribute(moduleLookupPropertyName);
    return spawnInstance(
        domReference,
        ConstructorReference,
        usedModuleName + initializedAppendClass
    );
}

/**
 * Bootstrap any module on the page that match the given name, using the constructor passed along.
 * Or, in plain English: spawn a javascript function for each HTML-tag that match this format:
 *
 * `<tagname data-module="name" />`
 *
 * You can change the lookup property by changing "moduleLookupPropertyName" to something else. See
 * the documentation near the top of this file.
 *
 * @param {string|object} target - When defined as a string: the name of the module; used for looking up DOM-elements that match. When defined as an object: key defines name, value is used as the ConstructorReference.
 * @param {function} [ConstructorReference] - The constructor to instantiate.
 */
export function bootstrapper(target, ConstructorReference) {
    if (typeof target === "string") {
        spawnInstancesFromObject({ [target]: ConstructorReference });
    } else if (typeof target === "object") {
        spawnInstancesFromObject(target);
    } else {
        throw new Error(
            "First argument to bootstrapper must be a string or an object!"
        );
    }
}

/**
 * Bootstrap any module on the page that match the given name, like the `bootstrapper()`, but instead
 * of passing a statically loaded constructor, you must feed it functions that return promises
 * generated by `import()` statements instead. See the example for an explanation.
 *
 * If you have a LOT of modules, and not all of them are included on every page, this MIGHT
 * be the way to go to get a faster page load. Please make sure you're using HTTP/2, or
 * the resulting load could potentially create a whole bunch of HTTP-requests that might
 * choke a mobile device.
 *
 * This technique is best suited for modules that MIGHT show up on the page,
 * but for modules that are GUARANTEED to show up everywhere, you should probably
 * use the regular bootstrapper - or, if there's only a single usage (like a navigation menu
 * or similar), just turn it into a singleton instead. The `asyncBootstrapper` is for
 * hardcore code splitting.
 *
 *
 * @param {string|object} target - When defined as a string: the name of the module; used for looking up DOM-elements that match. When defined as an object: key defines name, value is used as the moduleResolverPromise.
 * @param {function} [moduleResolverPromise] - The import-promise that loads the constructor to instantiate.
 *
 * @example <caption>Lazy-load and spawn any and all of these modules when encountered on the page:</caption>
 *     asyncBootstrapper({
 *         "example": () => import("./modules/example").then(module => module.Example),
 *         "example2": () => import("./modules/example2").then(module => module.SomeOtherConstructor),
 *         "otherModule": () => import("./modules/otherModule").then(module => module.YetAnotherConstructor),
 *         "krombopulosMichael": () => import("./modules/krombopulosMichael").then(module => module.OohBoyHereIGoKillingAgain),
 *     };
 */
export function asyncBootstrapper(target, moduleResolverPromise) {
    if (typeof target === "string") {
        spawnInstancesFromObject({ [target]: moduleResolverPromise }, true);
    } else if (typeof target === "object") {
        spawnInstancesFromObject(target, true);
    } else {
        throw new Error(
            "First argument to asyncBootstrapper must be a string or an object!"
        );
    }
}
