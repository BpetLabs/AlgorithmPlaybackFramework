import type {
  AnimationController,
  AnimationDefinition,
} from "../common/models/animation";

async function safeStart(
  controls: AnimationController,
  animation: AnimationDefinition
) {
  await controls.start(animation);
}

export async function warpIn(
  controls: AnimationController,
  duration: number,
) {
    await safeStart(controls, {
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        transition: { duration: duration, ease: "easeIn" },
    });
}

export async function shake(
  controls: AnimationController
) {
    await safeStart(controls, {
        zIndex: 200,
        transition: { duration: 0 },
    });

    await safeStart(controls, {
        x: [0, 0, 0, 0, 0],
        y: [0, 3, 0, -3, 0],
        transition: { duration: 1, repeat: Infinity },
    });
}

export async function move(
  controls: AnimationController,
  x : number,
  y : number,
  duration: number,
){
    await safeStart(controls, {
    x: x,
    y: y,
    transition: { duration: duration, ease: "linear" },
  });
}

export async function fallRotateAndDisappear(
  controls: AnimationController,
  startX : number,
  startY : number,
  fallDistance: number,
){
  // Fall + rotate + disappear
  await safeStart(controls, {
    x: [startX],
    y: [startY, fallDistance],
    rotate: [0, 80, 90],
    opacity: [1, 0, 0],
    transition: { duration: .75, ease: "linear" },
  });
}

export async function moveThenFallRotateAndDisappear(
  controls: AnimationController,
  moveX: number,
  startY: number,
  fallDistance: number,
  moveDuration: number,
) {
  const totalDuration = moveDuration + 0.75;
  const moveRatio = totalDuration === 0 ? 0 : moveDuration / totalDuration;
  const fallMidRatio = moveDuration > 0
    ? Math.min(moveRatio + (1 - moveRatio) * 0.85, 1)
    : 0.85;

  await safeStart(controls, {
    x: [0, moveX, moveX, moveX],
    y: [startY, startY, fallDistance, fallDistance],
    rotate: [0, 0, 80, 90],
    opacity: [1, 1, 0, 0],
    transition: {
      duration: totalDuration,
      ease: "linear",
      times: moveDuration > 0 ? [0, moveRatio, fallMidRatio, 1] : [0, 0, fallMidRatio, 1],
    },
  });
}

export async function disappear(
  controls: AnimationController,
  duration: number,
){
  // Disappear
  await safeStart(controls, {
    opacity: 0,
    transition: { duration: duration, ease: "linear" },
  });
}

export async function shakeAndDisappear(
  controls: AnimationController,
  duration: number,
){
  await safeStart(controls, {
    zIndex: 200,
    transition: { duration: 0 },
  });

  await safeStart(controls, {
    y: [0, 3, 0, -3, 0],
    opacity: [1, 0.75, 0.5, 0.25, 0],
    transition: { duration: duration, ease: "linear" },
  });
}

export async function reset(
  controls: AnimationController,
  x: number,
  y: number,
){
  // Disappear
  await safeStart(controls, {
    x: x,
    y: y,
    opacity: 1,
    scaleX: 1,
    scaleY: 1,
    scale: 1,
    rotate: 0,
    transition: { duration: .001, ease: "linear" },
  });
}

export async function setZIndex(
  controls: AnimationController,
){
  // Disappear
  await safeStart(controls, {
    zIndex: 1,
    transition: { duration: 0, ease: "linear" },
  });
}
