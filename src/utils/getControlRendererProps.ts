import { ControlItem } from "../common/models/controlItem";
import {
  ControlRenderConfig,
  LoadedControl,
  Snapshot,
} from "../common/models/snapshot";
import type { BaseRendererProps } from "../components/Renderers/RendererMap";
import type { JaggedArrayChild } from "../components/Renderers/JaggedArrayRenderer";

export interface ControlRendererDimensions {
  width: number;
  height: number;
}

export interface ControlRendererPropsArgs {
  control: LoadedControl<ControlItem>;
  snapshot: Snapshot<ControlItem>;
  latestSnapshots: Record<string, Snapshot<ControlItem>>;
  dimensions: ControlRendererDimensions;
  renderConfig: ControlRenderConfig;
  currentStep: number;
  disableAnimations: boolean;
}

export type ResolvedControlRendererProps = BaseRendererProps &
  Record<string, unknown>;

export function getControlRendererProps({
  control,
  snapshot,
  latestSnapshots,
  dimensions,
  renderConfig,
  currentStep,
  disableAnimations,
}: ControlRendererPropsArgs): ResolvedControlRendererProps {
  const props: ResolvedControlRendererProps = {
    snapshot,
    divWidth: dimensions.width,
    divHeight: dimensions.height,
    disableAnimations:
      disableAnimations || snapshot.step !== currentStep,
    borderWidth: renderConfig.borderWidth,
    staticValue: control.staticValue,
    ...control.rendererOptions,
  };

  if (!control.childControls?.length) return props;

  props.currentStep = currentStep;
  props.navigationDisableAnimations = disableAnimations;

  const childArrays: JaggedArrayChild[] = control.childControls.flatMap(
    (child) => {
      const childSnapshot = latestSnapshots[child.id];
      if (!childSnapshot || child.parentIndex === undefined) return [];

      return [
        {
          index: child.parentIndex,
          snapshot: childSnapshot,
          options: child.rendererOptions ?? {},
          render:
            child.renderByStep?.[childSnapshot.step] ??
            child.render ??
            {},
        },
      ];
    }
  );

  props.childArrays = childArrays;
  return props;
}
