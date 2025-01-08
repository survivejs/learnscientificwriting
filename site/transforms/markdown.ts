import { install, tw } from "https://esm.sh/@twind/core@1.1.1";
import { marked } from "https://unpkg.com/marked@15.0.3/lib/marked.esm.js";
import type { Renderer } from "https://unpkg.com/marked@15.0.3/lib/marked.d.ts";
import highlight from "https://unpkg.com/@highlightjs/cdn-assets@11.10.0/es/core.min.js";
import highlightBash from "https://unpkg.com/highlight.js@11.10.0/es/languages/bash";
import highlightJS from "https://unpkg.com/highlight.js@11.10.0/es/languages/javascript";
import highlightJSON from "https://unpkg.com/highlight.js@11.10.0/es/languages/json";
import highlightTS from "https://unpkg.com/highlight.js@11.10.0/es/languages/typescript";
import highlightYAML from "https://unpkg.com/highlight.js@11.10.0/es/languages/yaml";
import type { DataSourcesApi } from "https://deno.land/x/gustwind@v0.78.0/types.ts";
import twindSetup from "../twindSetup.ts";

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

// @ts-expect-error This is fine
install(twindSetup);

function getTransformMarkdown(load: DataSourcesApi["load"]) {
  return function transformMarkdown(input: string) {
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
          tw("overflow-auto -mx-4 md:mx-0") +
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
          ' class="' + tw("inline") + '"' +
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

        return `<img src="${href}" alt="${alt}" title="${title || ""}" class="${
          tw(className)
        }" width="${width}" height="${height}" />`;
      },
      link({ href, title, tokens }) {
        // @ts-expect-error Parser will exist
        const text = this.parser.parseInline(tokens);

        if (href === null) {
          return text;
        }

        if (text === "<file>") {
          // TODO: Show a nice error in case href is not found in the fs
          const fileContents = load.textFileSync(href);

          return this.code({
            type: "code",
            text: fileContents,
            lang: href.split(".").at(-1) as string,
            raw: fileContents,
          });
        }

        let out = '<a class="' + tw("underline") + '" href="' + href + '"';
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
        return "<" + type + startatt + ' class="' + tw(klass) + '">\n' +
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
