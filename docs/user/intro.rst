WiFi Login Pages: Features
==========================

OpenWISP WiFi login pages offers the following features:

- Mobile first design (responsive UI)
- Sign up
- Optional support for mobile phone verification: verify phone number by
  inserting token sent via SMS, resend the SMS token
- Login to the WiFi service (by getting a radius user token from OpenWISP
  Radius and sending a POST to the captive portal login URL behind the
  scenes)
- Session status information
- Logout from the WiFi service (by sending a POST to the captive portal
  logout URL behind the scenes)
- Change password
- Reset password (password forgot)
- Support for :ref:`Social Login <wlp_social_login>` and :ref:`SAML
  <wlp_saml>`
- Optional social login buttons (Facebook, Google, X/Twitter)
- Contact box showing the support email and/or phone number, as well as
  additional links specified via configuration
- Navigation menu (header and footer) with the possibility of specifying
  if links should be shown to every user or only authenticated or
  unauthenticated users
- Support for multiple organizations with the possibility of customizing
  the theme via CSS for each organization
- Support for multiple languages
- Possibility to change any text used in the pages
- Configurable Terms of Services and Privacy Policy for each organization
- Possibility of automatically logging in users who signed in previously
  (if the captive portal browser of their operating system supports
  cookies)
- Support for :ref:`credit/debit card verification and paid subscription
  plans <wlp_signup_with_payment>`

Screenshots
-----------

.. figure:: https://github.com/openwisp/openwisp-wifi-login-pages/raw/media/docs/login-desktop.png
    :target: https://github.com/openwisp/openwisp-wifi-login-pages/raw/media/docs/login-desktop.png
    :align: center

.. figure:: https://github.com/openwisp/openwisp-wifi-login-pages/raw/media/docs/sign-up-desktop.png
    :target: https://github.com/openwisp/openwisp-wifi-login-pages/raw/media/docs/sign-up-desktop.png
    :align: center

.. figure:: https://github.com/openwisp/openwisp-wifi-login-pages/raw/media/docs/verify-mobile-phone-desktop.png
    :target: https://github.com/openwisp/openwisp-wifi-login-pages/raw/media/docs/verify-mobile-phone-desktop.png
    :align: center

.. figure:: https://github.com/openwisp/openwisp-wifi-login-pages/raw/media/docs/login-mobile.png
    :target: https://github.com/openwisp/openwisp-wifi-login-pages/raw/media/docs/login-mobile.png
    :align: center

.. figure:: https://github.com/openwisp/openwisp-wifi-login-pages/raw/media/docs/signup-mobile.png
    :target: https://github.com/openwisp/openwisp-wifi-login-pages/raw/media/docs/signup-mobile.png
    :align: center
