import { useMemo } from "react";
import {
  InteractiveControlRenderer,
  SliderControl,
  loadControls,
  useControlManager,
  type ControlItem,
  type ControlDefinition,
  type ControlRenderLayout,
  type JaggedArrayChild,
  type LoadedControl,
  type Snapshot,
} from "algorithm-playback-framework";

import playback from "./playback.json";

const canvasSize = { width: 1400, height: 800 };

const visualizationArea = {
  top: 130,
  left: 500,
  width: 880,
  height: 400,
  border: "1px solid #374151"
};

// Coordinates are relative to the full playback canvas.
const defaultControlLayouts: Record<string, ControlRenderLayout> = {
  code: { top: 120, left: 20, width: 460, height: 660 },
  playbyplay: { top: 580, left: 500, width: 620, height: 200 },
  locals: { top: 580, left: 1140, width: 240, height: 200 },
};

// Coordinates are relative to visualizationArea.
const visualizationControlLayouts: Record<string, ControlRenderLayout> = {
  cube: { top: 30, left: 5, width: 320, height: 160 },
};

const defaultControlTitles: Record<string, string> = {
  code: "Code",
  playbyplay: "Play by Play",
  locals: "Local Variables",
};

const visualizationControlTitles: Record<string, string> = {
  cube: "Triple Jagged Array",
};

const defaultControlIds = new Set(["code", "playbyplay", "locals"]);

const sliderLayout = { top: 70, left: 500, width: 400, height: 50 };

function collectSnapshots(
  control: LoadedControl<ControlItem>
): Snapshot<ControlItem>[] {
  return [
    ...control.snapshots,
    ...(control.childControls?.flatMap(collectSnapshots) ?? []),
  ];
}

function configureNestedArrays(children?: JaggedArrayChild[]) {
  children?.forEach((matrix) => {
    matrix.options.defaultItemOffset = 50;
    matrix.options.itemGap = 6;
    matrix.options.itemCrossAxisGap = 6;

    matrix.childArrays?.forEach((row) => {
      row.options.defaultItemOffset = 40;
    });
  });
}

export default function PlaybackPage() {
  const controls = useMemo(
    () => loadControls(playback.controls as ControlDefinition[]),
    []
  );

  const snapshots = useMemo(
    () => controls.flatMap(collectSnapshots),
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
              A three-dimensional jagged array with differently sized rows.
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
                  configureProps={(id, props) => {
                    if (id === "cube") {
                      props.defaultItemOffset = 160;
                      props.itemGap = 5;
                      props.itemCrossAxisGap = 5;
                      configureNestedArrays(
                        props.childArrays as JaggedArrayChild[] | undefined
                      );
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
