#!/bin/bash

TIMEOUT=300  # 5 minutes in seconds
INTERVAL=5   # seconds between checks

for url in "$@"; do
    echo "Checking $url..."
    elapsed=0
    until $(curl --output /dev/null --silent --head --fail "$url"); do
        if [ $elapsed -ge $TIMEOUT ]; then
            echo "Timeout reached: $url is still not reachable."
            exit 1
        fi
        echo "Waiting for ${url} to build ... ($elapsed/$TIMEOUT sec)"
        sleep $INTERVAL
        elapsed=$((elapsed + INTERVAL))
    done
    echo "Build successful: $url is reachable."
done
