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

function getJaggedChildren(
  control: LoadedControl<ControlItem>,
  latestSnapshots: Record<string, Snapshot<ControlItem>>
): JaggedArrayChild[] {
  return (control.childControls ?? []).flatMap((child) => {
    const childSnapshot = latestSnapshots[child.id];
    if (!childSnapshot || child.parentIndex === undefined) return [];
    const childArrays = getJaggedChildren(child, latestSnapshots);
    const parentItemId =
      control.snapshots[0]?.items[child.parentIndex]?.id;

    return [
      {
        index: child.parentIndex,
        ...(parentItemId ? { parentItemId } : {}),
        snapshot: childSnapshot,
        options: child.rendererOptions ?? {},
        render:
          child.renderByStep?.[childSnapshot.step] ?? child.render ?? {},
        ...(childArrays.length ? { childArrays } : {}),
      },
    ];
  });
}

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

  props.childArrays = getJaggedChildren(control, latestSnapshots);
  return props;
}
