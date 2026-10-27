"use client";

import { ArrayRendererOptions } from "../../common/models/arrayControl";
import {
  ControlItem,
  ControlItemState,
} from "../../common/models/controlItem";
import {
  ControlRenderConfig,
  Snapshot,
} from "../../common/models/snapshot";
import { ArrayRenderer } from "./ArrayRenderer";
import { RendererProps } from "./rendererConfig";
import { buildRenderItems } from "./utils/buildRenderItems";
import { requirePositiveDimension } from "./utils/dimensions";

export interface JaggedArrayChild {
  childId?: string;
  index: number;
  parentItemId?: string;
  snapshot: Snapshot<ControlItem>;
  options: ArrayRendererOptions;
  render: ControlRenderConfig;
  childArrays?: JaggedArrayChild[];
  minimumSlotCount?: number;
}

export interface JaggedArrayRendererProps
  extends RendererProps,
    Omit<ArrayRendererOptions, "itemWidth" | "itemHeight"> {
  snapshot: Snapshot<ControlItem>;
  childArrays?: JaggedArrayChild[];
  disableAnimations: boolean;
  divHeight: number;
  divWidth: number;
  currentStep?: number;
  navigationDisableAnimations?: boolean;
}

const DEFAULT_ITEM_OFFSET = 40;

interface JaggedSizing {
  arrayGap: number;
  defaultItemOffset: number;
  fitContent: boolean;
  itemGap: number;
  itemCrossAxisGap: number;
  leafWidth: number;
  leafHeight: number;
}

interface MeasuredChild {
  child: JaggedArrayChild;
  orientation: NonNullable<ArrayRendererOptions["orientation"]>;
  width: number;
  height: number;
  defaultItemOffset: number;
}

interface MeasuredJaggedArray {
  snapshot: Snapshot<ControlItem>;
  width: number;
  height: number;
  defaultItemOffset: number;
  children: Map<number, MeasuredChild>;
  childrenById: Map<string, MeasuredChild>;
  childrenByParentItemId: Map<string, MeasuredChild>;
  orientation: NonNullable<ArrayRendererOptions["orientation"]>;
}

function contentExtent(
  snapshot: Snapshot<ControlItem>,
  defaultItemOffset: number,
  disableAnimations: boolean
) {
  const extent = buildRenderItems(
    snapshot.items,
    new Set(),
    disableAnimations,
    defaultItemOffset
  ).reduce(
    (maximum, item) =>
      Math.max(maximum, item.offset + item.itemOffset),
    0
  );

  return extent || defaultItemOffset;
}

function getJaggedDepth(
  snapshot: Snapshot<ControlItem>,
  childArrays: JaggedArrayChild[]
): number {
  const childDepths = childArrays.map((child) =>
    child.snapshot.type === "jaggedArray"
      ? getJaggedDepth(child.snapshot, child.childArrays ?? [])
      : 0
  );
  if (new Set(childDepths).size > 1) {
    throw new Error(
      `Jagged array "${snapshot.id}" requires every branch to have the same nesting depth.`
    );
  }
  return (childDepths[0] ?? 0) + 1;
}

function orientationAtDepth(
  leafOrientation: NonNullable<ArrayRendererOptions["orientation"]>,
  depth: number
): NonNullable<ArrayRendererOptions["orientation"]> {
  return depth % 2 === 0
    ? leafOrientation
    : leafOrientation === "horizontal"
      ? "vertical"
      : "horizontal";
}

function measureJaggedArray(
  snapshot: Snapshot<ControlItem>,
  childArrays: JaggedArrayChild[],
  leafOrientation: NonNullable<ArrayRendererOptions["orientation"]>,
  sizing: JaggedSizing,
  disableAnimations: boolean,
  currentStep?: number,
  navigationDisableAnimations = false
): MeasuredJaggedArray {
  const children = new Map<number, MeasuredChild>();
  const childrenById = new Map<string, MeasuredChild>();
  const childrenByParentItemId = new Map<string, MeasuredChild>();
  const orientation = orientationAtDepth(
    leafOrientation,
    getJaggedDepth(snapshot, childArrays)
  );

  const attachMeasuredChild = (measuredChild: MeasuredChild) => {
    const { child } = measuredChild;
    children.set(child.index, measuredChild);
    childrenById.set(child.childId ?? child.snapshot.id, measuredChild);
    if (child.parentItemId) {
      childrenByParentItemId.set(child.parentItemId, measuredChild);
    }
  };

  childArrays.forEach((child) => {
    if (child.render.visible === false) return;

    const childDisableAnimations =
      disableAnimations ||
      navigationDisableAnimations ||
      (currentStep !== undefined && child.snapshot.step !== currentStep);

    if (child.snapshot.type === "jaggedArray") {
      const nested = measureJaggedArray(
        child.snapshot,
        child.childArrays ?? [],
        leafOrientation,
        sizing,
        childDisableAnimations,
        currentStep,
        navigationDisableAnimations
      );
      const measuredChild = {
        child,
        orientation: nested.orientation,
        width: nested.width,
        height: nested.height,
        defaultItemOffset: nested.defaultItemOffset,
      };
      attachMeasuredChild(measuredChild);
      return;
    }

    const configuredMainSize =
      leafOrientation === "horizontal"
        ? sizing.leafWidth
        : sizing.leafHeight;
    const fittedMainSize = contentExtent(
      child.snapshot,
      sizing.defaultItemOffset,
      childDisableAnimations
    );
    const mainSize = sizing.fitContent === true
      ? fittedMainSize
      : configuredMainSize;
    const measuredChild = {
      child,
      orientation: leafOrientation,
      width: leafOrientation === "horizontal" ? mainSize : sizing.leafWidth,
      height: leafOrientation === "vertical" ? mainSize : sizing.leafHeight,
      defaultItemOffset: sizing.defaultItemOffset,
    };
    attachMeasuredChild(measuredChild);
  });

  const firstChild = children.values().next().value as
    | MeasuredChild
    | undefined;

  const resolveChild = (item: ControlItem, index: number) => {
    if (item.childId) return childrenById.get(item.childId);
    if (childrenByParentItemId.size === 0) return children.get(index);
    return (
      childrenByParentItemId.get(item.id) ??
      (item.linkId ? childrenByParentItemId.get(item.linkId) : undefined)
    );
  };

  const fallbackChildWidth = firstChild?.width ?? sizing.leafWidth;
  const fallbackChildHeight = firstChild?.height ?? sizing.leafHeight;
  const fallbackChildMain = orientation === "horizontal"
    ? fallbackChildWidth
    : fallbackChildHeight;
  const defaultItemOffset = fallbackChildMain + sizing.arrayGap * 2;
  const measuredItems = snapshot.items.map((item, index) => {
    const child = resolveChild(item, index);
    const childMain = child
      ? orientation === "horizontal"
        ? child.width
        : child.height
      : fallbackChildMain;

    return {
      ...item,
      itemOffset: childMain + sizing.arrayGap * 2,
    };
  });
  const measuredSnapshot = { ...snapshot, items: measuredItems };
  const mainSize = contentExtent(
    measuredSnapshot,
    defaultItemOffset,
    disableAnimations
  );
  const fallbackChildCross = orientation === "horizontal"
    ? fallbackChildHeight
    : fallbackChildWidth;
  const activeChildren = snapshot.items.flatMap((item, index) => {
    if (item.state === ControlItemState.Removed) return [];
    const child = resolveChild(item, index);
    return child ? [child] : [];
  });
  const childCrossSize = activeChildren.length
    ? Math.max(
        ...activeChildren.map((child) =>
          orientation === "horizontal" ? child.height : child.width
        )
      )
    : fallbackChildCross;
  const crossSize = childCrossSize + sizing.arrayGap * 2;

  return {
    snapshot: measuredSnapshot,
    width: orientation === "horizontal" ? mainSize : crossSize,
    height: orientation === "vertical" ? mainSize : crossSize,
    defaultItemOffset,
    children,
    childrenById,
    childrenByParentItemId,
    orientation,
  };
}

function resolveSizing({
  arrayGap = 0,
  defaultItemOffset = DEFAULT_ITEM_OFFSET,
  divHeight,
  divWidth,
  fitContent = false,
  itemGap = 0,
  itemCrossAxisGap = 0,
}: Pick<
  JaggedArrayRendererProps,
  | "arrayGap"
  | "defaultItemOffset"
  | "divHeight"
  | "divWidth"
  | "fitContent"
  | "itemGap"
  | "itemCrossAxisGap"
>): JaggedSizing {
  return {
    arrayGap: Math.max(arrayGap, 0),
    defaultItemOffset: requirePositiveDimension(
      defaultItemOffset,
      "defaultItemOffset"
    ),
    fitContent,
    itemGap: Math.max(itemGap, 0),
    itemCrossAxisGap: Math.max(itemCrossAxisGap, 0),
    leafWidth: requirePositiveDimension(divWidth, "divWidth"),
    leafHeight: requirePositiveDimension(divHeight, "divHeight"),
  };
}

export function getJaggedArrayDimensions({
  snapshot,
  childArrays = [],
  disableAnimations,
  orientation = "vertical",
  arrayGap,
  defaultItemOffset,
  divHeight,
  divWidth,
  fitContent,
  itemGap,
  itemCrossAxisGap,
  currentStep,
  navigationDisableAnimations,
}: JaggedArrayRendererProps) {
  const measured = measureJaggedArray(
    snapshot,
    childArrays,
    orientation,
    resolveSizing({
      arrayGap,
      defaultItemOffset,
      divHeight,
      divWidth,
      fitContent,
      itemGap,
      itemCrossAxisGap,
    }),
    disableAnimations,
    currentStep,
    navigationDisableAnimations
  );

  return { width: measured.width, height: measured.height };
}

export function JaggedArrayRenderer({
  snapshot,
  childArrays = [],
  disableAnimations,
  arrayGap,
  defaultItemOffset,
  divHeight,
  divWidth,
  fitContent,
  itemGap,
  itemCrossAxisGap,
  currentStep,
  navigationDisableAnimations = false,
  preInsertGap,
  emptyItemText,
  itemLabels,
  orientation = "vertical",
  reverseDirection = false,
  showCellBorders = true,
  renderContent,
  borderWidth,
  containerClassName,
  containerStyle,
}: JaggedArrayRendererProps) {
  const sizing = resolveSizing({
    arrayGap,
    defaultItemOffset,
    divHeight,
    divWidth,
    fitContent,
    itemGap,
    itemCrossAxisGap,
  });
  const measured = measureJaggedArray(
    snapshot,
    childArrays,
    orientation,
    sizing,
    disableAnimations,
    currentStep,
    navigationDisableAnimations
  );

  const getMeasuredChild = (item: ControlItem, index: number) =>
    item.childId
      ? measured.childrenById.get(item.childId)
      : measured.childrenByParentItemId.size > 0
      ? measured.childrenByParentItemId.get(item.id) ??
        (item.linkId
          ? measured.childrenByParentItemId.get(item.linkId)
          : undefined)
      : measured.children.get(index);

  const renderJaggedItem = (
    item: ControlItem,
    options?: { index?: number; isSlotOwner?: boolean }
  ) => {
    if (options?.isSlotOwner === false) {
      return renderContent?.(item);
    }

    const measuredChild =
      options?.index === undefined
        ? undefined
        : getMeasuredChild(item, options.index);

    if (!measuredChild) {
      return renderContent?.(item);
    }
    const { child } = measuredChild;

    const childRender = child.render;

    if (childRender.visible === false) {
      return renderContent?.(item);
    }

    const childDisableAnimations =
      navigationDisableAnimations ||
      (currentStep !== undefined && child.snapshot.step !== currentStep);
    const dimensions = {
      width: measuredChild.width,
      height: measuredChild.height,
    };
    const parentItemHeight =
      measured.orientation === "horizontal"
        ? measured.height - sizing.arrayGap * 2
        : item.itemOffset ?? measured.defaultItemOffset;
    const labelHeight = Math.max(
      (parentItemHeight - dimensions.height) / 2,
      0
    );

    const childRendererProps = {
      snapshot: child.snapshot,
      disableAnimations: childDisableAnimations,
      defaultItemOffset: measuredChild.defaultItemOffset,
      divHeight: dimensions.height,
      divWidth: dimensions.width,
      fitContent: sizing.fitContent,
      itemGap: sizing.itemGap,
      itemCrossAxisGap: sizing.itemCrossAxisGap,
      minimumSlotCount: child.minimumSlotCount,
      minimumSlotOffset: sizing.defaultItemOffset,
      preInsertGap: child.options.preInsertGap ?? preInsertGap,
      emptyItemText: child.options.emptyItemText ?? emptyItemText,
      itemLabels: child.options.itemLabels ?? itemLabels,
      showCellBorders:
        child.options.showCellBorders ?? showCellBorders,
      orientation: measuredChild.orientation,
      reverseDirection,
      renderContent,
      borderWidth: childRender.borderWidth,
      containerStyle: item.borderColor?.trim()
        ? {
            boxShadow: `0 0 0 ${item.borderWidth ?? borderWidth ?? 4}px ${item.borderColor}`,
          }
        : undefined,
    };

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: dimensions.width,
            height: dimensions.height,
            transform: "translate(-50%, -50%)",
          }}
        >
          {child.snapshot.type === "jaggedArray" ? (
            <JaggedArrayRenderer
              {...childRendererProps}
              childArrays={child.childArrays}
              arrayGap={sizing.arrayGap}
              divHeight={sizing.leafHeight}
              divWidth={sizing.leafWidth}
              orientation={orientation}
              reverseDirection={reverseDirection}
              currentStep={currentStep}
              navigationDisableAnimations={navigationDisableAnimations}
            />
          ) : (
            <ArrayRenderer {...childRendererProps} />
          )}
        </div>

        {labelHeight > 0 && (
          <div
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              left: 0,
              height: labelHeight,
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                position: "relative",
              }}
            >
              {renderContent?.(item)}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <ArrayRenderer
      snapshot={measured.snapshot}
      disableAnimations={disableAnimations}
      defaultItemOffset={measured.defaultItemOffset}
      divHeight={measured.height}
      divWidth={measured.width}
      itemGap={sizing.arrayGap}
      itemCrossAxisGap={sizing.arrayGap}
      resolveItemSize={(item, options) =>
        getMeasuredChild(item, options.index)
          ? undefined
          : {
              width: sizing.leafWidth + sizing.arrayGap * 2,
              height: sizing.leafHeight + sizing.arrayGap * 2,
            }
      }
      preInsertGap={preInsertGap}
      emptyItemText={emptyItemText}
      itemLabels={itemLabels}
      showCellBorders={showCellBorders}
      showItemHighlights={false}
      orientation={measured.orientation}
      reverseDirection={reverseDirection}
      renderContent={renderJaggedItem}
      borderWidth={borderWidth}
      containerClassName={containerClassName}
      containerStyle={containerStyle}
    />
  );
}
