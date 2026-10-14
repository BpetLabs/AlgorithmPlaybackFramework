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
  playbyplay: { top: 650, left: 520, width: 700, height: 200 },
  locals: { top: 650, left: 1240, width: 240, height: 200 },
};

// Coordinates are relative to visualizationArea.
const visualizationControlLayouts: Record<string, ControlRenderLayout> = {
  tree: { top: 95, left: 55, width: 420, height: 220 },
  callStack: { top: 80, left: 700, width: 180, height: 300 },
};

const defaultControlTitles: Record<string, string> = {
  code: "Code",
  playbyplay: "Play by Play",
  locals: "Local Variables",
};

const visualizationControlTitles: Record<string, string> = {
  tree: "Binary Tree",
  callStack: "Call Stack",
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
            <h1>Lowest Common Ancestor</h1>
            <p className="playback-description">
              Follow recursive calls to find the lowest node shared by two targets.
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
                  defaultHeaderPosition={control.id === "callStack" ? "bottom" : "top"}
                  configureProps={(id, props) => {
                    if (id === "tree") {
                      props.containerClassName = "bg-transparent";
                      props.graphLayout = {
                        columns: 7,
                        rows: 3,
                        paddingX: 0.05,
                        paddingY: 0.08,
                        colGap: 0.03,
                        rowGap: 0.15,
                      };
                    } else if (id === "callStack") {
                      props.defaultItemOffset = 60;
                      props.fitContent = true;
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
