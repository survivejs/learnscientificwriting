import getMarkdown from "../transforms/markdown.ts";
import type { DataSourcesApi } from "gustwind";
import { unwrapRawHtml } from "gustwind/htmlisp";

function init({ load }: DataSourcesApi) {
  const markdown = getMarkdown(load);

  return {
    processMarkdown: async (input: unknown) =>
      (await markdown(unwrapRawHtml(input))).content,
  };
}

export { init };
