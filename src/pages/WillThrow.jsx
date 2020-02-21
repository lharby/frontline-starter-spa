import React, {useEffect, useState} from "react";
import ErrorBoundary from "../components/ErrorBoundary";

const WillThrowComponent  = () => {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (hasError === true) {
            throw new Error('WillThrow Component Crashed!');
        }
    }, [hasError]);

    return (
        <div>
            <h4>WillThrowComponent Component</h4>
            <p><small>
                If an <code>Error</code> in this <code>&lt;WillThrowComponent/&gt;</code> component,
                the broken code will be contained to the <code>&lt;ErrorBoundary/&gt;</code> wrapping this <code>&lt;WillThrowComponent/&gt; component</code>.
                <br/>
            </small></p>
            <p><small>
                Notice how you can keep interacting with the counter in the <code>&lt;WillThrowPage/&gt;</code> component, even though an error was thrown and a piece of the app "crashed".
            </small></p>
            <button onClick={() => setHasError(true)}><small>throw <code>Error</code> in <code>&lt;WillThrowComponent/&gt;</code></small></button>
        </div>
    )
}

const WillThrowPage = () => {
    const [hasError, setHasError] = useState(false);

    const [counter, setCounter] = useState(0);

    useEffect(() => {
        if (hasError === true) {
            throw new Error('WillThrow Component Crashed!');
        }
    }, [hasError]);

    return (
        <div>
            <h2>WillThrowPage Component</h2>
            <p>
                If an <code>Error</code> is thrown in this <code>&lt;WillThrowPage/&gt;</code> component, the broken code will be contained to the <code>&lt;ErrorBoundary/&gt;</code> wrapping the <code>&lt;Route/&gt;</code> components.
                See <code>App.jsx</code> for the <code>&lt;ErrorBoundary/&gt;</code>.
            </p>
            <p>
                Notice how you can continue navigating the app, even though an error was thrown and a piece of the app "crashed".
            </p>
            <div>
                <pre>Counter: {counter}</pre>
                <button onClick={() => setCounter(c => c += 1)}>Increment Count</button>
                <br/>
                <br/>
            </div>
            <button onClick={() => setHasError(true)}><small>throw <code>Error</code> in <code>&lt;App/&gt;</code></small></button>
            <ErrorBoundary>
                <WillThrowComponent/>
            </ErrorBoundary>
        </div>
    );
};

export default WillThrowPage;
