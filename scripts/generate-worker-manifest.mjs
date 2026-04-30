import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outputPath = path.join(root, "worker/generated/site-manifest.js");

const componentRoots = ["site/components", "site/layouts"];
const textRoots = ["book"];
const textExtensions = new Set([
  ".bib",
  ".cfg",
  ".css",
  ".html",
  ".json",
  ".md",
  ".tex",
  ".txt",
  ".xhtml",
  ".xml",
]);

const components = {};
const textFiles = {};

for (const componentRoot of componentRoots) {
  for (const file of await walk(path.join(root, componentRoot))) {
    if (path.extname(file) !== ".html") {
      continue;
    }

    const name = path.basename(file, ".html");
    components[name] = await readFile(file, "utf8");
  }
}

for (const textRoot of textRoots) {
  for (const file of await walk(path.join(root, textRoot))) {
    if (!textExtensions.has(path.extname(file))) {
      continue;
    }

    textFiles[toPosix(path.relative(root, file))] = await readFile(file, "utf8");
  }
}

const stylesheetHref = await findStylesheetHref();

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  [
    "export const components = " + JSON.stringify(components, null, 2) + ";",
    "export const textFiles = " + JSON.stringify(textFiles, null, 2) + ";",
    "export const stylesheetHref = " + JSON.stringify(stylesheetHref) + ";",
    "",
  ].join("\n"),
);

console.log(`Generated ${toPosix(path.relative(root, outputPath))}`);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return walk(entryPath);
      }

      return entry.isFile() ? [entryPath] : [];
    }),
  );

  return files.flat();
}

async function findStylesheetHref() {
  try {
    const entries = await readdir(path.join(root, "build"));
    const stylesheet = entries.find((entry) => /^tailwind-[a-f0-9]+\.css$/.test(entry));

    return stylesheet ? `/${stylesheet}` : undefined;
  } catch {
    return undefined;
  }
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}
