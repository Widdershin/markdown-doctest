'use strict';

let fs = require('fs');
let process = require('process');
let vm = require('vm');
let babel = require('babel-core');

let chalk = require('chalk');

let parseCodeSnippets = require('./parse-code-snippets-from-markdown');

function runTests (files, config) {
  let results = files
    .map(read)
    .map(parseCodeSnippets)
    .map(testFile(config));

  return flattenArray(results);
}

function read (fileName) {
  return {contents: fs.readFileSync(fileName, 'utf8'), fileName};
}

function testFile (config) {
  return function testFileWithConfig (args) {
    let codeSnippets = args.codeSnippets;
    let fileName = args.fileName;

    let results = codeSnippets.map(test(config, fileName));

    return flattenArray(results);
  };
}

function test (config, filename) {
  return (codeSnippet) => {
    if (codeSnippet.skip) {
      return {status: 'skip', codeSnippet, stack: ''};
    }

    let success = false;
    let stack = '';

    function sandboxRequire (moduleName) {
      if (config.require[moduleName] === undefined) {
        throw moduleNotFoundError(moduleName);
      }

      return config.require[moduleName];
    }

    let sandboxConsole = {
      log: () => null
    };

    let sandboxGlobals = {require: sandboxRequire, console: sandboxConsole};
    let sandbox = Object.assign(config.globals || {}, sandboxGlobals);

    let babelOptions = config.babel || {};

    let code = codeSnippet.code;

    try {
      if (config.babel !== false) {
        code = babel.transform(codeSnippet.code, babelOptions).code;
      }

      vm.runInNewContext(`
        (function () {
          ${code}
        })();
      `, sandbox);

      success = true;
    } catch (e) {
      stack = e.stack || '';
    }

    let status = success ? 'pass' : 'fail';

    return {status, codeSnippet, stack};
  };
}

function flattenArray (array) {
  return array.reduce((a, b) => a.concat(b), []);
}

function printResults (results) {
  results
    .filter(result => result.status === 'fail')
    .forEach(printFailure);

  let passingCount = results.filter(result => result.status === 'pass').length;
  let failingCount = results.filter(result => result.status === 'fail').length;
  let skippingCount = results.filter(result => result.status === 'skip').length;

  function successfulRun () {
    return failingCount === 0;
  }

  console.log(`
${chalk.green('Passed: ' + passingCount)}
${chalk.yellow('Skipped: ' + skippingCount)}
${chalk.red('Failed: ' + failingCount)}
  `);

  if (successfulRun()) {
    console.log(chalk.green('Success!'));
  }

  process.exit(successfulRun() ? 0 : 127);
}

function printFailure (result) {
  console.log(chalk.red(`Failed - ${markDownErrorLocation(result)}`));
  console.log(relevantStackDetails(result.stack));
}

function relevantStackDetails (stack) {
  let match = stack.match(/([\w\W]*?)at eval/) ||
    stack.match(/([\w\W]*)at [\w*\/]*?doctest.js/);

  if (match !== null) {
    return match[1];
  }

  return stack;
}

function moduleNotFoundError (moduleName) {
  return new Error(`
Attempted to require '${chalk.blue(moduleName)}' but was not found in config.
You need to include it in the require section of your ${chalk.blue('.markdown-doctest-setup.js')} file.

module.exports = {
  require: {
    ${chalk.blue(`'${moduleName}': require('${moduleName}')`)}
  }
}
  `);
}

function markDownErrorLocation (result) {
  let stackLines = result.stack.split('\n');

  let evalStackLines = stackLines.filter(line => line.match(/eval/));

  if (evalStackLines.length !== 0) {
    let match = evalStackLines[0].match(/<.*>:(\d+):(\d+)/);

    let mdLineNumber = parseInt(match[1], 10);
    let columnNumber = parseInt(match[2], 10);

    let lineNumber = result.codeSnippet.lineNumber + mdLineNumber;

    return `${result.codeSnippet.fileName}:${lineNumber}:${columnNumber}`;
  }

  return `${result.codeSnippet.fileName}:${result.codeSnippet.lineNumber}`;
}

module.exports = {printResults, runTests};
