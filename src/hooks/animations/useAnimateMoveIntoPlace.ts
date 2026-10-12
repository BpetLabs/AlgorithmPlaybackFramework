"use client";
import type { AnimationController } from "../../common/models/animation";
import { ControlItem, ControlItemState } from "../../common/models/controlItem";
import { move } from "../../utils/animationEffects";
import { useIsomorphicLayoutEffect } from "../useIsomorphicLayoutEffect";

export function useAnimateMoveIntoPlace(
  item: ControlItem,
  itemHeight: number,
  collapsedIndex: number,
  itemWidth: number,
  disableAnimations: boolean,
  controls: AnimationController,
  leftRight: boolean) {

  const isInserted = item.state === ControlItemState.Inserted;
  const isInitial = item.state === ControlItemState.Initial;

  const xInPlace = 0
  const yInPlace = 0
  const zIndex = collapsedIndex * itemHeight + 1;

  // Keep layering in sync when collapse changes offsets without replaying the move-in animation.
  useIsomorphicLayoutEffect(() => {
    if (!isInserted && !isInitial) return;
    controls.set({ zIndex });
  }, [controls, isInserted, isInitial, zIndex]);

  useIsomorphicLayoutEffect(() => {
    let cancelled = false;

    if (isInserted || isInitial) {
      let startX = xInPlace;
      let startY = yInPlace;

      if (item.previousState === ControlItemState.PreInsert || item.previousState === ControlItemState.PreUpdate) {
        if (leftRight) {
          startX = 0;
          startY = -itemHeight * 1.3;
        } else {
          startX = -itemWidth * 1.05;
          startY = 0;
        }
      } else if (item.previousState === ControlItemState.PreHead) {
        if (leftRight) {
          startX = -itemWidth;
          startY = 0;
        } else {
          startX = 0;
          startY = itemHeight;
        }
      } else if (item.previousState === ControlItemState.PreTail) {
        if (leftRight) {
          startX = itemWidth;
          startY = 0;
        } else {
          startX = 0;
          startY = -itemHeight;
        }
      }

      const isAlreadyInPlace = startX === xInPlace && startY === yInPlace;

      if (disableAnimations || isAlreadyInPlace) {
        controls.stop();
        controls.set({ x: xInPlace, y: yInPlace, rotate: 0, scaleX: 1, scaleY: 1, opacity: 1 });
      } else {
        controls.stop();
        controls.set({ x: startX, y: startY, rotate: 0, scaleX: 1, scaleY: 1, opacity: 1 });

        // Doesnt matter where they are - move into place
        (async () => {
          if (cancelled) return;
          await move(controls, xInPlace, yInPlace, 1);
        })();
      }

    }

    return () => {
      cancelled = true;
      controls.stop();
    };
  }, [isInserted, isInitial, item.previousState, leftRight, itemHeight, itemWidth, controls, disableAnimations]);
}
