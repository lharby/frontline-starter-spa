/**
 * Notice class
 *
 * This is a Notice class that can be used for showing notifications, like an announcements or warnings, on a page.
 *
 *
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 * @since 3.12.0
 * @module utils/interaction/Notice
 *
 *
 * @example <caption>Basic usage:</caption>
 * import { Notice } from "./utils/interaction/notice";
 *
 * void new Notice("Your image has been uploaded, or some useful message.");
 *
 * void new Notice("This message will show for 10 seconds. No progress bar.", {
 *     duration: 10000,
 *     progressBar: false,
 * });
 *
 *
 * @example
 * <caption>
 * A bit more **advanced usage**. This notice can't be removed manually by the user, but will however be destroyed after
 * 3 seconds.
 *
 * In case you want to show the notice in the bottom right of the window, let's put it in a wrapper we'll call
 * "bottom-right" and set `prepend` to true, to place new notices in the top of the wrapper instead of in the bottom.
 *
 * You'll have to place it in the bottom right with CSS yourself.
 * </caption>
 * import { Notice } from "./utils/interaction/notice";
 *
 * const newNotice = new Notice("This message will show for 6 seconds.", {
 *     duration: 6000,
 *     wrapperName: "bottom-right",
 *     prepend: true,
 *     swipeToRemove: false,
 *     clickToRemove: false,
 *     beforeRemove: () => window.console.log("Notice about to be removed."),
 *     onRemove: () => window.console.log("Notice has been removed."),
 * });
 *
 * window.setTimeout(() => newNotice.destroy(), 3000);
 *
 */

import { Timer } from "../timer";
import {
    appendElement,
    deleteElement,
    prependElement
} from "../dom/elementManipulation";
import {
    addEvent,
    removeEvent,
    removeAllEvents
} from "../events/events";
import { addClass } from "../dom/classList";
import { setStyles } from "../dom/setStyles";
import { Gesture } from "../events/gesture";
import { splitter } from "../splitter";
import { forEach } from "../forEach";
import { createElement } from "../dom/createElement";

// Import the styling we need.
import "~/scss/components/js/notice.scss";
import {
    detectAnimationEndEventName,
    detectTransitionEndEventName
} from "../events/detectEventName";

/**
 * The block level class name that will be used in all the class names.
 *
 * @ignore
 * @type {string}
 */
const BLOCK_LEVEL_CLASS_NAME = "notice";

/**
 * An object containing the class names that will be used when building the DOM.
 *
 * @ignore
 * @type {Object}
 */
const classNames = {
    item: `${BLOCK_LEVEL_CLASS_NAME}__item`,
    itemHide: `${BLOCK_LEVEL_CLASS_NAME}__item--hide`,
    itemRemovable: `${BLOCK_LEVEL_CLASS_NAME}__item--removable`,
    itemInside: `${BLOCK_LEVEL_CLASS_NAME}__inside`,
    itemInsideHasProgressBar: `${BLOCK_LEVEL_CLASS_NAME}__inside--has-progress-bar`,
    itemContent: `${BLOCK_LEVEL_CLASS_NAME}__content`,
    itemMessage: `${BLOCK_LEVEL_CLASS_NAME}__message`,
    itemProgressBar: `${BLOCK_LEVEL_CLASS_NAME}__progress-bar`
};

/**
 * The total amount of notices created on the current load.
 * This is used to make a unique ID for every notice.
 *
 * @ignore
 * @type {number}
 */
let noticeCount = 0;

/**
 * References to wrappers and notices.
 *
 * @ignore
 * @type {Object}
 */
const references = {
    wrappers: {},
    notices: {}
};

const transitionEndEvent = detectTransitionEndEventName();
const animationEndEvent = detectAnimationEndEventName();

/**
 * If it doesn't already exist, create the notice wrapper and add event listeners
 *
 * @ignore
 * @param {string} wrapperName
 */
function createNoticeWrapper(wrapperName) {
    let wrapperReference = references.wrappers[wrapperName];

    if (typeof wrapperReference === "undefined") {
        wrapperReference = createElement("div", {
            className: `${BLOCK_LEVEL_CLASS_NAME} ${BLOCK_LEVEL_CLASS_NAME}--${wrapperName}`
        });
        document.body.appendChild(wrapperReference);

        references.wrappers[wrapperName] = wrapperReference;

        // Pause timeout on all notices on hover
        addEvent(wrapperReference, "mouseenter", () => {
            forEach(references.notices, notice => {
                if (
                    notice.settings.wrapperName === wrapperName &&
                    typeof notice.timeout !== "undefined"
                ) {
                    notice.timeout.pause();
                }
            });

            // Resume timeouts on mouse leave
            addEvent(wrapperReference, "mouseleave", () => {
                removeEvent(wrapperReference, "mouseleave");
                forEach(references.notices, notice => {
                    if (
                        notice.settings.wrapperName === wrapperName &&
                        typeof notice.timeout !== "undefined"
                    ) {
                        notice.timeout.resume();
                    }
                });
            });
        });
    }
}

export class Notice {
    /**
     * Create notice
     *
     * @param {string|Element} message - The message to show in the notice. This can be plain text, HTML or an element.
     * @param {Object} [options={}] - Object with settings options.
     * @param {string} [options.classNames=""] - Class names to be added to the notice (separated by space or comma).
     * @param {object} [options.swipeToRemove=true] - Add event listeners for touch and remove the notice on swipe.
     * @param {object} [options.clickToRemove=true] - Whether or not to remove notice on click.
     * @param {number} [options.duration=5000] - Duration in milliseconds.
     * @param {number} [options.makeRemovableAfter=750] - How long to wait (in milliseconds) before allowing the notification to be removed. This is for avoiding it being closed by accident, before it has been made completely visible to the user.
     * @param {boolean} [options.progressBar=true] - Whether or not to show the progress bar. Duration needs to be defined for this to apply.
     * @param {string} [options.wrapperName="default"] - The name of the wrapper to place the notification in. A modifier class with this name will be added to the wrapper.
     * @param {boolean} [options.prepend=false] - Notification will be appended to the wrapper by default. Set this to `true` to prepend them instead.
     * @param {function|function[]} [options.beforeRemove] - Function(s) to call before the notification is removed.
     * @param {function|function[]} [options.onRemove] - Function(s) to call when the notification has been removed.
     * @param {number} [options.swipeThreshold=30] - How many pixels to swipe the notification for it to be removed.
     * @param {Object} [options.swipeDirections] - Define which swipe directions are allowed.
     * @param {boolean} [options.swipeDirections.up=true] - Allow swipe up, defaults to true.
     * @param {boolean} [options.swipeDirections.down=true] - Allow swipe down, defaults to true.
     * @param {boolean} [options.swipeDirections.left=true] - Allow swipe left, defaults to true.
     * @param {boolean} [options.swipeDirections.right=true] - Allow swipe right, defaults to true.
     */
    constructor(message, options = {}) {
        this.settings = {
            classNames: "",
            swipeToRemove: true,
            clickToRemove: true,
            duration: 5000,
            makeRemovableAfter: 750,
            progressBar: true,
            wrapperName: "default",
            prepend: false,
            beforeRemove: [],
            onRemove: [],
            swipeThreshold: 30,
            ...options,
            swipeDirections: {
                up: true,
                down: true,
                left: true,
                right: true,
                ...(options.swipeDirections || {})
            }
        };

        // Make sure callbacks are in arrays
        this.settings.beforeRemove = this.sanitizeCallbacks(
            this.settings.beforeRemove
        );
        this.settings.onRemove = this.sanitizeCallbacks(this.settings.onRemove);

        // Convert spaces to hyphens in wrapper name
        this.settings.wrapperName = this.settings.wrapperName.replace(
            /\s/g,
            "-"
        );

        // Increase notice count
        noticeCount += 1;

        this.data = {
            id: noticeCount,
            swipeDirection: "",
            gesture: undefined,
            createProgressBar:
                this.settings.progressBar === true && this.settings.duration > 0
        };

        // Create notice wrapper if it doesn't exist already
        createNoticeWrapper(this.settings.wrapperName);

        // Create markup from template
        const noticeDOM = this.buildDOM(message);

        this.dom = {
            notice: noticeDOM,
            inside: noticeDOM.firstElementChild
        };

        // Remove notice when the progress bar has reached 100%
        if (this.data.createProgressBar) {
            this.dom.progressBar = this.dom.notice.querySelector(
                `.${classNames.itemProgressBar}`
            );
            setStyles(this.dom.progressBar, {
                animationDuration: `${this.settings.duration}ms`
            });
            addEvent(this.dom.progressBar, animationEndEvent, () =>
                this.destroy()
            );
        }

        // ... or set a timeout to remove notice if a duration is set
        else if (this.settings.duration) {
            this.timeout = new Timer(
                () => this.destroy(),
                this.settings.duration
            );
        }

        // Add event listeners for removing notice after some time.
        // It's best to wait a bit to avoid users accidentally clicking on a notice that is fading in.
        const timeoutDuration = Math.max(
            Math.min(this.settings.makeRemovableAfter, this.settings.duration),
            0
        );
        window.setTimeout(() => {
            addClass(this.dom.notice, classNames.itemRemovable);

            // Swipe to remove
            if (this.settings.swipeToRemove) {
                this.data.gesture = new Gesture(this.dom.inside);
                this.data.gesture.onDrag(this.touchMove.bind(this));

                if (this.settings.clickToRemove) {
                    this.data.gesture.onClick(this.destroy.bind(this));
                }
            }

            // Remove notice on click
            else if (this.settings.clickToRemove) {
                addEvent(this.dom.inside, "click", event => {
                    event.preventDefault();

                    // Destroy notice
                    this.destroy();
                });
            }
        }, timeoutDuration);

        // Add reference
        references.notices[this.data.id] = this;

        if (this.settings.prepend) {
            // Prepend notice to wrapper
            prependElement(
                this.dom.notice,
                references.wrappers[this.settings.wrapperName]
            );
        } else {
            // Append notice to wrapper
            appendElement(
                this.dom.notice,
                references.wrappers[this.settings.wrapperName]
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
     * Fire all callbacks registered with the named type (ie. "onRemove").
     *
     * @private
     * @param {string} callbackType
     */
    fireCallbacks(callbackType) {
        if (this && this.settings) {
            const callbackArray = this.settings[callbackType];
            if (Array.isArray(callbackArray) && callbackArray.length) {
                callbackArray.forEach(funcRef => funcRef.call(this));
            }
        }
    }

    /**
     * Build DOM.
     *
     * @private
     * @param {string|Element} message
     * @returns {Node}
     */
    buildDOM(message) {
        const additionalClass = this.data.createProgressBar
            ? classNames.itemInsideHasProgressBar
            : "";

        const item = document.createElement("div");
        const itemInside = document.createElement("div");
        const itemContent = document.createElement("div");
        const itemMessage = document.createElement("div");

        item.className = `${classNames.item} ${splitter(
            this.settings.classNames
        ).join(" ")}`;
        itemInside.className = `${classNames.itemInside} ${additionalClass}`;
        itemContent.className = classNames.itemContent;
        itemMessage.className = classNames.itemMessage;

        item.appendChild(itemInside);
        itemInside.appendChild(itemContent);
        itemContent.appendChild(itemMessage);

        if (this.data.createProgressBar) {
            const progressBar = document.createElement("div");
            progressBar.className = classNames.itemProgressBar;
            itemInside.appendChild(progressBar);
        }

        appendElement(message, itemMessage);

        return item;
    }

    /**
     * Handle touch move event and swipe notice sideways or up.
     *
     * @private
     * @param {Object} data
     * @param {function} applyVelocity
     */
    touchMove(data, applyVelocity) {
        let opacity;
        let resolve = false;

        const absoluteX = Math.abs(data.position.accumulatedDifference.x);
        const absoluteY = Math.abs(data.position.accumulatedDifference.y);

        if (
            data.first &&
            (!this.data.swipeDirection ||
                (this.data.swipeDirection === "x" &&
                    absoluteX < 5 &&
                    absoluteX < absoluteY) ||
                (this.data.swipeDirection === "y" &&
                    absoluteY < 5 &&
                    absoluteX > absoluteY))
        ) {
            this.data.swipeDirection = data.swipe.x ? "x" : "y";
        }

        if (
            this.data.swipeDirection === "x" &&
            this.settings.swipeDirections.left !== false &&
            this.settings.swipeDirections.right !== false
        ) {
            opacity = Math.max(0, 1 - absoluteX / 200);
            resolve =
                (this.settings.swipeDirections.left !== false &&
                    data.position.accumulatedDifference.x <
                        -this.settings.swipeThreshold) ||
                (this.settings.swipeDirections.right !== false &&
                    data.position.accumulatedDifference.x >
                        this.settings.swipeThreshold);
        } else if (
            this.settings.swipeDirections.up !== false &&
            this.settings.swipeDirections.down !== false
        ) {
            opacity = Math.max(0, 1 - absoluteY / 200);
            resolve =
                (this.settings.swipeDirections.up !== false &&
                    data.position.accumulatedDifference.y <
                        -this.settings.swipeThreshold) ||
                (this.settings.swipeDirections.down !== false &&
                    data.position.accumulatedDifference.y >
                        this.settings.swipeThreshold);
        }

        opacity = opacity - (1 - opacity) * data.velocity.progress;

        if (!data.interaction) {
            applyVelocity(resolve);
        }

        // Define translate X
        const translateX =
            this.data.swipeDirection === "x" &&
            (this.settings.swipeDirections.left !== false ||
                this.settings.swipeDirections.right !== false)
                ? data.position.accumulatedDifference.x
                : 0;

        // Define translate Y
        const translateY =
            this.data.swipeDirection === "y" &&
            (this.settings.swipeDirections.up !== false ||
                this.settings.swipeDirections.down !== false)
                ? data.position.accumulatedDifference.y
                : 0;

        // Set positions and opacity
        setStyles(this.dom.inside, {
            transform: `translate3d(${translateX}px, ${translateY}px, 0)`,
            opacity
        });

        if (data.done || (resolve && opacity <= 0)) {
            if (resolve) {
                this.destroy();
            } else {
                this.data.swipeDirection = "";
            }
        }
    }

    /**
     * Destroy notice
     */
    destroy() {
        if (this.data) {
            if (this.data.gesture) {
                this.data.gesture.destroy();
                this.data.gesture = null;
            }

            // Fire callback for "before remove"
            this.fireCallbacks("beforeRemove");

            // Remove click and touch event listeners
            removeAllEvents(this.dom.inside);

            if (this.dom.progressBar) {
                removeEvent(this.dom.progressBar, animationEndEvent);
            }

            // Make notice ready to be hidden
            setStyles(this.dom.notice, {
                maxHeight: `${this.dom.notice.offsetHeight}px`
            });

            // Force browser repaint before adding class (offsetHeight forces repaint)
            void this.dom.notice.offsetHeight;

            // Add "hide" class
            addClass(this.dom.notice, classNames.itemHide);

            // Remove notice when it's hidden and fire callback for "on remove"
            addEvent(this.dom.notice, transitionEndEvent, () => {
                this.fireCallbacks("onRemove");
                this.cleanUp();
            });
        }
    }

    /**
     * Clean up after notice by removing event listeners, elements and object data
     *
     * @private
     */
    cleanUp() {
        if (this.data) {
            if (this.data.gesture) {
                this.data.gesture.destroy();
            }

            // Remove event listeners
            removeAllEvents(this.dom.inside);
            removeAllEvents(this.dom.notice);

            if (this.dom.progressBar) {
                removeEvent(this.dom.progressBar, animationEndEvent);
            }

            // Remove notice element from DOM
            deleteElement(this.dom.notice);

            // Delete reference
            delete references.notices[this.data.id];

            // Destroy timer if it's set
            if (typeof this.timeout !== "undefined") {
                this.timeout.destroy();
            }

            // If there are no more notices present, remove wrapper and its event listeners
            const noticesCount = Object.keys(references.notices).length;
            let noticesInSameWrapperCount = 0;

            if (noticesCount) {
                forEach(references.notices, notice => {
                    if (
                        notice.settings.wrapperName ===
                        this.settings.wrapperName
                    ) {
                        noticesInSameWrapperCount += 1;
                    }
                });
            }

            if (!noticesInSameWrapperCount) {
                removeAllEvents(references.wrappers[this.settings.wrapperName]);
                deleteElement(references.wrappers[this.settings.wrapperName]);
                delete references.wrappers[this.settings.wrapperName];
            }

            // Delete object data
            delete this.settings;
            delete this.data;
            delete this.dom;
        }
    }
}
