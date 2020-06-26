#!/bin/bash

export DENDRO_NOTEBOOK_FULL_URL="/notebook_runner/62c1155d-860e-406e-9a67-3b4a7dae4b85"
export DENDRO_NOTEBOOK_DEFAULT_PASSWORD="jupyter"
export DENDRO_NOTEBOOK_GUID="62c1155d-860e-406e-9a67-3b4a7dae4b85"
export DENDRO_NOTEBOOK_VIRTUAL_HOST="jupyter-notebook.$DENDRO_NOTEBOOK_GUID"
export NB_ID="$UID"

docker-compose up
