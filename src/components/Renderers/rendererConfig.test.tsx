import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ControlItemState } from "../../common/models/controlItem";
import {
  RendererConfig,
  RendererType,
  resolveContainerClassName,
} from "./rendererConfig";

describe("renderer configuration", () => {
  it("uses default chrome only when no explicit class is supplied", () => {
    expect(resolveContainerClassName("base", "default")).toBe("default base");
    expect(resolveContainerClassName("base", "default", "custom")).toBe("custom base");
    expect(resolveContainerClassName("base", "default", "")).toBe("base");
  });

  it("uses valid dictionary column widths from the item or renderer options", () => {
    const renderContent = RendererConfig[RendererType.Dictionary].renderContent!;
    const itemWidths = renderToStaticMarkup(<>{renderContent({
      id: "item",
      state: ControlItemState.Initial,
      value: "key|value",
      splitColumnWidths: [30, 70],
    })}</>);
    const optionWidths = renderToStaticMarkup(<>{renderContent({
      id: "item",
      state: ControlItemState.Initial,
      value: "key|value",
    }, { splitColumnWidths: [40, 60] })}</>);

    expect(itemWidths).toContain("flex:0 0 30%");
    expect(itemWidths).toContain("flex:0 0 70%");
    expect(optionWidths).toContain("flex:0 0 40%");
  });

  it("falls back to equal columns for invalid dictionary widths", () => {
    const renderContent = RendererConfig[RendererType.Dictionary].renderContent!;
    const markup = renderToStaticMarkup(<>{renderContent({
      id: "item",
      state: ControlItemState.Initial,
      value: "a|b|c",
      splitColumnWidths: [50, 50],
    })}</>);

    expect(markup.match(/flex:1 1 0%/g)).toHaveLength(3);
  });
});
