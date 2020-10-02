"use strict";

import { readFileSync } from "fs";
import { runInNewContext } from "vm";
import { transformSync } from "@babel/core";
import presetEnv from "@babel/preset-env";
import chalk from "chalk";

function flatten<T>(arr: T[][]): T[] {
  return Array.prototype.concat.apply([], arr);
}

import parseCodeSnippets, {
  Snippet,
  ParsedFile,
  FileInfo,
} from "./parse-code-snippets-from-markdown";

interface Config {
  globals?: {
    [key: string]: any;
  };
  require?: {
    [key: string]: any;
  };
  regexRequire?: {
    [key: string]: (...match: string[]) => any;
  };
  babel?: any;
  beforeEach?: () => any;
  transformCode?: (code: string) => string;
}

interface Sandbox {
  [key: string]: any;
}

interface TestResult {
  status: "pass" | "fail" | "skip";
  codeSnippet: Snippet;
  stack: string;
}

export function runTests(files: string[], config: Config): TestResult[] {
  const results = files
    .map(read)
    .map(parseCodeSnippets)
    .map(testFile(config));

  return flatten(results);
}

function read(fileName: string): FileInfo {
  return { contents: readFileSync(fileName, "utf8"), fileName };
}

function makeTestSandbox(config: Config): Sandbox {
  function sandboxRequire(moduleName: string) {
    for (let regexRequire in config.regexRequire) {
      const regex = new RegExp(regexRequire);

      const match = regex.exec(moduleName);
      const handler = config.regexRequire[regexRequire];

      if (match) {
        return handler(...match);
      }
    }

    if (config.require[moduleName] === undefined) {
      throw moduleNotFoundError(moduleName);
    }

    return config.require[moduleName];
  }

  const sandboxConsole = {
    log: () => null,
  };

  const sandboxGlobals = { require: sandboxRequire, console: sandboxConsole };
  const sandbox = Object.assign({}, sandboxGlobals, config.globals);

  return sandbox;
}

function testFile(config: Config) {
  return function testFileWithConfig(args: ParsedFile): TestResult[] {
    const codeSnippets = args.codeSnippets;
    const fileName = args.fileName;
    const shareCodeInFile = args.shareCodeInFile;

    let results: TestResult[];

    if (shareCodeInFile) {
      const sandbox = makeTestSandbox(config);
      results = codeSnippets.map(test(config, fileName, sandbox));
    } else {
      results = codeSnippets.map(test(config, fileName));
    }

    return results;
  };
}

const noop = (a) => a;

function test(config: Config, filename: string, sandbox?: Sandbox) {
  return (codeSnippet: Snippet): TestResult => {
    if (codeSnippet.skip) {
      return { status: "skip", codeSnippet, stack: "" };
    }

    let success = false;
    let stack = "";

    let code = (config.transformCode || noop)(codeSnippet.code);
    let perSnippetSandbox: Sandbox;

    if (sandbox === undefined) {
      perSnippetSandbox = makeTestSandbox(config);
    }

    if (config.beforeEach) {
      config.beforeEach();
    }

    const options = {
      presets: [presetEnv],
    };

    try {
      if (config.babel !== false) {
        code = transformSync(code, options).code;
      }

      runInNewContext(code, perSnippetSandbox || sandbox);

      success = true;
    } catch (e) {
      stack = e.stack || "";
    }

    const status = success ? "pass" : "fail";

    process.stdout.write(success ? chalk.green(".") : chalk.red("x"));

    return { status, codeSnippet, stack };
  };
}

export function printResults(results: TestResult[]) {
  results.filter((result) => result.status === "fail").forEach(printFailure);

  const passingCount = results.filter((result) => result.status === "pass")
    .length;
  const failingCount = results.filter((result) => result.status === "fail")
    .length;
  const skippingCount = results.filter((result) => result.status === "skip")
    .length;

  function successfulRun() {
    return failingCount === 0;
  }

  console.log(chalk.green("Passed: " + passingCount));

  if (skippingCount > 0) {
    console.log(chalk.yellow("Skipped: " + skippingCount));
  }

  if (successfulRun()) {
    console.log(chalk.green("\nSuccess!"));
  } else {
    console.log(chalk.red("Failed: " + failingCount));
  }
}

function printFailure(result: TestResult) {
  console.log(chalk.red(`Failed - ${markDownErrorLocation(result)}`));

  const stackDetails = relevantStackDetails(result.stack);

  console.log(stackDetails);

  const variableNotDefined = stackDetails.match(/(\w+) is not defined/);

  if (variableNotDefined) {
    const variableName = variableNotDefined[1];

    console.log(
      `You can declare ${chalk.blue(variableName)} in the ${
        chalk.blue(
          "globals",
        )
      } section in ${chalk.grey(".markdown-doctest-setup.js")}`,
    );

    console.log(`
For example:
${chalk.grey("// .markdown-doctest-setup.js")}
module.exports = {
  globals: {
    ${chalk.blue(variableName)}: ...
  }
}
    `);
  }
}

function relevantStackDetails(stack: string) {
  const match = stack.match(/([\w\W]*?)at eval/) ||
    stack.match(/([\w\W]*)at [\w*\/]*?doctest.js/);

  if (match !== null) {
    return match[1];
  }

  return stack;
}

function moduleNotFoundError(moduleName: string) {
  return new Error(`
Attempted to require '${chalk.blue(moduleName)}' but was not found in config.
You need to include it in the require section of your ${
    chalk.grey(
      ".markdown-doctest-setup.js",
    )
  } file.

For example:
${chalk.grey("// .markdown-doctest-setup.js")}
module.exports = {
  require: {
    ${chalk.blue(`'${moduleName}': require('${moduleName}')`)}
  }
}
  `);
}

function markDownErrorLocation(result: TestResult) {
  const match = result.stack.match(/eval.*<.*>:(\d+):(\d+)/);

  if (match) {
    const mdLineNumber = parseInt(match[1], 10);
    const columnNumber = parseInt(match[2], 10);

    const lineNumber = result.codeSnippet.lineNumber + mdLineNumber;

    return `${result.codeSnippet.fileName}:${lineNumber}:${columnNumber}`;
  }

  return `${result.codeSnippet.fileName}:${result.codeSnippet.lineNumber}`;
}
