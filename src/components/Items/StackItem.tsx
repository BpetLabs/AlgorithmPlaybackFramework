"use client";
import { motion } from "framer-motion";
import { ControlItem, ControlItemState } from "../../common/models/controlItem";
import { useAnimatePreInsert } from "../../hooks/animations/useAnimatePreInsert";
import { useAnimateMoveIntoPlace } from "../../hooks/animations/useAnimateMoveIntoPlace";
import { useAnimatePreRemove } from "../../hooks/animations/useAnimatePreRemove";
import { useAnimateRemoving } from "../../hooks/animations/useAnimateRemoving";
import { useAnimateShake } from "../../hooks/animations/useAnimateShake";
import { buildHighlightOverlayStyle, buildItemBoxStyle } from "../Renderers/utils/itemBoxStyle";
import { useAnimationController } from "../../hooks/animations/useAnimationController";
import { useIsomorphicLayoutEffect } from "../../hooks/useIsomorphicLayoutEffect";

export interface StackItemProps {
  item: ControlItem;
  itemHeight: number;
  itemWidth: number;
  slotHeight?: number;
  slotWidth?: number;
  collapsedIndex: number;
  bottomOffset?: number;
  topOffset?: number;
  leftOffset?: number;
  preInsertGap?: number;
  onCollapse?: (id: string) => void;
  disableAnimations: boolean;
  itemGap: number;
  borderWidth?: number;
  renderContent?: (
    item: ControlItem,
    options?: { splitColumnWidths?: number[] }
  ) => React.ReactNode;
  splitColumnWidths?: number[];
  reverseDirection?: boolean;
}

export default function StackItem({
  item,
  itemHeight,
  itemWidth,
  slotHeight = itemHeight,
  slotWidth = itemWidth,
  collapsedIndex,
  bottomOffset,
  topOffset,
  leftOffset,
  preInsertGap,
  onCollapse,
  disableAnimations,
  borderWidth,
  renderContent,
  splitColumnWidths,
  reverseDirection = false,
}: StackItemProps) {
  const { motionStyle, controller: controls } = useAnimationController({
    opacity: item.state !== ControlItemState.Empty ? 1 : 0,
    zIndex: 100,
  });
  const zIndex = collapsedIndex * slotHeight + 1;
  const shouldSnapInPlace =
    disableAnimations &&
    (item.state === ControlItemState.Initial ||
      item.state === ControlItemState.Inserted ||
      item.state === ControlItemState.Empty);

  useIsomorphicLayoutEffect(() => {
    if (!shouldSnapInPlace) return;

    controls.stop();
    controls.set({
      x: 0,
      y: 0,
      rotate: 0,
      opacity: item.state !== ControlItemState.Empty ? 1 : 0,
      scaleX: 1,
      scaleY: 1,
      scale: 1,
      zIndex,
    });
  }, [controls, shouldSnapInPlace, item.state, zIndex]);

  useAnimatePreInsert(item, collapsedIndex, slotHeight, slotWidth, disableAnimations, controls, false, preInsertGap, reverseDirection);
  useAnimateMoveIntoPlace(item, slotHeight, collapsedIndex, slotWidth, disableAnimations, controls, false, reverseDirection);
  useAnimatePreRemove(item, collapsedIndex, slotHeight, slotWidth, disableAnimations, controls, false, reverseDirection);
  useAnimateRemoving(item, collapsedIndex, slotHeight, slotWidth, disableAnimations, controls, false, onCollapse);
  useAnimateShake(item, controls, disableAnimations);
  const highlightOverlayStyle = buildHighlightOverlayStyle(item, { borderWidth, borderRadius: 8 });

  return (
    <motion.div
      style={{
        width: itemWidth,
        height: itemHeight,
        ...buildItemBoxStyle(item, { borderWidth }),
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        bottom: bottomOffset,
        top: topOffset,
        left: leftOffset,
        ...motionStyle,
      }}
    >
      {renderContent ? renderContent(item, { splitColumnWidths }) : null}
      {highlightOverlayStyle && <div style={highlightOverlayStyle} />}
    </motion.div>
  );
}

