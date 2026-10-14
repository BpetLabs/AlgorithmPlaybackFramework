import { ControlItem } from "../../common/models/controlItem";
import { renderLineWithInlineBold } from "./utils/inlineBold";

export interface RendererProps {
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
}

export function resolveContainerClassName(
  baseClassName: string,
  defaultChromeClassName: string,
  containerClassName?: string
): string {
  const chromeClassName = containerClassName ?? defaultChromeClassName;
  return `${chromeClassName} ${baseClassName}`.trim();
}

export const DEFAULT_RENDERER_CONTAINER_CLASS_NAME =
  "apf-renderer-frame bg-transparent";

export enum RendererType {
  Dictionary = "dictionary",
  Stack = "stack",
  StaticText = "staticText",
  Text = "text",
  Array = "array",
  JaggedArray = "jaggedArray",
  Grid = "grid",
  NodeGraph = "nodeGraph",
}

export const RendererConfig: Record<RendererType, RendererProps> = {
  [RendererType.Stack]: {
    renderContent: (it: ControlItem) => (
      <div className="relative w-full h-full font-normal">

        {/* Top left-aligned */}
        {it.leftAlignedValue && (
          <div className="absolute top-0 left-0 ml-1">
            <span className="text-xs">
              {it.leftAlignedValue?.split("\n").map((line, idx) => (
                <div key={idx}>
                  {renderLineWithInlineBold(line)}
                </div>
              ))}
            </span>
          </div>
        )}

        {/* Middle centered */}
        <div className="absolute inset-0 flex justify-center items-center flex-col text-sm">
          {it.value?.split("\n").map((line, idx) => (
            <div key={idx}>
              {renderLineWithInlineBold(line)}
            </div>
          ))}
        </div>

        {it.rightAlignedValue && (
          <div className="absolute right-0 mr-1">
            <span className="text-sm">
              {it.rightAlignedValue?.split("\n").map((line, idx) => (
                <div key={idx}>
                  {renderLineWithInlineBold(line)}
                </div>
              ))}
            </span>
          </div>
        )}

      </div>
    ),
  },

  [RendererType.Array]: {
    renderContent: (it: ControlItem) => (
      <div className="relative w-full h-full font-normal">

        {/* Top left-aligned */}
        {it.leftAlignedValue && (
          <div className="absolute top-0 left-0 ml-1">
            <span className="text-xs font-bold">
              {it.leftAlignedValue?.split("\n").map((line, idx) => (
                <div key={idx}>
                  {renderLineWithInlineBold(line)}
                </div>
              ))}
            </span>
          </div>
        )}

        {/* Middle centered */}
        <div className="absolute inset-0 flex justify-center items-center flex-col">
          {it.value?.split("\n").map((line, idx) => (
            <div key={idx}>
              {renderLineWithInlineBold(line)}
            </div>
          ))}
        </div>

        {/* Bottom right-aligned */}
        {it.rightAlignedValue && (
          <div className="absolute bottom-0 right-0 mr-2">
            <span className="text-xs font-bold">
              {it.rightAlignedValue?.split("\n").map((line, idx) => (
                <div key={idx}>
                  {renderLineWithInlineBold(line)}
                </div>
              ))}
            </span>
          </div>
        )}
      </div>
    ),
  },

  [RendererType.JaggedArray]: {},

  [RendererType.Dictionary]: {
    renderContent: (it: ControlItem, options) => {
      const segments = it.value?.split("|") || [];
      const segmentCount = segments.length;
      const columnWidths = it.splitColumnWidths ?? options?.splitColumnWidths;
      const configuredWidthTotal = columnWidths?.reduce((total, width) => total + width, 0);
      const hasConfiguredWidths =
        columnWidths?.length === segmentCount &&
        columnWidths.every((width) => Number.isFinite(width) && width > 0 && width < 100) &&
        Math.abs((configuredWidthTotal ?? 0) - 100) < 0.01;

      return (
        <div className="relative w-full h-full flex items-center justify-center font-normal border border-gray-700 rounded">
          {segments.map((line, idx) => (
            <div
              key={idx}
              className={`px-3 py-1 text-center ${idx < segmentCount - 1 ? "border-r border-gray-700" : ""
                }`}
              style={{
                flex: hasConfiguredWidths ? `0 0 ${columnWidths[idx]}%` : "1 1 0%",
              }}
            >
              {renderLineWithInlineBold(line.trim())}
            </div>
          ))}
        </div>
      );
    },
  },

  [RendererType.Text]: {
    renderContent: (it: ControlItem) => (
      <div className="absolute inset-0 flex flex-col justify-start items-start p-2 text-sm whitespace-pre-wrap">
        {it.value?.split("\n").map((line, idx) => (
          <div key={idx}>
            {renderLineWithInlineBold(line)}
          </div>
        ))}
      </div>
    ),
  },

  [RendererType.StaticText]: {
  },

  [RendererType.Grid]: {
  },

  [RendererType.NodeGraph]: {
  },
};
