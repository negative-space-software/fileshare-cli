# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**fileshare-cli** is a Node.js CLI application for securely transferring large files and folders between computers, proxied through a dedicated server. The CLI uploads content to an NGINX static file-sharing server accessible at https://fileshare.ct-42210.com, hosted using Cloudflare tunnels.

## Key Reference Documents

- **outline.txt**: Contains the core project requirements, server details, and ongoing instructions. Always check this file for the latest project specifications.
- **NSS-CLI-IMPLEMENTATION-GUIDE.md**: Comprehensive design system and patterns for all Negative Space Software CLI applications. This defines the architecture, UI patterns, and coding standards to follow.

## Development Commands

This project is in the planning stage and does not yet have a codebase. When development begins, typical commands will include:

```bash
# Install dependencies
npm install

# Run CLI locally during development
node src/index.js [command]

# Install globally for testing
npm install -g .

# Run installed CLI
fileshare [command]
```

## CLI Commands (Planned)

- `fileshare` or `fileshare upload` - Upload files/folders from current directory
- `fileshare delete` - Delete files from the server
- `fileshare password` - Set password protection for downloads
- `fileshare about` - Display about information
- `fileshare setup` - Configure SSH key and server directory location

## Architecture

### NSS CLI Design System

This project **MUST** follow the Negative Space Software CLI Implementation Guide (see NSS-CLI-IMPLEMENTATION-GUIDE.md). Key requirements:

**Three-Layer Architecture:**
- `src/commands/` - Orchestration layer for each CLI command
- `src/ui/` - User interaction (select.js, display.js) using Inquirer.js
- `src/api/` or `src/data/` - Data operations (SSH/SFTP operations)
- `src/utils/` - Configuration, error handling, date formatting

**UI Standards:**
- Interactive navigation with Inquirer.js (arrow keys, enter/space confirmation)
- Text-based icons only: `[*]` (info/cyan), `[+]` (success/green), `[!]` (warning/yellow), `[X]` (error/red)
- Chalk color system: cyan (headers/info), green (success), yellow (warnings), red (errors), gray (labels)
- 24-hour time format
- 80-character separator lines

**Dependencies:**
- commander - CLI framework and routing
- inquirer v8.x - Interactive prompts (NOT v9+)
- chalk v4.x - Terminal colors (NOT v5+)
- dotenv - Environment variable management
- SSH/SFTP library for file transfers (e.g., ssh2-sftp-client)

### Configuration Storage

Configuration must be stored in `~/.fileshare/.env` (not in the project directory) to ensure persistence across different working directories. This includes:
- SSH key path (default: "njt-hpe-proliant")
- Server directory location
- Server connection details

### Server Details

- SSH connection: Uses key "njt-hpe-proliant" to connect as root user
- Server OS: Ubuntu Server
- Target directory: /root/fileshare (served by NGINX on port 9091)
- Web access: https://fileshare.ct-42210.com (proxied via existing Cloudflare Tunnel)
- Upload directory: Files uploaded to /root/fileshare/ are accessible via the web interface
- Existing services: Cloudflare tunnel already configured with ingress rules for multiple services

## Coding Practices

Functions should be small and focused on a single task. Avoid large monolithic functions.

Separate code among files appropriately:
- One command per file in src/commands/
- Separate UI logic from business logic
- Reusable utilities in src/utils/

Comment code thoroughly to explain logic and decisions. Be professional and concise. Do not leave debug comments in final code.

Use consistent naming conventions:
- camelCase for JavaScript variables and functions
- kebab-case for file names
- UPPER_SNAKE_CASE for constants

Error handling must be comprehensive with **exact error messages** - no generic messages like "An error occurred". Always display complete error messages with full stack traces (never truncate).

When requirements are unclear or ambiguous, or when a critical architectural decision is needed, ask questions before proceeding.

Update outline.txt, CLAUDE.md, and any documentation when making changes to instructions or project structure.

## Error Handling Requirements

From NSS-CLI-IMPLEMENTATION-GUIDE.md:
- **NEVER truncate errors**
- Always show complete error messages with full stack traces
- Use try/catch in all commands
- Call `displayError(error)` from `src/utils/errors.js`
- Exit with `process.exit(1)` after errors

## Testing Before Commits

When the codebase is implemented, test:
- Arrow key navigation in all menus
- Configuration persistence across different working directories
- SSH authentication with the specified key
- File upload/download functionality
- Error handling with complete stack traces
- All CLI commands work as expected
