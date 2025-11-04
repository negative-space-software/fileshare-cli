# Fileshare Server Infrastructure

This directory contains the server-side infrastructure for the fileshare-cli application. The server hosts uploaded files via NGINX and exposes them through a Cloudflare Tunnel.

## Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   CLI App   │ ──SSH──>│  Ubuntu Server   │<──HTTP──│   Cloudflare    │
│  (Client)   │         │                  │         │     Tunnel      │
└─────────────┘         │  NGINX (9090)    │         └─────────────────┘
                        │  /root/fileshare │                  │
                        └──────────────────┘                  │
                                                              │
                                                              v
                                                    fileshare.ct-42210.com
                                                       (HTTPS via CF)
```

## Components

### 1. NGINX Static File Server
- **Port**: 9090 (local only)
- **Document Root**: `/root/fileshare`
- **Features**:
  - Directory listing with autoindex
  - File sizes in human-readable format (MB/GB)
  - Optional password protection
  - CORS headers enabled
  - Security headers configured
  - 10GB max file size support

### 2. Cloudflare Tunnel
- **Service**: cloudflared
- **Domain**: fileshare.ct-42210.com
- **Function**: Routes HTTPS traffic to local NGINX server
- **Protocol**: QUIC (recommended)

### 3. File Storage
- **Location**: `/root/fileshare/`
- **Access**: CLI uploads via SSH (key: njt-hpe-proliant)
- **Permissions**: 755 (readable by NGINX)

## Quick Start

### Prerequisites
- Ubuntu Server (tested on Ubuntu 20.04+)
- Root access
- SSH key configured for CLI access
- Cloudflare account with access to ct-42210.com domain

### Installation

1. **Copy server files to the Ubuntu server:**
   ```bash
   scp -r server root@your-server:/root/fileshare-server
   ```

2. **SSH into the server:**
   ```bash
   ssh root@your-server
   ```

3. **Run the setup script:**
   ```bash
   cd /root/fileshare-server/scripts
   ./setup.sh
   ```

   This script will:
   - Install NGINX
   - Configure NGINX for file serving
   - Create the `/root/fileshare` directory
   - Install cloudflared
   - Copy configuration files

4. **Complete Cloudflare Tunnel setup:**

   Follow the instructions displayed after setup completes:

   ```bash
   # Authenticate with Cloudflare
   cloudflared tunnel login

   # Create the tunnel
   cloudflared tunnel create fileshare

   # Note the tunnel ID and update the config
   nano /root/.cloudflared/config.yml
   # Uncomment and set:
   #   tunnel: <your-tunnel-id>
   #   credentials-file: /root/.cloudflared/<your-tunnel-id>.json

   # Route the domain to the tunnel
   cloudflared tunnel route dns fileshare fileshare.ct-42210.com

   # Test the tunnel
   cloudflared tunnel run fileshare
   ```

5. **Install as a system service (recommended):**
   ```bash
   cloudflared service install
   systemctl start cloudflared
   systemctl enable cloudflared
   ```

6. **Verify the installation:**
   ```bash
   # Check NGINX status
   systemctl status nginx

   # Check cloudflared status
   systemctl status cloudflared

   # Test local access
   curl http://localhost:9090

   # Test remote access
   curl https://fileshare.ct-42210.com
   ```

## Password Protection

The server includes a utility script for managing password protection:

```bash
cd /root/fileshare-server/scripts

# Enable password protection
./password.sh enable

# Check password status
./password.sh status

# Change password
./password.sh change

# Disable password protection
./password.sh disable
```

**Note**: When password protection is enabled, users will need to enter credentials to access files through the web interface. The CLI will need to be configured with these credentials for automated access.

## Directory Structure

```
server/
├── README.md                    # This file
├── nginx/
│   └── fileshare.conf          # NGINX configuration
├── cloudflared/
│   └── config.yml              # Cloudflare Tunnel configuration
└── scripts/
    ├── setup.sh                # Main installation script
    └── password.sh             # Password management utility
```

## Configuration Files

### NGINX Configuration
**Location**: `/etc/nginx/sites-available/fileshare`

Key settings:
- `listen 9090` - Port for local access
- `root /root/fileshare` - Upload directory
- `client_max_body_size 10G` - Max file size
- `autoindex on` - Enable directory listing

To modify:
```bash
nano /etc/nginx/sites-available/fileshare
nginx -t  # Test configuration
systemctl reload nginx  # Apply changes
```

### Cloudflare Tunnel Configuration
**Location**: `/root/.cloudflared/config.yml`

Key settings:
- `hostname: fileshare.ct-42210.com` - Public domain
- `service: http://localhost:9090` - Local NGINX server

To modify:
```bash
nano /root/.cloudflared/config.yml
systemctl restart cloudflared  # Apply changes
```

## Maintenance

### View Logs

```bash
# NGINX access logs
tail -f /var/log/nginx/fileshare_access.log

# NGINX error logs
tail -f /var/log/nginx/fileshare_error.log

# Cloudflared logs
journalctl -u cloudflared -f
```

### Restart Services

```bash
# Restart NGINX
systemctl restart nginx

# Restart Cloudflare Tunnel
systemctl restart cloudflared
```

### Check Disk Usage

```bash
# Check fileshare directory size
du -sh /root/fileshare

# List large files
find /root/fileshare -type f -size +100M -exec ls -lh {} \;
```

### Clean Up Old Files

```bash
# Remove files older than 30 days
find /root/fileshare -type f -mtime +30 -delete

# Remove empty directories
find /root/fileshare -type d -empty -delete
```

## Troubleshooting

### NGINX Issues

**Problem**: Cannot access http://localhost:9090
```bash
# Check if NGINX is running
systemctl status nginx

# Check if port 9090 is listening
netstat -tulpn | grep 9090

# Check NGINX configuration
nginx -t

# View error logs
tail -100 /var/log/nginx/fileshare_error.log
```

**Problem**: Permission denied when accessing files
```bash
# Check directory permissions
ls -la /root/fileshare

# Fix permissions
chmod 755 /root/fileshare
find /root/fileshare -type d -exec chmod 755 {} \;
find /root/fileshare -type f -exec chmod 644 {} \;
```

### Cloudflare Tunnel Issues

**Problem**: Cannot access https://fileshare.ct-42210.com
```bash
# Check if cloudflared is running
systemctl status cloudflared

# View cloudflared logs
journalctl -u cloudflared -n 100

# Test tunnel connectivity
cloudflared tunnel info fileshare

# Restart tunnel
systemctl restart cloudflared
```

**Problem**: Tunnel authentication issues
```bash
# Re-authenticate
cloudflared tunnel login

# Verify tunnel exists
cloudflared tunnel list

# Recreate tunnel if needed
cloudflared tunnel delete fileshare
cloudflared tunnel create fileshare
# Remember to update config.yml with new tunnel ID
```

### DNS Issues

**Problem**: Domain not resolving to tunnel
```bash
# Check DNS routing
cloudflared tunnel route dns fileshare fileshare.ct-42210.com

# Verify with dig
dig fileshare.ct-42210.com

# Check from external location
curl -I https://fileshare.ct-42210.com
```

## Security Considerations

1. **SSH Key Access**: The server expects SSH connections using the key "njt-hpe-proliant". Ensure this key is properly configured and secured.

2. **File Permissions**: Files in `/root/fileshare` should be readable by NGINX but not writable. The setup script configures this automatically.

3. **Password Protection**: Consider enabling password protection for sensitive files using the included `password.sh` script.

4. **Cloudflare Protection**: Cloudflare provides DDoS protection and SSL/TLS encryption automatically.

5. **Firewall**: Only port 22 (SSH) needs to be open. The tunnel handles all HTTPS traffic.

6. **File Cleanup**: Implement a cleanup policy to remove old files and prevent disk space issues.

## Integration with CLI

The CLI application will:
1. Connect to the server via SSH using the njt-hpe-proliant key
2. Upload files to `/root/fileshare/` using SFTP
3. Optionally set password protection via the `fileshare password` command
4. Provide users with the URL: https://fileshare.ct-42210.com/[filename]

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs: `/var/log/nginx/` and `journalctl -u cloudflared`
3. Verify configuration files are correct
4. Ensure all services are running: `systemctl status nginx cloudflared`
