"use client";
import type { AnimationController } from "../../common/models/animation";
import { useLayoutEffect, useRef } from "react";
import { ControlItem, ControlItemState, isRemovingState } from "../../common/models/controlItem";
import { move, moveThenFallRotateAndDisappear, disappear, setZIndex } from "../../utils/animationEffects";

export function useAnimateRemoving(item: ControlItem,
  collapsedIndex: number,
  itemHeight: number,
  itemWidth: number,
  disableAnimations: boolean,
  controls: AnimationController,
  leftRight: boolean,
  onCollapse?: (id: string) => void) {

  const isRemovingInsert = item.state === ControlItemState.RemovingInsert;
  const isRemovingInPlace = item.state === ControlItemState.RemovingInPlace;
  const isRemovingUpdate = item.state === ControlItemState.RemovingUpdate;
  const isRemovingHead = item.state === ControlItemState.RemovingHead;
  const isRemovingTail = item.state === ControlItemState.RemovingTail;
  const isRemovingTake = item.state === ControlItemState.RemovingTake;
  const isRemoving = isRemovingState(item.state);
  const hasSkippedInsert =
    item.previousState === ControlItemState.PreInsert ||
    item.previousState === ControlItemState.PreUpdate ||
    item.previousState === ControlItemState.PreHead ||
    item.previousState === ControlItemState.PreTail;
  const wasRemovingRef = useRef(false);
  const yInPlace = 0;
  const xInPlace = 0;
  const zIndex = collapsedIndex * itemHeight + 1;

  // Stack
  let falldistance = itemWidth * 1;
  let xSlideRight = itemWidth;
  let xSlideLeft = -itemWidth * 1.05;
  let moveDuration = 1;

  if(leftRight)
  {
      falldistance = itemHeight * 2;
      xSlideRight = 0;
      xSlideLeft = 0;
      moveDuration = 0;
  }

  useLayoutEffect(() => {
    let cancelled = false;
    const wasRemoving = wasRemovingRef.current;
    wasRemovingRef.current = isRemoving;

    if (wasRemoving && !isRemoving) {
      controls.stop();
      controls.set({
        x: xInPlace,
        y: yInPlace,
        rotate: 0,
        opacity: item.state === ControlItemState.Empty ? 0 : 1,
        scaleX: 1,
        scaleY: 1,
        scale: 1,
        zIndex,
      });
    }

    if (disableAnimations && isRemoving) {
      (async () => {
        // Reverse/scrub mode: removing states should appear as already gone.
        if (cancelled) return;
        await disappear(controls, 0);
      })();
      return () => {
        cancelled = true;
        controls.stop();
      };
    }

    if (!disableAnimations) {
      if (isRemoving) {
        if (isRemovingInsert || isRemovingInPlace || isRemovingHead || isRemovingTail) {

          (async () => {
            if (hasSkippedInsert) {
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
            }

            if (cancelled) return;
            await moveThenFallRotateAndDisappear(controls, xSlideRight, yInPlace, falldistance, moveDuration);
            if (cancelled) return;
            
            if(item.collapse !== false) {
              onCollapse?.(item.id);
            }
          })();
        }
        else if (isRemovingUpdate) {
          (async () => {
            if (cancelled) return;
            await setZIndex(controls);
            if (cancelled) return;

            // Hides the removing item
            await disappear(controls, 1);
          })();
        }
        else if (isRemovingTake) {
          (async () => {
            // If an item skipped a state transition it needs to move into place first before it should animate
            if (cancelled) return;
            await move(controls, xSlideLeft, yInPlace, 1);
            if (cancelled) return;

            await disappear(controls, 1);
            if (cancelled) return;

            if(item.collapse !== false) {
              onCollapse?.(item.id);
            }
          })();
        }
      }
    }

    return () => {
      cancelled = true;
      controls.stop();
    };
  // Intentionally keyed to state transitions only to avoid replaying fall animations during unrelated rerenders.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRemovingInsert, isRemovingInPlace, isRemovingUpdate, isRemovingHead, isRemovingTail, isRemovingTake, hasSkippedInsert, disableAnimations]);
}
