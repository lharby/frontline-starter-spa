/**
 * AutoSuggest class
 *
 * The AutoSuggest class takes the value of a search-input and matches it against selected parameters in an array of
 * objects.
 *
 *
 * By default the matching objects title- or name-parameter is displayed in a list below the search-field, along with
 * the matching parameter-name. This can however be customised along with some other details explained in more details
 * further down the code.
 *
 *
 * @author Nicolaj Lund Hummel
 * @since 3.8.0
 * @module utils/interaction/AutoSuggest
 *
 *
 * @example <caption>Basic usage:</caption>
 * import { AutoSuggest } from "./utils/interaction/AutoSuggest";
 *
 * const searchKeyArray = ["name", "email", "phone"];
 * const searchInput = document.getElementById("searchInput");
 *
 * const dataProvider = searchValue => fetch(`https://example.com/search/api?search=${searchValue}`);
 *
 * const onMatchReturn = (array, resultsWrap) => {
 *     const linkArray = [];
 *     forEach(array, userItem => {
 *
 *         const linkElem = createElement("a", {
 *             href: "#",
 *             text: userItem[0].name,
 *             [`data-user-id`]: userItem[0].userId,
 *         });
 *
 *         const span = createElement("span", {
 *             className: "autosuggest__match-key",
 *             text: `${userItem[1] !== "name" ? userItem[1] : ""}`,
 *         });
 *
 *         linkElem.appendChild(span);
 *
 *         const liElem = createElement("li", { html: linkElem });
 *
 *         linkArray.push(liElem);
 *     });
 *
 *     appendElement(linkArray, resultsWrap);
 * };
 *
 * void new AutoSuggest(searchInput, dataProvider, onMatchReturn, {
 *     searchParams: searchKeyArray,
 * });
 */

import throttle from "lodash-es/throttle";
import { forEach } from "../forEach";
import { addClass, removeClass } from "../dom/classList";
import {
    addEvent,
    delegateEvent,
    removeAllEvents
} from "../events/events";
import { createElement } from "../dom/createElement";
import {
    deleteElement,
    emptyElement,
    insertElementAfter
} from "../dom/elementManipulation";
import { onClickOutside } from "../events/onClickOutside";

// Import the styling we need.
import "~/scss/components/js/autoSuggest.scss";

/**
 * An object containing class names used to modify the state of the module
 *
 * @private
 * @type {string}
 */
const classNames = {
    active: "autosuggest__results--active",
    loading: "autosuggest__results--loading"
};

const defaultThrottleValue = 500;

export class AutoSuggest {
    /**
     * The AutoSuggest class sets up autoSuggest-events and handlers to search-through given array of objects (with user
     * data) and render user-names where input.value matches one of the given parameters to search through.
     *
     * @constructor
     * @since 3.8.0
     * @param {HTMLElement} searchInput - Search input field
     * @param {function} dataProvider - Function that returns a Promise - resolving with an array of objects to suggest results among. The searchInput value is parsed as the first argument.
     * @param {function} returnHandler - Custom function to handle matching array. The first argument is an array containing an array for each result with the matchingObject and its matching key. The second argument is the resultsWrapper.
     * @param {object} [options={}] - Custom configurations goes here.
     * @param {boolean} [options.closeOnClickOutside=true] - Whether or not to close shown results when clicking outside the container
     * @param {number} [options.minChar=3] - Minimum number of characters before initiating search.
     * @param {number} [options.maxResults=50] - The max number of results returned to the returnHandler - This limit is only enforced via the filterMatches method, and therefore not used when serverFilter is turned on, since the server might as well imply this limit.
     * @param {string[]} [options.searchParams] - Optional array of parameters to match searchWord against, if not specified, all params will be matched. If searchArray contains big objects, I recommend defining these, in the name of performance.
     * @param {boolean} [options.serverFilter=false] - If set to true it is expected that filtering of results will be done on the server-side.
     * @param {HTMLElement} [options.resultsWrap] - The container where suggestions are rendered
     * @param {number} [options.throttleTime=500] - Timeout in millisecond for the dataProvider to wait before fetching new data.
     */
    constructor(searchInput, dataProvider, returnHandler, options = {}) {
        if (
            searchInput &&
            dataProvider &&
            typeof returnHandler === "function"
        ) {
            this.dom = {
                searchInput
            };
            this.dom.resultsWrap =
                options.resultsWrap || this.createSuggestionWrap();

            this.configuration = {
                closeOnClickOutside: options.closeOnClickOutside || true,
                minChar: options.minChar || 3,
                maxResults: options.maxResults || 50,
                searchParams: options.searchParams || null,
                serverFilter: options.serverFilter || false,
                throttleTime: options.throttleTime || defaultThrottleValue
            };

            this.returnHandler = returnHandler;

            this.dataProvider = throttle(dataProvider, options.throttleTime);

            this.bindEvents();
        } else {
            window.console.warn(
                "One of the fundamental elements are missing for the AutoSuggest module to work.\nCheck that you have provided the following settings: searchInput, dataProvider, returnHandler"
            );
        }
    }

    /**
     * Bind events.
     *
     * @private
     */
    bindEvents() {
        addEvent(this.dom.searchInput, "keyup", event =>
            this.handleSearchRequest(event)
        );
        addEvent(this.dom.searchInput, "keydown", event =>
            this.handleFocus(event)
        );

        delegateEvent(
            "a",
            "keydown",
            handlerObj => {
                this.handleFocus(handlerObj.event);
            },
            this.dom.resultsWrap
        );
    }

    /**
     * Sends searchInput value to dataProvider if value has minimum number of characters.
     * Response-formats other than Arrays are formatted before being parsed to the dataProvider.
     *
     * @param {Event} event - Keyboard Event
     * @private
     */
    handleSearchRequest(event) {
        const value = this.dom.searchInput.value.trim();

        if (value.length >= this.configuration.minChar) {
            // Prevent call to dataProvider if ArrowKeys are pressed:
            if (event.which >= 37 && event.which <= 40) {
                // 37 = ArrowLeft / 38 = ArrowUp / 39 = ArrowRight / 40 = ArrowDown
                return;
            }

            addClass(this.dom.resultsWrap, classNames.loading);

            this.dataProvider(value)
                .then(response => {
                    if (Array.isArray(response)) {
                        this.displayMatches(response, value);
                    }

                    // Attempt to squeeze an array out of the response data if it is an object
                    else if (typeof response === "object") {
                        response.json().then(data => {
                            this.displayMatches(data, value);
                        });
                    }

                    // Attempt to squeeze an array out of the wrong format given
                    else if (typeof response === "string") {
                        this.displayMatches(JSON.parse(response), value);
                    }
                })
                .catch(error => {
                    window.console.warn(
                        "Error in AutoSuggest dataProvider.\nMake sure dataProvider is returning af Promise.\nError:",
                        error
                    );
                });
        } else {
            removeClass(this.dom.resultsWrap, [
                classNames.active,
                classNames.loading
            ]);
        }
    }

    /**
     * Display the new results given. And setup clickOutside handler til clear on escape-key press
     * With serverFilter enabled the function will simply parse the results to given resultsHandler.
     * Without serverFilter returned suggestions are filtered before being parse to the resultsHandler.
     *
     * @param {Array} searchArray - Array of results in the form of objects.
     * @param {String} value - Text value to be matched against results.
     * @private
     */
    displayMatches(searchArray, value) {
        const { resultsWrap } = this.dom;

        emptyElement(resultsWrap);
        removeClass(resultsWrap, classNames.loading);

        if (!this.configuration.serverFilter) {
            const matchArrays = AutoSuggest.filterMatches(
                value,
                searchArray,
                this.configuration.searchParams,
                this.configuration.maxResults
            );

            if (matchArrays.length) {
                this.returnHandler(matchArrays, resultsWrap);
                addClass(resultsWrap, classNames.active);
            }
        } else {
            this.returnHandler(searchArray, resultsWrap);
            addClass(resultsWrap, classNames.active);
        }

        if (this.configuration.closeOnClickOutside === true) {
            onClickOutside(resultsWrap, () => {
                this.clearContent();
            });
        }
    }

    /**
     * Checks searchParam values if any matches the wordToMatch.
     *
     * @param {string} wordToMatch
     * @param {object[]} searchArray - Array of results as objects to filter on.
     * @param {string[]} searchParams - Parameters to match searchInput against in result objects.
     * @param {number} maxReturn - Max length of the results-array returned.
     * @returns {Array} An object of the matching param along with the name of the param.
     */
    static filterMatches(wordToMatch, searchArray, searchParams, maxReturn) {
        const regex = new RegExp(wordToMatch, "gi");
        const filteredArray = [];

        // If searchParams is not specified as Array, save each param in the searchArray as searchParams
        const params = Array.isArray(searchParams)
            ? searchParams
            : Object.keys(searchArray[0]);

        forEach(searchArray, obj => {
            for (
                let i = 0;
                i < params.length && filteredArray.length < maxReturn;
                i += 1
            ) {
                const key = params[i];

                if (obj[key].match(regex)) {
                    filteredArray.push([obj, key]);
                    break;
                }
            }
        });

        return filteredArray;
    }

    /**
     * Handles arrow up and down to select suggested links, and clears the suggestions on escape.
     * Set the focus depending on the current activeElement and what key was pressed.
     *
     * @param {Event} event - KeyBoard Event
     * @returns {boolean}
     * @private
     */
    handleFocus(event) {
        const { searchInput, resultsWrap } = this.dom;
        const firstChild = resultsWrap.firstElementChild;

        if (firstChild) {
            const activeElement = document.activeElement;

            if (event.which === 40) {
                // 40 === ArrowDown
                event.preventDefault();

                if (activeElement === searchInput) {
                    firstChild.firstElementChild.focus();
                } else if (
                    activeElement === resultsWrap.lastChild.firstElementChild
                ) {
                    if (resultsWrap.children.length < 2) {
                        return false;
                    } else {
                        firstChild.firstElementChild.focus();
                    }
                } else {
                    activeElement.parentNode.nextElementSibling.firstElementChild.focus(
                        { preventScroll: true }
                    );
                }
            } else if (event.which === 38 && activeElement !== searchInput) {
                // 38 === ArrowUp
                event.preventDefault();

                if (activeElement === firstChild.firstElementChild) {
                    searchInput.focus();
                } else {
                    activeElement.parentNode.previousElementSibling.firstElementChild.focus(
                        { preventScroll: true }
                    );
                }
            } else if (event.which === 27) {
                // 27 === Escape
                removeClass(resultsWrap, classNames.active);
                this.clearContent();
            }
        }
    }

    /**
     * Creates a container to hold auto suggestions.
     *
     * @private
     */
    createSuggestionWrap() {
        const suggestWrapElem = createElement("ul", {
            className: "autosuggest__results"
        });
        insertElementAfter(suggestWrapElem, this.dom.searchInput);

        this.resultsWrapperCreated = true;

        return suggestWrapElem;
    }

    /**
     * Clear the content area completely.
     *
     * @private
     */
    clearContent() {
        if (
            typeof this.dom === "object" &&
            this.dom.resultsWrap instanceof HTMLElement
        ) {
            emptyElement(this.dom.resultsWrap);
        }
    }

    /**
     * Destroy the AutoSuggest instance. This will remove event handlers and remove the DOM as best we can.
     */
    destroy() {
        // Remove all regular event listeners, because that's just a nice thing to to.
        removeAllEvents(this.dom.searchInput);
        removeAllEvents(this.dom.resultsWrap);

        // Remove all content nodes.
        this.clearContent();
        if (this.resultsWrapperCreated) {
            deleteElement(this.dom.resultsWrap);
        }

        // More cleanup!
        delete this.dom;
        delete this.configuration;
        delete this.returnHandler;
        delete this.dataProvider;
    }
}
