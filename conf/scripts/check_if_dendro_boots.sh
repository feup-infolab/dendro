#!/usr/bin/env bash

# starts containers with the volumes mounted
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

DENDRO_PORT=$1

server_is_online "127.0.0.1" "$DENDRO_PORT"
