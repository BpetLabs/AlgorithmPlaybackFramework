import { describe, expect, it } from "vitest";
import {
  ControlItemState,
  isPreRemovingState,
  isRemovingState,
} from "./controlItem";

describe("control item state guards", () => {
  it.each([
    ControlItemState.RemovingInsert,
    ControlItemState.RemovingInPlace,
    ControlItemState.RemovingUpdate,
    ControlItemState.RemovingHead,
    ControlItemState.RemovingTail,
    ControlItemState.RemovingTake,
  ])("recognizes removing state %s", (state) => {
    expect(isRemovingState(state)).toBe(true);
    expect(isPreRemovingState(state)).toBe(false);
  });

  it.each([
    ControlItemState.PreRemoveInsert,
    ControlItemState.PreRemoveInPlace,
    ControlItemState.PreRemoveUpdate,
    ControlItemState.PreRemoveHead,
    ControlItemState.PreRemoveTail,
    ControlItemState.PreRemoveTake,
  ])("recognizes pre-removing state %s", (state) => {
    expect(isPreRemovingState(state)).toBe(true);
    expect(isRemovingState(state)).toBe(false);
  });

  it.each([ControlItemState.Initial, ControlItemState.Empty, "unknown", undefined])(
    "rejects non-removal state %s",
    (state) => {
      expect(isRemovingState(state)).toBe(false);
      expect(isPreRemovingState(state)).toBe(false);
    }
  );
});
