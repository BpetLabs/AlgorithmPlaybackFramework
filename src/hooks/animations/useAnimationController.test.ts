// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const motionMocks = vi.hoisted(() => ({
  animate: vi.fn(),
  useMotionValue: vi.fn(),
}));

vi.mock("framer-motion", () => motionMocks);

import { useAnimationController } from "./useAnimationController";

const resolvedAnimation = () => Object.assign(Promise.resolve(), { stop: vi.fn() });
const pendingAnimation = () => {
  const promise = new Promise<void>(() => undefined);
  return Object.assign(promise, { stop: vi.fn() });
};

describe("useAnimationController", () => {
  beforeEach(() => {
    motionMocks.animate.mockReset();
    motionMocks.useMotionValue.mockReset();
    motionMocks.useMotionValue.mockImplementation((initial: number) => ({
      value: initial,
      set: vi.fn(),
    }));
    motionMocks.animate.mockImplementation(() => resolvedAnimation());
  });

  it("sets each property to its final requested keyframe", () => {
    const { result } = renderHook(() => useAnimationController({ x: 5, opacity: 0.5 }));

    act(() => result.current.controller.set({ x: [1, 4, 9], opacity: 0.25, transition: { duration: 1 } }));
    expect(result.current.motionStyle.x.set).toHaveBeenCalledWith(9);
    expect(result.current.motionStyle.opacity.set).toHaveBeenCalledWith(0.25);
  });

  it("starts each requested property with the shared transition", async () => {
    const { result } = renderHook(() => useAnimationController());

    await act(async () => {
      await result.current.controller.start({ x: 10, y: [0, 20], transition: { duration: 0.5 } });
    });

    expect(motionMocks.animate).toHaveBeenCalledTimes(2);
    expect(motionMocks.animate).toHaveBeenCalledWith(result.current.motionStyle.x, 10, { duration: 0.5 });
    expect(motionMocks.animate).toHaveBeenCalledWith(result.current.motionStyle.y, [0, 20], { duration: 0.5 });
  });

  it("stops a previous property animation and all active animations on unmount", () => {
    const first = pendingAnimation();
    const second = pendingAnimation();
    motionMocks.animate.mockReturnValueOnce(first).mockReturnValueOnce(second);
    const { result, unmount } = renderHook(() => useAnimationController());

    act(() => {
      void result.current.controller.start({ x: 10 });
      void result.current.controller.start({ x: 20 });
    });
    expect(first.stop).toHaveBeenCalledOnce();

    unmount();
    expect(second.stop).toHaveBeenCalledOnce();
  });
});
