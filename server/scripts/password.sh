#!/bin/bash

# Fileshare Password Management Script
# This script manages HTTP basic authentication for the fileshare server

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Icons
INFO="[*]"
SUCCESS="[+]"
ERROR="[X]"
WARNING="[!]"

HTPASSWD_FILE="/etc/nginx/.htpasswd"
NGINX_CONF="/etc/nginx/sites-available/fileshare"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}${ERROR} This script must be run as root${NC}"
  exit 1
fi

show_usage() {
  echo -e "\n${CYAN}Fileshare Password Management${NC}\n"
  echo "Usage: $0 [enable|disable|change|status]"
  echo ""
  echo "Commands:"
  echo "  enable   - Enable password protection"
  echo "  disable  - Disable password protection"
  echo "  change   - Change the password"
  echo "  status   - Show current password status"
  echo ""
}

enable_password() {
  echo -e "${CYAN}${INFO} Enabling password protection...${NC}\n"

  # Install apache2-utils if not present (for htpasswd command)
  if ! command -v htpasswd &> /dev/null; then
    echo -e "${CYAN}${INFO} Installing apache2-utils...${NC}"
    apt-get update
    apt-get install -y apache2-utils
  fi

  # Prompt for username and password
  read -p "Enter username: " username

  # Create or update password file
  htpasswd -c "$HTPASSWD_FILE" "$username"

  # Uncomment auth lines in NGINX config
  sed -i 's/# auth_basic/auth_basic/g' "$NGINX_CONF"

  # Test and reload NGINX
  nginx -t && systemctl reload nginx

  echo -e "\n${GREEN}${SUCCESS} Password protection enabled!${NC}"
  echo -e "${CYAN}Username: ${YELLOW}$username${NC}\n"
}

disable_password() {
  echo -e "${CYAN}${INFO} Disabling password protection...${NC}\n"

  # Comment out auth lines in NGINX config
  sed -i 's/^\s*auth_basic/# auth_basic/g' "$NGINX_CONF"

  # Test and reload NGINX
  nginx -t && systemctl reload nginx

  echo -e "${GREEN}${SUCCESS} Password protection disabled!${NC}\n"
}

change_password() {
  if [ ! -f "$HTPASSWD_FILE" ]; then
    echo -e "${YELLOW}${WARNING} No password file exists. Use 'enable' first.${NC}\n"
    exit 1
  fi

  echo -e "${CYAN}${INFO} Changing password...${NC}\n"

  read -p "Enter username: " username

  # Update password (without -c flag to avoid overwriting)
  htpasswd "$HTPASSWD_FILE" "$username"

  echo -e "\n${GREEN}${SUCCESS} Password changed for user: ${YELLOW}$username${NC}\n"
}

show_status() {
  echo -e "\n${CYAN}Password Protection Status${NC}\n"

  # Check if auth is enabled in config
  if grep -q "^[^#]*auth_basic" "$NGINX_CONF"; then
    echo -e "Status: ${GREEN}ENABLED${NC}"

    if [ -f "$HTPASSWD_FILE" ]; then
      echo -e "\nConfigured users:"
      # List users from htpasswd file
      while IFS=: read -r username _; do
        echo -e "  - ${YELLOW}$username${NC}"
      done < "$HTPASSWD_FILE"
    fi
  else
    echo -e "Status: ${YELLOW}DISABLED${NC}"
  fi

  echo ""
}

# Main script logic
case "${1:-}" in
  enable)
    enable_password
    ;;
  disable)
    disable_password
    ;;
  change)
    change_password
    ;;
  status)
    show_status
    ;;
  *)
    show_usage
    exit 1
    ;;
esac
