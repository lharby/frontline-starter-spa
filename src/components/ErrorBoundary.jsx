import React, { Component } from "react";
import PropTypes from "prop-types";

const isDevelop = process.env.NODE_ENV === "development";

class ErrorBoundary extends Component {
    state = {
        error: null,
        errorInfo: null
    };

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });

        // You can also log the error to an error reporting service
        console.warn(error, errorInfo);
    }

    render() {
        const { error, errorInfo } = this.state;
        // You can render any custom fallback UI
        if (error) {
            if (isDevelop) {
                return (
                    <details style={{ padding: ".5rem" }}>
                        <summary
                            style={{ color: "red", marginBottom: ".5rem" }}
                        >
                            Something went wrong.
                        </summary>
                        {error.toString()}
                        <br />
                        <pre>{errorInfo.componentStack}</pre>
                    </details>
                );
            } else {
                return <h3 style={{ color: "red" }}>Something went wrong.</h3>;
            }
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
