import {
  ArrayOrientation,
  ArrayRendererOptions,
} from "../common/models/arrayControl";
import {
  ControlItem,
  ControlItemState,
} from "../common/models/controlItem";
import {
  Snapshot,
  LoadedControl,
  ControlRenderConfig,
  ControlRenderBatch,
} from "../common/models/snapshot";
import { BatchProcessor } from "./batchProcessor";
import type { Batch } from "../common/models/batch";
import { GridRendererOptions } from "../common/models/gridControl";
import { GraphRendererOptions } from "../common/models/graph";
import { resolveHighlightAliases } from "./resolveHighlightAliases";

function mergeRenderConfig(
  base: ControlRenderConfig | undefined,
  override: ControlRenderConfig | undefined
): ControlRenderConfig {
  return {
    ...base,
    ...override,
    layout: {
      ...(base?.layout ?? {}),
      ...(override?.layout ?? {}),
    },
  };
}

interface ChildDefaults extends Omit<ArrayRendererOptions, "orientation"> {
  orientation?: never;
  render?: ControlRenderConfig;
}

const jaggedSetActions = new Set([
  "setValues",
  "setHeadValues",
  "setTailValues",
]);

const jaggedImmediateActions = new Set([
  "inserts",
  "headInserts",
  "tailInserts",
  "updates",
  "deletes",
  "headDeletes",
  "tailDeletes",
  "takes",
  "headTakes",
  "tailTakes",
]);

function validateJaggedArrayBatches<T extends ControlItem>(
  control: ControlDefinition<T>,
  isJaggedContainer: boolean
) {
  control.batches?.forEach((batch) => {
    Object.entries(batch).forEach(([action, value]) => {
      if (action === "step" || action === "render") {
        return;
      }
      const operations = Array.isArray(value) ? value : [value];
      const hasDisplayedValue = operations.some((operation) => {
        const input = operation?.input;
        return [
          input?.value,
          input?.leftAlignedValue,
          input?.rightAlignedValue,
        ].some((displayValue) =>
          displayValue !== undefined && displayValue !== ""
        );
      });

      if (jaggedSetActions.has(action)) {
        if (isJaggedContainer && hasDisplayedValue) {
          throw new Error(
            `Jagged array "${control.id}" cannot store values directly; add values to a leaf array instead.`
          );
        }
        return;
      }
      if (!jaggedImmediateActions.has(action)) {
        throw new Error(
          `Control "${control.id}" in a jagged array does not support batch action "${action}" at step ${batch.step ?? 0}.`
        );
      }

      if (operations.some((operation) => operation?.animateNow === true)) {
        throw new Error(
          `Control "${control.id}" in a jagged array does not support animateNow for batch action "${action}" at step ${batch.step ?? 0}.`
        );
      }
      if (operations.some((operation) => operation?.now !== true)) {
        throw new Error(
          `Control "${control.id}" in a jagged array requires now: true for batch action "${action}" at step ${batch.step ?? 0}.`
        );
      }
      if (isJaggedContainer && action === "updates") {
        throw new Error(
          `Jagged array "${control.id}" cannot update child containers; only empty child containers may be inserted or removed.`
        );
      }
      if (
        isJaggedContainer &&
        ["inserts", "headInserts", "tailInserts"].includes(action) &&
        hasDisplayedValue
      ) {
        throw new Error(
          `Jagged array "${control.id}" cannot insert value-bearing items; only empty child containers may be inserted. Add values to a leaf array instead.`
        );
      }
    });
  });
}

export interface ControlDefinition<T extends ControlItem = ControlItem>
  extends ArrayRendererOptions, GridRendererOptions, GraphRendererOptions {
  id: string;
  type?: string;
  staticValue?: string;
  render?: ControlRenderConfig;
  renderBatches?: ControlRenderBatch[];
  initialItemCount?: number;
  initialItemDefaults?: Partial<T>;
  batches?: (Batch<T> & { render?: ControlRenderConfig })[];
  childDefaults?: ChildDefaults;
}

function getRendererOptions(
  control: ArrayRendererOptions & GridRendererOptions & GraphRendererOptions,
  type: string
): ArrayRendererOptions & GridRendererOptions & GraphRendererOptions {
  return {
    orientation:
      type === "array" || type === "jaggedArray"
        ? control.orientation ?? "horizontal"
        : control.orientation,
    childGap: control.childGap,
    childWidth: control.childWidth,
    childHeight: control.childHeight,
    defaultItemOffset: control.defaultItemOffset,
    itemGap: control.itemGap,
    itemCrossAxisGap: control.itemCrossAxisGap,
    itemWidth: control.itemWidth,
    itemHeight: control.itemHeight,
    preInsertGap: control.preInsertGap,
    emptyItemText: control.emptyItemText,
    itemLabels: control.itemLabels,
    showCellBorders: control.showCellBorders,
    fitContent: control.fitContent,
    rows: control.rows,
    cols: control.cols,
    rowDescription: control.rowDescription,
    columnDescription: control.columnDescription,
    rowLabels: control.rowLabels,
    columnLabels: control.columnLabels,
    gridLines: control.gridLines,
  };
}

function buildLoadedControl<T extends ControlItem>(
  control: ControlDefinition<T>,
  type: string,
  parentId?: string,
  parentIndex?: number,
  restrictJaggedMutations = false
): LoadedControl<T> {
  if (restrictJaggedMutations) {
    validateJaggedArrayBatches(control, type === "jaggedArray");
  }

  const processor = new BatchProcessor<T>(
    control.id,
    type,
    control.initialItemCount,
    control.initialItemDefaults
  );
  control.batches?.forEach((batch) => processor.applyBatch(batch));

  const snapshots: Snapshot<T>[] = processor.getHistory();
  const renderBatchOverrides: ControlRenderBatch[] = [
    ...(control.renderBatches ?? []),
    ...((control.batches ?? [])
      .filter((batch) => typeof batch.step === "number" && batch.render)
      .map((batch) => ({
        step: batch.step as number,
        render: batch.render as ControlRenderConfig,
      }))),
  ].sort((a, b) => a.step - b.step);

  const renderByStep: Record<number, ControlRenderConfig> = {};
  let renderState: ControlRenderConfig = mergeRenderConfig(
    undefined,
    control.render
  );
  let batchIndex = 0;

  snapshots
    .slice()
    .sort((a, b) => a.step - b.step)
    .forEach((snapshot) => {
      while (
        batchIndex < renderBatchOverrides.length &&
        renderBatchOverrides[batchIndex].step <= snapshot.step
      ) {
        renderState = mergeRenderConfig(
          renderState,
          renderBatchOverrides[batchIndex].render
        );
        batchIndex += 1;
      }
      renderByStep[snapshot.step] = mergeRenderConfig(undefined, renderState);
    });

  return {
    id: control.id,
    type,
    staticValue: control.staticValue ?? "",
    snapshots,
    render: control.render,
    renderByStep,
    rendererOptions: getRendererOptions(control, type),
    parentId,
    parentIndex,
  };
}

function validateJaggedContainerRemovals<T extends ControlItem>(
  control: ControlDefinition<T>,
  loaded: LoadedControl<T>
) {
  type Slot = { child?: LoadedControl<T> };
  const childByIndex = new Map(
    (loaded.childControls ?? []).map((child) => [child.parentIndex, child])
  );
  let slots: Slot[] = Array.from(
    { length: loaded.snapshots[0]?.items.length ?? 0 },
    (_, index) => ({ child: childByIndex.get(index) })
  );

  const isChildEmptyAtStep = (child: LoadedControl<T>, step: number) => {
    const snapshot = child.snapshots
      .filter((candidate) => candidate.step <= step)
      .at(-1) ?? child.snapshots[0];
    return !snapshot?.items.some(
      (item) =>
        item.state !== ControlItemState.Empty &&
        item.state !== ControlItemState.Removed
    );
  };

  control.batches?.forEach((batch) => {
    const step = batch.step ?? 0;
    const beforeRemoval = [...slots];
    const removedSlots = new Set<Slot>();
    batch.deletes?.forEach(({ index }) => {
      if (beforeRemoval[index]) removedSlots.add(beforeRemoval[index]);
    });
    batch.takes?.forEach(({ index }) => {
      if (beforeRemoval[index]) removedSlots.add(beforeRemoval[index]);
    });
    const addEndRemoval = (
      removal: { count: number } | undefined,
      fromHead: boolean
    ) => {
      if (!removal) return;
      for (let offset = 0; offset < removal.count; offset += 1) {
        const index = fromHead
          ? offset
          : beforeRemoval.length - offset - 1;
        if (beforeRemoval[index]) removedSlots.add(beforeRemoval[index]);
      }
    };
    addEndRemoval(batch.headDeletes, true);
    addEndRemoval(batch.tailDeletes, false);
    addEndRemoval(batch.headTakes, true);
    addEndRemoval(batch.tailTakes, false);

    removedSlots.forEach((slot) => {
      if (slot.child && !isChildEmptyAtStep(slot.child, step)) {
        throw new Error(
          `Jagged array "${control.id}" cannot remove non-empty child "${slot.child.id}" at step ${step}; remove its leaf nodes first.`
        );
      }
    });
    slots = slots.filter((slot) => !removedSlots.has(slot));

    batch.headInserts?.forEach(() => slots.unshift({}));
    batch.tailInserts?.forEach(() => slots.push({}));
    batch.inserts?.forEach(({ index }) => {
      const insertIndex = index ?? slots.length;
      while (slots.length < insertIndex) slots.push({});
      slots.splice(insertIndex, 0, {});
    });
  });
}

function buildJaggedChildDefinition<T extends ControlItem>(
  parent: ControlDefinition<T>,
  index: number,
  explicitChild: ControlDefinition<T>
): ControlDefinition<T> {
  const defaults = parent.childDefaults ?? {};
  const parentOrientation: ArrayOrientation =
    parent.orientation ?? "horizontal";
  const childOrientation: ArrayOrientation =
    parentOrientation === "horizontal" ? "vertical" : "horizontal";

  return {
    ...defaults,
    ...explicitChild,
    id: `${parent.id}-${index}`,
    type: explicitChild.type ?? "array",
    orientation: childOrientation,
    render: mergeRenderConfig(defaults.render, explicitChild?.render),
  };
}

export function loadControls<T extends ControlItem = ControlItem>(
  controlsFromJson: ControlDefinition<T>[]
): LoadedControl<T>[] {
  const resolvedControls = resolveHighlightAliases(controlsFromJson);

  if (!Array.isArray(resolvedControls)) {
    throw new Error("Controls must be provided as an array.");
  }

  const controlIds = new Set<string>();
  resolvedControls.forEach((control, index) => {
    if (!control || typeof control !== "object") {
      throw new Error(`Control at index ${index} must be an object.`);
    }
    if (typeof control.id !== "string" || control.id.trim().length === 0) {
      throw new Error(`Control at index ${index} must have a non-empty id.`);
    }
    if (controlIds.has(control.id)) {
      throw new Error(`Duplicate control id "${control.id}".`);
    }
    if (
      control.type === "jaggedArray" &&
      control.orientation !== undefined &&
      control.orientation !== "horizontal" &&
      control.orientation !== "vertical"
    ) {
      throw new Error(
        `Jagged array "${control.id}" orientation must be "horizontal" or "vertical".`
      );
    }
    if (
      control.type === "jaggedArray" &&
      control.childDefaults?.orientation !== undefined
    ) {
      throw new Error(
        `Jagged array "${control.id}" childDefaults cannot set orientation because descendants alternate automatically.`
      );
    }
    controlIds.add(control.id);
  });

  const attachedChildIds = new Set<string>();
  const jaggedChildrenByParent = new Map<
    string,
    { index: number; definition: ControlDefinition<T> }[]
  >();

  resolvedControls
    .filter((control) => control.type === "jaggedArray")
    .forEach((parent) => {
      const prefix = `${parent.id}-`;
      const children = resolvedControls
        .filter((candidate) => candidate.id.startsWith(prefix))
        .flatMap((candidate) => {
          const suffix = candidate.id.slice(prefix.length);
          if (!/^(0|[1-9]\d*)$/.test(suffix)) return [];

          return [{
            index: Number(suffix),
            definition: candidate,
          }];
        })
        .sort((a, b) => a.index - b.index);

      const childIndexes = new Set<number>();
      children.forEach((child) => {
        if (childIndexes.has(child.index)) {
          throw new Error(
            `Jagged array "${parent.id}" has multiple children for index ${child.index}.`
          );
        }
        if (child.definition.orientation !== undefined) {
          throw new Error(
            `Control "${child.definition.id}" cannot set orientation because jagged-array descendants alternate automatically.`
          );
        }
        childIndexes.add(child.index);
        attachedChildIds.add(child.definition.id);
      });

      jaggedChildrenByParent.set(parent.id, children);
    });

  const buildControlTree = (
    control: ControlDefinition<T>,
    parentId?: string,
    parentIndex?: number,
    isJaggedDescendant = false
  ): LoadedControl<T> => {
    const type = control.type ?? "array";
    const restrictJaggedMutations =
      isJaggedDescendant || type === "jaggedArray";
    const children = jaggedChildrenByParent.get(control.id) ?? [];
    const requiredItemCount = children.length
      ? children[children.length - 1].index + 1
      : 0;
    const resolvedControl =
      type === "jaggedArray"
        ? {
            ...control,
            initialItemCount: Math.max(
              control.initialItemCount ?? 0,
              requiredItemCount
            ),
          }
        : control;
    const loaded = buildLoadedControl(
      resolvedControl,
      type,
      parentId,
      parentIndex,
      restrictJaggedMutations
    );

    if (type !== "jaggedArray") return loaded;

    loaded.childControls = children.map(({ index, definition }) => {
      const childDefinition = buildJaggedChildDefinition(
        control,
        index,
        definition
      );
      return buildControlTree(childDefinition, control.id, index, true);
    });
    validateJaggedContainerRemovals(resolvedControl, loaded);

    return loaded;
  };

  return resolvedControls
    .filter((control) => !attachedChildIds.has(control.id))
    .map((control) => buildControlTree(control));
}
