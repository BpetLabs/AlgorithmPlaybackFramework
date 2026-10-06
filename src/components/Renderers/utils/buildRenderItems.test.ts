import { describe, expect, it } from "vitest";
import { ControlItem, ControlItemState } from "../../../common/models/controlItem";
import { buildRenderItems } from "./buildRenderItems";

describe("buildRenderItems", () => {
  it("shares one slot between linked outgoing and incoming items", () => {
    const items: ControlItem[] = [
      {
        id: "outgoing",
        linkId: "slot-a",
        state: ControlItemState.RemovingUpdate,
        value: "old",
      },
      {
        id: "incoming",
        linkId: "slot-a",
        state: ControlItemState.PreUpdate,
        value: "new",
      },
      {
        id: "next",
        state: ControlItemState.Initial,
        value: "next",
      },
    ];

    const result = buildRenderItems(items, new Set(), false, 50);

    expect(result.map(({ item, offset }) => [item.id, offset])).toEqual([
      ["outgoing", 0],
      ["incoming", 0],
      ["next", 50],
    ]);
  });

  it("ignores a linked empty placeholder superseded by an active item", () => {
    const items: ControlItem[] = [
      {
        id: "empty",
        linkId: "slot-a",
        state: ControlItemState.Empty,
      },
      {
        id: "active",
        linkId: "slot-a",
        state: ControlItemState.Initial,
      },
    ];

    const result = buildRenderItems(items, new Set(), false, 50);

    expect(result.map(({ item }) => item.id)).toEqual(["active"]);
  });
});
