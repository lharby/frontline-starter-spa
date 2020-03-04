import { hot } from "react-hot-loader/root";
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

const Example = ({ message = "World!" }) => {
    const [counter, setCounter] = useState(0);

    const [propUpdates, setPropUpdates] = useState(0);

    useEffect(() => {
        const sideEffect = () => setPropUpdates(p => (p += 1));

        sideEffect();
    }, [message]);

    return (
        <div>
            <p>
                Try incrementing the count, or change the message from the
                parent <code>&lt;App/&gt;</code> component.
            </p>
            <p>
                Then try modifying the code in your editor and saving. You
                should see your code updates in the browser - but the state
                (count or message) should not change.
            </p>
            <p>Thats HMR!</p>
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

export default hot(Example);
