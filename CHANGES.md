# Change log

## Version 1.1.0 [2024-11-27]

### Features

- Added progress bar to show RADIUS usage (traffic and session time) in
  the status page.
- Added support for password expiration.
- Limited consecutive SMS sending to prevent abuse.
- Allowed users to upgrade subscriptions plan from the status page.
- Introduced `client.components.registration_form.auto_select_first_plan`
  setting to auto-select the first plan during subscription.
- Added missing Friulian translations.

### Changes

- Updated the X logo to the new design.
- Do not send new SMS unless needed.
- Updated polyfill URL to Cloudflare\'s CDN for enhanced security.

#### Dependencies

- Bumped `add==2.0.6`.
- Bumped `axios==0.28.0`.
- Bumped `concurrently==8.2.1`.
- Bumped `dompurify==3.0.6`.
- Bumped `fs-extra==11.1.0`.
- Bumped `history==5.2.0`.
- Bumped `jsdom==22.1.0`.
- Bumped `marked==12.0.0`.
- Bumped `node-plop==0.32.0`.
- Bumped `nodemon==3.0.3`.
- Bumped `react-redux==8.1.3`.
- Bumped `react-router-dom==6.2.1`.
- Bumped `react-select==5.2.2`.
- Bumped `universal-cookie-express==6.1.1`.
- Bumped `eslint-config-prettier==9.1.0`.
- Bumped `typescript==5.4.5`.

### Bugfixes

- Fixed error when captivePortalLoginForm.additional_fields is empty.
- Fixed `package.json` to ensure setup script is executed on build and client.
- Fixed payment flow redirect loop when payment requires internet.
- Fixed circular import issue detected by eslint.
- Fixed `internetMode` text disappearing when browsing different pages.
- Fixed captive portal login after registration.
- Fixed minor style issue in contact box.

## Version 1.0.0 [2022-05-04]

First release.

### Features

- Mobile first design (responsive UI)
- Sign up
- Optional support for mobile phone verification:
  verify phone number by inserting token sent via SMS, resend the SMS token
- Login to the wifi service (by getting a radius user token from OpenWISP Radius and
  sending a POST to the captive portal login URL behind the scenes)
- Session status information
- Logout from the wifi service (by sending a POST to the captive portal logout URL behind the scenes)
- Change password
- Reset password (password forgot)
- Support for [Social Login](#configuring-social-login) and
  [SAML](#configuring-saml-login--logout)
- Optional social login buttons (facebook, google, twitter)
- Contact box allowing to show the support email and/or phone number, as well as
  additional links specified via configuration
- Navigation menu (header and footer) with possibility of specifying if links should be shown to every user or only
  authenticated or unauthenticated users
- Support for multiple organizations with possibility of customizing the theme via CSS
  for each organization
- Support for multiple languages
- Possibility to change any text used in the pages
- Configurable Terms of Services and Privacy Policy for each organization
- Possibility of recognizing users thanks to signed cookies, which saves them
  from having to re-authenticate
- Support for [credit/debit card verification and paid subscription plans](#signup-with-payment-flow)
