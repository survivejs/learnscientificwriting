Technology is an important part of a writer's arsenal as choosing your tools well can help your productivity.
I do most of my work using an online service called Overleaf while relying on Google Scholar, Semantic Scholar, and ResearchGate for discovering references.
I also leverage tools, like Grammarly or Turnitin, in the editing phase.

## Writing tools

Learning to use a typesetting system called LaTeX can be useful, especially for technical papers.
Thanks to the emergence of online tools like Overleaf, it is easier to use LaTeX now than in the past.

#### Overleaf, an online editor for LaTeX

[Overleaf](https://www.overleaf.com/)[^note-1] is perhaps the service I use the most for writing. In short, it is an online tool that you can use to author [LaTeX](https://www.latex-project.org/)[^note-2].
LaTeX is a typesetting system that is at its best in scientific publishing.
If you are into programming, you will most likely get comfortable with LaTeX quickly enough.
In case you are not, there is also a visual editor available in Overleaf that allows you to describe your documents in perhaps a more familiar manner.
Note that I cover LaTeX in greater detail at :ref[ap:latex].

Overleaf is not only about compiling LaTeX code into documents but also about collaboration.
The collaborative features are essential when you work with others as they let them leave comments for you to consider and develop content together.
To enable the functionality in Overleaf, you need a Premium license.
You have to enable the Review feature through the toolbar.
After activating *Review*, you have to facilitate tracking changes; after that, it is possible to leave comments.
The second thing you must do is remember to use the *Share* functionality to share the document with your co-authors.

Given Overleaf is so popular, many [templates](https://www.overleaf.com/latex/templates)[^note-3] exist for it.
If you cannot find a suitable template, check what kind of LaTeX templates your institution provides and import them into the system to get started faster.

Note that although Overleaf has its benefits, it is understandable if you want to use your own desktop editor instead for example.
For using your favorite editor, consider leveraging Overleaf's Git or Dropbox integrations as those allow you to synchronize local changes to Overleaf service.
Git in particular is a good choice for programmers as it allows to keep track of changes in a granular manner and even to maintain a changelog.

#### Typst, an online editor

[Typst](https://typst.app/) is another online editor that could be considered as a modernized version of LaTeX as it is more approachable.
The main downside of Typst is that it is not commonly used yet meaning your target publication might not have a template available for the tool.

#### Microsoft Word

Microsoft Word is a commonly used WYSIWYG (What You See Is What You Get) editor that is commonly used for scientific work.
Compared to LaTeX and Typst it is more flexible layout-wise, but simultaneously that can be a drawback as during authoring you might not care about layout as it is something you usually tackle near the end at the editing phase.
Microsoft Word provides collaborative features and it is possible to use it over the web or through a desktop application.

## Finding references

One big part of scientific writing is finding suitable references.
I cover Google Scholar, Semantic Scholar, and ResearchGate in detail in this section before touching on reference specific tooling.

#### Google Scholar

[Google Scholar](https://scholar.google.com/)[^note-4] is a search engine explicitly meant for discovering scientific references.
Depending on the research domain, it can be more or less valuable. You should experiment with different **search terms** to get the most out of it and document the terms you use, as this will come in handy in the future when you want to refresh your references.

Note that there is a useful [Google Scholar PDF reader plugin available for Chrome](https://chromewebstore.google.com/detail/google-scholar-pdf-reader/dahenjhkoodjbpjheillcadbppiidmhp)[^note-5] that makes automatic table of contents out of PDF contents and more.

#### Semantic Scholar

To get another point of view on articles related to your search terms, try [Semantic Scholar](https://www.semanticscholar.org/)[^note-6].
Occasionally, it seems to generate results that are not as visible in Google Scholar, and you might find some references that you might otherwise miss.
The great thing about Semantic Scholar is that you can train it to find timely content for you.
You do this kind of training by creating collections where you attach relevant papers.
Semantic Scholar is then able to send you a weekly email with papers related to your interests allowing you to keep track of recent changes in a specific field.
Doing this will not replace your own research but it complements it nicely while giving access to papers you might otherwise miss especially in crowded research spaces.

#### ResearchGate

[Research\-Gate](https://www.researchgate.net/)[^note-7] is another potential source for discovering references and new scientific output.
Perhaps more interestingly, the service lets you set up your profile and highlight your work.
In this way, it is like a LinkedIn, but for scientists.

Note that content is not included for all papers listed at ResearchGate.
Often, it is available through a DOI[^note-8] link at the ResearchGate UI.
If this does not work, you could try searching for the article through another service to find another source or use a proxy provided by your institution, as multiple subscriptions are often in place for this purpose.

#### Paper databases

The search engines mentioned earlier rely on content available on the web, including paper databases that are specific to particular niches.
To make it easier to find these databases, Aalto University has built a specific search for them[^note-9], and your institution may have a similar search available on its site.
University libraries maintain this kind of resource typically.

#### Generating more references to study

To generate more references to study, look into the references of your main articles.
Occasionally, this is called backward snowballing :cite[jalali2012systematic].
Forward snowballing :cite[jalali2012systematic] achieves the opposite, as you look into who was referencing a reference.
By combining these techniques, you can build up a large number of references fast and understand how your sources are being used.

Another way to generate more references is to look into the regular web.
Although it is important to treat these sources as complimentary, in some cases, depending on the study, you may be forced to source most of your information from these sources.
Even then, it is a good idea to try to include a healthy amount of scientific sources and consider alternate sources, such as specifications, as those can also be considered authoritative sources of information.

#### Visualizing your references

[Connected Papers](https://www.connectedpapers.com/)[^note-10] is a tool that allows you to visualize the references of a given paper in a visual form as a graph.
Examining the graph visualization can help to generate further work to investigate and show clusters of papers related to each other to locate potential sources.

#### Summarizing content

There are several services that can summarize content for you.
For example, [ASReview](https://asreview.nl/)[^note-11] is an active learning tool that helps you to systematically screen large amounts of text.
[SciSummary](https://scisummary.com/)[^note-12] is another service that uses AI to summarize the contents of a paper.
You can also consider using your favorite AI-powered service for the task.
Regardless of the approach, I recommend checking the papers in detail yourself as it is your responsibility to verify that the summaries were correct since you cannot trust AI generated summaries completely due to technical limitations, such as hallucinated text, related to them.

#### Perform a systematic literature review using PRISMA 2020 guidelines

If you want to be systematic about the way you research, you could go as far as to follow PRISMA 2020 guidelines by :cite[page2021prisma].
In short, by following PRISMA you will document your search protocol so other researchers can repeat it easily and filter out content relevant to your research.
Often researchers share this type of work as reports and often these kind of papers are useful for discovering research gaps and summarizing large amounts of information into a condensed form making them useful in contested research spaces that have a lot of content available.

## Writing support

Many tools and services are available to support your writing, and I will cover a few in this section.
The main point is that these resources cannot replace writing, and you still must do the hard work yourself.
The resources can, however, support your efforts by giving you means to describe things, organize, or rephrase or clarify, for example.

#### Potential of artificial intelligence based writing tools

Several tools leverage Artificial Intelligence (AI), or more specifically Large Language Models (LLMs)[^note-13], as AI has decent pattern detection capabilities and can enhance writing and help generate ideas.
As you develop your writing style, it is important not to rely on AI too much and treat its suggestions critically as you will responsible for the correctness and accuracy of your work.

Services, like [ChatGPT](https://chatgpt.com/), can help to generate initial ideas.
As pointed out by :cite[lemireLargeLanguage]{mode=textual}, AI tools can complement you by working as a research assistant to perform otherwise time consuming tasks, such as querying a document for a specific piece of information, coming up with research questions, writing code, finding reviewers and journals, and so on.
Since new tools come available constantly, it is impossible to cover them in detail in this context, and it is worth checking [AIexploria's list as it covers many of the available solutions](https://www.aixploria.com/en/ultimate-list-ai/)[^note-14].
We will cover two of the tools, Grammarly and Turnitin, below to gain a better understanding of how these sort of resources can help us in our research work.

#### Grammarly

Several tools can support your writing, and the one I prefer to use near the end of the writing process is called [Grammarly](https://www.grammarly.com/)[^note-15].
Essentially, it takes your text as its input, analyzes it, and gives you suggestions on how to improve it.
For example, it can catch comma-related issues, missing articles, and flow-related problems.
Their browser plugin works with Overleaf, which makes it a good combination.

As the plugin sends all your input to Grammarly to process as per their user agreement, I disable the browser plugin by default and enable it only when I want to edit my work.
As a measure of personal data security, you should likely take care not to send anything confidential to their servers.

Another major caveat of Grammarly is that since it uses other papers as the source of its grammar, relying too much on its tips can lead to failures at similarity checks, so be critical of its advice and do not accept everything blindly.
Instead, consider rewriting the content slightly and skip advice that does not seem relevant.
I have found the tool most helpful in picking up issues with commas and occasionally improving individual wording.

#### Turnitin, a similarity checker

One of the problems in academic writing is maintaining originality and referring to the existing body of work correctly.
One of the tools that can help with this task is called [Turnitin](https://www.turnitin.com/)[^note-16].
The access to Turnitin depends on your institution. In general, you might not be able to reach a perfect score but the tool can still help highlight potential problem points to improve and fix.
Especially early on, as you are learning different citing techniques, tools like Turnitin can be valuable.
They also help point out the overreliance on tools like Grammarly as the fixes they propose may make your text too similar to existing works.

## Summary

Good tools can support your writing process and it is essential to find tools that work well for you.
I prefer online-based tools myself and I use several ones for different purposes. Most likely the list I provided here is far from exhaustive and it is possible you will discover several useful tools beyond the list and some may be even recommended by your institution.

[^note-1]: <https://www.overleaf.com/>
[^note-2]: <https://www.latex-project.org/>
[^note-3]: <https://www.overleaf.com/latex/templates>
[^note-4]: <https://scholar.google.com/>
[^note-5]: <https://chromewebstore.google.com/detail/google-scholar-pdf-reader/dahenjhkoodjbpjheillcadbppiidmhp>
[^note-6]: <https://www.semanticscholar.org/>
[^note-7]: <https://www.researchgate.net/>
[^note-8]: Digital Object Identifier.
[^note-9]: See <https://primo.aalto.fi/discovery/dbsearch?vid=358AALTO_INST:VU1&lang=en>.
[^note-10]: <https://www.connectedpapers.com/>
[^note-11]: <https://asreview.nl/>
[^note-12]: <https://scisummary.com/>
[^note-13]: Typically, when people speak about AI, they refer to LLMs, a specific technique within the broader field.
[^note-14]: <https://www.aixploria.com/en/ultimate-list-ai/>
[^note-15]: <https://www.grammarly.com/>
[^note-16]: <https://www.turnitin.com/>
