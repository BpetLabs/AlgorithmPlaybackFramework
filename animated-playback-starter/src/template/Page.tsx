import { useMemo } from "react";
import {
  InteractiveControlRenderer,
  SliderControl,
  loadControls,
  useControlManager,
  type ControlDefinition,
  type ControlRenderLayout,
} from "algorithm-playback-framework";

import playback from "./playback.json";

const canvasSize = { width: 1500, height: 870 };

const visualizationArea = {
  top: 130,
  left: 520,
  width: 960,
  height: 470,
  border: "1px solid #374151"
};

const sliderLayout = { top: 70, left: 550, width: 400, height: 50 };

// Coordinates are relative to the full playback canvas.
const defaultControlLayouts: Record<string, ControlRenderLayout> = {
  code: { top: 100, left: 20, width: 480, height: 750 },
  playbyplay: { top: 650, left: 520, width: 690, height: 200 },
  locals: { top: 650, left: 1230, width: 250, height: 200 },
};

// Coordinates are relative to visualizationArea.
const visualizationControlLayouts: Record<string, ControlRenderLayout> = {
  // Add layouts for non-default controls here.
};

const defaultControlTitles: Record<string, string> = {
  code: "Code",
  playbyplay: "Play by Play",
  locals: "Local Variables",
};

const visualizationControlTitles: Record<string, string> = {
  // Add titles for non-default controls here.
};

const defaultControlIds = new Set(["code", "playbyplay", "locals"]);

export default function PlaybackPage() {
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
      <div className="playback-canvas-viewport">
        <section
          className="playback-canvas"
          aria-label="Animated playback"
          style={canvasSize}
        >
          <header className="playback-header">
            <h1>Animated Playback</h1>
            <p className="playback-description">
              Playback Description
            </p>
          </header>

          <section
            className="playback-navigation"
            aria-label="Playback navigation"
            style={sliderLayout}
          >
            <span>
              Step {sliderValue} / {maxSteps}
            </span>
            <SliderControl
              historyLength={maxSteps + 1}
              currentIndex={sliderValue}
              onChange={setSliderValue}
            />
          </section>

          <div
            className="playback-visualization-area"
            aria-label="Additional visualization controls"
            style={visualizationArea}
          >
            {controls
              .filter((control) => !defaultControlIds.has(control.id))
              .map((control) => (
                <InteractiveControlRenderer
                  key={control.id}
                  control={control}
                  latestSnapshots={latestSnapshots}
                  currentStep={sliderValue}
                  disableAnimations={disableAnimations}
                  layout={visualizationControlLayouts[control.id]}
                  defaultHeaderTitle={visualizationControlTitles[control.id]}
                />
              ))}
          </div>

          {controls
            .filter((control) => defaultControlIds.has(control.id))
            .map((control) => (
              <InteractiveControlRenderer
                key={control.id}
                control={control}
                latestSnapshots={latestSnapshots}
                currentStep={sliderValue}
                disableAnimations={disableAnimations}
                layout={defaultControlLayouts[control.id]}
                defaultHeaderTitle={defaultControlTitles[control.id]}
                configureProps={(id, props) => {
                  if (id === "playbyplay") {
                    props.defaultItemOffset = 200;
                    props.showCellBorders = false;
                  } else if (id === "locals") {
                    props.defaultItemOffset = 25;
                    props.borderWidth = 2;
                  }
                }}
              />
            ))}
        </section>
      </div>
    </main>
  );
}
