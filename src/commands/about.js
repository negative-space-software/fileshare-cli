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
        width: 40,
        height: 20,
        color: true
      };

      const ascii = await asciify(logoPath, options);
      console.log('\n' + ascii);
    } catch (logoError) {
      // Fallback if logo can't be loaded - show text header
      console.log('');
    }

    console.log('\n  ' + chalk.cyan.bold('FILESHARE CLI'));
    console.log('');
    console.log('  ' + chalk.bold('Version:  ') + chalk.green('v1.0.0'));
    console.log('  ' + chalk.bold('Author:   ') + chalk.yellow('Negative Space Software'));
    console.log('  ' + chalk.bold('License:  ') + chalk.magenta('Apache License 2.0'));
    console.log('');
    console.log('  ' + chalk.bold('Server:   ') + chalk.blue('https://fileshare.ct-42210.com'));
    console.log('');
    console.log('  ' + chalk.gray('Securely transfer large files and folders between computers'));
    console.log('  ' + chalk.gray('Built with Node.js, Inquirer, Chalk, and SFTP'));
    console.log('');

  } catch (error) {
    displayError(error);
    process.exit(1);
  }
}

module.exports = aboutCommand;
