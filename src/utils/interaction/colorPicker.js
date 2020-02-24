/**
 * This is a utility for creating highly customizable color pickers. Each color picker can handle one to two spectra,
 * e.g. hue only, alpha only, hue and saturation, lightness and alpha, and so on.
 *
 * #### Hue, saturation, lightness and alpha
 * Set `hue`, `saturation`, `lightness` and/or `alpha` to `true` to show their respectable spectrum in the picker.
 * The ones you don't want to be able to change you can leave at the default value (false) or set to a number between
 * 0 and 1. If that's too much of a hassle but you still want a base color, just set `baseColor` to a color of your
 * choice.
 *
 * #### Look and feel
 * To make it fit your (or your designer's) needs, you can show the picker as a square or a circle, the direction of
 * all spectra can be individually inverted by setting `invertHue` or one of the others to `true`, and the whole thing
 * can be rotated 90 degrees by setting `rotate` to `true`.
 *
 * #### Interaction
 * Interacting with the color picker is handled through the "pickers", and since it makes no sense to have a color
 * picker without at least one picker, a default will be created. You can change this in the `defaultPicker` property.
 * If you want more than one, you can add more with the method `addPicker(name, color)`. All pickers need a name so you
 * can distinguish them from each other in the callbacks.
 *
 * If a color picker only handles a single spectrum (hue, saturation, lightness or alpha), the picker will be
 * constrained to only move on a single axis (x or y depending on the `rotate` property). Set `constrainIfSingleAxis` to
 * `false` if you want pickers to be able to be moved freely.
 *
 * If there's only one picker available, event listeners will be set on the entire module so you don't have to click on
 * the picker itself when wanting to change a color. Obviously, this won't work with more than one picker. And if you
 * don't like it, just disable it by setting the property `snapPickerToCursor` to `false`.
 *
 * By default the picker can be moved a bit outside the module on all sides. That's because its meant to select the
 * color directly underneath its own center. However, this doesn't always make sense, and in those cases you can set
 * `keepPickerInsideCanvas` to `true` - but be aware that the selected color won't be the one directly underneath the
 * picker.
 *
 * #### Callbacks
 * Callbacks! We have callbacks. `onStart()`, `onMove()` and `onSelect()`. These are pretty much self explanatory,
 * and with every callback comes an object containing the name of the picker and the color it represents.
 *
 * #### Updating / changing the settings
 * You might want to change some of the settings at some point, like if you have multiple color pickers that need to
 * interact with each other. Maybe you have a color picker for hue and saturation and another one for lightness.
 * You can change the baseColor in the one with lightness, whenever the hue changes in the first one. Just call
 * `update(options)` with an object of the options you want to change.
 *
 * ### Be aware!
 * **Be careful** with running `update()` and `calibrate()` as repainting the canvas can take up a lot of
 * resources in the browser, especially in Internet Explorer and Edge. This is especially true for color pickers with
 * more than one spectrum and all circular color pickers.
 *
 * Also, given the fact that the color pickers are made with canvases, and **canvases aren't responsive**, you need to
 * call `calibrate()` if the size of the module changes in the viewport.
 *
 * @module utils/interaction/ColorPicker
 * @since 3.8.0
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 *
 *
 * @example <caption>Create a color picker for hue and lightness with a red base color:</caption>
 * import { ColorPicker } from "./utils/interaction/colorPicker";
 *
 * const container = document.querySelector(".give-me-colors");
 *
 * new ColorPicker(container, {
 *     hue: true,
 *     lightness: true,
 *     baseColor: "#F00",
 *     onSelect: response => {
 *         window.console.log(response.color);
 *     },
 * });
 *
 *
 * @example
 * <caption>
 * Create two color pickers, a circular one for hue and saturation, and a rectangular one for lightness.
 *
 * When the position of the picker in the one with hue and saturation changes, the base color of the other is updated.
 * And when a color is selected in either of them, a variable is set to the new color.
 * </caption>
 * import { ColorPicker } from "./utils/interaction/colorPicker";
 *
 * let chosenColor = "#cc7";
 *
 * const hueSat = new ColorPicker(document.querySelector(".hueSat"), {
 *     hue: true,
 *     saturation: true,
 *     lightness: false,
 *     baseColor: chosenColor,
 *     circle: true,
 *     onMove: response => {
 *         light.update({
 *             baseColor: response.color
 *         });
 *     },
 *     onSelect: response => {
 *         chosenColor = response.color.rgba;
 *     },
 * });
 *
 * const light = new ColorPicker(document.querySelector(".light"), {
 *     lightness: true,
 *     baseColor: chosenColor,
 *     rotate: true,
 *     onSelect: response => {
 *         chosenColor = response.color.rgba;
 *     },
 * });
 */

import { createElement } from "../dom/createElement";
import { appendElement, deleteElement } from "../dom/elementManipulation";
import { getPart, getPercentage } from "../calc/percentage";
import { rgbToHsl, hslToRgb, parseColor } from "../calc/colors/colorConversion";
import { addEvent, removeEvent } from "../events/events";
import { setStyles } from "../dom/setStyles";
import { getDistance } from "../calc/coordinates";
import { addClass, removeClass } from "../dom/classList";
import { forEach } from "../forEach";
import { ColorMatch } from "../calc/colors/colorMatch";
import { getElementSize } from "../dom/elementProperties";

// Import the styling we need.
import "../../../scss/components/js/colorPicker.scss";

/**
 * These are the properties that can be set in the `options` objects of the color picker.
 *
 * @typedef {Object} ColorPickerOptions
 * @property {boolean|null} [hue=null] - Set to `true` to include the hue spectrum in color picker, or `false` to use the default value. If `null` its value will be taken from `baseColor` if this is provided.
 * @property {boolean|null} [saturation=null] - Set to `true` to include saturation spectrum in color picker, or `false` to use the default value. If `null` its value will be taken from `baseColor` if this is provided.
 * @property {boolean|null} [lightness=false] - Set to `true` to include the lightness spectrum in color picker, or `false` to use the default value. If `null` its value will be taken from `baseColor` if this is provided.
 * @property {boolean|null} [alpha=false] - Set to `true` to include the alpha spectrum in color picker, or `false` to use the default value. If `null` its value will be taken from `baseColor` if this is provided.
 * @property {string|RGBAObject|null} [baseColor=null] - The base color for the color picker. Set to a string (e.g. "#ff0000" or "rgba(255, 0, 0, 1)") or an object containing properties for red, green, blue and alpha.
 * @property {boolean} [invertHue=false] - Invert the direction of the hue spectrum.
 * @property {boolean} [invertSaturation=false] - Invert the direction of the saturation spectrum.
 * @property {boolean} [invertLightness=false] - Invert the lightness of the hue spectrum.
 * @property {boolean} [invertAlpha=false] - Invert the alpha of the hue spectrum.
 * @property {Object} [lightnessSpectrum={}] - Object for telling the lightness spectrum whether to show light and/or dark.
 * @property {boolean} [lightnessSpectrum.dark=true] - Setting this to `false` will only show neutral and light colors in the lightness spectrum.
 * @property {boolean} [lightnessSpectrum.light=true] - Setting this to `false` will only show neutral and dark colors in the lightness spectrum.
 * @property {boolean} [rotate=false] - Rotate the colors in the color picker by 90 degrees.
 * @property {boolean} [circle=false] - Show the color spectra in a circle instead of a square.
 * @property {function|function[]} [onStart=[]] - The callback(s) to fire when the user starts interacting with a picker.
 * @property {function|function[]} [onMove=[]] - The callback(s) to fire when the user is interacting with a picker.
 * @property {function|function[]} [onSelect=[]] - The callback(s) to fire when the user has stopped interacting with a picker.
 * @property {boolean} [constrainIfSingleAxis=true] - Set this to `false` to allow the picker to be moved freely even though there's only one spectrum represented in the color picker.
 * @property {boolean} [snapPickerToCursor=true] - When this is `true` and there's only one picker, events fired on the color picker itself will move the picker.
 * @property {boolean} [keepPickerInsideCanvas=false] - Set this to `true` to keep the picker withing the bounds of the color picker.
 * @property {Object|null} [defaultPicker] - This is the default picker, created on startup. You can set it to `null` if you don't want it.
 * @property {string} [defaultPicker.name="default"] - The name of the default picker.
 * @property {string|Object|null} [defaultPicker.color=null] - Set to a string (e.g. "#ff0000" or "rgba(255, 0, 0, 1)") or an object containing properties for red, green, blue and alpha. If this is `null` it will get the value of `baseColor`, if it has one.
 */

const classNames = {
    root: "color-picker",
    rootCircle: "color-picker--circle",
    picker: "color-picker__picker",
    pickerActive: "color-picker__picker--active",
    pickerAboveVerticalMedian: "color-picker__picker--above-vertical-median",
    pickerBelowVerticalMedian: "color-picker__picker--below-vertical-median",
    pickerAboveHorizontalMedian:
        "color-picker__picker--above-horizontal-median",
    pickerBelowHorizontalMedian:
        "color-picker__picker--below-horizontal-median",
    pickerInnerCircle: "color-picker__picker--inner-circle",
    pickerOuterCircle: "color-picker__picker--outer-circle",
    pickerOnDark: "color-picker__picker--on-dark",
    pickerOnLight: "color-picker__picker--on-light",
    color: "color-picker__color"
};

export class ColorPicker {
    /**
     * Create a color picker.
     *
     * @param {HTMLElement} container - The element to place the color picker in.
     * @param {ColorPickerOptions} options - Set up the color picker with these options.
     */
    constructor(container, options) {
        this.settings = {
            hue: null,
            saturation: null,
            lightness: false,
            alpha: false,
            baseColor: null,

            invertHue: false,
            invertSaturation: false,
            invertLightness: false,
            invertAlpha: false,
            lightnessSpectrum: {
                dark: true,
                light: true
            },
            rotate: false,
            circle: false,

            onStart: [],
            onMove: [],
            onSelect: [],

            constrainIfSingleAxis: true,
            snapPickerToCursor: true,
            keepPickerInsideCanvas: false,
            defaultPicker: {
                name: "default",
                color: null
            },

            ...options
        };

        // Make sure callbacks are in arrays
        this.settings.onStart = this.sanitizeCallbacks(this.settings.onStart);
        this.settings.onMove = this.sanitizeCallbacks(this.settings.onMove);
        this.settings.onSelect = this.sanitizeCallbacks(this.settings.onSelect);

        // If a base color is supplied, use that in the default picker, unless it has a color
        if (
            this.settings.baseColor &&
            this.settings.defaultPicker &&
            !this.settings.defaultPicker.color
        ) {
            this.settings.defaultPicker.color = this.settings.baseColor;
        }

        // Data object for keeping everything neat and easy to clean up
        this.data = {
            ready: false,
            colorMatch: new ColorMatch(),
            activePicker: {},
            elementData: {},
            endPickerReference: () => this.endPicker(),
            movePickerReference: event => this.movePicker(event),
            resetPickerReference: event => this.resetPicker(event)
        };

        // Create elements and inject them
        this.createDOM(container);
        appendElement(this.dom.root, this.dom.container);

        // Make colors and get element position and what not
        this.calibrate();

        if (this.settings.defaultPicker) {
            this.addPicker(
                this.settings.defaultPicker.name,
                this.settings.defaultPicker.color
            );
        }
    }

    /**
     * Ensure that the callback lists are populated with nothing but arrays.
     *
     * @private
     * @param {function|function[]} callbackList
     * @returns {Array}
     */
    sanitizeCallbacks(callbackList) {
        return callbackList instanceof Array
            ? callbackList.filter(callback => typeof callback === "function")
            : typeof callbackList === "function"
            ? [callbackList]
            : [];
    }

    /**
     * Fire all callbacks registered with the named type (ie. "onStart").
     *
     * @private
     * @param {string} callbackType
     * @param {Object} data
     */
    fireCallbacks(callbackType, data) {
        if (this && this.settings) {
            const callbackArray = this.settings[callbackType];
            if (Array.isArray(callbackArray) && callbackArray.length) {
                callbackArray.forEach(funcRef => {
                    funcRef(data);
                });
            }
        }
    }

    /**
     * Generate a fingerprint for the parameters determining if the canvas needs to be updated.
     *
     * @private
     * @param {{width: number, height: number}} dimensions
     * @returns {string}
     */
    generateVisualStateFingerprint(dimensions) {
        const widthHeight = `w${dimensions.width}h${dimensions.height}`;
        return (
            widthHeight +
            String(this.settings.hue) +
            String(this.settings.saturation) +
            String(this.settings.lightness) +
            String(this.settings.alpha) +
            String(this.settings.invertHue) +
            String(this.settings.invertSaturation) +
            String(this.settings.invertLightness) +
            String(this.settings.invertAlpha) +
            String(this.settings.rotate) +
            String(this.settings.circle) +
            JSON.stringify(this.settings.baseColor)
        );
    }

    /**
     * Create DOM.
     *
     * @private
     * @param {HTMLElement} container
     */
    createDOM(container) {
        let dimensions = "100%";

        if (this.settings.circle) {
            const containerSize = getElementSize(container);
            dimensions = `${Math.min(
                containerSize.width,
                containerSize.height
            )}px`;
        }

        if (dimensions === 0) {
            throw "The container for the Color Picker needs width and height.";
        }

        this.dom = {
            container,

            // This is the root element, in which all out other elements are put into
            root: createElement("div", {
                className: [classNames.root].concat(
                    this.settings.circle ? classNames.rootCircle : []
                ),
                style: {
                    width: dimensions,
                    height: dimensions
                }
            }),

            // This is the canvas where the colors are shown
            canvas: createElement("canvas"),

            // This is an off screen canvas, which the colors are drawn to before being put into the previous canvas.
            // There's not much benefit to this, but it gives a bit of a boost in IE and Edge, where everything counts.
            offScreenCanvas: createElement("canvas"),

            // Pickers are stored in this object
            pickers: {}
        };

        appendElement(this.dom.canvas, this.dom.root);

        // Save the drawing contexts for the canvases in the data object
        this.data.context = this.dom.canvas.getContext("2d");
        this.data.offScreenContext = this.dom.offScreenCanvas.getContext("2d");
    }

    /**
     * Add a picker to the color picker.
     *
     * @param {string} name - The name of the picker, so you can recognize it in the callbacks.
     * @param {string|Object} color - The color to place the picker on.
     * @returns {ColorPicker} The color picker object, for function chaining.
     */
    addPicker(name, color) {
        // If a picker with the given name already exists it will be removed before a new one is created.
        if (typeof this.dom.pickers[name] !== "undefined") {
            this.removePicker(name);
        }

        const picker = {
            name,
            element: createElement("div", {
                "data-name": name,
                className: [
                    classNames.picker,
                    `${classNames.picker}--${name.replace(/\s/, "-")}`
                ]
            }),
            colorElement: createElement("div", {
                className: classNames.color
            })
        };

        appendElement(picker.colorElement, picker.element);
        appendElement(picker.element, this.dom.root);

        // Get the picker's size and boundaries for positioning it correctly later on
        picker.size = {
            width: picker.element.offsetWidth,
            height: picker.element.offsetHeight
        };
        picker.boundaries = {
            x: this.settings.keepPickerInsideCanvas ? picker.size.width / 2 : 0,
            y: this.settings.keepPickerInsideCanvas ? picker.size.height / 2 : 0
        };

        // Set the picker's position
        const defaultPositions = {
            x: 33,
            y: 33
        };

        if (color) {
            const nearestColorInPalette = this.data.colorMatch.near(color);

            defaultPositions.x = nearestColorInPalette[0].position[0] * 100;
            defaultPositions.y = nearestColorInPalette[0].position[1] * 100;
        }

        picker.position = {
            x:
                !this.settings.circle &&
                this.settings.constrainIfSingleAxis &&
                this.data.spectrumCount === 1 &&
                this.settings.rotate
                    ? 50
                    : defaultPositions.x,
            y:
                !this.settings.circle &&
                this.settings.constrainIfSingleAxis &&
                this.data.spectrumCount === 1 &&
                !this.settings.rotate
                    ? 50
                    : defaultPositions.y
        };

        this.updatePicker(picker);
        this.dom.pickers[name] = picker;

        // Add event listeners to picker
        addEvent(picker.element, "mousedown touchstart", event =>
            this.startPicker(event, picker)
        );

        // If this is the only picker, maybe add event listeners to the entire module
        if (
            this.settings.snapPickerToCursor &&
            Object.keys(this.dom.pickers).length === 1
        ) {
            addEvent(this.dom.root, "mousedown touchstart", event =>
                this.startPicker(event, picker)
            );
        }

        // If this is not the only picker, make sure there are no event listeners on the entire module
        else {
            removeEvent(this.dom.root, "mousedown touchstart");
        }

        return this;
    }

    /**
     * Place the picker on a color on the color picker.
     *
     * *Peter Piper picked a peck of pickled peppers.*
     *
     * @param {string|Object} color - The color to place the picker on.
     * @param {string} [name="default"]
     * @returns {ColorPicker} The color picker object, for function chaining.
     */
    placePicker(color, name = "default") {
        const picker = this.dom.pickers[name];

        if (typeof picker !== "undefined" && color) {
            // Update colorMatch with new palette if it's needed
            if (this.data.palette.length) {
                this.data.colorMatch.flush().add(this.data.palette);
                this.data.palette = [];
            }

            // Get the nearest color to the one given in the color argument
            const nearestColorInPalette = this.data.colorMatch.near(color);

            // Set new position in picker
            picker.position = {
                x:
                    !this.settings.circle &&
                    this.settings.constrainIfSingleAxis &&
                    this.data.spectrumCount === 1 &&
                    this.settings.rotate
                        ? 50
                        : nearestColorInPalette[0].position[0] * 100,
                y:
                    !this.settings.circle &&
                    this.settings.constrainIfSingleAxis &&
                    this.data.spectrumCount === 1 &&
                    !this.settings.rotate
                        ? 50
                        : nearestColorInPalette[0].position[1] * 100
            };

            // Update picker
            this.updatePicker(picker);
        }

        return this;
    }

    /**
     * Remove a picker from the color picker.
     *
     * @param {string} [name="default"] - The name of the picker you want to remove.
     * @returns {ColorPicker} The color picker object, for function chaining.
     */
    removePicker(name = "default") {
        const picker = this.dom.pickers[name];

        if (typeof picker !== "undefined") {
            if (Object.keys(this.dom.pickers).length === 1) {
                removeEvent(this.dom.root, "mousedown touchstart");
                removeEvent(window, "keydown", this.data.resetPickerReference);
            }

            removeEvent(picker.element, "mousedown touchstart");
            deleteElement(picker.element);
            delete this.dom.pickers[name];
        }

        return this;
    }

    /**
     * Handle mouseDown and touchStart events on pickers.
     *
     * @private
     * @param {MouseEvent|TouchEvent} event
     * @param {Object} picker
     */
    startPicker(event, picker) {
        event.preventDefault();
        event.stopPropagation();

        if (event.type !== "mousedown" || event.button === 0) {
            this.data.elementData.position = this.dom.root.getBoundingClientRect();
            addClass(picker.element, classNames.pickerActive);
            this.data.activePicker = picker;

            this.fireCallbacks("onStart", {
                picker: picker.name,
                color: picker.color
            });

            addEvent(
                document,
                "mousemove touchmove",
                this.data.movePickerReference
            );
            addEvent(
                document,
                "mouseup touchend",
                this.data.endPickerReference
            );
            addEvent(window, "keydown", this.data.resetPickerReference);

            this.movePicker(event);
        }
    }

    /**
     * Handle mouseUp and touchEnd events on pickers.
     *
     * @private
     */
    endPicker() {
        this.data.activePicker.lastPosition = this.data.activePicker.position;
        removeClass(this.data.activePicker.element, classNames.pickerActive);

        removeEvent(
            document,
            "mousemove touchmove",
            this.data.movePickerReference
        );
        removeEvent(document, "mouseup touchend", this.data.endPickerReference);
        removeEvent(window, "keydown", this.data.resetPickerReference);

        this.fireCallbacks("onSelect", {
            picker: this.data.activePicker.name,
            color: this.data.activePicker.color
        });
    }

    /**
     * Reset the picker to its last position.
     *
     * @private
     * @param {MouseEvent|TouchEvent} event
     */
    resetPicker(event) {
        if (event.key === "Escape") {
            this.data.activePicker.position = this.data.activePicker.lastPosition;
            this.updatePicker(this.data.activePicker);
            this.endPicker();
        }
    }

    /**
     * Handle mouseMove and touchMove events on pickers.
     *
     * @private
     * @param {MouseEvent|TouchEvent} event
     */
    movePicker(event) {
        if (event.type === "mousemove" && event.buttons === 0) {
            this.endPicker();
            return;
        }

        const isMouse = typeof event.touches === "undefined";

        // Move picker inside circle
        if (this.settings.circle) {
            // Get new picker position from touch/mouse positions
            const xPosition =
                (isMouse ? event.clientX : event.touches[0].clientX) -
                this.data.elementData.position.left -
                this.data.activePicker.boundaries.x;

            const yPosition =
                (isMouse ? event.clientY : event.touches[0].clientY) -
                this.data.elementData.position.top -
                this.data.activePicker.boundaries.y;

            const position = {
                x: getPercentage(
                    xPosition,
                    this.data.elementData.size.width -
                        this.data.activePicker.boundaries.x * 2
                ),
                y: getPercentage(
                    yPosition,
                    this.data.elementData.size.height -
                        this.data.activePicker.boundaries.y * 2
                )
            };

            // Store position in picker object (but keep it inside the radius of the circle)
            if (getDistance([50, 50], position) > 50) {
                const radians = Math.atan2(position.y - 50, position.x - 50);
                this.data.activePicker.position.x = Math.cos(radians) * 50 + 50;
                this.data.activePicker.position.y = Math.sin(radians) * 50 + 50;
            } else {
                this.data.activePicker.position = position;
            }
        }

        // Move picker inside rectangle
        else {
            // Get new picker position from touch/mouse positions
            const xPosition = Math.min(
                Math.max(
                    (isMouse ? event.clientX : event.touches[0].clientX) -
                        this.data.elementData.position.left,
                    this.data.activePicker.boundaries.x
                ),
                this.data.elementData.size.width -
                    this.data.activePicker.boundaries.x
            );

            const yPosition = Math.min(
                Math.max(
                    (isMouse ? event.clientY : event.touches[0].clientY) -
                        this.data.elementData.position.top,
                    this.data.activePicker.boundaries.y
                ),
                this.data.elementData.size.height -
                    this.data.activePicker.boundaries.y
            );

            // Store position in picker object
            const constrainPicker =
                !this.settings.circle &&
                this.settings.constrainIfSingleAxis &&
                this.data.spectrumCount === 1;
            this.data.activePicker.position = {
                x:
                    constrainPicker && this.settings.rotate
                        ? 50
                        : getPercentage(
                              xPosition - this.data.activePicker.boundaries.x,
                              this.data.elementData.size.width -
                                  this.data.activePicker.boundaries.x * 2
                          ),
                y:
                    constrainPicker && !this.settings.rotate
                        ? 50
                        : getPercentage(
                              yPosition - this.data.activePicker.boundaries.y,
                              this.data.elementData.size.height -
                                  this.data.activePicker.boundaries.y * 2
                          )
            };
        }

        this.updatePicker(this.data.activePicker);

        this.fireCallbacks("onMove", {
            picker: this.data.activePicker.name,
            color: this.data.activePicker.color
        });
    }

    /**
     * Get the position of a picker.
     *
     * @private
     * @param {Object} picker
     * @returns {{x: Number, y: Number}}
     */
    getPickerPosition(picker) {
        const pickerPosition = picker.element.getBoundingClientRect();
        const xPosition =
            pickerPosition.left +
            picker.size.width / 2 -
            this.data.elementData.position.left -
            picker.boundaries.x;
        const yPosition =
            pickerPosition.top +
            picker.size.height / 2 -
            this.data.elementData.position.top -
            picker.boundaries.y;

        return {
            x: getPercentage(
                xPosition,
                this.data.elementData.size.width - picker.boundaries.x * 2
            ),
            y: getPercentage(
                yPosition,
                this.data.elementData.size.height - picker.boundaries.y * 2
            )
        };
    }

    /**
     * Get the color of a picker.
     *
     * @private
     * @param {Object} picker
     * @returns {{red: number, green: number, blue: number, alpha: number, rgba: string}}
     */
    getColor(picker) {
        const width = this.dom.canvas.width;
        const height = this.dom.canvas.height;
        const xPosition =
            Math.min(getPart(picker.position.x, width + 1), width - 1) || 0;
        const yPosition =
            Math.min(getPart(picker.position.y, height + 1), height - 1) || 0;
        const imageData = this.data.context.getImageData(
            xPosition,
            yPosition,
            1,
            1
        );

        const rgba = {
            red: imageData.data[0],
            green: imageData.data[1],
            blue: imageData.data[2],
            alpha: getPercentage(imageData.data[3], 255) / 100
        };

        return {
            ...rgba,
            rgba: `rgba(${rgba.red}, ${rgba.green}, ${rgba.blue}, ${rgba.alpha})`
        };
    }

    /**
     * Update the position and color of the currently active picker.
     *
     * @private
     * @param {Object} picker
     */
    updatePicker(picker) {
        if (picker) {
            const xPosition =
                getPart(
                    picker.position.x,
                    this.data.elementData.size.width - picker.boundaries.x * 2
                ) + picker.boundaries.x;
            const yPosition =
                getPart(
                    picker.position.y,
                    this.data.elementData.size.height - picker.boundaries.y * 2
                ) + picker.boundaries.y;

            picker.lastColor = picker.color;
            picker.color = this.getColor(picker);

            if (!picker.lastColor) {
                picker.lastColor = picker.color;
                picker.lastPosition = picker.position;
            }

            // Set position and color styles

            setStyles(picker.element, {
                left: `${xPosition}px`,
                top: `${yPosition}px`
            });

            setStyles(picker.colorElement, {
                backgroundColor: picker.color.rgba
            });

            // Set modifier classes

            if (picker.position.x >= 50) {
                addClass(
                    picker.element,
                    classNames.pickerAboveHorizontalMedian
                );
                removeClass(
                    picker.element,
                    classNames.pickerBelowHorizontalMedian
                );
            } else {
                addClass(
                    picker.element,
                    classNames.pickerBelowHorizontalMedian
                );
                removeClass(
                    picker.element,
                    classNames.pickerAboveHorizontalMedian
                );
            }

            if (picker.position.y >= 50) {
                addClass(picker.element, classNames.pickerBelowVerticalMedian);
                removeClass(
                    picker.element,
                    classNames.pickerAboveVerticalMedian
                );
            } else {
                addClass(picker.element, classNames.pickerAboveVerticalMedian);
                removeClass(
                    picker.element,
                    classNames.pickerBelowVerticalMedian
                );
            }

            if (this.settings.circle) {
                const dy = picker.position.y - 50;
                const dx = picker.position.x - 50;
                const d = Math.sqrt(dy * dy + dx * dx);

                if (d >= 25) {
                    addClass(picker.element, classNames.pickerOuterCircle);
                    removeClass(picker.element, classNames.pickerInnerCircle);
                } else {
                    addClass(picker.element, classNames.pickerInnerCircle);
                    removeClass(picker.element, classNames.pickerOuterCircle);
                }
            }

            const hsl = rgbToHsl(picker.color);

            if (hsl.lightness >= 0.8) {
                addClass(picker.element, classNames.pickerOnLight);
                removeClass(picker.element, classNames.pickerOnDark);
            } else if (hsl.lightness <= 0.2) {
                addClass(picker.element, classNames.pickerOnDark);
                removeClass(picker.element, classNames.pickerOnLight);
            } else {
                removeClass(picker.element, classNames.pickerOnLight);
                removeClass(picker.element, classNames.pickerOnDark);
            }
        }
    }

    /**
     * Create the color spectrum in the canvas.
     *
     * @private
     */
    createColors() {
        // Dimensions
        const width = this.dom.canvas.width;
        const height = this.dom.canvas.height;
        const radius = Math.round(width / 2);
        this.dom.offScreenCanvas.width = width;
        this.dom.offScreenCanvas.height = height;

        // Width and height for calculating percentages, since arrays are zero-based, but image dimensions are not
        const widthForPercentages = width - 1;
        const heightForPercentages = height - 1;

        // Arrays and stuff for holding color data
        const imageData = this.data.offScreenContext.createImageData(
            width,
            height
        );
        const data = imageData.data;
        const buffer = new ArrayBuffer(data.length);
        const buffer8 = new Uint8ClampedArray(buffer);
        const data32 = new Uint32Array(buffer);
        const isBigEndian =
            buffer[4] === 0x0a &&
            buffer[5] === 0x0b &&
            buffer[6] === 0x0c &&
            buffer[7] === 0x0d;
        const palette = [];

        // HSLA bases
        const baseColor = this.settings.baseColor
            ? parseColor(this.settings.baseColor)
            : null;
        const baseColorHSL = baseColor ? rgbToHsl(baseColor) : null;
        const defaultHue =
            this.settings.hue !== false && baseColorHSL
                ? baseColorHSL.hue / 360
                : 0;
        const defaultSaturation =
            this.settings.saturation !== false && baseColorHSL
                ? baseColorHSL.saturation
                : 1;
        const defaultLightness =
            this.settings.lightness !== false && baseColorHSL
                ? baseColorHSL.lightness
                : 0.5;
        const defaultAlpha =
            this.settings.alpha !== false && baseColor ? baseColor.alpha : 1;

        // Booleans for telling what to do
        const isSingleSpectrum = this.data.spectrumCount === 1;
        const createHue = this.settings.hue === true;
        const createSaturation = this.settings.saturation === true;
        const lightnessLight =
            typeof this.settings.lightnessSpectrum.light !== "boolean" ||
            this.settings.lightnessSpectrum.light !== false;
        const lightnessDark =
            typeof this.settings.lightnessSpectrum.dark !== "boolean" ||
            this.settings.lightnessSpectrum.dark !== false;
        const createLightness =
            this.settings.lightness === true &&
            (lightnessDark || lightnessLight);
        const createAlpha = this.settings.alpha === true;

        // Create a color for every pixel in the canvas
        for (
            let y = 0;
            y <
            (!this.settings.circle && isSingleSpectrum && !this.settings.rotate
                ? 1
                : height);
            y += 1
        ) {
            for (
                let x = 0;
                x <
                (!this.settings.circle &&
                isSingleSpectrum &&
                this.settings.rotate
                    ? 1
                    : width);
                x += 1
            ) {
                const index = y * width + x;
                const xPercentage = this.settings.rotate
                    ? y / heightForPercentages
                    : x / widthForPercentages;
                const yPercentage = this.settings.rotate
                    ? x / widthForPercentages
                    : y / heightForPercentages;

                let hue = defaultHue;
                let saturation = defaultSaturation;
                let lightness = defaultLightness;
                let alpha = defaultAlpha;

                // Create colors in a circular formation.
                if (this.settings.circle) {
                    const dy = y - radius;
                    const dx = x - radius;
                    const d = Math.sqrt(dy * dy + dx * dx);

                    if (d > radius + 2) {
                        continue;
                    }

                    hue = createHue
                        ? this.settings.invertHue
                            ? 1 - Math.atan2(dy, dx) / (Math.PI * 2)
                            : Math.atan2(dy, dx) / (Math.PI * 2)
                        : hue;

                    saturation = createSaturation
                        ? Math.max(
                              0,
                              Math.min(
                                  1,
                                  createLightness || createAlpha
                                      ? this.settings.invertSaturation
                                          ? 1 - xPercentage
                                          : xPercentage
                                      : this.settings.invertSaturation
                                      ? 1 - d / radius
                                      : d / radius
                              )
                          )
                        : saturation;

                    lightness = createLightness
                        ? Math.max(
                              0,
                              Math.min(
                                  1,
                                  createAlpha
                                      ? this.settings.invertLightness
                                          ? (lightnessDark
                                                ? xPercentage
                                                : 0.5 + xPercentage / 2) /
                                            (lightnessLight ? 1 : 2)
                                          : 1 -
                                            (lightnessLight
                                                ? xPercentage
                                                : 0.5 + xPercentage / 2) /
                                                (lightnessDark ? 1 : 2)
                                      : this.settings.invertLightness
                                      ? lightnessDark
                                          ? d /
                                            radius /
                                            (lightnessLight ? 1 : 2)
                                          : 0.5 + d / radius / 2
                                      : lightnessLight
                                      ? 1 - d / radius / (lightnessDark ? 1 : 2)
                                      : 0.5 - d / radius / 2
                              )
                          )
                        : lightness;

                    alpha = createAlpha
                        ? Math.max(
                              0,
                              Math.min(
                                  1,
                                  !this.settings.invertAlpha ||
                                      createSaturation ||
                                      createLightness
                                      ? d / radius
                                      : 1 - d / radius
                              )
                          )
                        : alpha;
                }

                // Create colors in a linear formation.
                else {
                    hue = createHue
                        ? this.settings.invertHue
                            ? 1 - xPercentage
                            : xPercentage
                        : hue;

                    saturation = createSaturation
                        ? isSingleSpectrum || createLightness
                            ? this.settings.invertSaturation
                                ? xPercentage
                                : 1 - xPercentage
                            : this.settings.invertSaturation
                            ? yPercentage
                            : 1 - yPercentage
                        : saturation;

                    lightness = createLightness
                        ? isSingleSpectrum
                            ? this.settings.invertLightness
                                ? (lightnessDark
                                      ? xPercentage
                                      : 0.5 + xPercentage / 2) /
                                  (lightnessLight ? 1 : 2)
                                : 1 -
                                  (lightnessLight
                                      ? xPercentage
                                      : 0.5 + xPercentage / 2) /
                                      (lightnessDark ? 1 : 2)
                            : this.settings.invertLightness
                            ? (lightnessDark
                                  ? yPercentage
                                  : 0.5 + yPercentage / 2) /
                              (lightnessLight ? 1 : 2)
                            : 1 -
                              (lightnessLight
                                  ? yPercentage
                                  : 0.5 + yPercentage / 2) /
                                  (lightnessDark ? 1 : 2)
                        : lightness;

                    alpha = createAlpha
                        ? createHue
                            ? this.settings.invertAlpha
                                ? yPercentage
                                : 1 - yPercentage
                            : this.settings.invertAlpha
                            ? xPercentage
                            : 1 - xPercentage
                        : alpha;
                }

                // Canvas colors are in RGBA
                const rgba = hslToRgb({
                    hue: hue * 360,
                    saturation,
                    lightness,
                    alpha
                });

                // How to store the pixel in the Typed Array depends on how the processor orders bytes.
                if (isBigEndian) {
                    data32[index] =
                        (rgba.red << 24) |
                        (rgba.green << 16) |
                        (rgba.blue << 8) |
                        (alpha * 255);
                } else {
                    data32[index] =
                        ((alpha * 255) << 24) |
                        (rgba.blue << 16) |
                        (rgba.green << 8) |
                        rgba.red;
                }

                // If this is not a circle and only shows a single spectrum, only one row or column will be calculated.
                // Copy this to the other rows/columns.
                if (!this.settings.circle && isSingleSpectrum) {
                    if (this.settings.rotate) {
                        for (let xx = 1; xx < width; xx += 1) {
                            data32[y * width + xx] = data32[index];
                        }
                    } else {
                        for (let yy = 1; yy < height; yy += 1) {
                            data32[yy * width + x] = data32[index];
                        }
                    }
                }

                // Store the color in the palette, so we can match other colors against it later
                const newColorInPalette = rgba;
                newColorInPalette.position = this.settings.rotate
                    ? [yPercentage, xPercentage]
                    : [xPercentage, yPercentage];
                palette[palette.length] = newColorInPalette;
            }
        }

        // Throw pixels onto the off screen canvas and then to the visible canvas
        data.set(buffer8);
        this.data.offScreenContext.putImageData(imageData, 0, 0);
        this.data.context.clearRect(0, 0, width, height);
        this.data.context.drawImage(this.dom.offScreenCanvas, 0, 0);
        this.data.palette = palette;
    }

    /**
     * Calibrate the color picker.
     * Useful for when its dimensions have changed, due to the window resizing or something.
     *
     * @param {boolean} [updatePickerPositions=true] - Whether or not to update the position of all the pickers.
     * @returns {ColorPicker} The color picker object, for function chaining.
     */
    calibrate(updatePickerPositions = true) {
        this.data.ready = false;
        this.data.spectrumCount =
            (this.settings.hue ? 1 : 0) +
            (this.settings.saturation ? 1 : 0) +
            (this.settings.lightness ? 1 : 0) +
            (this.settings.alpha ? 1 : 0);

        if (this.data.spectrumCount > 2) {
            throw "You can't set more than two spectra (hue, saturation, lightness and alpha) in the same color picker.";
        }

        // Get element size and position
        this.data.elementData.size = {
            width: this.dom.root.offsetWidth,
            height: this.dom.root.offsetHeight
        };
        this.data.elementData.position = this.dom.root.getBoundingClientRect();

        if (
            this.dom.canvas.width !== this.data.elementData.size.width ||
            this.dom.canvas.height !== this.data.elementData.size.height
        ) {
            this.dom.canvas.width = this.data.elementData.size.width;
            this.dom.canvas.height = this.data.elementData.size.height;
        }

        // Only update colors if needed
        const newVisualStateFingerprint = this.generateVisualStateFingerprint(
            this.data.elementData.size
        );
        if (newVisualStateFingerprint !== this.data.visualStateFingerprint) {
            this.data.visualStateFingerprint = newVisualStateFingerprint;
            this.createColors();
        }

        // Update colorMatch with new palette if it's needed
        if (updatePickerPositions && this.data.palette.length) {
            this.data.colorMatch.flush().add(this.data.palette);
            this.data.palette = [];
        }

        // Update pickers
        forEach(this.dom.pickers, picker => {
            if (updatePickerPositions) {
                const nearestColorInPalette = this.data.colorMatch.near(
                    picker.color
                );
                picker.color = nearestColorInPalette[0];

                setStyles(picker.element, {
                    top:
                        !this.settings.circle &&
                        this.data.spectrumCount === 1 &&
                        !this.settings.rotate
                            ? picker.element.style.top
                            : `${nearestColorInPalette[0].position[1] * 100}%`,
                    left:
                        !this.settings.circle &&
                        this.data.spectrumCount === 1 &&
                        this.settings.rotate
                            ? picker.element.style.left
                            : `${nearestColorInPalette[0].position[0] * 100}%`
                });

                setStyles(picker.colorElement, {
                    backgroundColor: picker.color.rgba
                });
            } else {
                picker.color = this.getColor(picker);

                setStyles(picker.colorElement, {
                    backgroundColor: picker.color.rgba
                });
            }
        });

        // Recalibrate if changes have been made while calibrating.
        // Otherwise set ready state to true and add colors from palette to color match instance.
        if (this.data.recalibrate) {
            this.data.recalibrate = false;
            window.requestAnimationFrame(() =>
                this.calibrate(updatePickerPositions)
            );
        } else {
            this.data.ready = true;
        }

        return this;
    }

    /**
     * Change the settings of the color picker.
     *
     * @param {ColorPickerOptions} options - Change the color picker with these options.
     * @returns {ColorPicker} The color picker object, for function chaining.
     */
    update(options) {
        this.settings = {
            ...this.settings,
            ...options
        };

        // Calibrate on next paint, unless calibration is already in progress.
        // In that case, wait till it's done, then recalibrate.
        if (this.data.ready) {
            window.requestAnimationFrame(() => this.calibrate(false));
        } else {
            this.data.recalibrate = true;
        }

        return this;
    }

    /**
     * Destroy by removing all event listeners, elements and data from objects.
     */
    destroy() {
        forEach(this.dom.pickers, picker => {
            removeEvent(picker.element, "mousedown touchstart");
        });
        removeEvent(this.dom.root, "mousedown touchstart");
        removeEvent(
            document,
            "mousemove touchmove",
            this.data.movePickerReference
        );
        removeEvent(document, "mouseup touchend", this.data.endPickerReference);
        removeEvent(window, "keydown", this.data.resetPickerReference);

        deleteElement(this.dom.root);

        delete this.dom;
        delete this.data;
        delete this.settings;
    }
}
