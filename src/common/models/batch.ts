import type { ControlItem } from "./controlItem";
import type { GraphEdge, GraphNode } from "./graph";
import type { GridItem } from "./griditem";
import type { HighlightLine } from "./highlightLine";

export interface BatchTiming {
  now?: boolean;
  animateNow?: boolean;
}

export type BatchItemInput<T extends ControlItem> = Partial<T>;

export interface IndexedBatchMutation<T extends ControlItem>
  extends BatchTiming {
  input: BatchItemInput<T>;
  index: number;
}

export interface InsertBatchMutation<T extends ControlItem>
  extends BatchTiming {
  input?: BatchItemInput<T>;
  childId?: string;
  index?: number;
}

export interface EndBatchMutation<T extends ControlItem>
  extends BatchTiming {
  input?: BatchItemInput<T>;
  childId?: string;
}

export interface IndexedRemoval extends BatchTiming {
  index: number;
  collapse?: boolean;
}

export interface EndRemoval extends BatchTiming {
  count: number;
  collapse?: boolean;
}

export type SetValuesTarget = "current" | "outgoing" | "all";

export interface IndexedSetValues<T extends ControlItem> {
  input: Partial<T>;
  index: number;
  target?: SetValuesTarget;
}

export interface EndSetValues<T extends ControlItem> {
  input: Partial<T>;
  target?: SetValuesTarget;
}

export interface GraphNodeDelete {
  id: string;
  now?: boolean;
  animateNow?: boolean;
}

export interface ClearHighlight {
  range: string;
  backgroundColor?: boolean;
  borderColor?: boolean;
}

export interface Batch<T extends ControlItem = ControlItem> {
  inserts?: InsertBatchMutation<T>[];
  headInserts?: EndBatchMutation<T>[];
  tailInserts?: EndBatchMutation<T>[];
  updates?: IndexedBatchMutation<T>[];
  deletes?: IndexedRemoval[];
  headDeletes?: EndRemoval;
  tailDeletes?: EndRemoval;
  headTakes?: EndRemoval;
  tailTakes?: EndRemoval;
  takes?: IndexedRemoval[];
  setHeadValues?: EndSetValues<T>[];
  setTailValues?: EndSetValues<T>[];
  setValues?: IndexedSetValues<T>[];
  step?: number;
  // For code controls and other static text controls: patch line highlighting in place.
  highlightLines?: HighlightLine[];
  clearHighlights?: ClearHighlight[];
  // For StaticText controls: keep this line number visible at the bottom of the scroll viewport.
  scrollBottom?: number;
  gridItems?: GridItem[];
  graphNodes?: GraphNode[];
  graphEdges?: GraphEdge[];
  graphNodeDeletes?: GraphNodeDelete[];
  graphEdgeDeletes?: string[];
}
