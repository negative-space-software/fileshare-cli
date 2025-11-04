#!/bin/bash

# Fileshare Server Setup Script
# This script installs and configures NGINX and Cloudflare Tunnel
# Run as root on Ubuntu Server

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Icons (NSS CLI style)
INFO="[*]"
SUCCESS="[+]"
ERROR="[X]"
WARNING="[!]"

echo -e "${CYAN}${INFO} Starting fileshare server setup...${NC}\n"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}${ERROR} This script must be run as root${NC}"
  exit 1
fi

echo -e "${CYAN}${INFO} Updating system packages...${NC}"
apt-get update

# Install NGINX
echo -e "\n${CYAN}${INFO} Installing NGINX...${NC}"
if command -v nginx &> /dev/null; then
  echo -e "${YELLOW}${WARNING} NGINX is already installed${NC}"
else
  apt-get install -y nginx
  echo -e "${GREEN}${SUCCESS} NGINX installed successfully${NC}"
fi

# Create fileshare directory
echo -e "\n${CYAN}${INFO} Creating fileshare directory...${NC}"
FILESHARE_DIR="/root/fileshare"
mkdir -p "$FILESHARE_DIR"
chmod 755 "$FILESHARE_DIR"
echo -e "${GREEN}${SUCCESS} Directory created at $FILESHARE_DIR${NC}"

# Copy NGINX configuration
echo -e "\n${CYAN}${INFO} Configuring NGINX...${NC}"
NGINX_CONF_SOURCE="$(dirname "$0")/../nginx/fileshare.conf"
NGINX_CONF_DEST="/etc/nginx/sites-available/fileshare"

if [ -f "$NGINX_CONF_SOURCE" ]; then
  cp "$NGINX_CONF_SOURCE" "$NGINX_CONF_DEST"

  # Create symbolic link to enable site
  ln -sf "$NGINX_CONF_DEST" /etc/nginx/sites-enabled/fileshare

  # Remove default site if it exists
  if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
    echo -e "${YELLOW}${WARNING} Removed default NGINX site${NC}"
  fi

  # Test NGINX configuration
  nginx -t

  # Restart NGINX
  systemctl restart nginx
  systemctl enable nginx

  echo -e "${GREEN}${SUCCESS} NGINX configured and running${NC}"
else
  echo -e "${RED}${ERROR} NGINX configuration file not found at $NGINX_CONF_SOURCE${NC}"
  exit 1
fi

# Install Cloudflare Tunnel (cloudflared)
echo -e "\n${CYAN}${INFO} Installing Cloudflare Tunnel (cloudflared)...${NC}"
if command -v cloudflared &> /dev/null; then
  echo -e "${YELLOW}${WARNING} cloudflared is already installed${NC}"
  cloudflared version
else
  # Download and install cloudflared
  wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
  dpkg -i cloudflared-linux-amd64.deb
  rm cloudflared-linux-amd64.deb
  echo -e "${GREEN}${SUCCESS} cloudflared installed successfully${NC}"
  cloudflared version
fi

# Create cloudflared config directory
echo -e "\n${CYAN}${INFO} Setting up Cloudflare Tunnel configuration...${NC}"
CLOUDFLARED_DIR="/root/.cloudflared"
mkdir -p "$CLOUDFLARED_DIR"

# Copy config file
CONFIG_SOURCE="$(dirname "$0")/../cloudflared/config.yml"
CONFIG_DEST="$CLOUDFLARED_DIR/config.yml"

if [ -f "$CONFIG_SOURCE" ]; then
  cp "$CONFIG_SOURCE" "$CONFIG_DEST"
  echo -e "${GREEN}${SUCCESS} Cloudflare config copied to $CONFIG_DEST${NC}"
else
  echo -e "${YELLOW}${WARNING} Cloudflare config file not found, skipping...${NC}"
fi

# Instructions for completing setup
echo -e "\n${CYAN}========================================${NC}"
echo -e "${GREEN}${SUCCESS} Server setup completed!${NC}"
echo -e "${CYAN}========================================${NC}\n"

echo -e "${CYAN}Next steps to complete Cloudflare Tunnel setup:${NC}\n"
echo -e "1. Login to Cloudflare:"
echo -e "   ${YELLOW}cloudflared tunnel login${NC}\n"

echo -e "2. Create a tunnel:"
echo -e "   ${YELLOW}cloudflared tunnel create fileshare${NC}\n"

echo -e "3. Note the tunnel ID from the output and update config.yml:"
echo -e "   ${YELLOW}nano $CONFIG_DEST${NC}"
echo -e "   Uncomment and set: ${YELLOW}tunnel: <tunnel-id>${NC}"
echo -e "   Uncomment and set: ${YELLOW}credentials-file: $CLOUDFLARED_DIR/<tunnel-id>.json${NC}\n"

echo -e "4. Route your domain to the tunnel:"
echo -e "   ${YELLOW}cloudflared tunnel route dns fileshare fileshare.ct-42210.com${NC}\n"

echo -e "5. Start the tunnel service:"
echo -e "   ${YELLOW}cloudflared tunnel run fileshare${NC}\n"

echo -e "6. (Optional) Install as a system service:"
echo -e "   ${YELLOW}cloudflared service install${NC}"
echo -e "   ${YELLOW}systemctl start cloudflared${NC}"
echo -e "   ${YELLOW}systemctl enable cloudflared${NC}\n"

echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}Configuration files:${NC}"
echo -e "  NGINX: ${YELLOW}/etc/nginx/sites-available/fileshare${NC}"
echo -e "  Cloudflare: ${YELLOW}$CONFIG_DEST${NC}"
echo -e "  Upload directory: ${YELLOW}$FILESHARE_DIR${NC}"
echo -e "${CYAN}========================================${NC}\n"

echo -e "${CYAN}${INFO} To test NGINX locally: ${YELLOW}curl http://localhost:9091${NC}\n"
