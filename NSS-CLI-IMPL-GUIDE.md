# Negative Space Software - CLI Implementation Guide

## Overview
This comprehensive guide documents the CLI design system used across all Negative Space Software command-line applications. Use this guide to maintain consistency when building new CLI tools, or when prompting AI agents to create command-line interfaces that align with our brand identity and user experience standards.

All NSS CLI applications follow the same architectural patterns, interaction models, display formatting, and error handling approaches to ensure a consistent experience across all tools.

## Core Design Principles

### 1. **Interactive Navigation with Inquirer.js**
All NSS CLI applications use Inquirer.js for interactive prompts. This provides Firebase-style arrow key navigation with enter/space confirmation.

```javascript
const inquirer = require('inquirer');

// Basic selection menu
async function select(message, choices) {
  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'selection',
      message: message,
      choices: choices,
      pageSize: 15  // Standard page size for scrollable lists
    }
  ]);
  return answer.selection;
}

// Confirmation dialog
async function confirm(message) {
  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: message,
      default: false
    }
  ]);
  return answer.confirmed;
}

// Password/token input
async function passwordInput(message) {
  const answer = await inquirer.prompt([
    {
      type: 'password',
      name: 'password',
      message: message,
      mask: '*'
    }
  ]);
  return answer.password;
}

// Text input with validation
async function textInput(message, validator) {
  const answer = await inquirer.prompt([
    {
      type: 'input',
      name: 'text',
      message: message,
      validate: validator || ((input) => input.length > 0 || 'Input cannot be empty')
    }
  ]);
  return answer.text;
}
```

**Key Features:**
- Arrow keys navigate up/down through options
- Enter or Space confirms selection
- `pageSize: 15` enables pagination for long lists
- Choices format: `{ name: 'Display text', value: actualObject }`

### 2. **Text-Based Icon System**
NSS CLI applications never use Unicode emojis. All status indicators use ASCII text icons for maximum compatibility.

```javascript
// Icon constants
const ICONS = {
  INFO: '[*]',      // Information, loading, progress
  SUCCESS: '[+]',   // Success, completion
  WARNING: '[!]',   // Warning, caution
  ERROR: '[X]',     // Error, failure
  NAV: '[>]',       // Navigation, show more
  ERROR_HEADER: '[ERROR]'  // Error message header
};

// Usage with chalk colors
const chalk = require('chalk');

console.log(chalk.cyan(`\n${ICONS.INFO} Loading data...\n`));
console.log(chalk.green(`\n${ICONS.SUCCESS} Operation completed successfully!\n`));
console.log(chalk.yellow(`\n${ICONS.WARNING} Could not auto-detect configuration\n`));
console.log(chalk.red(`\n${ICONS.ERROR} Failed to authenticate\n`));
console.log(chalk.red(`\n${ICONS.ERROR_HEADER}\n`));
```

### 3. **Color System**
NSS CLI applications use a consistent color scheme with Chalk for terminal output.

```javascript
const chalk = require('chalk');

// Standard color usage
const COLORS = {
  // Status colors
  INFO: chalk.cyan,
  SUCCESS: chalk.green,
  WARNING: chalk.yellow,
  ERROR: chalk.red,

  // UI element colors
  HEADER: chalk.cyan,
  LABEL: chalk.gray,
  EMPHASIS: chalk.bold,

  // Custom colors (when needed)
  custom: (hexColor) => chalk.hex(hexColor)
};

// Example usage
console.log(COLORS.HEADER('Section Header'));
console.log(COLORS.LABEL('Label:'), 'value');
console.log(COLORS.SUCCESS('Success message'));
console.log(COLORS.custom('#abc123')('Custom colored text'));
```

**Color Guidelines:**
- **Cyan**: Section headers, loading messages
- **Green**: Success messages, positive actions
- **Yellow**: Warnings, alternative options
- **Red**: Errors, destructive actions
- **Gray**: Labels, secondary information
- **White**: Default text, primary content

### 4. **Three-Layer Architecture**
All NSS CLI applications follow a strict three-layer architecture for maintainability and code reuse.

```
src/
├── commands/          # Orchestration layer
│   ├── command1.js
│   └── command2.js
├── ui/                # User interaction layer
│   ├── select.js      # Interactive prompts
│   └── display.js     # Output formatting
├── api/ (or data/)    # Data layer
│   └── client.js      # API calls or data operations
└── utils/             # Utilities layer
    ├── config.js      # Configuration management
    ├── dates.js       # Date/time utilities
    └── errors.js      # Error handling
```

**Layer Responsibilities:**
- **Commands**: Orchestrate user flow, minimal business logic
- **UI**: Handle all user interaction and output formatting
- **Data/API**: Manage data fetching, transformation, storage
- **Utils**: Reusable utility functions

## Design Tokens

### Icons
```javascript
const ICONS = {
  INFO: '[*]',           // cyan
  SUCCESS: '[+]',        // green
  WARNING: '[!]',        // yellow
  ERROR: '[X]',          // red
  NAV: '[>]',           // default
  ERROR_HEADER: '[ERROR]'  // red
};
```

### Display Formatting
```javascript
// Separator line (80 characters)
const SEPARATOR = '='.repeat(80);

// Section separator
function displaySeparator() {
  console.log(SEPARATOR);
}

// Numbered menu items
function createMenuItem(number, text) {
  return `${number}. ${text}`;
}

// Labeled data display
function displayField(label, value) {
  console.log(chalk.gray(label + ':'), value);
}
```

### Date/Time Formatting
```javascript
// 24-hour time format (standard for NSS CLIs)
function formatDateTime(dateString) {
  if (!dateString) return 'Not set';

  const date = new Date(dateString);
  const now = new Date();

  // Today → "Today at HH:MM"
  if (date.toDateString() === now.toDateString()) {
    return `Today at ${date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })}`;
  }

  // Tomorrow → "Tomorrow at HH:MM"
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow at ${date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })}`;
  }

  // Other dates → "MMM DD, YYYY HH:MM"
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}
```

## Component Patterns

### 1. **Select Functions** (src/ui/select.js)
```javascript
const inquirer = require('inquirer');

// Generic selection
async function select(message, choices) {
  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'selection',
      message: message,
      choices: choices,
      pageSize: 15
    }
  ]);
  return answer.selection;
}

// Item selection with formatting
async function selectItem(items, formatFunction) {
  const choices = items.map(item => ({
    name: formatFunction(item),
    value: item
  }));

  return await select('Select an item:', choices);
}

// File selection from directory
async function selectFile(directory = '.') {
  const fs = require('fs');
  const path = require('path');

  const files = fs.readdirSync(directory).filter(file => {
    const stat = fs.statSync(path.join(directory, file));
    return stat.isFile();
  });

  if (files.length === 0) {
    console.log(chalk.yellow('\n[!] No files found in current directory\n'));
    return null;
  }

  return await select('Select a file:', files);
}

// Confirmation
async function confirm(message) {
  const answer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: message,
      default: false
    }
  ]);
  return answer.confirmed;
}

// Action menu
async function selectAction(actions) {
  const choices = actions.map((action, index) => ({
    name: `${index + 1}. ${action.label}`,
    value: action.value
  }));

  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Choose an action:',
      choices: choices
    }
  ]);

  return answer.action;
}

module.exports = {
  select,
  selectItem,
  selectFile,
  confirm,
  selectAction
};
```

### 2. **Display Functions** (src/ui/display.js)
```javascript
const chalk = require('chalk');
const SEPARATOR = '='.repeat(80);

// Display list of items
function displayList(title, items, formatFunction) {
  console.log(chalk.cyan(`\n${title}\n`));

  items.forEach((item, index) => {
    console.log(`${index + 1}. ${formatFunction(item)}`);
  });

  console.log(''); // Blank line at end
}

// Display detailed item view
function displayDetails(title, fields) {
  console.log('\n' + SEPARATOR);
  console.log(chalk.cyan(`  ${title}`));
  console.log(SEPARATOR + '\n');

  fields.forEach(field => {
    if (field.type === 'header') {
      console.log(chalk.bold(`\n${field.value}\n`));
    } else if (field.type === 'label') {
      console.log(chalk.gray(field.label + ':'), field.value);
    } else {
      console.log(field.value);
    }
  });

  console.log('\n' + SEPARATOR + '\n');
}

// Display item with action menu
async function displayWithActions(title, fields, actions) {
  displayDetails(title, fields);

  const choices = actions.map((action, index) => ({
    name: `${index + 1}. ${action.label}`,
    value: action.value
  }));

  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Choose an action:',
      choices: choices
    }
  ]);

  return answer.action;
}

// Display success message
function displaySuccess(message) {
  console.log(chalk.green(`\n[+] ${message}\n`));
}

// Display info message
function displayInfo(message) {
  console.log(chalk.cyan(`\n[*] ${message}\n`));
}

// Display warning message
function displayWarning(message) {
  console.log(chalk.yellow(`\n[!] ${message}\n`));
}

module.exports = {
  displayList,
  displayDetails,
  displayWithActions,
  displaySuccess,
  displayInfo,
  displayWarning
};
```

### 3. **Error Handling** (src/utils/errors.js)
```javascript
const chalk = require('chalk');

/**
 * CRITICAL: NEVER truncate errors
 * Always display complete error messages with full stack traces
 */
function displayError(error) {
  console.error(chalk.red('\n[ERROR]\n'));

  // HTTP errors with response
  if (error.response) {
    console.error(chalk.red('Status:'), error.response.status);
    console.error(chalk.red('Status Text:'), error.response.statusText);

    if (error.response.data) {
      console.error(chalk.red('\nResponse Data:'));
      console.error(JSON.stringify(error.response.data, null, 2));
    }

    if (error.response.headers) {
      console.error(chalk.red('\nResponse Headers:'));
      console.error(JSON.stringify(error.response.headers, null, 2));
    }
  }
  // Network errors
  else if (error.request) {
    console.error(chalk.red('No response received from server'));
    console.error(chalk.red('Request:'), error.request);
  }
  // Other errors
  else {
    console.error(chalk.red('Message:'), error.message);
  }

  // ALWAYS show full stack trace
  console.error(chalk.red('\nStack Trace:'));
  console.error(error.stack);

  console.error(''); // Blank line at end
}

/**
 * Require authentication check
 */
function requireAuth(config) {
  if (!config.isAuthenticated()) {
    console.error(chalk.red('\n[!] Not authenticated. Please run:'));
    console.error(chalk.yellow('  <app-name> auth\n'));
    process.exit(1);
  }
}

/**
 * Display validation error
 */
function displayValidationError(message) {
  console.error(chalk.red(`\n[X] ${message}\n`));
  process.exit(1);
}

module.exports = {
  displayError,
  requireAuth,
  displayValidationError
};
```

### 4. **Configuration Management** (src/utils/config.js)
```javascript
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration directory in user's home directory
// Format: ~/.app-name/.env
const CONFIG_DIR = path.join(os.homedir(), '.app-name');
const ENV_PATH = path.join(CONFIG_DIR, '.env');

/**
 * Initialize configuration directory
 */
function initConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Load configuration from .env file
 */
function loadConfig() {
  initConfigDir();

  if (fs.existsSync(ENV_PATH)) {
    require('dotenv').config({ path: ENV_PATH, quiet: true });
  }
}

/**
 * Save configuration to .env file
 */
function saveConfig(key, value) {
  initConfigDir();

  let envContent = '';

  // Read existing config
  if (fs.existsSync(ENV_PATH)) {
    envContent = fs.readFileSync(ENV_PATH, 'utf8');
  }

  // Parse existing lines
  const lines = envContent.split('\n');
  const updated = {};

  lines.forEach(line => {
    const [k, v] = line.split('=');
    if (k) updated[k.trim()] = v ? v.trim() : '';
  });

  // Update value
  updated[key] = value;

  // Write back
  const newContent = Object.entries(updated)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n';

  fs.writeFileSync(ENV_PATH, newContent);

  // Update process.env
  process.env[key] = value;
}

/**
 * Get configuration value
 */
function getConfig(key) {
  return process.env[key];
}

/**
 * Check if authenticated
 */
function isAuthenticated() {
  // Customize based on your auth requirements
  return !!getConfig('AUTH_TOKEN');
}

module.exports = {
  loadConfig,
  saveConfig,
  getConfig,
  isAuthenticated
};
```

### 5. **Command Structure Template**
```javascript
const chalk = require('chalk');
const { displayError, requireAuth } = require('../utils/errors');
const { displayInfo, displaySuccess, displayList } = require('../ui/display');
const { selectItem, confirm } = require('../ui/select');
const config = require('../utils/config');

/**
 * Standard command structure
 * All commands follow this 7-step pattern:
 * 1. Authenticate
 * 2. Load/Fetch data
 * 3. Select/Filter data
 * 4. Transform data
 * 5. Display results
 * 6. Handle actions (optional)
 * 7. Error handling
 */
async function commandName(options) {
  try {
    // 1. Authentication check
    requireAuth(config);

    // 2. Load/Fetch data
    displayInfo('Loading data...');
    const data = await fetchData();

    // 3. Select/Filter data
    let filtered = data;
    if (!options.all) {
      filtered = data.filter(item => someCondition(item));
    }

    // Check for empty results
    if (filtered.length === 0) {
      console.log(chalk.yellow('\n[!] No items found\n'));
      return;
    }

    // 4. Transform data
    const sorted = filtered.sort(sortFunction);

    // 5. Display results
    if (options.interactive) {
      const selected = await selectItem(sorted, formatFunction);
      if (!selected) return; // User cancelled

      // Display details
      await displayItemDetails(selected);
    } else {
      displayList('Items', sorted, formatFunction);
    }

    // 6. Handle actions (optional)
    // Action logic here

  } catch (error) {
    // 7. Error handling
    displayError(error);
    process.exit(1);
  }
}

module.exports = commandName;
```

### 6. **Authentication Command** (src/commands/auth.js)
```javascript
const chalk = require('chalk');
const inquirer = require('inquirer');
const { saveConfig } = require('../utils/config');
const { displayError, displayValidationError } = require('../utils/errors');
const { displaySuccess, displayInfo, displayWarning } = require('../ui/display');

async function authCommand() {
  try {
    console.log(chalk.cyan('\n=== Authentication ===\n'));

    // Prompt for credentials
    const token = await inquirer.prompt([
      {
        type: 'password',
        name: 'token',
        message: 'Enter your authentication token:',
        mask: '*',
        validate: (input) => input.length > 0 || 'Token cannot be empty'
      }
    ]).then(answers => answers.token);

    // Optional: Verify token
    displayInfo('Verifying token...');
    const isValid = await verifyToken(token);

    if (!isValid) {
      displayValidationError('Invalid token. Please try again.');
      return;
    }

    // Save configuration
    saveConfig('AUTH_TOKEN', token);

    displaySuccess('Authentication successful!');
    console.log(chalk.gray('Token saved to:'), `~/.app-name/.env\n`);

  } catch (error) {
    displayError(error);
    process.exit(1);
  }
}

async function verifyToken(token) {
  // Implement token verification logic
  // Return true if valid, false otherwise
  return true;
}

module.exports = authCommand;
```

### 7. **About Command with ASCII Art** (src/commands/about.js)

The about command displays application information with an optional ASCII art logo. It uses a clean, modern format without separator lines.

**Formatting Requirements:**
- ASCII logo: 40 width x 20 height, color enabled
- Cyan bold title for application name
- Bold labels with colored values:
  - Version: green text
  - Author: yellow text
  - License: magenta text (Apache License 2.0)
  - Server/Website: blue text
- Gray text for descriptions
- Simple spacing with blank lines (no separator lines)
- Graceful fallback if logo cannot be loaded (skip logo, show text only)

**Implementation:**

```javascript
const chalk = require('chalk');
const asciify = require('asciify-image');
const path = require('path');
const { displayError } = require('../utils/errors');

/**
 * About command - displays application information
 */
async function aboutCommand() {
  try {
    // Convert logo PNG to ASCII
    const logoPath = path.join(__dirname, '../../logo.png');

    try {
      const options = {
        fit: 'box',
        width: 40,      // Standard width for NSS CLI logos
        height: 20,     // Standard height for NSS CLI logos
        color: true     // Enable color ASCII art
      };

      const ascii = await asciify(logoPath, options);
      console.log('\n' + ascii);
    } catch (logoError) {
      // Fallback if logo can't be loaded - show text header instead
      console.log('');
    }

    // Application title - cyan bold
    console.log('\n  ' + chalk.cyan.bold('APPLICATION NAME'));
    console.log('');

    // Version - bold label with green value
    console.log('  ' + chalk.bold('Version:  ') + chalk.green('v1.0.0'));

    // Author - bold label with yellow value
    console.log('  ' + chalk.bold('Author:   ') + chalk.yellow('Negative Space Software'));

    // License - bold label with magenta value
    console.log('  ' + chalk.bold('License:  ') + chalk.magenta('Apache License 2.0'));
    console.log('');

    // Server/Website - bold label with blue value
    console.log('  ' + chalk.bold('Server:   ') + chalk.blue('https://example.com'));
    console.log('');

    // Description - gray text
    console.log('  ' + chalk.gray('Brief description of what this CLI tool does'));
    console.log('  ' + chalk.gray('Additional description line if needed'));
    console.log('');

  } catch (error) {
    displayError(error);
    process.exit(1);
  }
}

module.exports = aboutCommand;
```

**Color Palette:**
- Title: `chalk.cyan.bold()` - Application name
- Version value: `chalk.green()` - Success/positive color
- Author value: `chalk.yellow()` - Attention/highlight color
- License value: `chalk.magenta()` - Legal/licensing color
- Server/URL value: `chalk.blue()` - Link/navigation color
- Labels: `chalk.bold()` - Standard bold for field names
- Description: `chalk.gray()` - Secondary/muted text

**Spacing Standards:**
- One blank line after ASCII logo
- One blank line between title and first field
- No blank lines between Version, Author, and License
- One blank line before Server/URL (logical grouping)
- One blank line before description section
- One blank line at end of output

### 8. **Main Entry Point** (src/index.js)
```javascript
#!/usr/bin/env node

const { Command } = require('commander');
const config = require('./utils/config');

// Load configuration
config.loadConfig();

// Import commands
const authCommand = require('./commands/auth');
const listCommand = require('./commands/list');
const aboutCommand = require('./commands/about');

// Create CLI program
const program = new Command();

program
  .name('app-name')
  .description('CLI tool description')
  .version('1.0.0');

// Register commands
program
  .command('auth')
  .description('Authenticate with the service')
  .action(() => authCommand());

program
  .command('list')
  .description('List items')
  .option('-a, --all', 'Show all items')
  .action((options) => listCommand(options));

program
  .command('about')
  .description('Display application information')
  .action(() => aboutCommand());

// Default behavior (no arguments)
const args = process.argv.slice(2);
if (args.length === 0) {
  // Default to main command
  listCommand({});
} else {
  program.parse(process.argv);
}
```

## File Architecture

### Standard Directory Structure
```
project-root/
├── package.json              # Dependencies and scripts
├── LICENSE                   # Apache 2.0 license (REQUIRED)
├── .gitignore               # Exclude node_modules, .env, etc.
├── logo.png                 # Application logo for ASCII art
├── README.md                # Project documentation
├── src/
│   ├── index.js             # CLI entry point (#!/usr/bin/env node)
│   ├── commands/            # Command implementations
│   │   ├── auth.js          # Authentication command
│   │   ├── list.js          # List/view command
│   │   ├── create.js        # Create command
│   │   ├── update.js        # Update command
│   │   ├── delete.js        # Delete command
│   │   └── about.js         # About/version command
│   ├── ui/                  # User interface layer
│   │   ├── select.js        # Interactive selection functions
│   │   └── display.js       # Display/output functions
│   ├── api/ (or data/)      # Data layer
│   │   └── client.js        # API wrapper or data operations
│   └── utils/               # Utilities
│       ├── config.js        # Configuration management
│       ├── dates.js         # Date/time utilities
│       └── errors.js        # Error handling
└── ~/.app-name/.env         # User configuration (not in project)
```

### Configuration Storage
- Location: `~/.app-name/.env` (user's home directory)
- Benefits:
  - Works from any directory
  - Survives directory changes
  - More secure (not in project directories)
  - Follows CLI conventions (like ~/.ssh, ~/.git-credentials)

## Licensing Requirements

All Negative Space Software CLI applications **MUST** be licensed under the Apache License 2.0. This ensures consistency across all NSS projects and provides clear terms for use, modification, and distribution.

### 1. **Apache 2.0 License File**

Every project must include a `LICENSE` file in the project root containing the full Apache 2.0 license text with the copyright notice:

```
Copyright 2025 Negative Space Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

### 2. **License Headers in Source Files**

**ALL** source files (`.js` files) must include the Apache 2.0 license header at the top of the file. This header must be placed immediately after the shebang line (if present) and before any imports.

**Standard License Header:**

```javascript
/*
 * Copyright 2025 Negative Space Software
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
```

**Example with Shebang:**

```javascript
#!/usr/bin/env node

/*
 * Copyright 2025 Negative Space Software
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { Command } = require('commander');
// ... rest of file
```

### 3. **package.json License Field**

The `package.json` must specify the Apache 2.0 license:

```json
{
  "name": "app-name",
  "version": "1.0.0",
  "license": "Apache-2.0",
  "author": "Negative Space Software"
}
```

### 4. **About Command License Display**

The about command **MUST** display the license information. This should appear between the Author and Server/Website fields:

```javascript
console.log('  ' + chalk.bold('License:  ') + chalk.magenta('Apache License 2.0'));
```

See the "About Command with ASCII Art" section for the complete implementation.

### License Header Checklist

When creating or modifying files, ensure:
- [ ] LICENSE file exists in project root
- [ ] All `.js` files have license headers
- [ ] Headers appear after shebang (if present)
- [ ] Headers appear before imports
- [ ] Copyright year is current
- [ ] package.json specifies "Apache-2.0"
- [ ] About command displays license

## Required Dependencies

### package.json
```json
{
  "name": "app-name",
  "version": "1.0.0",
  "description": "CLI tool description",
  "main": "src/index.js",
  "bin": {
    "app-name": "./src/index.js"
  },
  "scripts": {
    "start": "node src/index.js"
  },
  "keywords": ["cli", "tool", "example"],
  "author": "Negative Space Software",
  "license": "Apache-2.0",
  "dependencies": {
    "commander": "^14.0.1",      // CLI framework and routing
    "inquirer": "^8.2.7",        // Interactive prompts
    "chalk": "^4.1.2",           // Terminal colors
    "dotenv": "^17.2.3",         // .env file loading
    "axios": "^1.12.2",          // HTTP client (if needed)
    "asciify-image": "^0.1.10",  // ASCII art conversion
    "open": "^8.4.2"             // Open URLs in browser (if needed)
  }
}
```

### Library Usage
| Library | Purpose | When to Use |
|---------|---------|-------------|
| **Commander.js** | CLI framework, argument parsing, command routing | Always required |
| **Inquirer.js** | Interactive prompts, arrow-key navigation | Always required |
| **Chalk** | Terminal color output | Always required |
| **Dotenv** | Environment variable management | Always required |
| **Axios** | HTTP requests | API-driven CLIs only |
| **Open** | Browser launching | When opening URLs |
| **Asciify-Image** | ASCII art conversion | For about command |

## Best Practices

### 1. **Error Handling**
- **NEVER truncate errors** - Always show complete messages
- Always show full stack traces
- Use try/catch in all commands
- Call `displayError(error)` for all errors
- Exit with `process.exit(1)` after errors

### 2. **User Experience**
- Show loading states with cyan `[*]` icon
- Check for null selections (user cancellation)
- Provide clear success/failure feedback
- Always offer "Return to terminal" in action menus
- Use 24-hour time format (`hour12: false`)

### 3. **Code Organization**
- Follow three-layer architecture strictly
- Keep commands focused on orchestration
- Reuse UI functions across commands
- Keep utility functions pure and testable
- One command per file

### 4. **Display Formatting**
- Use 80-character separator lines (`'='.repeat(80)`)
- Number action menu items (1., 2., 3.)
- Label data fields with gray labels
- Use consistent spacing (blank lines between sections)
- Use borders for detail views

### 5. **Security**
- Store credentials in `~/.app-name/.env`
- Add `.env` to `.gitignore`
- Use password input masking for sensitive data
- Never log or display credentials
- Validate all user inputs

### 6. **Configuration**
- Use home directory for persistence
- Load config at startup
- Provide auth command for setup
- Check authentication in all commands
- Support config override via environment variables

### 7. **Interactive Selection**
- Set `pageSize: 15` for pagination
- Format choice names clearly
- Return actual objects, not strings
- Handle user cancellation (null checks)
- Provide meaningful default selections

### 8. **Consistency**
- Use same icon system across all commands
- Use same color scheme across all commands
- Use same display patterns across all commands
- Use same error handling across all commands
- Follow command structure template

## Implementation Checklist

When building a new NSS CLI application:

- [ ] Set up three-layer directory structure (commands, ui, api/data, utils)
- [ ] Install required dependencies (commander, inquirer, chalk, dotenv)
- [ ] Create main entry point with Commander.js setup
- [ ] Implement configuration management (utils/config.js)
- [ ] Implement error handling (utils/errors.js)
- [ ] Create select functions (ui/select.js)
- [ ] Create display functions (ui/display.js)
- [ ] Implement authentication command
- [ ] Implement about command with ASCII art and license display
- [ ] Add logo.png to project root
- [ ] Add LICENSE file with Apache 2.0 license text
- [ ] Add license headers to all .js source files
- [ ] Set license field in package.json to "Apache-2.0"
- [ ] Create .gitignore (exclude node_modules, .env)
- [ ] Test authentication flow
- [ ] Test interactive selection with arrow keys
- [ ] Verify error messages show complete stack traces
- [ ] Test from different directories (config persistence)
- [ ] Verify all icons are text-based (no emojis)
- [ ] Verify 24-hour time format
- [ ] Verify consistent color usage
- [ ] Verify about command displays license
- [ ] Set up bin in package.json for global install
- [ ] Test `npm install -g` installation
- [ ] Document all commands in README

## Example Prompt for AI Agents

When requesting NSS CLI applications from AI agents, use this template:

```
Create a CLI application following Negative Space Software standards:

**Architecture:**
- Three-layer structure: commands/, ui/, api/ (or data/), utils/
- Commander.js for CLI framework
- Inquirer.js for interactive prompts (arrow keys, enter/space confirmation)
- Chalk for terminal colors
- Configuration in ~/.app-name/.env

**Licensing (REQUIRED):**
- Apache License 2.0
- LICENSE file in project root with full license text
- License headers in ALL .js source files
- License field in package.json: "Apache-2.0"
- About command must display license in magenta

**User Interface:**
- Text-based icons: [*] (info/cyan), [+] (success/green), [!] (warning/yellow), [X] (error/red)
- Color scheme: cyan headers, green success, yellow warnings, red errors, gray labels
- 24-hour time format
- 80-character separator lines with '=' characters
- Numbered action menus (1., 2., 3.)
- PageSize: 15 for scrollable lists

**Commands:**
- auth: Authentication setup
- list: List items (default command)
- about: Show version, author, license, and ASCII art logo
- [custom commands as needed]

**Error Handling:**
- NEVER truncate errors
- Always show complete error messages
- Always show full stack traces
- Try/catch in all commands with displayError()

**Standards:**
- Follow command structure template (7 steps)
- Require authentication for non-auth commands
- Handle user cancellation (null checks)
- Provide loading states
- Success/failure feedback
- Reusable UI functions
```

## Command Flow Pattern

All NSS CLI commands follow this standard flow:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. AUTHENTICATE                                             │
│    requireAuth(config)                                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. LOAD/FETCH                                               │
│    displayInfo('Loading...')                                │
│    data = await fetchData()                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. SELECT/FILTER                                            │
│    filtered = data.filter(condition)                        │
│    selected = await selectItem(filtered, formatFunc)        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. TRANSFORM                                                │
│    sorted = filtered.sort(sortFunction)                     │
│    enriched = sorted.map(enrichFunction)                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. DISPLAY                                                  │
│    displayList() or displayDetails()                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. ACTION MENU (optional)                                   │
│    action = await selectAction(actions)                     │
│    handleAction(action)                                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. ERROR HANDLING                                           │
│    try/catch with displayError(error)                       │
│    process.exit(1)                                          │
└─────────────────────────────────────────────────────────────┘
```

## Advanced Patterns

### Multi-Tier Selection
When implementing hierarchical selection (e.g., category → item → action):

```javascript
async function hierarchicalCommand() {
  try {
    requireAuth(config);

    // Level 1: Select category
    displayInfo('Loading categories...');
    const categories = await fetchCategories();
    const category = await selectItem(categories, c => c.name);
    if (!category) return;

    // Level 2: Select item from category
    displayInfo('Loading items...');
    const items = await fetchItems(category.id);
    const item = await selectItem(items, i => `${i.name} - ${i.description}`);
    if (!item) return;

    // Level 3: Display details and action menu
    await displayItemDetails(item);
    const action = await selectAction([
      { label: 'Edit item', value: 'edit' },
      { label: 'Delete item', value: 'delete' },
      { label: 'Return to terminal', value: 'exit' }
    ]);

    // Handle action
    if (action === 'edit') {
      await editItem(item);
    } else if (action === 'delete') {
      const confirmed = await confirm(`Delete ${item.name}?`);
      if (confirmed) await deleteItem(item.id);
    }

  } catch (error) {
    displayError(error);
    process.exit(1);
  }
}
```

### Paginated "Show All" Pattern
When showing a subset by default with option to expand:

```javascript
const inquirer = require('inquirer');

async function selectWithShowAll(items, defaultFilter, formatFunction) {
  const defaultItems = items.filter(defaultFilter);

  // Create choices for default items
  let choices = defaultItems.map(item => ({
    name: formatFunction(item),
    value: item
  }));

  // Add "Show All" option if there are more items
  if (items.length > defaultItems.length) {
    choices.push(new inquirer.Separator());
    choices.push({
      name: `[>] Show all ${items.length} items`,
      value: '__SHOW_ALL__'
    });
  }

  // First selection
  const selected = await select('Select an item:', choices);

  // If "Show All" was selected, show again with all items
  if (selected === '__SHOW_ALL__') {
    const allChoices = items.map(item => ({
      name: formatFunction(item),
      value: item
    }));
    return await select('Select an item:', allChoices);
  }

  return selected;
}
```

### Color Caching Pattern
When implementing custom colors that should be consistent across displays:

```javascript
const chalk = require('chalk');

// In-memory color cache
const colorCache = new Map();

function getColorFunction(itemId, customColor) {
  // Return cached color function if available
  if (colorCache.has(itemId)) {
    return colorCache.get(itemId);
  }

  let colorFunc;

  if (customColor) {
    // Use custom hex color
    colorFunc = (text) => chalk.hex(customColor)(text);
  } else {
    // Fallback to hash-based color
    const colors = [chalk.cyan, chalk.green, chalk.yellow, chalk.magenta, chalk.blue, chalk.red];
    const hash = itemId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    colorFunc = colors[hash % colors.length];
  }

  // Cache the function
  colorCache.set(itemId, colorFunc);
  return colorFunc;
}
```

## Testing Your CLI

### Manual Testing Checklist
- [ ] Run without arguments (default command works)
- [ ] Run auth command (configuration saves to ~/.app-name/.env)
- [ ] Run from different directories (config persists)
- [ ] Arrow key navigation works
- [ ] Enter/Space both confirm selections
- [ ] ESC or Ctrl+C cancels selection
- [ ] Loading messages display correctly
- [ ] Success messages display correctly
- [ ] Error messages show complete stack traces
- [ ] Color output works in terminal
- [ ] Icons display as text (no emoji rendering)
- [ ] Time displays in 24-hour format
- [ ] Separator lines are 80 characters
- [ ] Action menus are numbered
- [ ] "Show all" pattern works if implemented
- [ ] About command displays ASCII art
- [ ] Multi-tier selection handles cancellation at each level

### Common Issues
1. **Colors not showing**: Make sure chalk version is 4.x (not 5.x which is ESM-only)
2. **Inquirer not working**: Use inquirer 8.x (not 9.x which is ESM-only)
3. **Config not persisting**: Check `~/.app-name/.env` exists and has correct permissions
4. **ASCII art not displaying**: Verify logo.png exists and path is correct
5. **Arrow keys not working**: Check terminal supports ANSI escape codes

## Migration Guide

When converting an existing CLI to NSS standards:

1. **Create directory structure**: Move files to commands/, ui/, utils/, api/
2. **Replace console.log with display functions**: Use displayInfo, displaySuccess, etc.
3. **Replace raw prompts with select functions**: Use select, confirm, textInput
4. **Add error handling**: Wrap commands in try/catch with displayError
5. **Move config to home directory**: Change from project .env to ~/.app-name/.env
6. **Replace emojis with text icons**: Use [*], [+], [!], [X]
7. **Standardize colors**: Use chalk with consistent color scheme
8. **Add about command**: Create with ASCII art
9. **Update package.json**: Add bin field for global install
10. **Test all flows**: Verify arrow keys, colors, error handling

---

This implementation guide ensures consistent, professional CLI applications across all Negative Space Software products. Following these patterns creates maintainable, user-friendly command-line tools with a cohesive look and feel.
