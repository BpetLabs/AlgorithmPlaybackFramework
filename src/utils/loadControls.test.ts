import { describe, expect, it } from "vitest";
import { Highlight } from "../common/models/highlightLine";
import { loadControls } from "./loadControls";

describe("loadControls", () => {
  it("attaches jagged children by numeric suffix and applies parent defaults", () => {
    const controls = loadControls([
      {
        id: "matrix",
        type: "jaggedArray",
        orientation: "vertical",
        initialItemCount: 1,
        childDefaults: {
          itemWidth: 80,
          render: {
            visible: false,
            layout: { width: 80, height: 40 },
          },
        },
      },
      {
        id: "matrix-2",
        orientation: "horizontal",
        itemHeight: 30,
        render: {
          visible: true,
          layout: { width: 100 },
        },
      },
      { id: "matrix-label", type: "text" },
    ]);

    expect(controls.map((control) => control.id)).toEqual([
      "matrix",
      "matrix-label",
    ]);

    const parent = controls[0];
    expect(parent.snapshots[0].items).toHaveLength(3);
    expect(parent.childControls).toHaveLength(1);

    const child = parent.childControls?.[0];
    expect(child).toMatchObject({
      id: "matrix-2",
      type: "array",
      parentId: "matrix",
      parentIndex: 2,
      rendererOptions: {
        orientation: "horizontal",
        itemWidth: 80,
        itemHeight: 30,
      },
      render: {
        visible: true,
        layout: { width: 100, height: 40 },
      },
    });
  });

  it("loads recursively nested jagged arrays", () => {
    const controls = loadControls([
      {
        id: "cube",
        type: "jaggedArray",
      },
      {
        id: "cube-0",
        type: "jaggedArray",
      },
      {
        id: "cube-0-0",
        type: "array",
        initialItemCount: 2,
      },
    ]);

    expect(controls).toHaveLength(1);
    expect(controls[0].snapshots[0].items).toHaveLength(1);

    const matrix = controls[0].childControls?.[0];
    expect(matrix).toMatchObject({
      id: "cube-0",
      type: "jaggedArray",
      parentId: "cube",
      parentIndex: 0,
      rendererOptions: { orientation: "vertical" },
    });
    expect(matrix?.snapshots[0].items).toHaveLength(1);
    expect(matrix?.childControls?.[0]).toMatchObject({
      id: "cube-0-0",
      type: "array",
      parentId: "cube-0",
      parentIndex: 0,
      rendererOptions: { orientation: "horizontal" },
    });
  });

  it("accumulates render overrides across snapshot steps", () => {
    const [control] = loadControls([
      {
        id: "items",
        type: "array",
        render: {
          visible: true,
          title: "Initial",
          layout: { top: 10, width: 100 },
        },
        renderBatches: [
          {
            step: 1,
            render: { visible: false, layout: { width: 200 } },
          },
        ],
        batches: [
          { step: 1 },
          {
            step: 2,
            render: { title: "Updated", layout: { height: 50 } },
          },
        ],
      },
    ]);

    expect(control.renderByStep?.[0]).toEqual({
      visible: true,
      title: "Initial",
      layout: { top: 10, width: 100 },
    });
    expect(control.renderByStep?.[1]).toEqual({
      visible: false,
      title: "Initial",
      layout: { top: 10, width: 200 },
    });
    expect(control.renderByStep?.[2]).toEqual({
      visible: false,
      title: "Updated",
      layout: { top: 10, width: 200, height: 50 },
    });
  });

  it("rejects non-array input", () => {
    expect(() => loadControls(null as never)).toThrow(
      "Controls must be provided as an array"
    );
  });

  it("rejects non-object control entries", () => {
    expect(() => loadControls([null as never])).toThrow(
      "Control at index 0 must be an object"
    );
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

  it("resolves semantic highlight aliases before processing batches", () => {
    const [control] = loadControls([
      {
        id: "code",
        type: "staticText",
        batches: [
          {
            step: 0,
            highlightLines: [
              { range: "1", backgroundColor: "Highlight.Pause" },
            ],
          },
        ],
      },
    ]);

    expect(control.snapshots.at(-1)?.highlightLines?.[0]).toMatchObject({
      range: "1",
      backgroundColor: Highlight.Pause,
    });
  });

  it("loads the node graph grid-lines option", () => {
    const [control] = loadControls([
      { id: "graph", type: "nodeGraph", gridLines: true },
    ]);

    expect(control.rendererOptions?.gridLines).toBe(true);
  });
});
