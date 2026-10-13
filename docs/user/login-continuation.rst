Post-Login Navigation
=====================

Add a ``next`` parameter to the login URL of an organization to open a
particular page after the user logs in. For example, to send users to the
change password page right after they log in:

.. code-block:: shell

    # https://<wlp-host>/<organization-slug>/login?next=%2F<organization-slug>%2Fchange-password
    https://wifi.openwisp.io/default/login?next=%2Fdefault%2Fchange-password


Supported Destinations
----------------------

The destination must be a path of the same organization, one of:
``status``, ``change-password``, ``change-phone-number``,
``payment/process``, ``payment/draft``, ``payment/success`` or
``payment/failed``.

Any other value (external URLs, other organizations, unknown pages, query
strings or fragments) is ignored and the user follows the usual login
navigation.

Behavior
--------

- ``next`` does not bypass authentication: the user must log in first.
- Mandatory steps (completing the signup, paying with a bank card,
  verifying the phone number, changing an expired password) always take
  precedence over ``next``.
- The destination is opened only after the captive portal login is
  completed. If the captive portal login fails, ``next`` is discarded.
- If the user is already logged in, the login page redirects to the status
  page as usual and ``next`` is ignored.
- ``next`` is valid for 30 minutes and for the browser tab in which the
  login page was opened.
