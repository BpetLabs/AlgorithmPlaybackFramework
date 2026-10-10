export enum ControlItemState {

  Initial = "Initial",

  // Take
  PreRemoveTake = "PreRemoveTake",
  RemovingTake = "RemovingTake",

  // Insert
  PreInsert = "PreInsert",
  PreRemoveInsert = "PreRemoveInsert",
  RemovingInsert = "RemovingInsert",
  
  // Removing
  PreRemoveInPlace = "PreRemoveInPlace",
  RemovingInPlace = "RemovingInPlace",

  // Update
  PreUpdate = "PreUpdate",
  PreRemoveUpdate = "PreRemoveUpdate",
  RemovingUpdate = "RemovingUpdate",

  // Head
  PreHead = "PreHead",
  PreRemoveHead = "PreRemoveHead",
  RemovingHead = "RemovingHead",

  // Tail
  PreTail = "PreTail",
  PreRemoveTail = "PreRemoveTail",
  RemovingTail = "RemovingTail",

  // Generic
  Inserted = "Inserted",
  Removed = "Removed",
  Empty = "Empty"
}

export interface ControlItemValues {
  childId?: string;
  value?: string;
  backgroundColor?: string;
  textColor?: string;
  rightAlignedValue?: string;
  leftAlignedValue?: string;
  borderColor?: string;
  borderWidth?: number;
  itemOffset?: number;
  splitColumnWidths?: number[];
  shake?: boolean;
  collapse?: boolean;
}

export interface ControlItem extends ControlItemValues {
  id: string;
  state: ControlItemState;
  previousState?: ControlItemState // for animating and debugging
  linkId?: string;
}

export function isRemovingState(state: ControlItemState | string | undefined): boolean {
  return (
    state === ControlItemState.RemovingInsert ||
    state === ControlItemState.RemovingInPlace ||
    state === ControlItemState.RemovingUpdate ||
    state === ControlItemState.RemovingHead ||
    state === ControlItemState.RemovingTail ||
    state === ControlItemState.RemovingTake
  );
}

export function isPreRemovingState(state: ControlItemState | string | undefined): boolean {
  return (
    state === ControlItemState.PreRemoveInsert ||
    state === ControlItemState.PreRemoveInPlace ||
    state === ControlItemState.PreRemoveUpdate ||
    state === ControlItemState.PreRemoveHead ||
    state === ControlItemState.PreRemoveTail ||
    state === ControlItemState.PreRemoveTake
  );
}
