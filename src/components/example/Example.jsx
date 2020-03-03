import React from "react";
import PropTypes from "prop-types";
import cn from "classnames";

import ExampleStyles from "./Example.module.scss";

const object = {};

const Example = ({ color = "primary" }) => (
    <div
        className={cn({
            [ExampleStyles["example"]]: true,
            [ExampleStyles["example--primary"]]: color === "primary",
            [ExampleStyles["example--secondary"]]: color === "secondary"
        })}
    >
        This is the Example Component
        {/* @akqa-frontline/js-config-webpack-plugin supports optional chaining */}
        {/* if this compiles then Storybook is using _our_ JS webpack configuration */}
        {object?.foo?.bar}
    </div>
);

Example.propTypes = {
    color: PropTypes.oneOf(["primary", "secondary"])
};

export default Example;
