Settings
========

The main settings available in the organization YAML file are explained
below.

.. contents::
    :depth: 1
    :local:

Captive Portal Settings
-----------------------

.. _wlp_captive_portal_login_form:

``captive_portal_login_form``
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

This configuration section allows you to configure the hidden HTML form
that submits the username, password, and any other required parameters to
the captive portal to authenticate the user, after the credentials have
been first verified via the OpenWISP REST API.

Let's take the following configuration sample for reference:

.. code-block:: yaml

    captive_portal_login_form:
      method: post
      action: https://captiveportal.wifiservice.com:8080/login/
      fields:
        username: username_field
        password: password_field
      additional_fields:
        - name: field1
          value: value1
        - name: field2
          value: value2

The example above will result in a HTML form like the following:

.. code-block:: html

    <form method="post" action="https://captiveportal.wifiservice.com:8080/login/">
      <input type="text" name="username_field" />
      <input type="password" name="password_field" />
      <input type="hidden" name="field1" value="value1" />
      <input type="hidden" name="field2" value="value2" />
    </form>

You can adjust any parameter based on the expectations of the captive
portal: most captive portal programs expect ``POST`` requests, although
some may also accept ``GET``. The input names for ``username`` and
``password`` may vary and will likely require customization.

For instance, PfSense expects ``auth_user`` and ``auth_pass``, while
Coova-Chilli expects ``username`` and ``password``.

The ``additional_fields`` section allows you to specify any additional
fields required by the captive portal. For instance, with PfSense, you
need to include an extra field called ``zone``, because PfSense allows
defining multiple “Captive Portal Zones” with different configurations.

If you don't require any additional fields, simply set this section to an
empty array ``[]``, e.g.:

.. code-block:: yaml

    additional_fields: []

.. _wlp_captive_portal_logout_form:

``captive_portal_logout_form``
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

This configuration section allows you to configure captive portal logout
mechanism that allows users to close their browsing session.

Let's take the following configuration sample for reference:

.. code-block:: yaml

    captive_portal_logout_form:
      method: post
      action: https://captiveportal.wifiservice.com:8080/logout/
      fields:
        id: logout_id
      additional_fields:
        - name: field1
          value: value1
        - name: field2
          value: value2

The example above will result in a HTML form like the following:

.. code-block:: html

    <form method="post" action="https://captiveportal.wifiservice.com:8080/logout/">
      <input type="text" name="logout_id" value="{{ session_id }}" />
      <input type="hidden" name="field1" value="value1" />
      <input type="hidden" name="field2" value="value2" />
    </form>

In the example above, ``{{ session_id }}`` represents the ID of the RADIUS
session. This value is provided by WiFi Login Pages and retrieved via the
OpenWISP RADIUS REST API. Some captive portals, like PfSense, require this
information to complete the logout process successfully.

You can adjust any other parameter based on the expectations of the
captive portal: most captive portal programs expect ``POST`` requests,
although some may also accept ``GET``.

.. code-block:: yaml

    additional_fields: []

.. _wlp_menu_items:

Menu Items
----------

By default, menu items are visible to any user, but it's possible to
configure some items to be visible only to authenticated users,
unauthenticated users, verified users, unverified users or users
registered with specific registration methods by specifying the
``authenticated``, ``verified``, ``methods_only`` and ``methods_excluded``
properties.

- ``authenticated: true`` means visible only to authenticated users.
- ``authenticated: false`` means visible only to unauthenticated users.
- ``verified: true`` means visible to authenticated and verified users.
- ``verified: false`` means visible to only authenticated and unverified
  users.
- ``methods_only: ["mobile_phone"]`` means visible only to users
  registered with mobile phone verification.
- ``methods_excluded: ["saml", "social_login"]`` means not visible to
  users which sign in using SAML and social login.
- unspecified: link will be visible to any user (default behavior)

Let us consider the following configuration for the header, footer and
contact components:

.. code-block:: yaml

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

With the configuration above:

- ``support`` (from Contact) and ``about`` (from Header and Footer) links
  will be visible to any user.
- ``sign up`` (from Header) link will be visible to only unauthenticated
  users.
- the link to ``twitter`` (from Contact) and ``change password`` (from
  Header) links will be visible to only authenticated users
- change password will not be visible to users which sign in with social
  login or single sign-on (SAML)
- change mobile phone number will only be visible to users which have
  signed up with mobile phone verification

**Notes**:

- ``methods_only`` and ``methods_excluded`` only make sense for links
  which are visible to authenticated users
- using both ``methods_excluded`` and ``methods_only`` on the same link
  does not make sense

User Fields in Registration Form
--------------------------------

The ``setting`` attribute of the fields ``first_name``, ``last_name``,
``location`` and ``birth_date`` can be used to indicate whether the fields
shall be disabled (the default setting), allowed but not required or
required.

The ``setting`` option can take any of the following values:

- ``disabled``: (**the default value**) fields with this setting won't be
  shown.
- ``allowed``: fields with this setting are shown but not required.
- ``mandatory``: fields with this setting are shown and required.

Keep in mind that this configuration must mirror the :ref:`configuration of
openwisp-radius (OPENWISP_RADIUS_OPTIONAL_REGISTRATION_FIELDS)
<openwisp_radius_optional_registration_fields>`.
Username Field in Login Form
----------------------------

The username field in the login form is automatically set to either a
phone number input or an email text input depending on whether
``mobile_phone_verification`` is enabled or not.

However, it is possible to force the use of a standard text field if
needed, for example, we may need to configure the username field to accept
any value so that the :ref:`OpenWISP Users Authentication Backend
<usersauthenticationbackend>` can then figure out if the value passed is a
phone number, an email or a username:

.. code-block:: yaml

    login_form:
      input_fields:
        username:
          auto_switch_phone_input: false
          type: "text"
          pattern: null

.. _wlp_social_login:

Configuring Social Login
------------------------

In order to enable users to log via third-party services like Google and
Facebook, the
:doc:`Social Login feature of OpenWISP Radius </radius/user/social_login>`
must be configured and enabled.

.. _wlp_custom_css:

Custom CSS Files
----------------

It's possible to specify multiple CSS files if needed.

.. code-block:: yaml

    client:
      css:
        - "index.css"
        - "custom.css"

Adding multiple CSS files can be useful when working with :ref:`variants
<wlp_org_variants>`.

.. _wlp_custom_html:

Custom HTML
-----------

It is possible to inject custom HTML in different languages in several
parts of the application if needed.

Second Logo
~~~~~~~~~~~

.. code-block:: yaml

    header:
      logo:
        url: "logo1.png"
        alternate_text: "logo1"
      second_logo:
        url: "logo2.png"
        alternate_text: "logo2"

Sticky Message
--------------

.. code-block:: yaml

    header:
      sticky_html:
        en: >
          <p class="announcement">
            This site will go in schedule maintenance
            <b>tonight (10pm - 11pm)</b>
          </p>

Login Page
~~~~~~~~~~

.. code-block:: yaml

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

.. _wlp_contact_box:

Contact Box
~~~~~~~~~~~

.. code-block:: yaml

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

Footer
~~~~~~

.. code-block:: yaml

    footer:
      after_html:
        en: >
          <div class="contact">
            Shown at the bottom of the footer.
            Can be used to display copyright information, links to cookie policy, etc.
          </div>

.. _wlp_saml:

Configuring SAML Login & Logout
-------------------------------

To enable SAML login, the
:doc:`SAML feature of OpenWISP RADIUS </radius/user/saml>` must
be enabled.

The only additional configuration needed is ``saml_logout_url``, which is
needed to perform SAML logout.

.. code-block:: yaml

    status_page:
      # other conf
      saml_logout_url: "https://openwisp.myservice.org/radius/saml2/logout/"

.. _wlp_tos_privacy_policy:

TOS & Privacy Policy
--------------------

The terms of services and privacy policy pages are generated from markdown
files which are specified in the YAML configuration.

The markdown files specified in the YAML configuration should be placed
in: ``/organizations/{orgSlug}/server_assets/``.

Configuring Logging
-------------------

There are certain environment variables used to configure server logging.
The details of environment variables to configure logging are mentioned
below:

==================== ====================================================
Environment Variable Detail
==================== ====================================================
**LOG_LEVEL**        (optional) This can be used to set the level of
                     logging. The available values are ``error``,
                     ``warn``, ``info``, ``http``, ``verbose``, ``debug``
                     and ``silly``. By default log level is set to
                     ``warn`` for production.
**ALL_LOG_FILE**     (optional) To configure the path of the log file for
                     all logs. The default path is ``logs/all.log``
**ERROR_LOG_FILE**   (optional) To configure the path of the log file for
                     error logs. The default path is ``logs/error.log``
**WARN_LOG_FILE**    (optional) To configure the path of the log file for
                     warn logs. The default path is ``logs/warn.log``
**INFO_LOG_FILE**    (optional) To configure the path of the log file for
                     info logs. The default path is ``logs/info.log``
**HTTP_LOG_FILE**    (optional) To configure the path of the log file for
                     http logs. The default path is ``logs/http.log``
**DEBUG_LOG_FILE**   (optional) To configure the path of the log file for
                     http logs. The default path is ``logs/debug.log``
==================== ====================================================

Mocking Captive Portal Login and Logout
---------------------------------------

During the development stage, the captive portal login and logout
operations can be mocked by using the
:ref:`OpenWISP RADIUS captive portal mock views <radius_captive_portal_mock_views>`.

These URLs from OpenWISP RADIUS will be used by default in the development
environment. The captive portal login and logout URLs and their parameters
can be changed by editing the YAML configuration file of the respective
organization.

.. _wlp_signup_with_payment:

Sign Up with Payment Flow
-------------------------

This application supports sign up with payment flows, either a one time
payment, a free debit/credit card transaction for identity verification
purposes or a subscription with periodic payments.

In order to work, this feature needs the premium **OpenWISP
Subscriptions** module (`get in touch with commercial support
<https://openwisp.org/support.html>`__ for more information).

Once the module mentioned above is installed and configured, in order to
enable this feature, just create a new organization with the ``yarn run
add-org`` command and answer ``yes`` to the following question:
