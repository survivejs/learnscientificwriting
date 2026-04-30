import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const roots = ["book"];
const todoPattern = /\bTODO\b(?::\s*)?(.*)/i;
const ignoredDirectories = new Set([".git", "node_modules"]);

const files = [];

for (const root of roots) {
  await collectTexFiles(root, files);
}

const findings = [];

for (const file of files) {
  const contents = await readFile(file, "utf8");
  const lines = contents.split("\n");

  lines.forEach((line, index) => {
    const match = line.match(todoPattern);

    if (match) {
      findings.push({
        file,
        line: index + 1,
        text: match[0].trim(),
      });
    }
  });
}

if (!findings.length) {
  console.log("No content TODOs found.");
  process.exit(0);
}

console.log(`Found ${findings.length} content TODOs:\n`);

for (const finding of findings) {
  console.log(`${finding.file}:${finding.line}: ${finding.text}`);
}

async function collectTexFiles(directory, output) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        await collectTexFiles(path, output);
      }
    } else if (entry.isFile() && entry.name.endsWith(".tex")) {
      output.push(path);
    }
  }
}
