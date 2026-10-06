import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { AnimationController } from "../common/models/animation";
import {
  disappear,
  fallRotateAndDisappear,
  move,
  moveThenFallRotateAndDisappear,
  reset,
  setZIndex,
  shake,
  warpIn,
} from "./animationEffects";

describe("animation effects", () => {
  let controls: AnimationController;
  let start: Mock<AnimationController["start"]>;

  beforeEach(() => {
    start = vi.fn<AnimationController["start"]>().mockResolvedValue(undefined);
    controls = { start, set: vi.fn(), stop: vi.fn() };
  });

  it("builds insert, movement, disappearance, reset, and z-index animations", async () => {
    await warpIn(controls, 0.5);
    await move(controls, 10, 20, 0.25);
    await disappear(controls, 0.75);
    await reset(controls, 3, 4);
    await setZIndex(controls);

    expect(start.mock.calls.map(([definition]) => definition)).toEqual([
      expect.objectContaining({ scaleX: 1, scaleY: 1, opacity: 1, transition: { duration: 0.5, ease: "easeIn" } }),
      { x: 10, y: 20, transition: { duration: 0.25, ease: "linear" } },
      { opacity: 0, transition: { duration: 0.75, ease: "linear" } },
      expect.objectContaining({ x: 3, y: 4, opacity: 1, rotate: 0 }),
      { zIndex: 1, transition: { duration: 0, ease: "linear" } },
    ]);
  });

  it("raises the item before starting the repeating shake", async () => {
    await shake(controls);

    expect(start).toHaveBeenCalledTimes(2);
    expect(start.mock.calls[0][0]).toEqual({ zIndex: 200, transition: { duration: 0 } });
    expect(start.mock.calls[1][0]).toMatchObject({
      y: [0, 3, 0, -3, 0],
      transition: { duration: 1, repeat: Infinity },
    });
  });

  it("builds fall-only and move-then-fall keyframes", async () => {
    await fallRotateAndDisappear(controls, 5, 6, 80);
    await moveThenFallRotateAndDisappear(controls, 20, 6, 80, 1);

    expect(start.mock.calls[0][0]).toMatchObject({
      x: [5],
      y: [6, 80],
      rotate: [0, 80, 90],
      opacity: [1, 0, 0],
    });
    expect(start.mock.calls[1][0]).toMatchObject({
      x: [0, 20, 20, 20],
      y: [6, 6, 80, 80],
      transition: expect.objectContaining({ duration: 1.75 }),
    });
  });

  it("uses a zero-length movement segment when no move is requested", async () => {
    await moveThenFallRotateAndDisappear(controls, 0, 0, 50, 0);

    expect(start).toHaveBeenCalledWith(
      expect.objectContaining({
        transition: expect.objectContaining({ times: [0, 0, 0.85, 1] }),
      })
    );
  });
});
