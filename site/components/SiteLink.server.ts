import type { DataSourcesApi } from "https://deno.land/x/gustwind@v0.77.2/types.ts";

function init(o: DataSourcesApi) {
  function validateUrl(url: string) {
    if (!url) {
      throw new Error("No url was provided");
    }

    if (url.startsWith("http")) {
      return url;
    }

    return url;
  }

  return { validateUrl };
}

export { init };
