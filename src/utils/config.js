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

const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration directory in user's home directory
const CONFIG_DIR = path.join(os.homedir(), '.fileshare');
const ENV_PATH = path.join(CONFIG_DIR, '.env');

// Default configuration values
// Note: Update these in ~/.fileshare/.env or via 'fileshare setup'
const DEFAULTS = {
  SSH_KEY_NAME: 'id_ed25519',
  SERVER_USER: 'root',
  SERVER_HOST: 'your-server-host.com',
  SERVER_DIRECTORY: '/root/fileshare',
  SERVER_PORT: '22'
};

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
  } else {
    // Initialize with defaults if config doesn't exist
    Object.entries(DEFAULTS).forEach(([key, value]) => {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    });
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
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [k, ...rest] = trimmedLine.split('=');
      if (k) {
        updated[k.trim()] = rest.join('=').trim();
      }
    }
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
  return process.env[key] || DEFAULTS[key];
}

/**
 * Get SSH key path (resolves ~/.ssh/ directory)
 */
function getSSHKeyPath() {
  const keyName = getConfig('SSH_KEY_NAME');
  return path.join(os.homedir(), '.ssh', keyName);
}

/**
 * Check if configuration is set up
 */
function isConfigured() {
  const keyPath = getSSHKeyPath();
  return fs.existsSync(keyPath);
}

/**
 * Get all configuration values
 */
function getAllConfig() {
  return {
    sshKeyName: getConfig('SSH_KEY_NAME'),
    sshKeyPath: getSSHKeyPath(),
    serverUser: getConfig('SERVER_USER'),
    serverHost: getConfig('SERVER_HOST'),
    serverDirectory: getConfig('SERVER_DIRECTORY'),
    serverPort: getConfig('SERVER_PORT')
  };
}

module.exports = {
  loadConfig,
  saveConfig,
  getConfig,
  getSSHKeyPath,
  isConfigured,
  getAllConfig,
  CONFIG_DIR,
  ENV_PATH
};
