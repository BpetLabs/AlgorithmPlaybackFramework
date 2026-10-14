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
  rendererOptions: { orientation: "vertical", itemGap: 4 },
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
      itemGap: 4,
    });
    expect(props).not.toHaveProperty("childArrays");
  });

  it("builds child arrays from available indexed child snapshots", () => {
    const parentSnapshot = snapshot("parent", 2);
    const childSnapshot = snapshot("child", 2);
    const parent = control({
      snapshots: [{
        ...parentSnapshot,
        items: [
          { id: "parent-item-0", state: ControlItemState.Initial },
          { id: "parent-item-1", state: ControlItemState.Initial },
        ],
      }],
      childControls: [
        control({
          id: "child",
          parentIndex: 1,
          rendererOptions: { itemCrossAxisGap: 3 },
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
        childId: "child",
        index: 1,
        parentItemId: "parent-item-1",
        snapshot: childSnapshot,
        options: { itemCrossAxisGap: 3 },
        render: { title: "Current" },
      },
    ]);
  });

  it("builds recursively nested jagged child props", () => {
    const parentSnapshot = snapshot("parent", 0);
    const matrixSnapshot = {
      ...snapshot("matrix", 0),
      type: "jaggedArray",
    };
    const rowSnapshot = snapshot("row", 0);
    const parent = control({
      type: "jaggedArray",
      snapshots: [parentSnapshot],
      childControls: [
        control({
          id: "matrix",
          type: "jaggedArray",
          parentIndex: 0,
          childControls: [
            control({ id: "row", parentIndex: 1 }),
          ],
        }),
      ],
    });

    const props = getControlRendererProps({
      control: parent,
      snapshot: parentSnapshot,
      latestSnapshots: {
        parent: parentSnapshot,
        matrix: matrixSnapshot,
        row: rowSnapshot,
      },
      dimensions: { width: 200, height: 100 },
      renderConfig: {},
      currentStep: 0,
      disableAnimations: true,
    });

    expect(props.childArrays).toMatchObject([
      {
        index: 0,
        parentItemId: "parent-item",
        snapshot: matrixSnapshot,
        childArrays: [{ index: 1, snapshot: rowSnapshot }],
      },
    ]);
  });
});
