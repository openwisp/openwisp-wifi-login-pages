const browserTargets = require("./config/babel-browsers");

module.exports = (api) => {
  // When called by webpack's babel-loader, api.caller() returns
  // { name: "babel-loader", ... }. Jest uses babel-jest which
  // sets a different caller or none at all.
  const isWebpack = api.caller(
    (caller) => caller && caller.name === "babel-loader",
  );
  return {
    presets: [
      [
        "@babel/preset-env",
        isWebpack ? {targets: browserTargets} : {targets: {node: "current"}},
      ],
      "@babel/preset-react",
    ],
    plugins: [
      ["@babel/plugin-transform-runtime", {regenerator: true}],
      ["@babel/plugin-transform-private-methods", {loose: true}],
      ["@babel/plugin-proposal-class-properties", {loose: true}],
      ["@babel/plugin-proposal-private-property-in-object", {loose: true}],
      ["@babel/plugin-transform-arrow-functions"],
      ["@babel/plugin-syntax-dynamic-import"],
      ["@babel/plugin-transform-spread"],
      "transform-remove-strict-mode",
    ],
  };
};
