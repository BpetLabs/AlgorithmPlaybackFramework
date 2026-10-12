"use client";

import { motion } from "framer-motion";
import { ControlItem, ControlItemState } from "../../common/models/controlItem";
import { GraphNode } from "../../common/models/graph";
import { useAnimateNonCollapsingRemove } from "../../hooks/animations/useAnimateNonCollapsingRemove";
import { useAnimationController } from "../../hooks/animations/useAnimationController";

type GraphNodeItemProps = {
  node: GraphNode;
  top: number;
  left: number;
  width: number;
  height: number;
  disableAnimations?: boolean;
  children: React.ReactNode;
};

export default function GraphNodeItem({
  node,
  top,
  left,
  width,
  height,
  disableAnimations = false,
  children,
}: GraphNodeItemProps) {
  const { motionStyle, controller: controls } = useAnimationController({
    zIndex: 100,
  });
  const item: ControlItem = {
    id: node.id,
    state: node.state ?? ControlItemState.Initial,
    previousState: node.previousState,
    value: node.value ?? "",
    leftAlignedValue: node.leftAlignedValue,
    rightAlignedValue: node.rightAlignedValue,
    backgroundColor: node.backgroundColor,
    borderColor: node.borderColor,
    borderWidth: node.borderWidth,
    collapse: false,
    shake: node.state === ControlItemState.PreRemoveInPlace,
  };

  useAnimateNonCollapsingRemove({
    item,
    itemHeight: height,
    itemWidth: width,
    disableAnimations,
    controls,
    leftRight: true,
  });

  return (
    <motion.div
      style={{
        position: "absolute",
        top,
        left,
        width,
        height,
        ...motionStyle,
      }}
    >
      {children}
    </motion.div>
  );
}
