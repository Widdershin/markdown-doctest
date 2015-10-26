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

function parseCodeSnippet (fileName) {
  return function parseCodeSnippetLine (snippets, line, index) {
    let lastSnippet = snippets[snippets.length - 1];
    let lastSnippetIsStillParsing = _ => lastSnippet && !snippets.lastComplete;

    if (isStartOfSnippet(line)) {
      snippets.lastComplete = false;

      return snippets.concat(
        {code: '', lineNumber: index + 1, fileName}
      );
    }

    if (lastSnippetIsStillParsing()) {
      if (isEndOfSnippet(line)) {
        snippets.lastComplete = true;
      } else {
        lastSnippet.code += line + '\n';
      }
    }

    return snippets;
  };
}

function parseCodeSnippets (args) {
  let contents = args.contents;
  let fileName = args.fileName;

  let codeSnippets = contents
    .split('\n')
    .reduce(parseCodeSnippet(fileName), []);

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
  codeSnippet.code = codeSnippet.code
    .replace('```js', '')
    .replace('```', '');

  return codeSnippet;
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
