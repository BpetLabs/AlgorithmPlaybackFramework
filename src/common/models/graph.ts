import { ControlItemState, ControlItemValues } from "./controlItem";

export type GraphArrowMode = "none" | "both" | "next" | "prev";
export type GraphEdgeRoute = "direct" | "loopTop" | "loopBottom";
export type GraphNodeState = ControlItemState;
export type GraphEdgeAnchor =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "upperLeft"
  | "upperRight"
  | "lowerLeft"
  | "lowerRight";

export interface GraphTrackSizing {
  values?: number[];
}

export interface GraphLayout {
  columns?: number;
  rows?: number;
  paddingX?: number; // 0..1 of container width
  paddingY?: number; // 0..1 of container height
  offsetX?: number; // Fraction of container width; negative moves the graph left
  offsetY?: number; // Fraction of container height; negative moves the graph up
  colGap?: number; // 0..1 of inner width
  rowGap?: number; // 0..1 of inner height
  columnSizing?: GraphTrackSizing;
  rowSizing?: GraphTrackSizing;
}

export interface GraphRendererOptions {
  showCellBorders?: boolean;
}

export interface GraphNode extends ControlItemValues {
  id: string;
  state?: GraphNodeState;
  previousState?: GraphNodeState;
  column: number;
  row: number;
  columnSpan?: number;
  rowSpan?: number;
  itemWidthScale?: number;
  itemHeightScale?: number;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  fromAnchor?: GraphEdgeAnchor;
  toAnchor?: GraphEdgeAnchor;
  arrow?: GraphArrowMode;
  route?: GraphEdgeRoute;
  loopOffset?: number;
  color?: string;
  label?: string;
  width?: number;
}
