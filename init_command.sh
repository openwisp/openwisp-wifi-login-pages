#!/bin/sh
# OpenWISP common module init script
set -e

source ./utils.sh

wait_nginx_services

pm2-runtime start ecosystem.config.js

exec "$@"
