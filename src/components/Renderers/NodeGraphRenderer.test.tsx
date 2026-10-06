import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ControlItemState } from "../../common/models/controlItem";
import { NodeGraphRenderer } from "./NodeGraphRenderer";

describe("NodeGraphRenderer", () => {
  it("renders arrow modes and routes while filtering invalid or removing endpoints", () => {
    const markup = renderToStaticMarkup(
      <NodeGraphRenderer
        snapshot={{
          id: "graph",
          type: "nodeGraph",
          step: 1,
          items: [],
          graphNodes: [
            { id: "a", row: 0, column: 0, value: "A" },
            { id: "b", row: 0, column: 1, value: "B" },
            { id: "removing", row: 1, column: 0, value: "Gone", state: ControlItemState.RemovingInPlace },
          ],
          graphEdges: [
            { id: "next", from: "a", to: "b", color: "red" },
            { id: "prev", from: "b", to: "a", arrow: "prev", color: "blue" },
            { id: "both", from: "a", to: "b", arrow: "both", route: "loopTop", label: "**both**", color: "green" },
            { id: "none", from: "b", to: "a", arrow: "none", route: "loopBottom", color: "purple" },
            { id: "missing", from: "a", to: "missing", color: "orange" },
            { id: "removed", from: "a", to: "removing", color: "black" },
          ],
        }}
        divWidth={400}
        divHeight={200}
        disableAnimations
      />
    );

    expect(markup).toContain('stroke="red"');
    expect(markup).toContain('stroke="blue"');
    expect(markup).toContain('stroke="green"');
    expect(markup).toContain('stroke="purple"');
    expect(markup).not.toContain('stroke="orange"');
    expect(markup).not.toContain('stroke="black"');
    expect(markup.match(/marker-start=/g)).toHaveLength(2);
    expect(markup.match(/marker-end=/g)).toHaveLength(2);
    expect(markup).toContain("font-weight:700");
    expect(markup).toContain(">both<");
  });

  it("falls back from invalid track weights and clamps node spans to the layout", () => {
    const markup = renderToStaticMarkup(
      <NodeGraphRenderer
        snapshot={{
          id: "weighted",
          type: "nodeGraph",
          step: 0,
          items: [],
          graphNodes: [
            { id: "wide", row: -1, column: 1, columnSpan: 5, rowSpan: 2, value: "Wide" },
          ],
        }}
        divWidth={300}
        divHeight={120}
        graphLayout={{
          columns: 2,
          rows: 2,
          columnSizing: { values: [0, Number.NaN] },
          rowSizing: { values: [1] },
        }}
      />
    );

    expect(markup).toContain("Wide");
    expect(markup).not.toContain("NaN");
    expect(markup).not.toContain("Infinity");
  });
});
