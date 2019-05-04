#!/usr/bin/env bash

# Set constants
VIRTUOSO_HOST=$(hostname -i | awk '{print $1}')
VIRTUOSO_ISQL_PORT="1111"
VIRTUOSO_CONDUCTOR_PORT="8890"
RECEIVED_TERMINATION_SIGNAL=false
IPTABLES_FILE=/root/initial.iptables.rules

run_isql_command()
{
  ISQL_COMMAND="$1"
  if [[ "$DBA_PASSWORD" != "" ]]
  then
    isql "$VIRTUOSO_HOST" "$VIRTUOSO_ISQL_PORT" -U "$VIRTUOSO_DBA_USER" -P "$DBA_PASSWORD" "$ISQL_COMMAND"
  else
    isql "$VIRTUOSO_HOST" "$VIRTUOSO_ISQL_PORT" -U "$VIRTUOSO_DBA_USER" "$ISQL_COMMAND"
  fi
}

# register exit handler to shut down virtuoso cleanly on Ctrl+C
exithandler()
{
    echo "SIGTERM or SIGINT detected. Shutting down virtuoso...!"
    RECEIVED_TERMINATION_SIGNAL=true
    run_isql_command "EXEC=checkpoint; shutdown;" || (echo "Error checkpointing and shutting down Virtuoso" && exit 1)
}

trap exithandler SIGTERM
echo "Registered handler for SIGTERM"
trap exithandler SIGINT
echo "Registered handler for SIGINT"
trap exithandler SIGQUIT
echo "Registered handler for SIGQUIT"

ip --oneline address show

function block_ports_except_for_loopback()
{
  echo "Blocking port $VIRTUOSO_ISQL_PORT and $VIRTUOSO_CONDUCTOR_PORT for all non-loopback access"
  iptables-save > "$IPTABLES_FILE"

  # https://medium.com/@ebuschini/iptables-and-docker-95e2496f0b45
  # https://gist.github.com/tehmoon/b1c3ae5e9a67d66186361d4728bed799#file-iptables-reload-sh

  # First we create a new chain before the PREROUTING one, redirecting all packets to it
  #iptables -t nat -N DOCKER-BLOCK || true
  #iptables -t nat -I PREROUTING -m addrtype -j DOCKER-BLOCK

  #iptables -A DOCKER-BLOCK -p tcp -i lo --dport "$VIRTUOSO_ISQL_PORT" -j ACCEPT
  #iptables -A DOCKER-BLOCK -p tcp -i lo --dport "$VIRTUOSO_CONDUCTOR_PORT" -j ACCEPT

  iptables -A INPUT -i eth0 -p tcp --destination-port $VIRTUOSO_ISQL_PORT -j DROP
  iptables -A INPUT -i eth0 -p tcp --destination-port $VIRTUOSO_CONDUCTOR_PORT -j DROP
}

function restore_network_access()
{
  echo "Restoring network access..."
  iptables-restore < "$IPTABLES_FILE"
}

function server_is_online()
{
  local ip=$1
  local port=$2
  local text_to_find="$3"
  local response

  if [[ "$text_to_find" == "" ]];
  then
    echo "Waiting for server at $ip:$port to boot up..."
    response=$(curl --silent --verbose "$ip:$port")
    if [[ "$?" != "0" ]]; then
      nc -z "$ip" "$port"
      if [[ "$?" == "0" ]]; then
        echo "Server IS ONLINE (checked via netcat)!"
        return 0
      else
        echo "Server is not online. Response was $response"
        return 1
      fi
    else
      echo "Server IS ONLINE! Response was $response"
      return 0
    fi
  else
    echo "Waiting for server at $ip:$port to boot up and respond with something like $text_to_find"
    response=$(curl --silent --verbose --fail "$ip:$port")

    if [[ "$?" != "0" ]]; then
      if [[ "$response" == *$text_to_find* ]];
      then
        echo "Server IS ONLINE! Response was $response, which includes $text_to_find"
        return 0
      else
        echo "Server is not online. Response was $response"
        return 1
      fi
    else
      echo "Server IS ONLINE! Response was $response"
      return 0
    fi
  fi
}

# starts containers with the volumes mounted
function wait_for_server_to_boot_on_port()
{
    local ip=$1
    local port=$2
    local text_to_find=$3

    if [[ $ip == "" ]]; then
      ip="127.0.0.1"
    fi

    local attempts
    local max_attempts=60

    attempts=0

	  until \
      server_is_online $ip $port "$text_to_find" || (( $attempts > $max_attempts )) \
    ; do
        ((attempts=attempts+1))
        echo "Waiting... ${attempts}/${max_attempts}"
        sleep 1;
        response=$(curl -s $ip:$port)
	  done

    if (( $attempts >= $max_attempts ));
    then
        echo "Server on $ip:$port failed to start after $max_attempts"
    elif (( $attempts < $max_attempts ));
    then
        echo "Server on $ip:$port started successfully at attempt (${attempts}/${max_attempts})"
    fi
}

function start_virtuoso()
{
	/bin/bash -c "$ORIGINAL_VIRTUOSO_STARTUP_SCRIPT" &
  VIRTUOSO_PID=$!
  wait_for_server_to_boot_on_port "$VIRTUOSO_HOST" "$VIRTUOSO_ISQL_PORT"

  return $VIRTUOSO_PID
}

function set_log_level_to_3()
{
    echo "Setting log level to 3 for safer data saving in virtuoso"
    run_isql_command "exec=log_enable(3);" || (echo "Error setting log level to 3 in virtuoso." && exit 1)
}

function source_virtuoso()
{
  local VIRTUOSO_PID
  echo "Sourcing virtuoso to start server...  2"
  /bin/bash -c "$ORIGINAL_VIRTUOSO_STARTUP_SCRIPT" &
  VIRTUOSO_PID="$!"
  #wait "$VIRTUOSO_PID"

  wait_for_server_to_boot_on_port "$VIRTUOSO_HOST" "$VIRTUOSO_ISQL_PORT"
  wait_for_server_to_boot_on_port "$VIRTUOSO_HOST" "$VIRTUOSO_CONDUCTOR_PORT" "HTTP/1.1 200 OK"
  restore_network_access
  echo "Dendro running.... (PID $VIRTUOSO_PID)"

  ATTEMPTS=40
  while kill -0 "$VIRTUOSO_PID"
  do
    if [[ "$RECEIVED_TERMINATION_SIGNAL" = true ]]
    then
      if [[ $ATTEMPTS -eq 0 ]]; then
        echo "Virtuoso shutdown timed out! Forcing shutdown!"
        kill -9 "$VIRTUOSO_PID" & wait
        exit 1
      else
        ATTEMPTS=$((ATTEMPTS - 1))
        echo "Virtuoso shutdown in progress... $ATTEMPTS attempts remaining..."
      fi
    fi
    sleep 0.5
  done
  echo "Dendro was stopped."
}

function perform_initialization()
{
    #
    # Wait for virtuoso server to boot up
    #
    start_virtuoso
    VIRTUOSO_PID="$?"

    wait_for_server_to_boot_on_port "$VIRTUOSO_HOST" "$VIRTUOSO_ISQL_PORT"
    wait_for_server_to_boot_on_port "$VIRTUOSO_HOST" "$VIRTUOSO_CONDUCTOR_PORT" "HTTP/1.1 200 OK"

    #
    # Load ontologies and set up namespaces
    #

    if [[ "$DBA_PASSWORD" != "" ]]
    then
      echo "Logging into virtuoso with credentials $VIRTUOSO_DBA_USER: $DBA_PASSWORD..."
      isql "$VIRTUOSO_HOST" "$VIRTUOSO_ISQL_PORT" -U "$VIRTUOSO_DBA_USER" -P "$DBA_PASSWORD" < "$SCRIPTS_LOCATION/isql_commands/load_ontologies.rq" \
      && \
      isql "$VIRTUOSO_HOST" "$VIRTUOSO_ISQL_PORT" -U "$VIRTUOSO_DBA_USER" -P "$DBA_PASSWORD" < "$SCRIPTS_LOCATION/isql_commands/declare_namespaces.rq" \
        || ( echo "Unable to setup namespaces" && exit 1 )
    else
      isql "$VIRTUOSO_HOST" "$VIRTUOSO_ISQL_PORT" -U "$VIRTUOSO_DBA_USER" < "$SCRIPTS_LOCATION/isql_commands/load_ontologies.rq" \
      && \
      isql "$VIRTUOSO_HOST" "$VIRTUOSO_ISQL_PORT" -U "$VIRTUOSO_DBA_USER" < "$SCRIPTS_LOCATION/isql_commands/declare_namespaces.rq" \
        || ( echo "Unable to setup namespaces" && exit 1 )
    fi

    #
    # kill virtuoso and wait for its shutdown
    #
    echo "Shutting down virtuoso..."
    run_isql_command "EXEC=checkpoint; shutdown;"

    until ! server_is_online "$VIRTUOSO_HOST" "$VIRTUOSO_ISQL_PORT"; do
      echo "Virtuoso shutting down..."
      sleep 1
    done
}

if [[ -f "$SETUP_COMPLETED_PREVIOUSLY" || "$FORCE_ONTOLOGIES_RELOAD" != "" ]]
then
  echo "This container has already started before. Simply starting up virtuoso."
  source_virtuoso
else
  echo "This is the first startup of this container. Ontologies need to be loaded..."

  # do not enable connections from outside until the server is ready
  iptables -t nat -L
  block_ports_except_for_loopback
  iptables -t nat -L
  perform_initialization

  iptables -t nat -L

  touch "$SETUP_COMPLETED_PREVIOUSLY"

  if [[ -f $SETUP_COMPLETED_PREVIOUSLY ]]; then
	  echo "Virtuoso initialized successfully. Starting up again for normal operation..."
  else
      echo "Unable to touch file $SETUP_COMPLETED_PREVIOUSLY after loading ontologies"
      exit 1
  fi

  source_virtuoso
fi
