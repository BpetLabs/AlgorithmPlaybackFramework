import { ControlItem, ControlItemState, isPreRemovingState, isRemovingState } from "../common/models/controlItem";
import { GraphEdge, GraphNode } from "../common/models/graph";
import { Snapshot } from "../common/models/snapshot";
import { GridItem } from "../common/models/griditem";
import { HighlightLine, parseHighlightRanges } from "../common/models/highlightLine";
import {
  Batch,
  BatchTiming,
  ClearHighlight,
  EndBatchMutation,
  EndRemoval,
  IndexedRemoval,
  InsertBatchMutation,
  SetValuesTarget,
} from "../common/models/batch";

type RemovalKey =
  | "deletes"
  | "headDeletes"
  | "tailDeletes"
  | "takes"
  | "headTakes"
  | "tailTakes";

const preRemoveStateByKey: Record<RemovalKey, ControlItemState> = {
  deletes: ControlItemState.PreRemoveInsert,
  headDeletes: ControlItemState.PreRemoveHead,
  tailDeletes: ControlItemState.PreRemoveTail,
  takes: ControlItemState.PreRemoveTake,
  headTakes: ControlItemState.PreRemoveTake,
  tailTakes: ControlItemState.PreRemoveTake,
};

const removingStateByKey: Record<RemovalKey, ControlItemState> = {
  deletes: ControlItemState.RemovingInsert,
  headDeletes: ControlItemState.RemovingHead,
  tailDeletes: ControlItemState.RemovingTail,
  takes: ControlItemState.RemovingTake,
  headTakes: ControlItemState.RemovingTake,
  tailTakes: ControlItemState.RemovingTake,
};

type HighlightState = {
  backgroundColor?: string;
  borderColor?: string;
};

function normalizeHighlightValue(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

function buildHighlightStateMap(highlights: HighlightLine[]): Map<number, HighlightState> {
  const lineStates = new Map<number, HighlightState>();

  highlights.forEach((highlight) => {
    const state: HighlightState = {
      backgroundColor: normalizeHighlightValue(highlight.backgroundColor),
      borderColor: normalizeHighlightValue(highlight.borderColor),
    };

    if (!state.backgroundColor && !state.borderColor) {
      return;
    }

    parseHighlightRanges(highlight.range).forEach(({ start, end }) => {
      for (let line = start; line <= end; line++) {
        lineStates.set(line, { ...state });
      }
    });
  });

  return lineStates;
}

function compressHighlightStateMap(
  lineStates: Map<number, HighlightState>,
  createId: () => string
): HighlightLine[] {
  const sortedLines = [...lineStates.entries()]
    .filter(([, state]) => state.backgroundColor || state.borderColor)
    .sort(([a], [b]) => a - b);

  const highlights: HighlightLine[] = [];
  let currentStart: number | null = null;
  let currentEnd: number | null = null;
  let currentState: HighlightState | null = null;

  const flush = () => {
    if (currentStart === null || currentEnd === null || !currentState) return;
    highlights.push({
      id: createId(),
      range: currentStart === currentEnd ? `${currentStart}` : `${currentStart}-${currentEnd}`,
      backgroundColor: currentState.backgroundColor,
      borderColor: currentState.borderColor,
    });
  };

  sortedLines.forEach(([line, state]) => {
    const matchesCurrent =
      currentState &&
      currentEnd !== null &&
      line === currentEnd + 1 &&
      currentState.backgroundColor === state.backgroundColor &&
      currentState.borderColor === state.borderColor;

    if (matchesCurrent) {
      currentEnd = line;
      return;
    }

    flush();
    currentStart = line;
    currentEnd = line;
    currentState = { ...state };
  });

  flush();
  return highlights;
}

function mergeHighlightLines(
  previous: HighlightLine[],
  incoming: HighlightLine[],
  clears: ClearHighlight[],
  createId: () => string,
): HighlightLine[] {
  const lineStates = buildHighlightStateMap(previous);

  clears.forEach((clear) => {
    const clearBackground = clear.backgroundColor ?? (!clear.backgroundColor && !clear.borderColor);
    const clearBorder = clear.borderColor ?? (!clear.backgroundColor && !clear.borderColor);

    parseHighlightRanges(clear.range).forEach(({ start, end }) => {
      for (let line = start; line <= end; line++) {
        const nextState = { ...(lineStates.get(line) ?? {}) };

        if (clearBackground) {
          nextState.backgroundColor = undefined;
        }

        if (clearBorder) {
          nextState.borderColor = undefined;
        }

        if (!nextState.backgroundColor && !nextState.borderColor) {
          lineStates.delete(line);
        } else {
          lineStates.set(line, nextState);
        }
      }
    });
  });

  incoming.forEach((highlight) => {
    parseHighlightRanges(highlight.range).forEach(({ start, end }) => {
      for (let line = start; line <= end; line++) {
        const nextState = { ...(lineStates.get(line) ?? {}) };

        if (Object.prototype.hasOwnProperty.call(highlight, "backgroundColor")) {
          nextState.backgroundColor = normalizeHighlightValue(highlight.backgroundColor);
        }

        if (Object.prototype.hasOwnProperty.call(highlight, "borderColor")) {
          nextState.borderColor = normalizeHighlightValue(highlight.borderColor);
        }

        if (!nextState.backgroundColor && !nextState.borderColor) {
          lineStates.delete(line);
        } else {
          lineStates.set(line, nextState);
        }
      }
    });
  });

  return compressHighlightStateMap(lineStates, createId);
}

export class BatchProcessor<T extends ControlItem> {
  private snapshots: Snapshot<T>[] = [];
  private uniqueIdCounter = 0;

  private createId(prefix: string): string {
    return `${prefix}-${this.uniqueIdCounter++}`;
  }

  private isSnapshotDebugEnabled(): boolean {
    const g = globalThis as typeof globalThis & {
      __UICONTROLS_DEBUG_SNAPSHOT?: boolean;
      localStorage?: Storage;
    };
    const runtimeFlag = Boolean(g.__UICONTROLS_DEBUG_SNAPSHOT);
    if (runtimeFlag) return true;
    try {
      return g.localStorage?.getItem("uicontrols.debug.snapshot") === "1";
    } catch {
      return false;
    }
  }

  private summarizeGraphNode(node: GraphNode) {
    return {
      id: node.id,
      state: node.state ?? "",
      previousState: node.previousState ?? "",
      row: node.row,
      column: node.column,
      value: node.value ?? "",
      borderColor: node.borderColor ?? "",
      backgroundColor: node.backgroundColor ?? "",
    };
  }

  private summarizeControlItem(item: T) {
    return {
      id: item.id,
      state: item.state ?? "",
      previousState: item.previousState ?? "",
      value: item.value ?? "",
      linkId: item.linkId ?? "",
      collapse: item.collapse ?? "",
    };
  }

  constructor(
    private id: string,
    private type: string,
    initialItemCount = 0,
    initialItemDefaults: Partial<T> = {}
  ) {
    if (!Number.isInteger(initialItemCount) || initialItemCount < 0) {
      throw new Error(
        `Control "${this.id}" initialItemCount must be a non-negative integer.`
      );
    }

    const items: T[] = Array.from({ length: initialItemCount }, () => ({
      id: this.createId("item"),
      state: ControlItemState.Initial,
      ...initialItemDefaults,
    } as T));

    this.snapshots.push({
      id: this.id,
      type: this.type,
      step: 0,
      items
    });
  }

  private get currentSnapshot(): T[] {
    return this.snapshots[this.snapshots.length - 1].items;
  }

  private cloneCurrent(): T[] {
    return this.currentSnapshot.map(item => ({ ...item }));
  }

  private createEmptyItem(): T {
    return {
      id: this.createId("item"),
      state: ControlItemState.Empty,
    } as T;
  }

  private ensureIndexableSlot(snapshot: T[], index: number): T {
    if (!Number.isInteger(index)) throw new Error(`Invalid index ${index}`);
    if (index < 0) throw new Error(`Invalid index ${index}`);

    let indexableItems = this.getIndexableItems(snapshot);

    const missingSlots = index - indexableItems.length + 1;
    for (let slot = 0; slot < missingSlots; slot++) {
      snapshot.push(this.createEmptyItem());
    }

    if (missingSlots > 0) {
      indexableItems = this.getIndexableItems(snapshot);
    }

    return indexableItems[index];
  }

  // Unified slot indexing model used by all index-based operations.
  // - Keep non-removed items indexable.
  // - Exclude removing items only when they are collapsing.
  // - Exclude superseded empty placeholders.
  private getIndexableItems(snapshot: T[]): T[] {
    const activeLinkCounts = new Map<string, number>();
    snapshot.forEach((item) => {
      if (!item.linkId || item.state === ControlItemState.Removed) return;
      activeLinkCounts.set(
        item.linkId,
        (activeLinkCounts.get(item.linkId) ?? 0) + 1
      );
    });

    return snapshot.filter(item =>
      item.state !== ControlItemState.Removed &&
      (!isRemovingState(item.state) || item.collapse === false) &&
      !(
        item.state === ControlItemState.Empty &&
        item.linkId &&
        (activeLinkCounts.get(item.linkId) ?? 0) > 1
      )
    );
  }

  // STEP 0 — advance old Removing* → Removed
  private advanceRemovingStates(snapshot: T[]) {
    snapshot.forEach(item => {
      if (isRemovingState(item.state)) {
        item.state = ControlItemState.Removed;

        // Dont remove to keep the item in place
        if(item.collapse === false)
        {
          item.state = ControlItemState.Empty;
        }
      }

      // Remove
      if(item.collapse === true && item.state === ControlItemState.Empty) {
        item.state = ControlItemState.Removed
      }
    });
  }

  // STEP 1 — advance Pre* → Inserted / Removing*
  private advancePreStates(snapshot: T[], prevStateAlreadySet: Set<string>) {
    const preRemoveMap: Partial<Record<ControlItemState, ControlItemState>> = {
      [ControlItemState.PreRemoveInsert]: ControlItemState.RemovingInsert,
      [ControlItemState.PreRemoveUpdate]: ControlItemState.RemovingUpdate,
      [ControlItemState.PreRemoveHead]: ControlItemState.RemovingHead,
      [ControlItemState.PreRemoveTail]: ControlItemState.RemovingTail,
      [ControlItemState.PreRemoveTake]: ControlItemState.RemovingTake,
    };

    snapshot.forEach(item => {
      if (preRemoveMap[item.state] !== undefined) {
        item.previousState = item.state;
        item.state = preRemoveMap[item.state]!;
        prevStateAlreadySet.add(item.id);
        return;
      }

      if ([
        ControlItemState.PreInsert,
        ControlItemState.PreHead,
        ControlItemState.PreTail,
        ControlItemState.PreUpdate,
      ].includes(item.state)) {
        item.previousState = item.state;
        item.state = ControlItemState.Inserted;
        prevStateAlreadySet.add(item.id);
      }
    });
  }

  // STEP 2 — handle deletes / takes
  private applyDeletesAndTakes(snapshot: T[], batch: Batch<T>, prevStateAlreadySet: Set<string>) {
    const visibleItems = this.getIndexableItems(snapshot);
    const visibleLen = visibleItems.length;

    const handleRemove = (
      key: RemovalKey,
      node: T,
      operation: BatchTiming & { collapse?: boolean }
    ) => {
      const previousStateAlreadySet = prevStateAlreadySet.has(node.id);
      if (!previousStateAlreadySet) node.previousState = node.state;
      node.linkId = node.linkId ?? node.id;
      node.state = operation.animateNow
        ? removingStateByKey[key]
        : preRemoveStateByKey[key];
      if (operation.animateNow && !previousStateAlreadySet) {
        node.previousState = preRemoveStateByKey[key];
      }
      node.collapse = operation.collapse;

      if (operation.now) {
        const index = snapshot.findIndex((item) => item.id === node.id);
        if (index !== -1) snapshot.splice(index, 1);
      }
    };

    const applyIndexedRemovals = (
      key: "deletes" | "takes",
      operations: IndexedRemoval[] | undefined
    ) => {
      operations?.forEach((operation) => {
        if (!Number.isInteger(operation.index) || operation.index < 0) {
          throw new Error(`Invalid ${key} index ${operation.index}`);
        }
        const ref = visibleItems[operation.index];
        if (!ref) throw new Error(`Invalid ${key} index ${operation.index}`);
        const node = snapshot.find((item) => item.id === ref.id)!;
        handleRemove(key, node, operation);
      });
    };

    const applyEndRemoval = (
      key: Exclude<RemovalKey, "deletes" | "takes">,
      operation: EndRemoval | undefined,
      fromHead: boolean
    ) => {
      if (!operation) return;
      if (!Number.isInteger(operation.count) || operation.count < 0) {
        throw new Error(`Invalid ${key} count ${operation.count}`);
      }

      for (let index = 0; index < operation.count; index++) {
        const visibleIndex = fromHead ? index : visibleLen - index - 1;
        const ref = visibleItems[visibleIndex];
        if (!ref) throw new Error(`Invalid ${key} index ${index}`);
        const node = snapshot.find((item) => item.id === ref.id)!;
        handleRemove(key, node, operation);
      }
    };

    applyIndexedRemovals("deletes", batch.deletes);
    applyEndRemoval("headDeletes", batch.headDeletes, true);
    applyEndRemoval("tailDeletes", batch.tailDeletes, false);
    applyIndexedRemovals("takes", batch.takes);
    applyEndRemoval("headTakes", batch.headTakes, true);
    applyEndRemoval("tailTakes", batch.tailTakes, false);
  }

  // STEP 3 — handle updates and setValues
  private applyUpdates(snapshot: T[], batch: Batch<T>, prevStateAlreadySet: Set<string>) {
    const visibleItems = this.getIndexableItems(snapshot);
    const visibleLen = visibleItems.length;

    const applyValues = (input: Partial<T>, ref: T, initializeEmpty: boolean) => {
      const node = snapshot.find((item) => item.id === ref.id)!;
      if (!prevStateAlreadySet.has(node.id)) node.previousState = node.state;
      Object.assign(node, input);
      if (initializeEmpty && node.state === ControlItemState.Empty) {
        node.state = ControlItemState.Initial;
      }
    };

    const resolveSetValuesTargets = (
      ref: T | undefined,
      operation: "setValues" | "setHeadValues" | "setTailValues",
      index: number,
      target: SetValuesTarget
    ): T[] => {
      if (target === "current") {
        if (!ref) throw new Error(`Invalid ${operation} index ${index}`);
        return [ref];
      }

      const linkedOutgoing = ref?.linkId
        ? snapshot.filter((item) =>
            item.id !== ref.id &&
            item.linkId === ref.linkId &&
            isRemovingState(item.state)
          )
        : [];

      if (target === "outgoing") {
        if (linkedOutgoing.length > 0) return linkedOutgoing;

        const outgoing = snapshot.filter((item) => isRemovingState(item.state));
        if (outgoing.length !== 1) {
          throw new Error(`No outgoing item at ${operation} index ${index}`);
        }
        return outgoing;
      }

      if (target === "all") {
        if (!ref) throw new Error(`Invalid ${operation} index ${index}`);
        return [ref, ...linkedOutgoing];
      }

      throw new Error(`Invalid ${operation} target ${String(target)} at index ${index}`);
    };

    batch.setHeadValues?.forEach(({ input, target = "current" }, index) => {
      const ref = visibleItems[index];
      resolveSetValuesTargets(ref, "setHeadValues", index, target).forEach((targetRef) => {
        applyValues(input, targetRef, false);
      });
    });

    batch.setTailValues?.forEach(({ input, target = "current" }, index) => {
      const visibleIndex = visibleLen - index - 1;
      const ref = visibleItems[visibleIndex];
      resolveSetValuesTargets(ref, "setTailValues", index, target).forEach((targetRef) => {
        applyValues(input, targetRef, false);
      });
    });

    batch.setValues?.forEach(({ input, index, target = "current" }) => {
      const ref = target === "outgoing"
        ? this.getIndexableItems(snapshot)[index]
        : this.ensureIndexableSlot(snapshot, index);
      resolveSetValuesTargets(ref, "setValues", index, target).forEach((targetRef) => {
        applyValues(input, targetRef, true);
      });
    });

    const updateRefs = batch.updates?.map((update) => ({
      update,
      ref: this.ensureIndexableSlot(snapshot, update.index),
    }));

    updateRefs?.forEach(({ update: u, ref }) => {
      const nodeIndex = snapshot.findIndex(i => i.id === ref.id);
      const node = snapshot[nodeIndex];
      const now = u.now ?? false;
      const animateNow = u.animateNow ?? false;

      if (isPreRemovingState(node.state)) {
        // Allow a batch to explicitly remove an item and stage its replacement
        // in the same slot. The existing remove owns the outgoing animation;
        // this linked PreUpdate node owns the incoming animation.
        node.linkId = node.linkId ?? node.id;
        snapshot.splice(nodeIndex + 1, 0, {
          ...u.input,
          id: this.createId("item"),
          state: animateNow ? ControlItemState.Inserted : ControlItemState.PreUpdate,
          previousState: animateNow ? ControlItemState.PreUpdate : undefined,
          linkId: node.linkId,
        } as T);
        return;
      }
      if (now) {
        node.linkId = node.linkId ?? node.id;
        if (!prevStateAlreadySet.has(node.id)) node.previousState = node.state;

        if (node.state !== ControlItemState.Empty) {
          node.state = ControlItemState.Removed;
        }

        snapshot.splice(nodeIndex + 1, 0, {
          ...u.input,
          id: this.createId("item"),
          state: ControlItemState.Initial,
          linkId: node.linkId,
        } as T);
        return;
      }

      node.linkId = node.linkId ?? node.id;
      if (!prevStateAlreadySet.has(node.id)) node.previousState = node.state;
      if (!isRemovingState(node.state) && node.state != ControlItemState.Empty) {
        node.state = animateNow ? ControlItemState.RemovingUpdate : ControlItemState.PreRemoveUpdate;
        if (animateNow) {
          node.previousState = ControlItemState.PreRemoveUpdate;
        }
      }
      snapshot.splice(nodeIndex + 1, 0, {
        ...u.input,
        id: this.createId("item"),
        state: animateNow ? ControlItemState.Inserted : ControlItemState.PreUpdate,
        previousState: animateNow ? ControlItemState.PreUpdate : undefined,
        linkId: node.linkId,
      } as T);
    });
  }

  // STEP 4 — handle inserts
  private applyInserts(snapshot: T[], batch: Batch<T>) {
    const applyInsertOperations = (
      key: "headInserts" | "tailInserts" | "inserts",
      operations:
        | EndBatchMutation<T>[]
        | InsertBatchMutation<T>[]
        | undefined
    ) => {
      operations?.forEach((operation) => {
        const input = operation.input ?? {};
        const now = operation.now ?? false;
        const animateNow = operation.animateNow ?? false;
        let insertIndex = 0;
        if (key === 'headInserts') insertIndex = 0;
        else if (key === 'tailInserts') insertIndex = snapshot.length;
        else {
          const index = (operation as InsertBatchMutation<T>).index;
          if (index === undefined) {
            insertIndex = snapshot.length;
          } else {
            const ref = this.ensureIndexableSlot(snapshot, index);
            insertIndex = snapshot.findIndex(item => item.id === ref.id);
          }
        }

        const preState = key === 'headInserts' ? ControlItemState.PreHead :
          key === 'tailInserts' ? ControlItemState.PreTail : ControlItemState.PreInsert;
        let insertState = preState;

        if (now) {
          insertState = ControlItemState.Initial;
        } else if (animateNow) {
          insertState = ControlItemState.Inserted;
        }

        const insertedItem = {
          ...input,
          id: this.createId("item"),
          state: insertState,
          previousState: !now && animateNow ? preState : undefined,
        } as T;

        if (key === 'inserts' && snapshot[insertIndex]?.state === ControlItemState.Empty) {
          snapshot[insertIndex] = insertedItem;
        } else {
          snapshot.splice(insertIndex, 0, insertedItem);
        }
      });
    };

    applyInsertOperations("headInserts", batch.headInserts);
    applyInsertOperations("tailInserts", batch.tailInserts);
    applyInsertOperations("inserts", batch.inserts);
  }

  // STEP 5 — finalize and push snapshot
  private finalizeSnapshot(snapshot: T[], batch: Batch<T>, step: number) {
    const prevSnapshot = this.snapshots[this.snapshots.length - 1];

    const mergeById = <U extends { id?: string }>(previous: U[], incoming: U[], idPrefix: string): U[] => {
      const normalizedIncoming = incoming.map((item) => ({
        ...item,
        id: item.id ?? this.createId(idPrefix),
      }));
      const incomingById = new Map<string, U & { id: string }>();

      normalizedIncoming.forEach((item) => {
        if (incomingById.has(item.id)) {
          throw new Error(`Duplicate ${idPrefix} id "${item.id}".`);
        }
        incomingById.set(item.id, item);
      });

      const previousIds = new Set(
        previous.flatMap((item) => (item.id ? [item.id] : []))
      );
      const mergedPrevious = previous.map((item) => {
        const update = item.id ? incomingById.get(item.id) : undefined;
        return update ? { ...item, ...update } : { ...item };
      });
      const newItems = normalizedIncoming.filter(
        (item) => !previousIds.has(item.id)
      );

      return [...mergedPrevious, ...newItems] as U[];
    };

    const prevGridItems = prevSnapshot?.gridItems ?? [];
    const newGridItems = batch.gridItems ?? [];
    const mergedGridItems: GridItem[] = mergeById(prevGridItems, newGridItems, "grid");
    const graphEdgeDeleteIds = new Set(batch.graphEdgeDeletes ?? []);
    const graphNodeDeletes = batch.graphNodeDeletes ?? [];
    const graphNodeDeleteById = new Map(graphNodeDeletes.map(deleteOp => [deleteOp.id, deleteOp]));
    const graphNodeDeleteNowIds = new Set(
      graphNodeDeletes.filter(deleteOp => deleteOp.now).map(deleteOp => deleteOp.id)
    );

    // Graph nodes follow a two-step delete flow:
    // PreRemoveInPlace (shake) -> RemovingInPlace (fall/disappear) -> removed (next batch).
    const advancedPrevGraphNodes: GraphNode[] = [];
    for (const node of (prevSnapshot?.graphNodes ?? [])) {
      if (node.state === ControlItemState.RemovingInPlace) {
        continue;
      }
      if (node.state === ControlItemState.PreRemoveInPlace) {
        advancedPrevGraphNodes.push({
          ...node,
          previousState: ControlItemState.PreRemoveInPlace,
          state: ControlItemState.RemovingInPlace
        });
        continue;
      }
      advancedPrevGraphNodes.push({ ...node, previousState: undefined });
    }

    const newGraphNodes = batch.graphNodes ?? [];
    const mergedGraphNodes: GraphNode[] = mergeById(advancedPrevGraphNodes, newGraphNodes, "graph-node")
      .map(node => {
        const deleteOp = graphNodeDeleteById.get(node.id);
        if (!deleteOp) return node;
        if (deleteOp.now) return node;
        if (node.state === ControlItemState.PreRemoveInPlace || node.state === ControlItemState.RemovingInPlace) {
          return node;
        }
        if (deleteOp.animateNow) {
          return {
            ...node,
            previousState: ControlItemState.PreRemoveInPlace,
            state: ControlItemState.RemovingInPlace,
          };
        }
        return {
          ...node,
          previousState: node.state ?? ControlItemState.Initial,
          state: ControlItemState.PreRemoveInPlace,
        };
      })
      .filter(node => !graphNodeDeleteNowIds.has(node.id));

    const prevGraphEdges = (prevSnapshot?.graphEdges ?? []).filter(edge => !graphEdgeDeleteIds.has(edge.id));
    const newGraphEdges = (batch.graphEdges ?? []).filter(edge => !graphEdgeDeleteIds.has(edge.id));
    const mergedGraphEdges: GraphEdge[] = mergeById(prevGraphEdges, newGraphEdges, "graph-edge");
    const validGraphNodeIds = new Set(mergedGraphNodes.map(node => node.id));
    const cleanedGraphEdges = mergedGraphEdges.filter(
      edge => validGraphNodeIds.has(edge.from) && validGraphNodeIds.has(edge.to)
    );

    const prevHighlightLines = prevSnapshot?.highlightLines ?? [];
    const newHighlightLines = batch.highlightLines ?? [];
    const clearHighlightLines = batch.clearHighlights ?? [];
    const nextScrollBottom = batch.scrollBottom ?? prevSnapshot?.scrollBottom;
    const mergedHighlightLines = mergeHighlightLines(
      prevHighlightLines,
      newHighlightLines,
      clearHighlightLines,
      () => this.createId("line"),
    );

    const snapshotWithoutRemoved = snapshot.filter(item => item.state !== ControlItemState.Removed);

    this.snapshots.push({
      id: this.id,
      type: this.type,
      step,
      items: snapshotWithoutRemoved,
      highlightLines: mergedHighlightLines,
      scrollBottom: nextScrollBottom,
      gridItems: mergedGridItems,
      graphNodes: mergedGraphNodes,
      graphEdges: cleanedGraphEdges,
    });

    if (this.isSnapshotDebugEnabled()) {
      const itemRows = snapshotWithoutRemoved.map(item => this.summarizeControlItem(item));
      const graphRows = mergedGraphNodes.map(node => this.summarizeGraphNode(node));

      console.groupCollapsed(`[SnapshotDebug][${this.id}] step=${step} type=${this.type}`);
      console.log("counts", {
        items: itemRows.length,
        graphNodes: graphRows.length,
        graphEdges: cleanedGraphEdges.length,
      });
      console.log("batch", batch);
      console.log("items");
      console.table(itemRows);
      if (graphRows.length) {
        console.log("graphNodes");
        console.table(graphRows);
      }
      console.groupEnd();
    }
  }

  // 🚀 Main entry
  applyBatch(batch: Batch<T>) {
    if (!batch) return;

    const previousStep = this.snapshots[this.snapshots.length - 1].step;
    const step = batch.step ?? previousStep + 1;
    if (!Number.isInteger(step) || step < 0) {
      throw new Error(`Control "${this.id}" has an invalid batch step ${step}.`);
    }
    if (step < previousStep) {
      throw new Error(
        `Control "${this.id}" batch step ${step} cannot follow step ${previousStep}.`
      );
    }
    const snapshot = this.cloneCurrent();
    const prevStateAlreadySet = new Set<string>();

    // previousState is only meaningful for transitions in the current batch.
    snapshot.forEach(item => {
      item.previousState = undefined;
    });

    this.advanceRemovingStates(snapshot);
    this.advancePreStates(snapshot, prevStateAlreadySet);
    this.applyDeletesAndTakes(snapshot, batch, prevStateAlreadySet);
    this.applyUpdates(snapshot, batch, prevStateAlreadySet);
    this.applyInserts(snapshot, batch);
    this.finalizeSnapshot(snapshot, batch, step);
  }

  getHistory(): Snapshot<T>[] {
    return this.snapshots.map(snap => ({
      ...snap,
      items: snap.items.map(item => ({ ...item })),
      highlightLines: snap.highlightLines?.map((line) => ({ ...line })),
      gridItems: snap.gridItems?.map((item) => ({ ...item })),
      graphNodes: snap.graphNodes?.map((node) => ({ ...node })),
      graphEdges: snap.graphEdges?.map((edge) => ({ ...edge })),
    }));
  }
}
