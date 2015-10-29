/* globals describe, it */
'use strict';

let path = require('path');

let assert = require('assert');

let doctest = require('../src/doctest');

let getTestFilePath = (testFile) => {
  return path.join(__dirname, '/test_files/', testFile);
};

describe('runTests', () => {
  it('pass', () => {
    let files = [getTestFilePath('pass.md')];

    let config = {};
    let results = doctest.runTests(files, config);

    let passingResults = results.filter(result => result.status === 'pass');

    assert.equal(passingResults.length, 1);
  });

  it('fail', () => {
    let files = [getTestFilePath('fail-with-text.md')];
    let config = {};
    let results = doctest.runTests(files, config);

    let passingResults = results.filter(result => result.status === 'pass');
    let failingResults = results.filter(result => result.status === 'fail');

    assert.equal(passingResults.length, 1, JSON.stringify(results, null, 2));
    assert.equal(failingResults.length, 2);
  });

  it('skip', () => {
    let files = [getTestFilePath('skip.md')];
    let config = {};
    let results = doctest.runTests(files, config);

    let passingResults = results.filter(result => result.status === 'pass');
    let failingResults = results.filter(result => result.status === 'fail');
    let skippedResults = results.filter(result => result.status === 'skip');

    assert.equal(passingResults.length, 1);
    assert.equal(failingResults.length, 0);
    assert.equal(skippedResults.length, 1);
  });

  it('config', () => {
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

    assert.equal(passingResults.length, 1, results[0].stack);
    assert.equal(failingResults.length, 0);
    assert.equal(skippedResults.length, 0);
  });

  it('globals', () => {
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

    assert.equal(passingResults.length, 1, results[0].stack);
    assert.equal(failingResults.length, 0);
    assert.equal(skippedResults.length, 0);
  });

  it('es6', () => {
    let files = [getTestFilePath('es6.md')];
    let config = {};

    let results = doctest.runTests(files, config);

    let passingResults = results.filter(result => result.status === 'pass');
    let failingResults = results.filter(result => result.status === 'fail');
    let skippedResults = results.filter(result => result.status === 'skip');

    assert.equal(passingResults.length, 2, results[0].stack);
    assert.equal(failingResults.length, 0);
    assert.equal(skippedResults.length, 0);
  });

  it('joins tests', () => {
    let files = [getTestFilePath('environment.md')];
    let config = {};

    let results = doctest.runTests(files, config);

    let passingResults = results.filter(result => result.status === 'pass');
    let failingResults = results.filter(result => result.status === 'fail');
    let skippedResults = results.filter(result => result.status === 'skip');

    assert.equal(passingResults.length, 3, results[1].stack);
    assert.equal(failingResults.length, 0);
    assert.equal(skippedResults.length, 0);
  });
});
