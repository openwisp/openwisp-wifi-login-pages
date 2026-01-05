WiFi Login Pages: Features
==========================

OpenWISP WiFi login pages offers the following features:

- Mobile first design (responsive UI)
- Sign up
- Optional support for mobile phone verification: verify phone number by
  inserting token sent via SMS, resend the SMS token
- :ref:`Login to the WiFi service <wlp_captive_portal_login_form>` (by
  getting a radius user token from OpenWISP Radius and sending a POST to
  the captive portal login URL behind the scenes)
- Session status information
- :ref:`Logout from the WiFi service <wlp_captive_portal_logout_form>` (by
  sending a POST to the captive portal logout URL behind the scenes)
- Change password
- Reset password (password forgot)
- Support for :ref:`Social Login <wlp_socialLogin>` and :ref:`SAML
  <wlp_saml>`
- Optional social login buttons (Facebook, Google, X/Twitter)
- :ref:`Contact box <wlp_contact_box>` showing the support email and/or
  phone number, as well as additional links specified via configuration
- :ref:`Navigation menu <wlp_menu_items>` (header and footer) with the
  possibility of specifying if links should be shown to every user or only
  authenticated or unauthenticated users
- :doc:`Support for multiple organizations <./setup>` with the possibility
  of :ref:`customizing the theme via CSS for each organization
  <wlp_custom_css>`
- :doc:`Support for multiple languages <./translations>`
- Possibility to :ref:`change any text used in the pages
  <wlp_custom_html>`
- Configurable :ref:`Terms of Services and Privacy Policy for each
  organization <wlp_tos_privacyPolicy>`
- Possibility of :ref:`automatically logging in users who signed in
  previously <automatic_captive_portal_login>` (if the captive portal
  browser of their operating system supports cookies)
- Support for :ref:`credit/debit card verification and paid subscription
  plans <wlp_signup_with_payment>`

Screenshots
-----------

.. figure:: https://raw.githubusercontent.com/openwisp/openwisp-wifi-login-pages/media/docs/login-desktop.png
    :target: https://raw.githubusercontent.com/openwisp/openwisp-wifi-login-pages/media/docs/login-desktop.png
    :align: center

.. figure:: https://raw.githubusercontent.com/openwisp/openwisp-wifi-login-pages/media/docs/sign-up-desktop.png
    :target: https://raw.githubusercontent.com/openwisp/openwisp-wifi-login-pages/media/docs/sign-up-desktop.png
    :align: center

.. figure:: https://raw.githubusercontent.com/openwisp/openwisp-wifi-login-pages/media/docs/verify-mobile-phone-desktop.png
    :target: https://raw.githubusercontent.com/openwisp/openwisp-wifi-login-pages/media/docs/verify-mobile-phone-desktop.png
    :align: center

.. figure:: https://raw.githubusercontent.com/openwisp/openwisp-wifi-login-pages/media/docs/login-mobile.png
    :target: https://raw.githubusercontent.com/openwisp/openwisp-wifi-login-pages/media/docs/login-mobile.png
    :align: center

.. figure:: https://raw.githubusercontent.com/openwisp/openwisp-wifi-login-pages/media/docs/signup-mobile.png
    :target: https://raw.githubusercontent.com/openwisp/openwisp-wifi-login-pages/media/docs/signup-mobile.png
    :align: center
