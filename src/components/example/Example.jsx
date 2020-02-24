import React from "react";
import PropTypes from "prop-types";
import cn from "classnames";

import ExampleStyles from "./Example.module.scss";

const Example = ({ message = "World!", highlightMessage }) => (
    <p className={cn([ExampleStyles.example])}>
        Hello&nbsp;
        <span
            className={cn([ExampleStyles.example__message], {
                [ExampleStyles["example__message--highlight"]]: highlightMessage
            })}
        >
            {message}
        </span>
    </p>
);

Example.propTypes = {
    message: PropTypes.string,
    highlightMessage: PropTypes.bool
};

export default Example;
