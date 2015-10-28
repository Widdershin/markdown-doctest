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

function startNewSnippet (snippets, fileName, lineNumber) {
  return snippets.concat([
    {code: '', fileName, lineNumber}
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

function parseLine (line) {
  if (isStartOfSnippet(line)) {
    return startNewSnippet;
  }

  if (isEndOfSnippet(line)) {
    return endSnippet;
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
    let success = false;
    let stack;

    let oldLog = console.log;

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

  let totalTestCount = results.length;
  let passingCount = results.filter(result => result.success).length;

  console.log(`${passingCount}/${totalTestCount} passing`);

  process.exit(totalTestCount === passingCount ? 0 : 127);
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
