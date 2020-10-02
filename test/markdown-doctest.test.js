/* globals describe, it */
"use strict";

import path from "path";
import assert from "assert";
import * as doctest from "../src/doctest";

const getTestFilePath = (testFile) => {
  return path.join(__dirname, "/test_files/", testFile);
};

describe("runTests", () => {
  it("pass", () => {
    const files = [getTestFilePath("pass.md")];

    const config = {};
    const results = doctest.runTests(files, config);

    const passingResults = results.filter((result) => result.status === "pass");

    assert.strictEqual(passingResults.length, 1);
  });

  it("fail", () => {
    const files = [getTestFilePath("fail-with-text.md")];
    const config = {};
    const results = doctest.runTests(files, config);

    const passingResults = results.filter((result) => result.status === "pass");
    const failingResults = results.filter((result) => result.status === "fail");

    assert.strictEqual(
      passingResults.length,
      1,
      JSON.stringify(results, null, 2),
    );
    assert.strictEqual(failingResults.length, 2);
  });

  it("skip", () => {
    const files = [getTestFilePath("skip.md")];
    const config = {};
    const results = doctest.runTests(files, config);

    const passingResults = results.filter((result) => result.status === "pass");
    const failingResults = results.filter((result) => result.status === "fail");
    const skippedResults = results.filter((result) => result.status === "skip");

    assert.strictEqual(passingResults.length, 1);
    assert.strictEqual(failingResults.length, 0);
    assert.strictEqual(skippedResults.length, 1);
  });

  it("config", () => {
    const files = [getTestFilePath("require-override.md")];
    const config = {
      require: {
        lodash: { range: () => [] },
      },
    };

    const results = doctest.runTests(files, config);

    const passingResults = results.filter((result) => result.status === "pass");
    const failingResults = results.filter((result) => result.status === "fail");
    const skippedResults = results.filter((result) => result.status === "skip");

    assert.strictEqual(passingResults.length, 1, results[0].stack);
    assert.strictEqual(failingResults.length, 0);
    assert.strictEqual(skippedResults.length, 0);
  });

  it("globals", () => {
    const files = [getTestFilePath("globals.md")];
    const config = {
      globals: {
        name: "Nick",
      },
    };

    const results = doctest.runTests(files, config);

    const passingResults = results.filter((result) => result.status === "pass");
    const failingResults = results.filter((result) => result.status === "fail");
    const skippedResults = results.filter((result) => result.status === "skip");

    assert.strictEqual(passingResults.length, 1, results[0].stack);
    assert.strictEqual(failingResults.length, 0);
    assert.strictEqual(skippedResults.length, 0);
  });

  it("es6", () => {
    const files = [getTestFilePath("es6.md")];
    const config = {};

    const results = doctest.runTests(files, config);

    const passingResults = results.filter((result) => result.status === "pass");
    const failingResults = results.filter((result) => result.status === "fail");
    const skippedResults = results.filter((result) => result.status === "skip");

    assert.strictEqual(passingResults.length, 2, results[0].stack);
    assert.strictEqual(failingResults.length, 0);
    assert.strictEqual(skippedResults.length, 0);
  });

  it("joins tests", () => {
    const files = [getTestFilePath("environment.md")];
    const config = {};

    const results = doctest.runTests(files, config);

    const passingResults = results.filter((result) => result.status === "pass");
    const failingResults = results.filter((result) => result.status === "fail");
    const skippedResults = results.filter((result) => result.status === "skip");

    assert.strictEqual(passingResults.length, 3, results[1].stack);
    assert.strictEqual(failingResults.length, 0);
    assert.strictEqual(skippedResults.length, 0);
  });

  it("supports regex imports", () => {
    const files = [getTestFilePath("require-override.md")];
    const config = {
      regexRequire: {
        "lo(.*)": function (fullPath, matchedName) {
          assert.strictEqual(matchedName, "dash");

          return {
            range: () => [],
          };
        },
      },
    };

    const results = doctest.runTests(files, config);

    const passingResults = results.filter((result) => result.status === "pass");
    const failingResults = results.filter((result) => result.status === "fail");
    const skippedResults = results.filter((result) => result.status === "skip");

    assert.strictEqual(passingResults.length, 1, results[0].stack);
    assert.strictEqual(failingResults.length, 0);
    assert.strictEqual(skippedResults.length, 0);
  });

  it("runs the beforeEach hook prior to each example", () => {
    const files = [getTestFilePath("before-each.md")];
    const a = {
      value: 0,
    };

    const config = {
      globals: {
        a,
      },

      beforeEach: () => a.value = 0,
    };

    const results = doctest.runTests(files, config);

    const passingResults = results.filter((result) => result.status === "pass");
    const failingResults = results.filter((result) => result.status === "fail");
    const skippedResults = results.filter((result) => result.status === "skip");

    assert.strictEqual(passingResults.length, 3, results[0].stack);
    assert.strictEqual(failingResults.length, 0);
    assert.strictEqual(skippedResults.length, 0);

    assert.strictEqual(a.value, 1);
  });

  it("ignores json examples", () => {
    const files = [getTestFilePath("json.md")];
    const config = {};

    const results = doctest.runTests(files, config);

    const passingResults = results.filter((result) => result.status === "pass");
    const failingResults = results.filter((result) => result.status === "fail");
    const skippedResults = results.filter((result) => result.status === "skip");

    assert.strictEqual(passingResults.length, 0);
    assert.strictEqual(failingResults.length, 0);
    assert.strictEqual(skippedResults.length, 0);
  });

  it("skip custom", () => {
    const files = [getTestFilePath("skip-custom.md")];
    const config = {
      transformCode(code) {
        return code.replace(/\.\.\./g, "");
      },
    };
    const results = doctest.runTests(files, config);
    const passingResults = results.filter((result) => result.status === "pass");

    assert.strictEqual(passingResults.length, 1);
  });
});
