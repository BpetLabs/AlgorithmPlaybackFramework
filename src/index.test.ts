import { describe, expect, it } from "vitest";
import * as publicApi from "./index";

describe("public API", () => {
  it.each([
    "ArrayRenderer",
    "GridRenderer",
    "InteractiveControlRenderer",
    "NodeGraphRenderer",
    "SliderControl",
    "getControlRendererProps",
    "loadControls",
    "useControlManager",
  ])("exports %s from the package entry point", (exportName) => {
    expect(publicApi).toHaveProperty(exportName);
  });

  it("does not expose internal processing and animation utilities", () => {
    expect(publicApi).not.toHaveProperty("BatchProcessor");
    expect(publicApi).not.toHaveProperty("moveThenFallRotateAndDisappear");
  });
});
