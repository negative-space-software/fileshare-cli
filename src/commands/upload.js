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
