import type { DataSourcesApi } from "gustwind";

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
