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

const SftpClient = require('ssh2-sftp-client');
const fs = require('fs');
const path = require('path');
const config = require('../utils/config');

/**
 * Create and configure SFTP client
 */
async function createClient() {
  const sftp = new SftpClient();

  const sshConfig = {
    host: config.getConfig('SERVER_HOST'),
    port: parseInt(config.getConfig('SERVER_PORT')),
    username: config.getConfig('SERVER_USER'),
    privateKey: fs.readFileSync(config.getSSHKeyPath())
  };

  await sftp.connect(sshConfig);
  return sftp;
}

/**
 * Upload a file to the server
 * @param {string} localPath - Local file path
 * @param {string} remoteName - Remote filename (optional, defaults to local filename)
 * @param {function} progressCallback - Callback for progress updates (current, total)
 */
async function uploadFile(localPath, remoteName = null, progressCallback = null) {
  const sftp = await createClient();

  try {
    const filename = remoteName || path.basename(localPath);
    const remoteDir = config.getConfig('SERVER_DIRECTORY');
    const remotePath = path.posix.join(remoteDir, filename);

    // Ensure remote directory exists
    await sftp.mkdir(remoteDir, true);

    // Upload file with progress tracking
    await sftp.fastPut(localPath, remotePath, {
      step: (total_transferred, chunk, total) => {
        if (progressCallback) {
          progressCallback(total_transferred, total, filename);
        }
      }
    });

    return {
      filename: filename,
      url: `https://fileshare.ct-42210.com/${filename}`
    };
  } finally {
    await sftp.end();
  }
}

/**
 * Upload a folder to the server (recursively)
 * @param {string} localPath - Local folder path
 * @param {string} remoteName - Remote folder name (optional, defaults to local folder name)
 */
async function uploadFolder(localPath, remoteName = null) {
  const sftp = await createClient();

  try {
    const folderName = remoteName || path.basename(localPath);
    const remoteDir = config.getConfig('SERVER_DIRECTORY');
    const remotePath = path.posix.join(remoteDir, folderName);

    // Upload entire directory
    await sftp.uploadDir(localPath, remotePath);

    return {
      filename: folderName,
      url: `https://fileshare.ct-42210.com/${folderName}`
    };
  } finally {
    await sftp.end();
  }
}

/**
 * List files on the server
 */
async function listFiles() {
  const sftp = await createClient();

  try {
    const remoteDir = config.getConfig('SERVER_DIRECTORY');

    // Check if directory exists
    const exists = await sftp.exists(remoteDir);
    if (!exists) {
      return [];
    }

    const fileList = await sftp.list(remoteDir);

    // Filter out . and .. entries and return just names
    return fileList
      .filter(item => item.name !== '.' && item.name !== '..')
      .map(item => ({
        name: item.name,
        type: item.type === 'd' ? 'directory' : 'file',
        size: item.size,
        modifyTime: item.modifyTime
      }));
  } finally {
    await sftp.end();
  }
}

/**
 * Delete a file from the server
 * @param {string} filename - Filename to delete
 */
async function deleteFile(filename) {
  const sftp = await createClient();

  try {
    const remoteDir = config.getConfig('SERVER_DIRECTORY');
    const remotePath = path.posix.join(remoteDir, filename);

    // Check if it's a directory or file
    const stat = await sftp.stat(remotePath);

    if (stat.isDirectory) {
      // Remove directory recursively
      await sftp.rmdir(remotePath, true);
    } else {
      // Remove file
      await sftp.delete(remotePath);
    }

    return true;
  } finally {
    await sftp.end();
  }
}

/**
 * Delete multiple files from the server
 * @param {string[]} filenames - Array of filenames to delete
 */
async function deleteMultipleFiles(filenames) {
  const results = [];

  for (const filename of filenames) {
    try {
      await deleteFile(filename);
      results.push({ filename, success: true });
    } catch (error) {
      results.push({ filename, success: false, error: error.message });
    }
  }

  return results;
}

/**
 * Test connection to server
 */
async function testConnection() {
  const sftp = await createClient();
  await sftp.end();
  return true;
}

module.exports = {
  uploadFile,
  uploadFolder,
  listFiles,
  deleteFile,
  deleteMultipleFiles,
  testConnection
};
