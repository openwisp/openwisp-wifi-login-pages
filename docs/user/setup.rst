Setup
=====

.. important::

    It is recommended to use the `ansible-openwisp-wifi-login-pages
    <https://github.com/openwisp/ansible-openwisp-wifi-login-pages>`_ for
    deploying OpenWISP WiFi Login Pages for production usage.

.. contents:: **Table of contents**:
    :depth: 2
    :local:

Add Organization configuration
------------------------------

Before users can login and sign up, you need to create the configuration
of the captive page for the related OpenWISP organization. You can get the
organization ``uuid``, ``slug`` and ``radius_secret`` from the
organization's admin in OpenWISP. After this, execute the following
command:

.. code-block:: shell

    yarn add-org

This command will present a series of interactive questions which make it
easier for users to configure the application for their use case. It will
prompt you to fill properties listed in the following table:

========================= ==========================================
Property                  Description
========================= ==========================================
name                      Required. Name of the organization.
slug                      Required. Slug of the organization.
uuid                      Required. UUID of the organization.
secret_key                Required. Token from organization radius
                          settings.
captive portal login URL  Required. Captive portal login action URL
captive portal logout URL Required. Captive portal logout action URL
openwisp radius URL       Required. URL to openwisp-radius.
========================= ==========================================

Once all the questions are answered, the script will create a new
directory, e.g.:

.. code-block:: text

    /organizations/{orgSlug}/
    /organizations/{orgSlug}/client_assets/
    /organizations/{orgSlug}/server_assets/
    /organizations/{orgSlug}/{orgSlug}.yml

The ``client_assets`` directory shall contain static files like CSS,
images, etc.. The ``server_assets`` directory is used for loading the
content of :ref:`Terms of Service and Privacy Policy
<wlp_tos_privacyPolicy>`. You can copy the desired files to these
directories.

.. note::

    The configuration of new organizations is generated from the template
    present in ``/internals/generators/config.yml.hbs``.

    The default configuration is stored at
    ``/internals/config/default.yml``. If the configuration file of a
    specific organization misses a piece of configuration, then the
    default configuration is used to generate a complete configuration.

Use the following commands to start the project:

.. code-block::

    yarn setup
    yarn start

If you need to change these values or any other settings later, you can
edit the YAML file generated in the ``/organizations`` directory and
rebuild the project.

Removing Sections of Configuration
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

To remove a specific section of the configuration, the ``null`` keyword
can be used, this way the specific section flagged as ``null`` will be
removed during the build process.

For example, to remove social login links:

.. code-block:: yaml

    login_form:
      socialLogin:
        links: null

.. note::

    Do not delete or edit default configuration
    (``/internals/config/default.yml``) as it is required to build and
    compile organization configurations.

.. _wlp_org_variants:

Variants of the Same Configuration
----------------------------------

In some cases it may be needed to have different variants of the same
design but with different logos, or slightly different colors, wording and
so on, but all these variants would be tied to the same service.

In this case it's possible to create new YAML configuration files (e.g.:
``variant1.yml``, ``variant2.yml``) in the directory
``/organizations/{orgSlug}/``, and specify only the configuration keys
which differ from the parent configuration.

Example variant of the default organization:

.. code-block:: yaml

    ---
    name: "Variant1"
    client:
      components:
        header:
          logo:
            url: "variant1-logo.svg"
            alternate_text: "variant1"

The configuration above has very little differences with the parent
configuration: the name and logo are different, the rest is inherited from
the parent organization.

Following example, the contents above should be placed in
``/organizations/default/variant1.yml`` and once the server is started
again this new variant will be visible at
``http://localhost:8080/default-variant1``.

It's possible to create multiple variants of different organizations, by
making sure ``default`` is replaced with the actual organization ``slug``
that is being used.

And of course it's possible to customize more than just the name and logo,
the example above has been kept short for brevity.

.. note::

    If a variant defines a configuration option which contains an
    array/list of objects (e.g.: menu links), the array/list defined in
    the variant always overwrites fully what is defined in the parent
    configuration file.

Variant with Different Organization Slug / UUID / Secret
--------------------------------------------------------

In some cases, different organizations may share an identical
configuration, with very minor differences. Variants can be used also in
these cases to minimize maintenance efforts.

The important thing to keep in mind is that the organization ``slug``,
``uuid``, ``secret_key`` need to be reset in the configuration file:

Example:

.. code-block:: yaml

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

Support for Old Browsers
------------------------

Polyfills are used to support old browsers on different platforms. It is
recommended to add **cdnjs.cloudflare.com** to the allowed hostnames
(walled garden) of the captive portal, otherwise the application will not
be able to load in old browsers.

Configuring Sentry for Proxy Server
-----------------------------------

You can enable sentry logging for the proxy server by adding
``sentry-env.json`` in the root folder. The ``sentry-env.json`` file
should contain configuration as following:

.. code-block:: javascript

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

You can take reference from `sentry-env.sample.json
<https://github.com/openwisp/openwisp-wifi-login-pages/blob/master/sentry-env.sample.json>`__

Supporting Realms (RADIUS Proxy)
--------------------------------

To enable support for realms, set ``radiusRealms`` to ``true`` as in the
example below:

.. code-block:: yaml

    ---
    name: "default name"
    slug: "default"

    settings:
      radiusRealms: true

When support for ``radiusRealms`` is ``true`` and the username inserted
in the username field by the user includes an ``@`` sign, the login page
will submit the credentials directly to the URL specified in
``captive_portal_login_form``, hence bypassing this app altogether.

Keep in mind that in this use case, since users are basically
authenticating against databases stored in other sources foreign to
OpenWISP but trusted by the RADIUS configuration, the wifi-login-pages app
stops making any sense, because users are registered elsewhere, do not
have a local account on OpenWISP, therefore won't be able to authenticate
nor change their personal details via the OpenWISP RADIUS API and this
app.
