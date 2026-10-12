import type { ValueAnimationTransition } from "framer-motion/dom";

export type AnimatedProperty =
  | "x"
  | "y"
  | "rotate"
  | "opacity"
  | "scaleX"
  | "scaleY"
  | "scale"
  | "zIndex";

export type AnimationInitialValues = Partial<Record<AnimatedProperty, number>>;

export type AnimationDefinition = Partial<
  Record<AnimatedProperty, number | number[]>
> & {
  transition?: ValueAnimationTransition<number>;
};

export interface AnimationController {
  start(definition: AnimationDefinition): Promise<void>;
  set(definition: AnimationDefinition): void;
  stop(): void;
}
