import { ControlItem, isRemovingState } from "../../common/models/controlItem";
import { GraphArrowMode, GraphEdge, GraphEdgeAnchor, GraphLayout, GraphNode } from "../../common/models/graph";
import { Snapshot } from "../../common/models/snapshot";
import GraphNodeItem from "../Items/GraphNodeItem";
import { DEFAULT_RENDERER_CONTAINER_CLASS_NAME, RendererProps, resolveContainerClassName } from "./rendererConfig";
import { parseInlineBoldSegments, renderLineWithInlineBold } from "./utils/inlineBold";
import { buildHighlightOverlayStyle, buildItemBoxStyle } from "./utils/itemBoxStyle";

interface NodeGraphRendererProps extends RendererProps {
  snapshot: Snapshot<ControlItem>;
  divHeight: number;
  divWidth: number;
  graphLayout?: GraphLayout;
  gridLines?: boolean;
  disableAnimations?: boolean;
}

type NodeRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type EdgeGeometry = {
  d: string;
  labelX: number;
  labelY: number;
};

type GraphTracks = {
  columns: ReturnType<typeof buildTracks>;
  rows: ReturnType<typeof buildTracks>;
};

const MIN_TRACK_WEIGHT = 0.0001;
function getTrackWeights(count: number, sizingValues?: number[]): number[] {
  if (count <= 0) return [];
  if (!sizingValues || sizingValues.length !== count) {
    return Array.from({ length: count }, () => 1);
  }
  return sizingValues.map((v) => (Number.isFinite(v) && v > 0 ? v : MIN_TRACK_WEIGHT));
}

function buildTracks(totalSize: number, weights: number[], gapRatio: number, start: number) {
  const count = weights.length;
  if (count === 0) {
    return { starts: [] as number[], sizes: [] as number[] };
  }

  const gapSize = Math.max(0, totalSize * gapRatio);
  const totalGap = gapSize * Math.max(0, count - 1);
  const contentSize = Math.max(0, totalSize - totalGap);
  const weightSum = weights.reduce((sum, w) => sum + w, 0) || 1;

  const sizes = weights.map((w) => (contentSize * w) / weightSum);
  const starts: number[] = [];
  let cursor = start;
  for (let i = 0; i < count; i++) {
    starts.push(cursor);
    cursor += sizes[i] + gapSize;
  }

  return { starts, sizes };
}

function interpolateTrackPosition(values: number[], index: number) {
  if (!values.length) return 0;

  const maxIndex = values.length - 1;
  const clamped = Math.max(0, Math.min(maxIndex, index));
  const baseIndex = Math.floor(clamped);
  const fraction = clamped - baseIndex;

  if (fraction === 0 || baseIndex >= maxIndex) {
    return values[baseIndex];
  }

  const nextValue = values[baseIndex + 1];
  return values[baseIndex] + (nextValue - values[baseIndex]) * fraction;
}

function getItemScale(value: number | undefined): number {
  return value !== undefined && Number.isFinite(value) && value > 0
    ? value
    : 1;
}

function buildGraphTracks(
  nodes: GraphNode[],
  layout: GraphLayout,
  divWidth: number,
  divHeight: number
): GraphTracks {
  const maxColumn = nodes.reduce((max, node) => Math.max(max, node.column), 0);
  const maxRow = nodes.reduce((max, node) => Math.max(max, node.row), 0);
  const columnCount = Math.max(1, layout.columns ?? maxColumn + 1);
  const rowCount = Math.max(1, layout.rows ?? maxRow + 1);
  const paddingX = divWidth * (layout.paddingX ?? 0.00);
  const paddingY = divHeight * (layout.paddingY ?? 0.00);
  const offsetX = divWidth * (layout.offsetX ?? 0);
  const offsetY = divHeight * (layout.offsetY ?? 0);
  const innerWidth = Math.max(0, divWidth - paddingX * 2);
  const innerHeight = Math.max(0, divHeight - paddingY * 2);

  return {
    columns: buildTracks(
      innerWidth,
      getTrackWeights(columnCount, layout.columnSizing?.values),
      layout.colGap ?? 0.04,
      paddingX + offsetX
    ),
    rows: buildTracks(
      innerHeight,
      getTrackWeights(rowCount, layout.rowSizing?.values),
      layout.rowGap ?? 0.06,
      paddingY + offsetY
    ),
  };
}

function getArrowMarkers(arrow: GraphArrowMode | undefined, markerBaseId: string) {
  const mode = arrow ?? "next";
  if (mode === "none") return {};
  if (mode === "prev") return { markerStart: `url(#${markerBaseId}-start)` };
  if (mode === "both") {
    return {
      markerStart: `url(#${markerBaseId}-start)`,
      markerEnd: `url(#${markerBaseId}-end)`,
    };
  }
  return { markerEnd: `url(#${markerBaseId}-end)` };
}

function getAnchorPoint(rect: NodeRect, anchor: GraphEdgeAnchor) {
  switch (anchor) {
    case "upperLeft":
      return { x: rect.x, y: rect.y };
    case "upperRight":
      return { x: rect.x + rect.width, y: rect.y };
    case "lowerLeft":
      return { x: rect.x, y: rect.y + rect.height };
    case "lowerRight":
      return { x: rect.x + rect.width, y: rect.y + rect.height };
    case "top":
      return { x: rect.x + rect.width / 2, y: rect.y };
    case "bottom":
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height };
    case "left":
      return { x: rect.x, y: rect.y + rect.height / 2 };
    case "right":
    default:
      return { x: rect.x + rect.width, y: rect.y + rect.height / 2 };
  }
}

function getAnchorVector(anchor: GraphEdgeAnchor) {
  switch (anchor) {
    case "upperLeft":
      return { x: -1, y: -1 };
    case "upperRight":
      return { x: 1, y: -1 };
    case "lowerLeft":
      return { x: -1, y: 1 };
    case "lowerRight":
      return { x: 1, y: 1 };
    case "top":
      return { x: 0, y: -1 };
    case "bottom":
      return { x: 0, y: 1 };
    case "left":
      return { x: -1, y: 0 };
    case "right":
    default:
      return { x: 1, y: 0 };
  }
}

function buildNodeRects(
  nodes: GraphNode[],
  layout: GraphLayout,
  divWidth: number,
  divHeight: number
): Map<string, NodeRect> {
  const tracks = buildGraphTracks(nodes, layout, divWidth, divHeight);
  const colTracks = tracks.columns;
  const rowTracks = tracks.rows;
  const columns = colTracks.starts.length;
  const rows = rowTracks.starts.length;
  const colStartPositions = colTracks.starts;
  const rowStartPositions = rowTracks.starts;
  const colEndPositions = colTracks.starts.map((start, i) => start + (colTracks.sizes[i] ?? 0));
  const rowEndPositions = rowTracks.starts.map((start, i) => start + (rowTracks.sizes[i] ?? 0));

  const rects = new Map<string, NodeRect>();

  nodes.forEach((node) => {
    const column = Math.max(0, Math.min(columns - 1, node.column));
    const row = Math.max(0, Math.min(rows - 1, node.row));
    const columnSpan = Math.max(1, node.columnSpan ?? 1);
    const rowSpan = Math.max(1, node.rowSpan ?? 1);

    const endColumn = Math.min(columns - 1, column + columnSpan - 1);
    const endRow = Math.min(rows - 1, row + rowSpan - 1);

    const x = interpolateTrackPosition(colStartPositions, column);
    const y = interpolateTrackPosition(rowStartPositions, row);
    const right = interpolateTrackPosition(colEndPositions, endColumn);
    const bottom = interpolateTrackPosition(rowEndPositions, endRow);
    const baseWidth = Math.max(0, right - x);
    const baseHeight = Math.max(0, bottom - y);
    const width = baseWidth * getItemScale(node.itemWidthScale);
    const height = baseHeight * getItemScale(node.itemHeightScale);

    rects.set(node.id, {
      x: x + (baseWidth - width) / 2,
      y: y + (baseHeight - height) / 2,
      width,
      height,
    });
  });

  return rects;
}

function buildEdgeGeometry(
  edge: GraphEdge,
  fromRect: NodeRect,
  toRect: NodeRect,
  fromNode: GraphNode | undefined,
  toNode: GraphNode | undefined,
  divHeight: number,
  minNodeY: number,
  maxNodeBottom: number
): EdgeGeometry {
  const route = edge.route ?? "direct";
  const leftToRight = (fromNode?.column ?? 0) <= (toNode?.column ?? 0);
  const defaultFromAnchor: GraphEdgeAnchor = route === "direct" ? (leftToRight ? "right" : "left") : "right";
  const defaultToAnchor: GraphEdgeAnchor = route === "direct" ? (leftToRight ? "left" : "right") : "left";
  const fromAnchor = edge.fromAnchor ?? defaultFromAnchor;
  const toAnchor = edge.toAnchor ?? defaultToAnchor;
  const fromPoint = getAnchorPoint(fromRect, fromAnchor);
  const toPoint = getAnchorPoint(toRect, toAnchor);
  const sy = fromPoint.y;
  const ty = toPoint.y;
  const loopOffset = edge.loopOffset ?? 28;
  const routeGap = 12;

  if (route === "loopTop") {
    const sx = fromPoint.x;
    const tx = toPoint.x;
    const loopY = Math.max(routeGap, minNodeY - loopOffset);
    const verticalBend = Math.max(18, Math.min(40, loopOffset * 0.8));
    const d = `M ${sx} ${sy} C ${sx + 24} ${sy}, ${sx + 24} ${loopY + verticalBend}, ${sx} ${loopY} L ${tx} ${loopY} C ${tx - 24} ${loopY + verticalBend}, ${tx - 24} ${ty}, ${tx} ${ty}`;
    return {
      d,
      labelX: (sx + tx) / 2,
      labelY: loopY - 6,
    };
  }

  if (route === "loopBottom") {
    const sx = fromPoint.x;
    const tx = toPoint.x;
    const loopY = Math.min(divHeight - routeGap, maxNodeBottom + loopOffset);
    const verticalBend = Math.max(18, Math.min(40, loopOffset * 0.8));
    const d = `M ${sx} ${sy} C ${sx + 24} ${sy}, ${sx + 24} ${loopY - verticalBend}, ${sx} ${loopY} L ${tx} ${loopY} C ${tx - 24} ${loopY - verticalBend}, ${tx - 24} ${ty}, ${tx} ${ty}`;
    return {
      d,
      labelX: (sx + tx) / 2,
      labelY: loopY - 6,
    };
  }

  const sx = fromPoint.x;
  const tx = toPoint.x;
  const dx = tx - sx;
  const dy = ty - sy;
  const curveDistance = Math.max(24, Math.min(90, Math.max(Math.abs(dx), Math.abs(dy)) * 0.4));
  const fromVec = getAnchorVector(fromAnchor);
  const toVec = getAnchorVector(toAnchor);
  const c1x = sx + fromVec.x * curveDistance;
  const c1y = sy + fromVec.y * curveDistance;
  const c2x = tx + toVec.x * curveDistance;
  const c2y = ty + toVec.y * curveDistance;

  return {
    d: `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tx} ${ty}`,
    labelX: (sx + tx) / 2,
    labelY: (sy + ty) / 2 - 6,
  };
}

export function NodeGraphRenderer({
  snapshot,
  divHeight,
  divWidth,
  graphLayout,
  gridLines,
  borderWidth,
  containerClassName,
  containerStyle,
  disableAnimations,
}: NodeGraphRendererProps) {
  const allNodes = snapshot.graphNodes ?? [];
  const nodes = allNodes;
  const edges = snapshot.graphEdges ?? [];
  const layout = graphLayout ?? {};
  const tracks = buildGraphTracks(nodes, layout, divWidth, divHeight);
  const markerBaseId = `graph-marker-${snapshot.id}-${snapshot.step}`;

  const rects = buildNodeRects(nodes, layout, divWidth, divHeight);
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const renderedEdges = edges.filter((edge) => {
    const fromState = nodesById.get(edge.from)?.state;
    const toState = nodesById.get(edge.to)?.state;
    return !isRemovingState(fromState) && !isRemovingState(toState);
  });
  const nodeRects = Array.from(rects.values());
  const minNodeY = nodeRects.length ? Math.min(...nodeRects.map((rect) => rect.y)) : 0;
  const maxNodeBottom = nodeRects.length ? Math.max(...nodeRects.map((rect) => rect.y + rect.height)) : divHeight;

  return (
    <div
      style={{ width: divWidth, height: divHeight, position: "relative", ...containerStyle }}
      className={resolveContainerClassName("rounded", DEFAULT_RENDERER_CONTAINER_CLASS_NAME, containerClassName)}
    >
      <svg width={divWidth} height={divHeight} className="absolute inset-0 pointer-events-none">
        <defs>
          <marker
            id={`${markerBaseId}-end`}
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L8,4 L0,8 z" fill="context-stroke" />
          </marker>
          <marker
            id={`${markerBaseId}-start`}
            markerWidth="8"
            markerHeight="8"
            refX="1"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M8,0 L0,4 L8,8 z" fill="context-stroke" />
          </marker>
        </defs>

        {gridLines &&
          tracks.rows.starts.flatMap((y, row) =>
            tracks.columns.starts.map((x, column) => (
              <rect
                key={`grid-${row}-${column}`}
                data-apf-graph-grid-line=""
                x={x}
                y={y}
                width={tracks.columns.sizes[column]}
                height={tracks.rows.sizes[row]}
                fill="none"
                stroke="var(--apf-grid-border-color, #4b5563)"
                strokeWidth="1"
              />
            ))
          )}

        {renderedEdges.map((edge: GraphEdge) => {
          const fromRect = rects.get(edge.from);
          const toRect = rects.get(edge.to);
          if (!fromRect || !toRect) return null;

          const fromNode = nodesById.get(edge.from);
          const toNode = nodesById.get(edge.to);
          const edgeGeometry = buildEdgeGeometry(edge, fromRect, toRect, fromNode, toNode, divHeight, minNodeY, maxNodeBottom);

          const markers = getArrowMarkers(edge.arrow, markerBaseId);
          const edgeColor = edge.color?.trim() ? edge.color : "#9CA3AF";
          const edgeWidth = edge.width ?? 2;

          return (
            <g key={edge.id}>
              <path d={edgeGeometry.d} fill="none" stroke={edgeColor} strokeWidth={edgeWidth} strokeLinecap="round" {...markers} />
              {edge.label && (
                <text x={edgeGeometry.labelX} y={edgeGeometry.labelY} textAnchor="middle" fill="#E5E7EB" fontSize="15">
                  {parseInlineBoldSegments(edge.label).map((segment, idx) => (
                    <tspan key={idx} style={segment.bold ? { fontWeight: 700 } : undefined}>
                      {segment.text}
                    </tspan>
                  ))}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {nodes.map((node: GraphNode) => {
        const rect = rects.get(node.id);
        if (!rect) return null;
        const centerValue = node.value ?? "";
        const highlightOverlayStyle = buildHighlightOverlayStyle(node, { borderWidth, borderRadius: 4 });

        return (
          <GraphNodeItem
            key={node.id}
            node={node}
            top={rect.y}
            left={rect.x}
            width={rect.width}
            height={rect.height}
            disableAnimations={disableAnimations}
          >
            <div
              className="relative w-full h-full text-white font-normal rounded px-2 text-sm"
              style={{
                ...buildItemBoxStyle(node, { borderWidth }),
              }}
            >
              {node.leftAlignedValue && (
                <div className="absolute top-0 left-0 ml-1">
                  <span className="text-xs">
                    {node.leftAlignedValue.split("\n").map((line, idx) => (
                      <div key={idx}>{renderLineWithInlineBold(line)}</div>
                    ))}
                  </span>
                </div>
              )}

              <div className="absolute inset-0 flex justify-center items-center flex-col text-sm">
                {centerValue.split("\n").map((line, idx) => (
                  <div key={idx}>{renderLineWithInlineBold(line)}</div>
                ))}
              </div>

              {node.rightAlignedValue && (
                <div className="absolute right-0 mr-1">
                  <span className="text-sm">
                    {node.rightAlignedValue.split("\n").map((line, idx) => (
                      <div key={idx}>{renderLineWithInlineBold(line)}</div>
                    ))}
                  </span>
                </div>
              )}
              {highlightOverlayStyle && <div style={highlightOverlayStyle} />}
            </div>
          </GraphNodeItem>
        );
      })}
    </div>
  );
}
