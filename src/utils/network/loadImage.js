/**
 * @module utils/network/loadImage
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 */

import { addEvent, removeEvent } from "../events/events";

/**
 * Try to decode the image, after it's loaded, and resolve the Promise.
 *
 * @private
 * @param {Element} newImage
 * @returns {Promise<Image>}
 */
export const decodeImage = newImage =>
    "decode" in newImage
        ? newImage.decode().then(() => newImage)
        : Promise.resolve(newImage);

/**
 * Load an image, and return a Promise that resolves once the image is loaded.
 *
 * @param {string} source - The path to the image.
 * @param {Object} [options] - Object of settings.
 * @param {boolean} [options.useSrcset=false] - Set to true to use the `srcset` attribute instead of `src`.
 * @param {string} [options.sizes=""] - If you're using `srcset`, you can also add a `sizes` attribute.
 * @returns {Promise<Image>} Promise that will resolve with the loaded image once it's ready.
 */
export function loadImage(source, { useSrcset = false, sizes = "" } = {}) {
    const newImage = new Image();

    if (useSrcset && sizes && "sizes" in newImage) {
        newImage.sizes = sizes;
    }

    return new Promise((resolve, reject) => {
        addEvent(newImage, "load", () => {
            removeEvent(newImage, "load error");
            decodeImage(newImage).then(image => resolve(image));
        });

        addEvent(newImage, "error", () => {
            removeEvent(newImage, "load error");
            reject();
        });

        newImage[useSrcset ? "srcset" : "src"] = source;
    });
}
