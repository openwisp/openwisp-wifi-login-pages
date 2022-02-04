# openwisp-wifi-login-pages

<!-- Badges -->

[![Build Status](https://github.com/openwisp/openwisp-wifi-login-pages/workflows/OpenWisp%20WiFi%20Login%20Pages%20CI%20BUILD/badge.svg?branch=master)](https://github.com/openwisp/openwisp-wifi-login-pages/actions)
[![Coverage Status](https://coveralls.io/repos/github/openwisp/openwisp-wifi-login-pages/badge.svg)](https://coveralls.io/github/openwisp/openwisp-wifi-login-pages)
[![Dependency Monitoring](https://img.shields.io/librariesio/release/github/openwisp/openwisp-wifi-login-pages)](https://libraries.io/github/openwisp/openwisp-wifi-login-pages#repository_dependencies)

<p align="center">
  <img src="https://github.com/openwisp/openwisp-wifi-login-pages/raw/media/docs/login-desktop.png" alt="">
</p>
<p align="center">
  <img src="https://github.com/openwisp/openwisp-wifi-login-pages/raw/media/docs/sign-up-desktop.png" alt="">
</p>
<p align="center">
  <img src="https://github.com/openwisp/openwisp-wifi-login-pages/raw/media/docs/verify-mobile-phone-desktop.png" alt="">
</p>
<p align="center">
  <img src="https://github.com/openwisp/openwisp-wifi-login-pages/raw/media/docs/login-mobile.png" alt="">
</p>
<p align="center">
  <img src="https://github.com/openwisp/openwisp-wifi-login-pages/raw/media/docs/signup-mobile.png" alt="">
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

---

### Table of contents

- [Deploy it in production](#deploy-it-in-production)
- [Prerequisites](#prerequisites)
- [Install](#install)
- [Usage](#usage)
- [Settings](#settings)
- [Translations](#translations)
- [License](#license)

### Deploy it in production

An ansible role which can be used to deploy and maintain this app is available, see [ansible-openwisp-wifi-login-pages](https://github.com/openwisp/ansible-openwisp-wifi-login-pages/).

### Prerequisites

- [NodeJs](https://nodejs.org/en/) >= 16.0.0
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

To verify all the dependencies were successfully installed,
try to run the tests with the following command:

```
yarn test # headless tests
```

##### Browser based tests

Prerequisites for running browser-based tests:

1. [Gecko driver](https://github.com/mozilla/geckodriver/releases/) needs to be installed.
2. Having running instances of openwisp-radius and openwisp-wifi-login-pages is required.
3. `OPENWIPS_RADIUS_PATH` environment variable is needed to setup/tear down the database
   data needed to run the browser tests. This can be set using the following command:
   ```
   export OPENWISP_RADIUS_PATH=<PATH_TO_OPENWISP_RADIUS_DIRECTORY>
   ```
4. If a virtual environment is used to run openwisp-radius then
   this needs to be activated before running browser tests.
5. Configuration file of `mobile` organization is needed before running `yarn start`.
   `mobile` organization can be created by running:
   ```
   node browser-test/create-mobile-configuration.js
   ```
6. In the test environment of openwisp-radius, the `default` organization
   must be present.

After doing all the prerequisites, run browser based tests using the following command:

```
yarn browser-test
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

This command will present a series of interactive questions which make it
easier for users to configure the application for their use case.

Once all the questions are answered, the script will create a new directory, eg:

```
/organizations/{orgSlug}/
/organizations/{orgSlug}/client_assets/
/organizations/{orgSlug}/server_assets/
/organizations/{orgSlug}/{orgSlug}.yml
```

The directory `client_assets` shall contain static files like CSS, images,
etc.

The directory `server_assets` is used for loading the content of
[Terms of Service and Privacy Policy](#tos--privacy-policy).

The configuration of organizations is generated from the template present
in `/internals/generators/config.yml.hbs`.

The default configuration is stored at `/internals/config/default.yml`.
If the configuration file of a specific organization misses a piece
of configuration then the default configuration is used to generate a
complete configuration.

The above command will prompt you to fill in some properties.

Below is a table with these properties and a description of their values.

| Property                  | Description                                        |
| ------------------------- | -------------------------------------------------- |
| name                      | Required. Name of the organization.                |
| slug                      | Required. Slug of the organization.                |
| uuid                      | Required. UUID of the organization.                |
| secret_key                | Required. Token from organization radius settings. |
| captive portal login URL  | Required. Captive portal login action url          |
| captive portal logout URL | Required. Captive portal logout action url         |
| openwisp radius url       | Required. URL to openwisp-radius.                  |

Chose to copy the assets, then run:

```
yarn setup
yarn start
```

**Note**: in a development environment where a captive portal may not be available,
you can use the default sample captive portal login and logout URLs.

#### Removing sections of configuration

To remove a specific section of the configuration, the `null` keyword
can be used, this way the specific section flagged as `null` will be
removed during the build process.

For example, to remove social login links:

```yaml
login_form:
  social_login:
    links: null
```

**Note:** Do not delete or edit default configuration
(`/internals/config/default.yml`) as it is required to build and compile
organization configurations.

#### Variants of the same configuration

In some cases it may be needed to have different variants of the same
design but with different logos, or slightly different colors, wording and so on,
but all these variants would be tied to the same service.

In this case it's possible to create new YAML configuration files
(eg: `variant1.yml`, `variant2.yml`) in the directory `/organizations/{orgSlug}/`,
and specify only the configuration keys which differ from the parent configuration.

Example variant of the default organization:

```yaml
---
name: "Variant1"
client:
  components:
    header:
      logo:
        url: "variant1-logo.svg"
        alternate_text: "variant1"
```

The configuration above has very little differences with the parent
configuration: the name and logo are different, the rest
is inherited from the parent organization.

Following example, the contents above should be placed in
`/organizations/default/variant1.yml` and once the server is started again
this new variant will be visible at `http://localhost:8080/default-variant1`.

It's possible to create multiple variants of different organizations, by making
sure `default` is replaced with the actual organization `slug` that is being used.

And of course it's possible to customize more than just the name and logo,
the example above has been kept short for brevity.

**Note**: if a variant defines a configuration option which contains an array/list
of objects (eg: menu links), the array/list defined in the variant always
overwrites fully what is defined in the parent configuration file.

##### Variant with different organization slug / UUID / secret

In some cases, different organizations may share an identical configuration,
with very minor differences. Variants can be used also in these cases to
minimize maintenance efforts.

The important thing to keep in mind is that the organization `slug`, `uuid`,
`secret_key` need to be reset in the configuration file:

Example:

```yaml
---
name: "<organization_name>"
slug: "<organization_slug>"
server:
  uuid: "<organization_uuid>"
  secret_key: "<organization_secret_key>"
client:
  css:
    - "index.css"
    - "<org-css-if-needed>"
  components:
    header:
      logo:
        url: "org-logo.svg"
        alternate_text: "..."
```

### Usage

List of yarn commands:

```
$ yarn start         # Run the app (runs both, client and server)
$ yarn setup         # Discover Organization configs and generate config.json and asset directories
$ yarn add-org       # Add new Organization configuration
$ yarn build         # Build the app
$ yarn server        # Run server
$ yarn client        # Run client
$ yarn coveralls     # Run coveralls
$ yarn coverage      # Run tests and generate coverage files
$ yarn lint          # Run ESLint
$ yarn lint:fix      # Run ESLint with automatically fix problems option
$ yarn format        # Run formatters to format the code
$ yarn test          # Run tests
$ yarn browser-test  # Run browser based selenium tests
$ yarn -- -u         # Update Jest Snapshots
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

### Running webpack-bundle-analyzer

This tool helps to keep the size of the JS files produced by the app in check.

Run it with:

```
yarn stats
```

### Settings

#### Menu items

By default, menu items are visible to any user, but it's possible to
configure some items to be visible only to authenticated users,
unauthenticated users, verified users, unverified users or
users registered with specific registration methods by
specifying the `authenticated`, `verified`, `methods_only`
and `methods_excluded` properties.

- `authenticated: true` means visible only to authenticated users.
- `authenticated: false` means visible only to unauthenticated users.
- `verified: true` means visible to authenticated and verified users.
- `verified: false` means visible to only authenticated and unverified users.
- `methods_only: ["mobile_phone"]` means visible only to users registered
  with mobile phone verification.
- `methods_excluded: ["saml", "social_login"]` means not visible to users
  which sign in using SAML and social login.
- unspecified: link will be visible to any user (default behavior)

Let us consider the following configuration for the header, footer and contact components:

```yaml
components:
  header:
    links:
      - text:
          en: "about"
        url: "/about"
      - text:
          en: "sign up"
        url: "/default/registration"
        authenticated: false
      - text:
          en: "change password"
        url: "/change-password"
        authenticated: true
        # if organization supports any verification method
        verified: true
        methods_excluded:
          - saml
          - social_login
      # if organization supports mobile verification
      - text:
          en: "change phone number"
        url: "/mobile/change-phone-number"
        authenticated: true
        methods_only:
          - mobile_phone
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
- change password will not be visible to users which sign in with
  social login or signle sign-on (SAML)
- change mobile phone number will only be visible to users which have
  signed up with mobile phone verification

**Notes**:

- `methods_only` and `methods_excluded` only make sense for links which
  are visible to authenticated users
- using both `methods_excluded` and `methods_only` on the same link does
  not make sense

#### User Fields in Registration Form

The `setting` attribute of the fields `first_name`, `last_name`,
`location` and `birth_date` can be used to indicate whether the fields
shall be disabled (the default setting), allowed but not required or required.

The `setting` option can take any of the following values:

- `disabled`: (**the default value**) fields with this setting won't be shown.
- `allowed`: fields with this setting are shown but not required.
- `mandatory`: fields with this setting are shown and required.

Keep in mind that this configuration must mirror the
[configuration of openwisp-radius (OPENWISP_RADIUS_OPTIONAL_REGISTRATION_FIELDS)](https://openwisp-radius.readthedocs.io/en/latest/user/settings.html#openwisp-radius-optional-registration-fields).

#### Username field in login form

The username field in the login form is automatically set to either a
phone number input or an email text input depending on whether
`mobile_phone_verification` is enabled or not.

However, it is possible to force the use of a standard text field if needed,
for example, we may need to configure the username field to accept any value
so that the [OpenWISP Users Authentication Backend](https://github.com/openwisp/openwisp-users/#authentication-backend)
can then figure out if the value passed is a phone number, an email or a username:

```yaml
login_form:
  input_fields:
    username:
      auto_switch_phone_input: false
      type: "text"
      pattern: null
```

#### Configuring Social Login

In order to enable users to log via third-party services like Google and Facebook,
the ["Social Login" feature of OpenWISP Radius](https://openwisp-radius.readthedocs.io/en/latest/user/social_login.html)
must be configured and enabled.

#### Custom CSS files

It's possible to specify multiple CSS files if needed.

```yaml
client:
  css:
    - "index.css"
    - "custom.css"
```

Adding multiple CSS files can be useful when working with [variants](#variants-of-the-same-configuration).

#### Custom HTML

It is possible to inject custom HTML in different languages in several parts
of the application if needed.

##### Second logo

```yaml
header:
  logo:
    url: "logo1.png"
    alternate_text: "logo1"
  second_logo:
    url: "logo2.png"
    alternate_text: "logo2"
```

#### Sticky message

```yaml
header:
  sticky_html:
    en: >
      <p class="announcement">
        This site will go in schedule maintenance
        <b>tonight (10pm - 11pm)</b>
      </p>
```

##### Login page

```yaml
login_form:
  intro_html:
    en: >
      <div class="pre">
        Shown before the main content in the login page.
      </div>
  pre_html:
    en: >
      <div class="intro">
        Shown at the beginning of the login content box.
      </div>
  help_html:
    en: >
      <div class="intro">
        Shown above the login form, after social login buttons.
        Can be used to write custom help labels.
      </div>
  after_html:
    en: >
      <div class="intro">
        Shown at the end of the login content box.
      </div>
```

##### Contact box

```yaml
contact_page:
  pre_html:
    en: >
      <div class="contact">
        Shown at the beginning of the contact box.
      </div>
  after_html:
    en: >
      <div class="contact">
        Shown at the end of the contact box.
      </div>
```

##### Footer

```yaml
footer:
  after_html:
    en: >
      <div class="contact">
        Shown at the bottom of the footer.
        Can be used to display copyright information, links to cookie policy, etc.
      </div>
```

#### Configuring SAML Login & Logout

To enable SAML login, the ["SAML" feature of OpenWISP Radius](https://openwisp-radius.readthedocs.io/en/latest/user/saml.html)
must be enabled.

The only additional configuration needed is `saml_logout_url`, which is needed
to perform SAML logout.

```yaml
status_page:
  # other conf
  saml_logout_url: "https://openwisp.myservice.org/radius/saml2/logout/"
```

#### TOS & Privacy Policy

The terms of services and privacy policy pages are generated from markdown
files which are specified in the YAML configuration.

The markdown files specified in the YAML configuration should be placed in:
`/configurations/{orgSlug}/server_assets/`.

#### Configuring Logging

There are certain environment variables used to configure server logging.
The details of environment variables to configure logging are mentioned below:

| Environment Variable | Detail                                                                                                                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **LOG_LEVEL**        | (optional) This can be used to set the level of logging. The available values are `error`, `warn`, `info`, `http`, `verbose`, `debug` and `silly`. By default log level is set to `debug` during development and `warn` during production. |
| **ALL_LOG_FILE**     | (optional) To configure the path of the log file for all logs. The default path is `logs/all.log`                                                                                                                                          |
| **ERROR_LOG_FILE**   | (optional) To configure the path of the log file for error logs. The default path is `logs/error.log`                                                                                                                                      |
| **WARN_LOG_FILE**    | (optional) To configure the path of the log file for warn logs. The default path is `logs/warn.log`                                                                                                                                        |
| **INFO_LOG_FILE**    | (optional) To configure the path of the log file for info logs. The default path is `logs/info.log`                                                                                                                                        |
| **HTTP_LOG_FILE**    | (optional) To configure the path of the log file for http logs. The default path is `logs/http.log`                                                                                                                                        |
| **DEBUG_LOG_FILE**   | (optional) To configure the path of the log file for http logs. The default path is `logs/debug.log`                                                                                                                                       |

All the **HTTP requests** get logged by default in the console during development.

#### Mocking captive portal login and logout

The captive portal login and logout operations can be mocked by using the endpoints
mentioned in [openwisp-radius captive portal mock docs](https://openwisp-radius.readthedocs.io/en/latest/developer/captive_portal_mock.html).

These URLs from OpenWISP RADIUS will be used by default in the development environment.
The captive portal login and logout URLs and their parameters can be changed by
editing the YAML configuration file of the respective organization.

#### Signup with payment flow

This application supports sign up with payment flows, either a one
time payment, a free debit/credit card transaction for identity verification
purposes or a subscription with periodic payments.

In order to work, this feature needs the premium **OpenWISP Subscriptions**
module ([get in touch with commercial support](https://openwisp.org/support.html)
for more information).

Once the module mentioned above is installed and configured, in order to
enable this feature, just create a new organization with the
`yarn run add-org` command and answer `yes` to the following question:

`Are you using OpenWISP Subscriptions to provide paid subscriptions for WiFi plans or identity verification via credit/debit card?`

### Translations

Translations are loaded at runtime from the JSON files that were compiled during
the build process according to the available languages defined and taking into
account any customization of the translations (more on [defining-available-languages](#defining-available-languages),
[add translations](#add-translations) and [customizing translations](#customizing-translations-for-a-specific-language)).

#### Defining available languages

If there is more than one language in `i18n/` directory then update the organization
configuration file by adding the support for that language like this:

```yaml
default_language: "en"
languages:
  - text: "English"
    slug: "en"
  - text: "Italian"
    slug: "it"
```

#### Add translations

Translation file with content headers can be created by running:

```
yarn translations-add {language_code} i18n/{file_name}.po
```

Here `file_name` can be `{orgSlug}_{language_code}.custom.po`, `{language_code}.custom.po\` or
`{language_code}.po`.

The files created with the command above are mostly empty because when
adding custom translations it is not needed to extract all the message
identifiers from the code.

If instead you are adding support to a new language or updating the
translations after having changed the code, you will need to extract the
message identifiers, see [update-translations](#update-translations)
for more information.

#### Update translations

To extract or update translations in the `.po` file,
use the following command:

```
yarn translations-update <path-to-po-file>
```

This will extract all the translations tags from the code and update `.po` file passed as argument.

#### Customizing translations for a specific language

Create a translation file with name `{language_code}.custom.po` by running:
`yarn translations-add <language-code> i18n/{language_code}.custom.po`

Now to override the translation placeholders (`msgid`) add the `msgstr` in the
newly generated file for that specific `msgid`:

```
msgid ""
msgstr ""
"Content-Type: text/plain; charset=UTF-8\n"
"Plural-Forms: nplurals = 2; plural = (n != 1);\n"
"Language: en\n"
"MIME-Version: 1.0\n"
"Content-Transfer-Encoding: 8bit\n"

msgid "FORGOT_PASSWORD"
msgstr "Forgot password? Reset password"
```

During the build process customized language files will override all the msgid
defined in the default language files.

**NOTE**: The custom files need not be duplicates of the default file i.e.
translations can be defined for custom strings (i.e. msgid and msgstr).

#### Customizing translations for a specific organization and language

Create a translation file with name `{orgSlug}_{language_code}.custom.po` by running:
`yarn translations-add <language-code> i18n/{orgSlug}_{language_code}.custom.po`

To override the translation placeholders (`msgid`) add the `msgstr` in the newly
generated file for that specific `msgid`:

```
msgid ""
msgstr ""
"Content-Type: text/plain; charset=UTF-8\n"
"Plural-Forms: nplurals = 2; plural = (n != 1);\n"
"Language: en\n"
"MIME-Version: 1.0\n"
"Content-Transfer-Encoding: 8bit\n"

msgid "PHONE_LBL"
msgstr "mobile phone number (verification needed)"
```

During the build process custom organization language file will be used to create a
JSON translation file used by that specific organization.

**Note**: Do not remove the content headers from the `.po` files as it is needed
during the build process.

### Handling Captive Portal / RADIUS Errors

This app can handle errors that may encountered during the
authentication process (eg: maximum available daily/monthly time or
bandwidth have been consumed).

To use this feature, you will have to update the error page
of your captive portal to use
[postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
for forwarding any error message to **OpenWISP WiFi Login Pages**.

Here is an example of authentication error page for pfSense:

```html
<!DOCTYPE html>
<html>
  <body>
    <script>
      window.parent.postMessage(
        {type: "authError", message: "$PORTAL_MESSAGE$"},
        "https://wifi-login-pages.example.com/",
      );
    </script>
  </body>
</html>
```

**Note:** Replace `https://wifi-login-pages.example.com/` with `origin` of
your **OpenWISP WiFi Login Pages** service.

With the right configuration, the error messages coming from freeradius or
the captive portal will be visible to users on **OpenWISP WiFi Login Pages**.

### Supporting realms (RADIUS proxy)

To enable support for realms, set `radius_realms` to `true` as in the example below:

```yaml
---
name: "default name"
slug: "default"

settings:
  radius_realms: true
```

When support for `radius_realms` is `true` and the username inserted in the
username field by the user includes an `@` sign, the login page will submit
the credentials directly to the URL specified in `captive_portal_login_form`,
hence bypassing this app altogether.

Keep in mind that in this use case, since users are basically authenticating
against databases stored in other sources foreign to OpenWISP but trusted by
the RADIUS configuration, the wifi-login-pages app stops making any sense,
because users are registered elsewhere, do not have a local account on OpenWISP,
therefore won't be able to authenticate nor change their personal details via
the OpenWISP RADIUS API and this app.

### Allowing users to manage account from the Internet

The authentication flow might hang if a user tries to access their
account from the public internet (without connecting to the WiFi service).
It occurs because the **OpenWISP WiFi Login Page** waits for a response
from the captive portal, which is usually inaccessible from the public
internet. If your infrastructure has such a configuration then,
follow the below instructions to avoid hanging of authentication flow.

Create a small web application which can serve the endpoints entered in
`captive_portal_login_form.action` and `captive_portal_logout_form.action`
of organization configuration.

The web application should serve the following HTML on those endpoints:

```html
<!DOCTYPE html>
<html>
  <body>
    <script>
      window.parent.postMessage(
        {type: "internet-mode"},
        "https://wifi-login-pages.example.com/",
      );
    </script>
  </body>
</html>
```

**Note:** Replace `https://wifi-login-pages.example.com/` with `origin` of
your **OpenWISP WiFi Login Pages** service.

Assign a dedicated DNS name to be used by both systems: the captive portal
and the web application which simulates it. Then configure your captive
portal to resolve this DNS name to its IP, while the public DNS resolution
should point to the mock app just created. This way captive portal login
and logout requests will not hang, allowing users to view/modify their
account data also from the public internet.

### Loading extra javascript files

It is possible to load extra javascript files, which may be needed for different
reasons like error monitoring (Sentry), analytics (Piwik, Google analytics), etc.

It's possible to accomplish this in two ways which are explained below.

#### 1. Loading extra javascript files for whole application (all organizations)

Place the javascript files in `organizations/js` directory and it will be injected in HTML
during the webpack build process for all the organizations.

These scripts are loaded before all the other Javascript code is loaded.
This is done on purpose to ensure that any error monitoring code is loaded
before everything else.

This feature should be used only for critical custom Javascript code.

#### 2. Loading extra javascript files for a specific organization

Add the names of the extra javascript files in organization configuration. Example:

```yaml
client:
  js:
    - "piwik-script.js"
    - "google-analytics.js"
```

Make sure that all these extra javascript files are be present in the
`organizations/<org-slug>/client_assets` directory.

These scripts are loaded only after the rest of the page has finished loading.

This feature can be used to load non-critical custom Javascript code.

### Support for old browsers

Polyfills are used to support old browsers on different platforms.
It is recommended to add **polyfill.io** to the allowed hostnames
(walled garden) of the captive portal, otherwise the application will not
be able to load in old browsers.

### Configuring Sentry for proxy server

You can enable sentry logging for the proxy server by adding `sentry-env.json` in the
root folder. The `sentry-env.json` file should contain configuration as following:

```js
{
  ...
  "sentryTransportLogger": {
    // These options are passed to sentry SDK. Read more about available
    // options at https://github.com/aandrewww/winston-transport-sentry-node#sentry-common-options
    "sentry": {
      "dsn": "https://examplePublicKey@o0.ingest.sentry.io/0"
    },
    // Following options are related to Winston's SentryTransport. You can read
    // more at https://github.com/aandrewww/winston-transport-sentry-node#transport-related-options
    "level": "warn",
    "levelsMap": {
      "silly": "debug",
      "verbose": "debug",
      "info": "info",
      "debug": "debug",
      "warn": "warning",
      "error": "error"
    }
  }
  ...
}
```

**Note:** You can take reference from
[sentry-env.sample.json](https://github.com/openwisp/openwisp-wifi-login-pages/blob/master/sentry-env.sample.json)

### License

See [LICENSE](https://github.com/openwisp/openwisp-wifi-login-pages/blob/master/LICENSE).
