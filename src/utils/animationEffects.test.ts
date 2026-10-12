import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { AnimationController } from "../common/models/animation";
import {
  fallRotateAndDisappear,
  moveThenFallRotateAndDisappear,
  shake,
  shakeAndDisappear,
} from "./animationEffects";

describe("animation effects", () => {
  let controls: AnimationController;
  let start: Mock<AnimationController["start"]>;

  beforeEach(() => {
    start = vi.fn<AnimationController["start"]>().mockResolvedValue(undefined);
    controls = { start, set: vi.fn(), stop: vi.fn() };
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

  it("keeps shaking while a take removal disappears", async () => {
    await shakeAndDisappear(controls, 0.75);

    expect(start).toHaveBeenCalledTimes(2);
    expect(start.mock.calls[0][0]).toEqual({ zIndex: 200, transition: { duration: 0 } });
    expect(start.mock.calls[1][0]).toEqual({
      y: [0, 3, 0, -3, 0],
      opacity: [1, 0.75, 0.5, 0.25, 0],
      transition: { duration: 0.75, ease: "linear" },
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
