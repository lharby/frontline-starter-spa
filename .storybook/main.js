const {
    FrontlineScssConfigWebpackPlugin
} = require("@akqa-frontline/scss-config-webpack-plugin");
const {
    FrontlineJsConfigWebpackPlugin
} = require("@akqa-frontline/js-config-webpack-plugin");

module.exports = {
    stories: ["../src/**/*.stories.(js|jsx)"],
    webpackFinal: async config => {
        // Add our Webpack configurations to the end of the plugins list,
        // effectively overriding the CSS and JS loaders already defined by Storybooks webpack configuration.
        config.plugins.push(
            new FrontlineScssConfigWebpackPlugin({ browserslistEnv: "modern" })
        );
        config.plugins.push(
            new FrontlineJsConfigWebpackPlugin({ browserslistEnv: "modern" })
        );

        return config;
    }
};
