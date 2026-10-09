import {
  ArrayOrientation,
  ArrayRendererOptions,
} from "../common/models/arrayControl";
import { ControlItem } from "../common/models/controlItem";
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

interface ChildDefaults extends ArrayRendererOptions {
  render?: ControlRenderConfig;
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
  parentIndex?: number
): LoadedControl<T> {
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

function buildJaggedChildDefinition<T extends ControlItem>(
  parent: ControlDefinition<T>,
  index: number,
  explicitChild: ControlDefinition<T>
): ControlDefinition<T> {
  const defaults = parent.childDefaults ?? {};
  const inheritedOrientation: ArrayOrientation =
    defaults.orientation ?? parent.orientation ?? "horizontal";

  return {
    ...defaults,
    ...explicitChild,
    id: `${parent.id}-${index}`,
    type: "array",
    // Child orientation is global and cannot vary by row.
    orientation: inheritedOrientation,
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
        childIndexes.add(child.index);
        attachedChildIds.add(child.definition.id);
      });

      jaggedChildrenByParent.set(parent.id, children);
    });

  return resolvedControls
    .filter((control) => !attachedChildIds.has(control.id))
    .map((control) => {
      const type = control.type ?? "array";
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
      const loaded = buildLoadedControl(resolvedControl, type);

      if (type !== "jaggedArray") return loaded;

      loaded.childControls = children.map(({ index, definition }) => {
        const childDefinition = buildJaggedChildDefinition(
          control,
          index,
          definition
        );
        return buildLoadedControl(
          childDefinition,
          "array",
          control.id,
          index
        );
      });

      return loaded;
    });
}
