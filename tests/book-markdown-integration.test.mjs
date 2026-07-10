import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

test("the complete book is rendered from Markdown with resolved semantics", () => {
  execFileSync("npm", ["run", "build"], { stdio: "pipe" });

  const index = JSON.parse(readFileSync("content/book/index.json", "utf8"));
  const entries = index.chapters.concat(index.appendices);
  const html = readFileSync("build/book/citing/index.html", "utf8");
  const introduction = readFileSync(
    "build/book/introduction/index.html",
    "utf8",
  );
  const stylesheet = readFileSync(
    `build/${html.match(/href="\/(tailwind-[^"]+\.css)"/)?.[1]}`,
    "utf8",
  );

  assert.equal(entries.length, 15);

  for (const entry of entries) {
    const source = readFileSync(entry.path, "utf8");
    const page = readFileSync(`build/book/${entry.slug}/index.html`, "utf8");

    assert.ok(source.trim(), `${entry.path} should not be empty`);
    assert.doesNotMatch(
      source,
      /^:(?:cite|ref)\[[^\]]*\](?:\{[^}]*\})?$/gm,
    );
    assert.doesNotMatch(source, /^\[\^[^\]]+\]$/gm);
    assert.doesNotMatch(source, /^(?:begin|end)\{[A-Za-z]+\}$/gm);
    assert.match(page, new RegExp(`<title>[^<]*${escapeRegExp(entry.title)}`));
    assert.doesNotMatch(page, /:cite|:ref|::(?:alias|anchor)/);
    assert.doesNotMatch(page, /class="[^"]*" class="[^"]*"/);
  }

  assert.match(
    html,
    /<h2 id="why-citing-accurately-matters"><span class="text-muted">7\.1 <\/span>Why citing accurately matters<\/h2>/,
  );
  assert.match(html, /href="\/book\/references\/#vepsalainen2023implications"/);
  assert.match(
    html,
    /href="\/book\/latex\/#cite-in-latex">A\.5 Cite in LaTeX<\/a>/,
  );
  assert.doesNotMatch(html, /<h4|7\.2\.0\./);
  assert.match(html, /<section data-footnotes class="footnotes">/);
  assert.doesNotMatch(html, /:cite|:ref|\\(?:cite|section|nameref)/);
  assert.doesNotMatch(html, /class="[^"]*" class="[^"]*"/);
  assert.match(introduction, /href="\/book\/elements\/"/);
  assert.match(stylesheet, /\.prose-a\\:hover\\:text-slate-950/);
  assert.doesNotMatch(stylesheet, /\.hover\\:prose-a\\:/);
  assert.doesNotMatch(stylesheet, /\.dark\\:hover\\:prose-a\\:/);
  assert.match(
    readFileSync("build/book/elements/index.html", "utf8"),
    /id="table-ilmrad"/,
  );
  assert.match(
    readFileSync("content/book/15-latex.md", "utf8"),
    /```latex\n(?:%[^\n]*\n)?\\chapter\{Discussion\}/,
  );
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
