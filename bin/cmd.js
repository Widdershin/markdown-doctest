#! /usr/bin/env node

var doctest = require('../src/doctest');

var fs = require('fs');
var process = require('process');

var CONFIG_FILEPATH = process.cwd() + '/.markdown-doctest-setup.js';

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

  if (filesToTest !== null) {
    doctest.printResults(doctest.runTests(filesToTest.split('\n')));
  }
});
