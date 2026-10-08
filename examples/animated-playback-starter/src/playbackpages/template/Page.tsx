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
  top: 130,
  left: 400,
  width: 860,
  height: 380,
  border: "1px solid #374151"
};

const controlLayouts: Record<string, ControlRenderLayout> = {
  code: { top: 90, left: 20, width: 360, height: 658 },
  playbyplay: { top: 550, left: 400, width: 600, height: 198 },
  locals: { top: 550, left: 1020, width: 240, height: 198 },
  array1: { top: 30, left: 0, width: 800, height: 40 },
  array2: { top: 300, left: 100, width: 100, height: 30 },
  stack: { top: 30, left: 620, width: 120, height: 320 },
  grid: { top: 30, left: 300, width: 250, height: 250 },
  jaggedArray: { top: 125, left: 0, width: 800, height: 140 },
};

const controlTitles: Record<string, string> = {
  code: "Code",
  playbyplay: "Play by Play",
  locals: "Local Variables",
  array1: "Array 1",
  array2: "Array 2",
  stack: "Stack",
  grid: "Grid",
  jaggedArray: "Jagged Array",
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
                      props.defaultItemOffset = 25;
                    } else if (id === "stack") {
                      props.defaultItemOffset = 25;
                    } else if (id === "grid") {
                      props.rows = 10;
                      props.cols = 10;
                    } else if (id === "jaggedArray") {
                      props.defaultItemOffset = 45;
                      props.orientation = "horizontal";
                      props.itemGap = 10,
                      props.itemCrossAxisGap = 10,
                      props.childDefaults = {
                        defaultItemOffset: 25,
                        orientation: "vertical",
                      };
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
