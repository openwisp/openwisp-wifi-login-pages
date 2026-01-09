const {execSync} = require("child_process");

try {
  const output = execSync("npx knip --reporter json", {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  const result = JSON.parse(output);

  const issues = {
    dependencies: new Set(),
    devDependencies: new Set(),
    unresolved: new Set(),
    unusedFiles: new Set(),
    unusedExports: [],
  };

  let hasIssues = false;

  // Check for unused files
  if (result.files && result.files.length > 0) {
    result.files.forEach((file) => issues.unusedFiles.add(file));
    hasIssues = true;
  }

  // Parse each file's issues
  if (result.issues && result.issues.length > 0) {
    result.issues.forEach((fileIssue) => {
      // Unused dependencies
      if (fileIssue.dependencies && fileIssue.dependencies.length > 0) {
        fileIssue.dependencies.forEach((dep) => issues.dependencies.add(dep));
        hasIssues = true;
      }

      // Unused devDependencies
      if (fileIssue.devDependencies && fileIssue.devDependencies.length > 0) {
        fileIssue.devDependencies.forEach((dep) =>
          issues.devDependencies.add(dep)
        );
        hasIssues = true;
      }

      // Unresolved imports
      if (fileIssue.unresolved && fileIssue.unresolved.length > 0) {
        fileIssue.unresolved.forEach((item) =>
          issues.unresolved.add(item.name)
        );
        hasIssues = true;
      }

      // Unused exports
      if (fileIssue.exports && fileIssue.exports.length > 0) {
        fileIssue.exports.forEach((exp) => {
          issues.unusedExports.push({
            file: fileIssue.file,
            name: exp.name,
          });
        });
        hasIssues = true;
      }
    });
  }

  if (hasIssues) {
    console.error("❌ Knip found issues:\n");

    if (issues.dependencies.size > 0) {
      console.error("Unused dependencies:");
      Array.from(issues.dependencies)
        .sort()
        .forEach((d) => console.error(`  - ${d}`));
      console.error("");
    }

    if (issues.devDependencies.size > 0) {
      console.error("Unused devDependencies:");
      Array.from(issues.devDependencies)
        .sort()
        .forEach((d) => console.error(`  - ${d}`));
      console.error("");
    }

    if (issues.unresolved.size > 0) {
      console.error("Unresolved imports:");
      Array.from(issues.unresolved)
        .sort()
        .forEach((d) => console.error(`  - ${d}`));
      console.error("");
    }

    if (issues.unusedFiles.size > 0) {
      console.error("Unused files:");
      Array.from(issues.unusedFiles)
        .sort()
        .forEach((f) => console.error(`  - ${f}`));
      console.error("");
    }

    if (issues.unusedExports.length > 0) {
      console.error("Unused exports:");
      issues.unusedExports
        .sort((a, b) => a.file.localeCompare(b.file))
        .forEach((exp) => console.error(`  - ${exp.name} (${exp.file})`));
      console.error("");
    }

    process.exit(1);
  }

  console.log("✅ Knip passed: no issues found");
} catch (error) {
  if (error.stdout) {
    try {
      const result = JSON.parse(error.stdout);

      // Re-run the same parsing logic for error case
      const issues = {
        dependencies: new Set(),
        devDependencies: new Set(),
        unresolved: new Set(),
        unusedFiles: new Set(),
        unusedExports: [],
      };

      if (result.files && result.files.length > 0) {
        result.files.forEach((file) => issues.unusedFiles.add(file));
      }

      if (result.issues && result.issues.length > 0) {
        result.issues.forEach((fileIssue) => {
          if (fileIssue.dependencies && fileIssue.dependencies.length > 0) {
            fileIssue.dependencies.forEach((dep) =>
              issues.dependencies.add(dep)
            );
          }
          if (
            fileIssue.devDependencies &&
            fileIssue.devDependencies.length > 0
          ) {
            fileIssue.devDependencies.forEach((dep) =>
              issues.devDependencies.add(dep)
            );
          }
          if (fileIssue.unresolved && fileIssue.unresolved.length > 0) {
            fileIssue.unresolved.forEach((item) =>
              issues.unresolved.add(item.name)
            );
          }
          if (fileIssue.exports && fileIssue.exports.length > 0) {
            fileIssue.exports.forEach((exp) => {
              issues.unusedExports.push({
                file: fileIssue.file,
                name: exp.name,
              });
            });
          }
        });
      }

      console.error("❌ Knip found issues:\n");

      if (issues.dependencies.size > 0) {
        console.error("Unused dependencies:");
        Array.from(issues.dependencies)
          .sort()
          .forEach((d) => console.error(`  - ${d}`));
        console.error("");
      }

      if (issues.devDependencies.size > 0) {
        console.error("Unused devDependencies:");
        Array.from(issues.devDependencies)
          .sort()
          .forEach((d) => console.error(`  - ${d}`));
        console.error("");
      }

      if (issues.unresolved.size > 0) {
        console.error("Unresolved imports:");
        Array.from(issues.unresolved)
          .sort()
          .forEach((d) => console.error(`  - ${d}`));
        console.error("");
      }

      if (issues.unusedFiles.size > 0) {
        console.error("Unused files:");
        Array.from(issues.unusedFiles)
          .sort()
          .forEach((f) => console.error(`  - ${f}`));
        console.error("");
      }

      if (issues.unusedExports.length > 0) {
        console.error("Unused exports:");
        issues.unusedExports
          .sort((a, b) => a.file.localeCompare(b.file))
          .forEach((exp) => console.error(`  - ${exp.name} (${exp.file})`));
        console.error("");
      }
    } catch {
      console.error("❌ Knip failed:");
      console.error(error.message);
    }
  } else {
    console.error("❌ Knip failed:");
    console.error(error.message);
  }
  process.exit(1);
}
