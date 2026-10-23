"use client";
import StackItem from "../Items/StackItem";
import { ControlItem } from "../../common/models/controlItem";
import { Snapshot } from "../../common/models/snapshot";
import {
  buildRenderItems,
  getFittedRenderExtent,
} from "./utils/buildRenderItems";
import { DEFAULT_RENDERER_CONTAINER_CLASS_NAME, RendererProps, resolveContainerClassName } from "./rendererConfig";
import {
  requirePositiveDimension,
  rejectItemDimensions,
} from "./utils/dimensions";
import { useCollapsedItems } from "../../hooks/useCollapsedItems";
import { buildGridCells } from "./utils/buildGridCells";

interface StackRendererProps extends RendererProps {
  snapshot: Snapshot<ControlItem>;
  disableAnimations: boolean;
  defaultItemOffset?: number;
  divHeight: number;
  divWidth: number;
  itemGap?: number;
  itemCrossAxisGap?: number;
  itemWidth?: number;
  itemHeight?: number;
  fitContent?: boolean;
  preInsertGap?: number;
  splitColumnWidths?: number[];
  showCellBorders?: boolean;
  reverseDirection?: boolean;
}

export function StackRenderer({
  snapshot,
  disableAnimations,
  defaultItemOffset = 40,
  divWidth,
  divHeight,
  itemGap = 0,
  itemCrossAxisGap = 0,
  itemWidth,
  itemHeight,
  fitContent = false,
  preInsertGap,
  splitColumnWidths,
  showCellBorders = snapshot.type !== "dictionary",
  reverseDirection = false,
  renderContent,
  borderWidth,
  containerClassName,
  containerStyle,
}: StackRendererProps) {
  const snapshotItems = snapshot.items;
  const isTopDown = reverseDirection;
  const usesConfigurableItemSizing = snapshot.type !== "text";
  if (usesConfigurableItemSizing) {
    rejectItemDimensions(itemWidth, itemHeight, snapshot.type);
  }
  const resolvedDefaultItemOffset = requirePositiveDimension(
    defaultItemOffset,
    "defaultItemOffset"
  );
  const { collapsedIds, collapse } = useCollapsedItems(disableAnimations);

  const renderItems = buildRenderItems(
    snapshotItems,
    collapsedIds,
    disableAnimations,
    resolvedDefaultItemOffset
  );
  const renderedContentExtent = getFittedRenderExtent(renderItems);
  const shouldFitContent = fitContent && usesConfigurableItemSizing;
  const resolvedMainAxisSize = shouldFitContent
    ? renderedContentExtent || resolvedDefaultItemOffset
    : divHeight;
  const resolvedDivHeight = resolvedMainAxisSize;
  const resolvedItemGap = Math.max(itemGap, 0);
  const resolvedCrossAxisGap = Math.max(itemCrossAxisGap, 0);
  const gridCells = buildGridCells(
    renderItems,
    resolvedMainAxisSize,
    resolvedDefaultItemOffset
  );
  const slotSizeByOffset = new Map(
    gridCells.map((cell) => [cell.offset, cell.size])
  );

  return (
    // position relative must be in the div or it gets lost as a package reference
    <div
      style={{
        width: divWidth,
        height: resolvedDivHeight,
        position: shouldFitContent ? "absolute" : "relative",
        top:
          shouldFitContent && isTopDown
            ? 0
            : undefined,
        bottom:
          shouldFitContent && !isTopDown
            ? 0
            : undefined,
        ...containerStyle,
      }}
      className={resolveContainerClassName(
        "rounded flex flex-col",
        DEFAULT_RENDERER_CONTAINER_CLASS_NAME,
        containerClassName
      )}
    >
      <div className="absolute inset-0 pointer-events-none">
        {gridCells.map((cell, index) => (
          <div
            key={`stack-cell-${index}`}
            className={`absolute left-0 right-0 ${
              showCellBorders ? "border-b border-gray-600" : ""
            }`}
            style={{
              top: isTopDown ? cell.offset : undefined,
              bottom: isTopDown ? undefined : cell.offset,
              height: cell.size,
            }}
          />
        ))}
      </div>
      <div className="relative flex-grow flex items-center justify-center">
        {renderItems.map(({ item, collapsedIndex, offset, itemOffset }) => {
          const slotHeight = slotSizeByOffset.get(offset) ?? itemOffset;
          const mainItemSize = Math.max(
            slotHeight - resolvedItemGap * 2,
            0
          );
          const crossItemSize = Math.max(
            divWidth - resolvedCrossAxisGap * 2,
            0
          );
          const mainOffset = offset + resolvedItemGap;

          return (
            <StackItem
              key={item.id}
              item={item}
              itemHeight={mainItemSize}
              itemWidth={crossItemSize}
              slotHeight={slotHeight}
              slotWidth={divWidth}
              collapsedIndex={collapsedIndex}
              topOffset={
                isTopDown ? mainOffset : undefined
              }
              bottomOffset={
                isTopDown ? undefined : mainOffset
              }
              leftOffset={
                resolvedCrossAxisGap
              }
              preInsertGap={preInsertGap}
              onCollapse={collapse}
              disableAnimations={disableAnimations}
              itemGap={itemGap ?? 0}
              borderWidth={borderWidth}
              renderContent={renderContent}
              splitColumnWidths={splitColumnWidths}
              reverseDirection={reverseDirection}
            />
          );
        })}
      </div>
    </div>
  );
}
