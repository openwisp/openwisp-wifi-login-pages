#########################################
 Handling Captive Portal / RADIUS Errors
#########################################

This app can handle errors that may encountered during the authentication
process (e.g.: maximum available daily/monthly time or bandwidth have been
consumed).

To use this feature, you will have to update the error page of your
captive portal to use `postMessage
<https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage>`__
for forwarding any error message to **OpenWISP WiFi Login Pages**.

Here is an example of authentication error page for pfSense:

.. code-block:: html

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

.. note::

    Replace ``https://wifi-login-pages.example.com/`` with ``origin`` of
    your **OpenWISP WiFi Login Pages** service.

With the right configuration, the error messages coming from freeradius or
the captive portal will be visible to users on **OpenWISP WiFi Login
Pages**.
