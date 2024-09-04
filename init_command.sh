#!/bin/sh
# OpenWISP common module init script
set -e

source ./utils.sh

wait_nginx_services

	(
    crontab -l 2>/dev/null
    echo "*/1 * * * * sh /opt/openwisp/wifi-login-pages/wifi_login_pages.sh >> /proc/1/fd/1 2>> /proc/1/fd/2"
) | crontab -

# Add the second cron job (runs every Sunday at 3 AM)
(
    crontab -l 2>/dev/null
    echo "0 3 * * 7 sh /opt/openwisp/wifi-login-pages/wifi_login_pages.sh >> /proc/1/fd/1 2>> /proc/1/fd/2"
) | crontab -

# Start the cron daemon
crond

pm2-runtime start ecosystem.config.js

exec "$@"
