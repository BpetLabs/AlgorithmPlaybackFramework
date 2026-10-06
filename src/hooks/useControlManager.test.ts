import { describe, expect, it } from "vitest";
import { clampPlaybackStep } from "./useControlManager";

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
