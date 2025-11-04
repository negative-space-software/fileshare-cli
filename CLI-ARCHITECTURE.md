# Fileshare CLI - Architecture Documentation

This document provides comprehensive architecture details for building the fileshare CLI application. The server infrastructure is now deployed and ready for CLI integration.

## Table of Contents
1. [Server Infrastructure Overview](#server-infrastructure-overview)
2. [Network Architecture](#network-architecture)
3. [File Upload Flow](#file-upload-flow)
4. [CLI Requirements](#cli-requirements)
5. [SSH/SFTP Integration](#sshsftp-integration)
6. [API Endpoints](#api-endpoints)
7. [Security Considerations](#security-considerations)
8. [Testing the Server](#testing-the-server)

---

## Server Infrastructure Overview

### Deployed Components

The server infrastructure consists of:

1. **NGINX Static File Server**
   - Port: 9091 (localhost only)
   - Document root: `/root/fileshare`
   - Features: Directory listing, CORS enabled, 10GB max file size

2. **Cloudflare Tunnel**
   - Public domain: `https://fileshare.ct-42210.com`
   - Routes HTTPS traffic to local NGINX on port 9091
   - Handles SSL/TLS automatically
   - DNS configured and operational

3. **File Storage**
   - Location: `/root/fileshare/`
   - Permissions: 755 (directory), 644 (files)
   - Parent directory `/root` has execute permission for traversal

### Server Verification

Server is confirmed operational:
```bash
# Local access works
curl http://localhost:9091/test.txt
# Returns: Fileshare server is running!

# Remote access works
curl https://fileshare.ct-42210.com/test.txt
# Returns: Fileshare server is running!

# Directory listing works
curl http://localhost:9091/
# Returns HTML directory listing with autoindex
```

---

## Network Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           User's Computer                           │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      fileshare CLI                              │ │
│  │                                                                  │ │
│  │  Commands:                                                       │ │
│  │    - fileshare upload    Upload files/folders                   │ │
│  │    - fileshare delete    Delete files from server               │ │
│  │    - fileshare password  Set download password                  │ │
│  │    - fileshare about     Show information                       │ │
│  │    - fileshare setup     Configure settings                     │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                 │                                     │
└─────────────────────────────────┼─────────────────────────────────────┘
                                  │
                                  │ SSH/SFTP
                                  │ (Port 22)
                                  │ Key: njt-hpe-proliant
                                  │
                     ┌────────────▼────────────┐
                     │   Ubuntu Server (root)   │
                     │                          │
                     │  ┌────────────────────┐  │
                     │  │  /root/fileshare/  │  │
                     │  │                    │  │
                     │  │  - file1.txt       │  │
                     │  │  - image.jpg       │  │
                     │  │  - folder/         │  │
                     │  └────────┬───────────┘  │
                     │           │              │
                     │  ┌────────▼───────────┐  │
                     │  │  NGINX (port 9091) │  │
                     │  │  - Autoindex ON    │  │
                     │  │  - Max size: 10GB  │  │
                     │  └────────┬───────────┘  │
                     │           │              │
                     │  ┌────────▼───────────┐  │
                     │  │ Cloudflare Tunnel  │  │
                     │  │  cloudflared       │  │
                     │  └────────┬───────────┘  │
                     └───────────┼──────────────┘
                                 │
                                 │ HTTPS
                                 │
                    ┌────────────▼─────────────┐
                    │   Cloudflare CDN/Proxy   │
                    │   - SSL/TLS              │
                    │   - DDoS Protection      │
                    └────────────┬─────────────┘
                                 │
                                 │ HTTPS
                                 │
                    ┌────────────▼─────────────┐
                    │    End Users (Web)       │
                    │                          │
                    │ fileshare.ct-42210.com   │
                    │                          │
                    │  - Browse files          │
                    │  - Download files        │
                    └──────────────────────────┘
```

---

## File Upload Flow

### Step-by-Step Process

1. **User Invokes CLI**
   ```bash
   cd /path/to/files
   fileshare upload
   # or simply
   fileshare
   ```

2. **CLI Reads Configuration**
   - Load from `~/.fileshare/.env`
   - SSH key path (default: "njt-hpe-proliant")
   - Server connection details
   - Target directory: `/root/fileshare/`

3. **CLI Lists Files**
   - Show files/folders in current directory
   - Let user select what to upload
   - Display interactive menu (Inquirer.js)

4. **SSH Connection Establishment**
   ```javascript
   // Pseudocode
   const connection = await sftp.connect({
     host: 'server-hostname',
     port: 22,
     username: 'root',
     privateKey: fs.readFileSync('/path/to/njt-hpe-proliant')
   });
   ```

5. **File Upload via SFTP**
   ```javascript
   // Upload single file
   await sftp.put(
     '/local/path/file.txt',
     '/root/fileshare/file.txt'
   );

   // Upload directory recursively
   await sftp.uploadDir(
     '/local/path/folder',
     '/root/fileshare/folder'
   );
   ```

6. **Set File Permissions**
   ```javascript
   // Ensure files are readable by NGINX
   await sftp.chmod('/root/fileshare/file.txt', 0o644);
   await sftp.chmod('/root/fileshare/folder', 0o755);
   ```

7. **Generate Public URL**
   ```javascript
   const publicUrl = `https://fileshare.ct-42210.com/${filename}`;
   console.log(`File available at: ${publicUrl}`);
   ```

8. **Display Success Message**
   ```
   [+] Upload complete!
   [*] File: document.pdf
   [*] URL: https://fileshare.ct-42210.com/document.pdf
   [*] Share this link to allow downloads
   ```

### Upload Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│ 1. User runs "fileshare" in directory with files               │
└──────────────────────┬─────────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. CLI shows interactive file selection menu                   │
│    □ file1.txt                                                  │
│    ☑ file2.pdf                                                  │
│    ☑ folder/                                                    │
└──────────────────────┬─────────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────────┐
│ 3. CLI establishes SSH connection with private key             │
│    Host: server | User: root | Key: njt-hpe-proliant           │
└──────────────────────┬─────────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────────┐
│ 4. CLI uploads files via SFTP to /root/fileshare/              │
│    [========================================] 100%               │
│    Uploading: file2.pdf (2.4 MB)                                │
└──────────────────────┬─────────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────────┐
│ 5. CLI sets permissions (644 for files, 755 for directories)   │
└──────────────────────┬─────────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────────┐
│ 6. CLI generates and displays public URLs                      │
│    [+] Success! Files uploaded to:                              │
│    https://fileshare.ct-42210.com/file2.pdf                     │
│    https://fileshare.ct-42210.com/folder/                       │
└────────────────────────────────────────────────────────────────┘
```

---

## CLI Requirements

### Dependencies

```json
{
  "dependencies": {
    "commander": "^11.x",
    "inquirer": "^8.2.6",
    "chalk": "^4.1.2",
    "dotenv": "^16.x",
    "ssh2-sftp-client": "^10.x",
    "cli-progress": "^3.x"
  }
}
```

### Configuration File Structure

**Location**: `~/.fileshare/.env`

```env
# SSH Connection
SSH_HOST=<server-hostname-or-ip>
SSH_PORT=22
SSH_USER=root
SSH_KEY_PATH=njt-hpe-proliant

# Server Paths
SERVER_UPLOAD_DIR=/root/fileshare

# Public URLs
PUBLIC_URL_BASE=https://fileshare.ct-42210.com
```

### Directory Structure

```
src/
├── index.js                 # Entry point, commander setup
├── commands/
│   ├── upload.js            # Upload command orchestration
│   ├── delete.js            # Delete command orchestration
│   ├── password.js          # Password protection command
│   ├── about.js             # About information
│   └── setup.js             # Configuration setup
├── ui/
│   ├── display.js           # Display functions (success, error, info)
│   └── select.js            # Interactive file selection
├── api/
│   ├── sftp.js              # SFTP connection and operations
│   └── nginx.js             # NGINX-related operations (password, etc.)
└── utils/
    ├── config.js            # Configuration management
    ├── errors.js            # Error handling
    ├── date.js              # Date formatting
    └── paths.js             # Path utilities
```

---

## SSH/SFTP Integration

### Connection Setup

```javascript
// src/api/sftp.js

const SFTPClient = require('ssh2-sftp-client');
const fs = require('fs');
const path = require('path');
const config = require('../utils/config');

class SFTPService {
  constructor() {
    this.sftp = new SFTPClient();
    this.connected = false;
  }

  async connect() {
    if (this.connected) return;

    const sshConfig = {
      host: config.get('SSH_HOST'),
      port: parseInt(config.get('SSH_PORT')),
      username: config.get('SSH_USER'),
      privateKey: fs.readFileSync(
        path.resolve(process.env.HOME, '.ssh', config.get('SSH_KEY_PATH'))
      )
    };

    await this.sftp.connect(sshConfig);
    this.connected = true;
  }

  async disconnect() {
    if (this.connected) {
      await this.sftp.end();
      this.connected = false;
    }
  }

  async uploadFile(localPath, remotePath) {
    await this.connect();
    await this.sftp.put(localPath, remotePath);
    // Set file permissions to 644 (readable by NGINX)
    await this.sftp.chmod(remotePath, 0o644);
  }

  async uploadDirectory(localPath, remotePath) {
    await this.connect();
    await this.sftp.uploadDir(localPath, remotePath);
    // Set directory permissions to 755
    await this.sftp.chmod(remotePath, 0o755);
    // Recursively set file permissions
    await this.setPermissionsRecursive(remotePath);
  }

  async setPermissionsRecursive(remotePath) {
    const list = await this.sftp.list(remotePath);
    for (const item of list) {
      const fullPath = `${remotePath}/${item.name}`;
      if (item.type === 'd') {
        await this.sftp.chmod(fullPath, 0o755);
        await this.setPermissionsRecursive(fullPath);
      } else {
        await this.sftp.chmod(fullPath, 0o644);
      }
    }
  }

  async deleteFile(remotePath) {
    await this.connect();
    const stat = await this.sftp.stat(remotePath);
    if (stat.isDirectory) {
      await this.sftp.rmdir(remotePath, true);
    } else {
      await this.sftp.delete(remotePath);
    }
  }

  async listFiles(remotePath) {
    await this.connect();
    return await this.sftp.list(remotePath);
  }

  async exists(remotePath) {
    await this.connect();
    return await this.sftp.exists(remotePath);
  }
}

module.exports = new SFTPService();
```

### Upload Implementation Example

```javascript
// src/commands/upload.js

const sftp = require('../api/sftp');
const config = require('../utils/config');
const { displaySuccess, displayError, displayInfo } = require('../ui/display');
const { selectFiles } = require('../ui/select');
const path = require('path');

async function uploadCommand() {
  try {
    displayInfo('Scanning current directory...');

    // Get list of files in current directory
    const files = await selectFiles(process.cwd());

    if (files.length === 0) {
      displayInfo('No files selected. Exiting.');
      return;
    }

    displayInfo(`Uploading ${files.length} item(s)...`);

    const uploadDir = config.get('SERVER_UPLOAD_DIR');
    const publicBase = config.get('PUBLIC_URL_BASE');
    const uploadedUrls = [];

    for (const file of files) {
      const localPath = path.join(process.cwd(), file);
      const remotePath = path.join(uploadDir, file);
      const publicUrl = `${publicBase}/${file}`;

      const stat = require('fs').statSync(localPath);

      if (stat.isDirectory()) {
        displayInfo(`Uploading directory: ${file}`);
        await sftp.uploadDirectory(localPath, remotePath);
      } else {
        displayInfo(`Uploading file: ${file}`);
        await sftp.uploadFile(localPath, remotePath);
      }

      uploadedUrls.push({ file, url: publicUrl });
    }

    // Display success
    displaySuccess('Upload complete!');
    console.log('');
    uploadedUrls.forEach(({ file, url }) => {
      displayInfo(`${file}`);
      console.log(`  ${url}`);
    });

    await sftp.disconnect();

  } catch (error) {
    displayError(error);
    process.exit(1);
  }
}

module.exports = uploadCommand;
```

---

## API Endpoints

While this is a static file server without a traditional API, these are the effective "endpoints" available through NGINX:

### File Access

**GET** `https://fileshare.ct-42210.com/{filename}`
- Downloads or displays a file
- Example: `https://fileshare.ct-42210.com/document.pdf`

**GET** `https://fileshare.ct-42210.com/{directory}/`
- Shows directory listing (HTML autoindex)
- Example: `https://fileshare.ct-42210.com/project-files/`

**GET** `https://fileshare.ct-42210.com/`
- Shows root directory listing with all uploaded files

### Response Headers (Set by NGINX)

All responses include:
- `Access-Control-Allow-Origin: *` (CORS enabled)
- `Access-Control-Allow-Methods: GET, OPTIONS`
- `Cache-Control: public, max-age=3600`
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`

### Directory Listing Format

NGINX autoindex returns HTML with this structure:
```html
<html>
<head><title>Index of /</title></head>
<body>
<h1>Index of /</h1><hr><pre>
<a href="../">../</a>
<a href="file1.txt">file1.txt</a>     04-Nov-2025 18:10    1234
<a href="folder/">folder/</a>         04-Nov-2025 18:10       -
</pre><hr></body>
</html>
```

---

## Security Considerations

### SSH Key Management

1. **Private Key Location**
   - User's SSH key should be in `~/.ssh/njt-hpe-proliant`
   - CLI should verify key exists before attempting connection
   - Key should have proper permissions (600)

2. **Key Setup in CLI**
   ```javascript
   // Verify key exists and has correct permissions
   const keyPath = path.join(os.homedir(), '.ssh', keyName);
   if (!fs.existsSync(keyPath)) {
     throw new Error(`SSH key not found: ${keyPath}`);
   }

   const keyStats = fs.statSync(keyPath);
   const mode = keyStats.mode & 0o777;
   if (mode !== 0o600) {
     console.warn('Warning: SSH key permissions should be 600');
   }
   ```

### File Permissions

1. **Upload Directory**
   - `/root/fileshare/` must be 755 (readable by NGINX)
   - `/root` must have execute permission (701 or 711) for traversal

2. **Uploaded Files**
   - Files: 644 (readable by all, writable by owner)
   - Directories: 755 (traversable and readable by all)

3. **Permission Setting**
   ```javascript
   // After upload, always set permissions
   await sftp.chmod(remotePath, stat.isDirectory() ? 0o755 : 0o644);
   ```

### Public Access

1. **Files Are Public**
   - All files uploaded are publicly accessible
   - Anyone with the URL can download files
   - CLI should warn users about this

2. **Password Protection** (Future Feature)
   - Can be implemented using NGINX basic auth
   - Would require `.htpasswd` file
   - CLI command: `fileshare password`

### Connection Security

1. **SSH Connection**
   - Always uses SSH key authentication (not passwords)
   - Connection is encrypted
   - Verify host key on first connection

2. **HTTPS**
   - All public access is via HTTPS (handled by Cloudflare)
   - Certificates managed automatically by Cloudflare
   - No mixed content issues

---

## Testing the Server

### Manual Testing Commands

```bash
# Test local NGINX access
curl http://localhost:9091/

# Test remote HTTPS access
curl https://fileshare.ct-42210.com/

# Upload test file via SFTP (manual test)
sftp -i ~/.ssh/njt-hpe-proliant root@<server-ip> <<EOF
cd /root/fileshare
put test-file.txt
chmod 644 test-file.txt
ls -la
bye
EOF

# Download test file
curl https://fileshare.ct-42210.com/test-file.txt

# Test directory listing
curl https://fileshare.ct-42210.com/ | grep test-file.txt
```

### Server Status Checks

```bash
# Check NGINX is running
systemctl status nginx

# Check NGINX is listening on port 9091
netstat -tulpn | grep 9091

# Check Cloudflare tunnel is running
systemctl status cloudflared

# View NGINX logs
tail -f /var/log/nginx/fileshare_access.log
tail -f /var/log/nginx/fileshare_error.log

# View Cloudflare tunnel logs
journalctl -u cloudflared -f
```

### CLI Integration Testing

Once CLI is built, test these workflows:

1. **Upload Single File**
   ```bash
   cd /tmp
   echo "test content" > test.txt
   fileshare upload
   # Should show URL: https://fileshare.ct-42210.com/test.txt
   curl https://fileshare.ct-42210.com/test.txt
   # Should return: test content
   ```

2. **Upload Directory**
   ```bash
   mkdir -p /tmp/test-folder
   echo "file1" > /tmp/test-folder/file1.txt
   echo "file2" > /tmp/test-folder/file2.txt
   cd /tmp
   fileshare upload
   # Select test-folder
   # Should show URL: https://fileshare.ct-42210.com/test-folder/
   curl https://fileshare.ct-42210.com/test-folder/
   # Should show directory listing
   ```

3. **Delete File**
   ```bash
   fileshare delete
   # Should show list of files on server
   # Select file to delete
   # Verify deletion
   curl https://fileshare.ct-42210.com/deleted-file.txt
   # Should return 404
   ```

4. **Configuration**
   ```bash
   fileshare setup
   # Should prompt for SSH key, server details
   # Should save to ~/.fileshare/.env
   cat ~/.fileshare/.env
   # Should show configuration
   ```

---

## Quick Reference

### Server Details
- **SSH Host**: (configured in CLI)
- **SSH User**: root
- **SSH Key**: njt-hpe-proliant
- **Upload Directory**: /root/fileshare
- **NGINX Port**: 9091 (local only)
- **Public URL**: https://fileshare.ct-42210.com

### Key Paths
- **Server Upload Dir**: `/root/fileshare/`
- **NGINX Config**: `/etc/nginx/sites-available/fileshare`
- **Cloudflared Config**: `/etc/cloudflared/config.yml`
- **NGINX Logs**: `/var/log/nginx/fileshare_*.log`
- **CLI Config**: `~/.fileshare/.env`

### Important Permissions
- `/root` - 711 (execute permission for traversal)
- `/root/fileshare` - 755 (readable/traversable)
- Uploaded files - 644 (readable by all)
- Uploaded directories - 755 (traversable)

### Services
```bash
# NGINX
systemctl status nginx
systemctl restart nginx

# Cloudflare Tunnel
systemctl status cloudflared
systemctl restart cloudflared
```

---

## Next Steps for CLI Development

1. **Initialize Node.js Project**
   ```bash
   npm init -y
   npm install commander inquirer@8 chalk@4 dotenv ssh2-sftp-client cli-progress
   ```

2. **Create Directory Structure**
   - Follow NSS CLI Implementation Guide
   - Three-layer architecture: commands, ui, api
   - Utilities for config, errors, date formatting

3. **Implement Core Functions**
   - Configuration management (read/write ~/.fileshare/.env)
   - SFTP connection and operations
   - File selection UI
   - Upload/delete commands

4. **Test Against Live Server**
   - Server is deployed and ready
   - Test with small files first
   - Verify permissions are set correctly
   - Test directory uploads
   - Verify public URLs work

5. **Add Enhanced Features**
   - Progress bars for uploads
   - Error handling with full stack traces
   - Multiple file selection
   - Resume interrupted uploads
   - Password protection (NGINX basic auth)

---

**Server Status**: ✅ **DEPLOYED AND OPERATIONAL**

The server infrastructure is fully deployed, tested, and ready for CLI integration. All components are working correctly:
- NGINX serving on port 9091 ✅
- Cloudflare tunnel routing traffic ✅
- DNS configured for fileshare.ct-42210.com ✅
- File uploads and downloads working ✅
- Directory listing enabled ✅

You can now proceed with CLI development using this architecture documentation.
