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
    ["@babel/plugin-transform-class-properties", {loose: true}],
    ["@babel/plugin-transform-arrow-functions"],
    ["@babel/plugin-syntax-dynamic-import"],
    ["@babel/plugin-transform-private-methods", {loose: true}],
    ["@babel/plugin-transform-private-property-in-object", {loose: true}],
    ["@babel/plugin-transform-spread"],
    "transform-remove-strict-mode",
  ],
};
