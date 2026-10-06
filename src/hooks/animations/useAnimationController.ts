"use client";

import {
  animate,
  useMotionValue,
  type AnimationPlaybackControlsWithThen,
  type MotionValue,
} from "framer-motion";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type {
  AnimatedProperty,
  AnimationController,
  AnimationDefinition,
  AnimationInitialValues,
} from "../../common/models/animation";

type MotionValues = Record<AnimatedProperty, MotionValue<number>>;

export function useAnimationController(
  initialValues: AnimationInitialValues = {}
) {
  const x = useMotionValue(initialValues.x ?? 0);
  const y = useMotionValue(initialValues.y ?? 0);
  const rotate = useMotionValue(initialValues.rotate ?? 0);
  const opacity = useMotionValue(initialValues.opacity ?? 1);
  const scaleX = useMotionValue(initialValues.scaleX ?? 1);
  const scaleY = useMotionValue(initialValues.scaleY ?? 1);
  const scale = useMotionValue(initialValues.scale ?? 1);
  const zIndex = useMotionValue(initialValues.zIndex ?? 100);

  const motionValues = useMemo<MotionValues>(
    () => ({ x, y, rotate, opacity, scaleX, scaleY, scale, zIndex }),
    [opacity, rotate, scale, scaleX, scaleY, x, y, zIndex]
  );
  const activeAnimations = useRef(
    new Map<AnimatedProperty, AnimationPlaybackControlsWithThen>()
  );

  const stopProperty = useCallback((property: AnimatedProperty) => {
    activeAnimations.current.get(property)?.stop();
    activeAnimations.current.delete(property);
  }, []);

  const stop = useCallback(() => {
    activeAnimations.current.forEach((animation) => animation.stop());
    activeAnimations.current.clear();
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(
    async (definition: AnimationDefinition) => {
      const { transition, ...targets } = definition;
      const animations = Object.entries(targets).map(
        ([propertyName, target]) => {
          const property = propertyName as AnimatedProperty;
          stopProperty(property);

          const animation = animate(
            motionValues[property],
            target,
            transition
          );
          activeAnimations.current.set(property, animation);

          return Promise.resolve(animation).finally(() => {
            if (activeAnimations.current.get(property) === animation) {
              activeAnimations.current.delete(property);
            }
          });
        }
      );

      await Promise.all(animations);
    },
    [motionValues, stopProperty]
  );

  const set = useCallback(
    (definition: AnimationDefinition) => {
      const { transition: _transition, ...targets } = definition;

      Object.entries(targets).forEach(([propertyName, target]) => {
        const property = propertyName as AnimatedProperty;
        stopProperty(property);
        const value = Array.isArray(target) ? target.at(-1) : target;

        if (value !== undefined) {
          motionValues[property].set(value);
        }
      });
    },
    [motionValues, stopProperty]
  );

  const controller = useMemo<AnimationController>(
    () => ({ start, set, stop }),
    [set, start, stop]
  );

  return { motionStyle: motionValues, controller };
}
