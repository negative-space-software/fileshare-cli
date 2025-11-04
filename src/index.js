#!/usr/bin/env node

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
