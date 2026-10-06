import { describe, expect, it } from "vitest";
import { loadControls } from "./loadControls";

describe("loadControls", () => {
  it("loads grid renderer options from JSON", () => {
    const [control] = loadControls([
      {
        id: "grid",
        type: "grid",
        rows: 2,
        cols: 2,
        emptyItemText: "0",
        rowDescription: "First",
        columnDescription: "Second",
        rowLabels: ["C", "D"],
        columnLabels: ["A", "B"],
      },
    ]);

    expect(control.rendererOptions).toMatchObject({
      rows: 2,
      cols: 2,
      emptyItemText: "0",
      rowDescription: "First",
      columnDescription: "Second",
      rowLabels: ["C", "D"],
      columnLabels: ["A", "B"],
    });
  });

  it("loads array item labels from JSON", () => {
    const [control] = loadControls([
      {
        id: "items",
        type: "array",
        orientation: "vertical",
        itemLabels: ["first", "second"],
      },
    ]);

    expect(control.rendererOptions).toMatchObject({
      orientation: "vertical",
      itemLabels: ["first", "second"],
    });
  });

  it("rejects duplicate control ids", () => {
    expect(() =>
      loadControls([
        { id: "same" },
        { id: "same" },
      ])
    ).toThrow('Duplicate control id "same"');
  });

  it("rejects an empty control id", () => {
    expect(() => loadControls([{ id: " " }])).toThrow(
      "must have a non-empty id"
    );
  });
});
