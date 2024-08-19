#!/bin/sh
# OpenWISP common module init script
set -e

source utils.sh

#envsubst '$$VIRTUAL_HOST $$SERVER $$CLIENT' < ./wif_login_pages.template > /etc/nginx/nginx.conf

wait_nginx_services

download_organization_configuration

yarn setup && yarn build

echo "*/1 * * * * sh /wifi_login_pages.sh" | crontab -
	(
		crontab -l
		echo "0 3 * * 7 sh /wifi_login_pages.sh"
	) | crontab -
	crond
# Supervisor is used to start the service because OpenVPN
# needs to restart after crl list is updated or configurations
# are changed. If OpenVPN as the service keeping the
# docker container running, restarting would mean killing
# the container while supervisor helps only to restart the service!
supervisord --nodaemon --configuration supervisord.conf

exec "$@"
