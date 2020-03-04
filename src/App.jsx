// when using HMR features, react-hot-loader must be imported before react itself because it augments some features of React
import { hot } from "react-hot-loader/root";
import React, { useState } from "react";

// the Example component default-exports itself also wrapped in the hot() augment function - you need to do this for any component you want to be HMR enabled
import Example from "./components/example/Example";

const App = () => {
    const [message, setMessage] = useState("HMR");

    return (
        <div>
            <h1>React Application Works!</h1>
            <Example message={message} />
            <label>
                <input
                    type="text"
                    onChange={e => setMessage(e.target.value)}
                    value={message}
                />
                &nbsp; Message
            </label>
        </div>
    );
};

// export the app wrapped in the hot method
export default hot(App);
