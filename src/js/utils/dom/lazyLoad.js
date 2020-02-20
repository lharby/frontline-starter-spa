/**
 * **Lazy load element sources, background images and more.**
 *
 * Lazy load the source for `img`, `picture`, `audio`, `video`, `embed`, `iframe`, `script` and `link`.
 * If this is used on any other type of element, the utility will set the given source as a background image. Or you can
 * define your own loader function. The possibilities are endless 🎈
 *
 * Images are loaded and decoded asynchronously to prevent blocking of the main thread.
 *
 *
 * #### Setting the source
 *
 * You set the source with the attribute `data-lazy`. The syntax for both `src` and `srcset` is supported.
 *
 * If you want to use `srcset` (only applicable for images), just use the
 * [srcset syntax for img](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
 * or the [srcset syntax for picture](https://www.w3schools.com/tags/att_source_srcset.asp).
 *
 * Otherwise you should just set the source as a path to a file. `data-lazy="path/to/file.ext"`.
 *
 * Setting different sources for specific breakpoints is done with a comma separated list or JSON:
 * - `data-lazy="sm: small.jpg, md: medium.jpg, lg: large.jpg"`.
 * - `data-lazy='{ "xxs": "mobile.jpg", "md": "tablet.jpg", "xl": "desktop.jpg" }'`.
 *
 *
 * #### Slow speed networks
 *
 * You can set alternative sources in case a user is visiting the site on a slow speed network (2G or 3G) by defining
 * the attributes `data-lazy-2g` and/or `data-lazy-3g`.
 *
 * If we can tell that the user has a slow network speed, the data attributes aimed at those connection types will be
 * prioritized.
 *
 * **Be aware** that this is dependent on an _experimental technology_, and might not be widely supported yet. Always make
 * sure that your code works if this is technology is not supported. Stay updated on
 * [caniuse](https://caniuse.com/#search=connection) and
 * [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/effectiveType)
 *
 *
 * #### Setting placeholders
 *
 * You can set placeholders using the attribute `data-lazy-placeholder`. By doing this, you can prevent content reflow,
 * where the content below or around lazy loaded content get moved around to make room for the newly loaded content.
 * Reflow is a user-blocking operation, which slows down the browser by forcing it to recalculate the layout of any
 * element that changes position.
 *
 * Placeholders can be defined with a path to the file, that you want to show until the correct source is loaded. Or you
 * can set it to an aspect ratio, which will generate an inline SVG source.
 *
 * - A single aspect ratio<br>`data-lazy-placeholder="480x320"`.
 * - A single path<br>`data-lazy-placeholder="path/to/placeholder.jpg"`.
 * - Breakpoint specific list<br>`data-lazy-placeholder="xxs: 480x320, md: 768x500, xl: path/to/placeholder.jpg"`.
 * - Breakpoint specific JSON<br>`data-lazy-placeholder='{ "xxs": "image.jpg", "md": "768x500", "xl": "1540x700" }'`.
 *
 *
 * @since 3.10.0
 * @module utils/dom/lazyLoad
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 *
 *
 * @example <caption>Basic JavaScript for lazy loading anything:</caption>
 * import { lazyLoad } from "./utils/dom/lazyLoad";
 *
 * // Lazy load sources for elements with the .lazy class name.
 * lazyLoad(".lazy");
 *
 * // Lazy load anything with the "data-lazy" attribute.
 * lazyLoad();
 *
 *
 * @example <caption>Possible settings in JavaScript:</caption>
 * import { lazyLoad, setLazyLoadGlobalSettings } from "./utils/dom/lazyLoad";
 *
 * // Don't load sources before the element has moved 100 px into the viewport
 * // and set the scroll throttle to 500 ms.
 * setLazyLoadGlobalSettings({
 *     bufferMarginPx: -100,
 *     onScrollThrottleMs: 500,
 * });
 *
 * // This is bonkers, but you can do it if you'd like
 * lazyLoad(".slow", {
 *     classNames: {
 *         base: "slow",
 *         initialized: "init",
 *         loading: "getting",
 *         loaded: "got",
 *         error: "not-got",
 *         wrapper: "parent",
 *     },
 *     loadManually: true,
 *     loadImmediately: true,
 *     reloadOnResize: false,
 *     onLoading: element => element.style.opacity = .5,
 *     onLoaded: [
 *         element => window.console.log("Callback 1 for", element),
 *         element => window.console.log("Callback 2 for", element),
 *     ],
 *     onError: element => element.style.display = "none",
 *     loaderFunction: null,
 * });
 *
 *
 * @example <caption>JavaScript for handling lazy loading manually:</caption>
 * import { lazyLoad, LAZY_EVENTS } from "./utils/dom/lazyLoad";
 * import { triggerCustomEvent } from "./utils/events/triggerCustomEvent";
 * import { forEach } from "./utils/forEach";
 *
 * const images = document.querySelectorAll(".lazy");
 * lazyLoad(images, { loadManually: true });
 *
 * // Lazy load all the images after 2 seconds, including those outside the viewport.
 * setTimeout(() => forEach(images, image => triggerCustomEvent(image, LAZY_EVENTS.TRIGGER)), 2000);
 *
 *
 * @example
 * <caption>
 * JavaScript for loading sources immediately. That's not lazy at all, but the utility will still be used for setting
 * the relevant source and handling responsiveness:
 * </caption>
 * import { lazyLoad } from "./utils/dom/lazyLoad";
 * lazyLoad(images, { loadImmediately: true });
 *
 *
 * @example
 * <caption>
 * Finally, you can also specify the loader function yourself, which opens up for all kinds of possibilities, like lazy
 * bootstrapping a module:
 * </caption>
 * import { lazyLoad } from "./utils/dom/lazyLoad";
 *
 * const lazyModule = document.getElementById("lazy-module");
 *
 * lazyLoad(lazyModule, {
 *     loaderFunction: element => import("./modules/example").then(module => {
 *         new module.Example(element);
 *     }),
 * });
 *
 *
 * @example <caption>Basic HTML for lazy loading a responsive image:</caption>
 * {@lang html}
 * <img class="lazy" alt="Dummy alt text"
 *     src="fallback.jpg"
 *     data-lazy="
 *         xxs: path/to/image/xxs.jpg,
 *         xs:  path/to/image/xs.jpg,
 *         sm:  path/to/image/sm.jpg,
 *         md:  path/to/image/md.jpg,
 *         lg:  path/to/image/lg.jpg,
 *         xl:  path/to/image/xl.jpg,
 *         xxl: path/to/image/xxl.jpg">
 *
 *
 * @example <caption>Basic HTML for lazy loading an image using `srcset` with a 2G network alternative:</caption>
 * {@lang html}
 * <img class="lazy" alt="Dummy alt text"
 *     src="fallback.jpg"
 *     sizes="(max-width: 320px) 280px,
 *            (max-width: 480px) 440px,
 *            800px"
 *     data-lazy="image-320w.jpg 320w,
 *                image-480w.jpg 480w,
 *                image-800w.jpg 800w"
 *     data-lazy-2g="low-320w.jpg 320w,
 *                   low-480w.jpg 480w,
 *                   low-800w.jpg 800w">
 *
 *
 * @example <caption>It is possible to define placeholders for images to prevent reflow:</caption>
 * {@lang html}
 * // This automatically generates an inline SVG in the correct aspect ratio.
 * <img class="lazy" alt="Dummy alt text"
 *     data-lazy="path/to/image.jpg"
 *     data-lazy-placeholder="1000x500">
 *
 * // Define different breakpoint specific aspect ratios.
 * <img class="lazy" alt="Dummy alt text"
 *     data-lazy="xxs: path/to/image/xxs.jpg, md: path/to/image/md.jpg, xl: path/to/image/xl.jpg"
 *     data-lazy-placeholder="xss: 480x200, md: 768x400, xl: 1540x500">
 *
 * // Define your own fallback sources.
 * // Be aware that this will make requests for the placeholders on page load.
 * <img class="lazy" alt="Dummy alt text"
 *     data-lazy="xxs: path/to/image/xxs.jpg, md: path/to/image/md.jpg"
 *     data-lazy-placeholder="xxs: path/to/placeholder/xxs.jpg, md: path/to/placeholder/md.jpg">
 *
 *
 * @example <caption>HTML for lazy loading a video in a suiting format and quality:</caption>
 * {@lang html}
 * <video class="lazy">
 *     <source type="video/mp4"
 *             data-lazy="good-quality.mp4"
 *             data-lazy-3g="medium-quality.mp4"
 *             data-lazy-2g="low-quality.mp4">
 *     <source type="video/ogg"
 *             data-lazy="good-quality.ogg"
 *             data-lazy-3g="medium-quality.ogg"
 *             data-lazy-2g="low-quality.ogg">
 * </video>
 *
 *
 * @example
 * <caption>
 * HTML for lazy loading a responsive background image with an alternative image for slow network connections:
 * </caption>
 * {@lang html}
 * <div class="lazy"
 *      style="background-image: url(fallback.jpg)"
 *      data-lazy-2g="low-quality.jpg"
 *      data-lazy="xxs: very-small.jpg, md: medium.jpg, xxl: very-large.jpg">
 *     ...
 * </div>
 *
 *
 * @example <caption>Other examples of HTML:</caption>
 * {@lang html}
 * <video class="lazy" autoplay
 *        data-lazy="good-quality.mp4"
 *        data-lazy-3g="low-quality.mp4">
 * </video>
 *
 * <audio class="lazy" autoplay data-lazy="play-me-later.mp3"></audio>
 *
 * <embed class="lazy" data-lazy="lazy-embed.mp3">
 *
 * <script data-lazy="lazy-script.js"></script>
 *
 * <link rel="stylesheet" type="text/css" data-lazy="lazy-styles.css">
 *
 * <iframe class="lazy" data-lazy="
 *     xs: small-layout.html,
 *     lg: bigger-layout.html
 * "></iframe>
 *
 * <picture class="lazy" data-lazy-placeholder="xxs: 465x250, md: 768x350">
 *     <source media="(min-width: 768px)" data-lazy="768x350.jpg">
 *     <source media="(min-width: 465px)" data-lazy="465x250.jpg">
 *     <img alt="Dummy alt text">
 * </picture>
 *
 */
import { hasClass, addClass, removeClass } from "./classList";
import { onScroll, removeScrollCallback } from "../events/onScroll";
import {
    breakpointIndex,
    currentBreakpoint,
    onWindowResize
} from "../events/onWindowResize";
import { isElementInViewport, isElementTag } from "./elementProperties";
import { decodeImage, loadImage } from "../network/loadImage";
import { addEvent, removeEvent } from "../events/events";
import { createElement } from "./createElement";
import { wrapElement } from "./elementManipulation";
import { triggerCustomEvent } from "../events/triggerCustomEvent";
import { forEach } from "../forEach";

/**
 * All possible settings for the lazy load utility and their default values.
 *
 * @typedef {Object} LazyLoadSettings
 * @property {Object} [classNames]
 * @property {string} [classNames.base="lazy"] - The base class name.
 * @property {string} [classNames.initialized="initialized"] - The class modifier added when an element has been initialized to lazy load.
 * @property {string} [classNames.loading="loading"] - The class modifier added when a source has started loading.
 * @property {string} [classNames.loaded="loaded"] - The class modifier added when a source has been loaded.
 * @property {string} [classNames.error="error"] - The class modifier added when a source has failed to load.
 * @property {string} [classNames.wrapper="wrapper"] - The class modifier added to the wrapping elements created for `script`, `link` and `audio` (without the "control" property).
 * @property {boolean} [loadManually=false] - Set to true to trigger load manually. Otherwise sources will load as elements scroll into the viewport.
 * @property {boolean} [loadImmediately=false] - Set to true to load sources immediately.
 * @property {boolean} [reloadOnResize=true] - Reload the source on window resize, if the element makes use of the responsive data attributes (`xs`, `md`, `lg` etc.)
 * @property {function|function[]} [onLoading] - Optional callback(s) to fire when a source starts loading. Single function or array of functions.
 * @property {function|function[]} [onLoaded] - Optional callback(s) to fire when a source has loaded. Single function or array of functions.
 * @property {function|function[]} [onError] - Optional callback(s) to fire in case a source fails to load. Single function or array of functions.
 * @property {function} [loaderFunction] - If you want to define your own loader function, you can do it here.
 */

/**
 * All the data (including settings) used for lazy loading elements.
 *
 * @ignore
 * @typedef {Object} LazyLoadData
 * @property {boolean} handleResponsive - True if lazyLoad should handle responsiveness.
 * @property {boolean} useSourceChildren - True if the element has source (or track) tags. Can be true for picture, video and audio.
 * @property {boolean} hasLoaded - True if a source has been loaded at some point.
 * @property {Object} elements - Object of elements.
 * @property {Element} elements.base - Base element.
 * @property {Element} elements.outer - Wrapper element.
 * @property {Element} elements.control - The element with the visible source and events (img in picture, otherwise same as base).
 * @property {Node|NodeList} elements.sourceChildren - Child elements with sources (<source> and <track>).
 */

/**
 * All global settings for the lazy load utility.
 *
 * @typedef {Object} LazyLoadGlobalSettings
 * @property {number} [bufferMarginPx=100] - The number of pixels outside of the viewport to start loading elements.
 * @property {number} [onScrollThrottleMs=250] - Optional throttle value, given in milliseconds. If omitted, no throttling is employed.
 */

/**
 * @ignore
 * @type {LazyLoadSettings}
 */
const defaultSettings = {
    classNames: {
        base: "lazy",
        initialized: "initialized",
        loading: "loading",
        loaded: "loaded",
        error: "error",
        wrapper: "wrapper"
    },
    loadManually: false,
    loadImmediately: false,
    reloadOnResize: true
};

/**
 * @ignore
 * @type {LazyLoadGlobalSettings}
 */
let globalSettings = {
    bufferMarginPx: 100,
    onScrollThrottleMs: 250
};

const isEventListenerSet = {
    scroll: false,
    resize: false
};

// We'll be using Map and not a regular object, since Map supports using objects as keys.
// To support IE11 you must include the required polyfill. The default polyfill from polyfill.io v3 is fine.
const elementsLoaded = new Map();
const elementsNotLoaded = new Map();
const elementsHandledManually = new Map();

const sourceAttribute = "data-lazy";
const placeholderAttribute = "data-lazy-placeholder";
const slowConnectionEffectiveTypes = ["2g", "3g"]; // These must be ordered from slow to fast.

// An array of all possible data attributes defining sources.
const allSourceAttributes = [
    sourceAttribute,
    ...slowConnectionEffectiveTypes.reduce(
        (accumulated, type) => accumulated.concat(`${sourceAttribute}-${type}`),
        []
    )
];

/**
 * Event names used when triggering ... events!
 * @type {{TRIGGER: string, LOADING: string, LOADED: string, ERROR: string}}
 *
 *
 * @example <caption>Basic usage:</caption>
 * import { addEvent } from "./utils/events/events";
 * import {
 *     lazyLoad,
 *     LAZY_EVENTS,
 *     LAZY_EVENT_TARGET,
 * } from "./utils/dom/lazyLoad";
 *
 * addEvent(LAZY_EVENT_TARGET, LAZY_EVENTS.LOADING, event => {
 *     window.console.log("Source started loading", event.detail.element);
 * });
 *
 * addEvent(LAZY_EVENT_TARGET, LAZY_EVENTS.LOADED, event => {
 *     window.console.log("Source has loaded", event.detail.element);
 * });
 *
 * addEvent(LAZY_EVENT_TARGET, LAZY_EVENTS.ERROR, event => {
 *     window.console.log("Something went wrong", event.detail.element);
 * });
 *
 * lazyLoad(".lazy");
 *
 *
 * @example <caption>Lazy load an element manually:</caption>
 * import { addEvent } from "./utils/events/events";
 * import { triggerCustomEvent } from "./utils/events/triggerCustomEvent";
 * import {
 *     lazyLoad,
 *     LAZY_EVENTS,
 *     LAZY_EVENT_TARGET,
 * } from "./utils/dom/lazyLoad";
 *
 * const element = document.querySelector(".lazy");
 * lazyLoad(element, { loadManually: true });
 *
 * triggerCustomEvent(element, LAZY_EVENTS.TRIGGER);
 *
 * addEvent(LAZY_EVENT_TARGET, LAZY_EVENTS.LOADED, event => {
 *     window.console.log("Element loaded manually", event.detail.element);
 * });
 */
export const LAZY_EVENTS = {
    TRIGGER: "akqa.lazyLoad:trigger",
    LOADING: "akqa.lazyLoad:loading",
    LOADED: "akqa.lazyLoad:loaded",
    ERROR: "akqa.lazyLoad:error"
};

/**
 * The element on which events will be triggered.
 * @type {HTMLElement}
 */
export const LAZY_EVENT_TARGET = document.documentElement;

/**
 * Trigger notifiers (callbacks and events).
 * @ignore
 * @type {{loading: function, loaded: function, error: function}}
 */
const notifiers = {
    loading: data => triggerNotifiers("loading", data),
    loaded: data => triggerNotifiers("loaded", data),
    error: data => triggerNotifiers("error", data)
};

/**
 * Trigger notifiers (callbacks and events).
 *
 * @ignore
 * @param {string} action
 * @param {LazyLoadData} data
 */
function triggerNotifiers(action, data) {
    const callbackName = `on${action.charAt(0).toUpperCase() +
        action.slice(1)}`;
    const eventName = LAZY_EVENTS[action.toUpperCase()];

    data[callbackName].forEach(funcRef => funcRef(data.elements.base));
    triggerCustomEvent(LAZY_EVENT_TARGET, eventName, {
        element: data.elements.base
    });
}

/**
 * Check if an element needs a wrapper.
 *
 * @ignore
 * @param {Element|HTMLAudioElement} element
 * @returns {boolean}
 */
const elementNeedsWrapper = element =>
    isElementTag(element, "script", "link", "embed") ||
    (isElementTag(element, "audio") && !element.controls);

/**
 * Detect and load elements that are visible in the viewport.
 * @ignore
 */
function detectElementsInViewport() {
    if (elementsNotLoaded.size) {
        elementsNotLoaded.forEach(data => {
            if (
                isElementInViewport(
                    data.elements.outer,
                    globalSettings.bufferMarginPx
                )
            ) {
                const newSource = getSourcesFromAttribute(data);
                setSource(newSource, data);
            }
        });
    } else {
        removeScrollCallback(window, detectElementsInViewport);
        isEventListenerSet.scroll = false;
    }
}

/**
 * Get sources from the most relevant attribute.
 *
 * @ignore
 * @param {LazyLoadData} data
 * @param {string} [attributeName] - Optional attribute name. If none is defined, we'll find the most appropriate.
 * @returns {{sources: string[], breakpointCount: number, attribute: string}}
 */
function getSourcesFromAttribute(
    { useSourceChildren, elements },
    attributeName
) {
    const defaultSourceName = "default";
    const sources = [];
    let isSrcsetSyntax = true;
    let breakpointCount = 0;

    let sourceElements = elements.base;

    if (
        useSourceChildren &&
        (!attributeName || !elements.base.hasAttribute(attributeName))
    ) {
        sourceElements = elements.sourceChildren;
    }

    forEach(sourceElements, sourceElement => {
        let newSource = {};
        let sourceData;
        let closestBreakpoint = 0;
        let closestBreakpointName = defaultSourceName;

        // An attribute name was supplied. Let's get whatever data is in that attribute.
        if (attributeName) {
            sourceData = sourceElement.getAttribute(attributeName);
        }

        // No attribute name was supplied - let's find one that suits the network speed,
        // and get whatever data is in that attribute.
        else {
            // Get the current connection effective type ("2g", "3g" or "4g" - we don't care about "slow-2g").
            // This is determined using a combination of recently observed round-trip time and estimated bandwidth.
            const currentConnectionType =
                "connection" in navigator &&
                "effectiveType" in navigator.connection
                    ? navigator.connection.effectiveType.slice(-2)
                    : null;

            // Find the index of the current connection effective type in our array of slow connection effective types.
            const minimumConnectionTypeIndex = slowConnectionEffectiveTypes.indexOf(
                currentConnectionType
            );

            // Search for an attribute with a source fitting the current connection effective type, by going through our
            // array of slow connection effective types, looking for something equal to or better than the current
            // effective type of the user's network.
            sourceData =
                slowConnectionEffectiveTypes.reduce(
                    (foundAttributeValue, value, index) => {
                        // If we already found a suiting attribute, let's just keep that.
                        // If the user's connection type isn't in the array, it must be fast (4g or faster),
                        // and then there's no need for checking attributes aimed at slow speed networks.
                        if (
                            minimumConnectionTypeIndex === -1 ||
                            foundAttributeValue
                        ) {
                            return foundAttributeValue;
                        }

                        // User is on a slow connection - look for a suiting data attribute.
                        if (index >= minimumConnectionTypeIndex) {
                            return (
                                sourceElement.getAttribute(
                                    `${sourceAttribute}-${value}`
                                ) || ""
                            );
                        }
                    },
                    ""
                ) || sourceElement.getAttribute(sourceAttribute); // If no slow speed attributes were found, use the default attribute.
        }

        if (sourceData) {
            // Parse the data from the attribute.
            // This can be either JSON or comma separated like "xxs: [...], md: [...], xl: [...]".
            try {
                newSource = JSON.parse(sourceData);
            } catch (error) {
                isSrcsetSyntax = /\s[0-9]+(w|x)\s*(,|$)/g.test(sourceData);

                if (isSrcsetSyntax) {
                    const srcsetFileRegex = /((?:[^\s,][^,]+?(?=\s[0-9]+(?:w|x)\s*(,|$)))|(^(?!\s[0-9]+(?:w|x))).*$)/g;
                    newSource[
                        defaultSourceName
                    ] = sourceData.replace(srcsetFileRegex, match =>
                        encodeURI(match)
                    );
                } else {
                    const dataArray = sourceData.split(/,\s?/);

                    dataArray.forEach(item => {
                        if (item) {
                            const trimmedItem = item.trim();
                            const colonIndex = trimmedItem.indexOf(":");
                            let key = trimmedItem.substring(0, colonIndex);
                            let value = trimmedItem;

                            if (key in breakpointIndex) {
                                value = trimmedItem.substring(colonIndex + 1);
                            } else {
                                key = defaultSourceName;
                            }

                            value = value.trim().replace(/^"|'|"|'$/g, "");

                            newSource[key] = encodeURI(value);
                        }
                    });
                }
            }

            // Find the most relevant source for the current breakpoint.
            const sourcesKeys = Object.keys(newSource);
            breakpointCount = Math.max(breakpointCount, sourcesKeys.length);

            if (breakpointCount === 1) {
                closestBreakpointName = sourcesKeys[0];
            } else {
                forEach(newSource, (source, key) => {
                    const thisBreakpoint = breakpointIndex[key];

                    if (
                        thisBreakpoint &&
                        (thisBreakpoint === currentBreakpoint ||
                            (closestBreakpoint !== currentBreakpoint &&
                                (!closestBreakpoint ||
                                    (thisBreakpoint <= currentBreakpoint &&
                                        thisBreakpoint > closestBreakpoint))))
                    ) {
                        closestBreakpoint = thisBreakpoint;
                        closestBreakpointName = key;
                    }
                });
            }
        }

        sources.push(newSource[closestBreakpointName]);
    });

    return {
        attribute: isElementTag(elements.base, "link")
            ? "href"
            : isSrcsetSyntax
            ? "srcset"
            : "src",
        breakpointCount,
        sources
    };
}

/**
 * Get the most appropriate placeholder source.
 *
 * The value of the data attribute must be `path/to/source.jpg` or a comma separated list (or JSON) of breakpoints
 * `xxs: path/to/xxs.jpg, md: path/to/xxs.jpg`. Instead of paths you can also define aspect ratios which will generate
 * an SVG data URI: `4x3` or `sm: 4x3, md: 16x9, lg: 16x10` or `{ "sm": "4x3", "md": "16:9" }`.
 *
 * @ignore
 * @param {Element} element
 * @param {LazyLoadData} data
 * @returns {string}
 */
function getPlaceholder(element, data) {
    let source;
    let x;
    let y;

    if (element.hasAttribute(placeholderAttribute)) {
        source = getSourcesFromAttribute(data, placeholderAttribute);

        // Test if the source string matches the pattern {number}x{number}
        if (/^[0-9]+x[0-9]+$/.test(source.sources[0])) {
            const [width, height] = source.sources[0].split("x");
            x = parseFloat(width);
            y = parseFloat(height);
        }
    } else {
        x = 1;
        y = 1;
    }

    return isNaN(x) || isNaN(y)
        ? source
        : {
              attribute: "src",
              breakpointCount: source ? source.breakpointCount : 1,
              sources: [
                  `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="${x}" height="${y}" viewBox="0 0 ${x} ${y}"%3E%3C/svg%3E`
              ]
          };
}

/**
 * Set placeholder on an element.
 *
 * @ignore
 * @param {LazyLoadData} data
 */
function setPlaceholder(data) {
    const { elements, hasLoaded } = data;

    if (!hasLoaded && elements.control) {
        const isImgWithoutSrc =
            isElementTag(elements.control, "img") && !elements.control.src;
        const elementWithPlaceholderData = elements.base.hasAttribute(
            placeholderAttribute
        )
            ? elements.base
            : elements.control.hasAttribute(placeholderAttribute)
            ? elements.control
            : undefined;

        // Continue if the element has an attribute with a defined placeholder,
        // or if it's an image with no src. Src is mandatory, you know.
        if (elementWithPlaceholderData || isImgWithoutSrc) {
            const newSource = getPlaceholder(
                elementWithPlaceholderData || elements.control,
                data
            );

            setSource(newSource, data, true);
        }
    }
}

/**
 * Update source attribute.
 *
 * @ignore
 * @param {Element} element
 * @param {string} attribute
 * @param {string} source
 */
function updateSourceAttribute(element, attribute, source) {
    if (source && element[attribute] !== source) {
        element[attribute] = source;
    }
}

/**
 * Set event listeners for load and error.
 *
 * @ignore
 * @param {LazyLoadData} data
 * @param {boolean} [isPlaceholder=false]
 * @param {boolean} [useCanPlay=false]
 */
function setLoadEventListeners(
    data,
    { isPlaceholder = false, useCanPlay = false }
) {
    const element = data.elements.control;
    const loadEvent = useCanPlay ? "canplay" : "load";

    addEvent(element, loadEvent, () => {
        removeEvent(element, `${loadEvent} error`);

        if (!isPlaceholder) {
            setClassName(data, "loaded");
            notifiers.loaded(data);
        }
    });

    addEvent(element, "error", () => {
        removeEvent(element, `${loadEvent} error`);

        if (!isPlaceholder) {
            setClassName(data, "error");
            notifiers.error(data);
        }
    });
}

/**
 * Set the source of an element or trigger the custom loader function.
 *
 * @ignore
 * @param {Object} newSource
 * @param {LazyLoadData} data
 * @param {boolean} data.useSourceChildren - Set to true if we are setting the source to a placeholder, and the classes won't change and notifiers won't be executed.
 * @param {boolean} [isPlaceholder=false]
 */
function setSource(newSource, data, isPlaceholder = false) {
    const { useSourceChildren, loaderFunction, elements } = data;

    // Only continue if the new source is not the same as the one already in use.
    if (loaderFunction && !isPlaceholder) {
        setClassName(data, "loaded");
        notifiers.loading(data);
        notifiers.loaded(data);
        loaderFunction(elements.base);
    } else {
        // Element uses source tags (picture, video, audio)
        if (useSourceChildren) {
            if (!isPlaceholder) {
                setClassName(data, "loading");
                notifiers.loading(data);
            }

            // Picture (load and decode)
            if (isElementTag(elements.base, "picture")) {
                const elementClone = elements.base.cloneNode(true);
                const elementCloneImg = elementClone.querySelector("img");

                addEvent(elementCloneImg, "load", () => {
                    removeEvent(elementCloneImg, "load error");

                    decodeImage(elementCloneImg).then(() => {
                        if (isPlaceholder) {
                            updateSourceAttribute(
                                elements.control,
                                "src",
                                newSource.sources[0]
                            );
                        } else {
                            let i = 0;
                            forEach(elements.sourceChildren, sourceTag => {
                                updateSourceAttribute(
                                    sourceTag,
                                    "srcset",
                                    newSource.sources[i]
                                );
                                i += 1;
                            });

                            setClassName(data, "loaded");
                            notifiers.loaded(data);
                        }
                    });
                });

                addEvent(elementCloneImg, "error", () => {
                    removeEvent(elementCloneImg, "load error");

                    if (!isPlaceholder) {
                        setClassName(data, "error");
                        notifiers.error(data);
                    }
                });

                if (isPlaceholder) {
                    updateSourceAttribute(
                        elementCloneImg,
                        "src",
                        newSource.sources[0]
                    );
                } else {
                    let i = 0;
                    forEach(
                        elementClone.querySelectorAll("source"),
                        sourceTag => {
                            updateSourceAttribute(
                                sourceTag,
                                "srcset",
                                newSource.sources[i]
                            );
                            i += 1;
                        }
                    );
                }
            }

            // Audio and video
            else {
                setLoadEventListeners(data, {
                    isPlaceholder,
                    useCanPlay: true
                });

                forEach(elements.sourceChildren, sourceTag =>
                    updateSourceAttribute(
                        sourceTag,
                        "src",
                        newSource.sources[0]
                    )
                );

                elements.base.load();
            }
        }

        // Element doesn't use source tags
        else {
            const isImage = isElementTag(elements.base, "img");
            const isBackgroundImage = !isElementTag(
                elements.base,
                "img",
                "iframe",
                "audio",
                "video",
                "embed",
                "script",
                "link"
            );
            const backgroundUrl = `url(${newSource.sources[0]})`;

            // Stop now if the found source is the same as the one currently in use
            if (
                isBackgroundImage
                    ? elements.outer.style.backgroundImage === backgroundUrl
                    : elements.control[newSource.sources.attribute] ===
                      newSource.sources[0]
            ) {
                return;
            }

            if (!isPlaceholder) {
                setClassName(data, "loading");
                notifiers.loading(data);
            }

            // Handle the loading (or failing thereof) and decoding of images
            if (isImage || isBackgroundImage) {
                const useSrcset = newSource.attribute === "srcset";

                loadImage(newSource.sources[0], {
                    useSrcset,
                    sizes: elements.base.sizes
                })
                    .then(() => {
                        if (isBackgroundImage) {
                            elements.outer.style.backgroundImage = backgroundUrl;
                        } else {
                            elements.control.srcset = "";
                            elements.control[newSource.attribute] =
                                newSource.sources[0];
                        }

                        if (!isPlaceholder) {
                            setClassName(data, "loaded");
                            notifiers.loaded(data);
                        }
                    })
                    .catch(() => {
                        if (!isPlaceholder) {
                            setClassName(data, "error");
                            notifiers.error(data);
                        }
                    });
            }

            // Handle embed - sadly, we can't rely on the events to be fired.
            // The load and error events work with some content in embed elements, but not with everything. :-(
            else if (isElementTag(elements.base, "embed")) {
                setLoadEventListeners(data, {
                    isPlaceholder,
                    useCanPlay: true
                });
                updateSourceAttribute(
                    elements.control,
                    "src",
                    newSource.sources[0]
                );

                if (!isPlaceholder) {
                    setClassName(data, "loaded");
                    notifiers.loaded(data);
                }
            }

            // Handle the loading of audio and video
            else if (isElementTag(elements.base, "audio", "video")) {
                setLoadEventListeners(data, {
                    isPlaceholder,
                    useCanPlay: true
                });
                updateSourceAttribute(
                    elements.control,
                    "src",
                    newSource.sources[0]
                );
                elements.base.load();
            }

            // Handle the loading of everything else
            else {
                setLoadEventListeners(data, { isPlaceholder });
                updateSourceAttribute(
                    elements.control,
                    newSource.attribute,
                    newSource.sources[0]
                );
            }
        }
    }

    if (!isPlaceholder) {
        if (elementsNotLoaded.has(elements.base)) {
            elementsNotLoaded.delete(elements.base);
            elementsLoaded.set(elements.base, { ...data, hasLoaded: true });
        } else if (elementsHandledManually.has(elements.base)) {
            elementsHandledManually.set(elements.base, {
                ...data,
                hasLoaded: true
            });
        }
    }
}

/**
 * Ensure that callbacks are in arrays.
 *
 * @ignore
 * @param {function|function[]} callbackList
 * @returns {Array}
 */
function sanitizeCallbacks(callbackList) {
    return callbackList instanceof Array
        ? callbackList
        : typeof callbackList === "function"
        ? [callbackList]
        : [];
}

/**
 * Reset elements so they can be updated to match the current breakpoint when appropriate.
 * @ignore
 */
function resetElementsWithResponsiveSources() {
    elementsLoaded.forEach((data, element) => {
        if (data.handleResponsive) {
            if (data.loadImmediately) {
                const newSource = getSourcesFromAttribute(data);
                setSource(newSource, data);
            } else {
                elementsLoaded.delete(element);
                elementsNotLoaded.set(element, data);
            }
        }
    });

    if (elementsNotLoaded.size) {
        if (!isEventListenerSet.scroll) {
            onScroll(
                window,
                detectElementsInViewport,
                globalSettings.onScrollThrottleMs
            );
            isEventListenerSet.scroll = true;
        }

        elementsNotLoaded.forEach(data => setPlaceholder(data));

        detectElementsInViewport();
    }

    if (elementsHandledManually.size) {
        elementsHandledManually.forEach(
            data => data.hasLoaded || setPlaceholder(data)
        );
    }
}

/**
 * Set class name on element.
 *
 * @ignore
 * @param {LazyLoadData} data
 * @param {("initialized"|"loading"|"error"|"loaded"|null)} state - Set to "initialized", "loading", "error" or "loaded". Or null to remove all class names.
 */
function setClassName({ classNames, elements }, state) {
    const classes = {
        initialized: `${classNames.base}--${classNames.initialized}`,
        loading: `${classNames.base}--${classNames.loading}`,
        loaded: `${classNames.base}--${classNames.loaded}`,
        error: `${classNames.base}--${classNames.error}`
    };

    removeClass(
        elements.outer,
        [classes.loading, classes.loaded, classes.error].concat(
            state ? [] : classes.initialized
        )
    );

    if (state) {
        addClass(elements.outer, classes[state]);
    }
}

/**
 * Setup lazy load. If you wanna lazy load something, you've come to the right place.
 *
 * @param {string|NodeList|Element|Element[]} [elements] - The elements to lazy load or a selector to query. If none is given, a selector will be generated from all the possible data attributes.
 * @param {LazyLoadSettings} [options={}] - An object with settings.
 */
export function lazyLoad(elements, options = {}) {
    const settings = {
        ...defaultSettings,
        ...options,
        classNames: {
            ...defaultSettings.classNames,
            ...(options && options.classNames)
        },
        onLoading: sanitizeCallbacks(options.onLoading),
        onLoaded: sanitizeCallbacks(options.onLoaded),
        onError: sanitizeCallbacks(options.onError)
    };
    let elementsToLoad;

    // Find elements to load from a given selector string
    // or create a selector string of all the possible data attributes.
    if (!elements || typeof elements === "string") {
        elementsToLoad = document.querySelectorAll(
            elements || `[${sourceAttribute}]`
        );
    }

    // A NodeList or an array of elements was given.
    else if (typeof elements === "object" && elements.length) {
        elementsToLoad = elements;
    }

    // A single element was given.
    else if (elements instanceof Element) {
        elementsToLoad = [elements];
    }

    if (!elementsToLoad) {
        throw "lazyLoad's elements argument was not given as a string or a nodeList.";
    }

    if (elementsToLoad.length) {
        let setResizeEventListener = false;

        forEach(elementsToLoad, elementToLoad => {
            const {
                classNames,
                loadManually,
                loadImmediately,
                reloadOnResize
            } = settings;
            const defaultElement = isElementTag(
                elementToLoad,
                "source",
                "track"
            )
                ? elementToLoad.parentElement
                : elementToLoad;
            const elements = {
                base: defaultElement,
                outer: defaultElement,
                control: defaultElement,
                sourceChildren: defaultElement
            };
            let useSourceChildren = false;

            // Only continue if element hasn't already been initialized.
            if (
                !elementsLoaded.has(elements.base) &&
                !elementsNotLoaded.has(elements.base) &&
                !elementsHandledManually.has(elements.base)
            ) {
                // Some elements need a wrapper.
                if (elementNeedsWrapper(elements.base)) {
                    // If the element already has a wrapper, we should just skip it.
                    if (
                        hasClass(
                            elements.base.parentElement,
                            `${classNames.base}--${classNames.wrapper}`
                        )
                    ) {
                        return;
                    }

                    elements.outer = createElement("div", {
                        className: [
                            `${classNames.base}--${classNames.wrapper}`,
                            `${
                                classNames.base
                            }--${elements.base.tagName.toLowerCase()}`
                        ],
                        style: isElementTag(elements.base, "embed")
                            ? {}
                            : {
                                  display: "inline-block",
                                  visibility: "hidden",
                                  margin: 0,
                                  border: 0,
                                  padding: 0,
                                  height: 0,
                                  width: 0
                              }
                    });

                    wrapElement(elements.base, elements.outer);
                }

                // Some elements have children of the source and track variety and need to be handled differently.
                if (isElementTag(elements.base, "picture", "audio", "video")) {
                    const sources = elements.base.querySelectorAll(
                        "source, track"
                    );

                    if (sources.length) {
                        elements.sourceChildren = sources;
                        useSourceChildren = true;
                    }

                    if (isElementTag(elements.base, "picture")) {
                        elements.control = elements.base.querySelector("img");
                    }
                }

                const elementData = {
                    ...settings,
                    handleResponsive: false,
                    useSourceChildren,
                    elements,
                    hasLoaded: loadImmediately
                };

                elementData.handleResponsive =
                    reloadOnResize &&
                    allSourceAttributes.reduce(
                        (isResponsive, attribute) =>
                            isResponsive ||
                            getSourcesFromAttribute(elementData, attribute)
                                .breakpointCount > 1,
                        false
                    );

                // If any of the elements have attributes for breakpoints,
                // that must mean we should handle responsiveness,
                // thus we'll need to listen for the window resize event.
                if (elementData.handleResponsive) {
                    setResizeEventListener = true;
                }

                if (!hasClass(elements.outer, classNames.base)) {
                    addClass(elements.outer, classNames.base);
                }

                setClassName(elementData, "initialized");

                // Store the element in the appropriate Map object.
                (loadManually
                    ? elementsHandledManually
                    : loadImmediately
                    ? elementsLoaded
                    : elementsNotLoaded
                ).set(elements.base, elementData);

                // Listen for the TRIGGER event.
                addEvent(elements.base, LAZY_EVENTS.TRIGGER, () => {
                    const data =
                        elementsHandledManually.get(elements.base) ||
                        elementsLoaded.get(elements.base) ||
                        elementsNotLoaded.get(elements.base);
                    const newSource = getSourcesFromAttribute(data);
                    setSource(newSource, data);
                });

                // Load source immediately if that's what's up.
                if (loadImmediately) {
                    const newSource = getSourcesFromAttribute(elementData);
                    setSource(newSource, elementData);
                }

                // Set placeholder SVGs for images. For IMG elements, src is a mandatory attribute,
                // so if no src or placeholder is defined, it will be set to a blank 1x1px SVG.
                else {
                    setPlaceholder(elementData);
                }
            }
        });

        // Show elements that are already visible in the viewport.
        detectElementsInViewport();

        // Set event listeners if they are needed and haven't been set already.
        if (!isEventListenerSet.scroll && elementsNotLoaded.size) {
            onScroll(
                window,
                detectElementsInViewport,
                globalSettings.onScrollThrottleMs
            );
            isEventListenerSet.scroll = true;
        }

        if (!isEventListenerSet.resize && setResizeEventListener) {
            onWindowResize(resetElementsWithResponsiveSources);
            isEventListenerSet.resize = true;
        }
    }
}

/**
 * Remove lazy load functionality from element.
 *
 * @param {Element|Element[]|NodeList} elements
 */
export function removeLazyLoad(elements) {
    if (elements) {
        forEach(elements, element => {
            const data =
                elementsLoaded.get(element) ||
                elementsNotLoaded.get(element) ||
                elementsHandledManually.get(element);

            if (data) {
                setClassName(data, null);
                removeEvent(element, LAZY_EVENTS.TRIGGER);
                removeEvent(data.elements.control, "load canplay error");
                elementsLoaded.delete(element) ||
                    elementsNotLoaded.delete(element) ||
                    elementsHandledManually.delete(element);
            }
        });
    }
}

/**
 * Change the global settings. If you're gonna use this, you should do it before running `lazyLoad()`.
 *
 * @param {LazyLoadGlobalSettings} options - Global settings to overwrite.
 */
export function setLazyLoadGlobalSettings(options) {
    globalSettings = {
        ...globalSettings,
        ...options
    };
}
