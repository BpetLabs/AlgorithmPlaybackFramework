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
        childGap: 5,
        childWidth: 40,
        childHeight: 30,
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
    expect(controls[0].rendererOptions).toMatchObject({
      childGap: 5,
      childWidth: 40,
      childHeight: 30,
    });

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

  it("uses the root orientation as the alternating starting direction", () => {
    const [cube] = loadControls([
      { id: "cube", type: "jaggedArray", orientation: "vertical" },
      { id: "cube-0", type: "jaggedArray" },
      { id: "cube-0-0", type: "array" },
    ]);

    expect(cube.rendererOptions?.orientation).toBe("vertical");
    expect(cube.childControls?.[0]?.rendererOptions?.orientation).toBe(
      "horizontal"
    );
    expect(
      cube.childControls?.[0]?.childControls?.[0]?.rendererOptions?.orientation
    ).toBe("vertical");
  });

  it("rejects orientations on jagged-array descendants", () => {
    expect(() =>
      loadControls([
        { id: "matrix", type: "jaggedArray" },
        { id: "matrix-0", type: "array", orientation: "horizontal" },
      ])
    ).toThrow(
      'Control "matrix-0" cannot set orientation because jagged-array descendants alternate automatically.'
    );
  });

  it("rejects orientation in jagged child defaults", () => {
    expect(() =>
      loadControls([
        {
          id: "matrix",
          type: "jaggedArray",
          childDefaults: { orientation: "vertical" },
        } as never,
      ])
    ).toThrow(
      'Jagged array "matrix" childDefaults cannot set orientation because descendants alternate automatically.'
    );
  });

  it("rejects unsupported jagged-array orientations", () => {
    expect(() =>
      loadControls([
        {
          id: "matrix",
          type: "jaggedArray",
          orientation: "diagonal",
        } as never,
      ])
    ).toThrow(
      'Jagged array "matrix" orientation must be "horizontal" or "vertical".'
    );
  });

  it("allows the set family on jagged arrays", () => {
    const [control] = loadControls([
      {
        id: "matrix",
        type: "jaggedArray",
        initialItemCount: 1,
        batches: [
          {
            step: 1,
            setValues: [
              { index: 0, input: { backgroundColor: "Teal" } },
            ],
            setHeadValues: [
              { input: { textColor: "White" } },
            ],
            setTailValues: [
              { input: { borderColor: "Orange" } },
            ],
          },
        ],
      },
    ]);

    expect(control.snapshots.at(-1)?.items[0].backgroundColor).toBe("Teal");
    expect(control.snapshots.at(-1)?.items[0].textColor).toBe("White");
    expect(control.snapshots.at(-1)?.items[0].borderColor).toBe("Orange");
  });

  it("allows structural leaf-array mutations with now true", () => {
    const actions = [
      ["inserts", [{ index: 0, input: { value: "insert" }, now: true }]],
      ["headInserts", [{ input: { value: "head" }, now: true }]],
      ["tailInserts", [{ input: { value: "tail" }, now: true }]],
      ["updates", [{ index: 0, input: { value: "update" }, now: true }]],
      ["deletes", [{ index: 0, now: true }]],
      ["headDeletes", { count: 1, now: true }],
      ["tailDeletes", { count: 1, now: true }],
      ["takes", [{ index: 0, now: true }]],
      ["headTakes", { count: 1, now: true }],
      ["tailTakes", { count: 1, now: true }],
    ] as const;

    actions.forEach(([action, operation]) => {
      expect(() =>
        loadControls([
          {
            id: "matrix",
            type: "jaggedArray",
          },
          {
            id: "matrix-0",
            type: "array",
            initialItemCount: 1,
            batches: [
              { step: 1, [action]: operation },
            ],
          },
        ])
      ).not.toThrow();
    });
  });

  it("allows empty child-container inserts and removals", () => {
    expect(() =>
      loadControls([
        {
          id: "matrix",
          type: "jaggedArray",
          initialItemCount: 1,
          batches: [
            { step: 1, inserts: [{ index: 0, input: {}, now: true }] },
            { step: 2, deletes: [{ index: 0, now: true }] },
          ],
        },
      ])
    ).not.toThrow();
  });

  it("rejects value-bearing inserts on jagged-array parents", () => {
    expect(() =>
      loadControls([
        {
          id: "matrix",
          type: "jaggedArray",
          batches: [
            {
              step: 1,
              inserts: [
                { index: 0, input: { value: "14" }, now: true },
              ],
            },
          ],
        },
      ])
    ).toThrow(
      'Jagged array "matrix" cannot insert value-bearing items; only empty child containers may be inserted. Add values to a leaf array instead.'
    );
  });

  it("rejects direct values and structural updates on jagged parents", () => {
    expect(() =>
      loadControls([
        {
          id: "matrix",
          type: "jaggedArray",
          initialItemCount: 1,
          batches: [
            {
              step: 1,
              setValues: [{ index: 0, input: { value: "14" } }],
            },
          ],
        },
      ])
    ).toThrow(
      'Jagged array "matrix" cannot store values directly; add values to a leaf array instead.'
    );

    expect(() =>
      loadControls([
        {
          id: "matrix",
          type: "jaggedArray",
          initialItemCount: 1,
          batches: [
            {
              step: 1,
              updates: [
                { index: 0, input: {}, now: true },
              ],
            },
          ],
        },
      ])
    ).toThrow(
      'Jagged array "matrix" cannot update child containers; only empty child containers may be inserted or removed.'
    );
  });

  it("rejects removal of a non-empty child", () => {
    expect(() =>
      loadControls([
        {
          id: "matrix",
          type: "jaggedArray",
          batches: [
            { step: 1, deletes: [{ index: 0, now: true }] },
          ],
        },
        { id: "matrix-0", type: "array", initialItemCount: 1 },
      ])
    ).toThrow(
      'Jagged array "matrix" cannot remove non-empty child "matrix-0" at step 1; remove its leaf nodes first.'
    );
  });

  it("allows removal after the child leaf nodes are removed", () => {
    expect(() =>
      loadControls([
        {
          id: "matrix",
          type: "jaggedArray",
          batches: [
            { step: 2, deletes: [{ index: 0, now: true }] },
          ],
        },
        {
          id: "matrix-0",
          type: "array",
          initialItemCount: 1,
          batches: [
            { step: 1, deletes: [{ index: 0, now: true }] },
          ],
        },
      ])
    ).not.toThrow();
  });

  it("requires now true for structural jagged-array mutations", () => {
    expect(() =>
      loadControls([
        {
          id: "matrix",
          type: "jaggedArray",
          initialItemCount: 1,
          batches: [
            {
              step: 1,
              inserts: [{ index: 0, input: { value: "new row" } }],
            },
          ],
        },
      ])
    ).toThrow(
      'Control "matrix" in a jagged array requires now: true for batch action "inserts" at step 1.'
    );

    expect(() =>
      loadControls([
        {
          id: "matrix",
          type: "jaggedArray",
          initialItemCount: 1,
          batches: [
            {
              step: 1,
              inserts: [
                {
                  index: 0,
                  input: { value: "animated" },
                  animateNow: true,
                },
              ],
            },
          ],
        },
      ])
    ).toThrow('does not support animateNow for batch action "inserts"');

    expect(() =>
      loadControls([
        {
          id: "matrix",
          type: "jaggedArray",
          initialItemCount: 1,
          batches: [
            {
              step: 1,
              deletes: [{ index: 0, now: true, animateNow: true }],
            },
          ],
        },
      ])
    ).toThrow('does not support animateNow for batch action "deletes"');
  });

  it("applies immediate-only mutations to every jagged-array descendant", () => {
    expect(() =>
      loadControls([
        { id: "matrix", type: "jaggedArray" },
        { id: "matrix-0", type: "jaggedArray" },
        {
          id: "matrix-0-0",
          type: "array",
          initialItemCount: 1,
          batches: [
            {
              step: 1,
              deletes: [{ index: 0 }],
            },
          ],
        },
      ])
    ).toThrow(
      'Control "matrix-0-0" in a jagged array requires now: true for batch action "deletes" at step 1.'
    );

    expect(() =>
      loadControls([
        { id: "matrix", type: "jaggedArray" },
        { id: "matrix-0", type: "jaggedArray" },
        {
          id: "matrix-0-0",
          type: "array",
          initialItemCount: 1,
          batches: [
            {
              step: 1,
              deletes: [{ index: 0, now: true }],
            },
          ],
        },
      ])
    ).not.toThrow();
  });

  it("keeps animation support for arrays outside jagged-array trees", () => {
    expect(() =>
      loadControls([
        {
          id: "items",
          type: "array",
          initialItemCount: 1,
          batches: [
            {
              step: 1,
              deletes: [{ index: 0 }],
            },
            { step: 2 },
          ],
        },
      ])
    ).not.toThrow();
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
