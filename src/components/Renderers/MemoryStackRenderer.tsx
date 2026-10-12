"use client";

import StackItem from "../Items/StackItem";
import { ControlItem } from "../../common/models/controlItem";
import { Snapshot } from "../../common/models/snapshot";
import { buildRenderItems } from "./utils/buildRenderItems";
import { DEFAULT_RENDERER_CONTAINER_CLASS_NAME, RendererProps, resolveContainerClassName } from "./rendererConfig";
import { requirePositiveDimension } from "./utils/dimensions";
import { useCollapsedItems } from "../../hooks/useCollapsedItems";

interface MemoryStackRendererProps extends RendererProps {
  snapshot: Snapshot<ControlItem>;
  disableAnimations: boolean;
  defaultItemOffset?: number;
  gridOffset?: number;
  divHeight: number;
  divWidth: number;
  itemGap?: number;
  itemCrossAxisGap?: number;
  itemWidth?: number;
  itemHeight?: number;
  preInsertGap?: number;
  startingMemoryAddress?: number;
  memoryAddressIncrement?: number;
  stackDirection?: "top-down" | "bottom-up";
}

export function MemoryStackRenderer({
  snapshot,
  disableAnimations,
  defaultItemOffset = 40,
  gridOffset = defaultItemOffset,
  divWidth,
  divHeight,
  itemGap = 0,
  itemCrossAxisGap = 0,
  itemWidth,
  itemHeight,
  preInsertGap,
  startingMemoryAddress,
  memoryAddressIncrement = 0x8,
  stackDirection = "top-down",
  renderContent,
  borderWidth,
  containerClassName,
  containerStyle,
}: MemoryStackRendererProps) {
  const snapshotItems = snapshot.items;
  const resolvedDefaultItemOffset = requirePositiveDimension(
    defaultItemOffset,
    "defaultItemOffset"
  );
  const resolvedGridOffset = requirePositiveDimension(
    gridOffset,
    "gridOffset"
  );
  const { collapsedIds, collapse } = useCollapsedItems(disableAnimations);

  const renderItems = buildRenderItems(
    snapshotItems,
    collapsedIds,
    disableAnimations,
    resolvedDefaultItemOffset
  );
  const resolvedItemGap = Math.max(itemGap, 0);
  const resolvedCrossAxisGap = Math.max(itemCrossAxisGap, 0);
  const baseItemWidth = itemWidth ?? divWidth;
  const resolvedItemWidth = Math.max(
    baseItemWidth - resolvedCrossAxisGap * 2,
    0
  );
  const itemLeftOffset = resolvedCrossAxisGap;

  return (
    <div
      style={{ width: divWidth, height: divHeight, position: 'relative', ...containerStyle }}
      className={resolveContainerClassName(
        "rounded flex flex-col",
        DEFAULT_RENDERER_CONTAINER_CLASS_NAME,
        containerClassName
      )}
    >
      {/* background line rows */}
      <div className="absolute inset-0 pointer-events-none">
        {(() => {
          const rowHeight = resolvedGridOffset;
          const rowCount = Math.ceil(divHeight / rowHeight);
          return Array.from({ length: rowCount }).map((_, i) => {
            let hex;
            if (startingMemoryAddress !== undefined) {
              const base = startingMemoryAddress;
              const addr = base + i * memoryAddressIncrement;
              hex = addr.toString(16).toUpperCase();
            }
            return (
              <div
                key={i}
                className="border-b border-gray-600 relative text-gray-500 text-xs select-none"
                style={{ height: `${rowHeight}px`, paddingLeft: "0.5rem" }}
              >
                {hex && (
                  <span className="absolute bottom-0 left-0">
                    {`0x${hex}`}
                  </span>
                )}
              </div>
            );
          });
        })()}
      </div>

      {/* foreground stack items */}
      <div className="relative flex-grow flex flex-col items-start justify-start">
        {renderItems.map(({ item, collapsedIndex, offset, itemOffset }) => {
          const baseItemHeight =
            item.itemOffset ?? itemHeight ?? itemOffset;
          const mainOffset =
            offset + resolvedItemGap;

          return (
            <StackItem
              key={item.id}
              item={item}
              itemHeight={Math.max(
                baseItemHeight - resolvedItemGap * 2,
                0
              )}
              itemWidth={resolvedItemWidth}
              slotHeight={itemOffset}
              slotWidth={baseItemWidth}
              collapsedIndex={collapsedIndex}
              topOffset={
                stackDirection === "top-down" ? mainOffset : undefined
              }
              bottomOffset={
                stackDirection === "bottom-up" ? mainOffset : undefined
              }
              leftOffset={itemLeftOffset}
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
