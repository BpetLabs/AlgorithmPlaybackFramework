import { StackRenderer } from "./StackRenderer";
import { StaticTextRenderer } from "./StaticTextRenderer";
import { ArrayRenderer } from "./ArrayRenderer";
import { GridRenderer } from "./GridRenderer";
import { MemoryStackRenderer } from "./MemoryStackRenderer";
import { NodeGraphRenderer } from "./NodeGraphRenderer";
import { JaggedArrayRenderer } from "./JaggedArrayRenderer";

import { RendererConfig, RendererType } from "./rendererConfig";
import { ControlItem } from "../../common/models/controlItem";
import { Snapshot } from "../../common/models/snapshot";
import { ArrayOrientation } from "../../common/models/arrayControl";

export type BaseRendererProps = {
  snapshot: Snapshot<ControlItem>;
  divHeight: number;
  divWidth: number;
  renderContent?: (
    item: ControlItem,
    options?: {
      splitColumnWidths?: number[];
      index?: number;
      isSlotOwner?: boolean;
    }
  ) => React.ReactNode;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  borderWidth?: number;
};

export type AnimatedRendererProps = BaseRendererProps & {
  disableAnimations: boolean;
  defaultItemOffset?: number;
  itemGap?: number;
  itemCrossAxisGap?: number;
  itemWidth?: number;
  itemHeight?: number;
  preInsertGap?: number;
  splitColumnWidths?: number[];
  orientation?: ArrayOrientation;
  showCellBorders?: boolean;
  fitContent?: boolean;
  itemLabels?: string[];
};

// --- FACTORY HELPERS --------------------------------------------------------

function makeRenderer<P extends object>(
  type: RendererType,
  RendererComponent: React.ComponentType<P>,
  extraProps: Partial<P> = {}
) {
  const config = RendererConfig[type];
  const WrappedRenderer = (props: P) => (
    <RendererComponent {...config} {...extraProps} {...(props as P)} />
  );
  WrappedRenderer.displayName = `${type}Renderer`;
  return WrappedRenderer;
}

// --- SPECIFIC RENDERER FACTORIES -------------------------------------------

const makeStackRenderer = (type: RendererType) =>
  makeRenderer<
    AnimatedRendererProps
  >(type, StackRenderer);

const makeArrayRenderer = (type: RendererType) =>
  makeRenderer<
    AnimatedRendererProps & { emptyItemText?: string }
  >(type, ArrayRenderer);

const makeJaggedArrayRenderer = () =>
  makeRenderer<
    AnimatedRendererProps & {
      childArrays?: React.ComponentProps<typeof JaggedArrayRenderer>["childArrays"];
      childDefaults?: React.ComponentProps<typeof JaggedArrayRenderer>["childDefaults"];
      emptyItemText?: string;
    }
  >(
    RendererType.JaggedArray,
    JaggedArrayRenderer,
    { renderContent: RendererConfig[RendererType.Array].renderContent }
  );

const makeMemoryStackRenderer = (type: RendererType) =>
  makeRenderer<
    AnimatedRendererProps & {
      gridOffset?: number;
      startingMemoryAddress?: number;
      memoryAddressIncrement?: number;
      stackDirection?: "top-down" | "bottom-up";
    }
  >(type, MemoryStackRenderer);

const makeStaticTextRenderer = (type: RendererType) =>
  makeRenderer<
    BaseRendererProps & {
      staticValue: string;
      scrollSpeed?: number;
      borderWidth?: number;
    }
  >(type, StaticTextRenderer);

const makeGridRenderer = (type: RendererType) =>
  makeRenderer<
    BaseRendererProps & {
      rows?: number;
      cols?: number;
      emptyItemText?: string;
      showCellBorders?: boolean;
      rowDescription?: string;
      columnDescription?: string;
      rowLabels?: string[];
      columnLabels?: string[];
    }
  >(type, GridRenderer);

const makeNodeGraphRenderer = (type: RendererType) =>
  makeRenderer<
    BaseRendererProps
  >(type, NodeGraphRenderer);

// --- EXPORT MAP -------------------------------------------------------------

export const RendererMap = {
  [RendererType.Stack]: makeStackRenderer(RendererType.Stack),
  [RendererType.Dictionary]: makeStackRenderer(RendererType.Dictionary),
  [RendererType.BooleanDictionary]: makeStackRenderer(RendererType.BooleanDictionary),
  [RendererType.Text]: makeStackRenderer(RendererType.Text),
  [RendererType.MemoryStack]: makeMemoryStackRenderer(RendererType.MemoryStack),
  [RendererType.Array]: makeArrayRenderer(RendererType.Array),
  [RendererType.JaggedArray]: makeJaggedArrayRenderer(),
  [RendererType.Grid]: makeGridRenderer(RendererType.Grid),
  [RendererType.NodeGraph]: makeNodeGraphRenderer(RendererType.NodeGraph),
  [RendererType.StaticText]: makeStaticTextRenderer(RendererType.StaticText),
};
