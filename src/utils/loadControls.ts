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

interface ChildDefaults extends Omit<ArrayRendererOptions, "orientation"> {
  orientation?: never;
  render?: ControlRenderConfig;
}

const jaggedSetActions = new Set([
  "setValues",
  "setHeadValues",
  "setTailValues",
]);

const jaggedParentAppearanceProperties = new Set([
  "backgroundColor",
  "textColor",
  "borderColor",
  "borderWidth",
  "shake",
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
        if (isJaggedContainer) {
          const unsupportedProperty = operations
            .flatMap((operation) => Object.keys(operation?.input ?? {}))
            .find((property) => !jaggedParentAppearanceProperties.has(property));
          if (unsupportedProperty) {
            throw new Error(
              `Jagged array "${control.id}" set actions support parent-slot appearance properties only; "${unsupportedProperty}" is not allowed.`
            );
          }
        }
        return;
      }
      if (!jaggedImmediateActions.has(action)) {
        throw new Error(
          `Control "${control.id}" in a jagged array does not support batch action "${action}" at step ${batch.step ?? 0}.`
        );
      }

      if (
        isJaggedContainer &&
        ["inserts", "headInserts", "tailInserts"].includes(action) &&
        operations.some((operation) =>
          typeof operation?.childId !== "string" ||
          operation.childId.trim().length === 0
        )
      ) {
        throw new Error(
          `Jagged array "${control.id}" requires childId for every child insertion.`
        );
      }

      if (
        isJaggedContainer &&
        ["inserts", "headInserts", "tailInserts"].includes(action) &&
        hasDisplayedValue
      ) {
        throw new Error(
          `Jagged array "${control.id}" child insertions cannot contain displayed values; add values to a leaf array instead.`
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
          `Jagged array "${control.id}" cannot update child references; delete and insert the complete subtree instead.`
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
  children?: string[];
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
  restrictJaggedMutations = false,
  initialChildIds: string[] = []
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
  const batches = control.batches?.map((batch) =>
    type === "jaggedArray"
      ? {
          ...batch,
          inserts: batch.inserts?.map((operation) => ({
            ...operation,
            input: {
              ...(operation.input ?? {}),
              childId: operation.childId,
            } as Partial<T>,
          })),
          headInserts: batch.headInserts?.map((operation) => ({
            ...operation,
            input: {
              ...(operation.input ?? {}),
              childId: operation.childId,
            } as Partial<T>,
          })),
          tailInserts: batch.tailInserts?.map((operation) => ({
            ...operation,
            input: {
              ...(operation.input ?? {}),
              childId: operation.childId,
            } as Partial<T>,
          })),
        }
      : batch
  );
  batches?.forEach((batch) => processor.applyBatch(batch));

  const snapshots: Snapshot<T>[] = processor.getHistory();
  const initialChildByItemId = new Map(
    snapshots[0]?.items.flatMap((item, index) =>
      initialChildIds[index] ? [[item.id, initialChildIds[index]] as const] : []
    ) ?? []
  );
  snapshots.forEach((snapshot) => {
    snapshot.items.forEach((item) => {
      const childId = initialChildByItemId.get(item.linkId ?? item.id);
      if (childId) item.childId = childId;
    });
  });
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

function validateCompleteJaggedSubtree<T extends ControlItem>(
  control: LoadedControl<T>
) {
  if (control.type !== "jaggedArray") return;
  if (control.parentId && !control.childControls?.length) {
    throw new Error(
      `Jagged child "${control.id}" must declare a complete subtree ending in at least one leaf array.`
    );
  }
  control.childControls?.forEach(validateCompleteJaggedSubtree);
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
    id: explicitChild.id,
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

  const controlsById = new Map(
    resolvedControls.map((control) => [control.id, control])
  );
  const attachedChildIds = new Set<string>();
  const childOwnerById = new Map<string, string>();
  const jaggedChildrenByParent = new Map<
    string,
    {
      index: number;
      definition: ControlDefinition<T>;
      initiallyAttached: boolean;
    }[]
  >();

  resolvedControls
    .filter((control) => control.type === "jaggedArray")
    .forEach((parent) => {
      const legacyChildren = (() => {
        if (parent.children !== undefined) return [];
        const prefix = `${parent.id}-`;
        return resolvedControls
          .filter((candidate) => candidate.id.startsWith(prefix))
          .flatMap((candidate) => {
            const suffix = candidate.id.slice(prefix.length);
            if (!/^(0|[1-9]\d*)$/.test(suffix)) return [];
            return [{ id: candidate.id, index: Number(suffix) }];
          })
          .sort((a, b) => a.index - b.index);
      })();
      const initialReferences = parent.children !== undefined
        ? parent.children.map((id, index) => ({ id, index }))
        : legacyChildren;
      const dynamicReferences = parent.batches?.flatMap((batch) => [
        ...(batch.inserts ?? []).map((operation) => ({
          id: operation.childId,
          index: operation.index ?? 0,
        })),
        ...(batch.headInserts ?? []).map((operation) => ({
          id: operation.childId,
          index: 0,
        })),
        ...(batch.tailInserts ?? []).map((operation) => ({
          id: operation.childId,
          index: initialReferences.length,
        })),
      ]) ?? [];
      const initialIds = new Set(initialReferences.map(({ id }) => id));
      const references = [...initialReferences, ...dynamicReferences]
        .filter((reference): reference is { id: string; index: number } =>
          typeof reference.id === "string" && reference.id.length > 0
        )
        .filter((reference, index, all) =>
          all.findIndex(({ id }) => id === reference.id) === index
        );

      if (new Set(initialReferences.map(({ id }) => id)).size !== initialReferences.length) {
        throw new Error(`Jagged array "${parent.id}" children must be unique.`);
      }

      const children = references.map(({ id, index }) => {
        const definition = controlsById.get(id);
        if (!definition) {
          throw new Error(
            `Jagged array "${parent.id}" references unknown child "${id}".`
          );
        }
        return {
          index,
          definition,
          initiallyAttached: initialIds.has(id),
        };
      });

      children.forEach((child) => {
        if (child.definition.orientation !== undefined) {
          throw new Error(
            `Control "${child.definition.id}" cannot set orientation because jagged-array descendants alternate automatically.`
          );
        }
        if (
          child.definition.type !== undefined &&
          child.definition.type !== "array" &&
          child.definition.type !== "jaggedArray"
        ) {
          throw new Error(
            `Control "${child.definition.id}" must be an array or jaggedArray because it is a child of jagged array "${parent.id}".`
          );
        }
        const existingOwner = childOwnerById.get(child.definition.id);
        if (existingOwner && existingOwner !== parent.id) {
          throw new Error(
            `Jagged child "${child.definition.id}" cannot belong to both "${existingOwner}" and "${parent.id}".`
          );
        }
        childOwnerById.set(child.definition.id, parent.id);
        attachedChildIds.add(child.definition.id);
      });

      jaggedChildrenByParent.set(parent.id, children);
    });

  const buildControlTree = (
    control: ControlDefinition<T>,
    parentId?: string,
    parentIndex?: number,
    isJaggedDescendant = false,
    ancestors = new Set<string>()
  ): LoadedControl<T> => {
    if (ancestors.has(control.id)) {
      throw new Error(`Jagged child cycle detected at "${control.id}".`);
    }
    const type = control.type ?? "array";
    const restrictJaggedMutations =
      isJaggedDescendant || type === "jaggedArray";
    const children = jaggedChildrenByParent.get(control.id) ?? [];
    const initialChildren = children
      .filter((child) => child.initiallyAttached)
      .sort((a, b) => a.index - b.index);
    const initialChildIds = control.children !== undefined
      ? initialChildren.map((child) => child.definition.id)
      : Array.from(
          {
            length: initialChildren.length
              ? initialChildren[initialChildren.length - 1].index + 1
              : 0,
          },
          (_, index) =>
            initialChildren.find((child) => child.index === index)?.definition.id ?? ""
        );
    if (
      type === "jaggedArray" &&
      control.children !== undefined &&
      control.initialItemCount !== undefined &&
      control.initialItemCount !== initialChildIds.length
    ) {
      throw new Error(
        `Jagged array "${control.id}" initialItemCount must match its children length.`
      );
    }
    const resolvedControl =
      type === "jaggedArray"
        ? {
            ...control,
            initialItemCount: control.children !== undefined
              ? initialChildIds.length
              : Math.max(
                  control.initialItemCount ?? 0,
                  initialChildren.length
                    ? initialChildren[initialChildren.length - 1].index + 1
                    : 0
                ),
          }
        : control;
    if (type === "jaggedArray") {
      for (
        let index = 0;
        index < (resolvedControl.initialItemCount ?? 0);
        index += 1
      ) {
        if (!initialChildIds[index]) {
          throw new Error(
            `Jagged array "${control.id}" initial slot ${index} must reference a child ID.`
          );
        }
      }
    }
    const loaded = buildLoadedControl(
      resolvedControl,
      type,
      parentId,
      parentIndex,
      restrictJaggedMutations,
      initialChildIds
    );

    if (type !== "jaggedArray") return loaded;

    const nextAncestors = new Set(ancestors).add(control.id);
    loaded.childControls = children.map(({ index, definition }) => {
      const childDefinition = buildJaggedChildDefinition(
        control,
        index,
        definition
      );
      return buildControlTree(
        childDefinition,
        control.id,
        index,
        true,
        nextAncestors
      );
    });
    validateCompleteJaggedSubtree(loaded);

    return loaded;
  };

  return resolvedControls
    .filter((control) => !attachedChildIds.has(control.id))
    .map((control) => buildControlTree(control));
}
