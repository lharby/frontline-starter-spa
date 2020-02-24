import React from "react";
import { Link } from "react-router-dom";

const NavigationItem = ({ children }) => (
    <li
        style={{
            padding: "1rem 0",
            display: "inline-block",
            marginRight: "1rem"
        }}
    >
        {children}
    </li>
);

const Navigation = () => (
    <nav>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            <NavigationItem>
                <Link to="/">Home</Link>
            </NavigationItem>
            <NavigationItem>
                <Link to="/lazy-no-delay">
                    Lazy with <em>no</em> delay
                </Link>
            </NavigationItem>
            <NavigationItem>
                <Link to="/lazy-min-delay">
                    Lazy with <em>minimum (200ms)</em> delay
                </Link>
            </NavigationItem>
            <NavigationItem>
                <Link to="/error-boundary">Using Error Boundaries</Link>
            </NavigationItem>
        </ul>
    </nav>
);

export default Navigation;
