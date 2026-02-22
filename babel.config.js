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
    ["@babel/plugin-transform-runtime", {loose: true}],
    ["@babel/plugin-proposal-class-properties", {loose: true}],
    ["@babel/plugin-transform-arrow-functions", {loose: true}],
    ["@babel/plugin-syntax-dynamic-import", {loose: true}],
    ["@babel/plugin-proposal-private-property-in-object", {loose: true}],
    ["@babel/plugin-transform-spread", {loose: true}],
    "transform-remove-strict-mode",
  ],
};
