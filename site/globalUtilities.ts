import { tw } from "https://esm.sh/@twind/core@1.1.1";
import { urlJoin as urlJoinFn } from "https://bundle.deno.dev/https://deno.land/x/url_join@1.0.0/mod.ts";
import type { DataSourcesApi } from "https://deno.land/x/gustwind@v0.77.2/types.ts";

function init(o: DataSourcesApi) {
  function getDate(d: string) {
    const date = new Date(d);

    return `${date.getDate()}.${date.getMonth() + 1}`;
  }

  function getYear(d: string) {
    return new Date(d).getFullYear();
  }

  function getDatetime(d: string) {
    const date = new Date(d);

    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  function getFullDate(d: string) {
    const date = new Date(d);

    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
  }

  function dateToString(date: string) {
    try {
      return (new Date(date)).toISOString().split("T")[0];
    } catch (error) {
      console.error("Failed to parse", date);
      // @ts-expect-error This is fine
      throw new Error(error);
    }
  }

  function length(arr: unknown[]) {
    return arr.length;
  }

  function urlJoin(...parts: string[]) {
    if (!parts.every((s) => typeof s === "string")) {
      console.error(parts);
      throw new Error("Failed to join url");
    }

    return urlJoinFn(...parts);
  }

  return {
    dateToString,
    getDate,
    getYear,
    getDatetime,
    getFullDate,
    length,
    urlJoin,
    tw,
  };
}

export { init };
