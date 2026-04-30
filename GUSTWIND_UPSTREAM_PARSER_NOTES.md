# Gustwind parser notes

## `\nameref{...}` needs section-label index data

The raw-id rendering we saw:

```txt
\nameref{sec:citing-in-latex} -> sec:citing-in-latex
```

was not caused by `refs().nameref` itself. Gustwind can render `nameref` correctly if `refEntries` contains the target label.

In this project, the missing piece was that our app-level book index only included top-level chapter and appendix labels. The local fix indexes labeled sections/subsections and adds them to the reference lookup set without adding them as routes.

This may still be worth upstream discussion as a feature: Gustwind could expose a helper to collect section labels from parsed LaTeX ASTs so consumers do not have to duplicate label/heading association logic.
