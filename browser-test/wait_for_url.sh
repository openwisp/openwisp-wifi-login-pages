#!/bin/bash

for url in "$@"
do
    until $(curl --output /dev/null --silent --head --fail $url); do
        echo "Waiting for ${url} to build ..."
        sleep 5
    done
    echo "Build successful: $url is reachable."
done


