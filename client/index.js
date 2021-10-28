if (window.fetch) {
  import("./app").then((module) => module.default());
} else {
  import(/* webpackChunkName: 'Polyfills' */ "./polyfills").then(() => {
    import("./app").then((module) => module.default());
  });
}
