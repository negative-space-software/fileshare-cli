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

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { displayError } = require('../utils/errors');
const { displayInfo, displaySuccess, displayField, displaySeparator } = require('../ui/display');
const { textInput, selectAction, confirm } = require('../ui/select');
const config = require('../utils/config');
const sftp = require('../api/sftp');

/**
 * Setup command - configure SSH key and server settings
 */
async function setupCommand(options = {}) {
  try {
    console.log(chalk.cyan('\n=== Fileshare Configuration ===\n'));

    // Display current configuration
    const currentConfig = config.getAllConfig();

    console.log(chalk.bold('Current Configuration:\n'));
    displayField('SSH Key Name', currentConfig.sshKeyName);
    displayField('SSH Key Path', currentConfig.sshKeyPath);
    displayField('Key Exists', fs.existsSync(currentConfig.sshKeyPath) ? chalk.green('Yes') : chalk.red('No'));
    displayField('Server Host', currentConfig.serverHost);
    displayField('Server User', currentConfig.serverUser);
    displayField('Server Port', currentConfig.serverPort);
    displayField('Server Directory', currentConfig.serverDirectory);
    displayField('Config Location', config.ENV_PATH);
    console.log('');

    // Action menu
    const action = await selectAction([
      { label: 'Change SSH key name', value: 'ssh_key' },
      { label: 'Change server directory', value: 'server_dir' },
      { label: 'Change server host', value: 'server_host' },
      { label: 'Change server port', value: 'server_port' },
      { label: 'Test connection', value: 'test' },
      { label: 'Return to terminal', value: 'exit' }
    ]);

    switch (action) {
      case 'ssh_key':
        await changeSSHKey();
        break;

      case 'server_dir':
        await changeServerDirectory();
        break;

      case 'server_host':
        await changeServerHost();
        break;

      case 'server_port':
        await changeServerPort();
        break;

      case 'test':
        await testServerConnection();
        break;

      case 'exit':
        return;
    }

  } catch (error) {
    displayError(error);
    process.exit(1);
  }
}

/**
 * Change SSH key name
 */
async function changeSSHKey() {
  console.log(chalk.cyan('\n=== Change SSH Key ===\n'));

  const sshDir = path.join(os.homedir(), '.ssh');
  console.log(chalk.gray('SSH keys are typically located in:'), sshDir);
  console.log('');

  const keyName = await textInput(
    'Enter SSH key name (without path):',
    (input) => {
      if (input.length === 0) return 'Key name cannot be empty';

      const keyPath = path.join(sshDir, input);
      if (!fs.existsSync(keyPath)) {
        return `Key file not found: ${keyPath}`;
      }

      return true;
    }
  );

  config.saveConfig('SSH_KEY_NAME', keyName);
  displaySuccess(`SSH key updated to: ${keyName}`);

  // Test connection
  const testNow = await confirm('Test connection with new key?');
  if (testNow) {
    await testServerConnection();
  }
}

/**
 * Change server directory
 */
async function changeServerDirectory() {
  console.log(chalk.cyan('\n=== Change Server Directory ===\n'));

  const currentDir = config.getConfig('SERVER_DIRECTORY');
  console.log(chalk.gray('Current:'), currentDir);
  console.log('');

  const newDir = await textInput(
    'Enter new server directory path:',
    (input) => {
      if (input.length === 0) return 'Directory path cannot be empty';
      if (!input.startsWith('/')) return 'Path must be absolute (start with /)';
      return true;
    }
  );

  config.saveConfig('SERVER_DIRECTORY', newDir);
  displaySuccess(`Server directory updated to: ${newDir}`);
}

/**
 * Change server host
 */
async function changeServerHost() {
  console.log(chalk.cyan('\n=== Change Server Host ===\n'));

  const currentHost = config.getConfig('SERVER_HOST');
  console.log(chalk.gray('Current:'), currentHost);
  console.log('');

  const newHost = await textInput(
    'Enter new server host:',
    (input) => input.length > 0 || 'Host cannot be empty'
  );

  config.saveConfig('SERVER_HOST', newHost);
  displaySuccess(`Server host updated to: ${newHost}`);

  // Test connection
  const testNow = await confirm('Test connection with new host?');
  if (testNow) {
    await testServerConnection();
  }
}

/**
 * Change server port
 */
async function changeServerPort() {
  console.log(chalk.cyan('\n=== Change Server Port ===\n'));

  const currentPort = config.getConfig('SERVER_PORT');
  console.log(chalk.gray('Current:'), currentPort);
  console.log('');

  const newPort = await textInput(
    'Enter new server port:',
    (input) => {
      const port = parseInt(input);
      if (isNaN(port) || port < 1 || port > 65535) {
        return 'Port must be a number between 1 and 65535';
      }
      return true;
    }
  );

  config.saveConfig('SERVER_PORT', newPort);
  displaySuccess(`Server port updated to: ${newPort}`);
}

/**
 * Test server connection
 */
async function testServerConnection() {
  console.log('');
  displayInfo('Testing connection to server...');

  try {
    await sftp.testConnection();
    displaySuccess('Connection successful!');
  } catch (error) {
    console.log(chalk.red('\n[X] Connection failed\n'));
    console.log(chalk.red('Error:'), error.message);
    console.log('');
    console.log(chalk.yellow('Please check your configuration and try again.\n'));
  }
}

module.exports = setupCommand;
