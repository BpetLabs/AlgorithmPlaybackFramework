import { ControlItemValues } from "./controlItem";

export interface GridItem extends ControlItemValues {
  id?: string;
  row: number;
  col: number;
}
