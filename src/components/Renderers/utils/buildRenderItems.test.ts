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

  it("hides removing items when animations are disabled unless collapse is false", () => {
    const items: ControlItem[] = [
      {
        id: "collapsed-removal",
        state: ControlItemState.RemovingInPlace,
      },
      {
        id: "persistent-removal",
        state: ControlItemState.RemovingInPlace,
        collapse: false,
      },
      {
        id: "active",
        state: ControlItemState.Initial,
      },
    ];

    const result = buildRenderItems(items, new Set(), true, 50);

    expect(result.map(({ item, offset }) => [item.id, offset])).toEqual([
      ["persistent-removal", 0],
      ["active", 50],
    ]);
  });

  it("freezes a collapsing removal without consuming the next slot", () => {
    const items: ControlItem[] = [
      {
        id: "removing",
        state: ControlItemState.RemovingInPlace,
      },
      {
        id: "next",
        state: ControlItemState.Initial,
      },
    ];

    const result = buildRenderItems(items, new Set(["removing"]), false, 50);

    expect(result).toEqual([
      expect.objectContaining({
        item: expect.objectContaining({ id: "removing" }),
        collapsed: true,
        frozen: true,
        offset: 0,
      }),
      expect.objectContaining({
        item: expect.objectContaining({ id: "next" }),
        offset: 0,
      }),
    ]);
  });
});
