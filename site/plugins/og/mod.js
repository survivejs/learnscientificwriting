import path from "node:path";
import React from "react";
import { ImageResponse } from "@vercel/og";

const WIDTH = 1200;
const HEIGHT = 630;

const colors = {
  background: "#fbfaf7",
  paper: "#fffaf0",
  primary: "#12343b",
  muted: "#2f5d62",
  warning: "#b46b30",
  rule: "#d9cdb8",
};

const plugin = {
  meta: {
    name: "learnscientificwriting-og-plugin",
    description: "Generates editorial Open Graph images for each rendered route.",
  },
  init({ outputDirectory }) {
    return {
      beforeEachRender: async ({ context, url }) => {
        const image = await renderOgImage({
          eyebrow: getEyebrow(context),
          title: String(context.meta?.title || "Learn scientific writing"),
          description: String(
            context.meta?.description ||
              "A practical open book about writing clear research articles.",
          ),
        });

        return [{
          type: "writeFile",
          payload: {
            outputDirectory,
            file: getOgPath(url),
            data: new Uint8Array(await image.arrayBuffer()),
          },
        }];
      },
    };
  },
};

function getEyebrow(context) {
  const title = String(context.meta?.title || "");

  if (/^\d+\.\s/.test(title)) {
    return "The Process of Scientific Writing";
  }

  if (/^[A-Z]\.\s/.test(title)) {
    return "Appendix";
  }

  return String(context.meta?.siteName || "Learn scientific writing");
}

function getOgPath(url) {
  return path.join(url.replace(/^\/|\/$/g, ""), "og.png");
}

function renderOgImage({ eyebrow, title, description }) {
  return new ImageResponse(
    React.createElement(
      "div",
      {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          background: colors.background,
          color: colors.primary,
          fontFamily: "Georgia, serif",
          padding: 58,
          position: "relative",
        },
      },
      React.createElement("div", {
        style: {
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(#12343b14 1px, transparent 1px), linear-gradient(90deg, #12343b14 1px, transparent 1px)",
          backgroundSize: "88px 88px",
        },
      }),
      React.createElement("div", {
        style: {
          position: "absolute",
          left: 64,
          top: 54,
          bottom: 54,
          width: 10,
          background: colors.warning,
        },
      }),
      React.createElement(
        "div",
        {
          style: {
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: colors.paper,
            border: `2px solid ${colors.rule}`,
            padding: "54px 62px 48px 72px",
            boxShadow: `18px 18px 0 ${colors.primary}`,
            position: "relative",
          },
        },
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: colors.muted,
              fontFamily: "Arial, sans-serif",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase",
            },
          },
          React.createElement("div", null, eyebrow),
          React.createElement("div", null, "Open guide"),
        ),
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: 28,
              maxWidth: 930,
            },
          },
          React.createElement(
            "div",
            {
              style: {
                color: colors.primary,
                fontSize: title.length > 48 ? 66 : 78,
                lineHeight: 0.95,
                fontWeight: 700,
                letterSpacing: -1,
              },
            },
            title,
          ),
          React.createElement(
            "div",
            {
              style: {
                width: 190,
                height: 8,
                background: colors.warning,
              },
            },
          ),
          React.createElement(
            "div",
            {
              style: {
                color: colors.muted,
                fontFamily: "Arial, sans-serif",
                fontSize: 31,
                lineHeight: 1.35,
                maxWidth: 860,
              },
            },
            description,
          ),
        ),
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: colors.warning,
              fontFamily: "Arial, sans-serif",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
            },
          },
          React.createElement("div", null, "Claim -> evidence -> revision"),
          React.createElement("div", null, "learnscientificwriting.com"),
        ),
      ),
    ),
    {
      width: WIDTH,
      height: HEIGHT,
    },
  );
}

export { plugin };
