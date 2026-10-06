// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ControlItemState } from "../common/models/controlItem";
import { clampPlaybackStep, useControlManager } from "./useControlManager";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("clampPlaybackStep", () => {
  it.each([
    { value: 3, maxSteps: 5, expected: 3, branch: "within range" },
    { value: 20, maxSteps: 5, expected: 5, branch: "above maximum" },
    { value: -2, maxSteps: 5, expected: 0, branch: "below zero" },
    { value: 2, maxSteps: -1, expected: 0, branch: "negative maximum" },
  ])("returns $expected when the value is $branch", ({ value, maxSteps, expected }) => {
    expect(clampPlaybackStep(value, maxSteps)).toBe(expected);
  });

  it("rejects a non-integer playback step", () => {
    expect(() => clampPlaybackStep(3.8, 5)).toThrow(
      "Playback step must be an integer"
    );
  });

  it("rejects a non-integer maximum step", () => {
    expect(() => clampPlaybackStep(3, 5.9)).toThrow(
      "Maximum playback step must be an integer"
    );
  });
});

describe("useControlManager", () => {
  const snapshots = [
    { id: "second", type: "array", step: 2, items: [{ id: "b2", state: ControlItemState.Initial }] },
    { id: "first", type: "array", step: 0, items: [{ id: "a0", state: ControlItemState.Initial }] },
    { id: "first", type: "array", step: 2, items: [{ id: "a2", state: ControlItemState.Initial }] },
    { id: "first", type: "array", step: 1, items: [{ id: "a1", state: ControlItemState.Initial }] },
  ];

  it("selects the latest snapshot for each control while navigating", () => {
    const { result } = renderHook(() => useControlManager({ snapshots }));

    expect(result.current).toMatchObject({
      sliderValue: 0,
      maxSteps: 2,
      stepLabel: "0/2",
      disableAnimations: false,
    });
    expect(result.current.latestSnapshots.first.step).toBe(0);
    expect(result.current.latestSnapshots.second).toBeUndefined();

    act(() => result.current.setSliderValue(2));
    expect(result.current.latestSnapshots.first.step).toBe(2);
    expect(result.current.latestSnapshots.second.step).toBe(2);
    expect(result.current.disableAnimations).toBe(false);

    act(() => result.current.setSliderValue(1));
    expect(result.current.latestSnapshots.first.step).toBe(1);
    expect(result.current.latestSnapshots.second).toBeUndefined();
    expect(result.current.disableAnimations).toBe(true);
  });

  it("clamps navigation after snapshots are replaced with a shorter history", () => {
    let scheduledFrame: FrameRequestCallback | undefined;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      scheduledFrame = callback;
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    const { result, rerender } = renderHook(
      ({ values }) => useControlManager({ snapshots: values }),
      { initialProps: { values: snapshots } }
    );
    act(() => result.current.setSliderValue(2));

    rerender({ values: snapshots.filter((entry) => entry.step === 0) });
    expect(result.current.sliderValue).toBe(0);
    expect(result.current.maxSteps).toBe(0);

    act(() => scheduledFrame?.(0));
    expect(result.current.sliderValue).toBe(0);
    expect(result.current.disableAnimations).toBe(true);
  });

});
