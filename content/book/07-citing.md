
Citing is often a characteristic that makes scientific writing difficult especially for beginners as other types of writing have often looser citation requirements.
This is particularly true for types of texts that are opinionated or even fiction.
Learning to cite well is one of the core skills of anyone wanting to produce scientific texts and it is worth investing time into learning to cite early on as that will save effort long term while making it easier for your collaborators.
It is one of the reasons why authoring scientific texts typically requires more effort than other types but it is a skill worth learning.

## Why citing accurately matters {#sec-citing-accuracy}

Scientific writing in particular comes with a strong attribution requirement as it is vital to show where ideas originate from.
The general rule is that know facts can be stated without a reference, but for anything specific you most likely want to include a source.
Including sources shows that you have studied the topic and give respect to earlier work done in the field.
Proper sourcing also allows you to discuss with prior work and bring up your points in contrast to theirs.
There is no option to citing well in your scientific work since omitting crucial citations is considered plagiarism and hence academic misconduct that may have consequences.

## Types of citations {#sec-citation-types}

The exact way how you should cite depends on your field and journals usually have an opinion or two related to formatting.
Generally put, I use the following ways in my work: textual, parenthetical, direct, and combined citations.
I will cover these types in the next sections in greater detail.

#### Textual citation

Textual citation is useful for constructing a sentence based on a citation as in the following example: In :cite[vepsalainen2023implications]{mode=textual}, the authors noted that edge computing can provide performance benefits for static website hosting while techniques, such as ISR, can be used to address the build cost of SSG.

#### Parenthetical citation

Parenthetical citation can be used for integrating ideas from papers within a sentence as in the following example: In our study, we found out that edge computing has strong benefits when combined with SSG confirming the observations of :cite[vepsalainen2023implications].

#### Direct citation

Direct citation is useful when you want to capture exact wording as in the following example: In :cite[vepsalainen2023implications]{mode=textual}, the authors stated that "...there are still open questions related to techniques, their applicability in other environments, and their limitations.".
Often you do not have to use this form, however, and paraphrasing may be the recommended way to go.

#### Combined citation

Combined citations can be used when you want to bring the same observation from multiple source together to strengthen a point as in the following example: It seems there is a strong demand for new web technologies that address performance demands of the modern web as implied by :cite[vepsalainen2023implications, vepsalainen2023rise].

#### Chaining citations

Although it is important to cite accurately, there are situations where you might have to cite the same source in subsequently multiple times in a row and having to repeat citation again and again may then feel unwieldy.
That is where nesting citations may come in handy as you can use sentence context to make the source clear for the reader.
Consider the following example: :cite[vepsalainen2023implications] considered the implications of edge computing for static site generation. They found out that the combination of these two technologies provides clear benefits for web performance under scenarios where edge computing platforms may be leveraged.

## Cite per sentence, not per paragraph {#sec-cite-per-sentence}

Regardless of the citation style you prefer, I have found that it is better to cite per sentence over paragraph-level citations as that makes it clearer to me what is my own thinking and what is coming from elsewhere.
The risk with paragraph-level citations is that even though they might be initially correct, they might become inaccurate over time as you work on your paragraphs.
Sentence-level citations may lead to repetitive looking text but you could also consider this as a reminder to do more research to pull information from more diverse sources to add credibility to your text.
If you are interested in technical details, I cover LaTeX-specific citation syntax in Section :ref[]{target="sec:citing-in-latex"}.

## Maintaining references automatically {#sec-maintaining-references}

The lightest approach is to store reference papers to your hard drive or cloud and then annotate the PDF files using your preferred annotation program.
There are specialized systems, such as [Zotero](https://www.zotero.org/)[^zotero] and [Mendeley](https://www.mendeley.com/)[^mendeley] that handle these tasks in a specialized manner.

If you work with LaTeX, consider leveraging [BibTeX](https://www.bibtex.org/)[^bibtex] and storing your references using the format as that simplifies your work greatly since the system is able to generate references automatically in the right style based on your citations.
I recommend using [getbibtex.com](https://www.getbibtex.com/)[^getbibtex] for generating references against online sources.

## Summary {#sec-citing-summary}

Citing correctly is an essential part of scientific writing and you should take care to learn to cite.
Citing can be slow work especially early on, but as you progress as a writer it becomes easier to integrate ideas from other people to your work and it becomes natural over time.
Citations allow us to stand on the shoulders of giants and respect the work that has been done before us while contributing to the scientific corpus of knowledge to continue the tradition.

In case you want to learn more about citing, [University of Wisconsin-Madison's writing guide](https://writing.wisc.edu/handbook/documentation/)[^wisconsin] covers different styles adequately.

[^zotero]: <https://www.zotero.org/>
[^mendeley]: <https://www.mendeley.com/>
[^bibtex]: <https://www.bibtex.org/>
[^getbibtex]: <https://www.getbibtex.com/>
[^wisconsin]: <https://writing.wisc.edu/handbook/documentation/>
