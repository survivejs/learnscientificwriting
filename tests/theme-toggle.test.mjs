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
