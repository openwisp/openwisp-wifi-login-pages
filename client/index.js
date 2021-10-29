import "core-js/es/promise";

if (typeof window.fetch !== "undefined") {
  import("./app").then((module) => module.default());
} else {
  import(/* webpackChunkName: 'Polyfills' */ "./polyfills").then(() => {
    import("./app").then((module) => module.default());
  });
}
