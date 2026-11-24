#!/bin/bash
# Install dependencies for CI and review without starting services or builds.
set -e
if [ "${CI_SYSTEM_DEPS_READY:-0}" != 1 ] && [ "${CI_QA:-0}" != 1 ]; then
    sudo apt update -qq
    sudo apt install -qq -y libssl-dev libffi-dev
fi
if [ "${CI_SYSTEM_DEPS_ONLY:-0}" = 1 ]; then
    exit 0
fi
yarn install
if [ "${CI_QA:-0}" = 1 ]; then
    python -m pip install -r requirements-qa.txt
fi
