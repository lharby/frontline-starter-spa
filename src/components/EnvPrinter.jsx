import React from "react";

const EnvPrinter = () => (
    <ul>
        {Object.keys(process.env).map(k => (
            <li>
                <code>{k}</code> <code>{process.env[k]}</code>
            </li>
        ))}
    </ul>
);

export default EnvPrinter;
