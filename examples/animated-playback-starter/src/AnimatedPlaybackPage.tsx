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
  top: 90,
  left: 390,
  width: 870,
  height: 390,
};

const controlLayouts: Record<string, ControlRenderLayout> = {
  code: { top: 90, left: 20, width: 350, height: 658 },
  playbyplay: { top: 540, left: 390, width: 610, height: 208 },
  locals: { top: 540, left: 1020, width: 240, height: 208 },
};

const controlTitles: Record<string, string> = {
  code: "Code",
  playbyplay: "Play by Play",
  locals: "Local Variables",
};

const sliderLayout = { top: 70, left: 500, width: 400, height: 50 };

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
      <div className="playback-canvas-viewport">
        <section
          className="playback-canvas"
          aria-label="Animated playback"
          style={canvasSize}
        >
          <header className="playback-header">
            <h1>Animated Playback</h1>
            <p className="playback-description">
              This is a cool project
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
          />

          {controls.map((control) => (
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
