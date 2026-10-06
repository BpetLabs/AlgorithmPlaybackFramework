import { describe, expect, it } from "vitest";
import { ControlItemState } from "../common/models/controlItem";
import { BatchProcessor } from "./batchProcessor";

describe("BatchProcessor", () => {
  it("generates deterministic item ids per processor", () => {
    const first = new BatchProcessor("first", "array", 2).getHistory();
    const second = new BatchProcessor("second", "array", 2).getHistory();

    expect(first[0].items.map((item) => item.id)).toEqual([
      "item-0",
      "item-1",
    ]);
    expect(second[0].items.map((item) => item.id)).toEqual([
      "item-0",
      "item-1",
    ]);
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
});
