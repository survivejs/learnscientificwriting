import assert from "node:assert/strict";
import test from "node:test";
import transformBookMarkdown from "../site/transforms/bookMarkdown.ts";

test("book Markdown renders and indexes semantic directives", async () => {
  const result = await transformBookMarkdown(
    [
      "## Referencing",
      "::label[sec-referencing]",
      "",
      "## Aliased section",
      "::label[sec:alias]",
      "",
      "#### Paragraph label",
      "",
      "See :ref[sec:other]{text=\"the other section\"} and " +
      ":cite[source-a, source-b]{mode=textual locator=\"p. 4\"}.",
      "",
      "A footnote.[^note]",
      "",
      "[^note]: Supporting detail.",
      "",
      "| Value |",
      "| --- |",
      "| 42 |",
      "::label[table:demo]",
    ].join("\n"),
    {
      bibliographySource: [
        "@article{source-a, author={Doe, Jane}, title={Source A}, year={2024}}",
        "@article{source-b, author={Smith, John}, title={Source B}, year={2025}}",
      ].join("\n"),
      chapterNumber: "7",
      referenceTargets: new Map([
        ["sec:other", { title: "Other section", href: "/target/" }],
      ]),
    },
  );

  assert.deepEqual(result.citationIds, ["source-a", "source-b"]);
  assert.deepEqual(result.sections, [
    {
      label: "sec-referencing",
      slug: "referencing",
      title: "7.1 Referencing",
    },
    {
      label: "sec:alias",
      slug: "aliased-section",
      title: "7.2 Aliased section",
    },
    {
      label: "table:demo",
      slug: "table-demo",
      title: "table:demo",
    },
  ]);
  assert.deepEqual(result.tableOfContents, [{
    level: 2,
    raw: "7.1 Referencing",
    slug: "referencing",
    text: "7.1 Referencing",
  }, {
    level: 2,
    raw: "7.2 Aliased section",
    slug: "aliased-section",
    text: "7.2 Aliased section",
  }]);
  assert.match(
    result.content,
    /<h2 id="referencing" class="group scroll-mt-24"><span class="text-muted">7\.1 <\/span>Referencing<a [^>]*href="#referencing"[^>]*aria-label="Link to Referencing"[^>]*>#<\/a><\/h2>/,
  );
  assert.match(
    result.content,
    /<h2 id="aliased-section" class="group scroll-mt-24"><span class="text-muted">7\.2 <\/span>Aliased section<a [^>]*href="#aliased-section"[^>]*>#<\/a><\/h2>/,
  );
  assert.match(result.content, /<b>Paragraph label<\/b>/);
  assert.doesNotMatch(result.content, /7\.2\.0\.1/);
  assert.match(
    result.content,
    /href="\/book\/references\/#source-a"[^>]*>Doe \(2024\)<\/a>/,
  );
  assert.match(
    result.content,
    /<a (?=[^>]*href="\/target\/")(?=[^>]*data-reference="sec:other")[^>]*>the other section<\/a>/,
  );
  assert.doesNotMatch(result.content, /<p>See <p>/);
  assert.doesNotMatch(result.content, /class="[^"]*" class="[^"]*"/);
  assert.match(result.content, /data-footnote-ref/);
  assert.match(result.content, /<table id="table-demo">/);
  assert.doesNotMatch(result.content, /semantic-label/);
});

test("book Markdown rejects unsupported semantic syntax", async () => {
  await assert.rejects(
    transformBookMarkdown(":cite[source]{mode=unknown}"),
    /Unsupported citation mode: unknown/,
  );
  await assert.rejects(
    transformBookMarkdown(":unknown[value]"),
    /Unsupported text directive: :unknown/,
  );
  await assert.rejects(
    transformBookMarkdown("::unknown[value]"),
    /Unsupported leaf directive: ::unknown/,
  );
  await assert.rejects(
    transformBookMarkdown("::label[sec:missing]"),
    /Label must follow a block/,
  );
  await assert.rejects(
    transformBookMarkdown(":ref[sec:missing]"),
    /Missing label: sec:missing/,
  );
});
