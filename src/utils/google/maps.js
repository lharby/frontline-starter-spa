/**
 * Google Maps helpers
 *
 * This file contains a lot of helper functions for dealing with Google Maps. The most important
 * are `setAPIKey()` and `loadMapsAPI()`, but the geocoding functionality might be of interest to you.
 *
 *
 * @author Anders Gissel <anders.gissel@akqa.com>
 * @author Jimmi Nielsen <jimmi.nielsen@akqa.com>
 * @module utils/google/maps
 */

/**
 * Geographical restrictions for the geocoder.
 *
 * @typedef {object} GoogleGeocoderComponentRestrictionObject
 * @since 3.7.0
 * @property {string} [route] - Matches long or short name of a route.
 * @property {string} [locality] - Matches against locality and sublocality types.
 * @property {string} [administrativeArea] - Matches all the levels of administrative area.
 * @property {string} [postalCode] - Matches postal codes and postal code prefixes.
 * @property {string} [country] - Matches a country name or a [two letter ISO 3166-1 country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2#Officially_assigned_code_elements). Note: The API follows the ISO standard for defining countries, and the filtering works best when using the corresponding ISO code of the country.
 */

/**
 * A flat object containing GPS-coordinates expressed as latitude and longitude.
 *
 * @typedef {object} GoogleGeocoderLatLngLiteral
 * @since 3.7.0
 * @property {number} lat - The latitude as a floating point number
 * @property {number} lng - The longitude as a floating point number
 */

/**
 * An object created by `new google.maps.LatLng(xx, xx)`, containing GPS-coordinates.
 *
 * @typedef {object} GoogleGeocoderLatLng
 * @since 3.7.0
 * @property {function} lat - The latitude
 * @property {function} lng - The longitude
 */

/**
 * An address component, such as a city or street name.
 *
 * @typedef {object} GoogleGeocoderAddressComponent
 * @since 3.7.0
 * @property {string} long_name - Address part in long-form, such as "Denmark"
 * @property {string} short_name - Address part in short-form, such as "DK"
 * @property {string[]} types - Array of the types this part matches, such as `["country", "political"]` or `["postal_code"]`.
 */

/**
 * Geometry/location information for a given geographical point.
 *
 * @typedef {object} GoogleGeocoderGeometry
 * @since 3.7.0
 * @property {GoogleGeocoderLatLng} location - A location object containing the GPS coordinates
 * @property {string} location_type - Type of this point.
 * @property {object} viewport
 */

/**
 * The data tied to a geographical point, as returned directly from teh Googles.
 *
 * @typedef {object} GoogleGeocoderResult
 * @since 3.7.0
 * @property {GoogleGeocoderAddressComponent[]} address_components - All the parts making up the current address.
 * @property {string} formatted_address - Human-readable address.
 * @property {GoogleGeocoderGeometry} geometry - Detailed coordinates and other geographical information about the point.
 * @property {string} place_id - Place-ID of the current point.
 * @property {object} plus_code - GooglePlus-data for the current point.
 * @property {string[]} types - Array of strings detailing what kind of point this is.
 */

/**
 * A slightly manipulated data object returned by our address-to-coordinates shorthand function.
 *
 * @typedef {object} AddressLookupResult
 * @since 3.7.0
 * @property {number} lat - The latitude of the address
 * @property {number} lng - The longitude of the address
 * @property {GoogleGeocoderResult} result - The actual data that came back from the geocoder.
 */

import { createElement } from "../dom/createElement";

/**
 * Placeholder for the API loader promise.
 *
 * @ignore
 * @type {Promise}
 */
let apiLoaderPromise;

/**
 * Placeholder for the API key.
 *
 * @ignore
 * @type {string}
 */
let googleAPIKey = "";

/**
 * Placeholder for the libraries to load.
 *
 * @ignore
 * @type {string}
 */
let mapLibrariesToLoad = "";

/**
 * Placeholder for the Geocoder.
 *
 * @ignore
 */
let geocoderInstance;

/**
 * Set the API-key to use for the Google API. This must be done before the first load of the API, so include this early in your code!
 *
 * @since 3.7.0
 * @param {string} key - The API-key to use.
 *
 * @example <caption>Basic usage:</caption>
 * import { setAPIKey, loadMapsAPI } from "./utils/google/maps";
 *
 * setAPIKey("your-very-long-map-api-key-here");
 *
 * loadMapsAPI().then( ... );
 */
export function setAPIKey(key) {
    googleAPIKey = typeof key === "string" ? key : googleAPIKey;
}

/**
 * Set the [API libraries](https://developers.google.com/maps/documentation/javascript/libraries) to load together with the Maps API. Like the API-key, this must be done before the first load of the API, so include this early in your code.
 *
 * @since 3.7.0
 * @param {string|string[]} libraries
 *
 * @example <caption>Basic usage:</caption>
 * import { setAPILibrariesToLoad, loadMapsAPI } from "./utils/google/maps";
 *
 * setAPILibrariesToLoad("places,geometry");
 *
 * loadMapsAPI().then( ... );
 */
export function setAPILibrariesToLoad(libraries) {
    mapLibrariesToLoad = Array.isArray(libraries)
        ? libraries.join(",")
        : typeof libraries === "string"
        ? libraries
        : mapLibrariesToLoad;
}

/**
 * Add the Google API to the page and return a promise that resolves once the API is ready. Since the promise is reused, repeated calls are fine.
 *
 * @since 3.7.0
 * @returns {Promise<google.maps>} A promise that resolves once the API is ready. The resolve-value will be the Google Maps object, in case you want to use it like that.
 *
 * @example <caption>Basic usage:</caption>
 * import { loadMapsAPI } from "./utils/google/maps";
 *
 * let mapInstance;
 * loadMapsAPI().then(() => {
 *     mapInstance = new google.maps.Map(
 *         document.getElementById("mapContainer"),
 *
 *         // See implementation guide here:
 *         // https://developers.google.com/maps/documentation/javascript/tutorial#MapOptions
 *         // ... or see all options here:
 *         // https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions
 *         {
 *             center: { lat: 55.6773705, lng: 12.5614183 },
 *             zoom: 10,
 *         }
 *     );
 * });
 *
 * @example <caption>Setting the API-key first, loading the API, and then using the resolve-value to instantiate the map:</caption>
 * import { setAPIKey, loadMapsAPI } from "./utils/google/maps";
 *
 * setAPIKey("look-at-my-key---my-key-is-amazing");
 *
 * let mapInstance;
 * loadMapsAPI().then(mapObject => {
 *     mapInstance = new mapObject.Map(
 *         document.getElementById("mapContainer"),
 *
 *         // See implementation guide here:
 *         // https://developers.google.com/maps/documentation/javascript/tutorial#MapOptions
 *         // ... or see all options here:
 *         // https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions
 *         {
 *             center: { lat: 55.6773705, lng: 12.5614183 },
 *             zoom: 10,
 *         }
 *     );
 * });
 *
 */
export function loadMapsAPI() {
    if (!googleAPIKey) {
        throw new Error(
            "Google API Key hasn't been set. You need to set it using setAPIKey() before actually loading the API."
        );
    }

    if (!apiLoaderPromise) {
        apiLoaderPromise = new Promise(apiIsReady => {
            // Set up a listener for when the map API is ready for us.
            window.akqaUtilsGoogleMapsOnReady = () =>
                apiIsReady(window.google.maps);

            // Append the API script tag to the page.
            const scriptTag = createElement("script", {
                src: `https://maps.googleapis.com/maps/api/js?key=${googleAPIKey}${
                    mapLibrariesToLoad ? `&libraries=${mapLibrariesToLoad}` : ""
                }&callback=akqaUtilsGoogleMapsOnReady`,
                async: true,
                defer: true
            });

            document.body.appendChild(scriptTag);
        });
    }

    return apiLoaderPromise;
}

/**
 * Geocoding is the process of converting one or more addresses to geographic coordinates, which you can use to place markers or position the map.
 * Reverse geocoding is the process of converting geographic coordinates into a human-readable address.
 *
 * This function does both.
 *
 * You *must* supply only one of following: `address`, `location` or `placeId`. If this is too much work, and you need a simpler usecase,
 * use `getLocationFromAddress()`, `getAddressFromLocation()` and `getAddressFromPlaceId()`.
 *
 * @see [getLocationFromAddress()](#.getLocationFromAddress)
 * @see [getAddressFromLocation()](#.getAddressFromLocation)
 * @see [getAddressFromPlaceId()](#.getAddressFromPlaceId)
 *
 * @since 3.7.0
 * @param {object} encoderOptions - Options to narrow down result.
 * @param {string} [encoderOptions.address] - The address which you want to geocode.
 * @param {GoogleGeocoderLatLngLiteral|GoogleGeocoderLatLng} [encoderOptions.location] - The LatLng (or LatLngLiteral) for which you wish to obtain the closest, human-readable address. The geocoder performs a reverse geocode.
 * @param {string} [encoderOptions.placeId] - The place ID of the place for which you wish to obtain the closest, human-readable address.
 * @param {LatLngBounds|object} [encoderOptions.LatLngBounds] - To bias geocode results more prominently. The bounds parameter will only influence, not fully restrict, results from the geocoder.
 * @param {string} [encoderOptions.region] -  The region code, specified as a IANA language region subtag. In most cases, these tags map directly to familiar ccTLD ("top-level domain") two-character values. The region parameter will only influence, not fully restrict, results from the geocoder.
 * @param {GoogleGeocoderComponentRestrictionObject} [encoderOptions.componentRestrictions] -  Used to restrict results to a specific area. The geocoder returns only the results that match all the component filters
 * @param {object} [returnOptions]
 * @param {boolean} [returnOptions.getMultipleResults=false] - Set to `true` to get all the results from the geo coder, and not just the first one.
 * @returns {Promise<GoogleGeocoderResult|GoogleGeocoderResult[]>} Geocoding Results
 *
 * @example <caption>Basic usage:</caption>
 * import { geocodeLookup } from "./utils/google/maps";
 *
 * geocodeLookup({
 *     address: "Staunings plads 3, 1607 København V.",
 *     componentRestrictions: {
 *         country: "dk",
 *     },
 * }).then(result =>
 *     window.console.log("Results for Staunings plads 3:", result)
 * );
 */
export function geocodeLookup(encoderOptions, returnOptions = {}) {
    return loadMapsAPI().then(
        mapsAPI =>
            new Promise((resolve, reject) => {
                if (!geocoderInstance) {
                    geocoderInstance = new mapsAPI.Geocoder();
                }

                geocoderInstance.geocode(encoderOptions, (results, status) => {
                    if (status === "OK") {
                        resolve(
                            returnOptions.getMultipleResults
                                ? results
                                : results[0]
                        );
                    } else {
                        reject(status);
                    }
                });
            })
    );
}

/**
 * Get the location for a specific address. Will return the latitude and longitude directly, as well as the complete result object from the geocoder.
 *
 * @since 3.7.0
 * @param {string} address - The address to look up.
 * @param {GoogleGeocoderComponentRestrictionObject} [componentRestrictions={}] - Optional restrictions for the encoder.
 * @returns {Promise<AddressLookupResult>} A promise that resolves with an [AddressLookupResult](#~AddressLookupResult) once the geocoder is done.
 *
 * @example <caption>Basic usage:</caption>
 * import { getLocationFromAddress } from "./utils/google/maps";
 *
 * getLocationFromAddress("Staunings Plads 3, 1607 København V.")
 *     .then(location => window.console.log(`That place is located at: ${location.lat}, ${location.lng}.`));
 *
 *
 * @example <caption>Usage with user-input, expecting an address in Denmark:</caption>
 * import { getLocationFromAddress } from "./utils/google/maps";
 *
 * const address = "Staunings Plads 3, 1607";
 * getLocationFromAddress(address, { country: "DK" })
 *     .then(location => window.console.log(`${location.result.formatted_address} is located at: ${location.lat}, ${location.lng}.`))
 *     .catch(() => window.console.log("Address could not be resolved."));
 *
 */
export function getLocationFromAddress(address, componentRestrictions = {}) {
    return geocodeLookup({ address, componentRestrictions }).then(result => ({
        lat: result.geometry.location.lat(),
        lng: result.geometry.location.lng(),
        result
    }));
}

/**
 * Resolve the address and any other information from the given GPS-coordinates.
 *
 * @since 3.7.0
 * @param {GoogleGeocoderLatLngLiteral|GoogleGeocoderLatLng} location - The location you want to look up.
 * @param {boolean} [returnFirstOnly=true] - Set this to `false` to return the entire array of results from the geocoder. Normally, leaving this on `true` will be what you want, but if you want all the entries for the given coordinates, do that other thing I said.
 * @returns {Promise<GoogleGeocoderResult|GoogleGeocoderResult[]>} A promise that resolves with the data from the geocoder once it comes back. If you've set `returnFirstOnly` to false, the data will be an array of [GoogleGeocoderResults](#~GoogleGeocoderResult); otherwise it'll just be a single [GoogleGeocoderResult](#~GoogleGeocoderResult)
 *
 * @example <caption>Basic usage:</caption>
 * import { getAddressFromLocation } from "./utils/google/maps";
 *
 * getAddressFromLocation({ lat: 55.6787588, lng: 12.563771699999961})
 *     .then(location => window.console.log(`That place is called ${location.formatted_address}.`))
 *     .catch(() => window.console.log("There doesn't seem to be anything at those coordinates."));
 *
 *
 * @example <caption>Getting all the addresses for the given coordinates:</caption>
 * import { getAddressFromLocation } from "./utils/google/maps";
 *
 * getAddressFromLocation({ lat: 55.6787588, lng: 12.563771699999961}, false)
 *     .then(addresses => window.console.log(
 *         "These are the addresses tied to that location:",
 *         addresses.map(address => address.formatted_address)
 *     ))
 *     .catch(() => window.console.log("There doesn't seem to be anything at those coordinates."));
 *
 */
export function getAddressFromLocation(location, returnFirstOnly = true) {
    return geocodeLookup(
        { location },
        { getMultipleResults: !returnFirstOnly }
    );
}

/**
 * Resolve the address and any other information from the given place-ID.
 *
 * @since 3.7.0
 * @param {string} placeId - The placeId you want to get the information for.
 * @returns {Promise<GoogleGeocoderResult>} A promise that resolves with the [GoogleGeocoderResult](#~GoogleGeocoderResult) from the geocoder once it comes back.
 *
 * @example <caption>Basic usage:</caption>
 * import { getAddressFromPlaceId } from "./utils/google/maps";
 *
 * getAddressFromPlaceId("ChIJk9Y8wQ5TUkYRDHyKW8g26pk")
 *     .then(location => window.console.log(`That place (${location.place_id}) is at ${location.formatted_address}.`))
 *     .catch(() => window.console.log("That place-ID doesn't seem to exist."));
 */
export function getAddressFromPlaceId(placeId) {
    return geocodeLookup({ placeId });
}
