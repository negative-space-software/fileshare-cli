const chalk = require('chalk');

const SEPARATOR = '='.repeat(80);

/**
 * Display separator line
 */
function displaySeparator() {
  console.log(SEPARATOR);
}

/**
 * Display list of items
 */
function displayList(title, items, formatFunction) {
  console.log(chalk.cyan(`\n${title}\n`));

  items.forEach((item, index) => {
    console.log(`${index + 1}. ${formatFunction(item)}`);
  });

  console.log(''); // Blank line at end
}

/**
 * Display detailed item view
 */
function displayDetails(title, fields) {
  console.log('\n' + SEPARATOR);
  console.log(chalk.cyan(`  ${title}`));
  console.log(SEPARATOR + '\n');

  fields.forEach(field => {
    if (field.type === 'header') {
      console.log(chalk.bold(`\n${field.value}\n`));
    } else if (field.type === 'label') {
      console.log(chalk.gray(field.label + ':'), field.value);
    } else {
      console.log(field.value);
    }
  });

  console.log('\n' + SEPARATOR + '\n');
}

/**
 * Display success message
 */
function displaySuccess(message) {
  console.log(chalk.green(`\n[+] ${message}\n`));
}

/**
 * Display info message
 */
function displayInfo(message) {
  console.log(chalk.cyan(`\n[*] ${message}\n`));
}

/**
 * Display warning message
 */
function displayWarning(message) {
  console.log(chalk.yellow(`\n[!] ${message}\n`));
}

/**
 * Display error message
 */
function displayErrorMessage(message) {
  console.log(chalk.red(`\n[X] ${message}\n`));
}

/**
 * Display file upload progress
 */
function displayProgress(current, total, filename) {
  const percent = Math.round((current / total) * 100);
  const bar = '█'.repeat(Math.floor(percent / 2)) + '░'.repeat(50 - Math.floor(percent / 2));
  process.stdout.write(`\r${chalk.cyan('[*]')} Uploading ${filename}: [${bar}] ${percent}%`);
}

/**
 * Display upload complete
 */
function displayUploadComplete(filename, url) {
  console.log(''); // New line after progress
  displaySuccess(`Upload complete: ${filename}`);
  console.log(chalk.cyan('Access your file at:'));
  console.log(chalk.bold(url));
  console.log('');
}

/**
 * Display field (label: value)
 */
function displayField(label, value) {
  console.log(chalk.gray(label + ':'), value);
}

module.exports = {
  displaySeparator,
  displayList,
  displayDetails,
  displaySuccess,
  displayInfo,
  displayWarning,
  displayErrorMessage,
  displayProgress,
  displayUploadComplete,
  displayField
};
