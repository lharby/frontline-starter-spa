/**
 * React bootstrapper
 *
 *
 * The React bootstrapper is used to instantiate React Elements with support for both bundled and code splitted React Modules.
 * It is primarily designed to allow us to use "dumb" React Elements in a CMS-like setup.
 *
 * Each React Element will be isolated and can only share state with children if the children is rendered in the actual React root Element.
 * Props can be passed to a React Element by using the special `<script type="text/props">` tag with some JSON inside it. Since props are parsed from JSON it is possible to use the PropTypes library and validation.
 * Descendants of a to-be-bootstrapped React Element will be detected and passed along as children, unless the descendant itself is a to-be-bootstrapped React Element - in which case a new tree is started.
 *
 * @module utils/react/reactBootstrapper
 * @since 3.8.0
 * @author Dennis Haulund Nielsen <dennis.nielsen@akqa.com>
 *
 * @example
 * <caption>
 * Markup:
 * </caption>
 * {@lang html}
 * <div data-react-element="Text">
 *     <script type="text/props">
 *         {"message": "Hello World, I was bundled!"}
 *     </script>
 *
 *     <div data-react-element="LazyText">
 *         <script type="text/props">
 *             {"message": "Hello World, I was code splitted!"}
 *          </script>
 *
 *          <p>Loading!</p>
 *     </div>
 * </div>
 *
 * @example
 * <caption>
 * JavaScript:
 * </caption>
 * {@lang js}
 * import reactBootstrapper from "./utils/react/reactBootstrapper";
 *
 * // lazy load
 * const LazyText = import("./modules/text");
 *
 * // eager load
 * import Text from "./modules/text";
 *
 * reactBootstrapper({
 *     LazyText,
 *     Text,
 * });
 */

import React from "react";
import ReactDOM from "react-dom";
import { forEach } from "../forEach";

// List of "nodes" which cant contain textContent
const VOID_ELEMENTS = [
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "keygen",
    "link",
    "meta",
    "menuitem",
    "param",
    "source",
    "track",
    "wbr"
];

const REACT_ELEMENT_IDENTIFIER = "data-react-element";
const REACT_PROPS_SCRIPT_IDENTIFIER = `type="text/props"`;

/**
 * Returns a React module or a string to be used in React.createElement
 *
 * @since 3.8.0
 * @param {HTMLElement|Element} node
 * @param {object} targetList - Map of imported React modules
 * @returns {Promise} Promise that resolves to a string or module
 *
 * @ignore
 */
function getElement(node, targetList) {
    if (node.hasAttribute(REACT_ELEMENT_IDENTIFIER)) {
        // Dont crash if a constructor is missing for a specific `data-react-element` declaration
        if (!targetList[node.getAttribute(REACT_ELEMENT_IDENTIFIER)]) {
            return Promise.reject(
                `No ConstructorReference for ${node.getAttribute(
                    REACT_ELEMENT_IDENTIFIER
                )} found - make sure to import it and pass it to the reactBootstrapper`
            );
        }

        // Creating React Elements is async in our case - as we want to support dynamic imports / code splitting
        // If at any point while working with constructor functions we _dont_ return promises - the chain will break and
        // we will not know whether or not we actually did create a React Element, and in turn we wont be able to render the React Element
        // if we _only_ supported non-dynamic imports then we would not need any Promises.

        // Return the constructor for the specific `data-react-element` - if it's a dynamic import return the default export
        // regardless if the constructor is dynamically imported or not - we can blindly return our constructor in a Promise as to not break the Promise chain further in the process
        return Promise.resolve(
            targetList[node.getAttribute(REACT_ELEMENT_IDENTIFIER)]
        ).then(element => (element.default ? element.default : element));
    } else {
        // Its not a `data-react-element` - so lets return the node name to be used in `React.createElement`
        return Promise.resolve(node.nodeName.toLowerCase());
    }
}

/**
 * Sanitizes common DOM element attributes into a props object - any immediate descending `<script type="text/props">` will be parsed from JSON and added to the props
 *
 * @since 3.8.0
 * @param {HTMLElement|Element} node
 * @param {string} reactKey - Value to be used for the special key prop
 * @returns {{key: *}}
 *
 * @ignore
 */
function prepareProps(node, reactKey) {
    // We always provide the `props.key` - this allows us to create react elements from normal DOM nodes - without this React will cry because of non-unique siblings / children
    const props = {
        key: reactKey
    };

    const script = node.querySelector(
        `script[${REACT_PROPS_SCRIPT_IDENTIFIER}]`
    );

    // Pass along the className attribute if present
    if (node.className) {
        props.className = node.className;
    }

    // Make it possible to have a child <script type="text/props"> tag whose content (JSON) is mapped into props
    if (script && script.textContent) {
        try {
            const _props = JSON.parse(script.textContent);
            Object.keys(_props).forEach(k => (props[k] = _props[k]));
        } catch (error) {
            throw error;
        }
    }

    forEach(node.attributes, ({ name, value }) => {
        switch (name) {
            case "class":
            case "style":
            case "data-react-element":
                // we dont want to pass these attributes as props
                break;
            case "checked":
            case "selected":
            case "disabled":
            case "autoplay":
            case "controls":
                props[name] = name;
                break;
            default:
                props[name] = value;
        }

        return null;
    });

    return props;
}

/**
 * Recursively builds an array of React Elements which is to be passed as children to a parent React Element
 *
 * @since 3.8.0
 * @param {NodeList} childNodeList
 * @param {object} targetList
 * @param {number} level
 * @returns {Promise} Promise that resolves to an array of React Elements
 *
 * @ignore
 */
function prepareChildren(childNodeList, targetList, level) {
    const children = [];

    forEach(childNodeList, (node, index) => {
        children.push(prepareNode(node, targetList, level + 1, index));
    });

    if (!children.length) {
        return Promise.resolve(null);
    }

    // Wait for all dynamic or static imports to be resolved
    return Promise.all(children);
}

/**
 * Depending on Node type - prepare React elements, or pass along text-content
 *
 * @since 3.8.0
 * @param {HTMLElement|Element} node
 * @param {object} targetList - Map of imported React modules
 * @param {number} level
 * @param {number} index
 * @returns {Promise} Promise that resolves to a React Element
 *
 * @ignore
 */
function prepareNode(node, targetList, level = 0, index = 0) {
    if (!node) {
        return null;
    }

    const key = `${level}-${index}`; // unique props.key - based on our traversal depth / sibling count

    // Lets see what type of node we are working with - we can only create react elements from DOM nodes, textContent nodes are "children" of React Elements
    switch (node.nodeType) {
        case 1: {
            // regular DOM node

            let children;

            // It's always nice to have an idea of what goes on in a chain of Promises!
            // To visualize what is happening async take a look at this structure (no need to explain how we get the props as this is a sync method):
            // <div id="renderMe" data-react-element="Foo">
            //     <script type="text/props">...</script>
            //     <div>
            //          <p>Foo Bar</p>
            //      </div>
            // </div>
            //
            // 1. Create a React Element of <p> and pass node.nodeValue as a child:
            //      const pReactElement = React.createElement('p', ...props, 'Foo Bar');
            // 2. Promise.then create a React Element of <div> and pass pReactElement as a child:
            //      const divReactElement = React.createElement('div', ...props, [pReactElement]);
            // 3. Promise.then create a React Element of Foo, and pass divReactElement (which has pReactElement as child) as a child:
            //      const fooReactElement = React.createElement(Foo, ...props, [divReactElement[pReactElement]]);
            // 4. Promise.then render the fooReactElement in place of the <div data-react-element="Foo">:
            //      ReactDOM.render(fooReactElement, document.getElementById('renderMe'));

            // Traverse the children of a given node and create React Elements - these are then passed along as the `children` argument of `React.createElement`
            // We have to do it in "reverse" (not starting with the root node) as `children` must be React Elements
            return prepareChildren(node.childNodes, targetList, level)
                .then(_children => {
                    children = _children;

                    // Resolve the constructor function, or node name
                    // Can be a dynamic imported constructor:
                    // const Foo = import('Foo').then(module => module.default);
                    // Or a static imported constructor:
                    // import Foo from 'Foo';
                    // Or a string:
                    // 'div'
                    return getElement(node, targetList);
                })
                .then(
                    _element =>
                        Promise.resolve(
                            // Yay we are ready! Given a constructor function (or node name),
                            // a set of props derived from the node attributes and `<script type="text/props">`,
                            // and an tree of child React Elements / text nodes we can create a React Element which we can pass to the `ReactDOM.render` method!
                            React.createElement(
                                _element,
                                prepareProps(node, key),
                                children
                            )
                        ),
                    window.console.error // Uncaught Promise rejection - no thanks!
                );
        }
        case 3: {
            // text node
            const nodeText = node.nodeValue.toString();

            // Some DOM nodes should not be able to have text content - but this is up to the browsers
            // - in any case, lets make sure that even if the user writes invalid markup,
            // we wont try to pass such an invalid node as a children prop of a React Element
            if (!node.parentNode) {
                return Promise.resolve(nodeText);
            }

            const parentNodeName = node.parentNode.nodeName.toLowerCase(); // eslint-disable-line

            if (VOID_ELEMENTS.indexOf(parentNodeName) !== -1) {
                if (/\S/.test(nodeText)) {
                    window.console.warn(
                        `a textnode is not allowed inside '${parentNodeName}'. your text "${nodeText}" will be ignored`
                    );
                }
                return null;
            }

            return Promise.resolve(nodeText);
        }
        case 8: {
            // html-comment
            // dont try to create anything from comments
            return null;
        }
        default: {
            // dont try to create anything from custom elements and other future / past browser weirdness dom node types
            return null;
        }
    }
}

/**
 * Recursively render React modules into the DOM starting from rootNode
 *
 * @since 3.8.0
 * @param {object} targetList - Map of imported React modules
 * @param {Document|Element} [rootNode=document] - Starting point to look for elements that should be "upgraded" to React Components
 */
export function reactBootstrapper(targetList, rootNode = document) {
    const nodesToBootstrap = rootNode.querySelectorAll(
        `[${REACT_ELEMENT_IDENTIFIER}]`
    );

    // Traverse all [data-react-element]'s and render a React Element in it's place
    forEach(nodesToBootstrap, nodeToBootstrap =>
        prepareNode(nodeToBootstrap, targetList).then(preparedReactElement => {
            ReactDOM.render(preparedReactElement, nodeToBootstrap);
        })
    );
}
