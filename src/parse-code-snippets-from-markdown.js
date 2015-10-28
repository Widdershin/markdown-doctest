'use strict';

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
    codeSnippets
  };
}

module.exports = parseCodeSnippets;
