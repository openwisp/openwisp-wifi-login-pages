Loading extra javascript files
==============================

It is possible to load extra javascript files, which may be needed for
different reasons like error monitoring (Sentry), analytics (Piwik, Google
analytics), etc.

It's possible to accomplish this in two ways which are explained below.

1. Loading extra javascript files for whole application (all organizations)
---------------------------------------------------------------------------

Place the javascript files in ``organizations/js`` directory and it will
be injected in HTML during the webpack build process for all the
organizations.

These scripts are loaded before all the other Javascript code is loaded.
This is done on purpose to ensure that any error monitoring code is loaded
before everything else.

This feature should be used only for critical custom Javascript code.

2. Loading extra javascript files for a specific organization
-------------------------------------------------------------

Add the names of the extra javascript files in organization configuration.
Example:

.. code-block:: yaml

    client:
      js:
        - "piwik-script.js"
        - "google-analytics.js"

Make sure that all these extra javascript files are be present in the
``organizations/<org-slug>/client_assets`` directory.

These scripts are loaded only after the rest of the page has finished
loading.

This feature can be used to load non-critical custom Javascript code.
