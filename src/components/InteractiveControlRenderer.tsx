"use client";

import { ControlItem } from "../common/models/controlItem";
import {
  ControlRenderLayout,
  LoadedControl,
  Snapshot,
} from "../common/models/snapshot";
import {
  getControlRendererProps,
  ResolvedControlRendererProps,
} from "../utils/getControlRendererProps";
import {
  BaseRendererProps,
  RendererMap,
} from "./Renderers/RendererMap";
import { RendererType } from "./Renderers/rendererConfig";
import { buildRenderItems } from "./Renderers/utils/buildRenderItems";
import {
  getJaggedArrayDimensions,
  type JaggedArrayRendererProps,
} from "./Renderers/JaggedArrayRenderer";

const CONTROL_TITLE_OFFSET = 30;

export interface InteractiveControlRendererProps {
  control: LoadedControl<ControlItem>;
  latestSnapshots: Record<string, Snapshot<ControlItem>>;
  currentStep: number;
  disableAnimations: boolean;
  layout?: ControlRenderLayout;
  defaultHeaderTitle?: string;
  configureProps?: (
    id: string,
    props: ResolvedControlRendererProps,
    control: LoadedControl<ControlItem>
  ) => void;
}

export function InteractiveControlRenderer({
  control,
  latestSnapshots,
  currentStep,
  disableAnimations,
  layout,
  defaultHeaderTitle,
  configureProps,
}: InteractiveControlRendererProps) {
  const snapshot = latestSnapshots[control.id];
  if (!snapshot) return null;

  const type = snapshot.type as RendererType;
  const Renderer = RendererMap[type] as React.ComponentType<
    BaseRendererProps & Record<string, unknown>
  >;
  if (!Renderer) {
    throw new Error(
      `Control "${control.id}" uses unsupported renderer type "${snapshot.type}".`
    );
  }

  const renderConfig =
    control.renderByStep?.[snapshot.step] ?? control.render ?? {};
  if (renderConfig.visible === false) return null;

  const dimensions = {
    ...layout,
    ...(renderConfig.layout ?? {}),
  };
  const { top, left, width, height } = dimensions;
  if (
    top === undefined ||
    left === undefined ||
    width === undefined ||
    height === undefined
  ) {
    return null;
  }

  const props = getControlRendererProps({
    control,
    snapshot,
    latestSnapshots,
    dimensions: { width, height },
    renderConfig,
    currentStep,
    disableAnimations,
  });
  configureProps?.(control.id, props, control);

  let resolvedWidth = width;
  let resolvedHeight = height;
  let resolvedTop = top;

  if (type === RendererType.JaggedArray) {
    const fitted = getJaggedArrayDimensions(
      props as unknown as JaggedArrayRendererProps
    );
    resolvedWidth = fitted.width;
    resolvedHeight = fitted.height;
    props.divWidth = fitted.width;
    props.divHeight = fitted.height;
  } else if (
    props.fitContent === true &&
    (type === RendererType.Array ||
      type === RendererType.Stack)
  ) {
    const defaultItemOffset =
      typeof props.defaultItemOffset === "number"
        ? props.defaultItemOffset
        : 40;
    const renderItems = buildRenderItems(
      snapshot.items,
      new Set(),
      Boolean(props.disableAnimations),
      defaultItemOffset
    );
    const mainAxisSize = Math.max(
      renderItems.reduce(
        (extent, item) =>
          Math.max(extent, item.offset + item.itemOffset),
        0
      ),
      defaultItemOffset
    );

    if (type === RendererType.Stack) {
      resolvedHeight = mainAxisSize;
      resolvedTop = top + height - mainAxisSize;
      props.divHeight = mainAxisSize;
    } else if (props.orientation === "vertical") {
      resolvedHeight = mainAxisSize;
      props.divHeight = mainAxisSize;
    } else {
      resolvedWidth = mainAxisSize;
      props.divWidth = mainAxisSize;
    }
  }

  const headerTitle = renderConfig.title ?? defaultHeaderTitle;
  const shouldShowHeader =
    renderConfig.showTitle ?? Boolean(headerTitle);
  const headerTop = top - resolvedTop - CONTROL_TITLE_OFFSET;

  return (
    <div
      data-apf-control=""
      style={{
        position: "absolute",
        top: resolvedTop,
        left,
        width: resolvedWidth,
        height: resolvedHeight,
      }}
    >
      {shouldShowHeader && headerTitle && (
        <div
          style={{
            position: "absolute",
            top: headerTop,
            left: "50%",
            width: "max-content",
            transform: "translateX(-50%)",
            textAlign: "center",
            whiteSpace: "nowrap",
            overflow: "visible",
            fontSize: "var(--apf-control-title-font-size, 14px)",
            fontWeight: "bold",
            color: "#ccc",
          }}
        >
          {headerTitle}
        </div>
      )}
      <Renderer {...props} />
    </div>
  );
}
