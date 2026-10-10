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
  index: number;
  parentItemId?: string;
  snapshot: Snapshot<ControlItem>;
  options: ArrayRendererOptions;
  render: ControlRenderConfig;
  childArrays?: JaggedArrayChild[];
}

export interface JaggedArrayChildDefaults
  extends Omit<ArrayRendererOptions, "orientation"> {
  orientation?: never;
  render?: ControlRenderConfig;
}

export interface JaggedArrayRendererProps
  extends RendererProps,
    ArrayRendererOptions {
  snapshot: Snapshot<ControlItem>;
  childArrays?: JaggedArrayChild[];
  childDefaults?: JaggedArrayChildDefaults;
  disableAnimations: boolean;
  defaultItemOffset?: number;
  divHeight: number;
  divWidth: number;
  itemGap?: number;
  itemCrossAxisGap?: number;
  currentStep?: number;
  navigationDisableAnimations?: boolean;
}

const DEFAULT_CHILD_SIZE = 40;

interface JaggedSizing {
  gap: number;
  width: number;
  height: number;
}

interface MeasuredChild {
  child: JaggedArrayChild;
  orientation: NonNullable<ArrayRendererOptions["orientation"]>;
  width: number;
  height: number;
  itemWidth: number;
  itemHeight: number;
  defaultItemOffset: number;
  sizing: JaggedSizing;
}

interface MeasuredJaggedArray {
  snapshot: Snapshot<ControlItem>;
  width: number;
  height: number;
  defaultItemOffset: number;
  children: Map<number, MeasuredChild>;
  childrenByParentItemId: Map<string, MeasuredChild>;
}

function contentExtent(
  snapshot: Snapshot<ControlItem>,
  defaultItemOffset: number,
  disableAnimations: boolean
) {
  return Math.max(
    buildRenderItems(
      snapshot.items,
      new Set(),
      disableAnimations,
      defaultItemOffset
    ).reduce(
      (extent, item) =>
        Math.max(extent, item.offset + item.itemOffset),
      0
    ),
    defaultItemOffset
  );
}

function measureJaggedArray(
  snapshot: Snapshot<ControlItem>,
  childArrays: JaggedArrayChild[],
  childDefaults: JaggedArrayChildDefaults,
  orientation: NonNullable<ArrayRendererOptions["orientation"]>,
  sizing: JaggedSizing,
  disableAnimations: boolean,
  currentStep?: number,
  navigationDisableAnimations = false
): MeasuredJaggedArray {
  const children = new Map<number, MeasuredChild>();
  const childrenByParentItemId = new Map<string, MeasuredChild>();

  childArrays.forEach((child) => {
    const render = {
      ...childDefaults.render,
      ...child.render,
    };
    if (render.visible === false) return;

    const childOrientation: NonNullable<ArrayRendererOptions["orientation"]> =
      orientation === "horizontal" ? "vertical" : "horizontal";
    const childSizing = {
      gap: Math.max(
        child.options.childGap ??
          childDefaults.childGap ??
          sizing.gap,
        0
      ),
      width: requirePositiveDimension(
        child.options.childWidth ??
          childDefaults.childWidth ??
          sizing.width,
        "childWidth"
      ),
      height: requirePositiveDimension(
        child.options.childHeight ??
          childDefaults.childHeight ??
          sizing.height,
        "childHeight"
      ),
    };
    const childDisableAnimations =
      disableAnimations ||
      navigationDisableAnimations ||
      (currentStep !== undefined && child.snapshot.step !== currentStep);

    if (child.snapshot.type === "jaggedArray") {
      const nested = measureJaggedArray(
        child.snapshot,
        child.childArrays ?? [],
        {},
        childOrientation,
        childSizing,
        childDisableAnimations,
        currentStep,
        navigationDisableAnimations
      );
      const measuredChild = {
        child,
        orientation: childOrientation,
        width: nested.width,
        height: nested.height,
        itemWidth: childSizing.width,
        itemHeight: childSizing.height,
        defaultItemOffset: nested.defaultItemOffset,
        sizing: childSizing,
      };
      children.set(child.index, measuredChild);
      if (child.parentItemId) {
        childrenByParentItemId.set(child.parentItemId, measuredChild);
      }
      return;
    }

    const itemWidth = childSizing.width;
    const itemHeight = childSizing.height;
    const defaultItemOffset =
      childOrientation === "horizontal" ? itemWidth : itemHeight;
    const mainSize = contentExtent(
      child.snapshot,
      defaultItemOffset,
      childDisableAnimations
    );
    const measuredChild = {
      child,
      orientation: childOrientation,
      width: childOrientation === "horizontal" ? mainSize : itemWidth,
      height: childOrientation === "vertical" ? mainSize : itemHeight,
      itemWidth,
      itemHeight,
      defaultItemOffset,
      sizing: childSizing,
    };
    children.set(child.index, measuredChild);
    if (child.parentItemId) {
      childrenByParentItemId.set(child.parentItemId, measuredChild);
    }
  });

  const resolveChild = (item: ControlItem, index: number) => {
    if (childrenByParentItemId.size === 0) return children.get(index);
    return (
      childrenByParentItemId.get(item.id) ??
      (item.linkId ? childrenByParentItemId.get(item.linkId) : undefined)
    );
  };

  const fallbackChildMain =
    orientation === "horizontal" ? sizing.width : sizing.height;
  const defaultItemOffset = fallbackChildMain + sizing.gap * 2;
  const measuredItems = snapshot.items.map((item, index) => {
    const child = resolveChild(item, index);
    const childMain = child
      ? orientation === "horizontal"
        ? child.width
        : child.height
      : fallbackChildMain;

    return {
      ...item,
      itemOffset: childMain + sizing.gap * 2,
    };
  });
  const measuredSnapshot = { ...snapshot, items: measuredItems };
  const mainSize = contentExtent(
    measuredSnapshot,
    defaultItemOffset,
    disableAnimations
  );
  const fallbackChildCross =
    orientation === "horizontal" ? sizing.height : sizing.width;
  const activeChildren = snapshot.items.flatMap((item, index) => {
    if (item.state === ControlItemState.Removed) return [];
    const child = resolveChild(item, index);
    return child ? [child] : [];
  });
  const childCrossSize = Math.max(
    ...activeChildren.map((child) =>
      orientation === "horizontal" ? child.height : child.width
    ),
    fallbackChildCross
  );
  const crossSize = childCrossSize + sizing.gap * 2;

  return {
    snapshot: measuredSnapshot,
    width: orientation === "horizontal" ? mainSize : crossSize,
    height: orientation === "vertical" ? mainSize : crossSize,
    defaultItemOffset,
    children,
    childrenByParentItemId,
  };
}

function resolveSizing({
  childGap = 0,
  childWidth = DEFAULT_CHILD_SIZE,
  childHeight = DEFAULT_CHILD_SIZE,
}: Pick<
  JaggedArrayRendererProps,
  "childGap" | "childWidth" | "childHeight"
>): JaggedSizing {
  return {
    gap: Math.max(childGap, 0),
    width: requirePositiveDimension(childWidth, "childWidth"),
    height: requirePositiveDimension(childHeight, "childHeight"),
  };
}

export function getJaggedArrayDimensions({
  snapshot,
  childArrays = [],
  childDefaults = {},
  disableAnimations,
  orientation = "horizontal",
  childGap,
  childWidth,
  childHeight,
  currentStep,
  navigationDisableAnimations,
}: JaggedArrayRendererProps) {
  const measured = measureJaggedArray(
    snapshot,
    childArrays,
    childDefaults,
    orientation,
    resolveSizing({ childGap, childWidth, childHeight }),
    disableAnimations,
    currentStep,
    navigationDisableAnimations
  );

  return { width: measured.width, height: measured.height };
}

export function JaggedArrayRenderer({
  snapshot,
  childArrays = [],
  childDefaults = {},
  disableAnimations,
  childGap,
  childWidth,
  childHeight,
  currentStep,
  navigationDisableAnimations = false,
  preInsertGap,
  emptyItemText,
  itemLabels,
  orientation = "horizontal",
  showCellBorders = true,
  renderContent,
  borderWidth,
  containerClassName,
  containerStyle,
}: JaggedArrayRendererProps) {
  const sizing = resolveSizing({ childGap, childWidth, childHeight });
  const measured = measureJaggedArray(
    snapshot,
    childArrays,
    childDefaults,
    orientation,
    sizing,
    disableAnimations,
    currentStep,
    navigationDisableAnimations
  );

  const getMeasuredChild = (item: ControlItem, index: number) =>
    measured.childrenByParentItemId.size > 0
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

    const childRender = {
      ...childDefaults.render,
      ...child.render,
      layout: {
        ...(childDefaults.render?.layout ?? {}),
        ...(child.render.layout ?? {}),
      },
    };

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
      orientation === "horizontal"
        ? measured.height - sizing.gap * 2
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
      itemGap: 0,
      itemCrossAxisGap: 0,
      itemWidth: measuredChild.itemWidth,
      itemHeight: measuredChild.itemHeight,
      preInsertGap:
        child.options.preInsertGap ?? childDefaults.preInsertGap,
      emptyItemText:
        child.options.emptyItemText ?? childDefaults.emptyItemText,
      itemLabels: child.options.itemLabels ?? childDefaults.itemLabels,
      showCellBorders:
        child.options.showCellBorders ??
        childDefaults.showCellBorders ??
        true,
      orientation: measuredChild.orientation,
      renderContent,
      borderWidth: childRender.borderWidth,
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
              childGap={measuredChild.sizing.gap}
              childWidth={measuredChild.sizing.width}
              childHeight={measuredChild.sizing.height}
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
      itemGap={sizing.gap}
      itemCrossAxisGap={sizing.gap}
      resolveItemSize={(item, options) =>
        getMeasuredChild(item, options.index)
          ? undefined
          : {
              width: sizing.width + sizing.gap * 2,
              height: sizing.height + sizing.gap * 2,
            }
      }
      preInsertGap={preInsertGap}
      emptyItemText={emptyItemText}
      itemLabels={itemLabels}
      showCellBorders={showCellBorders}
      orientation={orientation}
      renderContent={renderJaggedItem}
      borderWidth={borderWidth}
      containerClassName={containerClassName}
      containerStyle={containerStyle}
    />
  );
}
