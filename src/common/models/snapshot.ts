import { ControlItem } from "./controlItem";
import { GraphEdge, GraphNode } from "./graph";
import { GridItem } from "./griditem";
import { HighlightLine } from "./highlightLine";
import { ArrayRendererOptions } from "./arrayControl";
import { GridRendererOptions } from "./gridControl";

export interface Snapshot<T> {
  id: string;
  type: string;
  step: number;
  items: T[];
  highlightLines?: HighlightLine[];
  // For StaticText controls: line number to keep visible at the bottom of the viewport.
  scrollBottom?: number;
  gridItems?: GridItem[];
  graphNodes?: GraphNode[];
  graphEdges?: GraphEdge[];
}

export interface ControlRenderLayout {
  top?: number;
  left?: number;
  width?: number;
  height?: number;
}

export interface ControlRenderConfig {
  visible?: boolean;
  layout?: ControlRenderLayout;
  title?: string;
  showTitle?: boolean;
  borderWidth?: number;
}

export interface ControlRenderBatch {
  step: number;
  render: ControlRenderConfig;
}

export interface LoadedControl<T = ControlItem> {
  id: string;
  type: string;
  staticValue: string;       // static data, e.g., a code snippet
  snapshots: Snapshot<T>[];  // all historical snapshots for this control
  render?: ControlRenderConfig;
  renderByStep?: Record<number, ControlRenderConfig>;
  rendererOptions?: ArrayRendererOptions & GridRendererOptions;
  parentId?: string;
  parentIndex?: number;
  childControls?: LoadedControl<T>[];
}
