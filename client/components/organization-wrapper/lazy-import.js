/* eslint-disable import/no-cycle */
import React from "react";

export const lazyWithPreload = (factory) => {
  const Component = React.lazy(factory);
  Component.preload = factory;
  return Component;
};

export const Registration = React.lazy(() => import("../registration"));
export const Status = lazyWithPreload(() =>
  import(/* webpackChunkName: 'Status' */ "../status"),
);
export const PasswordChange = React.lazy(() => import("../password-change"));
export const MobilePhoneChange = React.lazy(() =>
  import("../mobile-phone-change"),
);
export const PasswordReset = React.lazy(() => import("../password-reset"));
export const PasswordConfirm = React.lazy(() => import("../password-confirm"));
export const Logout = lazyWithPreload(() =>
  import(/* webpackChunkName: 'Logout' */ "../logout"),
);
export const MobilePhoneVerification = React.lazy(() =>
  import("../mobile-phone-verification"),
);
export const PaymentStatus = React.lazy(() => import("../payment-status"));
export const ConnectedDoesNotExist = React.lazy(() => import("../404"));
export const DoesNotExist = React.lazy(() => import("../404/404"));
