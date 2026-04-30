import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";

test("OpenGraph images keep text away from the right border", async () => {
  execFileSync("npm", ["run", "build"], { stdio: "pipe" });

  const images = findOgImages("build");

  assert.ok(images.length > 0, "expected generated OpenGraph images");

  for (const image of images) {
    const unsafePixels = await countUnsafeRightGutterPixels(image);

    assert.equal(unsafePixels, 0, `${image} has text-like pixels near the right border`);
  }
});

function findOgImages(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      return findOgImages(entryPath);
    }

    return entry.isFile() && entry.name === "og.png" ? [entryPath] : [];
  });
}

async function countUnsafeRightGutterPixels(image) {
  const { data, info } = await sharp(image)
    .ensureAlpha()
    .extract({ left: 1020, top: 150, width: 42, height: 380 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let unsafePixels = 0;

  for (let index = 0; index < data.length; index += info.channels) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3];
    const distanceFromCard = Math.abs(red - 255) + Math.abs(green - 250) + Math.abs(blue - 240);

    if (alpha > 0 && distanceFromCard > 35) {
      unsafePixels++;
    }
  }

  return unsafePixels;
}
