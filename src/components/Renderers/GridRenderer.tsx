import { ControlItem } from "../../common/models/controlItem";
import { GridItem } from "../../common/models/griditem";
import { Snapshot } from "../../common/models/snapshot";
import { DEFAULT_RENDERER_CONTAINER_CLASS_NAME, RendererProps, resolveContainerClassName } from "./rendererConfig";
import { renderLineWithInlineBold } from "./utils/inlineBold";
import { buildHighlightOverlayStyle, buildItemBoxStyle } from "./utils/itemBoxStyle";
import { requirePositiveInteger } from "./utils/dimensions";

interface GridRendererProps extends RendererProps {
  snapshot: Snapshot<ControlItem>;
  divHeight: number;
  divWidth: number;
  rows?: number;
  cols?: number;
  emptyItemText?: string;
  showCellBorders?: boolean;
  rowDescription?: string;
  columnDescription?: string;
  rowLabels?: string[];
  columnLabels?: string[];
}

export function GridRenderer({
  snapshot,
  divHeight,
  divWidth,
  rows,
  cols,
  emptyItemText,
  showCellBorders = true,
  rowDescription,
  columnDescription,
  rowLabels = [],
  columnLabels = [],
  borderWidth,
  containerClassName,
  containerStyle,
}: GridRendererProps) {
  const resolvedRows = requirePositiveInteger(rows, "rows");
  const resolvedCols = requirePositiveInteger(cols, "cols");
  const cellWidth = divWidth / resolvedCols;
  const cellHeight = divHeight / resolvedRows;
  const hasRowLabels = rowLabels.some(label => label !== undefined && label !== "");
  const hasColumnLabels = columnLabels.some(label => label !== undefined && label !== "");

  // Map griditems for quick lookup
  const gridMap = new Map<string, GridItem>();
  snapshot.gridItems?.forEach(item => {
    gridMap.set(`${item.row}-${item.col}`, item);
  });

  return (
    // position relative must be in the div or it gets lost as a package reference
    <div
      style={{
        width: divWidth,
        height: divHeight,
        position: "relative",
        ...containerStyle,
      }}
      className={resolveContainerClassName(
        "rounded",
        DEFAULT_RENDERER_CONTAINER_CLASS_NAME,
        containerClassName
      )}
    >
      {rowDescription && (
        <div
          className="absolute text-sm font-mono text-gray-300"
          style={{
            top: "50%",
            left: hasRowLabels ? -44 : -28,
            writingMode: "vertical-rl",
            transform: "translateY(-50%) rotate(180deg)",
          }}
        >
          {rowDescription}
        </div>
      )}
      {columnDescription && (
        <div
          className="absolute text-sm font-mono text-gray-300"
          style={{
            top: "100%",
            left: "50%",
            marginTop: hasColumnLabels ? 30 : 8,
            transform: "translateX(-50%)",
          }}
        >
          {columnDescription}
        </div>
      )}
      {Array.from({ length: resolvedRows }).map((_, r) => {
        const label = rowLabels[r];
        if (label === undefined || label === "") return null;

        return (
          <div
            key={`row-label-${r}`}
            className="absolute text-sm font-mono text-gray-300"
            style={{
              top: r * cellHeight + cellHeight / 2,
              left: -8,
              transform: "translate(-100%, -50%)",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </div>
        );
      })}
      {Array.from({ length: resolvedCols }).map((_, c) => {
        const label = columnLabels[c];
        if (label === undefined || label === "") return null;

        return (
          <div
            key={`column-label-${c}`}
            className="absolute text-sm font-mono text-gray-300"
            style={{
              top: "100%",
              left: c * cellWidth + cellWidth / 2,
              marginTop: 6,
              transform: "translateX(-50%)",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </div>
        );
      })}
      {Array.from({ length: resolvedRows }).map((_, r) =>
        Array.from({ length: resolvedCols }).map((_, c) => {
          const item = gridMap.get(`${r}-${c}`);
          const highlightOverlayStyle = buildHighlightOverlayStyle(item ?? {}, { borderWidth });
          return (
            <div
              key={`${r}-${c}`}
              className="absolute flex flex-col items-center justify-center text-white text-sm font-mono"
              style={{
                width: cellWidth,
                height: cellHeight,
                top: r * cellHeight,
                left: c * cellWidth,
                ...buildItemBoxStyle(item ?? {}, { borderWidth }),
              }}
            >
              {(item?.value ?? emptyItemText ?? "").split("\n").map((line, idx) => (
                <div key={idx}>
                  {renderLineWithInlineBold(line)}
                </div>
              ))}
              {showCellBorders && (
                <div
                  className={`absolute inset-0 pointer-events-none border-r border-b border-gray-600 ${
                    r === 0 ? "border-t" : ""
                  } ${c === 0 ? "border-l" : ""}`}
                />
              )}
              {highlightOverlayStyle && <div style={highlightOverlayStyle} />}
            </div>
          );
        })
      )}
    </div>

  );
}




