# Roadmap

## Near-term fixes

1. Implement `\fullcite{...}` rendering so the further-resources chapter can show complete formatted references instead of the current placeholder behavior.
2. Add build-time validation for missing citations and references, including `\citep`, `\citet`, `\fullcite`, `\ref`, `\autoref`, and `\nameref`.
3. Improve Markdown link error reporting so missing local links identify the source file and failing target clearly.
4. Replace the `skipFirstLine` title-stripping shortcut with heading-aware logic that only removes a first line when it is actually a Markdown heading.

## Authoring and UX improvements

5. Add copy-friendly citation controls to the references page, including the BibTeX key and formatted plain-text reference.
6. Surface unresolved content TODOs from the LaTeX source during local validation or as a generated report.
7. Factor section-label indexing into a reusable helper so the local `\nameref` support is easier to maintain and potentially upstream later.
