// when using HMR features, react-hot-loader must be imported before react itself because it augments some features of React
// import { hot } from "react-hot-loader/root";
import React, { useState, Suspense } from "react";
import { lazy } from "@loadable/component";
import ErrorBoundary from "./components/ErrorBoundary";

// lazy load the example component, lazy loaded components needs their export wrapped in hot()
const LazyExample = lazy(() => import("./components/example/Example"), {
    cacheKey: k => {
        console.warn("Kenned", k);
        return "Example";
    }
});

const App = () => {
    const [message, setMessage] = useState("HMR");

    return (
        <div>
            <h1>React Application Works!</h1>
            <ErrorBoundary>
                <Suspense fallback="loading...">
                    <LazyExample message={message} />
                </Suspense>
            </ErrorBoundary>
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
export default App;
