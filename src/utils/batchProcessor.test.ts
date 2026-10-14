import { describe, expect, it } from "vitest";
import type { Batch } from "../common/models/batch";
import { ControlItemState } from "../common/models/controlItem";
import { BatchProcessor } from "./batchProcessor";

describe("BatchProcessor", () => {
  it.each([-1, 1.5])("rejects invalid initial item count %s", (count) => {
    expect(() => new BatchProcessor("items", "array", count)).toThrow(
      "initialItemCount must be a non-negative integer"
    );
  });

  it("generates deterministic item ids per processor", () => {
    const firstIds = new BatchProcessor("first", "array", 2)
      .getHistory()[0]
      .items.map((item) => item.id);
    const secondIds = new BatchProcessor("second", "array", 2)
      .getHistory()[0]
      .items.map((item) => item.id);

    expect(firstIds).toEqual(secondIds);
    expect(firstIds).toHaveLength(2);
    expect(new Set(firstIds).size).toBe(firstIds.length);
  });

  it("preserves insert transition state across snapshots", () => {
    const processor = new BatchProcessor("items", "array");

    processor.applyBatch({
      step: 1,
      inserts: [{ input: { value: "A" } }],
    });
    processor.applyBatch({ step: 2 });

    const history = processor.getHistory();
    expect(history[1].items[0].state).toBe(ControlItemState.PreInsert);
    expect(history[2].items[0]).toMatchObject({
      state: ControlItemState.Inserted,
      previousState: ControlItemState.PreInsert,
    });
  });

  it("applies insert timing without storing operation metadata on the item", () => {
    const processor = new BatchProcessor("items", "stack");

    processor.applyBatch({
      step: 1,
      tailInserts: [{ input: { value: "A" }, animateNow: true }],
    });

    const item = processor.getHistory()[1].items[0];
    expect(item).toMatchObject({
      state: ControlItemState.Inserted,
      previousState: ControlItemState.PreTail,
    });
    expect(item).not.toHaveProperty("animateNow");
  });

  it("targets current, outgoing, or all linked items with setValues", () => {
    const processor = new BatchProcessor("items", "array", 1);

    processor.applyBatch({
      step: 1,
      setValues: [
        {
          index: 0,
          input: {
            value: "old",
            backgroundColor: "Teal",
            borderColor: "Orange",
          },
        },
      ],
      updates: [
        {
          index: 0,
          input: {
            value: "new",
            backgroundColor: "Teal",
          },
        },
      ],
    });

    processor.applyBatch({
      step: 2,
      setValues: [
        {
          index: 0,
          target: "outgoing",
          input: { borderColor: "" },
        },
        {
          index: 0,
          input: { rightAlignedValue: "current" },
        },
        {
          index: 0,
          target: "all",
          input: { leftAlignedValue: "all" },
        },
      ],
    });

    const items = processor.getHistory()[2].items;
    const outgoing = items.find(
      (item) => item.state === ControlItemState.RemovingUpdate
    );
    const current = items.find(
      (item) => item.state === ControlItemState.Inserted
    );

    expect(outgoing).toMatchObject({
      value: "old",
      borderColor: "",
      leftAlignedValue: "all",
    });
    expect(outgoing?.rightAlignedValue).toBeUndefined();
    expect(current).toMatchObject({
      value: "new",
      rightAlignedValue: "current",
      leftAlignedValue: "all",
    });
  });

  it("rejects an outgoing setValues target without a linked outgoing item", () => {
    const processor = new BatchProcessor("items", "array", 1);

    expect(() =>
      processor.applyBatch({
        step: 1,
        setValues: [
          {
            index: 0,
            target: "outgoing",
            input: { borderColor: "" },
          },
        ],
      })
    ).toThrow("No outgoing item at setValues index 0");
  });

  it("targets a sole unlinked outgoing item with indexed addressing", () => {
    const processor = new BatchProcessor("items", "array", 2);

    processor.applyBatch({
      step: 1,
      setValues: [
        { index: 0, input: { value: "current" } },
        { index: 1, input: { value: "outgoing", borderColor: "Orange" } },
      ],
      deletes: [{ index: 1 }],
    });

    processor.applyBatch({
      step: 2,
      setValues: [
        { index: 0, input: { borderColor: "Orange" } },
        { index: 0, target: "outgoing", input: { borderColor: "" } },
      ],
    });

    const items = processor.getHistory()[2].items;
    expect(items.find((item) => item.value === "current")?.borderColor).toBe(
      "Orange"
    );
    expect(items.find((item) => item.value === "outgoing")).toMatchObject({
      state: ControlItemState.RemovingInsert,
      borderColor: "",
    });
  });

  it.each(["head", "tail"] as const)(
    "targets a sole unlinked outgoing item with %s addressing",
    (addressing) => {
      const processor = new BatchProcessor("items", "stack", 2);

      processor.applyBatch({
        step: 1,
        setValues: [
          { index: 0, input: { value: "outgoing", borderColor: "Orange" } },
          { index: 1, input: { value: "current" } },
        ],
        headDeletes: { count: 1 },
      });
      processor.applyBatch(
        addressing === "head"
          ? {
              step: 2,
              setHeadValues: [
                { target: "outgoing", input: { borderColor: "" } },
              ],
            }
          : {
              step: 2,
              setTailValues: [
                { target: "outgoing", input: { borderColor: "" } },
              ],
            }
      );

      expect(
        processor
          .getHistory()[2]
          .items.find((item) => item.value === "outgoing")
      ).toMatchObject({
        state: ControlItemState.RemovingHead,
        borderColor: "",
      });
    }
  );

  it("targets the sole outgoing item when no current item remains", () => {
    const processor = new BatchProcessor("items", "array", 1);

    processor.applyBatch({
      step: 1,
      setValues: [{ index: 0, input: { borderColor: "Orange" } }],
      deletes: [{ index: 0 }],
    });
    processor.applyBatch({
      step: 2,
      setValues: [
        { index: 0, target: "outgoing", input: { borderColor: "" } },
      ],
    });

    expect(processor.getHistory()[2].items).toEqual([
      expect.objectContaining({
        state: ControlItemState.RemovingInsert,
        borderColor: "",
      }),
    ]);
  });

  it("targets linked outgoing items with setHeadValues and setTailValues", () => {
    const processor = new BatchProcessor("items", "array", 2);

    processor.applyBatch({
      step: 1,
      setValues: [
        {
          index: 0,
          input: { value: "head-old", borderColor: "Orange" },
        },
        {
          index: 1,
          input: { value: "tail-old", borderColor: "Pink" },
        },
      ],
      updates: [
        { index: 0, input: { value: "head-new" } },
        { index: 1, input: { value: "tail-new" } },
      ],
    });

    processor.applyBatch({
      step: 2,
      setHeadValues: [
        {
          target: "outgoing",
          input: { borderColor: "" },
        },
      ],
      setTailValues: [
        {
          target: "outgoing",
          input: { borderColor: "" },
        },
      ],
    });

    const outgoingItems = processor
      .getHistory()[2]
      .items.filter((item) => item.state === ControlItemState.RemovingUpdate);

    expect(outgoingItems).toHaveLength(2);
    expect(outgoingItems.map((item) => item.value)).toEqual([
      "head-old",
      "tail-old",
    ]);
    expect(outgoingItems.every((item) => item.borderColor === "")).toBe(true);
  });

  it("rejects setTailValues entries beyond the visible item count", () => {
    const processor = new BatchProcessor("items", "array", 1);

    expect(() =>
      processor.applyBatch({
        step: 1,
        setTailValues: [
          { input: { value: "A" } },
          { input: { value: "B" } },
        ],
      })
    ).toThrow("Invalid setTailValues index 1");
  });

  it("rejects descending and non-integer steps", () => {
    const processor = new BatchProcessor("items", "array");
    processor.applyBatch({ step: 2 });

    expect(() => processor.applyBatch({ step: 1 })).toThrow(
      "batch step 1 cannot follow step 2"
    );
    expect(() => processor.applyBatch({ step: 2.5 })).toThrow(
      "invalid batch step 2.5"
    );
  });

  it("rejects duplicate steps for a control", () => {
    const processor = new BatchProcessor("items", "array");
    processor.applyBatch({ step: 1 });

    expect(() => processor.applyBatch({ step: 1 })).toThrow(
      'Control "items" has duplicate batch step 1.'
    );
  });

  it("preserves graph order when updating an existing node", () => {
    const processor = new BatchProcessor("graph", "nodeGraph");
    processor.applyBatch({
      step: 1,
      graphNodes: [
        { id: "a", row: 0, column: 0, value: "A" },
        { id: "b", row: 0, column: 1, value: "B" },
      ],
    });
    processor.applyBatch({
      step: 2,
      graphNodes: [{ id: "a", row: 0, column: 0, value: "Updated" }],
    });

    expect(processor.getHistory()[2].graphNodes?.map((node) => node.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("returns graph snapshots that cannot mutate processor history", () => {
    const processor = new BatchProcessor("graph", "nodeGraph");
    processor.applyBatch({
      step: 1,
      graphNodes: [{ id: "a", row: 0, column: 0, value: "Original" }],
    });

    const firstRead = processor.getHistory();
    firstRead[1].graphNodes![0].value = "Mutated";

    expect(processor.getHistory()[1].graphNodes![0].value).toBe("Original");
  });

  it("patches and selectively clears line highlight properties", () => {
    const processor = new BatchProcessor("code", "staticText");
    processor.applyBatch({
      step: 1,
      highlightLines: [
        { range: "1-3", backgroundColor: "red", borderColor: "blue" },
      ],
      scrollBottom: 3,
    });
    processor.applyBatch({
      step: 2,
      clearHighlights: [{ range: "2", backgroundColor: true }],
      highlightLines: [{ range: "3", borderColor: "" }],
    });

    expect(
      processor.getHistory()[2].highlightLines?.map(({ range, backgroundColor, borderColor }) => ({
        range,
        backgroundColor,
        borderColor,
      }))
    ).toEqual([
      { range: "1", backgroundColor: "red", borderColor: "blue" },
      { range: "2", backgroundColor: undefined, borderColor: "blue" },
      { range: "3", backgroundColor: "red", borderColor: undefined },
    ]);
    expect(processor.getHistory()[2].scrollBottom).toBe(3);
  });

  it("persists coordinate-addressed grid items as partial updates", () => {
    const processor = new BatchProcessor("grid", "grid");
    processor.applyBatch({
      step: 1,
      gridItems: [
        {
          row: 0,
          col: 0,
          value: "A",
          backgroundColor: "Gray",
          borderColor: "Orange",
        },
      ],
    });

    processor.applyBatch({
      step: 2,
      gridItems: [
        { row: 0, col: 0, borderColor: "" },
        { row: 0, col: 1, value: "B" },
      ],
    });
    processor.applyBatch({ step: 3 });

    expect(processor.getHistory()[3].gridItems).toEqual([
      {
        row: 0,
        col: 0,
        value: "A",
        backgroundColor: "Gray",
        borderColor: "",
      },
      { row: 0, col: 1, value: "B" },
    ]);
  });

  it("rejects duplicate grid coordinates in one batch", () => {
    const processor = new BatchProcessor("grid", "grid");

    expect(() => processor.applyBatch({
      step: 1,
      gridItems: [
        { row: 0, col: 0, value: "A" },
        { row: 0, col: 0, borderColor: "Orange" },
      ],
    })).toThrow("Duplicate grid coordinate row 0, col 0");
  });

  const unsupportedGridActions = {
    inserts: [],
    headInserts: [],
    tailInserts: [],
    updates: [],
    deletes: [],
    headDeletes: { count: 1 },
    tailDeletes: { count: 1 },
    headTakes: { count: 1 },
    tailTakes: { count: 1 },
    takes: [],
    setHeadValues: [],
    setTailValues: [],
    setValues: [],
    highlightLines: [],
    clearHighlights: [],
    scrollBottom: 1,
    graphNodes: [],
    graphEdges: [],
    graphNodeDeletes: [],
    graphEdgeDeletes: [],
  } satisfies Record<Exclude<keyof Batch, "step" | "gridItems">, unknown>;

  it.each(Object.entries(unsupportedGridActions))(
    "rejects %s batches for grid controls",
    (action, value) => {
      const processor = new BatchProcessor("grid", "grid");
      const batch = { step: 1, [action]: value } as Batch;

      expect(() => processor.applyBatch(batch)).toThrow(
        `Grid control "grid" does not support batch action "${action}"; use gridItems.`
      );
    }
  );

  it("rejects unknown batch actions for grid controls", () => {
    const processor = new BatchProcessor("grid", "grid");

    expect(() => processor.applyBatch({ step: 1, unknownAction: [] } as unknown as Batch)).toThrow(
      'Grid control "grid" does not support batch action "unknownAction"; use gridItems.'
    );
  });

  it("allows gridItems and grid batch metadata", () => {
    const processor = new BatchProcessor("grid", "grid");

    expect(() => processor.applyBatch({
      step: 1,
      gridItems: [{ row: 0, col: 0, value: "A" }],
      render: { visible: true },
    } as Batch & { render: { visible: boolean } })).not.toThrow();
    expect(processor.getHistory()[1].gridItems).toEqual([
      { row: 0, col: 0, value: "A" },
    ]);
  });

  it("advances animated graph deletion and removes orphaned edges", () => {
    const processor = new BatchProcessor("graph", "nodeGraph");
    processor.applyBatch({
      step: 1,
      graphNodes: [
        { id: "a", row: 0, column: 0 },
        { id: "b", row: 0, column: 1 },
      ],
      graphEdges: [{ id: "a-b", from: "a", to: "b" }],
    });
    processor.applyBatch({ step: 2, graphNodeDeletes: [{ id: "a" }] });
    expect(processor.getHistory()[2].graphNodes?.find((node) => node.id === "a")?.state).toBe(
      ControlItemState.PreRemoveInPlace
    );

    processor.applyBatch({ step: 3 });
    expect(processor.getHistory()[3].graphNodes?.find((node) => node.id === "a")?.state).toBe(
      ControlItemState.RemovingInPlace
    );

    processor.applyBatch({ step: 4 });
    expect(processor.getHistory()[4].graphNodes?.map((node) => node.id)).toEqual(["b"]);
    expect(processor.getHistory()[4].graphEdges).toEqual([]);
  });

  it("supports immediate and animate-now graph deletion", () => {
    const immediate = new BatchProcessor("immediate", "nodeGraph");
    immediate.applyBatch({ step: 1, graphNodes: [{ id: "a", row: 0, column: 0 }] });
    immediate.applyBatch({ step: 2, graphNodeDeletes: [{ id: "a", now: true }] });
    expect(immediate.getHistory()[2].graphNodes).toEqual([]);

    const animated = new BatchProcessor("animated", "nodeGraph");
    animated.applyBatch({ step: 1, graphNodes: [{ id: "a", row: 0, column: 0 }] });
    animated.applyBatch({ step: 2, graphNodeDeletes: [{ id: "a", animateNow: true }] });
    expect(animated.getHistory()[2].graphNodes?.[0]).toMatchObject({
      state: ControlItemState.RemovingInPlace,
      previousState: ControlItemState.PreRemoveInPlace,
    });
  });

  it("applies head, indexed, and immediate tail insert timing in operation order", () => {
    const processor = new BatchProcessor("items", "array");
    processor.applyBatch({
      step: 1,
      headInserts: [{ input: { value: "head", itemOffset: 30 } }],
      tailInserts: [{ input: { value: "tail", itemOffset: 70 }, now: true }],
      inserts: [{ index: 1, input: { value: "middle" }, animateNow: true }],
    });

    expect(processor.getHistory()[1].items.map(({ value, state, previousState, itemOffset }) => ({
      value,
      state,
      previousState,
      itemOffset,
    }))).toEqual([
      { value: "head", state: ControlItemState.PreHead, previousState: undefined, itemOffset: 30 },
      { value: "middle", state: ControlItemState.Inserted, previousState: ControlItemState.PreInsert, itemOffset: undefined },
      { value: "tail", state: ControlItemState.Initial, previousState: undefined, itemOffset: 70 },
    ]);
  });

  it("replaces updates immediately or stages both sides with animateNow", () => {
    const immediate = new BatchProcessor("immediate", "array", 1, { value: "old" });
    immediate.applyBatch({
      step: 1,
      updates: [{ index: 0, input: { value: "new" }, now: true }],
    });
    expect(immediate.getHistory()[1].items).toEqual([
      expect.objectContaining({ value: "new", state: ControlItemState.Initial }),
    ]);

    const animated = new BatchProcessor("animated", "array", 1, { value: "old" });
    animated.applyBatch({
      step: 1,
      updates: [{ index: 0, input: { value: "new" }, animateNow: true }],
    });
    expect(animated.getHistory()[1].items.map(({ value, state, previousState }) => ({
      value,
      state,
      previousState,
    }))).toEqual([
      { value: "old", state: ControlItemState.RemovingUpdate, previousState: ControlItemState.PreRemoveUpdate },
      { value: "new", state: ControlItemState.Inserted, previousState: ControlItemState.PreUpdate },
    ]);
  });

  it("removes now operations immediately and preserves non-collapsing slots as empty", () => {
    const immediate = new BatchProcessor("immediate", "array", 2);
    immediate.applyBatch({ step: 1, deletes: [{ index: 0, now: true }] });
    expect(immediate.getHistory()[1].items).toHaveLength(1);

    const persistent = new BatchProcessor("persistent", "array", 1);
    persistent.applyBatch({ step: 1, deletes: [{ index: 0, collapse: false }] });
    persistent.applyBatch({ step: 2 });
    persistent.applyBatch({ step: 3 });
    expect(persistent.getHistory()[3].items[0].state).toBe(ControlItemState.Empty);
  });

  it("advances a collapsing delete through each removal state", () => {
    const processor = new BatchProcessor("items", "array", 1, { value: "old" });

    processor.applyBatch({ step: 1, deletes: [{ index: 0 }] });
    processor.applyBatch({ step: 2 });
    processor.applyBatch({ step: 3 });

    const history = processor.getHistory();
    expect(history[1].items[0]).toMatchObject({
      value: "old",
      state: ControlItemState.PreRemoveInsert,
      collapse: undefined,
    });
    expect(history[2].items[0]).toMatchObject({
      state: ControlItemState.RemovingInsert,
      previousState: ControlItemState.PreRemoveInsert,
    });
    expect(history[3].items).toEqual([]);
  });

  it("keeps a non-collapsing deletion indexable and reactivates it with setValues", () => {
    const processor = new BatchProcessor("items", "array", 1, { value: "old" });
    const originalId = processor.getHistory()[0].items[0].id;
    processor.applyBatch({ step: 1, deletes: [{ index: 0, collapse: false }] });
    processor.applyBatch({ step: 2 });
    processor.applyBatch({ step: 3 });

    expect(processor.getHistory()[3].items[0]).toMatchObject({
      id: originalId,
      state: ControlItemState.Empty,
      collapse: false,
    });

    processor.applyBatch({
      step: 4,
      setValues: [{ index: 0, input: { value: "reused" } }],
    });

    expect(processor.getHistory()[4].items).toEqual([
      expect.objectContaining({
        id: originalId,
        state: ControlItemState.Initial,
        value: "reused",
      }),
    ]);
  });

  it("replaces a non-collapsing empty slot with an indexed insert", () => {
    const processor = new BatchProcessor("items", "array", 1, { value: "old" });
    const originalId = processor.getHistory()[0].items[0].id;
    processor.applyBatch({ step: 1, deletes: [{ index: 0, collapse: false }] });
    processor.applyBatch({ step: 2 });
    processor.applyBatch({ step: 3 });
    processor.applyBatch({
      step: 4,
      inserts: [{ index: 0, input: { value: "new" }, now: true }],
    });

    expect(processor.getHistory()[4].items).toEqual([
      expect.objectContaining({
        state: ControlItemState.Initial,
        value: "new",
      }),
    ]);
    expect(processor.getHistory()[4].items[0].id).not.toBe(originalId);
  });

  it("removes an empty slot explicitly marked to collapse", () => {
    const processor = new BatchProcessor("items", "array", 1, {
      state: ControlItemState.Empty,
      collapse: true,
    });

    processor.applyBatch({ step: 1 });

    expect(processor.getHistory()[1].items).toEqual([]);
  });

  it("skips a collapsing removal for indexed operations in the next batch", () => {
    const processor = new BatchProcessor("items", "array", 2);
    processor.applyBatch({
      step: 1,
      setValues: [
        { index: 0, input: { value: "first" } },
        { index: 1, input: { value: "second" } },
      ],
      deletes: [{ index: 0 }],
    });
    processor.applyBatch({
      step: 2,
      setValues: [{ index: 0, input: { value: "updated" } }],
    });

    expect(processor.getHistory()[2].items).toEqual([
      expect.objectContaining({
        value: "first",
        state: ControlItemState.RemovingInsert,
      }),
      expect.objectContaining({ value: "updated", state: ControlItemState.Initial }),
    ]);
  });

  it("keeps a non-collapsing removal addressable in the next batch", () => {
    const processor = new BatchProcessor("items", "array", 2);
    processor.applyBatch({
      step: 1,
      setValues: [
        { index: 0, input: { value: "first" } },
        { index: 1, input: { value: "second" } },
      ],
      deletes: [{ index: 0, collapse: false }],
    });
    processor.applyBatch({
      step: 2,
      setValues: [{ index: 0, input: { value: "still-first" } }],
    });

    expect(processor.getHistory()[2].items).toEqual([
      expect.objectContaining({
        value: "still-first",
        state: ControlItemState.RemovingInsert,
        collapse: false,
      }),
      expect.objectContaining({ value: "second", state: ControlItemState.Initial }),
    ]);
  });

  it("links a same-batch replacement to an explicitly deleted slot", () => {
    const processor = new BatchProcessor("items", "array", 1, { value: "old" });

    processor.applyBatch({
      step: 1,
      deletes: [{ index: 0 }],
      updates: [{ index: 0, input: { value: "new" } }],
    });

    const [outgoing, incoming] = processor.getHistory()[1].items;
    expect(outgoing).toMatchObject({
      value: "old",
      state: ControlItemState.PreRemoveInsert,
    });
    expect(incoming).toMatchObject({
      value: "new",
      state: ControlItemState.PreUpdate,
      linkId: outgoing.linkId,
    });
  });

  it.each([
    {
      name: "indexed delete",
      batch: { deletes: [{ index: 0, animateNow: true }] },
      state: ControlItemState.RemovingInsert,
      previousState: ControlItemState.PreRemoveInsert,
    },
    {
      name: "head delete",
      batch: { headDeletes: { count: 1, animateNow: true } },
      state: ControlItemState.RemovingHead,
      previousState: ControlItemState.PreRemoveHead,
    },
    {
      name: "tail delete",
      batch: { tailDeletes: { count: 1, animateNow: true } },
      state: ControlItemState.RemovingTail,
      previousState: ControlItemState.PreRemoveTail,
    },
    {
      name: "indexed take",
      batch: { takes: [{ index: 0, animateNow: true }] },
      state: ControlItemState.RemovingTake,
      previousState: ControlItemState.PreRemoveTake,
    },
    {
      name: "head take",
      batch: { headTakes: { count: 1, animateNow: true } },
      state: ControlItemState.RemovingTake,
      previousState: ControlItemState.PreRemoveTake,
    },
    {
      name: "tail take",
      batch: { tailTakes: { count: 1, animateNow: true } },
      state: ControlItemState.RemovingTake,
      previousState: ControlItemState.PreRemoveTake,
    },
  ] satisfies Array<{
    name: string;
    batch: Batch;
    state: ControlItemState;
    previousState: ControlItemState;
  }>)("applies animateNow timing for $name", ({ batch, state, previousState }) => {
    const processor = new BatchProcessor("items", "array", 1);

    processor.applyBatch({ step: 1, ...batch });

    expect(processor.getHistory()[1].items[0]).toMatchObject({
      state,
      previousState,
    });
  });

  it.each([
    ["head", { headDeletes: { count: 2, collapse: false } }, [
      ControlItemState.Empty,
      ControlItemState.Empty,
      ControlItemState.Initial,
    ]],
    ["tail", { tailDeletes: { count: 2, collapse: false } }, [
      ControlItemState.Initial,
      ControlItemState.Empty,
      ControlItemState.Empty,
    ]],
  ] satisfies Array<[string, Batch, ControlItemState[]]>) (
    "preserves slots for a non-collapsing %s removal",
    (_name, removal, expectedStates) => {
      const processor = new BatchProcessor("items", "array", 3);
      processor.applyBatch({ step: 1, ...removal });
      processor.applyBatch({ step: 2 });
      processor.applyBatch({ step: 3 });

      expect(processor.getHistory()[3].items.map(({ state }) => state)).toEqual(
        expectedStates
      );
    }
  );

  it("treats a zero-count end removal as a no-op", () => {
    const processor = new BatchProcessor("items", "array", 1);
    const original = processor.getHistory()[0].items[0];

    processor.applyBatch({
      step: 1,
      headDeletes: { count: 0 },
      tailTakes: { count: 0 },
    });

    expect(processor.getHistory()[1].items).toEqual([
      expect.objectContaining({ id: original.id, state: ControlItemState.Initial }),
    ]);
  });

  it("creates empty slots for sparse indexed values and initializes the target", () => {
    const processor = new BatchProcessor("items", "array");

    processor.applyBatch({
      step: 1,
      setValues: [{ index: 2, input: { value: "third" } }],
    });

    expect(processor.getHistory()[1].items.map(({ state, value }) => ({ state, value }))).toEqual([
      { state: ControlItemState.Empty, value: undefined },
      { state: ControlItemState.Empty, value: undefined },
      { state: ControlItemState.Initial, value: "third" },
    ]);
  });

  it("ignores a superseded linked empty slot during indexed addressing", () => {
    const processor = new BatchProcessor("items", "array", 1, { value: "old" });
    processor.applyBatch({ step: 1, deletes: [{ index: 0, collapse: false }] });
    processor.applyBatch({ step: 2 });
    processor.applyBatch({ step: 3 });
    processor.applyBatch({
      step: 4,
      updates: [{ index: 0, input: { value: "replacement" }, now: true }],
    });
    processor.applyBatch({
      step: 5,
      setValues: [{ index: 0, input: { value: "updated replacement" } }],
    });

    expect(processor.getHistory()[5].items.map(({ state, value }) => ({ state, value }))).toEqual([
      { state: ControlItemState.Empty, value: "old" },
      { state: ControlItemState.Initial, value: "updated replacement" },
    ]);
  });

  it.each([
    ["fractional update", { updates: [{ index: 0.5, input: { value: "bad" } }] }],
    ["negative update", { updates: [{ index: -1, input: { value: "bad" } }] }],
    ["fractional insert", { inserts: [{ index: 0.5, input: { value: "bad" } }] }],
    ["negative insert", { inserts: [{ index: -1, input: { value: "bad" } }] }],
  ] satisfies Array<[string, Batch]>) (
    "rejects a %s index before creating sparse slots",
    (_name, batch) => {
      const processor = new BatchProcessor("items", "array");

      expect(() => processor.applyBatch({ step: 1, ...batch })).toThrow("Invalid index");
    }
  );

  it("rejects an indexed removal beyond the visible slots", () => {
    const processor = new BatchProcessor("items", "array", 1);

    expect(() => processor.applyBatch({ step: 1, deletes: [{ index: 2 }] })).toThrow(
      "Invalid deletes index 2"
    );
  });

  it("ignores empty highlight patches and removes colors cleared to empty strings", () => {
    const processor = new BatchProcessor("code", "staticText");
    processor.applyBatch({
      step: 1,
      highlightLines: [
        { range: "1", backgroundColor: "red", borderColor: "blue" },
        { range: "2", backgroundColor: "", borderColor: "" },
      ],
    });
    processor.applyBatch({
      step: 2,
      highlightLines: [{ range: "1", backgroundColor: "", borderColor: "" }],
    });

    expect(processor.getHistory()[1].highlightLines).toEqual([
      expect.objectContaining({
        range: "1",
        backgroundColor: "red",
        borderColor: "blue",
      }),
    ]);
    expect(processor.getHistory()[2].highlightLines).toEqual([]);
  });

  it("clears both highlight colors when no color selector is supplied", () => {
    const processor = new BatchProcessor("code", "staticText");
    processor.applyBatch({
      step: 1,
      highlightLines: [{ range: "1-2", backgroundColor: "red", borderColor: "blue" }],
    });
    processor.applyBatch({
      step: 2,
      clearHighlights: [{ range: "2" }],
    });

    expect(processor.getHistory()[2].highlightLines).toEqual([
      expect.objectContaining({
        range: "1",
        backgroundColor: "red",
        borderColor: "blue",
      }),
    ]);
  });

  it("does not restart a graph-node removal when deletion is requested again", () => {
    const processor = new BatchProcessor("graph", "nodeGraph");
    processor.applyBatch({
      step: 1,
      graphNodes: [{ id: "a", row: 0, column: 0 }],
    });
    processor.applyBatch({ step: 2, graphNodeDeletes: [{ id: "a" }] });
    processor.applyBatch({ step: 3, graphNodeDeletes: [{ id: "a" }] });

    expect(processor.getHistory()[3].graphNodes).toEqual([
      expect.objectContaining({
        id: "a",
        state: ControlItemState.RemovingInPlace,
        previousState: ControlItemState.PreRemoveInPlace,
      }),
    ]);
  });

  it("ignores an undefined batch without adding history", () => {
    const processor = new BatchProcessor("items", "array");

    (processor as unknown as { applyBatch(batch: undefined): void }).applyBatch(undefined);

    expect(processor.getHistory()).toHaveLength(1);
  });

  it("increments an omitted batch step from the previous snapshot", () => {
    const processor = new BatchProcessor("items", "array");

    processor.applyBatch({});
    processor.applyBatch({});

    expect(processor.getHistory().map(({ step }) => step)).toEqual([0, 1, 2]);
  });

  it("rejects invalid indexed and end-removal inputs", () => {
    const processor = new BatchProcessor("items", "array", 1);
    expect(() => processor.applyBatch({ step: 1, deletes: [{ index: 1.5 }] })).toThrow(
      "Invalid deletes index 1.5"
    );
    expect(() => processor.applyBatch({ step: 1, headTakes: { count: -1 } })).toThrow(
      "Invalid headTakes count -1"
    );
    expect(() => processor.applyBatch({ step: 1, tailDeletes: { count: 2 } })).toThrow(
      "Invalid tailDeletes index 1"
    );
  });

  it("deletes graph edges explicitly", () => {
    const processor = new BatchProcessor("graph", "nodeGraph");
    processor.applyBatch({
      step: 1,
      graphNodes: [
        { id: "a", row: 0, column: 0 },
        { id: "b", row: 0, column: 1 },
      ],
      graphEdges: [{ id: "edge", from: "a", to: "b" }],
    });
    processor.applyBatch({ step: 2, graphEdgeDeletes: ["edge"] });
    expect(processor.getHistory()[2].graphEdges).toEqual([]);
  });
});
