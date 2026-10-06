import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ControlItemState } from "../../common/models/controlItem";
import { Snapshot } from "../../common/models/snapshot";
import { GridRenderer } from "./GridRenderer";
import { MemoryStackRenderer } from "./MemoryStackRenderer";
import { RendererMap } from "./RendererMap";
import { RendererType } from "./rendererConfig";
import { StackRenderer } from "./StackRenderer";

const snapshot: Snapshot<{
  id: string;
  state: ControlItemState;
  value?: string;
}> = {
  id: "items",
  type: "array",
  step: 0,
  items: [{ id: "item-0", state: ControlItemState.Initial, value: "A" }],
};

describe("renderers", () => {
  it("lets caller content override renderer defaults", () => {
    const ArrayControl = RendererMap[RendererType.Array];
    const markup = renderToStaticMarkup(
      <ArrayControl
        snapshot={snapshot}
        divWidth={100}
        divHeight={50}
        disableAnimations
        renderContent={() => <span data-custom-content>Custom</span>}
      />
    );

    expect(markup).toContain("data-custom-content");
    expect(markup).toContain("Custom");
  });

  it("uses a safe default stack item offset", () => {
    const markup = renderToStaticMarkup(
      <StackRenderer
        snapshot={snapshot}
        divWidth={100}
        divHeight={100}
        disableAnimations
      />
    );

    expect(markup).not.toContain("NaN");
  });

  it("renders item labels beneath horizontal array slots", () => {
    const ArrayControl = RendererMap[RendererType.Array];
    const markup = renderToStaticMarkup(
      <ArrayControl
        snapshot={snapshot}
        divWidth={100}
        divHeight={50}
        disableAnimations
        itemLabels={["first", "second"]}
      />
    );

    expect(markup).toContain("first");
    expect(markup).toContain("second");
    expect(markup).toContain("top:100%");
    expect(markup).toContain("translateX(-50%)");
  });

  it("renders item labels beside vertical array slots", () => {
    const ArrayControl = RendererMap[RendererType.Array];
    const markup = renderToStaticMarkup(
      <ArrayControl
        snapshot={snapshot}
        divWidth={50}
        divHeight={100}
        disableAnimations
        orientation="vertical"
        itemLabels={["first", "second"]}
      />
    );

    expect(markup).toContain("first");
    expect(markup).toContain("second");
    expect(markup).toContain("left:-8px");
    expect(markup).toContain("translate(-100%, -50%)");
  });

  it("rejects invalid grid dimensions", () => {
    expect(() =>
      renderToStaticMarkup(
        <GridRenderer
          snapshot={snapshot}
          divWidth={100}
          divHeight={100}
          rows={0}
          cols={2}
        />
      )
    ).toThrow("rows must be a positive integer");
  });

  it("renders grid row and column descriptions", () => {
    const markup = renderToStaticMarkup(
      <GridRenderer
        snapshot={snapshot}
        divWidth={100}
        divHeight={100}
        rows={2}
        cols={2}
        rowDescription="items"
        columnDescription="capacity"
      />
    );

    expect(markup).toContain("items");
    expect(markup).toContain("capacity");
    expect(markup).toContain("writing-mode:vertical-rl");
    expect(markup).toContain("left:-28px");
    expect(markup).toContain("margin-top:8px");
  });

  it("moves grid descriptions outward when row and column labels exist", () => {
    const markup = renderToStaticMarkup(
      <GridRenderer
        snapshot={snapshot}
        divWidth={100}
        divHeight={100}
        rows={2}
        cols={2}
        rowDescription="items"
        columnDescription="capacity"
        rowLabels={["A", "B"]}
        columnLabels={["1", "2"]}
      />
    );

    expect(markup).toContain("left:-44px");
    expect(markup).toContain("margin-top:30px");
  });

  it("renders labels beside each grid row and beneath each grid column", () => {
    const markup = renderToStaticMarkup(
      <GridRenderer
        snapshot={snapshot}
        divWidth={100}
        divHeight={100}
        rows={2}
        cols={2}
        rowLabels={["C", "D"]}
        columnLabels={["A", "B"]}
      />
    );

    expect(markup).toContain("C");
    expect(markup).toContain("D");
    expect(markup).toContain("A");
    expect(markup).toContain("B");
    expect(markup).toContain("translate(-100%, -50%)");
  });

  it("renders emptyItemText in grid cells without values", () => {
    const markup = renderToStaticMarkup(
      <GridRenderer
        snapshot={{
          ...snapshot,
          type: "grid",
          gridItems: [{ row: 0, col: 0, value: "7" }],
        }}
        divWidth={100}
        divHeight={50}
        rows={1}
        cols={2}
        emptyItemText="Max"
      />
    );

    expect(markup).toContain(">7<");
    expect(markup).toContain(">Max<");
  });

  it("renders memory address zero", () => {
    const markup = renderToStaticMarkup(
      <MemoryStackRenderer
        snapshot={snapshot}
        divWidth={100}
        divHeight={100}
        disableAnimations
        startingMemoryAddress={0}
      />
    );

    expect(markup).toContain("0x0");
    expect(markup).not.toContain("NaN");
  });
});
