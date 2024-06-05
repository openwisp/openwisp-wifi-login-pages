Setup
=====

Deploy for production
---------------------

An ansible role which can be used to deploy and maintain this app is
available, see `ansible-openwisp-wifi-login-pages
<https://github.com/openwisp/ansible-openwisp-wifi-login-pages>`_.

Add Organization configuration
------------------------------

Before users can login and sign up, you need to create the configuration
of the captive page for the related OpenWISP organization. You can get the
organization ``uuid``, ``slug`` and ``radius_secret`` from the
organization's admin in OpenWISP. Then, you can run:

.. code-block:: shell

    yarn add-org

This command will present a series of interactive questions which make it
easier for users to configure the application for their use case.

Once all the questions are answered, the script will create a new
directory, eg:

.. code-block:: text

    /organizations/{orgSlug}/
    /organizations/{orgSlug}/client_assets/
    /organizations/{orgSlug}/server_assets/
    /organizations/{orgSlug}/{orgSlug}.yml

The directory ``client_assets`` shall contain static files like CSS,
images, etc.

The directory ``server_assets`` is used for loading the content of
:ref:`Terms of Service and Privacy Policy <tos_privacy_policy>`.

The configuration of new organizations is generated from the template
present in ``/internals/generators/config.yml.hbs``.

The default configuration is stored at ``/internals/config/default.yml``.
If the configuration file of a specific organization misses a piece of
configuration, then the default configuration is used to generate a
complete configuration.

The above command will prompt you to fill in some properties.

Below is a table with these properties and a description of their values.

========================= ==========================================
Property                  Description
========================= ==========================================
name                      Required. Name of the organization.
slug                      Required. Slug of the organization.
uuid                      Required. UUID of the organization.
secret_key                Required. Token from organization radius
                          settings.
captive portal login URL  Required. Captive portal login action url
captive portal logout URL Required. Captive portal logout action url
openwisp radius url       Required. URL to openwisp-radius.
========================= ==========================================

Chose to copy the assets, then run:

.. code-block::

    yarn setup
    yarn start

**Note**: in a development environment where a captive portal may not be
available, you can use the default sample captive portal login and logout
URLs.

If you need to change these values or any other settings later, you can
edit the YAML file generated in the ``/organizations`` directory and
rebuild the project.

Removing sections of configuration
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

To remove a specific section of the configuration, the ``null`` keyword
can be used, this way the specific section flagged as ``null`` will be
removed during the build process.

For example, to remove social login links:

.. code-block:: yaml

    login_form:
      social_login:
        links: null

**Note:** Do not delete or edit default configuration
(``/internals/config/default.yml``) as it is required to build and compile
organization configurations.

Variants of the same configuration
----------------------------------

In some cases it may be needed to have different variants of the same
design but with different logos, or slightly different colors, wording and
so on, but all these variants would be tied to the same service.

In this case it's possible to create new YAML configuration files (eg:
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

**Note**: if a variant defines a configuration option which contains an
array/list of objects (eg: menu links), the array/list defined in the
variant always overwrites fully what is defined in the parent
configuration file.

Variant with different organization slug / UUID / secret
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
