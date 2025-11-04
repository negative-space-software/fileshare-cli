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
