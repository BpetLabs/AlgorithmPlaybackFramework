import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ControlItemState } from "../../common/models/controlItem";
import { Snapshot } from "../../common/models/snapshot";

vi.mock("../../hooks/useCollapsedItems", () => ({
  useCollapsedItems: () => ({
    collapsedIds: new Set(["large-removal"]),
    collapse: vi.fn(),
  }),
}));

import { StackRenderer } from "./StackRenderer";

describe("StackRenderer", () => {
  it.each([
    [true, "top:0;left:0", "top:40px;left:0"],
    [false, "bottom:0;left:0", "bottom:40px;left:0"],
  ] as const)("lays out stack items with reverseDirection=%s", (reverseDirection, first, second) => {
    const snapshot: Snapshot<any> = {
      id: "stack",
      type: "stack",
      step: 0,
      items: ["A", "B"].map((value) => ({
        id: value,
        value,
        state: ControlItemState.Initial,
      })),
    };

    const markup = renderToStaticMarkup(
      <StackRenderer
        snapshot={snapshot}
        divWidth={120}
        divHeight={120}
        reverseDirection={reverseDirection}
        disableAnimations
        renderContent={(item) => <span>{item.value}</span>}
      />
    );

    expect(markup).toContain(first);
    expect(markup).toContain(second);
  });

  it("shrinks a fitted stack after a larger slot collapses", () => {
    const snapshot: Snapshot<any> = {
      id: "stack",
      type: "stack",
      step: 10,
      items: [
        {
          id: "bottom",
          state: ControlItemState.Initial,
          itemOffset: 70,
        },
        {
          id: "outgoing-update",
          linkId: "updated-slot",
          state: ControlItemState.RemovingUpdate,
          itemOffset: 70,
        },
        {
          id: "large-removal",
          linkId: "updated-slot",
          state: ControlItemState.RemovingInsert,
          itemOffset: 140,
        },
        {
          id: "top",
          state: ControlItemState.Initial,
          itemOffset: 70,
        },
        {
          id: "pending-tail",
          state: ControlItemState.PreTail,
          itemOffset: 70,
        },
      ],
    };

    const markup = renderToStaticMarkup(
      <StackRenderer
        snapshot={snapshot}
        divWidth={290}
        divHeight={280}
        defaultItemOffset={100}
        disableAnimations={false}
        fitContent
      />
    );

    expect(markup).toContain(
      "width:290px;height:140px;position:absolute;bottom:0"
    );
    expect(markup).toContain("bottom:70px;left:0");
  });
});
