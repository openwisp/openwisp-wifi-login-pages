module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          browsers: ["> 0.25%", "not dead"],
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
    ["@babel/plugin-proposal-private-methods", {loose: true}],
    ["@babel/plugin-proposal-private-property-in-object", {loose: true}],
    ["@babel/plugin-transform-spread"],
    "transform-remove-strict-mode",
  ],
};
