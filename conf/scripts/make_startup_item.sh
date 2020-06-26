#!/usr/bin/env bash

SERVICE_NAME="dendro"
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"
sudo rm -rf "$SERVICE_FILE"

sudo printf "
[Unit]
Description=Dendro
Requires=docker
StartLimitIntervalSec=0

[Service]
Type=simple
Restart=always
RestartSec=1
User=$(whoami)
ExecStart=$(pwd)/conf/scripts/start.sh
WorkingDirectory=$(pwd)
PIDFile=$(pwd)/running.pid

[Install]
WantedBy=multi-user.target
" | sudo tee "$SERVICE_FILE"

sudo chmod 664 "$SERVICE_FILE" && \
sudo systemctl enable "$SERVICE_NAME" && \
sudo service start "$SERVICE_NAME"

