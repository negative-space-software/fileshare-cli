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

const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

/**
 * Generic selection
 */
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

/**
 * Item selection with formatting
 */
async function selectItem(items, formatFunction) {
  const choices = items.map(item => ({
    name: formatFunction(item),
    value: item
  }));

  return await select('Select an item:', choices);
}

/**
 * Select file or folder from current directory
 */
async function selectFileOrFolder(directory = '.') {
  const items = fs.readdirSync(directory)
    .filter(item => !item.startsWith('.')) // Hide hidden files
    .map(item => {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);
      return {
        name: item,
        path: fullPath,
        isDirectory: stat.isDirectory(),
        size: stat.size
      };
    });

  if (items.length === 0) {
    console.log(chalk.yellow('\n[!] No files or folders found in current directory\n'));
    return null;
  }

  const choices = items.map(item => ({
    name: item.isDirectory ? `${item.name}/ (folder)` : item.name,
    value: item
  }));

  return await select('Select a file or folder to upload:', choices);
}

/**
 * Select multiple files from server
 */
async function selectMultipleFiles(files) {
  const choices = files.map(file => ({
    name: file,
    value: file
  }));

  const answer = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selected',
      message: 'Select files to delete (use space to select):',
      choices: choices,
      pageSize: 15,
      validate: (answer) => {
        if (answer.length < 1) {
          return 'You must select at least one file';
        }
        return true;
      }
    }
  ]);

  return answer.selected;
}

/**
 * Confirmation
 */
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

/**
 * Text input with validation
 */
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

/**
 * Password input
 */
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

/**
 * Action menu
 */
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
  selectFileOrFolder,
  selectMultipleFiles,
  confirm,
  textInput,
  passwordInput,
  selectAction
};
