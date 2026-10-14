import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ControlItemState } from "../../common/models/controlItem";
import {
  getJaggedArrayDimensions,
  JaggedArrayRenderer,
} from "./JaggedArrayRenderer";

const parentSnapshot = {
  id: "matrix",
  type: "jaggedArray",
  step: 2,
  items: [{ id: "row-0", state: ControlItemState.Initial, value: "Parent" }],
};

const child = (overrides: Record<string, unknown> = {}) => ({
  index: 0,
  snapshot: {
    id: "matrix-0",
    type: "array",
    step: 2,
    items: [{ id: "child-0", state: ControlItemState.RemovingInPlace, value: "Child" }],
  },
  options: { orientation: "horizontal" as const },
  render: {},
  ...overrides,
});

const childItems = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `child-${index}`,
    state: ControlItemState.Initial,
    value: `Child ${index}`,
  }));

const renderJagged = (
  children: any[],
  currentStep = 2,
  overrides: Record<string, unknown> = {}
) => renderToStaticMarkup(
  <JaggedArrayRenderer
    snapshot={parentSnapshot}
    childArrays={children}
    currentStep={currentStep}
    navigationDisableAnimations={false}
    disableAnimations
    childGap={5}
    childWidth={30}
    childHeight={20}
    divWidth={100}
    divHeight={80}
    renderContent={(item) => <span data-value={item.value}>{item.value}</span>}
    {...overrides}
  />
);

describe("JaggedArrayRenderer", () => {
  it("renders a current child at its fitted dimensions", () => {
    const markup = renderJagged([child()]);

    expect(markup).toContain('data-value="Child"');
    expect(markup).toContain("width:30px;height:20px");
    expect(markup).toContain("width:40px;height:30px");
  });

  it("highlights only the referenced child frame in a nested jagged array", () => {
    const markup = renderJagged([child({
      snapshot: {
        id: "matrix-0",
        type: "jaggedArray",
        step: 2,
        items: [
          { id: "nested-row-0", state: ControlItemState.Initial },
        ],
      },
      childArrays: [child({
        snapshot: {
          id: "matrix-0-0",
          type: "array",
          step: 2,
          items: childItems(2),
        },
      })],
    })], 2, {
      snapshot: {
        ...parentSnapshot,
        items: [
          {
            ...parentSnapshot.items[0],
            borderColor: "Orange",
            borderWidth: 4,
          },
        ],
      },
    });

    expect(markup.match(/apf-renderer-frame/g)).toHaveLength(3);
    expect(markup.match(/box-shadow:0 0 0 4px Orange/g)).toHaveLength(1);
  });

  it("uses configured child width and height", () => {
    const markup = renderJagged([child()], 2, {
      childWidth: 35,
      childHeight: 25,
    });

    expect(markup).toContain("width:35px;height:25px");
    expect(markup).toContain("width:45px;height:35px");
  });

  it("blocks item dimensions on jagged leaves", () => {
    expect(() => getJaggedArrayDimensions({
      snapshot: parentSnapshot,
      childArrays: [child({ options: { itemWidth: 1 } })],
      disableAnimations: true,
      divWidth: 1,
      divHeight: 1,
      childGap: 5,
      childWidth: 30,
      childHeight: 20,
    })).toThrow("itemWidth is not supported for array controls");
    expect(() => getJaggedArrayDimensions({
      snapshot: parentSnapshot,
      childArrays: [child({ options: { itemHeight: 1 } })],
      disableAnimations: true,
      divWidth: 1,
      divHeight: 1,
      childGap: 5,
      childWidth: 30,
      childHeight: 20,
    })).toThrow("itemHeight is not supported for array controls");
  });

  it("uses gaps to shrink jagged leaf items without shrinking their layout", () => {
    const markup = renderJagged([
      child({ options: { itemGap: 5, itemCrossAxisGap: 5 } }),
    ]);

    expect(markup).toContain("width:40px;height:30px");
    expect(markup).toContain("width:20px;height:10px");
  });

  it("uses itemOffset alone to resize jagged leaf layout", () => {
    const dimensionsForOffset = (itemOffset: number) =>
      getJaggedArrayDimensions({
        snapshot: parentSnapshot,
        childArrays: [child({
          snapshot: {
            id: "matrix-0",
            type: "array",
            step: 2,
            items: [{
              id: "child-0",
              state: ControlItemState.Initial,
              itemOffset,
            }],
          },
        })],
        disableAnimations: true,
        divWidth: 1,
        divHeight: 1,
        orientation: "vertical",
        childGap: 5,
        childWidth: 30,
        childHeight: 20,
      });

    expect(dimensionsForOffset(10)).toEqual({ width: 20, height: 30 });
    expect(dimensionsForOffset(60)).toEqual({ width: 70, height: 30 });
  });

  it("hides stale removing children by disabling their animations", () => {
    const markup = renderJagged([child()], 3);

    expect(markup).not.toContain('data-value="Child"');
    expect(markup).toContain("width:30px;height:20px");
  });

  it("falls back to parent content for missing or hidden children", () => {
    expect(renderJagged([])).toContain('data-value="Parent"');
    expect(renderJagged([child({ render: { visible: false } })])).toContain('data-value="Parent"');
  });

  it("keeps existing children attached after an immediate parent insert", () => {
    const markup = renderJagged(
      [child({ parentItemId: "row-0" })],
      2,
      {
        snapshot: {
          ...parentSnapshot,
          items: [
            {
              id: "inserted-row",
              state: ControlItemState.Initial,
              value: "New row",
              backgroundColor: "ForestGreen",
            },
            {
              id: "row-0",
              state: ControlItemState.Initial,
            },
          ],
        },
      }
    );

    expect(markup).toContain('data-value="New row"');
    expect(markup).toContain('data-value="Child"');
    expect(markup).toContain(
      "width:30px;height:20px;background-color:ForestGreen"
    );
  });

  it("keeps an updated parent item linked to its existing child", () => {
    const markup = renderJagged(
      [child({ parentItemId: "row-0" })],
      2,
      {
        snapshot: {
          ...parentSnapshot,
          items: [
            {
              id: "replacement-row",
              linkId: "row-0",
              state: ControlItemState.Initial,
            },
          ],
        },
      }
    );

    expect(markup).toContain('data-value="Child"');
  });

  it("fits vertical children from their item count", () => {
    const markup = renderJagged(
      [
        child({
          snapshot: {
            id: "matrix-0",
            type: "array",
            step: 2,
            items: childItems(2),
          },
          options: { orientation: "vertical" },
        }),
      ]
    );

    expect(markup).toContain("width:30px;height:40px");
  });

  it("fits horizontal children from their item count", () => {
    const markup = renderJagged(
      [
        child({
          snapshot: {
            id: "matrix-0",
            type: "array",
            step: 2,
            items: childItems(2),
          },
        }),
      ],
      2,
      { orientation: "vertical" }
    );

    expect(markup).toContain("width:60px;height:20px");
    expect(markup.match(/width:60px;height:20px/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("ignores a child orientation and alternates from the parent", () => {
    const markup = renderJagged(
      [
        child({
          snapshot: {
            id: "matrix-0",
            type: "array",
            step: 2,
            items: childItems(2),
          },
          options: {
            orientation: "horizontal",
          },
        }),
      ]
    );

    expect(markup).toContain("width:30px;height:40px");
  });

  it("alternates the child orientation when none is configured", () => {
    const markup = renderJagged([
      child({
        snapshot: {
          id: "matrix-0",
          type: "array",
          step: 2,
          items: childItems(2),
        },
        options: {},
      }),
    ]);

    expect(markup).toContain("width:30px;height:40px");
  });

  it("uses the child size plus gap on all sides for an empty parent", () => {
    expect(
      getJaggedArrayDimensions({
        snapshot: { ...parentSnapshot, items: [] },
        childArrays: [],
        disableAnimations: true,
        divWidth: 1,
        divHeight: 1,
        childGap: 5,
        childWidth: 30,
        childHeight: 20,
      })
    ).toEqual({ width: 40, height: 30 });
  });

  it("fits recursive jagged dimensions from the largest children", () => {
    const row = (index: number, count: number) => ({
      index,
      snapshot: {
        id: `row-${index}`,
        type: "array",
        step: 0,
        items: childItems(count),
      },
      options: { orientation: "horizontal" as const },
      render: {},
    });
    const matrix = (index: number, rowSizes: number[]) => ({
      index,
      snapshot: {
        id: `matrix-${index}`,
        type: "jaggedArray",
        step: 0,
        items: rowSizes.map((_, rowIndex) => ({
          id: `matrix-${index}-row-${rowIndex}`,
          state: ControlItemState.Initial,
        })),
      },
      options: { orientation: "vertical" as const },
      render: {},
      childArrays: rowSizes.map((count, rowIndex) =>
        row(rowIndex, count)
      ),
    });

    expect(
      getJaggedArrayDimensions({
        snapshot: {
          ...parentSnapshot,
          step: 0,
          items: [
            { id: "matrix-slot-0", state: ControlItemState.Initial },
            { id: "matrix-slot-1", state: ControlItemState.Initial },
          ],
        },
        childArrays: [matrix(0, [2, 3]), matrix(1, [4, 1, 2])],
        disableAnimations: true,
        divWidth: 1,
        divHeight: 1,
        childGap: 5,
        childWidth: 40,
        childHeight: 40,
      })
    ).toEqual({ width: 320, height: 160 });
  });

  it("renders nested jagged children recursively", () => {
    const markup = renderJagged([
      child({
        snapshot: {
          id: "matrix-0",
          type: "jaggedArray",
          step: 2,
          items: [
            { id: "row-0", state: ControlItemState.Initial },
          ],
        },
        childArrays: [
          child({
            snapshot: {
              id: "matrix-0-0",
              type: "array",
              step: 2,
              items: [
                {
                  id: "value-0",
                  state: ControlItemState.Initial,
                  value: "Nested",
                },
              ],
            },
          }),
        ],
      }),
    ]);

    expect(markup).toContain('data-value="Nested"');
  });
});
