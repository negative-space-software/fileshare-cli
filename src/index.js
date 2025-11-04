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
const config = require('./utils/config');

// Load configuration at startup
config.loadConfig();

// Import commands
const uploadCommand = require('./commands/upload');
const deleteCommand = require('./commands/delete');
const passwordCommand = require('./commands/password');
const setupCommand = require('./commands/setup');
const aboutCommand = require('./commands/about');

// Create CLI program
const program = new Command();

program
  .name('fileshare')
  .description('CLI tool for securely transferring large files and folders')
  .version('1.0.0');

// Register commands
program
  .command('upload')
  .description('Upload files or folders from current directory')
  .action(() => uploadCommand());

program
  .command('delete')
  .description('Delete files from the server')
  .action(() => deleteCommand());

program
  .command('password')
  .description('Configure password protection for downloads')
  .action(() => passwordCommand());

program
  .command('setup')
  .description('Configure SSH key and server settings')
  .action(() => setupCommand());

program
  .command('about')
  .description('Display application information')
  .action(() => aboutCommand());

// Default behavior (no arguments) - run upload command
const args = process.argv.slice(2);
if (args.length === 0) {
  uploadCommand();
} else {
  program.parse(process.argv);
}
