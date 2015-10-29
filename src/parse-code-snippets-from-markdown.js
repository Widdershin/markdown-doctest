'use strict';

let isStartOfSnippet = line => line.trim().match(/```\W*(JavaScript|js|es6)/i);
let isEndOfSnippet = line => line.trim() === '```';
let isSkip = line => line.trim() === '<!-- skip-test -->';
let isEnvironment = line => line.trim() === '<!-- environment -->';

function startNewSnippet (snippets, fileName, lineNumber) {
  let skip = snippets.skip;
  snippets.skip = false;

  return Object.assign(snippets, {snippets: snippets.snippets.concat([
    {code: '', fileName, lineNumber, complete: false, skip}
  ])});
}

function addLineToLastSnippet (line) {
  return function addLine (snippets) {
    let lastSnippet = snippets.snippets[snippets.snippets.length - 1];

    if (lastSnippet && !lastSnippet.complete) {
      lastSnippet.code += line + '\n';
    }

    return snippets;
  };
}

function endSnippet (snippets, fileName, lineNumber) {
  let lastSnippet = snippets.snippets[snippets.snippets.length - 1];

  if (lastSnippet) {
    lastSnippet.complete = true;
  }

  return snippets;
}

function skip (snippets) {
  snippets.skip = true;

  return snippets;
}

function environment (snippets) {
  snippets.preserveEnvironment = true;

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

  if (isEnvironment(line)) {
    return environment;
  }

  return addLineToLastSnippet(line);
}

function parseCodeSnippets (args) {
  let contents = args.contents;
  let fileName = args.fileName;

  let initialState = {
    snippets: [],
    preserveEnvironment: false,
    complete: false
  }

    function log (thing) { console.log(thing); return thing; }

  let results = contents
    .split('\n')
    .map(parseLine)
    .reduce((snippets, lineAction, index) => lineAction(snippets, fileName, index + 1), initialState);

  let codeSnippets = results.snippets;

  let lastSnippet = codeSnippets[codeSnippets.length - 1];

  if (lastSnippet && !lastSnippet.complete) {
    throw new Error('Snippet parsing was incomplete');
  }

  return {
    fileName,
    codeSnippets,
    preserveEnvironment: results.preserveEnvironment
  };
}

module.exports = parseCodeSnippets;
