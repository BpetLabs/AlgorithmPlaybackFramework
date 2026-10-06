import { useMemo } from "react";
import {
  InteractiveControlRenderer,
  SliderControl,
  loadControls,
  useControlManager,
  type ControlDefinition,
} from "algorithm-playback-framework";
import playback from "./playback.json";

export default function AnimatedPlaybackPage() {
  const controls = useMemo(
    () => loadControls(playback.controls as ControlDefinition[]),
    []
  );

  const snapshots = useMemo(
    () =>
      controls.flatMap((control) => [
        ...control.snapshots,
        ...(control.childControls?.flatMap((child) => child.snapshots) ?? []),
      ]),
    [controls]
  );

  const {
    sliderValue,
    setSliderValue,
    disableAnimations,
    maxSteps,
    latestSnapshots,
  } = useControlManager({ snapshots });

  return (
    <main className="playback-page">
      <h1>{/* Title */}</h1>
      <p className="playback-description">
        {/* Playback Description */}
      </p>

      <section className="playback-navigation" aria-label="Playback navigation">
        <span>
          Step {sliderValue} / {maxSteps}
        </span>
        <SliderControl
          historyLength={maxSteps + 1}
          currentIndex={sliderValue}
          onChange={setSliderValue}
        />
      </section>

      <section className="playback-canvas" aria-label="Animated playback">
        {controls.map((control) => (
          <InteractiveControlRenderer
            key={control.id}
            control={control}
            latestSnapshots={latestSnapshots}
            currentStep={sliderValue}
            disableAnimations={disableAnimations}
          />
        ))}
      </section>
    </main>
  );
}
