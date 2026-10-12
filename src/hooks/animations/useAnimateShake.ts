"use client";
import type { AnimationController } from "../../common/models/animation";
import { useEffect } from "react";
import { ControlItem, ControlItemState, isPreRemovingState, isRemovingState } from "../../common/models/controlItem";
import { shake } from "../../utils/animationEffects";

export function useAnimateShake(
  item: ControlItem, 
  controls: AnimationController,
  disableAnimations: boolean) {

  const isEmpty = item.state === ControlItemState.Empty;
  const isPreRemoving = isPreRemovingState(item.state);
  const isRemoving = isRemovingState(item.state);

  useEffect(() => {
    if (isEmpty || isRemoving) return;

    if (isPreRemoving) {
      (async () => {
        if (disableAnimations && item.state !== ControlItemState.PreRemoveUpdate) {
          await shake(controls);
        }
      })();
      return;
    }

    if (!isEmpty) {
      {
        if (item.shake) {
          (async () => {
              await shake(controls);
          })();
        } else if (!isRemoving && item.shake === false) {
            controls.stop();
            controls.set({ x: 0, y: 0, rotate: 0, zIndex: 1 });
        }
      }
    }
  }, [item.id, item.state, item.previousState, item.shake, isEmpty, isPreRemoving, isRemoving, disableAnimations, controls]);
}
