LaTeX is a typesetting system that excels at scientific publishing.
It cannot only be text that it can layout but images as well, and it can even create graphs on the fly for you.
I won't cover LaTeX in great detail in this context and I recommend checking official [LaTeX documentation](https://www.latex-project.org/) and [Overleaf's 30 minute introduction to LaTeX](https://www.overleaf.com/learn/latex/Learn_LaTeX_in_30_minutes).

## Create a clear structure in LaTeX
::label[sec:creating-a-structure]

I prefer to separate my chapters as follows to make it easier to work with large amounts of text:

- `main.tex` - The main entry point of the project where the compilation begins.
- `toc.tex` - This file refers to individual files so I have a single file where to find my table of contents easily.
- `meta.tex` - I store meta information, i.e., title, author etc. to this file so they are easy to find.
- `chapters/00-abstract.tex` - If your work has an extended abstract, as is typical for theses, it may make sense to separate it into a file.
- `chapters/01-introduction.tex` - Introduction chapter.
- `chapters/2x-name.tex` - Content chapters.
- `chapters/90-discussion.tex` - Discussion chapter.
- `chapters/100-conclusion.tex` - Conclusion chapter.

Note that if I am working on a paper, I tend to use the name `sections` instead of `chapters` since that maps better to the nomenclature used there.
Chapters are more natural choice for books like the one I am writing here.

I use a declaration like this for each chapter at `toc.tex` to import them:

```latex
% Use a \ref{} or a \autoref{} to point to the label
\chapter{Discussion} \label{ch:discussion}
\input{09-discussion}
```

The same idea works for importing the toc file and meta information to my `main.tex` and you will have find the right spots in your initial template for this purpose.

In case you expect to add an unknown number of chapters between introduction and discussion, you could give discussion a fairly high number as then you have a good amount of space to add chapters in between without having to adjust your numbering and references as you work on your chapter structure. The main point is to keep the chapters numerically ordered so the structure follows your work.

Beyond chapters, I have found it can be useful to separate for example tables and figures to separate LaTeX files and then use `\input` command to import them where needed.
The main benefit is that doing this keeps your text clean and supporting resources neatly organized.

## Add hyperlinks to your text

[hyperref](https://ctan.org/pkg/hyperref)[^note-1] provides `\href` syntax for linking to the web from your text. [xurl](https://ctan.org/pkg/xurl)[^note-2] is another useful one with its `\url` syntax and nice reference handling.

Note that LaTeX is sensitive to certain special characters, such as %, in urls so you should take care to escape them with \ so that LaTeX compilation works[^note-3].
There is [more information about the issue at Stack Exchange](https://tex.stackexchange.com/questions/224506/special-character-in-url)[^note-4].

## Maintain automatic references across your text

hyperref package enables another useful feature - automatic referencing. Instead of using `\ref`, the idea is to use `\autoref`.
The difference is that `autoref` generates the text needed based on context meaning there is less refactoring to do when you move sections around.

To customize the text `autoref` emits, you can adjust the behavior as follows:

```latex
\usepackage[english]{babel}
\addto\extrasenglish{
  \def\sectionautorefname{Section}
  \def\subsectionautorefname{Subsection}
}
```

See [hyperref documentation](https://ftp.snt.utwente.nl/pub/software/tex/macros/latex/contrib/hyperref/doc/hyperref-doc.html)[^note-5] for more specific instructions.

Another option to `hyperref` is known as [cleveref](https://www.dr-qubit.org/cleveref.html)[^note-6] and in some ways it goes beyond `hyperref` as it supports more complex ways of referring to your content.
I have found `hyperref` to be enough for simple use cases but when you want to do something more advanced then it may be worth it to refactor your code to use `cleveref` or use it out of the box.

## Leverage BibTeX for handling references

To make it easier to **\cite** references, leverage [BibTeX](https://www.bibtex.org/)[^note-7]. BibTeX is a system that allows you to gather references to a local database.
Then, it will pick up the references you use and format them correctly based on your preferred citing system.

If you have online references, use [getbibtex.com](https://www.getbibtex.com/) to format them initially and then fill the missing fields before copying.
The tool writes the date of access for later retrieval.

## Cite in LaTeX
::label[sec:citing-in-latex]

LaTeX renders your citations different depending on which citation style you have enabled through BibTeX.
I have listed the most commonly used citation commands based on :cite[natbib2024] below:

- **\cite:** is the command that you use by default with most styles for commentary style citations.
- **\citep:** generates parentheses around your citation and it is a good option for commentary style citations.
- **\citet:** is a textual citation and it works well when your citation is the subject of a sentence. Note that this command does not always work as it depends on the citation style of your project.

Occasionally you might have to cite multiple sources at once.
For this purpose, the cite commands accept multiple parameters like this: `\cite{vepsalainen2024, ryba2021}`. In addition, if you want to point to specific pages within a publication, you can do it through the following syntax: `\cite[p.3-4]{vepsalainen2024}`.

You can see visual examples of citations in chapter :ref[ch:citing].

## Keep track of things to do with todonotes

I recommend using a LaTeX package, such as [todonotes](https://ctan.org/pkg/todonotes)[^note-8] to track things to do within a document and also to explain what you still have to cover.
Due to these factors, using `todonotes` can be particularly useful when collaborating with other people.
I prefer to set `\setuptodonotes{inline}` as setting todos inline keeps the todos within text itself at the cost of breaking your layout slightly as this takes more vertical space.

## Comment out swaths of lines easily

Although LaTeX allows you to comment out individual lines of code using the `%` character, it gets wieldy do use when you want to comment out larger entities at once.
For this reason I prefer to use [comment](https://ctan.org/pkg/comment)[^note-9] package as it gives block-level (`\begin{comment}` and `\end{comment}`) support for comments.

## Create your graphics and code listings using LaTeX

Packages like `pgfplots`[^note-10], [listings](https://ctan.org/pkg/listings)[^note-11], and [graphicx](https://ctan.org/pkg/graphicx)[^note-12] expand LaTeX capabilities by allowing you to color code examples, import graphics, and even create graphics.
TikZ is a great example of a package capable of creating graphics and [Overleaf's TikZ tutorial covers the package in great detail](https://www.overleaf.com/learn/latex/LaTeX_Graphics_using_TikZ%3A_A_Tutorial_for_Beginners_(Part_1)%E2%80%94Basic_Drawing)[^note-13].

Given scientific data is often available in CSV[^note-14] format, it is useful to know how to feed CSV to your graphics or even tables. The [graphics use case has been covered at Stack Exchange](https://tex.stackexchange.com/questions/83888/how-to-plot-data-from-a-csv-file-using-tikz-and-csvsimple)[^note-15] and the [the same goes for tables](https://tex.stackexchange.com/questions/146716/importing-csv-file-into-latex-as-a-table)[^note-16].

Another approach is to generate LaTeX syntax from your tooling and then put the resulting code to separate LaTeX files that you then use `\input` where needed.

## Use correct formatting

LaTeX includes many formatting options and it is good to be aware of the most used ones I have listed below:

- **\footnote:** moves the given block as a footnote. I use footnotes for secondary explanations that would otherwise break text flow. Footnotes are also useful for meta-level commentary[^note-17].
- **\textbf:** applies **bold** font to the given block and it is useful for emphasis.
- **\textit:** applies *italic* font to the given block and it is useful for emphasis.
- **\texttt:** applies `monospaced`[^note-18] font to the given block. I use this exclusively for code related concepts and you can see `texttt` in action across this appendix.

Beyond these, I recommend looking into different list formatting options provided by LaTeX as each of them has their uses.

## Highlight code examples

In case you are authoring papers related to computer science, it is likely that you will have to include some type of code examples to your work.
There are several ways to achieve this using LaTeX: `verbatim` environment, [listings package](https://ctan.org/pkg/listings)[^note-19], and [minted package](https://ctan.org/pkg/minted)[^note-20] for further flexibility.
Using `verbatim` is the most simple option to show code although it is missing highlighting as in the example below:

```latex
console.log('hello world');
```

Code highlighting options are covered in greater detail at [Overleaf's code listing documentation](https://www.overleaf.com/learn/latex/Code_listing)[^note-21] and [Overleaf's example for minted](https://www.overleaf.com/learn/latex/Code_Highlighting_with_minted)[^note-22].

## Maintain a sentence per line

Although it might be natural to write a paragraph on a single line, I recommend against this especially if you use a versioning system, such as [Git](https://git-scm.com/)[^note-23], for storing your changes.
Instead, it is better to write each sentence on a line of its own as doing this will generate diffs that are easier to understand.
In this approach, paragraphs are separated by an empty newline.

## Keep publication guidelines in mind

Especially technical publications often offer LaTeX, and even Overleaf, templates that you should use to author your papers.
It is likely that you will have to modify these templates to your liking structurally at least.
Occasionally these templates come with specific technical limitations that are covered within them.
For example, you may have to use a specific LaTeX compiler for the templates to work or you have to avoid using specific packages altogether.
It is particularly important to pay attention to LaTeX errors and warnings before you submit since often there is something to fix and especially overfull warnings can point out to small layout issues you can fix by altering wording or by pointing out where to break a word assuming there are some LaTeX does not know how to hyphenate.
By following template rules, you make it easier for the publisher and avoid additional work related to tweaking the output.

## Summary

LaTeX is a powerful authoring environment for scientists although it comes with a learning curve.
The system is used particularly in computer science and it has benefits for fields beyond it.
Online tools like Overleaf add collaborative features on top of basic LaTeX making it even more useful.

If you are starting out with LaTeX, I recommend using an online environment like Overleaf especially in the beginning as doing so avoids compilation-related problems early on given LaTeX can be complex to set up.
To reduce complexity, consider using existing templates as a starting point and then tune them to your liking as you become more proficient with the toolchain.

Besides the manuals listed above, I recommend reading [Johannes Wienke's take on LaTeX and how to get most out of it when writing a PhD thesis](https://www.semipol.de/posts/2018/06/latex-best-practices-lessons-learned-from-writing-a-phd-thesis/)[^note-24].

[^note-1]: <https://ctan.org/pkg/hyperref>
[^note-2]: <https://ctan.org/pkg/xurl>
[^note-3]: You can use the backslash character (\) for most cases where escaping is needed in LaTeX. Backslash itself is an exception to this rule as `\\` generates a linebreak.
[^note-4]: <https://tex.stackexchange.com/questions/224506/special-character-in-url>
[^note-5]: <https://ftp.snt.utwente.nl/pub/software/tex/macros/latex/contrib/hyperref/doc/hyperref-doc.html>
[^note-6]: <https://www.dr-qubit.org/cleveref.html>
[^note-7]: <https://www.bibtex.org/>
[^note-8]: <https://ctan.org/pkg/todonotes>
[^note-9]: <https://ctan.org/pkg/comment>
[^note-10]: <https://ctan.org/pkg/pgfplots>
[^note-11]: <https://ctan.org/pkg/listings>
[^note-12]: <https://ctan.org/pkg/graphicx>
[^note-13]: <https://www.overleaf.com/learn/latex/LaTeX_Graphics_using_TikZ%3A_A_Tutorial_for_Beginners_(Part_1)%E2%80%94Basic_Drawing>
[^note-14]: Comma Separated Values.
[^note-15]: <https://tex.stackexchange.com/questions/83888/how-to-plot-data-from-a-csv-file-using-tikz-and-csvsimple>
[^note-16]: <https://tex.stackexchange.com/questions/146716/importing-csv-file-into-latex-as-a-table>
[^note-17]: Footnotes allow you to use more informal tone occasionally and they are useful for condensing your text if you are working with a page limit.
[^note-18]: Each character has an equal width in a monospaced font making it ideal for programming.
[^note-19]: <https://ctan.org/pkg/listings>
[^note-20]: <https://ctan.org/pkg/minted>
[^note-21]: <https://www.overleaf.com/learn/latex/Code_listing>
[^note-22]: <https://www.overleaf.com/learn/latex/Code_Highlighting_with_minted>
[^note-23]: <https://git-scm.com/>
[^note-24]: <https://www.semipol.de/posts/2018/06/latex-best-practices-lessons-learned-from-writing-a-phd-thesis/>
