# Book Markdown syntax

Book chapters use standard Markdown wherever possible. Book-specific semantics
use Scholarmark directives so citations and cross-references remain structured
and can be validated at build time.

## Chapter structure

The page layout supplies the chapter title, so chapter files do not contain an
`h1`. Chapter titles, numbers, routes, and top-level reference labels come from
`index.json`.

Start numbered sections at level two. Level-two and level-three headings receive
generated section numbers and appear in the page table of contents. Level-four
headings represent LaTeX-style paragraph labels: they render as unnumbered bold
labels and do not appear in the table of contents.

```markdown
## Main section

### Subsection

#### Unnumbered paragraph label
```

## Labels and references

Add a label immediately after any block that other content needs to reference.
The same syntax labels headings, tables, figures, and paragraphs.

```markdown
## Why citing matters
::label[sec:citing-accuracy]

See :ref[sec-citing-accuracy].
See :ref[sec-citing-accuracy]{text="the earlier discussion"}.
```

Without custom text, `:ref` renders the numbered title of its target. Use
`text` to override that link text.

Top-level chapter labels such as `ch:citing` and `ap:latex` are defined in
`index.json` and can be referenced in the same way. The site resolves these and
section labels across separately rendered chapter files.

For non-heading targets, provide readable custom link text when needed:

```markdown
The results appear in :ref[table:methods]{text="the methods table"}.

| Method | Result |
| --- | --- |
| A | 42 |
::label[table:methods]
```

Labels may use familiar LaTeX-style keys containing letters, numbers, colons,
underscores, and hyphens. Duplicate, invalid, and unattached labels fail
validation.

## Citations

Citation ids refer to entries in `bibliography.bib`. Parenthetical citations are
the default.

```markdown
:cite[source-id]
:cite[source-a, source-b]
:cite[source-id]{mode=textual}
:cite[source-id]{mode=full}
:cite[source-id]{locator="p. 42"}
:cite[source-id]{prefix="See " suffix=" for details"}
```

Supported modes are:

- `parenthetical`: renders author and year in parentheses.
- `textual`: renders the author as sentence text followed by the year.
- `full`: renders the full formatted bibliography entry without parentheses.

Multiple ids are comma-separated inside the brackets. Parenthetical and full
citations separate multiple entries with semicolons; textual citations use
commas. `locator` appends a page or section locator. `prefix` and `suffix` add
text directly before and after the rendered citation, including any spaces
provided in their values.

## Standard Markdown

Use standard Markdown for links, emphasis, lists, images, tables, and fenced
code blocks. GFM footnotes are enabled.

```markdown
A statement with supporting detail.[^detail]

[^detail]: The supporting detail.
```

Do not use raw HTML to implement citations or cross-references.

## Validation

The build rejects:

- Missing citation ids or reference labels.
- Duplicate reference labels.
- Empty or unsupported directives and citation modes.
- Aliases whose slugs do not match a heading.

Run `npm test` for syntax and full-book integration coverage. Run
`npm run build` to validate the complete reference graph while generating the
site.
