import type { DataSourcesApi } from "gustwind";

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

    return parts
      .filter(Boolean)
      .map((part, index) => {
        if (index === 0) {
          return part.replace(/\/+$/g, "");
        }

        return part.replace(/^\/+|\/+$/g, "");
      })
      .join("/");
  }

  return {
    dateToString,
    getDate,
    getYear,
    getDatetime,
    getFullDate,
    length,
    urlJoin,
  };
}

export { init };
