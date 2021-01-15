# openwisp-wifi-login-pages

<!-- Badges -->

[![Build Status](https://travis-ci.org/openwisp/openwisp-wifi-login-pages.svg?branch=master)](https://travis-ci.org/openwisp/openwisp-wifi-login-pages)
[![Coverage Status](https://coveralls.io/repos/github/openwisp/openwisp-wifi-login-pages/badge.svg)](https://coveralls.io/github/openwisp/openwisp-wifi-login-pages)
[![Dependencies Status](https://david-dm.org/openwisp/openwisp-wifi-login-pages/status.svg)](https://david-dm.org/openwisp/openwisp-wifi-login-pages)
[![devDependencies Status](https://david-dm.org/openwisp/openwisp-wifi-login-pages/dev-status.svg)](https://david-dm.org/openwisp/openwisp-wifi-login-pages?type=dev)

<p align="center">
  <img src="https://github.com/openwisp/openwisp-wifi-login-pages/raw/master/docs/login-desktop.png" alt="login">
</p>
<p align="center">
  <img src="https://github.com/openwisp/openwisp-wifi-login-pages/raw/master/docs/sign-up-mobile.png" alt="sign-up">
</p>
<p align="center">
  <img src="https://github.com/openwisp/openwisp-wifi-login-pages/raw/master/docs/verify-mobile-phone-mobile.png" alt="verify mobile phone number">
</p>

**No more ugly and fragmented User Experience for public/private WiFi services!**

OpenWISP WiFi login pages provides unified and consistent user experience for
public/private WiFi services.

In short, this app replaces the classic captive/login page of a WiFi service by integrating
the [OpenWISP Radius API](https://openwisp-radius.readthedocs.io/) to provide the following features:

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

---

### Table of contents

- [Prerequisites](#prerequisites)
- [Install](#install)
- [Usage](#usage)
- [Settings](#settings)
- [License](#license)

### Prerequisites

- [NodeJs](https://nodejs.org/en/) >= 12.0.0
- [NPM](https://npmjs.org/) - Node package manager >= 6.9.0
- [yarn](https://yarnpkg.com/) - Yarn package manager >= 1.19.0

### Install

#### Install openwisp-radius

This module is a frontend for [OpenWISP RADIUS](https://github.com/openwisp/openwisp-radius).

So in order to use it, this app needs a running instance of OpenWISP RADIUS and an
organization correctly configured, you can obtain this by following these steps:

- Follow the instructions
[to install OpenWISP RADIUS for development](https://openwisp-radius.readthedocs.io/en/latest/developer/setup.html#installing-for-development).
- After successfully starting the OpenWISP RADIUS server, open a browser and visit:
  `http://localhost:8000/admin/`, then sign in with the credentials of
  the `superuser` we created during the installation of `openwisp-radius`.
- Visit the change page of the organization you want to add to this module
  and note down the following parameters: `name`, `slug`, `uuid` and `token`
  (from the Organization RADIUS Settings).

#### Clone this repo

In a new terminal, clone this repo with:

```
git clone https://github.com/openwisp/openwisp-wifi-login-pages.git
cd openwisp-wifi-login-pages
```

##### Install dependencies

With [NodeJs](https://nodejs.org/en/) and [yarn](https://yarnpkg.com/getting-started/install)
installed on your system, install the dependencies with:

```
yarn
```

##### Update dependencies

```
yarn upgrade
```

To verify all the dependencies were successfully installed,
try to run the tests with the following command:

```
yarn test
```

#### Setup

##### Add Organization configuration

Before users can login and sign up, you need to create the configuration of the
captive page for the related OpenWISP organization,
you should have noted down the parameters performed during the
[Installation of OpenWISP RADIUS ](#install-openwisp-radius), then you can run:

```
yarn add-org
```

The above command will prompt you to fill in some properties.

Below is a table with these properties and a description of their values.

| Property                   | Description                                        |
| -------------------------- | ---------------------------------------------------|
| name                       | Required. Name of the organization.                |
| slug                       | Required. Slug of the organization.                |
| uuid                       | Required. UUID of the organization.                |
| secret_key                 | Required. Token from organization radius settings. |
| captive portal login URL   | Required. Captive portal login action url          |
| captive portal logout URL  | Required. Captive portal logout action url         |
| openwisp radius url        | Required. URL to openwisp-radius.                  |

Chose to copy the assets, then run:

```
yarn setup
yarn start
```

**Note**: in a development environment where a captive portal may not be available,
you can use the default sample captive portal login and logout URLs.

### Usage

List of yarn commands:

```
$ yarn start      # Run the app (runs both, client and server)
$ yarn setup      # Discover Organization configs and generate config.json and asset directories
$ yarn add-org    # Add new Organization configuration
$ yarn build      # Build the app
$ yarn server     # Run server
$ yarn client     # Run client
$ yarn coveralls  # Run coveralls
$ yarn lint       # Run ESLint
$ yarn lint:fix   # Run ESLint with automatically fix problems option
$ yarn test       # Run tests
$ yarn -- -u      # Update Jest Snapshots
```

#### Using custom ports

To start the client and/or server on a port of your liking, you must set environment
variables before starting.

**To run the client on port 4000 and the server on port 5000, use the following command:**

Bash (Linux):

```
$ CLIENT=4000 SERVER=5000 yarn start
```

Powershell (Windows):

```
PS> $env:CLIENT = 4000; $env:SERVER = 5000; yarn start
```

**You can also run the client and server commands separately:**

Bash (Linux):

```
$ SERVER=5000 yarn server
```

```
$ CLIENT=4000 SERVER=5000 yarn client
```

Powershell (Windows):

```
PS> $env:SERVER = 5000; yarn server
```

```
PS> $env:CLIENT = 4000; $env:SERVER = 5000; yarn client
```

Note that you need to tell the client the server's port
(unless you're using the default server port, which is 3030)
so the client knows where he can find the server.

### Settings

#### Menu items

By default, menu items are visible to any user, but it's possible to
configure some items to be visible only to authenticated users or
to unauthenticated users by specifying the `authenticated` property.

- `authenticated: true` means visible only to authenticated users.
- `authenticated: false` means visible only to unauthenticated users.
- unspecified: link will be visible to any user (default behavior)

Let us consider the following configuration for the header, footer and contact components:

```
components:
  header:
    links:
      - text:
          en: "about"
        url: "/about"
      - text:
          en: "sign uo"
        url: "/default/registration"
        authenticated: false
      - text:
          en: "change password"
        url: "/change-password"
        authenticated: true
  footer:
    links:
      - text:
          en: "about"
        url: "/about"
      - text:
          en: "status"
        url: "/status"
        authenticated: true
  contact_page:
    social_links:
      - text:
          en: "support"
        url: "/support"
      - text:
          en: "twitter"
        url: "https://twitter.com/openwisp"
        authenticated: true
```

With the configuration above:

- `support` (from Contact) and `about` (from Header and Footer) links
  will be visible to any user.
- `sign up` (from Header) link will be visible to only unauthenticated users.
- the link to `twitter` (from Contact) and `change password` (from Header)
  links will be visible to only authenticated users

#### Optional Fields

We can use the `setting` attribute of optional fields `first_name`, `last_name`, `location` and `birth_date` 
to decide if the fields should either be disabled, allowed but not required or required. `setting` can take 
any of the following value:

- `disabled`: This is the default value. fields with this setting are not shown.
- `allowed`: Fields with this setting are shown but not required.
- `mandatory`: Fields with this setting are shown and required.

### License

See [LICENSE](https://github.com/openwisp/openwisp-wifi-login-pages/blob/master/LICENSE).
