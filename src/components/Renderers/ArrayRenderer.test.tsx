import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ControlItemState } from "../../common/models/controlItem";
import { Snapshot } from "../../common/models/snapshot";

vi.mock("../../hooks/useCollapsedItems", () => ({
  useCollapsedItems: () => ({
    collapsedIds: new Set(["deleted-wide"]),
    collapse: vi.fn(),
  }),
}));

import { ArrayRenderer } from "./ArrayRenderer";

describe("ArrayRenderer", () => {
  it.each([
    ["vertical", false, "top:0;left:0", "top:40px;left:0"],
    ["vertical", true, "top:80px;left:0", "top:40px;left:0"],
    ["horizontal", false, "top:0;left:0", "top:0;left:40px"],
    ["horizontal", true, "top:0;left:80px", "top:0;left:40px"],
  ] as const)("lays out %s array items with reverseDirection=%s", (orientation, reverseDirection, first, second) => {
    const snapshot: Snapshot<any> = {
      id: "array",
      type: "array",
      step: 0,
      items: ["A", "B"].map((value) => ({
        id: value,
        value,
        state: ControlItemState.Initial,
      })),
    };

    const markup = renderToStaticMarkup(
      <ArrayRenderer
        snapshot={snapshot}
        divWidth={120}
        divHeight={120}
        orientation={orientation}
        reverseDirection={reverseDirection}
        disableAnimations
        renderContent={(item) => <span>{item.value}</span>}
      />
    );

    expect(markup).toContain(first);
    expect(markup).toContain(second);
  });

  it("matches the control, item widths, and grid cells to every current offset", () => {
    const snapshot: Snapshot<any> = {
      id: "array",
      type: "array",
      step: 1,
      items: [30, 80, 20, 50].map((itemOffset, index) => ({
        id: `item-${index}`,
        state: ControlItemState.Initial,
        itemOffset,
      })),
    };

    const markup = renderToStaticMarkup(
      <ArrayRenderer
        snapshot={snapshot}
        divWidth={400}
        divHeight={60}
        defaultItemOffset={60}
        disableAnimations={false}
        fitContent
        minimumSlotCount={4}
      />
    );

    expect(markup).toContain("width:180px;height:60px;position:relative");
    expect(markup).toContain("left:0px;width:30px");
    expect(markup).toContain("left:30px;width:80px");
    expect(markup).toContain("left:110px;width:20px");
    expect(markup).toContain("left:130px;width:50px");
  });

  it("shrinks after deleting one of two widened update slots", () => {
    const snapshot: Snapshot<any> = {
      id: "array",
      type: "array",
      step: 10,
      items: [
        { id: "a", state: ControlItemState.Initial, itemOffset: 60 },
        {
          id: "outgoing-b",
          linkId: "b-slot",
          state: ControlItemState.RemovingUpdate,
          itemOffset: 60,
        },
        {
          id: "deleted-wide",
          linkId: "b-slot",
          state: ControlItemState.RemovingInsert,
          itemOffset: 120,
        },
        {
          id: "outgoing-c",
          linkId: "c-slot",
          state: ControlItemState.RemovingUpdate,
          itemOffset: 60,
        },
        {
          id: "wide-c",
          linkId: "c-slot",
          state: ControlItemState.Inserted,
          itemOffset: 120,
        },
        { id: "d", state: ControlItemState.Initial, itemOffset: 60 },
      ],
    };

    const markup = renderToStaticMarkup(
      <ArrayRenderer
        snapshot={snapshot}
        divWidth={360}
        divHeight={60}
        defaultItemOffset={40}
        disableAnimations={false}
        fitContent
        minimumSlotCount={4}
        minimumSlotOffset={60}
      />
    );

    expect(markup).toContain("width:240px;height:60px;position:relative");
    expect(markup).toContain("top:0;left:180px");
    expect(markup).not.toContain("left:240px;width:60px");
    expect(markup).not.toContain("left:280px");
  });

  it("keeps a non-collapsing deletion in place at its default width", () => {
    const snapshot: Snapshot<any> = {
      id: "array",
      type: "array",
      step: 11,
      items: [
        { id: "a", state: ControlItemState.Initial, itemOffset: 60 },
        {
          id: "empty-b",
          state: ControlItemState.Empty,
          itemOffset: 120,
          collapse: false,
        },
        { id: "wide-c", state: ControlItemState.Initial, itemOffset: 120 },
        { id: "d", state: ControlItemState.Initial, itemOffset: 60 },
      ],
    };

    const markup = renderToStaticMarkup(
      <ArrayRenderer
        snapshot={snapshot}
        divWidth={300}
        divHeight={60}
        defaultItemOffset={60}
        disableAnimations={false}
        minimumSlotCount={4}
      />
    );

    expect(markup).toContain("width:300px;height:60px;position:relative");
    expect(markup).toContain("left:60px;width:60px");
    expect(markup).toContain("left:120px;width:120px");
  });

  it("ends fit-content at the trailing edge of the last occupied item", () => {
    const snapshot: Snapshot<any> = {
      id: "array",
      type: "array",
      step: 1,
      items: [
        { id: "a", state: ControlItemState.Initial, itemOffset: 60 },
        { id: "b", state: ControlItemState.Initial, itemOffset: 120 },
        { id: "c", state: ControlItemState.Initial, itemOffset: 30 },
      ],
    };

    const markup = renderToStaticMarkup(
      <ArrayRenderer
        snapshot={snapshot}
        divWidth={400}
        divHeight={60}
        defaultItemOffset={60}
        disableAnimations={false}
        fitContent
        minimumSlotCount={4}
      />
    );

    expect(markup).toContain("width:210px;height:60px;position:relative");
    expect(markup).toContain("left:180px;width:30px");
    expect(markup).not.toContain("left:210px");
  });

  it.each([
    [80, 30],
    [30, 80],
  ])(
    "uses the larger pre-update offset for both nodes (%i, %i)",
    (outgoingOffset, incomingOffset) => {
      const snapshot: Snapshot<any> = {
        id: "array",
        type: "array",
        step: 1,
        items: [
          {
            id: "outgoing",
            linkId: "slot",
            state: ControlItemState.RemovingUpdate,
            itemOffset: outgoingOffset,
          },
          {
            id: "incoming",
            linkId: "slot",
            state: ControlItemState.PreUpdate,
            itemOffset: incomingOffset,
          },
          { id: "following", state: ControlItemState.Initial, itemOffset: 20 },
        ],
      };

      const markup = renderToStaticMarkup(
        <ArrayRenderer
          snapshot={snapshot}
          divWidth={300}
          divHeight={60}
          defaultItemOffset={60}
          disableAnimations={false}
          fitContent
        />
      );

      expect(markup).toContain("width:100px;height:60px;position:relative");
      expect(markup.match(/width:80px;height:60px;background-color/g)).toHaveLength(2);
      expect(markup).toContain("left:80px;width:20px");
    }
  );

  it("uses only the current offset after an update completes", () => {
    const snapshot: Snapshot<any> = {
      id: "array",
      type: "array",
      step: 2,
      items: [
        {
          id: "current",
          linkId: "slot",
          state: ControlItemState.Inserted,
          itemOffset: 30,
        },
        { id: "following", state: ControlItemState.Initial, itemOffset: 20 },
      ],
    };

    const markup = renderToStaticMarkup(
      <ArrayRenderer
        snapshot={snapshot}
        divWidth={300}
        divHeight={60}
        defaultItemOffset={60}
        disableAnimations={false}
        fitContent
      />
    );

    expect(markup).toContain("width:50px;height:60px;position:relative");
    expect(markup).toContain("left:0px;width:30px");
    expect(markup).toContain("left:30px;width:20px");
  });
});
