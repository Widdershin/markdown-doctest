'use strict';

const isStartOfSnippet = line => line.trim().match(/```\W*(JavaScript|js|es6)/i);
const isEndOfSnippet = line => line.trim() === '```';
const isSkip = line => line.trim() === '<!-- skip-example -->';
const isCodeSharedInFile = line => line.trim() === '<!-- share-code-between-examples -->';

function startNewSnippet (snippets, fileName, lineNumber) {
  const skip = snippets.skip;
  snippets.skip = false;

  return Object.assign(snippets, {snippets: snippets.snippets.concat([
    {code: '', fileName, lineNumber, complete: false, skip}
  ])});
}

function addLineToLastSnippet (line) {
  return function addLine (snippets) {
    const lastSnippet = snippets.snippets[snippets.snippets.length - 1];

    if (lastSnippet && !lastSnippet.complete) {
      lastSnippet.code += line + '\n';
    }

    return snippets;
  };
}

function endSnippet (snippets, fileName, lineNumber) {
  const lastSnippet = snippets.snippets[snippets.snippets.length - 1];

  if (lastSnippet) {
    lastSnippet.complete = true;
  }

  return snippets;
}

function skip (snippets) {
  snippets.skip = true;

  return snippets;
}

function shareCodeInFile (snippets) {
  snippets.shareCodeInFile = true;

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

  if (isCodeSharedInFile(line)) {
    return shareCodeInFile;
  }

  return addLineToLastSnippet(line);
}

function parseCodeSnippets (args) {
  const contents = args.contents;
  const fileName = args.fileName;

  const initialState = {
    snippets: [],
    shareCodeInFile: false,
    complete: false
  };

  const results = contents
    .split('\n')
    .map(parseLine)
    .reduce((snippets, lineAction, index) => lineAction(snippets, fileName, index + 1), initialState);

  const codeSnippets = results.snippets;

  const lastSnippet = codeSnippets[codeSnippets.length - 1];

  if (lastSnippet && !lastSnippet.complete) {
    throw new Error('Snippet parsing was incomplete');
  }

  return {
    fileName,
    codeSnippets,
    shareCodeInFile: results.shareCodeInFile
  };
}

module.exports = parseCodeSnippets;
