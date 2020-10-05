# openwisp-wifi-login-pages

<!-- Badges -->

[![Build Status](https://travis-ci.org/openwisp/openwisp-wifi-login-pages.svg?branch=master)](https://travis-ci.org/openwisp/openwisp-wifi-login-pages)
[![Coverage Status](https://coveralls.io/repos/github/openwisp/openwisp-wifi-login-pages/badge.svg)](https://coveralls.io/github/openwisp/openwisp-wifi-login-pages)
[![Dependencies Status](https://david-dm.org/openwisp/openwisp-wifi-login-pages/status.svg)](https://david-dm.org/openwisp/openwisp-wifi-login-pages)
[![devDependencies Status](https://david-dm.org/openwisp/openwisp-wifi-login-pages/dev-status.svg)](https://david-dm.org/openwisp/openwisp-wifi-login-pages?type=dev)

Openwisp wifi login pages app to allow users to authenticate, sign up and know more about the WiFi service they are using.

**Want to help OpenWISP?** [Find out how to help us grow here](http://openwisp.io/docs/general/help-us.html)

---

### Table of contents

- [Prerequisites](#prerequisites)
- [Install](#install)
- [Usage](#usage)
- [License](#license)

### Prerequisites

- [NodeJs](https://nodejs.org/en/)
- [NPM](https://npmjs.org/) - Node package manager

### Install

##### Clone this repo

```
git clone https://github.com/openwisp/openwisp-wifi-login-pages.git
```

##### Install dependencies

```
npm install
```

or

```
yarn
```

##### Update dependencies

```
npm update
```

or

```
yarn upgrade
```

### Setup

##### Add Organization configuration

Run `$ npm run add-org`
When you run this command you’re prompted to provide the following properties:

| Property          | Description                                       |
| ------------------| --------------------------------------------------|
| name              | Required. Name of the organization.`              |
| slug              | Required. Slug of the organization.               |
| uuid              | Required. UUID of the organization.               |
| secret_key        | Required. Token of the organization.              |

Copy all the assets to `client/assets/{slug}` directory
Run `$ npm run setup`
Start servers using `$ npm run start`

### Usage

List of NPM Commands:

```
$ npm run start			# Run the app (runs both, client and server)
$ npm run setup			# Discover Organization configs and generate config.json and asset directories
$ npm run add-org       # Add new Organization configuration
$ npm run build			# Build the app
$ npm run server		# Run server
$ npm run client		# Run client
$ npm run coveralls		# Run coveralls
$ npm run lint			# Run ESLint
$ npm run lint:fix 	 	# Run ESLint with automatically fix problems option
$ npm test 		    	# Run tests
$ npm test -- -u 		# Update Jest Snapshots
```

#### Error Logs :

Server Error logs are generated at /logs/error.log

Run the command to read the logs using Bash (Linux) :

`$ tail -f ./logs/error.log`


#### Using custom ports

To start the client and/or server on a port of your liking, you must set environment
variables before starting.

**To run the client on port 4000 and the server on port 5000, use the following command:**

Bash (Linux):

```
$ CLIENT=4000 SERVER=5000 npm run start
```

Powershell (Windows):

```
PS> $env:CLIENT = 4000; $env:SERVER = 5000; npm run start
```

**You can also run the client and server commands separately:**

Bash (Linux):

```
$ SERVER=5000 npm run server
```

```
$ CLIENT=4000 SERVER=5000 npm run client
```

Powershell (Windows):

```
PS> $env:SERVER = 5000; npm run server
```

```
PS> $env:CLIENT = 4000; $env:SERVER = 5000; npm run client
```

Note that you need to tell the client the server's port
(unless you're using the default server port, which is 3030)
so the client knows where he can find the server.

### License

See [LICENSE](https://github.com/openwisp/openwisp-wifi-login-pages/blob/master/LICENSE).
