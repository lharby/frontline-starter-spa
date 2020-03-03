import React from "react";
import Example from "./Example";

export default {
    title: "Example Component"
};

export const asDefault = () => <Example />;

export const asPrimary = () => <Example color="primary" />;

export const asSecondary = () => <Example color="secondary" />;
