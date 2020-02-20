/**
 * Gesture class
 *
 * This class sets up listeners for mouse and touch events and fires your specified callback(s) with calculated data on
 * what ever gestures are in progress. Drag, swipe, pinch and rotate.
 *
 *
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 * @since 3.12.0
 * @module utils/events/Gesture
 *
 * @example <caption>Basic usage with two elements, that can be dragged simultaneously:</caption>
 * import { Gesture } from "./utils/events/gesture";
 * import { setStyles } from "./utils/dom/setStyles";
 *
 * const draggableElementA = document.getElementById("dragMeA");
 *
 * new Gesture(draggableElementA).onDrag(data => setStyles(draggableElementA, {
 *     top: `${data.position.accumulatedDifference.y}px`,
 *     left: `${data.position.accumulatedDifference.x}px`,
 * });
 *
 *
 * const draggableElementB = document.getElementById("dragMeB");
 *
 * new Gesture(draggableElementB).onDrag(data => setStyles(draggableElementB, {
 *     top: `${data.position.accumulatedDifference.y}px`,
 *     left: `${data.position.accumulatedDifference.x}px`,
 * });
 *
 *
 * @example <caption>Drag and pinch an element and apply velocity:</caption>
 * import { Gesture } from "./utils/events/gesture";
 * import { setStyles } from "./utils/dom/setStyles";
 *
 * const dragElement = document.getElementById("drag");
 *
 * const dragGesture = new Gesture(dragElement)
 *     .onDrag((data, applyVelocity) => {
 *         const scale = 1 + data.pinch.accumulatedDifference / 100;
 *
 *         setStyles(dragElement, {
 *             top: `${data.position.accumulatedDifference.y}px`,
 *             left: `${data.position.accumulatedDifference.x}px`,
 *             transform: `scale(${scale})`,
 *         });
 *
 *         // When the user stops interacting with the element, apply velocity in the current trajectory
 *         if (!data.interaction) {
 *             applyVelocity(true);
 *         }
 *
 *         // If the gesture is done and the scale is above 2, destroy this instance of Gesture
 *         if (data.done && scale > 2) {
 *             dragGesture.destroy();
 *             alert("Done!");
 *         }
 *     }, {touchPoints: 2});
 *
 *
 * @example <caption>Pinch only (with velocity):</caption>
 * import { Gesture } from "./utils/events/gesture";
 *
 * const pinchElement = document.getElementById("pinch");
 *
 * const pinchGesture = new Gesture(pinchElement)
 *     .onPinch((data, applyVelocity) => {
 *         const scale = 1 + data.pinch.accumulatedDifference / 100;
 *
 *         pinchElement.style.transform = `scale(${scale})`;
 *
 *         // What should happen when the user is done interacting with the element?
 *         if (!data.interaction) {
 *
 *             // If the element's scale is more than 2, apply velocity following the current trajectory
 *             if (scale > 2) {
 *                 applyVelocity(true);
 *             }
 *
 *             // If the element's scale is less than 2, bounce back to original scale
 *             else {
 *                 applyVelocity(false);
 *             }
 *         }
 *
 *         // If the gesture is done and the scale is above 2, destroy this instance of Gesture
 *         if (data.done && scale > 2) {
 *             pinchGesture.destroy();
 *             alert("Done!");
 *         }
 *     });
 *
 *
 * @example <caption>Example on swiping and removing callbacks:</caption>
 * import { Gesture } from "./utils/events/gesture";
 *
 * const swipeElement = document.getElementById("swipeMe");
 * const swipeHandler = new Gesture(swipeElement);
 *
 * const swipeFunction = (data, applyVelocity) => {
 *     if (data.swipe.x) {
 *         const swipeRight = data.position.difference.x > 30;
 *
 *         // Set element position
 *         swipeElement.style.left = `${data.position.difference.x}px`;
 *
 *         // Apply velocity
 *         if (!data.interaction) {
 *             applyVelocity(swipeRight);
 *         }
 *
 *         // If user swiped right, remove callback
 *         if (data.done && swipeRight) {
 *             swipeHandler.removeOnDrag(swipeFunction);
 *         }
 *     }
 * };
 *
 * swipeHandler.onDrag(swipeFunction);
 *
 */

import { addEvent, removeEvent } from "./events";
import {
    getAllDistances,
    getAngle,
    getDistance,
    getPointBetween
} from "../calc/coordinates";
import { forEach } from "../forEach";

export class Gesture {
    /**
     * The constructor for setting up event listeners for gestures.
     *
     * @param {HTMLElement|HTMLBodyElement|Element} element - The element to listen for gestures on.
     * @param {Object} [options={}] - Optional settings.
     * @param {number} [options.threshold=10] - The number of pixels to pass before executing callbacks and deciding swipe direction. A threshold can also be set on `onDrag` and `onPinch`, but this setting will always have first priority.
     * @param {boolean} [options.triggerClicks=true] - Treat mouse and touch events (mouse button 0 and single point touch) as clicks, if the threshold wasn't passed.
     * @param {boolean} [options.preventContextMenu=true] - Whether or not to prevent the context menu from showing (activated by right click and/or long press).
     */
    constructor(element, options) {
        // Changeable settings
        this.settings = {
            threshold: 10,
            triggerClicks: true,
            preventContextMenu: true,
            ...options
        };

        // Set default and startup values in data object for internal use and easy cleanup.
        this.resetToDataDefaults();
        this.data.target = {
            element
        };
        this.data.callbacks = {
            onDrag: {},
            onPinch: {},
            onClick: []
        };

        // Disable touch scrolling for target element
        this.data.target.element.style.touchAction = "none";

        // Start listening for touch and mouse events
        addEvent(
            this.data.target.element,
            "touchstart mousedown",
            this.gestureStart
        );

        // It"s a good idea to disable the context menu (activated by right click and/or long press)
        if (this.settings.preventContextMenu) {
            addEvent(
                this.data.target.element,
                "contextmenu",
                this.preventDefault
            );
        }
    }

    /**
     * Ensure that the callback list is populated with nothing but arrays.
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
     * Set callbacks.
     *
     * @private
     * @param {string} callbackName
     * @param {function|function[]} callbackList
     * @param {Object} settings
     */
    setCallbacks(callbackName, callbackList, settings) {
        if (this && this.data) {
            const touchPoints =
                settings.acceptTouch && settings.touchPoints
                    ? settings.touchPoints
                    : 0;
            const callbacks = this.data.callbacks[callbackName];

            if (typeof callbacks !== "undefined") {
                if (typeof callbacks[touchPoints] === "undefined") {
                    callbacks[touchPoints] = [];
                }

                const sanitizedCallbacks = this.sanitizeCallbacks(callbackList);
                const callbackObjects = [];

                forEach(sanitizedCallbacks, callback => {
                    callbackObjects.push({
                        callback,
                        threshold: settings.threshold,
                        acceptMouse: settings.acceptMouse,
                        mouseButton: settings.mouseButton || 0
                    });
                });

                callbacks[touchPoints] = callbacks[touchPoints].concat(
                    callbackObjects
                );
            }
        }
    }

    /**
     * Remove callbacks.
     *
     * @private
     * @param {string} callbackName
     * @param {function|function[]} [callbackList]
     * @param {Object} [settings]
     */
    removeCallbacks(callbackName, callbackList, settings) {
        if (this && this.data) {
            const callbacks =
                settings && !isNaN(settings.touchPoints)
                    ? [this.data.callbacks[callbackName][settings.touchPoints]]
                    : this.data.callbacks[callbackName];

            if (typeof callbacks !== "undefined") {
                // Find defined callbacks
                if (callbackList) {
                    const sanitizedCallbacksToRemove = this.sanitizeCallbacks(
                        callbackList
                    );

                    forEach(callbacks, (callbackRefs, callbackRefsKey) => {
                        const removeFromArray = [];

                        forEach(callbackRefs, (callbackObject, index) => {
                            if (
                                sanitizedCallbacksToRemove.indexOf(
                                    callbackObject.callback
                                ) > -1
                            ) {
                                if (
                                    !settings ||
                                    ((typeof settings.acceptMouse ===
                                        "undefined" ||
                                        settings.acceptMouse ===
                                            callbackObject.acceptMouse) &&
                                        (typeof settings.mouseButton ===
                                            "undefined" ||
                                            settings.mouseButton ===
                                                callbackObject.mouseButton) &&
                                        (typeof settings.threshold ===
                                            "undefined" ||
                                            settings.threshold ===
                                                callbackObject.threshold))
                                ) {
                                    // Remove defined callbacks matching the defined settings
                                    removeFromArray.push(index);
                                }
                            }
                        });

                        if (removeFromArray.length) {
                            // Remove all callbacks
                            if (
                                removeFromArray.length === callbackRefs.length
                            ) {
                                callbacks[callbackRefsKey] = [];
                            }

                            // Remove specific callbacks
                            else {
                                removeFromArray.sort();
                                removeFromArray.reverse();
                                forEach(removeFromArray, index =>
                                    callbacks[callbackRefsKey].splice(index, 1)
                                );
                            }
                        }
                    });
                }

                // Remove all callbacks matching callbackName
                else {
                    if (settings && !isNaN(settings.touchPoints)) {
                        delete this.data.callbacks[callbackName][
                            settings.touchPoints
                        ];
                    } else {
                        delete this.data.callbacks[callbackName];
                    }
                }
            }
        }
    }

    /**
     * Fire all callbacks.
     *
     * @private
     * @param {Object} specifications
     * @param {string} specifications.callbackName
     * @param {number} specifications.touchPoints
     * @param {boolean} specifications.isMouseGesture
     * @param {number} specifications.mouseButton
     * @param {number} specifications.distance
     * @param {Object} specifications.data
     */
    fireCallbacks({
        callbackName,
        touchPoints,
        isMouseGesture,
        mouseButton,
        distance,
        data
    }) {
        if (this && this.data) {
            const callbacks = this.data.callbacks[callbackName];
            const touchPointCallbacks = isMouseGesture
                ? callbacks
                : [callbacks[touchPoints]];

            forEach(touchPointCallbacks, callbackObject => {
                if (
                    callbackObject &&
                    Array.isArray(callbackObject) &&
                    callbackObject.length
                ) {
                    callbackObject.forEach(funcRef => {
                        if (
                            (!isMouseGesture ||
                                (funcRef.acceptMouse &&
                                    funcRef.mouseButton === mouseButton)) &&
                            (typeof funcRef.thresholdPassed === "undefined" ||
                            !funcRef.thresholdPassed
                                ? distance >= funcRef.threshold
                                : funcRef.thresholdPassed)
                        ) {
                            // Set threshold to passed
                            funcRef.thresholdPassed = true;

                            // Accumulate difference for position and pinch
                            if (
                                typeof funcRef.accumulatedDifference ===
                                "undefined"
                            ) {
                                funcRef.accumulatedDifference = {
                                    base: {
                                        position: { x: 0, y: 0 },
                                        pinch: 0,
                                        rotation: 0
                                    },
                                    changed: {
                                        position: { x: 0, y: 0 },
                                        pinch: 0,
                                        rotation: 0
                                    }
                                };
                            }

                            if (data.first) {
                                funcRef.accumulatedDifference.base.position.x =
                                    funcRef.accumulatedDifference.changed.position.x;
                                funcRef.accumulatedDifference.base.position.y =
                                    funcRef.accumulatedDifference.changed.position.y;
                                funcRef.accumulatedDifference.base.pinch =
                                    funcRef.accumulatedDifference.changed.pinch;
                                funcRef.accumulatedDifference.base.rotation =
                                    funcRef.accumulatedDifference.changed.rotation;
                            }

                            funcRef.accumulatedDifference.changed.position.x =
                                funcRef.accumulatedDifference.base.position.x +
                                data.position.difference.x;
                            funcRef.accumulatedDifference.changed.position.y =
                                funcRef.accumulatedDifference.base.position.y +
                                data.position.difference.y;
                            funcRef.accumulatedDifference.changed.pinch =
                                funcRef.accumulatedDifference.base.pinch +
                                data.pinch.difference;
                            funcRef.accumulatedDifference.changed.rotation =
                                (funcRef.accumulatedDifference.base.rotation +
                                    data.rotation.degrees) %
                                360;

                            data.position.accumulatedDifference = {
                                x:
                                    funcRef.accumulatedDifference.changed
                                        .position.x,
                                y:
                                    funcRef.accumulatedDifference.changed
                                        .position.y
                            };

                            data.pinch.accumulatedDifference =
                                funcRef.accumulatedDifference.changed.pinch;
                            data.rotation.accumulatedDifference =
                                funcRef.accumulatedDifference.changed.rotation;

                            data.isMouse = isMouseGesture;

                            // Execute callback
                            funcRef.callback(
                                data,
                                this.applyVelocity.bind(this)
                            );

                            if (data.done) {
                                funcRef.thresholdPassed = false;
                            }
                        }
                    });
                }
            });
        }
    }

    /**
     * Set callbacks to fire on drag.
     *
     * @param {function|function[]} callbacks
     * @param {Object} [options={}]
     * @param {boolean} [options.acceptMouse=true] - Accept mouse events or not.
     * @param {boolean} [options.acceptTouch=true] - Accept touch events or not.
     * @param {number} [options.touchPoints=1] - The number of touch points to be in use for this callback to fire.
     * @param {number} [options.mouseButton=0] - Which mouse button to react to. `0` is the main button (usually left), `1` is the middle button or wheel, `2` is the secondary button (usually right), `3` and `4` are typically browser back and forward.
     * @param {number} [options.threshold=10] - The amount of pixels to have passed before the callback gets fired. This has second priority after the threshold setting set on the constructor, which defaults to 10.
     * @returns {Gesture} The gesture object, for function chaining.
     */
    onDrag(
        callbacks,
        {
            acceptMouse = true,
            acceptTouch = true,
            touchPoints = 1,
            mouseButton = 0,
            threshold = 10
        } = {}
    ) {
        this.setCallbacks("onDrag", callbacks, {
            acceptMouse,
            acceptTouch,
            touchPoints,
            mouseButton,
            threshold
        });

        return this;
    }

    /**
     * Set callbacks to fire on pinch.
     *
     * @param {function|function[]} callbacks
     * @param {Object} [options={}]
     * @param {number} [options.touchPoints=2] - The number of touch points to be in use for this callback to fire. Minimum 2.
     * @param {number} [options.threshold=10] - The amount of pixels to have passed before the callback gets fired. This has second priority after the threshold setting set on the constructor, which defaults to 10.
     * @returns {Gesture} The gesture object, for function chaining.
     */
    onPinch(callbacks, { touchPoints = 2, threshold = 10 } = {}) {
        this.setCallbacks("onPinch", callbacks, {
            acceptMouse: false,
            acceptTouch: true,
            touchPoints: Math.max(2, touchPoints), // Make sure touchPoints is set to minimum 2
            threshold
        });

        return this;
    }

    /**
     * Set callbacks to fire on click.
     *
     * @param {function|function[]} callbacks
     * @returns {Gesture} The gesture object, for function chaining.
     */
    onClick(callbacks) {
        const sanitizedCallbacks = this.sanitizeCallbacks(callbacks);
        this.data.callbacks.onClick = this.data.callbacks.onClick.concat(
            sanitizedCallbacks
        );

        return this;
    }

    /**
     * Remove callbacks for drag.
     *
     * If no callbacks or options are specified, *all* callbacks will be removed.
     *
     * @param {function|function[]|null} [callbacks] - The callback(s) to remove. If none are specified, all will be removed.
     * @param {Object} [options] - Settings to match when removing callbacks.
     */
    removeOnDrag(callbacks, options) {
        this.removeCallbacks("onDrag", callbacks, options);
    }

    /**
     * Remove callbacks for pinch.
     *
     * If no callbacks or options are specified, *all* callbacks will be removed.
     *
     * @param {function|function[]|null} [callbacks] - The callback(s) to remove. If none are specified, all will be removed.
     * @param {Object} [options] - Settings to match when removing callbacks.
     */
    removeOnPinch(callbacks, options) {
        this.removeCallbacks("onPinch", callbacks, options);
    }

    /**
     * Prevent default.
     *
     * @private
     * @param {MouseEvent} event
     * @returns {boolean}
     */
    preventDefault(event) {
        if (event && event.preventDefault) {
            event.preventDefault();
            return false;
        }
    }

    /**
     * Trigger a click on the target element
     *
     * @private
     */
    triggerClick = () => {
        if (this.settings.triggerClicks) {
            this.data.target.element.click();
        }

        if (this.data.callbacks.onClick.length) {
            forEach(this.data.callbacks.onClick, funcRef => {
                funcRef();
            });
        }

        if (this.data) {
            removeEvent(
                this.data.target.element,
                `touchend mouseup`,
                this.triggerClick
            );
        }
    };

    /**
     * Update the positions of all relevant touch points.
     *
     * @private
     * @param {boolean} isMouseGesture
     * @param {Object} points
     * @returns {{time: number, points: Object, pointsCount: number}}
     */
    updatePoints(isMouseGesture, points) {
        const currentData = {
            time: Date.now(),
            points: {},
            pointsCount: 0
        };

        forEach(points, point => {
            const id = isMouseGesture ? "mouse" : point.identifier;

            if (typeof this.data.points[id] !== "undefined") {
                const position = {
                    x: point.clientX || point.x,
                    y: point.clientY || point.y
                };

                if (!isNaN(position.x) && !isNaN(position.y)) {
                    this.data.points[id].position.current = position;
                    this.data.points[id].position.difference = {
                        x: position.x - this.data.points[id].position.start.x,
                        y: position.y - this.data.points[id].position.start.y
                    };

                    currentData.points[id] = position;
                }

                currentData.pointsCount += 1;
            }
        });

        return currentData;
    }

    /**
     * Apply velocity.
     *
     * @private
     * @param {boolean} [continueTrajectory=true] - Defaults to `true` which keeps the element in its current trajectory. Set this to `false` to send the element back to it's initial position.
     * @param {Object} [options={}] - Object with options.
     * @param {number} [options.duration=500] - The duration of the velocity process.
     * @param {Function} [options.easingFunction] - Take a look at these [easing functions](https://gist.github.com/gre/1650294).
     */
    applyVelocity(continueTrajectory = true, options = {}) {
        const velocitySettings = {
            duration: 500,
            easingFunction: time => 1 + Math.pow(time, 5), // Easing "easeOutQuint"
            ...options
        };

        // First run of apply velocity
        if (!this.data.pointsVelocity.lastUpdate) {
            removeEvent(document, "touchmove mousemove", this.gestureUpdate);
            removeEvent(document, "touchend mouseup", this.gestureEnd);

            this.data.active = false;
            this.data.readyForNextUpdate = true;

            const pointsHistoryDataCount = this.data.pointsHistory.data.length;

            if (pointsHistoryDataCount) {
                const time = Date.now();
                const oldestVelocityData = this.data.pointsHistory.data.shift();

                forEach(oldestVelocityData.points, (point, id) => {
                    this.data.pointsVelocity.data[id] = {
                        angle: Math.atan2(
                            this.data.points[id].position.current.y - point.y,
                            this.data.points[id].position.current.x - point.x
                        ),
                        speed:
                            (getDistance(
                                this.data.points[id].position.current,
                                point
                            ) /
                                (time - oldestVelocityData.time)) *
                            100,
                        origin: {
                            x: this.data.points[id].position.current.x,
                            y: this.data.points[id].position.current.y
                        },
                        start: {
                            x: this.data.points[id].position.start.x,
                            y: this.data.points[id].position.start.y
                        }
                    };
                });

                this.data.pointsVelocity.lastUpdate = time;
            }
        }

        const timeDifference = Date.now() - this.data.pointsVelocity.lastUpdate;
        this.data.pointsVelocity.progress = Math.min(
            timeDifference / velocitySettings.duration,
            1
        );
        const calculatedPoints = {};
        let accumulatedSpeed = 0;

        if (continueTrajectory) {
            const time = this.data.pointsVelocity.progress - 1;
            const easing = velocitySettings.easingFunction(time);

            forEach(this.data.pointsVelocity.data, (pointVelocity, id) => {
                const progress = easing * pointVelocity.speed;

                calculatedPoints[id] = {
                    identifier: id,
                    x:
                        pointVelocity.origin.x +
                        Math.cos(pointVelocity.angle) * progress,
                    y:
                        pointVelocity.origin.y +
                        Math.sin(pointVelocity.angle) * progress
                };

                accumulatedSpeed += pointVelocity.speed;
            });
        } else {
            const time = this.data.pointsVelocity.progress - 1;
            const progress = velocitySettings.easingFunction(time) * 100;

            forEach(this.data.pointsVelocity.data, (point, id) => {
                calculatedPoints[id] = {
                    ...getPointBetween(
                        this.data.pointsVelocity.data[id].origin,
                        this.data.pointsVelocity.data[id].start,
                        progress
                    ),
                    identifier: id
                };

                accumulatedSpeed = 1;
            });
        }

        if (!continueTrajectory || accumulatedSpeed) {
            this.updatePoints(
                typeof calculatedPoints.mouse !== "undefined",
                calculatedPoints
            );
        } else {
            this.data.readyForNextUpdate = false;
        }

        if (timeDifference > velocitySettings.duration) {
            this.data.readyForNextUpdate = false;
        }
    }

    /**
     * Process data of touch points and fire callbacks on each animation frame.
     *
     * @private
     * @param {boolean} lastRun - Weather or not this is the last execution before done.
     */
    gestureUpdateHandler(lastRun = false) {
        if (this.data && (this.data.readyForNextUpdate || lastRun)) {
            window.cancelAnimationFrame(this.data.requestAnimationFrame);
            this.data.requestAnimationFrame = window.requestAnimationFrame(
                () => {
                    if (!this.data) {
                        return;
                    }

                    const isMouseGesture =
                        typeof this.data.points.mouse !== "undefined";
                    const setStartPositionAverage =
                        typeof this.data.startPositionAverage.x === "undefined";

                    const callbackData = {
                        position: {
                            start: setStartPositionAverage
                                ? { x: 0, y: 0 }
                                : this.data.startPositionAverage,
                            current: {
                                x: 0,
                                y: 0
                            },
                            difference: {
                                x: 0,
                                y: 0
                            }
                        },
                        rotation: {}
                    };

                    forEach(this.data.points, point => {
                        const { start, current, difference } = point.position;

                        if (setStartPositionAverage) {
                            callbackData.position.start.x += start.x;
                            callbackData.position.start.y += start.y;
                        }
                        callbackData.position.current.x += current.x;
                        callbackData.position.current.y += current.y;
                        callbackData.position.difference.x += difference.x;
                        callbackData.position.difference.y += difference.y;
                    });

                    const touchPoints = Object.keys(this.data.points).length;
                    if (setStartPositionAverage) {
                        callbackData.position.start.x =
                            callbackData.position.start.x / touchPoints;
                        callbackData.position.start.y =
                            callbackData.position.start.y / touchPoints;
                    }
                    callbackData.position.current.x =
                        callbackData.position.current.x / touchPoints;
                    callbackData.position.current.y =
                        callbackData.position.current.y / touchPoints;
                    callbackData.position.difference.x =
                        callbackData.position.difference.x / touchPoints;
                    callbackData.position.difference.y =
                        callbackData.position.difference.y / touchPoints;
                    callbackData.position.distance = getDistance(
                        callbackData.position.start,
                        callbackData.position.current
                    );
                    callbackData.pinch = {
                        startDistance: 0,
                        currentDistance: 0,
                        difference: 0
                    };

                    // Save start position average
                    if (setStartPositionAverage) {
                        this.data.startPositionAverage =
                            callbackData.position.start;
                    }

                    // Drag
                    // Continue only if threshold has been passed (or there is no threshold)
                    if (
                        this.data.thresholdPassed.drag ||
                        !this.settings.threshold ||
                        callbackData.position.distance >=
                            this.settings.threshold
                    ) {
                        // Pass threshold and set swipe direction
                        if (!this.data.thresholdPassed.drag) {
                            this.data.thresholdPassed.drag = true;

                            if (
                                Math.abs(callbackData.position.difference.x) >=
                                Math.abs(callbackData.position.difference.y)
                            ) {
                                this.data.swipeDirection.x = true;
                            } else {
                                this.data.swipeDirection.y = true;
                            }
                        }

                        // Set callback data for swipe direction and rotation
                        callbackData.swipe = this.data.swipeDirection;
                        callbackData.rotation.startAngle = isNaN(
                            this.data.startAngle
                        )
                            ? getAngle(
                                  callbackData.position.start,
                                  this.data.target.center,
                                  { clockwise: false }
                              )
                            : this.data.startAngle;
                        callbackData.rotation.degrees =
                            getAngle(
                                callbackData.position.current,
                                this.data.target.center,
                                {
                                    clockwise: true,
                                    offset: callbackData.rotation.startAngle
                                }
                            ) % 360;
                    }

                    // Pinch
                    // Continue only if gesture was not triggered by a mouse and there are 2 touch points or more
                    if (!isMouseGesture && touchPoints >= 2) {
                        const positions = [];
                        forEach(this.data.points, point =>
                            positions.push(point.position.current)
                        );
                        const longestDistance = getAllDistances(
                            null,
                            positions
                        ).pop().distance;

                        if (isNaN(this.data.pinchStartDistance)) {
                            this.data.pinchStartDistance = longestDistance;
                        }

                        callbackData.pinch.startDistance = this.data.pinchStartDistance;
                        callbackData.pinch.currentDistance = longestDistance;
                        callbackData.pinch.difference =
                            callbackData.pinch.currentDistance -
                            callbackData.pinch.startDistance;

                        // Check if threshold has been passed
                        if (
                            !this.data.thresholdPassed.pinch &&
                            (!this.settings.threshold ||
                                Math.abs(callbackData.pinch.difference) >=
                                    this.settings.threshold)
                        ) {
                            this.data.thresholdPassed.pinch = true;
                        }
                    }

                    const pinchDifference = Math.abs(
                        callbackData.pinch.difference
                    );

                    // Fire callbacks for drag
                    if (
                        this.data.thresholdPassed.drag ||
                        this.data.thresholdPassed.pinch
                    ) {
                        if (
                            (this.data.thresholdPassed.drag &&
                                this.data.first.drag) ||
                            (this.data.thresholdPassed.pinch &&
                                this.data.first.pinch)
                        ) {
                            removeEvent(
                                this.data.target.element,
                                "touchend mouseup",
                                this.triggerClick
                            );
                        }

                        // Fire callbacks for drag
                        this.fireCallbacks({
                            callbackName: "onDrag",
                            touchPoints,
                            isMouseGesture,
                            mouseButton: isMouseGesture
                                ? this.data.points.mouse.button
                                : undefined,
                            distance: Math.max(
                                callbackData.position.distance,
                                pinchDifference || 0
                            ),
                            data: {
                                first: this.data.first.drag,
                                interaction: this.data.active,
                                done: lastRun,
                                velocity: {
                                    state:
                                        this.data.pointsVelocity.lastUpdate !==
                                        0,
                                    progress: this.data.pointsVelocity.progress
                                },
                                ...callbackData
                            }
                        });

                        if (this.data) {
                            this.data.first.drag = false;
                        }
                    }

                    // Fire callbacks for pinch
                    if (this.data && this.data.thresholdPassed.pinch) {
                        this.fireCallbacks({
                            callbackName: "onPinch",
                            touchPoints,
                            isMouseGesture,
                            mouseButton: undefined,
                            distance: pinchDifference,
                            data: {
                                first: this.data.first.pinch,
                                interaction: this.data.active,
                                done: lastRun,
                                velocity: {
                                    state:
                                        this.data.pointsVelocity.lastUpdate !==
                                        0,
                                    progress: this.data.pointsVelocity.progress
                                },
                                ...callbackData
                            }
                        });

                        if (this.data) {
                            this.data.first.pinch = false;
                        }
                    }

                    // If this is not the last run, execute this function again
                    if (this.data && !lastRun) {
                        this.gestureUpdateHandler(
                            !this.data.readyForNextUpdate
                        );
                    }
                }
            );
        }
    }

    /**
     * Handle "mousedown" and "touchstart" events.
     *
     * @private
     * @param {MouseEvent|TouchEvent} event
     */
    gestureStart = event => {
        this.preventDefault(event);

        // Get basic gesture data
        const isMouseGesture = event.type === "mousedown";
        const mouseButton = isMouseGesture ? event.button : undefined;
        const gesturePointCount = isMouseGesture
            ? 1
            : event.targetTouches.length;

        // Set start data
        const points = {};
        forEach(isMouseGesture ? [event] : event.targetTouches, point => {
            const id = isMouseGesture ? "mouse" : point.identifier;

            if (typeof points[id] === "undefined") {
                const position = {
                    x: point.clientX,
                    y: point.clientY
                };

                points[id] = {
                    position: {
                        start: position,
                        current: position,
                        difference: { x: 0, y: 0 }
                    },
                    type: isMouseGesture ? "mouse" : "touch",
                    button: mouseButton
                };
            }
        });

        let foundCallbacks = 0;

        // Count relevant callbacks for onDrag
        const dragCallbacks = isMouseGesture
            ? this.data.callbacks.onDrag
            : typeof this.data.callbacks.onDrag[gesturePointCount] !==
              "undefined"
            ? [this.data.callbacks.onDrag[gesturePointCount]]
            : [];
        forEach(
            dragCallbacks,
            touchPointCallbacks =>
                (foundCallbacks +=
                    typeof touchPointCallbacks !== "undefined"
                        ? touchPointCallbacks.length
                        : 0)
        );

        // Count relevant callbacks for onDrag
        foundCallbacks +=
            typeof this.data.callbacks.onPinch[gesturePointCount] ===
            "undefined"
                ? 0
                : this.data.callbacks.onPinch[gesturePointCount].length;

        // Start listening for more touch and mouse events - if we don't already
        if (foundCallbacks) {
            addEvent(
                document,
                `touchmove ${isMouseGesture ? "mousemove" : ""}`,
                this.gestureUpdate
            );
            addEvent(
                document,
                `touchend ${isMouseGesture ? "mouseup" : ""}`,
                this.gestureEnd
            );

            // Reset data, which will also cancel any velocity in progress
            this.resetToDataDefaults();

            // Get the size, position and center of the target element
            this.data.target.position = this.data.target.element.getBoundingClientRect();
            this.data.target.size = {
                width:
                    this.data.target.position.right -
                    this.data.target.position.left,
                height:
                    this.data.target.position.bottom -
                    this.data.target.position.top
            };
            this.data.target.center = [
                this.data.target.position.left +
                    this.data.target.size.width / 2,
                this.data.target.position.top + this.data.target.size.height / 2
            ];

            // Set state to active
            this.data.active = true;

            // Set points and update!
            this.data.points = points;
            this.gestureUpdateHandler();
        }

        // Set event listener for "mouseup" and "touchend" in case the current gesture is just a click
        if (
            (this.settings.triggerClicks ||
                this.data.callbacks.onClick.length) &&
            ((isMouseGesture && mouseButton === 0) ||
                (!isMouseGesture && gesturePointCount === 1))
        ) {
            addEvent(
                this.data.target.element,
                `touchend ${isMouseGesture ? "mouseup" : ""}`,
                this.triggerClick
            );
        }
    };

    /**
     * Handle "mousemove" and "touchmove" events.
     *
     * @private
     * @param {MouseEvent|TouchEvent} event
     */
    gestureUpdate = event => {
        this.preventDefault(event);

        // Get basic gesture data
        const isMouseGesture = event.type === "mousemove";

        // Set current data
        const currentData = this.updatePoints(
            isMouseGesture,
            isMouseGesture ? [event] : event.targetTouches
        );

        if (
            currentData.pointsCount &&
            (currentData.time - this.data.pointsHistory.lastUpdate >= 20 ||
                !this.data.pointsHistory.lastUpdate)
        ) {
            this.data.pointsHistory.data.push(currentData);
            this.data.pointsHistory.data = this.data.pointsHistory.data.slice(
                -2
            );
            this.data.pointsHistory.lastUpdate = currentData.time;
        }
    };

    /**
     * Handle "mouseup" and "touchend" events.
     *
     * @private
     * @param {MouseEvent|TouchEvent} event
     */
    gestureEnd = event => {
        this.preventDefault(event);

        let endEvent = event.type === "mouseup";

        if (!endEvent) {
            forEach(event.changedTouches, point => {
                if (typeof this.data.points[point.identifier] !== "undefined") {
                    endEvent = true;
                }
            });
        }

        if (endEvent) {
            removeEvent(document, "touchmove mousemove", this.gestureUpdate);
            removeEvent(document, "touchend mouseup", this.gestureEnd);

            this.data.active = false;
            this.data.readyForNextUpdate = false;
        }
    };

    /**
     * Set data object to default values.
     */
    resetToDataDefaults() {
        this.data = {
            ...(this.data || {}),
            active: false,
            readyForNextUpdate: true,
            first: {
                drag: true,
                pinch: true
            },
            points: {},
            pointsHistory: {
                lastUpdate: 0,
                data: []
            },
            pointsVelocity: {
                lastUpdate: 0,
                progress: 0,
                origin: {},
                data: {}
            },
            thresholdPassed: {
                drag: false,
                pinch: false
            },
            swipeDirection: {
                x: false,
                y: false
            },
            startPositionAverage: {},
            startAngle: undefined,
            pinchStartDistance: undefined
        };
    }

    /**
     * Destroy the gesture handler by removing all event listeners and deleting data and settings.
     */
    destroy() {
        if (this.data) {
            removeEvent(
                this.data.target.element,
                "touchstart mousedown",
                this.gestureStart
            );
            removeEvent(
                this.data.target.element,
                "contextmenu",
                this.preventDefault
            );
            removeEvent(document, "touchmove mousemove", this.gestureUpdate);
            removeEvent(document, "touchend mouseup", this.gestureEnd);

            delete this.data;
            delete this.settings;
        }
    }
}
