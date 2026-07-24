#!/bin/bash
set -e

echo "Installing Docker..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "Creating LiveKit directories..."
sudo mkdir -p /opt/livekit
cd /opt/livekit

echo "Generating LiveKit config..."
sudo cat << 'YAMLEOF' > livekit.yaml
port: 7880
bind_addresses:
  - ""
rtc:
  tcp_port: 7881
  udp_port: 7882
  use_external_ip: true
keys:
  learnproof_key: learnproof_livekit_secret_2024_xyz789
logging:
  json: false
  level: info
YAMLEOF

echo "Generating Caddyfile..."
sudo cat << 'CADDYEOF' > Caddyfile
livekit.learnproofai.com {
    reverse_proxy localhost:7880
}
CADDYEOF

echo "Generating docker-compose.yaml..."
sudo cat << 'COMPOSEEOF' > docker-compose.yaml
services:
  caddy:
    image: caddy:2.7
    restart: unless-stopped
    network_mode: "host"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - ./caddy_data:/data
      - ./caddy_config:/config
  livekit:
    image: livekit/livekit-server:latest
    command: --config /etc/livekit.yaml
    restart: unless-stopped
    network_mode: "host"
    volumes:
      - ./livekit.yaml:/etc/livekit.yaml
COMPOSEEOF

echo "Starting LiveKit..."
sudo docker compose up -d

echo "Done!"
