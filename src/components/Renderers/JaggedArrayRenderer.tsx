"use client";

import { ArrayRendererOptions } from "../../common/models/arrayControl";
import { ControlItem } from "../../common/models/controlItem";
import {
  ControlRenderConfig,
  Snapshot,
} from "../../common/models/snapshot";
import { ArrayRenderer } from "./ArrayRenderer";
import { RendererProps } from "./rendererConfig";
import { buildRenderItems } from "./utils/buildRenderItems";

export interface JaggedArrayChild {
  index: number;
  snapshot: Snapshot<ControlItem>;
  options: ArrayRendererOptions;
  render: ControlRenderConfig;
}

export interface JaggedArrayChildDefaults extends ArrayRendererOptions {
  render?: ControlRenderConfig;
}

interface JaggedArrayRendererProps
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

function getChildDimensions(
  child: JaggedArrayChild,
  defaults: JaggedArrayChildDefaults,
  fallbackOffset: number,
  fallbackWidth: number,
  fallbackHeight: number,
  disableAnimations: boolean
) {
  const orientation =
    defaults.orientation ?? child.options.orientation ?? "horizontal";
  const offset =
    child.options.defaultItemOffset ??
    defaults.defaultItemOffset ??
    fallbackOffset;
  const renderItems = buildRenderItems(
    child.snapshot.items,
    new Set(),
    disableAnimations,
    offset
  );
  const itemCount = Math.max(renderItems.length, 1);
  const contentSize = Math.max(
    renderItems.reduce(
      (size, item) => Math.max(size, item.offset + item.itemOffset),
      0
    ),
    offset
  );
  const fitContent =
    child.options.fitContent ?? defaults.fitContent ?? false;

  return {
    width:
      orientation === "horizontal" && fitContent
        ? contentSize
        : child.render.layout?.width ??
          defaults.render?.layout?.width ??
          (orientation === "horizontal"
            ? itemCount * offset
            : fallbackWidth),
    height:
      orientation === "vertical" && fitContent
        ? contentSize
        : child.render.layout?.height ??
          defaults.render?.layout?.height ??
          (orientation === "vertical"
            ? itemCount * offset
            : fallbackHeight),
  };
}

export function JaggedArrayRenderer({
  snapshot,
  childArrays = [],
  childDefaults = {},
  disableAnimations,
  defaultItemOffset = 50,
  divHeight,
  divWidth,
  itemGap = 0,
  itemCrossAxisGap = 0,
  currentStep,
  navigationDisableAnimations = false,
  itemWidth,
  itemHeight,
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
  const childByIndex = new Map(
    childArrays.map((child) => [child.index, child])
  );

  const renderJaggedItem = (
    item: ControlItem,
    options?: { index?: number; isSlotOwner?: boolean }
  ) => {
    if (options?.isSlotOwner === false) {
      return renderContent?.(item);
    }

    const child =
      options?.index === undefined
        ? undefined
        : childByIndex.get(options.index);

    if (!child) {
      return renderContent?.(item);
    }

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

    const childOffset =
      child.options.defaultItemOffset ??
      childDefaults.defaultItemOffset ??
      defaultItemOffset;
    const childGap =
      child.options.itemGap ?? childDefaults.itemGap ?? 0;
    const parentItemWidth =
      orientation === "horizontal"
        ? itemWidth ?? defaultItemOffset
        : itemWidth ?? divWidth;
    const parentItemHeight =
      orientation === "horizontal" ? divHeight : defaultItemOffset;
    const childDisableAnimations =
      navigationDisableAnimations ||
      (currentStep !== undefined && child.snapshot.step !== currentStep);
    const dimensions = getChildDimensions(
      child,
      childDefaults,
      childOffset,
      parentItemWidth,
      parentItemHeight,
      childDisableAnimations
    );
    const labelHeight = Math.max(
      (parentItemHeight - dimensions.height) / 2,
      0
    );

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
          <ArrayRenderer
            snapshot={child.snapshot}
            disableAnimations={childDisableAnimations}
            defaultItemOffset={childOffset}
            divHeight={dimensions.height}
            divWidth={dimensions.width}
            itemGap={childGap}
            itemCrossAxisGap={
              child.options.itemCrossAxisGap ??
              childDefaults.itemCrossAxisGap ??
              0
            }
            itemWidth={
              child.options.itemWidth ?? childDefaults.itemWidth
            }
            itemHeight={
              child.options.itemHeight ?? childDefaults.itemHeight
            }
            preInsertGap={
              child.options.preInsertGap ?? childDefaults.preInsertGap
            }
            emptyItemText={
              child.options.emptyItemText ?? childDefaults.emptyItemText
            }
            itemLabels={
              child.options.itemLabels ?? childDefaults.itemLabels
            }
            showCellBorders={
              child.options.showCellBorders ??
              childDefaults.showCellBorders ??
              true
            }
            orientation={
              childDefaults.orientation ?? child.options.orientation
            }
            renderContent={renderContent}
            borderWidth={childRender.borderWidth}
          />
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
      snapshot={snapshot}
      disableAnimations={disableAnimations}
      defaultItemOffset={defaultItemOffset}
      divHeight={divHeight}
      divWidth={divWidth}
      itemGap={itemGap}
      itemCrossAxisGap={itemCrossAxisGap}
      itemWidth={itemWidth}
      itemHeight={itemHeight}
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
