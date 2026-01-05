####################################################
 Allowing Users to Manage Account from the Internet
####################################################

The authentication flow might hang if a user tries to access their account
from the public internet (without connecting to the WiFi service). It
occurs because the **OpenWISP WiFi Login Page** waits for a response from
the captive portal, which is usually inaccessible from the public
internet. If your infrastructure has such a configuration then, follow the
below instructions to avoid hanging of authentication flow.

Create a small web application which can serve the endpoints entered in
``captive_portal_login_form.action`` and
``captive_portal_logout_form.action`` of organization configuration.

The web application should serve the following HTML on those endpoints:

.. code-block:: html

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

.. note::

    Replace ``https://wifi-login-pages.example.com/`` with ``origin`` of
    your **OpenWISP WiFi Login Pages** service.

Assign a dedicated DNS name to be used by both systems: the captive portal
and the web application which simulates it. Then configure your captive
portal to resolve this DNS name to its IP, while the public DNS resolution
should point to the mock app just created. This way captive portal login
and logout requests will not hang, allowing users to view/modify their
account data also from the public internet.
