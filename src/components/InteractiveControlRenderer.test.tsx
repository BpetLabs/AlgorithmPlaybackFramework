import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ControlItemState } from "../common/models/controlItem";
import { LoadedControl, Snapshot } from "../common/models/snapshot";
import { InteractiveControlRenderer } from "./InteractiveControlRenderer";

const snapshot: Snapshot<any> = {
  id: "items",
  type: "array",
  step: 0,
  items: [
    { id: "a", state: ControlItemState.Initial, value: "A" },
    { id: "b", state: ControlItemState.Initial, value: "B" },
  ],
};

const control = (overrides: Partial<LoadedControl<any>> = {}): LoadedControl<any> => ({
  id: "items",
  type: "array",
  staticValue: "",
  snapshots: [snapshot],
  rendererOptions: {},
  ...overrides,
});

const renderControl = (
  currentControl: LoadedControl<any>,
  latestSnapshots: Record<string, Snapshot<any>> = { items: snapshot },
  extra: Partial<React.ComponentProps<typeof InteractiveControlRenderer>> = {}
) => renderToStaticMarkup(
  <InteractiveControlRenderer
    control={currentControl}
    latestSnapshots={latestSnapshots}
    currentStep={0}
    disableAnimations={false}
    layout={{ top: 10, left: 20, width: 300, height: 80 }}
    {...extra}
  />
);

describe("InteractiveControlRenderer", () => {
  it("renders nothing without a snapshot, when hidden, or without complete dimensions", () => {
    expect(renderControl(control(), {})).toBe("");
    expect(renderControl(control({ render: { visible: false } }))).toBe("");
    expect(renderControl(control(), { items: snapshot }, { layout: { top: 0, left: 0 } })).toBe("");
  });

  it("rejects unsupported renderer types", () => {
    expect(() => renderControl(control(), {
      items: { ...snapshot, type: "unsupported" },
    })).toThrow('unsupported renderer type "unsupported"');
  });

  it("uses step render configuration, headers, fit-content sizing, and prop customization", () => {
    const configureProps = vi.fn((_, props) => {
      props.containerClassName = "custom-control";
    });
    const markup = renderControl(
      control({
        rendererOptions: { fitContent: true, defaultItemOffset: 40 },
        render: { title: "Fallback" },
        renderByStep: {
          0: {
            title: "Current Step",
            showTitle: true,
            layout: { left: 25 },
          },
        },
      }),
      { items: snapshot },
      { configureProps }
    );

    expect(configureProps).toHaveBeenCalledOnce();
    expect(markup).toContain("Current Step");
    expect(markup).toContain("left:25px");
    expect(markup).toContain("width:80px");
    expect(markup).toContain("custom-control");
  });

  it("supports titles below the resolved control height", () => {
    const markup = renderControl(
      control({
        rendererOptions: { fitContent: true, defaultItemOffset: 40 },
        render: { titlePosition: "bottom" },
      }),
      { items: snapshot },
      {
        defaultHeaderTitle: "Items",
        defaultHeaderPosition: "top",
      }
    );

    expect(markup).toContain('data-apf-control-title-position="bottom"');
    expect(markup).toContain("top:90px");
  });

  it("fits vertical arrays along the height axis", () => {
    const markup = renderControl(control({
      rendererOptions: {
        fitContent: true,
        orientation: "vertical",
        defaultItemOffset: 30,
      },
    }));

    expect(markup).toContain("width:300px");
    expect(markup).toContain("height:60px");
  });

  it("fits jagged arrays to recursively measured child content", () => {
    const jaggedSnapshot = {
      id: "items",
      type: "jaggedArray",
      step: 0,
      items: [{ id: "row-slot", state: ControlItemState.Initial }],
    };
    const rowSnapshot = {
      id: "row",
      type: "array",
      step: 0,
      items: [
        { id: "row-0", state: ControlItemState.Initial },
        { id: "row-1", state: ControlItemState.Initial },
      ],
    };
    const markup = renderControl(
      control({
        type: "jaggedArray",
        snapshots: [jaggedSnapshot],
        rendererOptions: { orientation: "horizontal" },
        childControls: [
          control({
            id: "row",
            parentIndex: 0,
            snapshots: [rowSnapshot],
            rendererOptions: { orientation: "horizontal" },
          }),
        ],
      }),
      { items: jaggedSnapshot, row: rowSnapshot },
      {
        configureProps: (_, props) => {
          props.childGap = 5;
          props.childWidth = 40;
          props.childHeight = 40;
        },
      }
    );

    expect(markup).toContain("width:50px");
    expect(markup).toContain("height:90px");
  });

  it("fits stacks to their occupied height while preserving the bottom edge and title position", () => {
    const stackSnapshot = { ...snapshot, type: "stack" };
    const markup = renderControl(
      control({
        type: "stack",
        snapshots: [stackSnapshot],
        render: { title: "Stack" },
        rendererOptions: {
          fitContent: true,
          defaultItemOffset: 30,
        },
      }),
      { items: stackSnapshot }
    );

    expect(markup).toContain("top:30px");
    expect(markup).toContain("width:300px");
    expect(markup).toContain("height:60px");
    expect(markup).toContain("position:absolute;top:-50px");
  });
});
