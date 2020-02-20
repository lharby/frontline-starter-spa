/**
 * Modal dialog class
 *
 * This file contains a Modal class that can be used for dynamically spawning fully configurable
 * modal popup-boxes. The class itself can be set up in a lot of different ways, but there are
 * also two helper-functions for spawning simple dialog-popups: `confirm()` and `alert()`.
 *
 *
 * @since 3.6.6
 * @author Anders Gissel <anders.gissel@akqa.com>
 * @module utils/interaction/Modal
 *
 *
 * @example <caption>Basic usage:</caption>
 * import { Modal } from "./utils/interaction/modal";
 *
 * const newModal = new Modal();
 * newModal
 *     .setContent("<p>Demo-data</p>")
 *     .setTitle("Demo-title");
 *
 * // or:
 * // const newModal = new Modal({ content: "<p>Demo-data</p>", title: "Demo-title" });
 *
 * window.setTimeout(() => newModal.destroy(), 5000);
 *
 *
 * @example <caption>To use the shortcuts for alert- or confirmation dialogs:</caption>
 * import { alert as alertModal, confirm as confirmModal } from "./utils/interaction/modal";
 *
 * confirmModal("Please confirm this message!", "Please confirm", "Yes", "No")
 *     .then(
 *         () => alertModal("You clicked yes!", "Wohoo!", "OK"),
 *         () => alertModal("You clicked no!", "What?!", "Oh, man, sorry")
 *     );
 *
 */

import {
    enableScrollLock,
    disableScrollLock,
    isScrollLocked
} from "../dom/scrollLock";
import {
    addEvent,
    removeAllEvents,
    addEventOnce,
    removeEvent
} from "../events/events";
import { addClass, removeClass } from "../dom/classList";
import { createElement } from "../dom/createElement";
import { detectTransitionEndEventName } from "../events/detectEventName";
import {
    appendElement,
    deleteElement,
    emptyElement
} from "../dom/elementManipulation";
import { getFirstInteractiveElementInContainer } from "../dom/accessibility";
import { isArray } from "../typeCheckers";

// Import the styling we need.
import "../../scss/components/js/modal.scss";

/**
 * An indication of how many modals are currently open. Used internally only.
 *
 * @private
 * @type {number}
 */
let modalCount = 0;

/**
 * The "active" class-modifier
 *
 * @private
 * @type {string}
 */
const activeClassModifier = "visible";

/**
 * The "ready" class-modifier
 *
 * @private
 * @type {string}
 */
const readyClassModifier = "ready";

/**
 * The event name to listen for when waiting for transitions to finish. If you clear this, it's tantamount to setting
 * "useTransitions" to false in all instantiations. Otherwise, a utility will be used to detect the event name in the
 * current browser.
 *
 * @private
 * @type {string}
 */
const transitionEndEventName = detectTransitionEndEventName();

/**
 * An object containing the various element names that will be used while building the DOM for a modal.
 * * Block-level name is set using configuration for each modal (see "blockClass")
 * * Basic modifiers are set using configuration for each modal (see "modifierClass"); specific per-element modifier are hardcoded.
 *
 * So, basically (f*cking), if you want to change the class name of any auto-generated element, this is where you do it.
 *
 * @private
 * @type {object}
 */
const classNames = {
    background: "background",
    wrapper: "wrapper",
    innerWrapper: "inner-wrapper",
    header: "header",

    titleWrapper: "title-wrapper",
    title: "title",

    content: "content",

    closeButton: "close",
    closeIcon: "close-icon",
    closeLabel: "close-label"
};

export class Modal {
    /**
     * The modal constructor itself. Used to build and display a modal dialog, although the displaying can be
     * stopped if you so choose.
     *
     * @constructor
     * @since 3.6.6
     * @param {object} [options] The options for the modal you're about to spawn.
     * @param {HTMLElement|Node|string|DocumentFragment} [options.content] The content of the modal. Can also be set using setContent() on the instantiation.
     * @param {HTMLElement|Node|string} [options.title] The title of the modal. Can also be set using setTitle() on the instantiation.
     * @param {string} [options.blockClass="modal"] This is the block-identifier class (the "B" in "BEM")
     * @param {string} [options.modifierClass=""] All created DOM nodes will receive this modifier class (the "M" in "BEM")
     * @param {string} [options.closeLabel="Close"] The label for the "Close"-button.
     * @param {boolean} [options.autoShow=true] Whether or not to show the modal upon creation (if disabled, you'll need to run show() at some point).
     * @param {boolean} [options.closable=true] Whether or not this modal can be closed by the user (if not, you need to do it programmatically).
     * @param {boolean} [options.destroyOnEscape=true] If `closable` is true, hitting ESC (you know, the Escape-key) will hide and destroy the modal.
     * @param {boolean} [options.setScrollLock=true] Whether or not to enable/disable a scroll lock while the modal is open. If scroll lock is already activated, this defaults to false.
     * @param {boolean} [options.useTransitions=true] If true, the script will listen for transitions to figure out when the modal is shown or hidden. If disabled, these listeners are not set, and events fire immediately.
     * @param {boolean} [options.autoFocus=true] If true, the modal will find the first interactive element inside itself and focus on it once it's opened. If you disable this, you need to do this manually.
     * @param {function|function[]} [options.beforeShow=[]] Optional callback(s) to fire before the modal is shown. Single function or array of functions.
     * @param {function|function[]} [options.afterShow=[]] Optional callback(s) to fire after the modal is shown. Single function or array of functions.
     * @param {function|function[]} [options.beforeHide=[]] Optional callback(s) to fire before the modal is destroyed. Single function or array of functions.
     * @param {function|function[]} [options.afterHide=[]] Optional callback(s) to fire after the modal is destroyed. Single function or array of functions.
     * @param {function|function[]} [options.beforeDestruct=[]] Optional callback(s) to fire just before the modal is destroyed. Single function or array of functions.
     * @param {HTMLElement|HTMLBodyElement|Element} [options.parentNode=document.body] Where to put the generated DOM-nodes. Will default to the document body if not set.
     *
     * @example <caption>Basic usage:</caption>
     * import { Modal } from "./utils/interaction/modal";
     *
     * const newModal = new Modal();
     * newModal
     *     .setContent("<p>Demo-data</p>")
     *     .setTitle("Demo-title");
     */
    constructor(options = {}) {
        this.dom = {};

        this.configuration = {
            blockClass: options.blockClass || "modal",
            modifierClass: options.modifierClass || "",

            autoShow:
                typeof options.autoShow === "boolean" ? options.autoShow : true,
            closable:
                typeof options.closable === "boolean" ? options.closable : true,
            destroyOnEscape:
                typeof options.destroyOnEscape === "boolean"
                    ? options.destroyOnEscape
                    : true,
            autoFocus:
                typeof options.autoFocus === "boolean"
                    ? options.autoFocus
                    : true,

            setScrollLock:
                typeof options.setScrollLock === "boolean"
                    ? options.setScrollLock
                    : !isScrollLocked,

            useTransitions:
                typeof options.useTransitions === "boolean"
                    ? options.useTransitions
                    : transitionEndEventName.length > 0,

            closeLabel:
                typeof options.closeLabel === "string"
                    ? options.closeLabel
                    : "Close",

            // Callbacks, man!
            beforeShow: this.sanitizeCallbacks(options.beforeShow),
            afterShow: this.sanitizeCallbacks(options.afterShow),
            beforeHide: this.sanitizeCallbacks(options.beforeHide),
            afterHide: this.sanitizeCallbacks(options.afterHide),
            beforeDestruct: this.sanitizeCallbacks(options.beforeDestruct),

            // The parent node is neat! This is where we'll put all our stuff!
            parentNode: options.parentNode || document.body
        };

        this.buildDOMNodes();

        // Load title if set through the options.
        if (typeof options.title !== "undefined") {
            this.setTitle(options.title);
        }

        // Load content if set through the options.
        if (typeof options.content !== "undefined") {
            this.setContent(options.content);
        }

        if (this.configuration.autoShow) {
            window.setTimeout(() => this.show(), 100);
        }

        modalCount += 1;
    }

    /**
     * Build the "BE"-part of a BEM-object class name.
     *
     * @private
     * @param {string} elementIdentifier
     * @returns {string}
     */
    buildBaseClass(elementIdentifier) {
        return `${this.configuration.blockClass}__${elementIdentifier}`;
    }

    /**
     * Build a string containing all relevant class names for the given element type.
     *
     * @private
     * @param {string} elementIdentifier - This will become the "E" in the BEM-naming - in other words, the element name.
     * @param {string} [modifier=""] - Optional modifier class, that will be added in addition to the modifierClass from the configuration.
     * @returns {string}
     */
    buildCompleteClassString(elementIdentifier, modifier) {
        const baseClass = this.buildBaseClass(elementIdentifier);
        let className = baseClass;

        if (typeof modifier === "string" && modifier.length > 0) {
            className += ` ${baseClass}--${modifier}`;
        }

        if (
            typeof this.configuration.modifierClass === "string" &&
            this.configuration.modifierClass.length > 0
        ) {
            className += ` ${baseClass}--${this.configuration.modifierClass}`;
        }

        return className;
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
            ? callbackList
            : typeof callbackList === "function"
            ? [callbackList]
            : [];
    }

    /**
     * Build all the DOM nodes for this particular instance.
     *
     * @private
     * @returns {Modal} The modal object, for function chaining.
     */
    buildDOMNodes() {
        if (this.configuration.parentNode instanceof Element) {
            this.dom.parentNode = this.configuration.parentNode;
        } else {
            throw `Modal instantiation failed: 'parentNode' must be an Element!`;
        }

        // First we'll create the background and outer wrapper as "real" DOM elements,
        // since that'll make it easier to reference them later.
        const levelName = `level${modalCount}`;
        this.dom.background = createElement("div", {
            className: this.buildCompleteClassString(
                classNames.background,
                levelName
            )
        });
        this.dom.wrapper = createElement("section", {
            className: this.buildCompleteClassString(
                classNames.wrapper,
                levelName
            )
        });
        appendElement(
            [this.dom.background, this.dom.wrapper],
            this.dom.parentNode
        );

        // Build the header
        this.dom.header = createElement("header", {
            className: this.buildCompleteClassString(classNames.header)
        });

        // Build the close-button, if need be.
        if (this.configuration.closable) {
            this.dom.closeButton = createElement("button", {
                type: "button",
                className: this.buildCompleteClassString(
                    classNames.closeButton
                ),
                // The "close-icon" spans are not very important to us, so we'll just add them as strings.
                html: `<span class="${this.buildCompleteClassString(
                    classNames.closeIcon,
                    "1"
                )}"></span><span class="${this.buildCompleteClassString(
                    classNames.closeIcon,
                    "2"
                )}"></span>`
            });

            // Make sure the popup closes when either the background or close-button is clicked.
            addEvent(this.dom.closeButton, "click", () => this.destroy());
            addEvent(this.dom.background, "click", () => this.destroy());

            // The close-label is... neat.
            this.dom.closeLabel = createElement("span", {
                className: this.buildCompleteClassString(classNames.closeLabel),
                title: this.configuration.closeLabel,
                text: this.configuration.closeLabel
            });
            appendElement(this.dom.closeLabel, this.dom.closeButton);
            appendElement(this.dom.closeButton, this.dom.header);
        }

        // Create and add the title wrapper to the header
        this.dom.titleWrapper = createElement("div", {
            className: this.buildCompleteClassString(classNames.titleWrapper)
        });
        appendElement(this.dom.titleWrapper, this.dom.header);

        // Create the content wrapper.
        this.dom.contentWrapper = createElement("div", {
            className: this.buildCompleteClassString(classNames.content)
        });

        // Create and insert the inner wrapper, which holds the content wrapper and the header.
        this.dom.innerWrapper = createElement("div", {
            className: this.buildCompleteClassString(classNames.innerWrapper),
            html: [this.dom.header, this.dom.contentWrapper]
        });

        appendElement(this.dom.innerWrapper, this.dom.wrapper);

        // After a (very) short timeout, add the "ready"-class to the main elements so we can get transitions ready.
        window.setTimeout(() => {
            addClass(
                this.dom.background,
                this.buildCompleteClassString(
                    classNames.background,
                    readyClassModifier
                )
            );
            addClass(
                this.dom.wrapper,
                this.buildCompleteClassString(
                    classNames.wrapper,
                    readyClassModifier
                )
            );
        }, 60);

        return this;
    }

    /**
     * Fire all callbacks registered with the named type (ie. "beforeDestruct") or similar.
     *
     * @private
     * @param {string} callbackType
     * @returns {Modal} The modal object, for function chaining.
     */
    fireCallbacks(callbackType) {
        if (this && this.configuration) {
            const callbackArray = this.configuration[callbackType];
            if (isArray(callbackArray) && callbackArray.length) {
                callbackArray.forEach(funcRef => {
                    funcRef.call(this);
                });
            }
        }
        return this;
    }

    beforeShow = () => this.fireCallbacks("beforeShow");
    afterShow = () => this.fireCallbacks("afterShow");
    beforeHide = () => this.fireCallbacks("beforeHide");
    afterHide = () => this.fireCallbacks("afterHide");
    beforeDestruct = () => this.fireCallbacks("beforeDestruct");

    onBodyKeypress = e => {
        if (e.which === 27) {
            this.destroy();
        }
    };

    /**
     * Show the modal.
     *
     * @returns {Modal} The modal object, for function chaining.
     */
    show() {
        if (this.configuration.setScrollLock) {
            // Scroll locks are nice. Let's do some of that.
            enableScrollLock();
        }

        this.beforeShow();
        if (this.configuration.useTransitions) {
            addEventOnce(this.dom.wrapper, transitionEndEventName, () =>
                this.afterShow()
            );
        }

        addClass(
            this.dom.background,
            `${this.buildBaseClass(
                classNames.background
            )}--${activeClassModifier}`
        );
        addClass(
            this.dom.wrapper,
            `${this.buildBaseClass(classNames.wrapper)}--${activeClassModifier}`
        );

        if (this.configuration.autoFocus) {
            // Move focus to the first interactive element inside the wrapper.
            // If you want to focus on something else inside it, use the "afterShow" callback.
            const firstInteractiveElement =
                getFirstInteractiveElementInContainer(
                    this.dom.contentWrapper
                ) || getFirstInteractiveElementInContainer(this.dom.wrapper);
            if (firstInteractiveElement && firstInteractiveElement.focus) {
                firstInteractiveElement.focus();
            } else {
                // This probably won't even work, but we need to try if there absolutely isn't anything inside the modal
                // to grab onto.
                this.dom.wrapper.focus();
            }
        }

        if (!this.configuration.useTransitions) {
            this.afterShow();
        }

        if (this.configuration.closable && this.configuration.destroyOnEscape) {
            addEvent(document.body, "keyup", this.onBodyKeypress);
        }

        return this;
    }

    /**
     * Hide the modal.
     *
     * @param {boolean} [avoidEvents=false] - If true, the "afterHide()" functions will NOT be fired once the modal is hidden.
     * @returns {Modal} The modal object, for function chaining.
     */
    hide(avoidEvents = false) {
        if (this.configuration.setScrollLock) {
            // Disable scroll lock
            disableScrollLock();
        }

        this.beforeHide();

        if (avoidEvents !== true) {
            if (this.configuration.useTransitions) {
                addEventOnce(this.dom.wrapper, transitionEndEventName, () =>
                    this.afterHide()
                );
            } else {
                this.afterHide();
            }
        }
        removeClass(
            this.dom.background,
            `${this.buildBaseClass(
                classNames.background
            )}--${activeClassModifier}`
        );
        removeClass(
            this.dom.wrapper,
            `${this.buildBaseClass(classNames.wrapper)}--${activeClassModifier}`
        );
        removeEvent(document.body, "keyup", this.onBodyKeypress);

        if (avoidEvents !== true && !this.configuration.useTransitions) {
            this.afterHide();
        }

        return this;
    }

    /**
     * Clear the content area completely.
     *
     * @returns {Modal} The modal object, for function chaining.
     */
    clearContent() {
        if (
            typeof this.dom === "object" &&
            this.dom.contentWrapper instanceof HTMLElement
        ) {
            emptyElement(this.dom.contentWrapper);
        }

        return this;
    }

    /**
     * Load content into the modal container.
     *
     * @param {HTMLElement|Node|string|DocumentFragment} content
     * @param {boolean} [clearFirst=true] - Should the contents be cleared out first?
     * @returns {Modal} The modal object, for function chaining.
     */
    setContent(content, clearFirst = true) {
        if (clearFirst) {
            this.clearContent();
        }

        appendElement(content, this.dom.contentWrapper);

        return this;
    }

    /**
     * An easy way of getting the content wrapper, in case you need it from the outside for further processing.
     *
     * @returns {HTMLElement} The HTML element containing the content.
     */
    getContentWrapper() {
        return this.dom.contentWrapper;
    }

    /**
     * Add a raw text string to the content wrapper as a pretty, formatted title object.
     *
     * @param {Element|string} title - The title to add. Should be either an `Element` or a `string`.
     * @param {boolean} [stringAsHTML=false] - If `title` is a string, and this argument is `true`, the content will be parsed as HTML and then injected. If not, the title will be added as pure text.
     * @returns {Modal} The modal object, for function chaining.
     */
    setTitle(title, stringAsHTML = false) {
        if (!this.dom.titleElement) {
            this.dom.titleElement = createElement("h2", {
                className: this.buildCompleteClassString(classNames.title)
            });
            appendElement(this.dom.titleElement, this.dom.titleWrapper);
        }

        // Set the title
        emptyElement(this.dom.titleElement);

        if (title instanceof Element) {
            appendElement(title, this.dom.titleElement);
        } else if (typeof title === "string") {
            if (stringAsHTML) {
                appendElement(title, this.dom.titleElement);
            } else {
                this.dom.titleElement.textContent = title;
            }
        }

        return this;
    }

    /**
     * An easy way of getting the title wrapper, because we care.
     *
     * @returns {HTMLElement} The HTML element containing the title.
     */
    getTitleWrapper() {
        return this.dom.titleWrapper;
    }

    /**
     * Destroy the modal. This will remove event handlers and remove the DOM as best we can.
     */
    destroy() {
        this.beforeDestruct();

        // Remove all regular event listeners, because that's just a nice thing to to.
        removeAllEvents(this.dom.closeButton);
        removeAllEvents(this.dom.background);

        /**
         * Callback function for cleaning up after ourselves.
         */
        const afterHideCallback = () => {
            // Fire the "afterHide" callbacks (if any) manually, because we've disabled the event listener that would've
            // done this automatically.
            this.afterHide();

            // Remove all content nodes.
            this.clearContent();
            deleteElement([this.dom.background, this.dom.wrapper]);

            // More cleanup!
            delete this.dom;
            delete this.configuration;
        };

        // Set up a callback function to clean up the DOM once we're done hiding the modal
        if (this.configuration.useTransitions) {
            addEventOnce(
                this.dom.wrapper,
                transitionEndEventName,
                afterHideCallback
            );
        }

        this.hide();

        // If we're not listening for transitions, let's just clear out immediately.
        if (!this.configuration.useTransitions) {
            afterHideCallback();
        }

        modalCount -= 1;
    }
}

/**
 * Display a confirm-message to the user. Will return a promise that is resolved on "Yes" and rejected on "No". Remember to include
 * a handler for __both__ cases, or your code will break!
 *
 * @since 3.6.6
 * @param {string|Element|DocumentFragment} message - The message inside the box. If a `string` is given, it will be set **as a text node**! If you want HTML, use an `Element` instead.
 * @param {string|Element} title - The title inside the box. If a `string` is given, it will be set **as a text node**! If you want HTML, use an `Element` instead.
 * @param {string} [yesLabel="Yes"] - The "Yes" label
 * @param {string} [noLabel="No"] - The "No" label
 * @returns {Promise} A promise that is resolved on "Yes" and rejected on "No". Remember to handle __both__ scenarios in your code!
 */
export function confirm(message, title, yesLabel = "Yes", noLabel = "No") {
    return new Promise((onYes, onNo) => {
        let yesWasSelected = false;

        const content = createElement("div", {
            className: "modal__content-inner text-center"
        });
        const contentParagraph =
            typeof message === "string"
                ? createElement("p", { text: message })
                : message;
        const yesButton = createElement("button", {
            className: "btn btn--primary btn--accept",
            text: yesLabel || ""
        });
        const noButton = createElement("button", {
            className: "btn btn--secondary btn--decline",
            text: noLabel || ""
        });
        const buttonWrapper = createElement("div", {
            className: "modal__buttons"
        });

        // Finalize the contents.
        appendElement([yesButton, noButton], buttonWrapper);
        appendElement([contentParagraph, buttonWrapper], content);

        // Spawn the confirmation box.
        const confirmModal = new Modal({
            title,
            content,
            beforeDestruct: () => {
                removeAllEvents(yesButton);
                removeAllEvents(noButton);

                if (!yesWasSelected) {
                    onNo();
                }
            }
        });

        addClass(confirmModal.getTitleWrapper(), "text--center");

        // Set some button events for later.
        addEventOnce(yesButton, "click", () => {
            yesWasSelected = true;
            confirmModal.destroy();
            onYes();
        });
        addEventOnce(noButton, "click", () => confirmModal.destroy());
    });
}

/**
 * Display an alert box to the user. Returns a promise that resolves when the user clicks "OK".
 *
 * @since 3.6.6
 * @param {string|Element|DocumentFragment} message - The message inside the box. If a `string` is given, it will be set **as a text node**! If you want HTML, use an `Element` instead.
 * @param {string|Element} title - The title inside the box. If a string is given, it will be set **as a text node**! If you want HTML, use an `Element` instead.
 * @param {string} [okLabel="OK"] - The OK label.
 * @returns {Promise} Promise that resolves when the user clicks "OK".
 */
export function alert(message, title, okLabel = "OK") {
    return new Promise(onOK => {
        const content = createElement("div", {
            className: "modal__content-inner text-center"
        });
        const contentParagraph =
            typeof message === "string"
                ? createElement("p", { text: message })
                : message;
        const button = createElement("button", {
            className: "btn btn--primary btn--ok",
            text: okLabel || ""
        });
        const buttonWrapper = createElement("div", {
            className: "modal__buttons",
            html: button
        });

        // Finalize the contents.
        appendElement([contentParagraph, buttonWrapper], content);

        // Spawn the alert box.
        const alertModal = new Modal({
            title,
            content,
            beforeDestruct: () => {
                removeAllEvents(button);
                onOK();
            }
        });

        addClass(alertModal.getTitleWrapper(), "text--center");
        addEventOnce(button, "click", () => alertModal.destroy());
    });
}
