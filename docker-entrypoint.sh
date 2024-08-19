#!/bin/sh

source utils.sh

download_organization_configuration

yarn setup && yarn build

envsubst '$$VIRTUAL_HOST $$SERVER $$CLIENT' < ./wif_login_pages.template > /etc/nginx/nginx.conf

rsync -av /opt/openwisp/wifi-login-pages/dist /usr/share/nginx/html

#chmod -R 600 ./organizations
