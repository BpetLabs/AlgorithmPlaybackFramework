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

  it("blocks item dimensions for arrays", () => {
    expect(() => renderControl(control({
      rendererOptions: { itemWidth: 1 },
    }))).toThrow("itemWidth is not supported for array controls");
    expect(() => renderControl(control({
      rendererOptions: { itemHeight: 1 },
    }))).toThrow("itemHeight is not supported for array controls");
  });

  it("uses gaps to shrink horizontal-array items without shrinking slots", () => {
    const markup = renderControl(control({
      rendererOptions: {
        itemGap: 10,
        itemCrossAxisGap: 25,
      },
    }));

    expect(markup).toContain("width:300px;height:80px;position:relative");
    expect(markup).toContain("left:40px;width:40px");
    expect(markup).toContain("width:20px;height:30px");
  });

  it("resizes one horizontal slot and restores the control after shrink or deletion", () => {
    const item = (id: string, itemOffset: number) => ({
      id,
      state: ControlItemState.Initial,
      itemOffset,
    });
    const snapshots = [
      {
        ...snapshot,
        step: 1,
        items: [item("a", 10), item("b", 10), item("c", 10)],
      },
      {
        ...snapshot,
        step: 3,
        items: [
          item("a", 10),
          {
            ...item("b-outgoing", 10),
            state: ControlItemState.RemovingUpdate,
            linkId: "b",
          },
          {
            ...item("b-incoming", 30),
            state: ControlItemState.PreUpdate,
            linkId: "b",
          },
          item("c", 10),
        ],
      },
      {
        ...snapshot,
        step: 4,
        items: [item("a", 10), item("b", 10), item("c", 10)],
      },
      {
        ...snapshot,
        step: 5,
        items: [
          item("a", 10),
          {
            ...item("b", 30),
            state: ControlItemState.Removed,
          },
          item("c", 10),
        ],
      },
    ];
    const currentControl = control({
      snapshots,
      rendererOptions: { itemCrossAxisGap: 25 },
    });
    const renderStep = (step: number) => renderControl(
      currentControl,
      { items: snapshots.find((entry) => entry.step === step)! },
      { currentStep: step }
    );

    expect(renderStep(1)).toContain("width:30px");
    expect(renderStep(3)).toContain("width:50px");
    expect(renderStep(3)).toContain("left:10px;width:30px");
    expect(
      renderStep(3).match(/width:30px;height:30px;background-color/g)
    ).toHaveLength(2);
    expect(renderStep(4)).toContain("width:30px");
    expect(renderStep(5)).toContain("width:60px");
  });

  it("keeps the larger outgoing stack slot until a smaller update moves into place", () => {
    const transitioningSnapshot = {
      ...snapshot,
      type: "stack",
      step: 1,
      items: [
        {
          id: "outgoing",
          linkId: "slot",
          state: ControlItemState.RemovingUpdate,
          itemOffset: 30,
        },
        {
          id: "incoming",
          linkId: "slot",
          state: ControlItemState.PreUpdate,
          itemOffset: 10,
        },
      ],
    };
    const completedSnapshot = {
      ...snapshot,
      type: "stack",
      step: 2,
      items: [
        {
          id: "incoming",
          linkId: "slot",
          state: ControlItemState.Inserted,
          itemOffset: 10,
        },
      ],
    };
    const currentControl = control({
      type: "stack",
      snapshots: [transitioningSnapshot, completedSnapshot],
    });

    const transitionMarkup = renderControl(
      currentControl,
      { items: transitioningSnapshot },
      { currentStep: 1 }
    );

    expect(transitionMarkup).toContain(
      "top:60px;left:20px;width:300px;height:30px"
    );
    expect(
      transitionMarkup.match(/height:30px;background-color/g)
    ).toHaveLength(2);
    expect(
      renderControl(
        currentControl,
        { items: completedSnapshot },
        { currentStep: 2 }
      )
    ).toContain("top:80px;left:20px;width:300px;height:10px");
  });

  it("moves following stack items past a larger incoming update slot", () => {
    const transitioningSnapshot = {
      ...snapshot,
      type: "stack",
      step: 1,
      items: [
        {
          id: "bottom",
          state: ControlItemState.Initial,
          itemOffset: 70,
        },
        {
          id: "outgoing",
          linkId: "slot",
          state: ControlItemState.RemovingUpdate,
          itemOffset: 70,
        },
        {
          id: "incoming",
          linkId: "slot",
          state: ControlItemState.PreUpdate,
          itemOffset: 140,
        },
        {
          id: "following",
          state: ControlItemState.Initial,
          itemOffset: 70,
        },
      ],
    };
    const currentControl = control({
      type: "stack",
      snapshots: [transitioningSnapshot],
    });

    const markup = renderControl(
      currentControl,
      { items: transitioningSnapshot },
      { currentStep: 1 }
    );

    expect(markup).toContain("top:-190px;left:20px;width:300px;height:280px");
    expect(markup.match(/height:140px;background-color/g)).toHaveLength(2);
    expect(markup).toContain("bottom:210px;left:0");
  });

  it("does not include a staged tail insert in fitted stack height", () => {
    const stagedSnapshot = {
      ...snapshot,
      type: "stack",
      step: 6,
      items: [
        {
          id: "bottom",
          state: ControlItemState.Initial,
          itemOffset: 70,
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
    const currentControl = control({
      type: "stack",
      snapshots: [stagedSnapshot],
      rendererOptions: { fitContent: true },
    });

    const markup = renderControl(
      currentControl,
      { items: stagedSnapshot },
      { currentStep: 6 }
    );

    expect(markup).toContain("top:-50px;left:20px;width:300px;height:140px");
    expect(markup).toContain("bottom:140px;left:0");
  });

  it("uses gaps to shrink vertical-array items without shrinking slots", () => {
    const markup = renderControl(control({
      rendererOptions: {
        orientation: "vertical",
        itemGap: 5,
        itemCrossAxisGap: 50,
      },
    }));

    expect(markup).toContain("width:300px");
    expect(markup).toContain("height:80px");
    expect(markup).toContain("top:40px;height:40px");
    expect(markup).toContain("width:200px;height:30px");
    expect(markup).toContain("position:absolute;top:45px;left:50px");
  });

  it.each(["stack", "dictionary"])(
    "uses gaps to shrink %s items without shrinking slots",
    (type) => {
      const typedSnapshot = { ...snapshot, type };
      const markup = renderControl(
        control({
          type,
          snapshots: [typedSnapshot],
          rendererOptions: {
            itemGap: 5,
            itemCrossAxisGap: 50,
          },
        }),
        { items: typedSnapshot }
      );

      expect(markup).toContain("width:200px");
      expect(markup).toContain("width:300px;height:80px");
      expect(markup).toContain("height:30px");
      expect(markup).toContain("bottom:40px");
    }
  );

  it.each(["stack", "dictionary"])(
    "blocks %s item dimensions",
    (type) => {
      const typedSnapshot = { ...snapshot, type };
      expect(() => renderControl(
        control({
          type,
          snapshots: [typedSnapshot],
          rendererOptions: { itemWidth: 1 },
        }),
        { items: typedSnapshot }
      )).toThrow(`itemWidth is not supported for ${type} controls`);
      expect(() => renderControl(
        control({
          type,
          snapshots: [typedSnapshot],
          rendererOptions: { itemHeight: 1 },
        }),
        { items: typedSnapshot }
      )).toThrow(`itemHeight is not supported for ${type} controls`);
    }
  );

  it("keeps text control sizing independent from custom item dimensions", () => {
    const textSnapshot = { ...snapshot, type: "text" };
    const markup = renderControl(
      control({
        type: "text",
        snapshots: [textSnapshot],
        rendererOptions: {
          itemWidth: 200,
          itemHeight: 30,
        },
      }),
      { items: textSnapshot }
    );

    expect(markup).toContain("width:300px");
    expect(markup).toContain("height:80px");
    expect(markup).toContain("bottom:40px");
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
