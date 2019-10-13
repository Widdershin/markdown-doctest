#! /usr/bin/env node
'use strict';

var doctest = require('..');

var fs = require('fs');

var glob = require('glob');

var CONFIG_FILEPATH = process.cwd() + '/.markdown-doctest-setup.js';
var DEFAULT_GLOB = '**/*.+(md|markdown)';
var DEFAULT_IGNORE = [
  '**/node_modules/**',
  '**/bower_components/**'
];

function displayHelp () {
  const helpText = [
    'Usage: markdown-doctest [glob]',
    'Options:',
    '  -h, --help    output help text'
  ];

  console.log(helpText.join('\n'));
}

function main () {
  var userGlob = process.argv[2];
  var config = {require: {}};

  if (process.argv.indexOf('--help') !== -1 || process.argv.indexOf('-h') !== -1) {
    displayHelp();

    process.exitCode = 0;

    return;
  }

  if (fs.existsSync(CONFIG_FILEPATH)) {
    try {
      config = require(CONFIG_FILEPATH);
    } catch (e) {
      console.log('Error running .markdown-doctest-setup.js:');
      console.error(e);
      process.exitCode = 1;
      return;
    }
  }

  var ignoredDirectories = config.ignore || [];

  glob(
    userGlob || DEFAULT_GLOB,
    {ignore: DEFAULT_IGNORE.concat(ignoredDirectories)},
    run
  );

  function run (err, files) {
    if (err) {
      console.trace(err);
    }

    var results = doctest.runTests(files, config);

    console.log('\n');

    doctest.printResults(results);

    var failures = results.filter(function (result) { return result.status === 'fail'; });

    if (failures.length > 0) {
      process.exitCode = 1;
    }
  }
}

main();
