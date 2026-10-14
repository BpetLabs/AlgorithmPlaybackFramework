import { describe, expect, it } from "vitest";
import { ControlItem, ControlItemState } from "../../../common/models/controlItem";
import { buildRenderItems } from "./buildRenderItems";

describe("buildRenderItems", () => {
  const item = (
    id: string,
    state = ControlItemState.Initial,
    values: Partial<ControlItem> = {}
  ): ControlItem => ({ id, state, ...values });

  it("returns no render items for an empty snapshot", () => {
    expect(buildRenderItems([], new Set(), false, 50)).toEqual([]);
  });

  it("does not render removed items", () => {
    expect(
      buildRenderItems(
        [item("removed", ControlItemState.Removed), item("current")],
        new Set(),
        false,
        50
      ).map(({ item: entry }) => entry.id)
    ).toEqual(["current"]);
  });

  it("calculates cumulative offsets using per-item overrides", () => {
    const result = buildRenderItems(
      [item("a", undefined, { itemOffset: 20 }), item("b"), item("c", undefined, { itemOffset: 30 })],
      new Set(),
      false,
      50
    );

    expect(result.map(({ item: entry, offset, collapsedIndex, itemOffset }) => ({
      id: entry.id,
      offset,
      collapsedIndex,
      itemOffset,
    }))).toEqual([
      { id: "a", offset: 0, collapsedIndex: 0, itemOffset: 20 },
      { id: "b", offset: 20, collapsedIndex: 20, itemOffset: 50 },
      { id: "c", offset: 70, collapsedIndex: 70, itemOffset: 30 },
    ]);
  });

  it("omits a collapsed item after its removing state has finished", () => {
    const result = buildRenderItems(
      [item("collapsed"), item("next")],
      new Set(["collapsed"]),
      false,
      50
    );

    expect(result.map(({ item: entry, offset }) => [entry.id, offset])).toEqual([
      ["next", 0],
    ]);
  });

  it("keeps an active removal frozen while still reserving its slot", () => {
    const result = buildRenderItems(
      [item("removing", ControlItemState.RemovingTake), item("next")],
      new Set(),
      false,
      50
    );

    expect(result).toEqual([
      expect.objectContaining({
        item: expect.objectContaining({ id: "removing" }),
        frozen: true,
        offset: 0,
      }),
      expect.objectContaining({
        item: expect.objectContaining({ id: "next" }),
        frozen: undefined,
        offset: 50,
      }),
    ]);
  });

  it("closes offsets around all collapsing removals when animations are disabled", () => {
    const result = buildRenderItems(
      [
        item("first"),
        item("removing-a", ControlItemState.RemovingHead),
        item("removing-b", ControlItemState.RemovingTail),
        item("last"),
      ],
      new Set(),
      true,
      25
    );

    expect(result.map(({ item: entry, offset }) => [entry.id, offset])).toEqual([
      ["first", 0],
      ["last", 25],
    ]);
  });

  it("keeps a lone linked empty placeholder as a slot", () => {
    const result = buildRenderItems(
      [item("empty", ControlItemState.Empty, { linkId: "slot-a" }), item("next")],
      new Set(),
      false,
      50
    );

    expect(result.map(({ item: entry, offset }) => [entry.id, offset])).toEqual([
      ["empty", 0],
      ["next", 50],
    ]);
  });

  it("restores a preserved empty slot to the default size", () => {
    const result = buildRenderItems(
      [
        item("empty", ControlItemState.Empty, {
          itemOffset: 120,
          collapse: false,
        }),
        item("next", ControlItemState.Initial, { itemOffset: 60 }),
      ],
      new Set(),
      false,
      60
    );

    expect(result.map(({ item: entry, offset, itemOffset }) => [
      entry.id,
      offset,
      itemOffset,
    ])).toEqual([
      ["empty", 0, 60],
      ["next", 60, 60],
    ]);
  });

  it("reuses a linked slot for non-adjacent items", () => {
    const result = buildRenderItems(
      [
        item("linked-a", undefined, { linkId: "slot-a", itemOffset: 30 }),
        item("middle"),
        item("linked-b", undefined, { linkId: "slot-a", itemOffset: 80 }),
        item("last"),
      ],
      new Set(),
      false,
      50
    );

    expect(result.map(({ item: entry, offset }) => [entry.id, offset])).toEqual([
      ["linked-a", 0],
      ["middle", 80],
      ["linked-b", 0],
      ["last", 130],
    ]);
  });

  it("reserves the larger linked size for following items", () => {
    const items = [
      item("outgoing", ControlItemState.RemovingUpdate, {
        linkId: "slot-a",
        itemOffset: 30,
      }),
      item("incoming", ControlItemState.PreUpdate, {
        linkId: "slot-a",
        itemOffset: 80,
      }),
      item("following", ControlItemState.Initial, { itemOffset: 20 }),
    ];

    const result = buildRenderItems(items, new Set(), false, 50);

    expect(result.map(({ item: entry, offset }) => [entry.id, offset])).toEqual([
      ["outgoing", 0],
      ["incoming", 0],
      ["following", 80],
    ]);
  });

  it("collapses every remnant of a deleted linked slot", () => {
    const items = [
      item("surviving", ControlItemState.RemovingUpdate, {
        linkId: "slot-a",
        itemOffset: 30,
      }),
      item("collapsed", ControlItemState.RemovingInsert, {
        linkId: "slot-a",
        itemOffset: 80,
      }),
      item("following", ControlItemState.Initial, { itemOffset: 20 }),
    ];

    const result = buildRenderItems(
      items,
      new Set(["collapsed"]),
      false,
      50
    );

    expect(
      result.map(({ item: entry, offset, itemOffset }) => [
        entry.id,
        offset,
        itemOffset,
      ])
    ).toEqual([
      ["surviving", 0, 0],
      ["collapsed", 0, 0],
      ["following", 0, 20],
    ]);
  });

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

  it.each([
    ControlItemState.PreInsert,
    ControlItemState.PreUpdate,
    ControlItemState.PreHead,
    ControlItemState.PreTail,
  ])("shares a slot with an adjacent %s item", (incomingState) => {
    const result = buildRenderItems(
      [
        item("outgoing", ControlItemState.RemovingInsert),
        item("incoming", incomingState),
        item("next"),
      ],
      new Set(),
      false,
      50
    );

    expect(result.map(({ item: entry, offset }) => [entry.id, offset])).toEqual([
      ["outgoing", 0],
      ["incoming", 0],
      ["next", 50],
    ]);
    expect(result[0].frozen).toBe(true);
  });

  it("recognizes an immediately inserted item as an incoming replacement", () => {
    const result = buildRenderItems(
      [
        item("outgoing", ControlItemState.RemovingUpdate),
        item("incoming", ControlItemState.Inserted, {
          previousState: ControlItemState.PreUpdate,
        }),
        item("next"),
      ],
      new Set(),
      false,
      50
    );

    expect(result.map(({ item: entry, offset }) => [entry.id, offset])).toEqual([
      ["outgoing", 0],
      ["incoming", 0],
      ["next", 50],
    ]);
  });

  it("does not share an outgoing slot with an unrelated later insert", () => {
    const result = buildRenderItems(
      [
        item("outgoing", ControlItemState.RemovingInsert),
        item("existing"),
        item("incoming", ControlItemState.PreInsert),
      ],
      new Set(),
      false,
      50
    );

    expect(result.map(({ item: entry, offset }) => [entry.id, offset])).toEqual([
      ["outgoing", 0],
      ["existing", 50],
      ["incoming", 100],
    ]);
  });

  it("does not share a slot when collapse is explicitly disabled", () => {
    const result = buildRenderItems(
      [
        item("outgoing", ControlItemState.RemovingInsert, { collapse: false }),
        item("incoming", ControlItemState.PreInsert),
      ],
      new Set(),
      false,
      50
    );

    expect(result.map(({ item: entry, offset }) => [entry.id, offset])).toEqual([
      ["outgoing", 0],
      ["incoming", 50],
    ]);
  });
});
