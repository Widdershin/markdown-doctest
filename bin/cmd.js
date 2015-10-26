#! /usr/bin/env node

var doctest = require('../src/doctest');

var fs = require('fs');
var process = require('process');

var glob = require('glob');

var CONFIG_FILEPATH = process.cwd() + '/.markdown-doctest-setup.js';
var DEFAULT_GLOB = '**/*.+(md|markdown)';
var DEFAULT_IGNORE = ['node_modules/**'];

process.stdin.setEncoding('utf8');

process.stdin.on('readable', function () {
  var filesToTest = process.stdin.read();

  if (fs.existsSync(CONFIG_FILEPATH)) {
    try {
      Object.assign(global, require(CONFIG_FILEPATH));
    } catch (e) {
      console.log('Error running setup:');
      console.trace(e);
    }
  }

  if (filesToTest === null) {
    glob(DEFAULT_GLOB, {ignore: DEFAULT_IGNORE}, run);
  } else {
    run(null, filesToTest.split('\n'));
  }
});

function run (err, files) {
  if (err) {
    console.trace(err);
  }

  doctest.printResults(doctest.runTests(files));
}
