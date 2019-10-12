"use strict";

export interface State {
  snippets: Snippet[];
  shareCodeInFile: boolean;
  skip?: boolean;
  complete: boolean;
}

export interface Snippet {
  code: string;
  fileName: string;
  lineNumber: number;
  complete: boolean;
  skip: boolean;
}

export interface ParsedFile {
  fileName: string;
  codeSnippets: Snippet[];
  shareCodeInFile: boolean;
}

export interface FileInfo {
  contents: string;
  fileName: string;
}

const isStartOfSnippet = (line: string) =>
  line.trim().match(/```\W*(JavaScript|js|es6)\s?$/i);
const isEndOfSnippet = (line: string) => line.trim() === "```";
const isSkip = (line: string) => line.trim() === "<!-- skip-example -->";
const isCodeSharedInFile = (line: string) =>
  line.trim() === "<!-- share-code-between-examples -->";

function startNewSnippet(
  snippets: State,
  fileName: string,
  lineNumber: number
) {
  const skip = snippets.skip;
  snippets.skip = false;

  return Object.assign(snippets, {
    snippets: snippets.snippets.concat([
      { code: "", fileName, lineNumber, complete: false, skip }
    ])
  });
}

function addLineToLastSnippet(line: string) {
  return function addLine(snippets: State) {
    const lastSnippet = snippets.snippets[snippets.snippets.length - 1];

    if (lastSnippet && !lastSnippet.complete) {
      lastSnippet.code += line + "\n";
    }

    return snippets;
  };
}

function endSnippet(snippets: State, fileName: string, lineNumber: number) {
  const lastSnippet = snippets.snippets[snippets.snippets.length - 1];

  if (lastSnippet) {
    lastSnippet.complete = true;
  }

  return snippets;
}

function skip(snippets: State) {
  snippets.skip = true;

  return snippets;
}

function shareCodeInFile(snippets: State) {
  snippets.shareCodeInFile = true;

  return snippets;
}

function parseLine(line: string) {
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

function parseCodeSnippets(args: FileInfo): ParsedFile {
  const contents = args.contents;
  const fileName = args.fileName;

  const initialState: State = {
    snippets: [],
    shareCodeInFile: false,
    complete: false
  };

  const results = contents
    .split("\n")
    .map(parseLine)
    .reduce(
      (snippets, lineAction, index) =>
        lineAction(snippets, fileName, index + 1),
      initialState
    );

  const codeSnippets = results.snippets;

  const lastSnippet = codeSnippets[codeSnippets.length - 1];

  if (lastSnippet && !lastSnippet.complete) {
    throw new Error("Snippet parsing was incomplete");
  }

  return {
    fileName,
    codeSnippets,
    shareCodeInFile: results.shareCodeInFile
  };
}

export default parseCodeSnippets;
