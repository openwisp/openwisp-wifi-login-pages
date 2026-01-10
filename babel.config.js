module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          ie: "11",
        },
      },
    ],
    "@babel/preset-react",
  ],
  plugins: [
    ["@babel/plugin-transform-runtime"],
    ["@babel/plugin-proposal-class-properties", {loose: true}],
    ["@babel/plugin-transform-arrow-functions"],
    ["@babel/plugin-syntax-dynamic-import"],
<<<<<<< HEAD
    ["@babel/plugin-transform-private-methods", {loose: true}],
=======
    ["@babel/plugin-proposal-private-property-in-object", {loose: true}],
>>>>>>> 1eb25ed ([fix] Removed unused dependencies, added knip to CI QA checks #1007)
    ["@babel/plugin-transform-spread"],
    "transform-remove-strict-mode",
  ],
};
