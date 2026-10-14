"use client";
import type { AnimationController } from "../../common/models/animation";
import { ControlItem, ControlItemState } from "../../common/models/controlItem";
import { warpIn } from "../../utils/animationEffects";
import { useIsomorphicLayoutEffect } from "../useIsomorphicLayoutEffect";

export function useAnimatePreInsert(
  item: ControlItem,
  collapsedIndex: number,
  itemHeight: number,
  itemWidth: number,
  disableAnimations: boolean,
  controls: AnimationController,
  leftRight: boolean,
  preInsertGap?: number) {

  const isPreInsert = item.state === ControlItemState.PreInsert;
  const isPreUpdate = item.state === ControlItemState.PreUpdate;
  const isPreHead = item.state === ControlItemState.PreHead;
  const isPreTail = item.state === ControlItemState.PreTail;
 
  // Stack - bottom up
  let xPreInsert = -(preInsertGap !== undefined ? itemWidth + preInsertGap : itemWidth * 1.05);
  let yPreInsert = 0
  let xPreHead = 0
  let yPreHead = itemHeight
  let xPreTail = 0
  let yPreTail = -itemHeight
  let scaleXInsert = 0;
  let scaleYInsert = 1;
  let scaleXHeadTail= 0;
  let scaleYHeadTail = 1;

  // Array - left right
  if(leftRight) {
      xPreInsert =  0
      yPreInsert = -(preInsertGap !== undefined ? itemHeight + preInsertGap : itemHeight * 1.3);
      xPreHead = -itemWidth
      yPreHead = 0
      xPreTail = itemWidth
      yPreTail = 0 
      scaleXInsert = 1;
      scaleYInsert = 0;
      scaleXHeadTail = 0;
      scaleYHeadTail = 1;
  }

  const zIndex = collapsedIndex * itemHeight + 1;

  useIsomorphicLayoutEffect(() => {
    let cancelled = false;

    if (isPreInsert || isPreUpdate || isPreHead || isPreTail) {

      let x = 0;
      let y = 0;
      let scaleX = 1;
      let scaleY = 1;

      if (isPreInsert || isPreUpdate) {
        x = xPreInsert;
        y = yPreInsert;
        scaleX = scaleXInsert;
        scaleY = scaleYInsert;
      }
      else if (isPreHead) {
        x = xPreHead;
        y = yPreHead;
        scaleX = scaleXHeadTail;
        scaleY = scaleYHeadTail;
      }
      else if (isPreTail)
      {
        x = xPreTail;
        y = yPreTail;
        scaleX = scaleXHeadTail;
        scaleY = scaleYHeadTail;
      }

      if (disableAnimations) {
        controls.stop();
        controls.set({ x, y, rotate: 0, scaleX: 1, scaleY: 1, opacity: 1, zIndex });
      }
      else {
        controls.stop();
        controls.set({ x, y, rotate: 0, scaleX, scaleY, opacity: 0, zIndex });

        (async () => {
          if (cancelled) return;
          await warpIn(controls, 1);
        })();
      }

    }

    return () => {
      cancelled = true;
      controls.stop();
    };
  }, [
    item.id,
    item.state,
    disableAnimations,
    controls,
  ]);
}
