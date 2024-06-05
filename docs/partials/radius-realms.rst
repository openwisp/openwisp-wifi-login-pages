Supporting realms (RADIUS proxy)
================================

To enable support for realms, set ``radius_realms`` to ``true`` as in the
example below:

.. code-block:: yaml

    ---
    name: "default name"
    slug: "default"

    settings:
      radius_realms: true

When support for ``radius_realms`` is ``true`` and the username inserted
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
