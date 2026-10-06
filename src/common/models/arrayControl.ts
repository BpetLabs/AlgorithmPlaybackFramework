export type ArrayOrientation = "horizontal" | "vertical";

export interface ArrayRendererOptions {
  orientation?: ArrayOrientation;
  defaultItemOffset?: number;
  itemGap?: number;
  itemCrossAxisGap?: number;
  itemWidth?: number;
  itemHeight?: number;
  preInsertGap?: number;
  emptyItemText?: string;
  itemLabels?: string[];
  showCellBorders?: boolean;
  fitContent?: boolean;
}
