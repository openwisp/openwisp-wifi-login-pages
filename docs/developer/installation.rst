Developer Installation Instructions
===================================

.. include:: ../partials/developer-docs.rst

.. contents:: **Table of contents**:
    :depth: 1
    :local:

Dependencies
------------

- `NodeJs <https://nodejs.org/en/>`__ >= 20.9.0
- `NPM <https://npmjs.org/>`__ - Node package manager >= 10.1.0
- `yarn <https://yarnpkg.com/>`__ - Yarn package manager >= 1.19.1

Prerequisites
-------------

OpenWISP RADIUS
~~~~~~~~~~~~~~~

OpenWISP WiFi Login Pages is a frontend for :doc:`OpenWISP RADIUS
</radius/index>`. In order to use it, this app needs a running instance of
OpenWISP RADIUS and an organization correctly configured, you can obtain
this by following these steps:

- Follow the instructions :doc:`to install OpenWISP RADIUS for development
  </radius/developer/installation>`.
- After successfully starting the OpenWISP RADIUS server, open a browser
  and visit: ``http://localhost:8000/admin/``, then sign in with the
  credentials of the ``superuser`` we created during the installation of
  ``openwisp-radius``.
- Visit the change page of the organization you want to add to this module
  and note down the following parameters: ``name``, ``slug``, ``uuid`` and
  ``token`` (from the Organization RADIUS Settings).

Installing for Development
--------------------------

Fork and clone the forked repository:

.. code-block:: shell

    git clone https://github.com/<your_fork>/openwisp-wifi-login-pages.git

Navigate into the cloned repository:

.. code-block:: shell

    cd openwisp-wifi-login-pages

Install the dependencies:

.. code-block:: shell

    yarn

Launch development server:

.. code-block:: shell

    yarn start

You can access the application at http://localhost:8080/default/login/

Run tests with:

.. code-block::

    # ensure dev server is started, eg:
    yarn start &

    # run tests
    yarn test

ESM Support in Jest
-------------------

Some modern Node.js packages use ESM format which can cause Jest tests to
fail with ``SyntaxError: Unexpected token 'export'``. This happens because
Jest doesn't transform ``node_modules`` by default.

To fix this, add ESM packages to Jest's ``transformIgnorePatterns`` in the
``package.json`` file:

.. code-block:: json

    {
      "jest": {
        "transformIgnorePatterns": [
          "node_modules/(?!(package-name|another-package|.*\\.mjs$))"
        ]
      }
    }

Running Automated Browser Tests
-------------------------------

Prerequisites for running browser tests:

1. `Gecko driver <https://github.com/mozilla/geckodriver/releases/>`__
   needs to be installed.
2. Having running instances of openwisp-radius and
   openwisp-wifi-login-pages is required.
3. ``OPENWIPS_RADIUS_PATH`` environment variable is needed to setup/tear
   down the database needed to run the browser tests. This can be set
   using the following command:

   .. code-block:: shell

       export OPENWISP_RADIUS_PATH=<PATH_TO_OPENWISP_RADIUS_DIRECTORY>

4. If a virtual environment is used to run openwisp-radius then this needs
   to be activated before running browser tests.
5. Configuration file of ``mobile`` organization is needed before running
   ``yarn start``. ``mobile`` organization can be created by running:

   .. code-block:: shell

       node browser-test/create-mobile-configuration.js

6. In the test environment of openwisp-radius, the ``default``
   organization must be present.

After doing all the prerequisites, you need to make sure OpenWISP RADIUS
is running:

.. code-block:: shell

    cd $OPENWISP_RADIUS_PATH
    # enable python virtual environment if needed
    ./manage.py runserver

Then, in another terminal, from the root directory of this repository, you
need to build this app and serve it:

.. code-block:: shell

    yarn build-dev
    yarn start

Then, in another terminal, from the root directory of this repository, you
can finally run the browser based tests:

.. code-block:: shell

    export OPENWISP_RADIUS_PATH=<PATH_TO_OPENWISP_RADIUS_DIRECTORY>
    # enable python virtual environment if needed
    yarn browser-test
