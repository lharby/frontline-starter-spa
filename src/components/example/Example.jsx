// import { hot } from "react-hot-loader/root";
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

const Example = ({ message = "World!" }) => {
    const [counter, setCounter] = useState(0);

    const [propUpdates, setPropUpdates] = useState(0);

    // useEffect(() => {
    // const sideEffect = () => setPropUpdates(p => (p += 1));
    //
    // sideEffect();
    // }, [message]);

    return (
        <div>
            <div>
                <p>Count: {counter}</p>
                <button onClick={() => setCounter(c => (c += 1))}> + </button>
            </div>
            <div>
                <p>
                    <code>message</code> prop updated {propUpdates} times
                </p>
            </div>
            <div>
                <p>Hello {message}</p>
            </div>
        </div>
    );
};

Example.propTypes = {
    message: PropTypes.string
};

export default Example;
