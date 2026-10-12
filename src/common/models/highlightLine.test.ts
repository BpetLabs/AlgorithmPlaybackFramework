import { describe, expect, it } from "vitest";
import { parseHighlightRanges } from "./highlightLine";

describe("parseHighlightRanges", () => {
  it("parses individual lines and ranges", () => {
    expect(parseHighlightRanges("1, 3-5, 8")).toEqual([
      { start: 1, end: 1 },
      { start: 3, end: 5 },
      { start: 8, end: 8 },
    ]);
  });

  it("normalizes invalid, fractional, reversed, and non-positive ranges", () => {
    expect(parseHighlightRanges("invalid, 4.9-2, -3, 0-2")).toEqual([
      { start: 1, end: 1 },
      { start: 4, end: 4 },
      { start: 1, end: 3 },
      { start: 1, end: 2 },
    ]);
  });

  it("ignores empty range entries", () => {
    expect(parseHighlightRanges(" , , ")).toEqual([]);
  });
});
