/**
 * This module loops the dom to collect image wrapper classes.
 * It then adds the images (normal img tags and background images) to the dom
 * with a src based on screen width.
 *
 *
 * @module utils/dom/imageHandler
 * @author Bjarni Olsen <bjarni.olsen@akqa.com>
 * @author Anders Gissel <anders.gissel@akqa.com>
 * @deprecated Replaced by lazyLoad (v3.10.0, 25-03-2019).
 *
 * @example
 * <caption>
 * Basic HTML for handling an image in different sizes depending on the size of the viewport.
 *
 * **Important:** `data-src-xxs` - or whichever breakpoint is the smallest in you setup - *must* be defined.
 * </caption>
 * {@lang html}
 * <div class="imagehandler"
 *     data-src-xxs="path/to/image/xxs.jpg"
 *     data-src-xs="path/to/image/xs.jpg"
 *     data-src-sm="path/to/image/sm.jpg"
 *     data-src-md="path/to/image/md.jpg"
 *     data-src-lg="path/to/image/lg.jpg"
 *     data-src-xl="path/to/image/xl.jpg"
 *     data-src-xxl="path/to/image/xxl.jpg"
 *     data-alt="Dummy Alt text">
 *     <noscript>
 *         <img src="path/to/image/fallback.jpg" alt="Dummy Alt text">
 *     </noscript>
 * </div>
 *
 * @example
 * <caption>
 * Basic HTML for handling a **background image** in different sizes depending on the size of the viewport.
 * </caption>
 * {@lang html}
 * <div class="bg-imagehandler"
 *     data-src-xxs="path/to/image/xxs.jpg"
 *     data-src-sm="path/to/image/sm.jpg"
 *     data-src-lg="path/to/image/lg.jpg"
 *     style="background-image: url('path/to/image/fallback.jpg')">
 * </div>
 *
 * @example <caption>Basic javascript:</caption>
 * import "./utils/dom/imageHandler";
 * // That's it.
 */

import {
    currentBreakpoint,
    breakpointIndex,
    onWindowResize
} from "../events/onWindowResize";
import { onReady } from "../events/onReady";
import { forEach } from "../forEach";
import { addClass, removeClass } from "./classList";
import { loadImage } from "../network/loadImage";

const loadingClassname = "image--loading";
const loadedClassname = "image--loaded";
let lastUsedScreenWidth;
const dom = {};

/**
 * This function gets the data-src from the image wrapper, based on width of the browser window.
 *
 * @private
 * @param {HTMLElement} image - Image wrapper element
 * @returns {string}
 */
function getImageSrc(image) {
    let src = "";
    let largestBreakpointFound = 0;

    forEach(breakpointIndex, (sizeIndication, breakpointName) => {
        if (
            currentBreakpoint >= sizeIndication &&
            sizeIndication > largestBreakpointFound
        ) {
            src = image.getAttribute(`data-src-${breakpointName}`) || src;

            // Make sure we won't set the size to a smaller breakpoint later, in case they're not properly ordered.
            largestBreakpointFound = sizeIndication;
        }
    });

    return src;
}

/**
 * This function gets the image wrapper data attributes src and alt text,
 * creates a new image and appends it to image wrapper.
 *
 * @private
 * @param {HTMLElement} currentImage - Image wrapper element
 */
function createImage(currentImage) {
    const src = getImageSrc(currentImage);

    // If no usable source was returned, abort at once.
    if (!src) {
        return;
    }

    // We don't want to start processing if the new URL matches the old one.
    const oldImage = currentImage.querySelector(`img.${loadedClassname}`);
    if (oldImage) {
        if (oldImage.getAttribute("src") === src) {
            return;
        }
    }

    // Add loading-class to current image.
    addClass(currentImage, loadingClassname);

    // Load the image.
    loadImage(src).then(newImageTag => {
        // Set the ALT text.
        const altText = currentImage.getAttribute("data-alt") || "";
        newImageTag.setAttribute("alt", altText);

        addClass(newImageTag, loadedClassname);

        // Empty the image container completely, just to be safe. The inline <noscript>-block
        // isn't needed at this point, and if we don't empty the object completely, we may get
        // broken node relations that result in double images. This is way better.
        currentImage.innerHTML = "";

        removeClass(currentImage, loadingClassname);
        currentImage.appendChild(newImageTag);
    });
}

/**
 * This function gets the image wrapper data attributes src and alt text
 * and creates an new image tag to download the image.
 * It then uses the src as a background-image.
 *
 * @private
 * @param {HTMLElement} currentContainer - Image wrapper element
 */
function loadBgImage(currentContainer) {
    const src = getImageSrc(currentContainer);

    // If no usable source was returned, abort at once.
    if (!src) {
        return;
    }

    const formattedSrc = `url(${encodeURI(src)})`;

    if (currentContainer.style.backgroundImage === formattedSrc) {
        return;
    }

    // Add loading-class to image.
    addClass(currentContainer, loadingClassname);

    // Start loading the new image.
    loadImage(src).then(() => {
        currentContainer.style.backgroundImage = formattedSrc;
        addClass(currentContainer, loadedClassname);
        removeClass(currentContainer, loadingClassname);
    });
}

/**
 * @private
 */
function refreshAll() {
    // If our current screen mode does not match the one we used the last time we made an image lookup,
    // perform a new one now. Otherwise, what would be the point?
    if (lastUsedScreenWidth !== currentBreakpoint) {
        forEach(dom.images, createImage);
        forEach(dom.bgImages, loadBgImage);
        lastUsedScreenWidth = currentBreakpoint;
    }
}

/**
 * Refresh all responsive images on the page.
 */
export function refreshImages() {
    dom.images = document.querySelectorAll(".imagehandler");
    dom.bgImages = document.querySelectorAll(".bg-imagehandler");
    lastUsedScreenWidth = -1;
    refreshAll();
}

onReady(() => {
    onWindowResize(refreshAll);
    refreshImages();
});
