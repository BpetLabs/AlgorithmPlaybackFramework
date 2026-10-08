"use client";
import ArrayItem from "../Items/ArrayItem";
import { ControlItem } from "../../common/models/controlItem";
import { Snapshot } from "../../common/models/snapshot";
import { buildRenderItems } from "./utils/buildRenderItems";
import { DEFAULT_RENDERER_CONTAINER_CLASS_NAME, RendererProps, resolveContainerClassName } from "./rendererConfig";
import { ArrayOrientation } from "../../common/models/arrayControl";
import { requirePositiveDimension } from "./utils/dimensions";
import { useCollapsedItems } from "../../hooks/useCollapsedItems";
import { buildGridCells } from "./utils/buildGridCells";

interface ArrayRendererProps extends RendererProps {
  snapshot: Snapshot<ControlItem>;
  disableAnimations: boolean;
  defaultItemOffset?: number;
  divHeight: number;
  divWidth: number;
  itemGap?: number;
  itemCrossAxisGap?: number;
  itemWidth?: number;
  itemHeight?: number;
  preInsertGap?: number;
  emptyItemText?: string
  itemLabels?: string[];
  orientation?: ArrayOrientation;
  showCellBorders?: boolean;
}

export function ArrayRenderer({
  snapshot,
  disableAnimations,
  defaultItemOffset = 40,
  divWidth,
  divHeight,
  itemGap = 0,
  itemCrossAxisGap = 0,
  itemWidth,
  itemHeight,
  preInsertGap,
  emptyItemText,
  itemLabels = [],
  orientation = "horizontal",
  showCellBorders = true,
  renderContent,
  borderWidth,
  containerClassName,
  containerStyle,
}: ArrayRendererProps) {
  const snapshotItems = snapshot.items;
  const isHorizontal = orientation === "horizontal";
  const resolvedDefaultItemOffset = requirePositiveDimension(
    defaultItemOffset,
    "defaultItemOffset"
  );
  const resolvedItemGap = Math.max(itemGap, 0);
  const resolvedCrossAxisGap = Math.max(itemCrossAxisGap, 0);
  const { collapsedIds, collapse } = useCollapsedItems(disableAnimations);

  const renderItems = buildRenderItems(
    snapshotItems,
    collapsedIds,
    disableAnimations,
    resolvedDefaultItemOffset
  );
  const slotIndexByOffset = new Map<number, number>();
  const slotOwnerIdByOffset = new Map<number, string>();
  renderItems.forEach(({ offset }) => {
    if (!slotIndexByOffset.has(offset)) {
      slotIndexByOffset.set(offset, slotIndexByOffset.size);
    }
  });
  renderItems.forEach(({ item, offset }) => {
    if (!slotOwnerIdByOffset.has(offset)) {
      slotOwnerIdByOffset.set(offset, item.id);
    }
  });
  const gridCells = buildGridCells(
    renderItems,
    isHorizontal ? divWidth : divHeight,
    resolvedDefaultItemOffset
  );

  return (
    // position relative must be in the div or it gets lost as a package reference
    <div
      style={{ width: divWidth, height: divHeight, position: 'relative', ...containerStyle }}
      className={resolveContainerClassName(
        `rounded flex ${isHorizontal ? "flex-row" : "flex-col"}`,
        DEFAULT_RENDERER_CONTAINER_CLASS_NAME,
        containerClassName
      )}
    >
      {/* background cells */}
      <div className="absolute inset-0 pointer-events-none">
        {gridCells.map((cell, index) => (
          <div
            key={`${isHorizontal ? "v" : "h"}-${index}`}
            className={`absolute flex items-center justify-center text-gray-500 text-s select-none ${
              showCellBorders
                ? isHorizontal
                  ? "top-0 bottom-0 border-l border-gray-600"
                  : "left-0 right-0 border-t border-gray-600"
                : ""
            }`}
            style={{
              ...(isHorizontal
                ? {
                    left: `${cell.offset}px`,
                    width: `${cell.size}px`,
                  }
                : {
                    top: `${cell.offset}px`,
                    height: `${cell.size}px`,
                  }),
            }}
          >
            {`${emptyItemText ?? ""}`}
          </div>
        ))}
      </div>

      {gridCells.map((cell, index) => {
        const label = itemLabels[index];
        if (label === undefined || label === "") return null;

        return (
          <div
            key={`item-label-${index}`}
            className="absolute text-sm font-mono text-gray-300"
            style={
              isHorizontal
                ? {
                    top: "100%",
                    left: cell.offset + cell.size / 2,
                    marginTop: 6,
                    transform: "translateX(-50%)",
                    whiteSpace: "nowrap",
                  }
                : {
                    top: cell.offset + cell.size / 2,
                    left: -8,
                    transform: "translate(-100%, -50%)",
                    whiteSpace: "nowrap",
                  }
            }
          >
            {label}
          </div>
        );
      })}

      <div className="relative flex-grow">
        {renderItems.map(({ item, collapsedIndex, offset, itemOffset }) => {
          const baseItemWidth = isHorizontal
            ? item.itemOffset ?? itemWidth ?? itemOffset
            : itemWidth ?? divWidth;
          const baseItemHeight = isHorizontal
            ? itemHeight ?? divHeight
            : item.itemOffset ?? itemHeight ?? itemOffset;
          const resolvedItemWidth = isHorizontal
            ? Math.max(baseItemWidth - resolvedItemGap * 2, 0)
            : Math.max(baseItemWidth - resolvedCrossAxisGap * 2, 0);
          const resolvedItemHeight = isHorizontal
            ? Math.max(baseItemHeight - resolvedCrossAxisGap * 2, 0)
            : Math.max(baseItemHeight - resolvedItemGap * 2, 0);

          return (
            <ArrayItem
              key={item.id}
              item={item}
              itemHeight={resolvedItemHeight}
              itemWidth={resolvedItemWidth}
              slotHeight={isHorizontal ? baseItemHeight : itemOffset}
              slotWidth={isHorizontal ? itemOffset : baseItemWidth}
              collapsedIndex={collapsedIndex}
              itemIndex={slotIndexByOffset.get(offset) ?? 0}
              isSlotOwner={slotOwnerIdByOffset.get(offset) === item.id}
              orientation={orientation}
              mainOffset={
                offset + resolvedItemGap
              }
              crossOffset={resolvedCrossAxisGap}
              preInsertGap={preInsertGap}
              onCollapse={collapse}
              disableAnimations={disableAnimations}
              itemGap={itemGap ?? 0}
              borderWidth={borderWidth}
              renderContent={renderContent}
            />
          );
        })}
      </div>
    </div>
  );
}
