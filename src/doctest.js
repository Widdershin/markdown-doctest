'use strict';

var fs = require('fs');
var process = require('process');

function runTests (files) {
  return flattenArray(files
    .filter(fileName => fileName !== '')
    .map(read)
    .map(parseCodeSnippets)
    .map(testFile)
  );
}

function read (fileName) {
  return {contents: fs.readFileSync(fileName, 'utf8'), fileName};
}

function parseCodeSnippets (args) {
  var contents = args.contents;
  var fileName = args.fileName;

  var last = (arr) => arr[arr.length - 1];

  var codeSnippets = contents.split('\n').reduce((snippets, line, index) => {
    var lastSnippet = last(snippets);

    if (line.trim() === '```js') {
      snippets.lastComplete = false;
      return snippets.concat({code: '', lineNumber: index + 1, fileName});
    }

    if (lastSnippet && !snippets.lastComplete) {
      if (line.trim() === '```') {
        snippets.lastComplete = true;
      } else {
        lastSnippet.code += line + '\n';
      }
    }

    return snippets;
  }, []);

  return {
    fileName,
    codeSnippets: codeSnippets.map(cleanUpSnippet).filter(ignorePseudocode)
  };
}

function ignorePseudocode (snippet) {
  return !snippet.code.match(/\.\.\./g);
}

function testFile (args) {
  var codeSnippets = args.codeSnippets;
  var fileName = args.fileName;

  var results = codeSnippets.map(test(fileName));

  return flattenArray(results);
}

function test (filename) {
  return (codeSnippet) => {
    var success = false;
    var stack = undefined;

    var oldLog = console.log;

    console.log = () => null;

    try {
      eval('(function () {' + codeSnippet.code + '})();');

      success = true;
    } catch (e) {
      stack = e.stack || '';
    }

    console.log = oldLog;
    return {success: success, codeSnippet: codeSnippet, stack: stack};
  };
}

function flattenArray (array) {
  return array.reduce((a, b) => a.concat(b), []);
}

function printResults (results) {
  results
    .filter(result => !result.success)
    .forEach(printFailure);

  var totalTestCount = results.length;
  var passingCount = results.filter(result => result.success).length;

  console.log(`${passingCount}/${totalTestCount} passing`);

  process.exit(totalTestCount === passingCount ? 0 : 127);
}

function printFailure (result) {
  console.log(`Failed - ${markDownErrorLocation(result)}`);
  console.log(relevantStackDetails(result.stack));
}

function cleanUpSnippet (codeSnippet) {
  codeSnippet.code = codeSnippet.code
    .replace('```js', '')
    .replace('```', '');

  return codeSnippet;
}

function relevantStackDetails (stack) {
  var match = stack.match(/([\w\W]*?)at eval/) ||
    stack.match(/([\w\W]*)at [\w*\/]*?doctest.js/);

  if (match !== null) {
    return match[1];
  }

  return stack;
}

function markDownErrorLocation (result) {
  var stackLines = result.stack.split('\n');

  var evalStackLines = stackLines.filter(line => line.match(/eval/));

  if (evalStackLines.length !== 0) {
    var match = evalStackLines[0].match(/<.*>:(\d+):(\d+)/);

    var mdLineNumber = parseInt(match[1], 10);
    var columnNumber = parseInt(match[2], 10);

    var lineNumber = result.codeSnippet.lineNumber + mdLineNumber;

    return `${result.codeSnippet.fileName}:${lineNumber}:${columnNumber}`;
  }
}

module.exports = {printResults, runTests};
