"use client";
import { useState, useMemo, useCallback, useEffect } from "react";
import { ControlItem } from "../common/models/controlItem";
import { Snapshot } from "../common/models/snapshot";

interface ControlManagerProps<T extends ControlItem> {
  snapshots: Snapshot<T>[]; // all snapshots for all controls
}

export function clampPlaybackStep(value: number, maxSteps: number): number {
  if (!Number.isInteger(value)) {
    throw new Error(`Playback step must be an integer. Received ${value}.`);
  }
  if (!Number.isInteger(maxSteps)) {
    throw new Error(`Maximum playback step must be an integer. Received ${maxSteps}.`);
  }

  return Math.max(0, Math.min(value, Math.max(0, maxSteps)));
}

export function useControlManager<T extends ControlItem>({
  snapshots,
}: ControlManagerProps<T>) {
  const [navigationState, setNavigationState] = useState({
    sliderValue: 0,
    disableAnimations: false,
  });

  // Compute max step across all snapshots
  const maxSteps = useMemo(
    () => snapshots.reduce(
      (maximum, snapshot) => {
        if (!Number.isInteger(snapshot.step) || snapshot.step < 0) {
          throw new Error(
            `Snapshot step must be a non-negative integer. Received ${snapshot.step}.`
          );
        }

        return Math.max(maximum, snapshot.step);
      },
      0
    ),
    [snapshots]
  );

  const setSliderValue = useCallback((nextValue: number) => {
    setNavigationState((prev) => {
      const normalized = clampPlaybackStep(nextValue, maxSteps);
      if (normalized === prev.sliderValue) return prev;

      return {
        sliderValue: normalized,
        disableAnimations: normalized < prev.sliderValue,
      };
    });
  }, [maxSteps]);

  const sliderValue = clampPlaybackStep(
    navigationState.sliderValue,
    maxSteps
  );
  const disableAnimations = navigationState.disableAnimations;

  useEffect(() => {
    if (navigationState.sliderValue === sliderValue) return;

    const frame = requestAnimationFrame(() => {
      setNavigationState((prev) => ({
        sliderValue,
        disableAnimations: sliderValue < prev.sliderValue,
      }));
    });

    return () => cancelAnimationFrame(frame);
  }, [navigationState.sliderValue, sliderValue]);

  // Group snapshots by control ID
  const grouped = useMemo(() => {
    const map: Record<string, Snapshot<T>[]> = {};
    snapshots.forEach(snap => {
      if (!map[snap.id]) map[snap.id] = [];
      map[snap.id].push(snap);
    });

    Object.values(map).forEach(controlSnapshots => {
      controlSnapshots.sort((left, right) => left.step - right.step);
    });

    return map;
  }, [snapshots]);

  // Compute latest snapshot per control for current sliderValue
  const latestSnapshots = useMemo(() => {
    const result: Record<string, Snapshot<T>> = {};

    Object.entries(grouped).forEach(([controlId, snaps]) => {
      for (let index = snaps.length - 1; index >= 0; index--) {
        if (snaps[index].step > sliderValue) continue;

        result[controlId] = snaps[index];
        break;
      }
    });

    return result;
  }, [sliderValue, grouped]);

  const stepLabel = `${sliderValue}/${maxSteps}`;

  return { sliderValue, setSliderValue, disableAnimations, maxSteps, stepLabel, latestSnapshots };
}
