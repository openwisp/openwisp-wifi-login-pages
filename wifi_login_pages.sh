#!/bin/sh

# This script will be called by cronjob to
# update OpenVPN configurations periodically.
source utils.sh

organizations_config_checksum

if [ "${OFILE}" != "${NFILE}" ]; then

   echo "The file has not changed."

	download_organization_configuration

	yarn setup && yarn build

	rsync -av /opt/openwisp/wifi-login-pages/dist /usr/share/nginx/html

	pm2 reload all
fi
