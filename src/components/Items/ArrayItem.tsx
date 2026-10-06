"use client";
import { motion } from "framer-motion";
import { useLayoutEffect } from "react";
import { ControlItem, ControlItemState } from "../../common/models/controlItem";
import { useAnimatePreInsert } from "../../hooks/animations/useAnimatePreInsert";
import { useAnimateMoveIntoPlace } from "../../hooks/animations/useAnimateMoveIntoPlace";
import { useAnimatePreRemove } from "../../hooks/animations/useAnimatePreRemove";
import { useAnimateRemoving } from "../../hooks/animations/useAnimateRemoving";
import { useAnimateShake } from "../../hooks/animations/useAnimateShake";
import { buildHighlightOverlayStyle, buildItemBoxStyle } from "../Renderers/utils/itemBoxStyle";
import { ArrayOrientation } from "../../common/models/arrayControl";
import { useAnimationController } from "../../hooks/animations/useAnimationController";

export interface ArrayItemProps {
  item: ControlItem;
  itemHeight: number;
  itemWidth: number;
  slotHeight?: number;
  slotWidth?: number;
  collapsedIndex: number;
  itemIndex: number;
  isSlotOwner: boolean;
  orientation: ArrayOrientation;
  mainOffset: number;
  crossOffset?: number;
  preInsertGap?: number;
  onCollapse?: (id: string) => void;
  disableAnimations: boolean;
  itemGap: number;
  borderWidth?: number;
  renderContent?: (
    item: ControlItem,
    options?: { index?: number; isSlotOwner?: boolean }
  ) => React.ReactNode;
}

export default function ArrayItem({
  item,
  itemHeight,
  itemWidth,
  slotHeight = itemHeight,
  slotWidth = itemWidth,
  collapsedIndex,
  itemIndex,
  isSlotOwner,
  orientation,
  mainOffset,
  crossOffset = 0,
  preInsertGap,
  onCollapse,
  disableAnimations,
  borderWidth,
  renderContent,
}: ArrayItemProps) {
  const { motionStyle, controller: controls } = useAnimationController({
    opacity: item.state !== ControlItemState.Empty ? 1 : 0,
    zIndex: 100,
  });
  const isHorizontal = orientation === "horizontal";
  const zIndex = collapsedIndex * (isHorizontal ? slotWidth : slotHeight) + 1;
  const shouldSnapInPlace =
    disableAnimations &&
    (item.state === ControlItemState.Initial ||
      item.state === ControlItemState.Inserted ||
      item.state === ControlItemState.Empty);

  useLayoutEffect(() => {
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

  useAnimatePreInsert(item, collapsedIndex, slotHeight, slotWidth, disableAnimations, controls, isHorizontal, preInsertGap);
  useAnimateMoveIntoPlace(item, slotHeight, collapsedIndex, slotWidth, disableAnimations, controls, isHorizontal);
  useAnimatePreRemove(item, collapsedIndex, slotHeight, slotWidth, disableAnimations, controls, isHorizontal);
  useAnimateRemoving(item, collapsedIndex, slotHeight, slotWidth, disableAnimations, controls, isHorizontal, onCollapse);
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
        top: isHorizontal ? crossOffset : mainOffset,
        left: isHorizontal ? mainOffset : crossOffset,
        ...motionStyle,
      }}
    >
      {renderContent
        ? renderContent(item, { index: itemIndex, isSlotOwner })
        : null}
      {highlightOverlayStyle && <div style={highlightOverlayStyle} />}
    </motion.div>
  );
}

