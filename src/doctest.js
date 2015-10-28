'use strict';

let fs = require('fs');
let process = require('process');

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

let isStartOfSnippet = line => line.trim().match(/```\W*js/);
let isEndOfSnippet = line => line.trim() === '```';
let isSkip = line => line.trim() === '<!-- skip-test -->';

function startNewSnippet (snippets, fileName, lineNumber) {
  let skip = snippets.skip;
  snippets.skip = false;

  return snippets.concat([
    {code: '', fileName, lineNumber, complete: false, skip}
  ]);
}

function addLineToLastSnippet (line) {
  return (snippets) => {
    let lastSnippet = snippets[snippets.length - 1];

    if (lastSnippet && !lastSnippet.complete) {
      lastSnippet.code += line + '\n';
    }

    return snippets;
  };
}

function endSnippet (snippets, fileName, lineNumber) {
  let lastSnippet = snippets[snippets.length - 1];

  if (lastSnippet) {
    lastSnippet.complete = true;
  }

  return snippets;
}

function skip (snippets) {
  snippets.skip = true;

  return snippets;
}

function parseLine (line) {
  if (isStartOfSnippet(line)) {
    return startNewSnippet;
  }

  if (isEndOfSnippet(line)) {
    return endSnippet;
  }

  if (isSkip(line)) {
    return skip;
  }

  return addLineToLastSnippet(line);
}

function parseCodeSnippets (args) {
  let contents = args.contents;
  let fileName = args.fileName;

  let codeSnippets = contents
    .split('\n')
    .map(parseLine)
    .reduce((snippets, lineAction, index) => lineAction(snippets, fileName, index + 1), []);

  let lastSnippet = codeSnippets[codeSnippets.length - 1];

  if (lastSnippet && !lastSnippet.complete) {
    throw new Error('Snippet parsing was incomplete');
  }

  return {
    fileName,
    codeSnippets: codeSnippets.map(cleanUpSnippet).filter(ignorePseudocode)
  };
}

function ignorePseudocode (snippet) {
  return !snippet.code.match(/\.\.\./g);
}

function testFile (args) {
  let codeSnippets = args.codeSnippets;
  let fileName = args.fileName;

  let results = codeSnippets.map(test(fileName));

  return flattenArray(results);
}

function test (filename) {
  return (codeSnippet) => {
    if (codeSnippet.skip) { 
      return {status: 'skip', codeSnippet, stack: ''};
    }

    let success = false;
    let stack = '';

    let oldLog = console.log;

    console.log = () => null;

    try {
      eval('(function () {' + codeSnippet.code + '})();');

      success = true;
    } catch (e) {
      stack = e.stack || '';
    }

    console.log = oldLog;

    let status = success ? 'pass' : 'fail';

    return {status, codeSnippet, stack};
  };
}

function flattenArray (array) {
  return array.reduce((a, b) => a.concat(b), []);
}

function printResults (results) {
  results
    .filter(result => result.status === 'fail')
    .forEach(printFailure);

  let passingCount = results.filter(result => result.status === 'pass').length;
  let failingCount = results.filter(result => result.status === 'fail').length;
  let skippingCount = results.filter(result => result.status === 'skip').length;

  function successfulRun () {
    return failingCount === 0;
  }

  console.log(`Passing: ${passingCount} \nSkipped: ${skippingCount} \nFailed: ${failingCount}`);

  process.exit(successfulRun() ? 0 : 127);
}

function printFailure (result) {
  console.log(`Failed - ${markDownErrorLocation(result)}`);
  console.log(relevantStackDetails(result.stack));
}

function cleanUpSnippet (codeSnippet) {
  let code = codeSnippet.code
    .replace('```js', '')
    .replace('```', '');

  return Object.assign({}, codeSnippet, {code});
}

function relevantStackDetails (stack) {
  let match = stack.match(/([\w\W]*?)at eval/) ||
    stack.match(/([\w\W]*)at [\w*\/]*?doctest.js/);

  if (match !== null) {
    return match[1];
  }

  return stack;
}

function markDownErrorLocation (result) {
  let stackLines = result.stack.split('\n');

  let evalStackLines = stackLines.filter(line => line.match(/eval/));

  if (evalStackLines.length !== 0) {
    let match = evalStackLines[0].match(/<.*>:(\d+):(\d+)/);

    let mdLineNumber = parseInt(match[1], 10);
    let columnNumber = parseInt(match[2], 10);

    let lineNumber = result.codeSnippet.lineNumber + mdLineNumber;

    return `${result.codeSnippet.fileName}:${lineNumber}:${columnNumber}`;
  }
}

module.exports = {printResults, runTests};
