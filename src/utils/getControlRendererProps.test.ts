import { describe, expect, it } from "vitest";
import { ControlItem, ControlItemState } from "../common/models/controlItem";
import { LoadedControl, Snapshot } from "../common/models/snapshot";
import { getControlRendererProps } from "./getControlRendererProps";

const snapshot = (id: string, step: number): Snapshot<ControlItem> => ({
  id,
  type: "array",
  step,
  items: [{ id: `${id}-item`, state: ControlItemState.Initial }],
});

const control = (overrides: Partial<LoadedControl<ControlItem>> = {}): LoadedControl<ControlItem> => ({
  id: "parent",
  type: "array",
  staticValue: "static",
  snapshots: [],
  rendererOptions: { orientation: "vertical", itemWidth: 40 },
  ...overrides,
});

describe("getControlRendererProps", () => {
  it("disables animations for stale snapshots and applies renderer configuration", () => {
    const currentSnapshot = snapshot("parent", 1);
    const props = getControlRendererProps({
      control: control(),
      snapshot: currentSnapshot,
      latestSnapshots: { parent: currentSnapshot },
      dimensions: { width: 200, height: 100 },
      renderConfig: { borderWidth: 3 },
      currentStep: 2,
      disableAnimations: false,
    });

    expect(props).toMatchObject({
      snapshot: currentSnapshot,
      divWidth: 200,
      divHeight: 100,
      disableAnimations: true,
      borderWidth: 3,
      staticValue: "static",
      orientation: "vertical",
      itemWidth: 40,
    });
    expect(props).not.toHaveProperty("childArrays");
  });

  it("builds child arrays from available indexed child snapshots", () => {
    const parentSnapshot = snapshot("parent", 2);
    const childSnapshot = snapshot("child", 2);
    const parent = control({
      childControls: [
        control({
          id: "child",
          parentIndex: 1,
          rendererOptions: { itemHeight: 30 },
          render: { title: "Default" },
          renderByStep: { 2: { title: "Current" } },
        }),
        control({ id: "missing", parentIndex: 2 }),
        control({ id: "unindexed", parentIndex: undefined }),
      ],
    });

    const props = getControlRendererProps({
      control: parent,
      snapshot: parentSnapshot,
      latestSnapshots: { parent: parentSnapshot, child: childSnapshot },
      dimensions: { width: 200, height: 100 },
      renderConfig: {},
      currentStep: 2,
      disableAnimations: true,
    });

    expect(props.currentStep).toBe(2);
    expect(props.navigationDisableAnimations).toBe(true);
    expect(props.childArrays).toEqual([
      {
        index: 1,
        snapshot: childSnapshot,
        options: { itemHeight: 30 },
        render: { title: "Current" },
      },
    ]);
  });
});
