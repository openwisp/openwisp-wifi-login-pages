/* eslint-disable import/no-cycle */
import React from "react";

export const lazyWithPreload = (factory) => {
  const Component = React.lazy(factory);
  Component.preload = factory;
  return Component;
};

export const Registration = React.lazy(() =>
  import(/* webpackChunkName: 'Registration' */ "../registration"),
);
export const Status = lazyWithPreload(() =>
  import(/* webpackChunkName: 'Status' */ "../status"),
);
export const PasswordChange = React.lazy(() =>
  import(/* webpackChunkName: 'PasswordChange' */ "../password-change"),
);
export const MobilePhoneChange = React.lazy(() =>
  import(/* webpackChunkName: 'MobilePhoneChange' */ "../mobile-phone-change"),
);
export const PasswordReset = React.lazy(() =>
  import(/* webpackChunkName: 'PasswordReset' */ "../password-reset"),
);
export const PasswordConfirm = React.lazy(() =>
  import(/* webpackChunkName: 'PasswordConfirm' */ "../password-confirm"),
);
export const Logout = lazyWithPreload(() =>
  import(/* webpackChunkName: 'Logout' */ "../logout"),
);
export const MobilePhoneVerification = React.lazy(() =>
  import(
    /* webpackChunkName: 'MobilePhoneVerification' */ "../mobile-phone-verification"
  ),
);
export const PaymentStatus = React.lazy(() =>
  import(/* webpackChunkName: 'PaymentStatus' */ "../payment-status"),
);
export const PaymentProcess = React.lazy(() =>
  import(/* webpackChunkName: 'PaymentProcess' */ "../payment-process"),
);
export const ConnectedDoesNotExist = React.lazy(() =>
  import(/* webpackChunkName: 'ConnectedDoesNotExist' */ "../404"),
);
export const DoesNotExist = React.lazy(() =>
  import(/* webpackChunkName: 'DoesNotExist' */ "../404/404"),
);
