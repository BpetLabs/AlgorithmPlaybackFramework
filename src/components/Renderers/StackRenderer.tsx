"use client";
import StackItem from "../Items/StackItem";
import { ControlItem } from "../../common/models/controlItem";
import { Snapshot } from "../../common/models/snapshot";
import { buildRenderItems } from "./utils/buildRenderItems";
import { DEFAULT_RENDERER_CONTAINER_CLASS_NAME, RendererProps, resolveContainerClassName } from "./rendererConfig";
import { requirePositiveDimension } from "./utils/dimensions";
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
  preInsertGap,
  splitColumnWidths,
  showCellBorders =
    snapshot.type !== "dictionary" && snapshot.type !== "booleanDictionary",
  renderContent,
  borderWidth,
  containerClassName,
  containerStyle,
}: StackRendererProps) {
  const snapshotItems = snapshot.items;
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
  const resolvedItemGap = Math.max(itemGap, 0);
  const resolvedCrossAxisGap = Math.max(itemCrossAxisGap, 0);
  const baseItemWidth = itemWidth ?? divWidth;
  const resolvedItemWidth = Math.max(
    baseItemWidth - resolvedCrossAxisGap * 2,
    0
  );
  const itemLeftOffset = resolvedCrossAxisGap;
  const gridCells = buildGridCells(
    renderItems,
    divHeight,
    resolvedDefaultItemOffset
  );

  return (
    // position relative must be in the div or it gets lost as a package reference
    <div
      style={{ width: divWidth, height: divHeight, position: 'relative', ...containerStyle }}
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
          const baseItemHeight =
            item.itemOffset ?? itemHeight ?? itemOffset;

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
