const chunkFiles = require("lint-staged/lib/chunkFiles");

// The linters fail for very large lists of files
const MAX_ARGUMENT_LENGTH = 8000;

const sharedTasks = ["prettier --write"];

module.exports = {
    "./src/**/*.*(js|jsx|ts|tsx)": [
        ...sharedTasks,
        allFiles => {
            const chunkedFiles = chunkFiles({
                files: allFiles,
                maxArgLength: MAX_ARGUMENT_LENGTH,
                gitDir: "./",
            });
            return chunkedFiles.map(chunk => `eslint --cache -- ${chunk.join(" ")}`);
        },
    ],
    "./src/**/*.*(css|scss)": [
        ...sharedTasks,
        allFiles => {
            const chunkedFiles = chunkFiles({
                files: allFiles,
                maxArgLength: MAX_ARGUMENT_LENGTH,
                gitDir: "./",
            });
            return chunkedFiles.map(chunk => `stylelint --cache -- ${chunk.join(" ")}`);
        },
    ],
};
