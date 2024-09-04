#!/bin/sh

# This script will be called by cronjob to
# update OpenVPN configurations periodically.
source /opt/openwisp/wifi-login-pages/utils.sh

organizations_config_checksum

if [ "${OFILE}" != "${NFILE}" ]; then

  cd /opt/openwisp/wifi-login-pages/

   echo "The file has not changed."

	download_organization_configuration

	yarn setup && yarn build

fi
