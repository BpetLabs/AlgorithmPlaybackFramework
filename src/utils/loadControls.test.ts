import { describe, expect, it } from "vitest";
import { ControlItemState } from "../common/models/controlItem";
import { Highlight } from "../common/models/highlightLine";
import { loadControls } from "./loadControls";

describe("loadControls", () => {
  it("loads reverseDirection for arrays and stacks", () => {
    const controls = loadControls([
      { id: "array", type: "array", reverseDirection: true },
      { id: "stack", type: "stack", reverseDirection: true },
    ]);

    expect(controls[0].rendererOptions?.reverseDirection).toBe(true);
    expect(controls[0].rendererOptions?.orientation).toBe("horizontal");
    expect(controls[1].rendererOptions?.reverseDirection).toBe(true);
  });

  it("rejects invalid and unsupported reverseDirection values", () => {
    expect(() => loadControls([
      { id: "invalid", type: "stack", reverseDirection: "yes" as never },
    ])).toThrow("reverseDirection must be a boolean");
    expect(() => loadControls([
      { id: "grid", type: "grid", reverseDirection: true },
    ])).toThrow('cannot set reverseDirection for type "grid"');
  });

  it("attaches explicitly declared jagged children", () => {
    const controls = loadControls([
      {
        id: "matrix",
        type: "jaggedArray",
        children: ["matrix-0"],
      },
      {
        id: "matrix-0",
        type: "array",
      },
      { id: "matrix-label", type: "text" },
    ]);

    expect(controls.map((control) => control.id)).toEqual([
      "matrix",
      "matrix-label",
    ]);

    const parent = controls[0];
    expect(parent.snapshots[0].items).toHaveLength(1);
    expect(parent.childControls).toHaveLength(1);

    const child = parent.childControls?.[0];
    expect(child).toMatchObject({
      id: "matrix-0",
      type: "array",
      parentId: "matrix",
      parentIndex: 0,
    });
  });

  it("requires an explicit children array on every jagged array", () => {
    expect(() => loadControls([
      { id: "matrix", type: "jaggedArray" },
      { id: "matrix-0", type: "array" },
    ])).toThrow(
      'Jagged array "matrix" must declare an explicit children array.'
    );
  });

  it("loads recursively nested jagged arrays", () => {
    const controls = loadControls([
      {
        id: "cube",
        type: "jaggedArray",
        children: ["cube-0"],
      },
      {
        id: "cube-0",
        type: "jaggedArray",
        children: ["cube-0-0"],
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
    });
    expect(matrix?.snapshots[0].items).toHaveLength(1);
    expect(matrix?.childControls?.[0]).toMatchObject({
      id: "cube-0-0",
      type: "array",
      parentId: "cube-0",
      parentIndex: 0,
    });
  });

  it("allows the set family to change jagged parent appearance", () => {
    const [matrix] = loadControls([
      {
        id: "matrix",
        type: "jaggedArray",
        children: ["row"],
        batches: [
          {
            step: 1,
            setValues: [
              {
                index: 0,
                input: { borderColor: "Orange", borderWidth: 4 },
              },
            ],
          },
          {
            step: 2,
            setHeadValues: [{ input: { borderColor: "" } }],
          },
          {
            step: 3,
            setTailValues: [{ input: { borderColor: "Pink" } }],
          },
        ],
      },
      { id: "row", type: "array", initialItemCount: 0 },
    ]);

    expect(matrix.snapshots[1].items[0]).toMatchObject({
      borderColor: "Orange",
      borderWidth: 4,
      childId: "row",
    });
    expect(matrix.snapshots[2].items[0].borderColor).toBe("");
    expect(matrix.snapshots[3].items[0].borderColor).toBe("Pink");
  });

  it("inserts and recursively removes an ID-referenced child subtree", () => {
    const [matrix] = loadControls([
      {
        id: "matrix",
        type: "jaggedArray",
        children: ["row-a"],
        batches: [
          {
            step: 1,
            inserts: [{ index: 1, childId: "group-b", now: true }],
          },
          { step: 2, deletes: [{ index: 1, now: true }] },
        ],
      },
      { id: "row-a", type: "array", initialItemCount: 0 },
      {
        id: "group-b",
        type: "jaggedArray",
        children: ["row-b"],
      },
      { id: "row-b", type: "array", initialItemCount: 0 },
    ]);

    expect(matrix.snapshots.find((snapshot) => snapshot.step === 1)?.items)
      .toEqual(expect.arrayContaining([expect.objectContaining({ childId: "group-b" })]));
    expect(matrix.snapshots.at(-1)?.items).toHaveLength(1);
  });

  it("rejects parent inserts without a complete referenced subtree", () => {
    expect(() =>
      loadControls([
        {
          id: "matrix",
          type: "jaggedArray",
          children: ["row"],
          batches: [
            {
              step: 1,
              inserts: [{ index: 1, childId: "incomplete", now: true }],
            },
          ],
        },
        { id: "row", type: "array", initialItemCount: 0 },
        { id: "incomplete", type: "jaggedArray", children: [] },
      ])
    ).toThrow(
      'Jagged child "incomplete" must declare a complete subtree ending in at least one leaf array.'
    );

    expect(() =>
      loadControls([
        {
          id: "matrix",
          type: "jaggedArray",
          children: ["row"],
          batches: [
            { step: 1, inserts: [{ index: 1, now: true }] },
          ],
        },
        { id: "row", type: "array", initialItemCount: 0 },
      ])
    ).toThrow(
      'Jagged array "matrix" requires childId for every child insertion.'
    );
  });

  it("rejects direct values and structural updates on jagged parents", () => {
    expect(() =>
      loadControls([
        {
          id: "matrix",
          type: "jaggedArray",
          children: ["matrix-0"],
          initialItemCount: 1,
          batches: [
            {
              step: 1,
              setValues: [{ index: 0, input: { value: "14" } }],
            },
          ],
        },
        { id: "matrix-0", type: "array", initialItemCount: 0 },
      ])
    ).toThrow(
      'Jagged array "matrix" set actions support parent-slot appearance properties only; "value" is not allowed.'
    );

    expect(() =>
      loadControls([
        {
          id: "matrix",
          type: "jaggedArray",
          children: ["row"],
          batches: [
            {
              step: 1,
              setValues: [{ index: 0, input: { childId: "other-row" } }],
            },
          ],
        },
        { id: "row", type: "array", initialItemCount: 0 },
      ])
    ).toThrow(
      'Jagged array "matrix" set actions support parent-slot appearance properties only; "childId" is not allowed.'
    );

    expect(() =>
      loadControls([
        {
          id: "matrix",
          type: "jaggedArray",
          children: ["matrix-0"],
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
        { id: "matrix-0", type: "array", initialItemCount: 0 },
      ])
    ).toThrow(
      'Jagged array "matrix" cannot update child references; delete and insert the complete subtree instead.'
    );
  });

  it("requires now true for structural jagged-array mutations", () => {
    expect(() =>
      loadControls([
        {
          id: "matrix",
          type: "jaggedArray",
          children: ["matrix-0"],
        },
        {
          id: "matrix-0",
          type: "array",
          batches: [
            {
              step: 1,
              inserts: [{ index: 0, input: { value: "new item" } }],
            },
          ],
        },
      ])
    ).toThrow(
      'Control "matrix-0" in a jagged array requires now: true for batch action "inserts" at step 1.'
    );

    expect(() =>
      loadControls([
        {
          id: "matrix",
          type: "jaggedArray",
          children: ["matrix-0"],
        },
        {
          id: "matrix-0",
          type: "array",
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
          children: ["matrix-0"],
          initialItemCount: 1,
          batches: [
            {
              step: 1,
              deletes: [{ index: 0, now: true, animateNow: true }],
            },
          ],
        },
        { id: "matrix-0", type: "array", initialItemCount: 0 },
      ])
    ).toThrow('does not support animateNow for batch action "deletes"');
  });

  it("applies immediate-only mutations to every jagged-array descendant", () => {
    expect(() =>
      loadControls([
        { id: "matrix", type: "jaggedArray", children: ["matrix-0"] },
        {
          id: "matrix-0",
          type: "jaggedArray",
          children: ["matrix-0-0"],
        },
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
        { id: "matrix", type: "jaggedArray", children: ["matrix-0"] },
        {
          id: "matrix-0",
          type: "jaggedArray",
          children: ["matrix-0-0"],
        },
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

  it("uses defaultCollapse for removals and allows operation overrides", () => {
    const [collapsing, preserved] = loadControls([
      {
        id: "collapsing",
        type: "array",
        defaultCollapse: true,
        initialItemCount: 1,
        batches: [
          { step: 1, deletes: [{ index: 0 }] },
          { step: 2 },
          { step: 3 },
        ],
      },
      {
        id: "preserved",
        type: "array",
        defaultCollapse: true,
        initialItemCount: 1,
        batches: [
          { step: 1, deletes: [{ index: 0, collapse: false }] },
          { step: 2 },
          { step: 3 },
        ],
      },
    ]);

    expect(collapsing.snapshots[3].items).toEqual([]);
    expect(preserved.snapshots[3].items[0]).toMatchObject({
      state: ControlItemState.Empty,
      collapse: false,
    });
  });

  it("resolves array and stack collapse defaults before batch processing", () => {
    const controls = loadControls([
      {
        id: "array",
        type: "array",
        initialItemCount: 1,
        batches: [
          { step: 1, deletes: [{ index: 0 }] },
          { step: 2 },
          { step: 3 },
        ],
      },
      {
        id: "stack",
        type: "stack",
        initialItemCount: 1,
        batches: [
          { step: 1, tailTakes: { count: 1 } },
          { step: 2 },
          { step: 3 },
        ],
      },
    ]);

    expect(controls[0].snapshots[3].items[0]).toMatchObject({
      state: ControlItemState.Empty,
      collapse: false,
    });
    expect(controls[1].snapshots[3].items).toEqual([]);
  });

  it("configures defaultCollapse before snapshots are built", () => {
    const definitions = [{
      id: "items",
      type: "array",
      initialItemCount: 1,
      batches: [
        { step: 1, deletes: [{ index: 0 }] },
        { step: 2 },
        { step: 3 },
      ],
    }];
    const [control] = loadControls(definitions, {
      configureControl: (definition) => {
        definition.defaultCollapse = true;
      },
    });

    expect(control.snapshots[3].items).toEqual([]);
    expect(definitions[0]).not.toHaveProperty("defaultCollapse");
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

});
