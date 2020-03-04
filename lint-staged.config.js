const fileLimit = 10;

module.exports = {
    "./src/**/*.*(js|jsx|ts|tsx)": [
        "prettier --write",
        filenames => (filenames.length > fileLimit ? "eslint ./src/**/*.*(js|jsx|ts|tsx)" : `eslint --cache ${filenames.join(" ")}`),
    ],
    "./src/**/*.*(css|scss)": [
        "prettier --write",
        filenames => (filenames.length > fileLimit ? "stylelint ./src/**/*.*(css|scss)" : `stylelint --cache ${filenames.join(" ")}`),
    ],
};
