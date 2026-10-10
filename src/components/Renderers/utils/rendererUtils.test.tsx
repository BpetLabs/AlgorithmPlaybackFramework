import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ControlItemState } from "../../../common/models/controlItem";
import { buildGridCells } from "./buildGridCells";
import { requirePositiveDimension, requirePositiveInteger } from "./dimensions";
import { parseInlineBoldSegments, renderLineWithInlineBold } from "./inlineBold";
import { buildHighlightOverlayStyle } from "./itemBoxStyle";

describe("renderer utilities", () => {
  it("fills grid gaps and preserves the largest occupied cell size", () => {
    const cells = buildGridCells(
      [
        { item: { id: "a", state: ControlItemState.Initial }, collapsed: false, collapsedIndex: 50, offset: 50, itemOffset: 20 },
        { item: { id: "b", state: ControlItemState.Initial }, collapsed: false, collapsedIndex: 50, offset: 50, itemOffset: 30 },
      ],
      120,
      50
    );

    expect(cells).toEqual([
      { offset: 0, size: 50 },
      { offset: 50, size: 30 },
      { offset: 80, size: 40 },
    ]);
  });

  it("validates positive dimensions and integers", () => {
    expect(requirePositiveDimension(1.5, "width")).toBe(1.5);
    expect(requirePositiveInteger(2, "rows")).toBe(2);
    expect(() => requirePositiveDimension(Number.NaN, "width")).toThrow("width must be a positive number");
    expect(() => requirePositiveDimension(0, "width")).toThrow("width must be a positive number");
    expect(() => requirePositiveInteger(1.5, "rows")).toThrow("rows must be a positive integer");
    expect(() => requirePositiveInteger(undefined, "rows")).toThrow("rows must be a positive integer");
  });

  it("parses bold segments while preserving unmatched markers", () => {
    expect(parseInlineBoldSegments("plain **bold** tail **open")).toEqual([
      { text: "plain ", bold: false },
      { text: "bold", bold: true },
      { text: " tail **open", bold: false },
    ]);
    expect(renderToStaticMarkup(<>{renderLineWithInlineBold("")}</>)).toBe(" ");
  });

  it("creates highlight overlays only when a border color is present", () => {
    expect(buildHighlightOverlayStyle({ borderColor: " " })).toBeNull();
    expect(buildHighlightOverlayStyle(
      { borderColor: "blue", borderWidth: 2 },
      { borderWidth: 5, borderRadius: 4 }
    )).toMatchObject({
      border: "2px solid blue",
      borderRadius: 4,
      pointerEvents: "none",
    });
  });
});
