openwisp-wifi-login-pages
=========================

.. image:: https://github.com/openwisp/openwisp-wifi-login-pages/workflows/OpenWisp%20WiFi%20Login%20Pages%20CI%20BUILD/badge.svg?branch=master
    :target: https://github.com/openwisp/openwisp-wifi-login-pages/actions

.. image:: https://coveralls.io/repos/github/openwisp/openwisp-wifi-login-pages/badge.svg
    :target: https://coveralls.io/github/openwisp/openwisp-wifi-login-pages

.. image:: https://img.shields.io/librariesio/release/github/openwisp/openwisp-wifi-login-pages
    :target: https://libraries.io/github/openwisp/openwisp-wifi-login-pages#repository_dependencies

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

-----------

**Need a quick overview?** `Try the OpenWISP Demo <https://openwisp.org/demo.html>`_.

**No more ugly and fragmented User Experience for public/private WiFi
services!**

OpenWISP WiFi login pages provides unified and consistent user experience
for public/private WiFi services.

In short, this app replaces the classic captive/login page of a WiFi
service by integrating the `OpenWISP Radius API
<https://openwisp-radius.readthedocs.io/>`__ to provide the following
features:

- Mobile first design (responsive UI)
- Sign up
- Optional support for mobile phone verification: verify phone number by
  inserting token sent via SMS, resend the SMS token
- Login to the wifi service (by getting a radius user token from OpenWISP
  Radius and sending a POST to the captive portal login URL behind the
  scenes)
- Session status information
- Logout from the wifi service (by sending a POST to the captive portal
  logout URL behind the scenes)
- Change password
- Reset password (password forgot)
- Support for `Social Login <#configuring-social-login>`__ and `SAML
  <#configuring-saml-login--logout>`__
- Optional social login buttons (facebook, google, twitter)
- Contact box allowing to show the support email and/or phone number, as
  well as additional links specified via configuration
- Navigation menu (header and footer) with possibility of specifying if
  links should be shown to every user or only authenticated or
  unauthenticated users
- Support for multiple organizations with possibility of customizing the
  theme via CSS for each organization
- Support for multiple languages
- Possibility to change any text used in the pages
- Configurable Terms of Services and Privacy Policy for each organization
- `Auto-login
  <https://openwisp.io/docs/tutorials/hotspot.html#automatic-captive-portal-login>`__:
  possibility of recognizing users thanks to signed cookies, which saves
  them from having to re-authenticate
- Support for `credit/debit card verification and paid subscription plans
  <#signup-with-payment-flow>`__

Documentation
-------------

- Developer documentation (TODO: add link)
- User documentation (TODO: add link)

Contributing
------------

Please refer to the `OpenWISP contributing guidelines <http://openwisp.io/docs/developer/contributing.html>`_.

Changelog
---------

See `Change log
<https://github.com/openwisp/openwisp-wifi-login-pages/blob/master/CHANGES.md>`__.

License
-------

See `LICENSE
<https://github.com/openwisp/openwisp-wifi-login-pages/blob/master/LICENSE>`__.

Support
-------

See `OpenWISP Support Channels <http://openwisp.org/support.html>`_.
