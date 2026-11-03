const fs = require("fs");
const path = require("path");
const babel = require("@babel/core");

const PROJECT_ROOT = path.resolve(__dirname, "../..");

describe("Babel runtime compatibility", () => {
  it("does not import Babel's removed regenerator helper", () => {
    const {code} = babel.transformSync(
      "export const load = async () => true;",
      {
        caller: {
          name: "babel-loader",
          supportsDynamicImport: true,
          supportsStaticESM: true,
        },
        filename: path.join(PROJECT_ROOT, "client", "test-fixture.js"),
      },
    );

    expect(code).not.toContain("@babel/runtime/regenerator");
    expect(code).toContain("regeneratorRuntime");
  });

  it("loads the regenerator runtime before the application", () => {
    const entry = fs.readFileSync(
      path.join(PROJECT_ROOT, "client", "index.js"),
      "utf-8",
    );

    expect(entry).toContain('import "regenerator-runtime/runtime";');
    expect(entry.indexOf("regenerator-runtime/runtime")).toBeLessThan(
      entry.indexOf('import("./app")'),
    );
  });
});
