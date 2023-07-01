import lazyWithPreload from "./lazy-base";

const Logout = lazyWithPreload(() =>
  import(/* webpackChunkName: 'Logout' */ "../logout"),
);
export default Logout;
