"use client";

import type { AnimationController } from "../../common/models/animation";
import { ControlItem, isPreRemovingState } from "../../common/models/controlItem";
import { useAnimatePreRemove } from "./useAnimatePreRemove";
import { useAnimateRemoving } from "./useAnimateRemoving";
import { useAnimateShake } from "./useAnimateShake";


type UseAnimateNonCollapsingRemoveArgs = {
  item: ControlItem;
  itemHeight: number;
  itemWidth: number;
  disableAnimations: boolean;
  controls: AnimationController;
  leftRight: boolean;
};

export function useAnimateNonCollapsingRemove({
  item,
  itemHeight,
  itemWidth,
  disableAnimations,
  controls,
  leftRight,
}: UseAnimateNonCollapsingRemoveArgs) {
  const isPreRemove = isPreRemovingState(item.state);
  const disableAnimationsForDeletePhase = disableAnimations && !isPreRemove;

  useAnimatePreRemove(item, 0, itemHeight, itemWidth, disableAnimationsForDeletePhase, controls);
  useAnimateRemoving(item, 0, itemHeight, itemWidth, disableAnimationsForDeletePhase, controls, leftRight, undefined);
  useAnimateShake(item, controls, disableAnimationsForDeletePhase);
}
