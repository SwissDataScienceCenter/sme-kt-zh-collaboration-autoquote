//  @ts-check

/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
    tabWidth: 4,
    semi: true,
    singleQuote: false,
    trailingComma: "all",
    printWidth: 180,
    plugins: ["prettier-plugin-tailwindcss"],
    tailwindStylesheet: "./src/styles.css",
};

export default config;
