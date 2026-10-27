"use client";

import { ControlItem } from "../common/models/controlItem";
import {
  ControlRenderLayout,
  ControlTitlePosition,
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
import {
  buildRenderItems,
  getFittedRenderExtent,
} from "./Renderers/utils/buildRenderItems";
import {
  getJaggedArrayDimensions,
  type JaggedArrayRendererProps,
} from "./Renderers/JaggedArrayRenderer";
import { requirePositiveDimension } from "./Renderers/utils/dimensions";

const CONTROL_TITLE_OFFSET = 30;
const CONTROL_TITLE_GAP = 10;
const STACK_RENDERER_TYPES = new Set<RendererType>([
  RendererType.Stack,
  RendererType.Dictionary,
]);

export interface InteractiveControlRendererProps {
  control: LoadedControl<ControlItem>;
  latestSnapshots: Record<string, Snapshot<ControlItem>>;
  currentStep: number;
  disableAnimations: boolean;
  layout?: ControlRenderLayout;
  defaultHeaderTitle?: string;
  defaultHeaderPosition?: ControlTitlePosition;
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
  defaultHeaderPosition,
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
  let resolvedLeft = left;

  const isArray = type === RendererType.Array;
  const isStackRenderer = STACK_RENDERER_TYPES.has(type);
  const itemOrientation = isArray && props.orientation !== "vertical"
    ? "horizontal"
    : "vertical";
  const reverseDirection = props.reverseDirection === true;

  if (type === RendererType.JaggedArray) {
    const fitted = getJaggedArrayDimensions(
      props as unknown as JaggedArrayRendererProps
    );
    resolvedWidth = fitted.width;
    resolvedHeight = fitted.height;
  } else if (isArray || isStackRenderer) {
    if (props.fitContent === true) {
      const baseItemOffset =
        typeof props.defaultItemOffset === "number"
          ? requirePositiveDimension(props.defaultItemOffset, "defaultItemOffset")
          : 40;
      const defaultItemOffset = baseItemOffset;
      const renderItems = buildRenderItems(
        snapshot.items,
        new Set(),
        Boolean(props.disableAnimations),
        defaultItemOffset
      );
      const contentExtent = getFittedRenderExtent(renderItems);
      const mainAxisSize = contentExtent || defaultItemOffset;

      if (itemOrientation === "vertical") {
        resolvedHeight = mainAxisSize;
        props.divHeight = mainAxisSize;
        const startsAtBottom = isStackRenderer
          ? !reverseDirection
          : reverseDirection;
        if (startsAtBottom) {
          resolvedTop = top + height - mainAxisSize;
        }
      } else {
        resolvedWidth = mainAxisSize;
        props.divWidth = mainAxisSize;
        if (reverseDirection) {
          resolvedLeft = left + width - mainAxisSize;
        }
      }
    }
  }

  const headerTitle = renderConfig.title ?? defaultHeaderTitle;
  const headerPosition =
    renderConfig.titlePosition ?? defaultHeaderPosition ?? "top";
  const shouldShowHeader =
    renderConfig.showTitle ?? Boolean(headerTitle);
  const headerTop =
    headerPosition === "bottom"
      ? resolvedHeight + CONTROL_TITLE_GAP
      : top - resolvedTop - CONTROL_TITLE_OFFSET;

  return (
    <div
      data-apf-control=""
      style={{
        position: "absolute",
        top: resolvedTop,
        left: resolvedLeft,
        width: resolvedWidth,
        height: resolvedHeight,
      }}
    >
      {shouldShowHeader && headerTitle && (
        <div
          data-apf-control-title-position={headerPosition}
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
