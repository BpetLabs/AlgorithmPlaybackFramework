import { describe, expect, it } from "vitest";
import { clampPlaybackStep } from "./useControlManager";

describe("clampPlaybackStep", () => {
  it("clamps playback when a replacement snapshot set is shorter", () => {
    expect(clampPlaybackStep(20, 5)).toBe(5);
  });

  it("never returns a negative step", () => {
    expect(clampPlaybackStep(-2, 5)).toBe(0);
    expect(clampPlaybackStep(2, -1)).toBe(0);
  });

  it("rejects invalid and fractional steps", () => {
    expect(() => clampPlaybackStep(Number.NaN, 5)).toThrow(
      "Playback step must be an integer"
    );
    expect(() => clampPlaybackStep(3.8, 5)).toThrow(
      "Playback step must be an integer"
    );
    expect(() => clampPlaybackStep(3, 5.9)).toThrow(
      "Maximum playback step must be an integer"
    );
  });
});
