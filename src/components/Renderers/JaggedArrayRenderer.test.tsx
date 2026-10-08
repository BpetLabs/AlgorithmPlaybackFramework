import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ControlItemState } from "../../common/models/controlItem";
import { JaggedArrayRenderer } from "./JaggedArrayRenderer";

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
  options: { fitContent: true, defaultItemOffset: 30 },
  render: {},
  ...overrides,
});

const renderJagged = (
  children: any[],
  currentStep = 2,
  overrides: Record<string, unknown> = {}
) => renderToStaticMarkup(
  <JaggedArrayRenderer
    snapshot={parentSnapshot}
    childArrays={children}
    childDefaults={{ itemHeight: 20 }}
    currentStep={currentStep}
    navigationDisableAnimations={false}
    disableAnimations
    defaultItemOffset={100}
    divWidth={100}
    divHeight={80}
    renderContent={(item) => <span data-value={item.value}>{item.value}</span>}
    {...overrides}
  />
);

describe("JaggedArrayRenderer", () => {
  it("renders a current child using fit-content dimensions", () => {
    const markup = renderJagged([child()]);

    expect(markup).toContain('data-value="Child"');
    expect(markup).toContain("width:30px");
  });

  it("hides stale removing children by disabling their animations", () => {
    const markup = renderJagged([child()], 3);

    expect(markup).not.toContain('data-value="Child"');
    expect(markup).toContain("width:30px");
  });

  it("falls back to parent content for missing or hidden children", () => {
    expect(renderJagged([])).toContain('data-value="Parent"');
    expect(renderJagged([child({ render: { visible: false } })])).toContain('data-value="Parent"');
  });

  it("constrains vertical children to the parent's post-gap width", () => {
    const markup = renderJagged(
      [child({ options: { orientation: "vertical", defaultItemOffset: 30 } })],
      2,
      {
        childDefaults: { orientation: "vertical" },
        itemGap: 10,
      }
    );

    expect(markup).toContain("width:80px;height:30px");
  });

  it("constrains horizontal children to the parent's post-gap height", () => {
    const markup = renderJagged(
      [child({ options: { orientation: "horizontal", defaultItemOffset: 30 } })],
      2,
      { itemCrossAxisGap: 10 }
    );

    expect(markup).toContain("width:30px;height:60px");
  });
});
