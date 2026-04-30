import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagesWithThemeToggle = [
  "build/index.html",
  "build/book/index.html",
  "build/book/process/index.html",
  "build/book/references/index.html",
];

test("theme toggle script is included on pages with the toggle", () => {
  execFileSync("npm", ["run", "build"], { stdio: "pipe" });

  for (const page of pagesWithThemeToggle) {
    const html = readFileSync(page, "utf8");

    assert.match(html, /data-theme-toggle/);
    assert.match(html, /src="\/assets\/theme-toggle-[^"]+\.js"/);
  }
});

test("worker render assets include the theme toggle component and script", () => {
  execFileSync("npm", ["run", "build"], { stdio: "pipe" });
  execFileSync("npm", ["run", "worker:prepare"], { stdio: "pipe" });

  const manifest = readFileSync("worker/generated/site-manifest.js", "utf8");
  const scriptAssets = readFileSync("build/.gustwind/script-assets.json", "utf8");
  const worker = readFileSync("worker/index.ts", "utf8");

  assert.match(manifest, /"ThemeToggle":/);
  assert.match(scriptAssets, /"theme-toggle"/);
  assert.match(scriptAssets, /"file": "\/assets\/theme-toggle-[^"]+\.js"/);
  assert.match(worker, /workerScriptPlugin/);
  assert.match(worker, /scriptAssets/);
  assert.doesNotMatch(worker, /themeToggleScriptHref/);
});
