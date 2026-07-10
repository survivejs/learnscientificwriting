import assert from "node:assert/strict";
import test from "node:test";
import transformBookMarkdown from "../site/transforms/bookMarkdown.ts";

test("book Markdown renders and indexes semantic directives", async () => {
  const citations = [];
  const references = [];
  const result = await transformBookMarkdown(
    [
      "## Referencing {#sec-referencing}",
      "",
      "See :ref[the other section]{target=\"sec:other\"} and " +
      ":cite[source-a, source-b]{mode=textual locator=\"p. 4\"}.",
      "",
      "A footnote.[^note]",
      "",
      "[^note]: Supporting detail.",
      "",
      "::anchor[Table]{target=\"table:demo\"}",
    ].join("\n"),
    {
      chapterNumber: "7",
      renderCitation(citation) {
        citations.push(citation);
        return "<span data-citation>citation</span>";
      },
      renderReference(reference) {
        references.push(reference);
        return "<a href=\"/target/\">the other section</a>";
      },
    },
  );

  assert.deepEqual(citations, [{
    ids: ["source-a", "source-b"],
    mode: "textual",
    locator: "p. 4",
    prefix: undefined,
    suffix: undefined,
  }]);
  assert.deepEqual(references, [{
    id: "sec:other",
    text: "the other section",
  }]);
  assert.deepEqual(result.citationIds, ["source-a", "source-b"]);
  assert.deepEqual(result.sections, [
    {
      label: "table:demo",
      slug: "table-demo",
      title: "Table",
    },
    {
      label: "sec-referencing",
      slug: "sec-referencing",
      title: "7.1 Referencing",
    },
  ]);
  assert.deepEqual(result.tableOfContents, [{
    level: 2,
    raw: "7.1 Referencing",
    slug: "sec-referencing",
    text: "7.1 Referencing",
  }]);
  assert.match(
    result.content,
    /<h2 id="sec-referencing"><span class="text-muted">7\.1 <\/span>Referencing<\/h2>/,
  );
  assert.match(result.content, /data-citation/);
  assert.doesNotMatch(result.content, /<p>See <p>/);
  assert.doesNotMatch(result.content, /class="[^"]*" class="[^"]*"/);
  assert.match(result.content, /data-footnote-ref/);
  assert.match(result.content, /<span id="table-demo"><\/span>/);
});

test("book Markdown rejects unsupported semantic syntax", async () => {
  await assert.rejects(
    transformBookMarkdown(":cite[source]{mode=unknown}"),
    /unsupported citation mode "unknown"/,
  );
  await assert.rejects(
    transformBookMarkdown(":unknown[value]"),
    /unsupported text directive ":unknown"/,
  );
  await assert.rejects(
    transformBookMarkdown("::unknown[value]"),
    /unsupported leaf directive "::unknown"/,
  );
});
