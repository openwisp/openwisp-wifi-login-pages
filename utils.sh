#!/bin/sh

# shellcheck disable=SC2113
function download_organization_configuration {
	wget -qO organization.tar.gz --no-check-certificate \
		${API_INTERNAL}/api/v1/organization/download/config/
	wget -qO checksum --no-check-certificate \
		${API_INTERNAL}/api/v1/organization/download/config/

		mkdir /tmp/organizations
	tar -xvf organization.tar.gz -C /tmp/organizations
	# Define source and destination directories
  SOURCE_DIR="./organizations/default"

  DEST_DIR="/tmp/organizations"
  for SUBDIR in "$DEST_DIR"/*/; do
    # Check if it is indeed a directory
    if [ -d "$SUBDIR" ]; then
        echo "Copying contents of $SOURCE_DIR to $SUBDIR"
        cp -r "$SOURCE_DIR"/* "$SUBDIR"
    fi
done

echo "Done copying files to all subdirectories."
	rsync -av /tmp/organizations/ ./organizations
	chmod -R 600 ./organizations
	rm -rf /tmp/organizations
}

function organizations_config_checksum {
	export OFILE=$(wget -qO - --no-check-certificate \
		${API_INTERNAL}/api/v1/organization/download/config/)
	export NFILE=$(cat checksum)
}

function wait_nginx_services {
	# Wait for nginx to start up and then check
	# if the openwisp-dashboard is reachable.
	echo "Waiting for dashboard to become available..."
	# Make fault tolerant to ensure connection
	# error report by `wget` is received.
	set +e
	while :; do
		wget -qS ${DASHBOARD_INTERNAL}/admin/login/ 2>&1 | grep -q "200 OK"
		if [[ $? = "0" ]]; then
			FAILURE=0
			echo "Connection with dashboard established."
			break
		fi
		sleep 5
	done
	set -e # Restore previous error setting.
}
