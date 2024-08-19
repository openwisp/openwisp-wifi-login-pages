#!/bin/sh

TEMPLATE_DIR=/opt/openwisp/wifi-login-pages/organizations.templates
YAML_DIR=/opt/openwisp/wifi-login-pages/organizations
for f in "${TEMPLATE_DIR}"/*; do
    ORG_NAME="$(basename "${f}")"
    if [[ -f "${TEMPLATE_DIR}/${ORG_NAME}/${ORG_NAME}.yml" ]]; then
        echo "Templating organization ${ORG_NAME}... out to ${YAML_DIR}/${ORG_NAME}/${ORG_NAME}.yml"
        mkdir -p "${YAML_DIR}/${ORG_NAME}"
        envsubst <"${TEMPLATE_DIR}/${ORG_NAME}/${ORG_NAME}.yml" >"${YAML_DIR}/${ORG_NAME}/${ORG_NAME}.yml"
    fi
done

yarn setup && yarn build
