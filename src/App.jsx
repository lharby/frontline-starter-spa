import React, { Suspense } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { lazy } from "@loadable/component";
import pMinDelay from "p-min-delay";

import IndexPage from "./pages/Index";
import WillThrow from "./pages/WillThrow";

import Navigation from "./components/Navigation";
import Loading from "./components/Loading";
import ErrorBoundary from "./components/ErrorBoundary";

const LazyMinDelayPage = lazy(() =>
    pMinDelay(
        import(/* webpackChunkName: "LazyPage" */ "./pages/LazyPage"),
        200
    )
);

const LazyNoDelayPage = lazy(() =>
    pMinDelay(import(/* webpackChunkName: "LazyPage" */ "./pages/LazyPage"), 30)
);

const App = () => (
    <Router>
        <div style={{ padding: "0 1rem" }}>
            <h1>App Component</h1>

            <Navigation />

            <p>
                When you navigate to the lazy-loaded{" "}
                <code>&lt;LazyNoDelayPage/&gt;</code>, you will see a spinner
                for a very short time (30ms).
                <br />
                Sometimes this has a negative impact on UX because the loading
                indicator was shown so briefly that the user did not get to see
                what was just attempted to be rendered.
                <br />
                To counter this, you can set a delay to ensure that the the
                loading indicator is at least shown for some time.
                <br />
                Try navigating to the non-delayed lazy route, notice you barely
                (if at all get to see the spinner), then try navigating to the
                delayed lazy route.
                <br />
                <br />
                <em>
                    You will need to reload the page after navigating to each
                    lazy route, as the resolved component has been cached at
                    that point.
                </em>
            </p>

            <div style={{ border: "1px solid black", padding: "1rem" }}>
                <ErrorBoundary clearErrorOnNavigate>
                    <Suspense fallback={<Loading />}>
                        <Switch>
                            <Route path="/error-boundary">
                                <WillThrow />
                            </Route>
                            <Route path="/lazy-min-delay">
                                <LazyMinDelayPage />
                            </Route>
                            <Route path="/lazy-no-delay">
                                <LazyNoDelayPage />
                            </Route>
                            <Route path="/" exact>
                                <IndexPage />
                            </Route>
                        </Switch>
                    </Suspense>
                </ErrorBoundary>
            </div>
        </div>
    </Router>
);

export default App;
