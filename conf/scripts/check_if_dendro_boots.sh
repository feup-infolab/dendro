#!/usr/bin/env bash

# starts containers with the volumes mounted
function wait_for_server_to_boot_on_port()
{
    local ip=$1

    if [[ $ip == "" ]]; then
      ip="127.0.0.1"
    fi
    local port=$2
    local attempts=0
    local max_attempts=60

    echo "Waiting for server on $ip:$port to boot up..."

    response=$(curl -s $ip:$port)
    echo $response

	until curl --output /dev/null --silent --head --fail http://$ip:$port || [[ $attempts > $max_attempts ]]; do
        attempts=$((attempts+1))
        echo "waiting... (${attempts}/${max_attempts})"
        sleep 1;
	done

    if (( $attempts == $max_attempts ));
    then
        echo "Server on $ip:$port failed to start after $max_attempts"
    elif (( $attempts < $max_attempts ));
    then
        echo "Server on $ip:$port started successfully at attempt (${attempts}/${max_attempts})"
    fi
}

DENDRO_PORT=$1

wait_for_server_to_boot_on_port "127.0.0.1" "$DENDRO_PORT"
