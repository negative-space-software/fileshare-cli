# Fileshare CLI

A Node.js command-line tool for securely transferring large files and folders between computers via SFTP, proxied through a dedicated server.

## Overview

Fileshare CLI allows you to quickly upload files and folders to a shared server, making them accessible via a web interface at [https://fileshare.ct-42210.com](https://fileshare.ct-42210.com).

## Features

- Upload files and folders via SFTP
- Delete files from the server
- Interactive menu navigation with arrow keys
- Progress tracking for file uploads
- Configurable SSH key and server settings
- Persistent configuration storage

## Installation

### Local Development

```bash
# Install dependencies
npm install

# Run CLI locally
node src/index.js [command]
```

### Global Installation

```bash
# Install globally
npm install -g .

# Run from anywhere
fileshare [command]
```

## Configuration

Configuration is stored in `~/.fileshare/.env` and persists across different working directories.

### Default Configuration

Default values (can be customized via `fileshare setup`):

- **SSH Key**: `id_ed25519` (located in `~/.ssh/`)
- **Server Host**: Configure via setup command
- **Server User**: `root`
- **Server Port**: Configure via setup command
- **Server Directory**: `/root/fileshare`

**Note**: You must configure your server host and port using `fileshare setup` before first use.

### Setup

To configure the CLI, run:

```bash
fileshare setup
```

This will display your current configuration and allow you to:
- Change SSH key name
- Change server directory
- Change server host
- Change server port
- Test connection to server

## Commands

### Upload (Default)

Upload files or folders from the current directory:

```bash
fileshare
# or
fileshare upload
```

The CLI will:
1. Display all files and folders in the current directory
2. Let you select a file or folder to upload
3. Ask for confirmation
4. Upload the selected item with progress tracking
5. Display the public URL for accessing the uploaded content

### Delete

Delete files from the server:

```bash
fileshare delete
```

The CLI will:
1. List all files on the server
2. Let you select multiple files to delete (use space to select)
3. Ask for confirmation
4. Delete the selected files
5. Display results

### Password Protection

Configure password protection for downloads:

```bash
fileshare password
```

**Note**: This feature requires server-side NGINX configuration and is not yet fully implemented.

### Setup

Configure SSH key and server settings:

```bash
fileshare setup
```

Options:
- Change SSH key name
- Change server directory
- Change server host
- Change server port
- Test connection to server

### About

Display application information:

```bash
fileshare about
```

## Architecture

This project follows the Negative Space Software CLI Design System with a three-layer architecture:

```
src/
├── commands/          # Command orchestration layer
│   ├── upload.js      # Upload command
│   ├── delete.js      # Delete command
│   ├── password.js    # Password command
│   ├── setup.js       # Setup command
│   └── about.js       # About command
├── ui/                # User interface layer
│   ├── select.js      # Interactive selection functions
│   └── display.js     # Display/output functions
├── api/               # Data layer
│   └── sftp.js        # SFTP operations wrapper
└── utils/             # Utilities
    ├── config.js      # Configuration management
    └── errors.js      # Error handling
```

## Dependencies

- **commander** (^14.0.1) - CLI framework and routing
- **inquirer** (^8.2.7) - Interactive prompts with arrow key navigation
- **chalk** (^4.1.2) - Terminal colors
- **dotenv** (^17.2.3) - Environment variable management
- **ssh2-sftp-client** (^10.0.3) - SFTP operations

## Server Details

- **Connection**: SSH key authentication to root user
- **Server OS**: Ubuntu Server
- **Target Directory**: `/root/fileshare`
- **Web Server**: NGINX on port 9091
- **Public Access**: https://fileshare.ct-42210.com (via Cloudflare Tunnel)

## Development

### Testing

```bash
# Test individual commands
node src/index.js about
node src/index.js setup

# Test with different directories
cd /path/to/test
node /path/to/fileshare-cli/src/index.js
```

### Code Style

- Small, focused functions (one task per function)
- Comprehensive error handling with complete stack traces
- Thorough code comments
- Consistent naming conventions:
  - camelCase for JavaScript variables and functions
  - kebab-case for file names
  - UPPER_SNAKE_CASE for constants

### Error Handling

All commands use try/catch blocks with complete error messages. The CLI **never** truncates errors and always displays full stack traces for debugging.

## Troubleshooting

### SSH Key Not Found

If you see "SSH key not found", run:

```bash
fileshare setup
```

Then select "Change SSH key name" and enter the name of your SSH key (without path).

### Connection Failed

If the connection test fails:

1. Verify your SSH key exists in `~/.ssh/`
2. Check that the key has correct permissions (`chmod 600 ~/.ssh/keyname`)
3. Verify the server host and port are correct
4. Test SSH connection manually: `ssh -i ~/.ssh/keyname -p PORT USER@HOST`

### Configuration Issues

Configuration is stored in `~/.fileshare/.env`. To reset:

```bash
rm -rf ~/.fileshare
fileshare setup
```

## License

ISC

## Author

Negative Space Software
