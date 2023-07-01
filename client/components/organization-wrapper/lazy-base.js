import React from "react";

const lazyWithPreload = (factory) => {
  const Component = React.lazy(factory);
  Component.preload = factory;
  return Component;
};
export default lazyWithPreload;
