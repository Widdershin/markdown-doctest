var path = require('path');

var test = require('tape');

var doctest = require('../src/doctest');

var getTestFilePath = (testFile) => {
  return path.join(__dirname, '/test_files/', testFile);
};

test('simple pass', (t) => {
  t.plan(1);

  var results = doctest.runTests([
    'pass.md'
  ].map(getTestFilePath));

  var passingResults = results.filter(result => result.success);

  t.equal(passingResults.length, 1);
});

test('failure', (t) => {
  t.plan(2);

  var results = doctest.runTests([
    'fail-with-text.md'
  ].map(getTestFilePath));

  var passingResults = results.filter(result => result.success);
  var failingResults = results.filter(result => !result.success);

  t.equal(passingResults.length, 0);
  t.equal(failingResults.length, 1);
});
