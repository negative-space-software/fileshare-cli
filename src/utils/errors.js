const chalk = require('chalk');

/**
 * CRITICAL: NEVER truncate errors
 * Always display complete error messages with full stack traces
 */
function displayError(error) {
  console.error(chalk.red('\n[ERROR]\n'));

  // SFTP/SSH errors
  if (error.code) {
    console.error(chalk.red('Error Code:'), error.code);
  }

  // HTTP errors with response
  if (error.response) {
    console.error(chalk.red('Status:'), error.response.status);
    console.error(chalk.red('Status Text:'), error.response.statusText);

    if (error.response.data) {
      console.error(chalk.red('\nResponse Data:'));
      console.error(JSON.stringify(error.response.data, null, 2));
    }

    if (error.response.headers) {
      console.error(chalk.red('\nResponse Headers:'));
      console.error(JSON.stringify(error.response.headers, null, 2));
    }
  }
  // Network errors
  else if (error.request) {
    console.error(chalk.red('No response received from server'));
    console.error(chalk.red('Request:'), error.request);
  }
  // Other errors
  else {
    console.error(chalk.red('Message:'), error.message);
  }

  // ALWAYS show full stack trace
  if (error.stack) {
    console.error(chalk.red('\nStack Trace:'));
    console.error(error.stack);
  }

  console.error(''); // Blank line at end
}

/**
 * Require configuration check
 */
function requireConfig(config) {
  if (!config.isConfigured()) {
    console.error(chalk.red('\n[!] SSH key not found. Please run:'));
    console.error(chalk.yellow('  fileshare setup\n'));
    process.exit(1);
  }
}

/**
 * Display validation error
 */
function displayValidationError(message) {
  console.error(chalk.red(`\n[X] ${message}\n`));
  process.exit(1);
}

/**
 * Display warning message
 */
function displayWarning(message) {
  console.log(chalk.yellow(`\n[!] ${message}\n`));
}

module.exports = {
  displayError,
  requireConfig,
  displayValidationError,
  displayWarning
};
