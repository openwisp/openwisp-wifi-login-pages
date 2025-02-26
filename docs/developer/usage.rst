Usage
=====

.. contents:: **Table of contents**:
    :depth: 2
    :local:

Yarn Commands
-------------

List of yarn commands:

.. code-block:: shell

    $ yarn start         # Run the app (runs both, client and server)
    $ yarn setup         # Discover Organization configs and generate config.json and asset directories
    $ yarn add-org       # Add new Organization configuration
    $ yarn build         # Build the app
    $ yarn server        # Run server
    $ yarn client        # Run client
    $ yarn coveralls     # Run coveralls
    $ yarn coverage      # Run tests and generate coverage files
    $ yarn lint          # Run ESLint
    $ yarn lint:fix      # Run ESLint with automatically fix problems option
    $ yarn format        # Run formatters to format the code
    $ yarn test          # Run tests
    $ yarn browser-test  # Run browser based selenium tests
    $ yarn -- -u         # Update Jest Snapshots

Using Custom Ports
------------------

To start the client and/or server on a port of your liking, you must set
environment variables before starting.

To run the client on port 4000 and the server on port 5000, use the
following command:

.. code-block::

    $ CLIENT=4000 SERVER=5000 yarn start

You can also run the client and server commands separately:

.. code-block::

    $ SERVER=5000 yarn server

.. code-block::

    $ CLIENT=4000 SERVER=5000 yarn client

Note that you need to tell the client the server's port (unless you're
using the default server port, which is 3030) so the client knows where he
can find the server.

Running webpack-bundle-analyzer
-------------------------------

This tool helps to keep the size of the JS files produced by the app in
check.

Run it with:

.. code-block::

    yarn stats
