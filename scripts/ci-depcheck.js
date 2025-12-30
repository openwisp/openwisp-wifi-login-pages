const {execSync} = require("child_process");

const output = execSync("npx depcheck --json", {encoding: "utf-8"});
const result = JSON.parse(output);

const unused =
  (result.dependencies?.length || 0) + (result.devDependencies?.length || 0);

if (unused > 0) {
  console.error("❌ Unused dependencies detected:\n");

  if (result.dependencies.length) {
    console.error("Unused dependencies:");
    result.dependencies.forEach((d) => console.error(`  - ${d}`));
  }

  if (result.devDependencies.length) {
    console.error("Unused devDependencies:");
    result.devDependencies.forEach((d) => console.error(`  - ${d}`));
  }

  process.exit(1);
}

console.log("✅ Depcheck passed: no unused dependencies found");
