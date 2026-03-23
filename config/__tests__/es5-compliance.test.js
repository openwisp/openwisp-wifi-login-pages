/**
 * @jest-environment node
 *
 * Regression test: verifies that the production webpack build outputs
 * only ES5-compatible JavaScript. Old browsers (eg HbbTV, smart TVs)
 * crash on modern syntax like optional chaining (?.) or BigInt (0n).
 * This test runs a full production build and parses every output file
 * with acorn at ecmaVersion 5; any non-ES5 syntax causes a failure.
 */
const path = require("path");
const fs = require("fs");
const os = require("os");
const webpack = require("webpack");
const acorn = require("acorn");
const {execSync} = require("child_process");

const CURRENT_WORKING_DIR = path.resolve(__dirname, "../..");

describe("ES5 compliance", () => {
  let tmpDir;

  beforeAll(() => {
    // Ensure setup has been run (generates required config files)
    execSync("node config/setup.js && node config/build-translations.js", {
      cwd: CURRENT_WORKING_DIR,
      stdio: "ignore",
    });
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "owlp-es5-test-"));
  });

  afterAll(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, {recursive: true, force: true});
    }
  });

  it("production build output contains only ES5-compatible syntax", (done) => {
    // Load the webpack config with production mode.
    // Suppress expected warnings: setup.js warns about missing markdown
    // files in the default org config, and webpack.config.js warns when
    // SERVER env var is not set. Both are harmless in a test context.
    const warn = console.warn;
    console.warn = () => {};
    let config;
    try {
      const configFn = require("../webpack.config.js");
      config = configFn({}, {mode: "production"});
    } finally {
      console.warn = warn;
    }
    // Override output path to use temp directory
    config.output.path = tmpDir;
    // Disable persistent cache for isolated test builds
    config.cache = false;
    // Disable compression plugins to speed up the test
    config.plugins = config.plugins.filter(
      (p) =>
        p.constructor.name !== "CompressionPlugin" &&
        p.constructor.name !== "BrotliPlugin",
    );

    webpack(config, (err, stats) => {
      if (err) {
        done(err);
        return;
      }
      if (stats.hasErrors()) {
        done(new Error(stats.compilation.errors.join("\n")));
        return;
      }
      // Find all .js files in the output directory
      const jsFiles = fs.readdirSync(tmpDir).filter((f) => f.endsWith(".js"));
      expect(jsFiles.length).toBeGreaterThan(0);
      const failures = [];
      for (const file of jsFiles) {
        const filePath = path.join(tmpDir, file);
        const code = fs.readFileSync(filePath, "utf-8");
        try {
          acorn.parse(code, {ecmaVersion: 5, sourceType: "script"});
        } catch (parseErr) {
          const pos = parseErr.pos || 0;
          const context = code.substring(
            Math.max(0, pos - 100),
            Math.min(code.length, pos + 100),
          );
          failures.push(
            `${file}: ${parseErr.message}\n  context: ...${context}...`,
          );
        }
      }
      if (failures.length > 0) {
        done(
          new Error(
            `The following files contain syntax newer than ES5:\n${failures.join("\n")}`,
          ),
        );
        return;
      }
      done();
    });
  }, 120000);
});
