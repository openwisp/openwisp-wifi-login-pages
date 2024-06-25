import "core-js/es/promise";

console.log("loading paa");
console.log(window.fetch);
if (typeof window.fetch !== "undefined") {
  import("./app").then(
    (module) => {
      console.log("this is module");
      console.log(module);
      module.default();
    });
} else {
  console.log("old browser");
  import(/* webpackChunkName: 'Polyfills' */ "./polyfills").then(() => {
    import("./app").then((module) => module.default());
  });
}
