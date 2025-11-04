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
const { displayError, requireConfig } = require('../utils/errors');
const { displayInfo, displaySuccess, displayProgress, displayUploadComplete } = require('../ui/display');
const { selectFileOrFolder, confirm } = require('../ui/select');
const config = require('../utils/config');
const sftp = require('../api/sftp');

/**
 * Upload command - uploads files or folders to the server
 * This is the default command when running just 'fileshare'
 */
async function uploadCommand(options = {}) {
  try {
    // 1. Check configuration
    requireConfig(config);

    // 2. Select file or folder to upload
    const item = await selectFileOrFolder(process.cwd());

    if (!item) {
      return; // User cancelled or no items found
    }

    // 3. Confirm upload
    const confirmMessage = item.isDirectory
      ? `Upload folder "${item.name}" and all its contents?`
      : `Upload file "${item.name}"?`;

    const confirmed = await confirm(confirmMessage);

    if (!confirmed) {
      console.log(chalk.yellow('\n[!] Upload cancelled\n'));
      return;
    }

    // 4. Perform upload
    if (item.isDirectory) {
      // Upload folder
      displayInfo(`Uploading folder: ${item.name}`);

      const result = await sftp.uploadFolder(item.path);

      displaySuccess(`Folder uploaded: ${result.filename}`);
      console.log(chalk.cyan('Access your files at:'));
      console.log(chalk.bold(result.url));
      console.log('');
    } else {
      // Upload file with progress
      let lastProgress = 0;

      const result = await sftp.uploadFile(item.path, null, (current, total, filename) => {
        // Only update progress every 5%
        const currentProgress = Math.floor((current / total) * 100);
        if (currentProgress >= lastProgress + 5 || current === total) {
          displayProgress(current, total, filename);
          lastProgress = currentProgress;
        }
      });

      displayUploadComplete(result.filename, result.url);
    }

  } catch (error) {
    displayError(error);
    process.exit(1);
  }
}

module.exports = uploadCommand;
