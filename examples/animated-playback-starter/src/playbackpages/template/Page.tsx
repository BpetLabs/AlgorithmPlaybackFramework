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

const canvasSize = { width: 1280, height: 768 };

// Reserved for algorithm-specific arrays, stacks, grids, graphs, and other controls.
const visualizationArea = {
  top: 175,
  left: 400,
  width: 860,
  height: 335,
  border: "1px solid #374151"
};

const controlLayouts: Record<string, ControlRenderLayout> = {
  code: { top: 90, left: 20, width: 360, height: 658 },
  playbyplay: { top: 550, left: 400, width: 600, height: 198 },
  locals: { top: 550, left: 1020, width: 240, height: 198 },
  array1: { top: 0, left: 0, width: 200, height: 40 },
  array2: { top: 80, left: 0, width: 200, height: 40 },
  array3: { top: 160, left: 0, width: 200, height: 40 },
  stack: { top: 0, left: 600, width: 160, height: 320 },
  grid: { top: 0, left: 300, width: 200, height: 200 },
};

const controlTitles: Record<string, string> = {
  code: "Code",
  playbyplay: "Play by Play",
  locals: "Local Variables",
  array1: "Array 1",
  array2: "Array 2",
  array3: "Array 3",
  stack: "Stack",
  grid: "Grid",
};

const defaultControlIds = new Set(["code", "playbyplay", "locals"]);

const sliderLayout = { top: 70, left: 500, width: 400, height: 50 };

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
                  layout={controlLayouts[control.id]}
                  defaultHeaderTitle={controlTitles[control.id]}
                  configureProps={(id, props) => {
                    if (id === "array1" || id === "array2" || id === "array3") {
                      props.defaultItemOffset = 40;
                    } else if (id === "stack") {
                      props.defaultItemOffset = 40;
                    } else if (id === "grid") {
                      props.rows = 5;
                      props.cols = 5;
                    }
                  }}
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
                layout={controlLayouts[control.id]}
                defaultHeaderTitle={controlTitles[control.id]}
                configureProps={(id, props) => {
                  if (id === "playbyplay") {
                    props.defaultItemOffset = 200;
                    props.showCellBorders = false;
                  } else if (id === "locals") {
                    props.defaultItemOffset = 25;
                  }
                }}
              />
            ))}
        </section>
      </div>
    </main>
  );
}
