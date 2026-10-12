// @vitest-environment jsdom

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ControlItemState } from "../../common/models/controlItem";

const hooks = vi.hoisted(() => ({
  preRemove: vi.fn(),
  removing: vi.fn(),
  shake: vi.fn(),
}));

vi.mock("./useAnimatePreRemove", () => ({ useAnimatePreRemove: hooks.preRemove }));
vi.mock("./useAnimateRemoving", () => ({ useAnimateRemoving: hooks.removing }));
vi.mock("./useAnimateShake", () => ({ useAnimateShake: hooks.shake }));

import { useAnimateNonCollapsingRemove } from "./useAnimateNonCollapsingRemove";

describe("useAnimateNonCollapsingRemove", () => {
  beforeEach(() => {
    Object.values(hooks).forEach((hook) => hook.mockReset());
  });

  it.each([
    { state: ControlItemState.PreRemoveInPlace, expectedDisabled: false },
    { state: ControlItemState.RemovingInPlace, expectedDisabled: true },
  ])("passes disabled=$expectedDisabled for $state", ({ state, expectedDisabled }) => {
    const item = { id: "node", state };
    const controls = { start: vi.fn(), set: vi.fn(), stop: vi.fn() };

    renderHook(() => useAnimateNonCollapsingRemove({
      item,
      itemHeight: 20,
      itemWidth: 30,
      disableAnimations: true,
      controls,
      leftRight: true,
    }));

    expect(hooks.preRemove).toHaveBeenCalledWith(item, 0, 20, 30, expectedDisabled, controls);
    expect(hooks.removing).toHaveBeenCalledWith(item, 0, 20, 30, expectedDisabled, controls, true, undefined);
    expect(hooks.shake).toHaveBeenCalledWith(item, controls, expectedDisabled);
  });
});
