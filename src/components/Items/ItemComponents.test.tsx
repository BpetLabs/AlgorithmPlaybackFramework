// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ControlItemState } from "../../common/models/controlItem";

const mocks = vi.hoisted(() => ({
  controller: { start: vi.fn(), set: vi.fn(), stop: vi.fn() },
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));
vi.mock("../../hooks/animations/useAnimationController", () => ({
  useAnimationController: () => ({ motionStyle: {}, controller: mocks.controller }),
}));
vi.mock("../../hooks/animations/useAnimatePreInsert", () => ({ useAnimatePreInsert: vi.fn() }));
vi.mock("../../hooks/animations/useAnimateMoveIntoPlace", () => ({ useAnimateMoveIntoPlace: vi.fn() }));
vi.mock("../../hooks/animations/useAnimatePreRemove", () => ({ useAnimatePreRemove: vi.fn() }));
vi.mock("../../hooks/animations/useAnimateRemoving", () => ({ useAnimateRemoving: vi.fn() }));
vi.mock("../../hooks/animations/useAnimateShake", () => ({ useAnimateShake: vi.fn() }));

import ArrayItem from "./ArrayItem";
import StackItem from "./StackItem";

afterEach(cleanup);

describe("animated item components", () => {
  beforeEach(() => {
    mocks.controller.set.mockReset();
    mocks.controller.stop.mockReset();
  });

  it("snaps disabled array items into place and passes slot metadata to content", () => {
    const renderContent = vi.fn((_item, options) => (
      <span data-index={options?.index} data-owner={String(options?.isSlotOwner)}>Array</span>
    ));
    const { container } = render(
      <ArrayItem
        item={{ id: "array", state: ControlItemState.Initial, borderColor: "red" }}
        itemHeight={20}
        itemWidth={30}
        slotHeight={20}
        slotWidth={30}
        collapsedIndex={2}
        itemIndex={4}
        isSlotOwner
        orientation="horizontal"
        mainOffset={10}
        disableAnimations
        itemGap={0}
        renderContent={renderContent}
      />
    );

    expect(mocks.controller.stop).toHaveBeenCalled();
    expect(mocks.controller.set).toHaveBeenCalledWith(expect.objectContaining({ opacity: 1 }));
    expect(container.querySelector('[data-index="4"]')?.getAttribute("data-owner")).toBe("true");
    expect([...container.querySelectorAll<HTMLElement>("div")].some((element) => element.style.border === "4px solid red")).toBe(true);
  });

  it("keeps empty stack items transparent and forwards split-column widths", () => {
    const renderContent = vi.fn((_item, options) => (
      <span data-widths={options?.splitColumnWidths?.join(",")}>Stack</span>
    ));
    const { container } = render(
      <StackItem
        item={{ id: "stack", state: ControlItemState.Empty }}
        itemHeight={20}
        itemWidth={30}
        collapsedIndex={1}
        bottomOffset={0}
        disableAnimations
        itemGap={0}
        splitColumnWidths={[30, 70]}
        renderContent={renderContent}
      />
    );

    expect(mocks.controller.set).toHaveBeenCalledWith(expect.objectContaining({ opacity: 0 }));
    expect(container.querySelector('[data-widths="30,70"]')).not.toBeNull();
  });
});
