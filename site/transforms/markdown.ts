import { marked } from "marked";
import type { Renderer } from "marked";
import highlight from "highlight.js/lib/core";
import highlightBash from "highlight.js/lib/languages/bash";
import highlightJS from "highlight.js/lib/languages/javascript";
import highlightJSON from "highlight.js/lib/languages/json";
import highlightTS from "highlight.js/lib/languages/typescript";
import highlightYAML from "highlight.js/lib/languages/yaml";
import type { DataSourcesApi } from "gustwind";

highlight.registerLanguage("bash", highlightBash);
highlight.registerLanguage("javascript", highlightJS);
highlight.registerLanguage("js", highlightJS);
highlight.registerLanguage("json", highlightJSON);
highlight.registerLanguage("typescript", highlightTS);
highlight.registerLanguage("ts", highlightTS);
highlight.registerLanguage("yaml", highlightYAML);

marked.setOptions({
  gfm: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: true,
  highlight: (code: string, language: string) => {
    try {
      return highlight.highlight(code, { language }).value;
    } catch (error) {
      console.error("Missing a known language for", code);
      console.error(error);
    }
  },
});

function getTransformMarkdown(load: DataSourcesApi["load"]) {
  return function transformMarkdown(input: string, sourcePath = "<markdown>") {
    if (typeof input !== "string") {
      console.error("input", input);
      throw new Error("transformMarkdown - passed wrong type of input");
    }

    // https://github.com/markedjs/marked/issues/545
    const tableOfContents: { slug: string; level: number; text: string }[] = [];

    const renderer: Pick<
      Renderer,
      "code" | "heading" | "image" | "link" | "list"
    > = {
      code({ text: code, lang }) {
        // @ts-ignore How to type this?
        if (this.options.highlight) {
          // @ts-ignore How to type this?
          const out = this.options.highlight(code, lang);

          if (out != null && out !== code) {
            code = out;
          }
        }

        code = code.replace(/\n$/, "") + "\n";

        if (!lang) {
          return "<pre><code>" +
            code +
            "</code></pre>\n";
        }

        return '<pre class="' +
          "overflow-auto -mx-4 md:mx-0" +
          '"><code class="' +
          // @ts-ignore How to type this?
          (this.options.langPrefix || "") +
          lang +
          '">' +
          code +
          "</code></pre>\n";
      },
      heading(token) {
        // @ts-expect-error Parser will exist
        const text = this.parser.parseInline(token.tokens);
        const level = token.depth;
        const slug = slugify(token.raw);

        tableOfContents.push({ slug, level, text });

        return '<a href="#' + slug + '"><h' +
          level +
          ' class="inline"' +
          ' id="' +
          slug +
          '">' +
          text +
          "</h" +
          level +
          ">" +
          "</a>\n";
      },
      image({ href, title, text }) {
        const textParts = text ? text.split("|") : [];
        const alt = textParts[0] || "";
        const width = textParts[1] || "";
        const height = textParts[2] || "";
        const className = textParts[3] || "";

        return `<img src="${href}" alt="${alt}" title="${title || ""}" class="${className}" width="${width}" height="${height}" />`;
      },
      link({ href, title, tokens }) {
        // @ts-expect-error Parser will exist
        const text = this.parser.parseInline(tokens);

        if (href === null) {
          return text;
        }

        if (text === "<file>") {
          let fileContents = "";

          try {
            fileContents = load.textFileSync(href);
          } catch (error) {
            throw new Error(
              `${sourcePath}: unable to include Markdown file link target "${href}"`,
              { cause: error },
            );
          }

          return this.code({
            type: "code",
            text: fileContents,
            lang: href.split(".").at(-1) as string,
            raw: fileContents,
          });
        }

        let out = '<a class="underline" href="' + href + '"';
        if (title) {
          out += ' title="' + title + '"';
        }
        out += ">" + text + "</a>";
        return out;
      },
      list({ ordered, start, items }) {
        // Copied from marked source
        let body = "";
        for (let j = 0; j < items.length; j++) {
          const item = items[j];

          // @ts-expect-error Use default listitem
          body += this.listitem(item);
        }

        const type = ordered ? "ol" : "ul",
          startatt = (ordered && start !== 1) ? (' start="' + start + '"') : "",
          klass = ordered
            ? "list-decimal list-inside"
            : "list-disc list-inside";
        return "<" + type + startatt + ' class="' + klass + '">\n' +
          body +
          "</" +
          type + ">\n";
      },
    };

    // https://marked.js.org/using_pro#renderer
    // https://github.com/markedjs/marked/blob/master/src/Renderer.js
    marked.use({ renderer });

    return { content: marked(input), tableOfContents };
  };
}

function slugify(idBase: string) {
  return idBase
    .toLowerCase()
    .replace(/`/g, "")
    .replace(/[^\w]+/g, "-");
}

export default getTransformMarkdown;
