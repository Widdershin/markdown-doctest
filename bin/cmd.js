#! /usr/bin/env node
'use strict';

const {version} = require('../package');
const doctest = require('..');
const program = require('commander');
const path = require('path');
const glob = require('glob');
const fs = require('fs');

const DEFAULT_GLOB = '**/*.+(md|markdown)';
const DEFAULT_IGNORE = [
  '**/node_modules/**',
  '**/bower_components/**'
];

// Config
const config = {
  require: {},
  globals: {},
  ignore: []
};

// Setup commander
program
  .name('markdown-doctest')
  .description('Test all the code in your markdown docs!')
  .version(version, '-v, --version', 'output the current version')
  .helpOption('-h, --help', 'output usage informations')
  .option('-c, --config <path>', 'custom config location', path.join(process.cwd(), '/.markdown-doctest-setup.js'))
  .parse(process.argv);

// Parse config file
if (program.config) {
  const configPath = path.resolve(program.config);

  if (fs.existsSync(configPath)) {
    try {

      // Apply custom settings
      Object.assign(config, require(configPath));
    } catch (e) {
      console.error(`Cannot resolve "${configPath}"`);
      process.exit(1);
    }
  }
}

// Resolve files
glob(
  program.args[0] || DEFAULT_GLOB,
  {
    ignore: [...config.ignore, ...DEFAULT_IGNORE]
  },
  (err, files) => {

    if (err) {
      console.trace(err);
    }

    // Run tests
    const results = doctest.runTests(files, config);

    console.log('\n');
    doctest.printResults(results);

    // Exit with error-code if any test failed
    const failures = results.filter(result => result.status === 'fail');
    if (failures.length > 0) {
      process.exit(1);
    }
  }
);
