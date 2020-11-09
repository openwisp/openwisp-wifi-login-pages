# openwisp-wifi-login-pages

<!-- Badges -->

[![Build Status](https://travis-ci.org/openwisp/openwisp-wifi-login-pages.svg?branch=master)](https://travis-ci.org/openwisp/openwisp-wifi-login-pages)
[![Coverage Status](https://coveralls.io/repos/github/openwisp/openwisp-wifi-login-pages/badge.svg)](https://coveralls.io/github/openwisp/openwisp-wifi-login-pages)
[![Dependencies Status](https://david-dm.org/openwisp/openwisp-wifi-login-pages/status.svg)](https://david-dm.org/openwisp/openwisp-wifi-login-pages)
[![devDependencies Status](https://david-dm.org/openwisp/openwisp-wifi-login-pages/dev-status.svg)](https://david-dm.org/openwisp/openwisp-wifi-login-pages?type=dev)

Openwisp wifi login pages app to allow users to authenticate, sign up and know more about the WiFi service they are using.

**Want to help OpenWISP?** [Find out how to help us grow here](http://openwisp.io/docs/general/help-us.html)

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

This module works with [openwisp-radius](https://github.com/openwisp/openwisp-radius). So for us to use it, we need to have a running instance of `openwisp-radius` and set it up to communicate with it. We can have a running instance of `openwisp-radius` locally by following the instructions at [openwisp-radius docs](https://openwisp-radius.readthedocs.io/en/latest/developer/setup.html#installing-for-development) on a new terminal:

- After successfully starting the `openwisp-radius` server, open a browser and visit the address: `http://localhost:8000/admin/` and sign in with the credentials of the `superuser` we created during `openwisp-radius` installation.

- Visit the change page of the organization we wish to add to this module and note down it's `name`, `slug`, `uuid` and `token`.

#### Clone this repo

On a new terminal, clone this repo with:

```
git clone https://github.com/openwisp/openwisp-wifi-login-pages.git
cd openwisp-wifi-login-pages
```

##### Install dependencies

With [NodeJs](https://nodejs.org/en/) and [yarn](https://yarnpkg.com/getting-started/install) installed on our system, we can install the project's dependencies by executing the following command on our terminal:

```
yarn
```

##### Update dependencies

```
yarn upgrade
```

To verify all the dependencies were successfully installed, running the tests with the following command should be successfull:

```
yarn test
```

#### Setup

##### Add Organization configuration

Before users can login/signUp on the system, we need to add an organization to it. We can add the organization from `openwisp-radius` which we noted down above with the following command:

```
yarn add-org
```

The above command will prompt us to fill in some properties. Below is a table with these properties and a description of their values.

| Property          | Description                                       |
| ------------------| --------------------------------------------------|
| name              | Required. Name of the organization.               |
| slug              | Required. Slug of the organization.               |
| uuid              | Required. UUID of the organization.               |
| secret_key        | Required. Token of the organization.              |
| login action url  | Required. Captive portal login action url         |
| logout action url | Required. Captive portal logout action url        |

Note: On a development environment where the `captive portal login/logout action url` might not be available, we could use `http://localhost` as a dummy url.

Copy all the assets to `client/assets/{slug}` directory
Run `$ yarn setup`
Start servers using `$ yarn start`

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

### License

See [LICENSE](https://github.com/openwisp/openwisp-wifi-login-pages/blob/master/LICENSE).
