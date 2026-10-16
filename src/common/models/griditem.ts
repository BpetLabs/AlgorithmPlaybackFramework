import { ControlItemValues } from "./controlItem";

export interface GridItem extends ControlItemValues {
  row: number;
  col: number;
}
