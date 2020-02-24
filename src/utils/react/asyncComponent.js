/**
 * A brilliant little lazy-loader component for React. Based on the work of
 * Yomi Eluwande, and then refactored and updated slightly for our use.
 *
 * @author Yomi Eluwande (@yomieluwande)
 * @author Anders Gissel <anders.gissel@akqa.com>
 * @module utils/react/asyncComponent
 * @see https://scotch.io/tutorials/lazy-loading-routes-in-react
 *
 *
 * @example <caption>Basic usage:</caption>
 * // put-your-component-in-here.js
 * // This file should NOT be added to the config as an entry-point. Webpack will figure it out.
 * class MyComponent extends React.Component { ... };
 * export default MyComponent;
 *
 *
 * // Setting up the import of your component through asyncComponent. The file path should be relative
 * // from where this exact code is located.
 * import asyncComponent from "./utils/react/asyncComponent";
 * const SomeOtherComponent = asyncComponent(() => import("./put-your-component-in-here").then(module => module.default));
 *
 *
 * // And then, inside your router, or wherever you want:
 * <SomeOtherComponent your="properties" here={true} />
 *
 * // Your component will be now automatically loaded during the render of your route (or wherever you've put it),
 * // and then injected once complete.
 *
 *
 * @example <caption>Simulating a longer load-time, to see the "loading"-message:</caption>
 * import asyncComponent from "./utils/react/asyncComponent";
 * const SomeComponent = asyncComponent(
 *     () => import("./put-your-component-in-here")
 *         .then(module => new Promise(ok => window.setTimeout(() => ok(module.default), 3000))
 *     )
 * );
 *
 */

import React, { Component } from "react";

export default function asyncComponent(getComponent) {
    class AsyncComponent extends Component {
        static Component = null;
        state = {
            Component: AsyncComponent.Component,
            error: false
        };

        constructor(props) {
            super(props);

            if (!this.state.Component) {
                getComponent()
                    .then(Component => {
                        AsyncComponent.Component = Component;
                        this.setState({ Component });
                    })
                    .catch(error => this.setState({ error }));
            }
        }

        render() {
            const { Component } = this.state;
            if (Component) {
                return <Component {...this.props} />;
            }
            return this.state.error ? (
                <aside>
                    Could not load component!
                    <br />
                    <small>{this.state.error.toString()}</small>
                </aside>
            ) : (
                <div>Loading component...</div>
            );
        }
    }

    return AsyncComponent;
}
