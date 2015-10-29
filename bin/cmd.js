#! /usr/bin/env node
'use strict';

const doctest = require('../src/doctest');

const fs = require('fs');
const process = require('process');

const glob = require('glob');

const CONFIG_FILEPATH = process.cwd() + '/.markdown-doctest-setup.js';
const DEFAULT_GLOB = '**/*.+(md|markdown)';
const DEFAULT_IGNORE = ['node_modules/**'];

function main () {
  const userGlob = process.argv[2];
  const config = {require: {}};

  if (fs.existsSync(CONFIG_FILEPATH)) {
    try {
      config = require(CONFIG_FILEPATH);
    } catch (e) {
      console.log('Error running setup:');
      console.trace(e);
    }
  }

  glob(
    userGlob || DEFAULT_GLOB,
    {ignore: DEFAULT_IGNORE},
    run
  );

  function run (err, files) {
    if (err) {
      console.trace(err);
    }

    const results = doctest.runTests(files, config);

    console.log('\n');

    doctest.printResults(results);

    const failures = results.filter(result => result.status === 'fail');

    if (failures.length > 0) {
      process.exitCode = 127;
    }
  }
}


main();
