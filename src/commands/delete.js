const chalk = require('chalk');
const { displayError, requireConfig } = require('../utils/errors');
const { displayInfo, displaySuccess, displayWarning, displayList } = require('../ui/display');
const { selectMultipleFiles, confirm } = require('../ui/select');
const config = require('../utils/config');
const sftp = require('../api/sftp');

/**
 * Delete command - deletes files or folders from the server
 */
async function deleteCommand(options = {}) {
  try {
    // 1. Check configuration
    requireConfig(config);

    // 2. Load files from server
    displayInfo('Loading files from server...');
    const files = await sftp.listFiles();

    if (files.length === 0) {
      displayWarning('No files found on server');
      return;
    }

    // 3. Display available files
    console.log(chalk.cyan('\nFiles on server:\n'));
    files.forEach((file, index) => {
      const typeIcon = file.type === 'directory' ? '/' : '';
      const sizeStr = file.type === 'file' ? ` (${formatBytes(file.size)})` : '';
      console.log(`  ${index + 1}. ${file.name}${typeIcon}${sizeStr}`);
    });
    console.log('');

    // 4. Select files to delete
    const selectedFiles = await selectMultipleFiles(files.map(f => f.name));

    if (selectedFiles.length === 0) {
      displayWarning('No files selected');
      return;
    }

    // 5. Confirm deletion
    const message = selectedFiles.length === 1
      ? `Delete "${selectedFiles[0]}"?`
      : `Delete ${selectedFiles.length} items?`;

    const confirmed = await confirm(message);

    if (!confirmed) {
      console.log(chalk.yellow('\n[!] Deletion cancelled\n'));
      return;
    }

    // 6. Delete files
    displayInfo(`Deleting ${selectedFiles.length} item(s)...`);

    const results = await sftp.deleteMultipleFiles(selectedFiles);

    // 7. Display results
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (successful.length > 0) {
      displaySuccess(`Deleted ${successful.length} item(s)`);
      successful.forEach(r => {
        console.log(chalk.gray('  - ') + r.filename);
      });
      console.log('');
    }

    if (failed.length > 0) {
      displayWarning(`Failed to delete ${failed.length} item(s)`);
      failed.forEach(r => {
        console.log(chalk.red('  - ') + r.filename + chalk.gray(` (${r.error})`));
      });
      console.log('');
    }

  } catch (error) {
    displayError(error);
    process.exit(1);
  }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

module.exports = deleteCommand;
