/**
 * FormValidate class
 *
 * This utility validates form fields using the Constraint Validation Javascript API,
 * displaying an error when the user leaves a field, and keeping that error persistent until the issue is fixed.
 *
 * When validated and submitted, the field elements are returned for your very own amusement.
 *
 * If the browser is offline, the input field values are saved to localStorage.
 * Set the `saveDataWhenOffline` boolean to `false` to turn it off.
 *
 * @module utils/FormValidate
 * @since 3.6.3
 * @author Bjarni Olsen <bjarni.olsen@akqa.com>
 * @author Lars Munkholm <lars.munkholm@akqa.com>
 *
 *
 * @example <caption>Basic JS:</caption>
 * import { FormValidate } from "./utils/formValidate";
 *
 * const formElement = document.querySelector("form.form-validate");
 * if (formElement) {
 *     void new FormValidate(formElement, {
 *         saveDataWhenOffline: true,
 *         beforeSubmit: () => {
 *             // Previous errors (if any) have been removed from all fields and validation is about to run.
 *             // If you have any code you wish to execute before validation, you can put it here.
 *         },
 *         onSubmit: fields => {
 *             window.console.log(fields);
 *         },
 *         whenOffline: () => {
 *             window.console.log("You are offline and the data is saved to localStorage");
 *         },
 *     });
 * }
 *
 *
 * @example <caption>Basic HTML:
 *
 * Use a combination of semantic input types and validation attributes such as "required" and "pattern".
 *
 * All error and requirement messages is set on the input control but fallback to hardcoded messages.
 * </caption>
 * {@lang html}
 * <!-- As a minimum the field should use "required" to get validated. -->
 * <input required type="email" name="inputEmail"/>
 *
 * <!-- Enhance it with the "pattern" and "data" attributes. -->
 * <input
 *     required
 *     type="number"
 *     name="numberInput"
 *     pattern="[-+]?[0-9]"
 *     data-error-message="Please fill out this field."
 *     data-requirements-message="Please only use numbers."
 * />
 *
 * <!-- Select box example. -->
 * <select
 *     required
 *     name="selectOptions"
 *     data-error-message="Please choose an option.">
 *     <option value="">---</option>
 *     <option value="1">option 1</option>
 *     <option value="2">option 2</option>
 * </select>
 *
 * <!-- Password match example -->
 * <input
 *     required
 *     type="password"
 *     name="thePassword"
 *     data-error-message="Please fill out this field."
 *     data-requirements-message="Please include at least 8 characters and at least 1 uppercase character, 1 lowercase character, 1 number and 1 special character." />
 *
 * <!-- should match: -->
 * <input
 *     required
 *     type="password"
 *     data-confirms="thePassword"
 *     name="confirmPassword"
 *     data-error-message="Please fill out this field."
 *     data-requirements-message="The two passwords should match." />
 *
 */

import { onReady } from "../utils/events/onReady";
import { addEvent, removeEvent } from "../utils/events/events";
import { addClass, hasClass, removeClass } from "../utils/dom/classList";
import { forEach } from "../utils/forEach";
import { scrollTo } from "../utils/dom/scrollTo";
import { createElement } from "../utils/dom/createElement";
import { emailRegex } from "../utils/patternMatching/email";
import { passwordRegex } from "../utils/patternMatching/password";
import { setInputPattern } from "../utils/dom/setInputPattern";

/**
 * Callback for when the valid form is submitted.
 *
 * @callback onSubmit
 * @param {NodeList} fields - The validated fields in the form.
 */

/**
 * Object with the different options for setting up the validation.
 *
 * @typedef {object} FormValidateOptionsObject
 * @property {function} [beforeSubmit] - Optional callback to fire before the form is validated on submit.
 * @property {onSubmit} [onSubmit] - Optional callback to fire after the valid form is submitted.
 * @property {function} [whenOffline] - Optional callback to fire after the valid form is submitted but the browser is offline.
 * @property {boolean} [saveDataWhenOffline=true] - Save input field values to localStorage.
 * @property {PasswordOptions} [password] - Set the requirements for a valid password. For information on how to customize this, see the documentation for `patternMatching/password`.
 * @property {string[]} [elementsToValidate=["input", "select", "textarea", "datalist", "output"]] - Tag names of elements to validate.
 * @property {string} [errorMessageIdPrefix="error-for-"] - Prefix for the IDs given to error messages.
 * @property {Object} [classNames={}] - An object with class names.
 * @property {string} [classNames.validField="form-validate__field--valid"] - Class name for fields that are valid.
 * @property {string} [classNames.invalidField="form-validate__field--invalid"] - Class name for fields that did not validate.
 * @property {string} [classNames.forceInvalidField="form-validate__field--force-invalid"] - Class name for fields that must be forced to not validate.
 * @property {string} [classNames.errorMessage="form-validate__error-message"] - Class name for the elements that show the error message.
 */

/**
 * Object returned by this.getValidityState()
 *
 * @private
 * @typedef {Object} ValidationObject
 * @property {boolean} badInput
 * @property {boolean} patternMismatch
 * @property {boolean} tooLong
 * @property {boolean} tooShort
 * @property {boolean} valueMissing
 * @property {boolean} valid
 */

/**
 * Object returned by this.checkExtendedValidation()
 *
 * @private
 * @typedef {Object} ExtendedValidationObject
 * @property {boolean} confirmError
 * @property {boolean} valid
 */

/**
 * Generate the field validity object.
 *
 * @ignore
 * @param  {HTMLElement} field - The field to validate
 * @returns {ValidationObject} The validity object
 */
function getValidityState(field) {
    let element = field;
    const type = element.getAttribute("type") || element.nodeName.toLowerCase();
    const isNum = type === "number" || type === "range";
    const length = element.value.length;

    let valid = true;

    // If radio group, get selected field
    if (type === "radio" && element.name) {
        const group = (element.form || document).querySelectorAll(
            `input[name=${element.name}]`
        );
        forEach(group, item => {
            if (item.form === element.form && item.checked) {
                element = item;
            }
        });
    }

    // Run validity checks
    const checkValidity = {
        badInput: isNum && length > 0 && !/[-+]?[0-9]/.test(element.value), // value of a number field is not a number
        patternMismatch:
            element.hasAttribute("pattern") &&
            length > 0 &&
            new RegExp(element.getAttribute("pattern")).test(element.value) ===
                false,
        tooLong:
            element.hasAttribute("maxLength") &&
            element.getAttribute("maxLength") > 0 &&
            length > parseInt(element.getAttribute("maxLength"), 10), // the user has edited a too-long value in a field with a maximum length
        tooShort:
            element.hasAttribute("minLength") &&
            element.getAttribute("minLength") > 0 &&
            length > 0 &&
            length < parseInt(element.getAttribute("minLength"), 10), // the user has edited a too-short value in a field with a minimum length,
        valueMissing:
            element.hasAttribute("required") &&
            (((type === "checkbox" || type === "radio") && !element.checked) ||
                (type === "select" &&
                    element.options[element.selectedIndex].value < 1) ||
                (type !== "checkbox" &&
                    type !== "radio" &&
                    type !== "select" &&
                    length < 1)), // required field without a value
        valid: undefined
    };

    // Check if any errors
    forEach(checkValidity, check => {
        if (valid) {
            // If there's an error, change valid value
            if (check) {
                valid = false;
            }
        }
    });

    // Add valid property to validity object
    checkValidity.valid = valid;

    // Return object
    return checkValidity;
}

export class FormValidate {
    /**
     * This is the constructor method for the FormValidate class.
     *
     * @class
     * @param {HTMLFormElement|Node} formElement - The form element to validate.
     * @param {FormValidateOptionsObject} [options={}] - Optional options object.
     */
    constructor(formElement, options = {}) {
        /**
         * Settings
         *
         * @private
         * @type {FormValidateOptionsObject}
         */
        this.settings = {
            classNames: {},
            saveDataWhenOffline: true,
            elementsToValidate: [
                "input",
                "select",
                "textarea",
                "datalist",
                "output"
            ],
            errorMessageIdPrefix: "error-for-",
            ...options
        };

        /**
         * Object containing the various element names that will be used while building the DOM for error messages.
         *
         * @private
         * @type {Object}
         */
        this.settings.classNames = {
            validField:
                this.settings.classNames.validField ||
                "form-validate__field--valid",
            invalidField:
                this.settings.classNames.invalidField ||
                "form-validate__field--invalid",
            forceInvalidField:
                this.settings.classNames.forceInvalidField ||
                "form-validate__field--force-invalid",
            errorMessage:
                this.settings.classNames.errorMessage ||
                "form-validate__error-message"
        };

        /**
         * Global object to contain all DOM elements.
         *
         * @private
         * @type {Object}
         */
        this.dom = {};

        /**
         * Global boolean to check for already added events.
         *
         * @private
         */
        this.alreadyHasKeyupEvent = false;

        /**
         * This variable holds the event name to fire on a form field in order to trigger validation on it.
         *
         * @type {string}
         */
        this.validationTrigger = "trigger-form-validation";

        onReady(() => this.init(formElement));
    }

    /**
     * Extended validation states
     *
     * @private
     * @param {HTMLElement} field - The field to validate
     * @returns {ExtendedValidationObject} The custom validations object
     */
    checkExtendedValidation(field) {
        const confirmField = field.getAttribute("data-confirms") || false;
        let valid = true;

        // these checks must ALWAYS be a boolean (true or false)
        const confirmFieldElement = this.dom.form.querySelector(
            `input[name=${confirmField}]`
        );
        const extendedValidation = {
            confirmError:
                confirmFieldElement !== null &&
                confirmFieldElement.value !== field.value,
            valid: undefined
        };

        // Check if any errors
        forEach(extendedValidation, check => {
            if (valid) {
                // If there's an error, change valid value
                if (check) {
                    valid = false;
                }
            }
        });

        // Add valid property to validity object
        extendedValidation.valid = valid;

        // Return object
        return extendedValidation;
    }

    /**
     * Validate input after pressing a key.
     *
     * @private
     * @param {KeyboardEvent} event
     */
    inlineValidation(event) {
        const field = event.target;

        // If this field belongs to a group of fields, get all of them
        let fieldGroup;
        if (field.type === "radio" && field.name) {
            fieldGroup = this.dom.form.querySelectorAll(
                `input[name=${field.name}]`
            );
        }

        // Validate the field
        const error = this.hasError(field);

        if (error) {
            this.showError(field, error);
            return;
        }

        // It's valid, remove error class
        removeClass(field, this.settings.classNames.invalidField);
        // and add a valid class
        addClass(field, this.settings.classNames.validField);

        // ...remove the "key up" event handler
        removeEvent(fieldGroup ? fieldGroup : field, "keyup");
        this.alreadyHasKeyupEvent = false;

        // and hide any existing error message
        this.hideError(field);
    }

    /**
     * Validate the field using Validity State properties
     *
     * @private
     * @param {HTMLElement} field
     * @returns {string|boolean}
     */
    hasError(field) {
        // Don't validate submits, buttons and reset inputs, and disabled fields
        if (
            !field ||
            field.disabled ||
            field.type === "reset" ||
            field.type === "submit" ||
            field.type === "button" ||
            this.settings.elementsToValidate.indexOf(
                field.tagName.toLowerCase()
            ) === -1
        ) {
            return false;
        }

        // Get validity
        const validity = getValidityState(field);

        // Get extended custom validations
        const extendedValidations = this.checkExtendedValidation(field);

        // If field has a pattern - use that and ignore the browser default validation against the field type.
        let ignoreTypeValidation = false;
        let isValidExceptType = true;
        if (field.hasAttribute("pattern")) {
            ignoreTypeValidation = true;

            if (
                validity.badInput ||
                validity.customError ||
                validity.valueMissing ||
                validity.rangeOverflow ||
                validity.rangeUnderflow ||
                validity.stepMismatch ||
                validity.tooLong ||
                validity.tooShort ||
                validity.patternMismatch
            ) {
                isValidExceptType = false;
            }
        }

        // If all valid, return null
        if (
            (ignoreTypeValidation ? isValidExceptType : validity.valid) &&
            extendedValidations.valid &&
            !hasClass(field, this.settings.classNames.forceInvalidField)
        ) {
            return false;
        }

        // gather all error messages from the field
        const errorMessage =
            field.dataset.errorMessage || "Please fill out this field";
        const requirementsMessage = field.dataset.requirementsMessage;

        // If field is required and empty
        if (validity.valueMissing) {
            return errorMessage;
        }

        // If not the right type
        if (validity.typeMismatch) {
            // Email
            if (field.type === "email") {
                return requirementsMessage || "Please enter an email address.";
            }

            // URL
            else if (field.type === "url") {
                return requirementsMessage || "Please enter a URL.";
            }
        }

        // If too short
        if (validity.tooShort) {
            return (
                requirementsMessage ||
                `Please expand this text to ${field.getAttribute(
                    "minLength"
                )} characters or more. You are currently using ${
                    field.value.length
                } characters.`
            );
        }

        // If too long
        if (validity.tooLong) {
            return (
                requirementsMessage ||
                `Please short this text to no more than ${field.getAttribute(
                    "maxLength"
                )} characters. You are currently using ${
                    field.value.length
                } characters.`
            );
        }

        // If number input isn't a number
        if (validity.badInput) {
            return requirementsMessage || "Please enter a number.";
        }

        // If a number value doesn't match the step interval
        if (validity.stepMismatch) {
            return requirementsMessage || "Please select a valid value.";
        }

        // If a number field is over the max
        if (validity.rangeOverflow) {
            return (
                requirementsMessage ||
                `Please select a value that is no more than ${field.getAttribute(
                    "max"
                )}.`
            );
        }

        // If a number field is below the min
        if (validity.rangeUnderflow) {
            return (
                requirementsMessage ||
                `Please select a value that is no less than ${field.getAttribute(
                    "min"
                )}.`
            );
        }

        // If pattern doesn't match
        if (validity.patternMismatch) {
            // Email
            if (field.type === "email") {
                return requirementsMessage || "Please enter an email address.";
            }

            // Password
            else if (field.type === "password") {
                return requirementsMessage || "Please enter a valid password.";
            }

            // Anything else
            else {
                return (
                    requirementsMessage || "Please match the requested format."
                );
            }
        }

        if (extendedValidations.confirmError) {
            return requirementsMessage || "Field value doesn't match";
        }

        // If all else fails, return a generic catchall error
        return (
            requirementsMessage ||
            "The value you entered for this field is invalid."
        );
    }

    /**
     * Show an error message below the field
     *
     * @private
     * @param {HTMLElement} field
     * @param {string} errorMessage
     */
    showError(field, errorMessage) {
        let element = field;

        // Add error class to field
        addClass(element, this.settings.classNames.invalidField);
        removeClass(element, this.settings.classNames.validField);

        // If the element is a radio button and part of a group, error all and get the last item in the group
        let elementGroup;
        if (element.type === "radio" && element.name) {
            elementGroup = this.dom.form.querySelectorAll(
                `input[name=${element.name}]`
            );
            const len = elementGroup.length;
            if (len > 0) {
                forEach(elementGroup, item => {
                    addClass(item, this.settings.classNames.invalidField);
                    removeClass(item, this.settings.classNames.validField);
                });
                element = elementGroup[len - 1];
            }
        }

        // Get element id or name
        const id = element.id || element.name;
        if (!id) {
            throw "[formValidate.js] Fields need an ID or a name for form validation to work.";
        }

        // Check if error message element already exists
        // If not, create one
        let message = document.getElementById(
            `${this.settings.errorMessageIdPrefix}${id}`
        );
        if (!message) {
            message = createElement("div", {
                className: this.settings.classNames.errorMessage,
                id: `${this.settings.errorMessageIdPrefix}${id}`
            });

            if (element.dataset.errorContainer) {
                // If an element is specified as container for the error message, use this
                const errorContainer = element.form.querySelector(
                    element.dataset.errorContainer
                );
                errorContainer.innerHTML = "";
                errorContainer.appendChild(message);
            } else {
                // If the element is a radio button or checkbox, insert error after the label
                let label;
                if (element.type === "radio" || element.type === "checkbox") {
                    label =
                        element.form.querySelector(`label[for="${id}"]`) ||
                        element.parentNode;
                    if (label) {
                        label.parentNode.insertBefore(
                            message,
                            label.nextSibling
                        );
                    }
                }

                // Otherwise, insert it after the element
                if (!label) {
                    element.parentNode.insertBefore(
                        message,
                        element.nextSibling
                    );
                }
            }
        }

        // Save original ARIA role, if it exists
        if (element.hasAttribute("aria-describedby")) {
            element.setAttribute(
                "data-original-aria-describedby",
                element.getAttribute("aria-describedby")
            );
        }

        // Add ARIA role to the element
        element.setAttribute(
            "aria-describedby",
            `${this.settings.errorMessageIdPrefix}${id}`
        );

        // Update error message
        message.innerHTML = errorMessage;

        // Show error message
        message.style.display = "block";
        message.style.visibility = "visible";

        // Since the element has an error, we attach an keyup event to guide the user with positive inline validation
        // But first check if the element already has an event handler
        if (this.alreadyHasKeyupEvent !== element.name) {
            addEvent(elementGroup ? elementGroup : element, "keyup", e =>
                this.inlineValidation(e)
            );

            // save reference to element name to clean up events later
            this.alreadyHasKeyupEvent = element.name;
        }
    }

    /**
     * Hide an error message
     *
     * @private
     * @param {HTMLElement} field
     */
    hideError(field) {
        let element = field;

        // Don't validate submits, buttons and reset inputs, and disabled fields
        if (
            element.disabled ||
            element.type === "reset" ||
            element.type === "submit" ||
            element.type === "button"
        ) {
            return false;
        }

        // Remove error class from element
        removeClass(element, this.settings.classNames.invalidField);
        addClass(element, this.settings.classNames.validField);

        // Remove ARIA role from the element
        element.removeAttribute("aria-describedby");

        // Reset ARIA role to original value if it exists
        if (element.hasAttribute("data-original-aria-describedby")) {
            element.setAttribute(
                "aria-describedby",
                element.getAttribute("data-original-aria-describedby")
            );
            element.removeAttribute("data-original-aria-describedby");
        }

        // If the element is a radio button and part of a group, remove error from all and get the last item in the group
        if (element.type === "radio" && element.name) {
            const group = this.dom.form.querySelectorAll(
                `input[name=${element.name}]`
            );
            const len = group.length;

            if (len > 0) {
                forEach(group, item => {
                    // Only check elements in current form
                    if (item.form === element.form) {
                        removeClass(
                            item,
                            this.settings.classNames.invalidField
                        );
                        addClass(item, this.settings.classNames.validField);
                    }
                });

                element = group[len - 1];
            }
        }

        // Get element id or name
        const id = element.id || element.name;
        if (!id) {
            return;
        }

        // Check if an error message is in the DOM
        const message = document.getElementById(
            `${this.settings.errorMessageIdPrefix}${id}`
        );
        if (!message) {
            return;
        }

        // If so, hide it
        message.innerHTML = "";
        message.style.display = "none";
        message.style.visibility = "hidden";
    }

    /**
     * Save form field values in LocalStorage
     *
     * @private
     * @param {NodeList} fields
     * @returns {boolean}
     */
    storeData(fields) {
        //check if localStorage is available.
        if (typeof Storage !== "undefined") {
            this.dom.fields = fields;
            const data = {};

            forEach(fields, field => {
                if (
                    field.name &&
                    !field.disabled &&
                    field.type !== "file" &&
                    field.type !== "reset" &&
                    field.type !== "password" &&
                    field.type !== "submit"
                ) {
                    if (field.type === "checkbox") {
                        if (field.checked) {
                            data[field.name] = field.value || "";
                        }
                    } else if (field.type === "radio") {
                        const group = this.dom.form.querySelectorAll(
                            `input[name=${field.name}]`
                        );
                        const len = group.length;

                        if (len > 0) {
                            forEach(group, item => {
                                if (item.checked) {
                                    data[field.name] = item.value || "";
                                }
                            });
                        }
                    } else {
                        data[field.name] = field.value || "";
                    }
                }
            });

            const entry = {
                time: new Date().getTime(),
                data
            };

            //save data as JSON string.
            localStorage.setItem(this.localStorageId, JSON.stringify(entry));
            return true;
        }
        return false;
    }

    /**
     * Checks if form field values are already saved in LocalStorage
     *
     * @private
     */
    checkStorage() {
        if (typeof Storage !== "undefined") {
            // check if we have saved data in localStorage.
            const item = localStorage.getItem(this.localStorageId);
            const entry = item && JSON.parse(item);

            if (entry) {
                // discard submissions older than one day.
                const now = new Date().getTime();
                const day = 24 * 60 * 60 * 1000;
                if (now - day > entry.time) {
                    localStorage.removeItem(this.localStorageId);
                    return;
                }

                // We have valid form data, insert them into the form fields
                this.addStorageToFields(entry.data);
            }
        }
    }

    /**
     * Insert data from localStorage into form fields
     *
     * @private
     * @param {Object} data
     */
    addStorageToFields(data) {
        forEach(this.dom.fields, field => {
            // Don't validate file, reset, hidden, password, submit and disabled input fields
            if (
                field.name &&
                !field.disabled &&
                field.type !== "file" &&
                field.type !== "reset" &&
                field.type !== "hidden" &&
                field.type !== "password" &&
                field.type !== "submit"
            ) {
                forEach(data, (value, key) => {
                    // if key (name) from localStorage matches field name then insert value into field
                    if (key === field.name) {
                        if (field.type === "radio") {
                            if (field.value === value) {
                                field.checked = true;
                            }
                        } else if (field.type === "checkbox") {
                            if (field.value === value) {
                                field.checked = true;
                            }
                        } else {
                            field.value = value;
                        }
                    }
                });
            }
        });
    }

    /**
     * Generate a Hash from string
     *
     * @private
     * @param {String} str
     */
    hashCode(str) {
        // Got it from here https://stackoverflow.com/a/34842797
        return str
            .split("")
            .reduce(
                (prevHash, currVal) =>
                    ((prevHash << 5) - prevHash + currVal.charCodeAt(0)) | 0,
                0
            );
    }

    /**
     * Check field on blur and change.
     *
     * @private
     * @param {Event} event
     */
    checkField(event) {
        if (event.relatedTarget && event.relatedTarget.type === "submit") {
            // Ignore blur events caused by clicking a submit button
            return;
        }

        // Update form field values in localStorage
        if (this.settings.saveDataWhenOffline && this.localStorageId) {
            this.storeData(this.dom.fields);
        }

        // Validate the field
        const error = this.hasError(event.target);

        if (error) {
            this.showError(event.target, error);
            return;
        }

        // Otherwise, hide any existing error message
        this.hideError(event.target);
    }

    /**
     * Handle form submit.
     *
     * @private
     * @param {Event} event
     */
    submitForm(event) {
        // Lets not submit the form
        // We will control this from the outside with the callback function (onSubmit)
        event.preventDefault();

        // Get all of the form elements (except buttons)
        // Find elements on every submit since they might change dynamically
        this.dom.fields = this.dom.form.querySelectorAll(
            this.settings.elementsToValidate.join(",")
        );

        // Remove existing errors - values and properties might have changed dynamically
        forEach(this.dom.fields, field => {
            this.hideError(field);
        });

        // Fire the "before submit" callback if it exists
        if (typeof this.settings.beforeSubmit === "function") {
            this.settings.beforeSubmit(this.dom.fields);
        }

        // Validate each field
        // Store the first field with an error to a variable so we can bring it into focus later
        let hasErrors;
        forEach(this.dom.fields, field => {
            const error = this.hasError(field);
            if (error) {
                this.showError(field, error);
                if (!hasErrors) {
                    hasErrors = field;
                }
            }
        });

        // If there are errors, don't submit form and focus on first element with error
        // Else fire callback with all the fields
        if (hasErrors) {
            if (hasErrors.offsetWidth > 0 || hasErrors.offsetHeight > 0) {
                // Element is visible - focus on it
                hasErrors.focus();
            } else {
                // Element is not visible
                // If it has specified an error container (data-error-container="...")
                // find that and scroll to it - otherwise scroll to a parent element.

                let scrollToError = false;
                if (hasErrors.dataset.errorContainer) {
                    const errorContainer = this.dom.form.querySelector(
                        hasErrors.dataset.errorContainer
                    );
                    if (errorContainer) {
                        scrollToError = true;
                        void scrollTo(errorContainer, 0, window, -30);
                    }
                }

                if (!scrollToError) {
                    let searchingForVisibleParent = hasErrors.parentElement;

                    while (searchingForVisibleParent) {
                        if (
                            searchingForVisibleParent.offsetWidth > 0 ||
                            searchingForVisibleParent.offsetHeight > 0
                        ) {
                            void scrollTo(
                                searchingForVisibleParent,
                                0,
                                window,
                                -30
                            );
                            searchingForVisibleParent = false;
                        } else {
                            searchingForVisibleParent =
                                searchingForVisibleParent.parentElement;
                        }
                    }
                }
            }
        } else {
            if (typeof this.settings.onSubmit === "function") {
                if (!navigator.onLine && this.settings.saveDataWhenOffline) {
                    // If browser is offline and saveDataWhenOffline option is set
                    // Store data in localStorage...
                    this.storeData(this.dom.fields);

                    // and fire callback
                    if (typeof this.settings.whenOffline === "function") {
                        this.settings.whenOffline();
                    }
                } else {
                    //  Delete the localStorage...
                    if (typeof Storage !== "undefined") {
                        localStorage.removeItem(this.localStorageId);
                    }
                    // and submit the form
                    this.settings.onSubmit(this.dom.fields);
                }
            }
        }
    }

    /**
     * Initiate FormValidate
     *
     * @private
     * @param {HTMLFormElement|Node} formElement - The form element to validate
     */
    init(formElement) {
        // Cache the form element in the global dom object
        this.dom.form = formElement;

        // Disable native form validation
        this.dom.form.setAttribute("novalidate", true);

        // Set pattern on e-mail fields that are missing it
        forEach(
            this.dom.form.querySelectorAll("input[type=email]:not([pattern])"),
            emailField => {
                setInputPattern(emailField, emailRegex());
            }
        );

        // Set pattern on e-mail fields that are missing it
        forEach(
            this.dom.form.querySelectorAll(
                "input[type=password]:not([pattern])"
            ),
            passwordField => {
                setInputPattern(
                    passwordField,
                    passwordRegex(
                        typeof this.settings.password !== "undefined"
                            ? this.settings.password
                            : {}
                    )
                );
            }
        );

        // Check validity when the user leaves the field
        addEvent(
            this.dom.form,
            `change blur ${this.validationTrigger}`,
            event => this.checkField(event),
            true
        );

        addEvent(this.dom.form, "submit", event => this.submitForm(event));

        // If we are allowed
        // Generate Hash from form fields and use it as unique ID in localStorage
        // and chack if we already have data i localStorage
        if (this.settings.saveDataWhenOffline) {
            // Cache form fields
            this.dom.fields = this.dom.form.querySelectorAll(
                this.settings.elementsToValidate.join(",")
            );

            // Array to hold the form field names
            const formFieldsArray = [];

            // Push form field names to the array
            forEach(this.dom.fields, field => formFieldsArray.push(field.name));

            // Combine form ID/Name and array to a string
            const formFieldsString = `${this.dom.form.id ||
                this.dom.form.attributes.name.value}${formFieldsArray.join(
                ""
            )}`;

            // Generate unique ID using hashcode of string
            this.localStorageId = this.hashCode(formFieldsString);

            // Check if we already have data in LocalStorage
            this.checkStorage();
        }
    }

    /**
     * Remove event listeners and clean up.
     * Use this when dynamically removing the form.
     */
    destroy() {
        removeEvent(
            this.dom.form,
            `submit change blur ${this.validationTrigger}`
        );

        forEach(
            this.dom.form.querySelectorAll(
                this.settings.elementsToValidate.join(",")
            ),
            field => removeEvent(field, "keyup")
        );

        this.dom = null;
    }
}
