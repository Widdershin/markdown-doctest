'use strict';

let path = require('path');

let test = require('tape');

let doctest = require('../src/doctest');

let getTestFilePath = (testFile) => {
  return path.join(__dirname, '/test_files/', testFile);
};

test('simple pass', (t) => {
  t.plan(1);

  let results = doctest.runTests([
    'pass.md'
  ].map(getTestFilePath));

  let passingResults = results.filter(result => result.status === 'pass');

  t.equal(passingResults.length, 1);
});

test('failure', (t) => {
  t.plan(2);

  let results = doctest.runTests([
    'fail-with-text.md'
  ].map(getTestFilePath));

  let passingResults = results.filter(result => result.status === 'pass');
  let failingResults = results.filter(result => result.status === 'fail');

  t.equal(passingResults.length, 0);
  t.equal(failingResults.length, 1);
});

test('skipping', (t) => {
  t.plan(3);

  let results = doctest.runTests([
    'skip.md'
  ].map(getTestFilePath));

  let passingResults = results.filter(result => result.status === 'pass');
  let failingResults = results.filter(result => result.status === 'fail');
  let skippedResults = results.filter(result => result.status === 'skip');

  t.equal(passingResults.length, 1);
  t.equal(failingResults.length, 0);
  t.equal(skippedResults.length, 1);
});

