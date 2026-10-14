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
  renderContent,
  borderWidth,
  containerClassName,
  containerStyle,
}: StackRendererProps) {
  const snapshotItems = snapshot.items;
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
  const resolvedDivHeight = shouldFitContent
    ? renderedContentExtent || resolvedDefaultItemOffset
    : divHeight;
  const resolvedItemGap = Math.max(itemGap, 0);
  const resolvedCrossAxisGap = Math.max(itemCrossAxisGap, 0);
  const baseItemWidth = divWidth;
  const resolvedItemWidth = Math.max(
    baseItemWidth - resolvedCrossAxisGap * 2,
    0
  );
  const itemLeftOffset = resolvedCrossAxisGap;
  const gridCells = buildGridCells(
    renderItems,
    resolvedDivHeight,
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
        bottom: shouldFitContent ? 0 : undefined,
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
              bottom: cell.offset,
              height: cell.size,
            }}
          />
        ))}
      </div>
      <div className="relative flex-grow flex items-center justify-center">
        {renderItems.map(({ item, collapsedIndex, offset, itemOffset }) => {
          const slotHeight = slotSizeByOffset.get(offset) ?? itemOffset;
          const baseItemHeight = slotHeight;

          return (
            <StackItem
              key={item.id}
              item={item}
              itemHeight={Math.max(
                baseItemHeight - resolvedItemGap * 2,
                0
              )}
              itemWidth={resolvedItemWidth}
              slotHeight={slotHeight}
              slotWidth={divWidth}
              collapsedIndex={collapsedIndex}
              bottomOffset={
                offset + resolvedItemGap
              }
              leftOffset={itemLeftOffset}
              preInsertGap={preInsertGap}
              onCollapse={collapse}
              disableAnimations={disableAnimations}
              itemGap={itemGap ?? 0}
              borderWidth={borderWidth}
              renderContent={renderContent}
              splitColumnWidths={splitColumnWidths}
            />
          );
        })}
      </div>
    </div>
  );
}
