"use client";
import type { AnimationController } from "../../common/models/animation";
import { ControlItem, ControlItemState, isPreRemovingState } from "../../common/models/controlItem";
import { move, shake, reset } from "../../utils/animationEffects";
import { useIsomorphicLayoutEffect } from "../useIsomorphicLayoutEffect";

export function useAnimatePreRemove(
  item: ControlItem, 
  collapsedIndex: number, 
  itemHeight: number, 
  itemWidth: number, 
  disableAnimations: boolean, 
  controls: AnimationController,
  leftRight: boolean = false) {

  const isPreRemoveUpdate = item.state === ControlItemState.PreRemoveUpdate;

  const xInPlace = 0
  const yInPlace = 0
  const zIndex = collapsedIndex * itemHeight + 1;
  let skippedInsertStartX = xInPlace;
  let skippedInsertStartY = yInPlace;
  const shouldFinishSkippedInsert =
    item.previousState === ControlItemState.PreInsert ||
    item.previousState === ControlItemState.PreUpdate ||
    item.previousState === ControlItemState.PreHead ||
    item.previousState === ControlItemState.PreTail;

  if (item.previousState === ControlItemState.PreInsert || item.previousState === ControlItemState.PreUpdate) {
    skippedInsertStartX = leftRight ? 0 : -itemWidth * 1.05;
    skippedInsertStartY = leftRight ? -itemHeight * 1.3 : 0;
  } else if (item.previousState === ControlItemState.PreHead) {
    skippedInsertStartX = leftRight ? -itemWidth : 0;
    skippedInsertStartY = leftRight ? 0 : itemHeight;
  } else if (item.previousState === ControlItemState.PreTail) {
    skippedInsertStartX = leftRight ? itemWidth : 0;
    skippedInsertStartY = leftRight ? 0 : -itemHeight;
  }

  useIsomorphicLayoutEffect(() => {
    let cancelled = false;
    const shouldPreRemove = isPreRemovingState(item.state);

    if (shouldPreRemove) {
      (async () => {
        if(disableAnimations) {
          controls.stop();
          controls.set({
            x: xInPlace,
            y: yInPlace,
            rotate: 0,
            opacity: 1,
            scaleX: 1,
            scaleY: 1,
            scale: 1,
            zIndex,
          });
          return;
        }

        if (cancelled) return;
        if (shouldFinishSkippedInsert) {
          controls.stop();
          controls.set({
            x: skippedInsertStartX,
            y: skippedInsertStartY,
            rotate: 0,
            opacity: 1,
            scaleX: 1,
            scaleY: 1,
            scale: 1,
            zIndex,
          });
        } else {
          // Own reset in animation hook so reverse from removing cannot stay invisible.
          await reset(controls, xInPlace, yInPlace);
        }

        // If an item skipped a state transition it needs to move into place first before it should animate
        if (cancelled) return;
        await move(controls, xInPlace, yInPlace, 1);     

        if(!isPreRemoveUpdate) {
          if (cancelled) return;
          await shake(controls);
        }
      })();
    }

    return () => {
      cancelled = true;
    };
  }, [
    item.id,
    item.state,
    item.previousState,
    disableAnimations,
    controls,
    isPreRemoveUpdate,
    leftRight,
    shouldFinishSkippedInsert,
    skippedInsertStartX,
    skippedInsertStartY,
    zIndex,
  ]);
}
