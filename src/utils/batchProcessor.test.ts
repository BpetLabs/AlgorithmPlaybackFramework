import { describe, expect, it } from "vitest";
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

  it("merges grid items by generated or explicit id and rejects duplicate updates", () => {
    const processor = new BatchProcessor("grid", "grid");
    processor.applyBatch({ step: 1, gridItems: [{ row: 0, col: 0, value: "A" }] });
    const generatedId = processor.getHistory()[1].gridItems?.[0].id;
    expect(generatedId).toBeDefined();

    processor.applyBatch({
      step: 2,
      gridItems: [
        { id: generatedId, row: 0, col: 0, value: "Updated" },
        { id: "second", row: 0, col: 1, value: "B" },
      ],
    });
    expect(processor.getHistory()[2].gridItems?.map((entry) => entry.value)).toEqual([
      "Updated",
      "B",
    ]);

    expect(() => processor.applyBatch({
      step: 3,
      gridItems: [
        { id: "duplicate", row: 0, col: 0 },
        { id: "duplicate", row: 0, col: 1 },
      ],
    })).toThrow('Duplicate grid id "duplicate"');
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
      headInserts: [{ input: { value: "head" } }],
      tailInserts: [{ input: { value: "tail" }, now: true }],
      inserts: [{ index: 1, input: { value: "middle" }, animateNow: true }],
    });

    expect(processor.getHistory()[1].items.map(({ value, state, previousState }) => ({
      value,
      state,
      previousState,
    }))).toEqual([
      { value: "head", state: ControlItemState.PreHead, previousState: undefined },
      { value: "middle", state: ControlItemState.Inserted, previousState: ControlItemState.PreInsert },
      { value: "tail", state: ControlItemState.Initial, previousState: undefined },
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
