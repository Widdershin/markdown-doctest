'use strict';

let path = require('path');

let test = require('tape');

let doctest = require('../src/doctest');

let getTestFilePath = (testFile) => {
  return path.join(__dirname, '/test_files/', testFile);
};

test('simple pass', (t) => {
  t.plan(1);

  let files = [getTestFilePath('pass.md')];
  let config = {};
  let results = doctest.runTests(files, config);

  let passingResults = results.filter(result => result.status === 'pass');

  t.equal(passingResults.length, 1);
});

test('failure', (t) => {
  t.plan(2);

  let files = [getTestFilePath('fail-with-text.md')];
  let config = {};
  let results = doctest.runTests(files, config);

  let passingResults = results.filter(result => result.status === 'pass');
  let failingResults = results.filter(result => result.status === 'fail');

  t.equal(passingResults.length, 0);
  t.equal(failingResults.length, 1);
});

test('skipping', (t) => {
  t.plan(3);

  let files = [getTestFilePath('skip.md')];
  let config = {};
  let results = doctest.runTests(files, config);

  let passingResults = results.filter(result => result.status === 'pass');
  let failingResults = results.filter(result => result.status === 'fail');
  let skippedResults = results.filter(result => result.status === 'skip');

  t.equal(passingResults.length, 1);
  t.equal(failingResults.length, 0);
  t.equal(skippedResults.length, 1);
});

test('config', (t) => {
  t.plan(3);

  let files = [getTestFilePath('require-override.md')];
  let config = {
    require: {
      lodash: {range: () => []}
    }
  };
  let results = doctest.runTests(files, config);

  let passingResults = results.filter(result => result.status === 'pass');
  let failingResults = results.filter(result => result.status === 'fail');
  let skippedResults = results.filter(result => result.status === 'skip');

  t.equal(passingResults.length, 1, results[0].stack);
  t.equal(failingResults.length, 0);
  t.equal(skippedResults.length, 0);
});

test('globals', (t) => {
  t.plan(3);

  let files = [getTestFilePath('globals.md')];
  let config = {
    globals: {
      name: 'Nick'
    }
  };

  let results = doctest.runTests(files, config);

  let passingResults = results.filter(result => result.status === 'pass');
  let failingResults = results.filter(result => result.status === 'fail');
  let skippedResults = results.filter(result => result.status === 'skip');

  t.equal(passingResults.length, 1, results[0].stack);
  t.equal(failingResults.length, 0);
  t.equal(skippedResults.length, 0);
});
