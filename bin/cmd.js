#! /usr/bin/env node

var doctest = require('../src/doctest');

var fs = require('fs');
var process = require('process');

var glob = require('glob');

var CONFIG_FILEPATH = process.cwd() + '/.markdown-doctest-setup.js';
var DEFAULT_GLOB = '**/*.+(md|markdown)';
var DEFAULT_IGNORE = ['node_modules/**'];

function main () {
  var userGlob = process.argv[2];

  if (fs.existsSync(CONFIG_FILEPATH)) {
    try {
      Object.assign(global, require(CONFIG_FILEPATH));
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
}

function run (err, files) {
  if (err) {
    console.trace(err);
  }

  doctest.printResults(doctest.runTests(files));
}

main();
