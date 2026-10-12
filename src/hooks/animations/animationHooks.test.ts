// @vitest-environment jsdom

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnimationController } from "../../common/models/animation";
import { ControlItem, ControlItemState } from "../../common/models/controlItem";

const effects = vi.hoisted(() => ({
  disappear: vi.fn(),
  move: vi.fn(),
  moveThenFallRotateAndDisappear: vi.fn(),
  reset: vi.fn(),
  setZIndex: vi.fn(),
  shake: vi.fn(),
  shakeAndDisappear: vi.fn(),
  warpIn: vi.fn(),
}));

vi.mock("../../utils/animationEffects", () => effects);

import { useAnimateMoveIntoPlace } from "./useAnimateMoveIntoPlace";
import { useAnimatePreInsert } from "./useAnimatePreInsert";
import { useAnimatePreRemove } from "./useAnimatePreRemove";
import { useAnimateRemoving } from "./useAnimateRemoving";
import { useAnimateShake } from "./useAnimateShake";

const item = (state: ControlItemState, overrides: Partial<ControlItem> = {}): ControlItem => ({
  id: "item",
  state,
  ...overrides,
});

describe("animation state hooks", () => {
  let controls: AnimationController;

  beforeEach(() => {
    Object.values(effects).forEach((mock) => mock.mockReset().mockResolvedValue(undefined));
    controls = { start: vi.fn(), set: vi.fn(), stop: vi.fn() };
  });

  it("warps pre-insert items from orientation-specific starting positions", () => {
    renderHook(() => useAnimatePreInsert(item(ControlItemState.PreInsert), 2, 20, 30, false, controls, true, 5));

    expect(controls.set).toHaveBeenCalledWith(expect.objectContaining({
      x: 0,
      y: -25,
      scaleX: 1,
      scaleY: 0,
      opacity: 0,
      zIndex: 41,
    }));
    expect(effects.warpIn).toHaveBeenCalledWith(controls, 1);
  });

  it("snaps pre-insert items into their staged position when animations are disabled", () => {
    renderHook(() => useAnimatePreInsert(item(ControlItemState.PreHead), 0, 20, 30, true, controls, false));

    expect(controls.stop).toHaveBeenCalled();
    expect(controls.set).toHaveBeenCalledWith(expect.objectContaining({ y: 20, scaleX: 1, opacity: 1 }));
    expect(effects.warpIn).not.toHaveBeenCalled();
  });

  it("moves inserted items from their previous transition origin", () => {
    renderHook(() => useAnimateMoveIntoPlace(
      item(ControlItemState.Inserted, { previousState: ControlItemState.PreHead }),
      20,
      1,
      30,
      false,
      controls,
      true
    ));

    expect(controls.set).toHaveBeenCalledWith(expect.objectContaining({ x: -30, y: 0 }));
    expect(effects.move).toHaveBeenCalledWith(controls, 0, 0, 1);
  });

  it("snaps initial items into place without movement when animations are disabled", () => {
    renderHook(() => useAnimateMoveIntoPlace(
      item(ControlItemState.Initial), 20, 1, 30, true, controls, false
    ));

    expect(controls.stop).toHaveBeenCalled();
    expect(controls.set).toHaveBeenCalledWith(expect.objectContaining({
      x: 0,
      y: 0,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
    }));
    expect(effects.move).not.toHaveBeenCalled();
  });

  it("finishes skipped inserts before pre-removal and skips shake for updates", () => {
    renderHook(() => useAnimatePreRemove(
      item(ControlItemState.PreRemoveUpdate, { previousState: ControlItemState.PreInsert }),
      0,
      20,
      30,
      false,
      controls,
      false
    ));

    expect(controls.set).toHaveBeenCalledWith(expect.objectContaining({ x: -31.5, y: 0 }));
    expect(effects.move).toHaveBeenCalledWith(controls, 0, 0, 1);
    expect(effects.shake).not.toHaveBeenCalled();
  });

  it("resets, moves, and shakes ordinary pre-removals", async () => {
    renderHook(() => useAnimatePreRemove(
      item(ControlItemState.PreRemoveHead, { previousState: ControlItemState.Initial }),
      0,
      20,
      30,
      false,
      controls,
      false
    ));

    expect(effects.reset).toHaveBeenCalledWith(controls, 0, 0);
    await waitFor(() => expect(effects.move).toHaveBeenCalledWith(controls, 0, 0, 1));
    await waitFor(() => expect(effects.shake).toHaveBeenCalledWith(controls));
  });

  it("snaps pre-removals without effects when animations are disabled", () => {
    renderHook(() => useAnimatePreRemove(
      item(ControlItemState.PreRemoveTail), 1, 20, 30, true, controls, false
    ));

    expect(controls.set).toHaveBeenCalledWith(expect.objectContaining({
      x: 0,
      y: 0,
      opacity: 1,
      zIndex: 21,
    }));
    expect(effects.reset).not.toHaveBeenCalled();
    expect(effects.move).not.toHaveBeenCalled();
  });

  it("hides removing items immediately when animations are disabled", () => {
    renderHook(() => useAnimateRemoving(
      item(ControlItemState.RemovingInsert), 0, 20, 30, true, controls, false
    ));

    expect(effects.disappear).toHaveBeenCalledWith(controls, 0);
    expect(effects.moveThenFallRotateAndDisappear).not.toHaveBeenCalled();
  });

  it("fades update removals and shakes take removals while disappearing", async () => {
    const { rerender } = renderHook(
      ({ state }) => useAnimateRemoving(item(state), 0, 20, 30, false, controls, false),
      { initialProps: { state: ControlItemState.RemovingUpdate } }
    );
    expect(effects.setZIndex).toHaveBeenCalledWith(controls);
    await waitFor(() => expect(effects.disappear).toHaveBeenCalledWith(controls, 1));

    effects.disappear.mockClear();
    effects.move.mockClear();
    rerender({ state: ControlItemState.RemovingTake });
    await waitFor(() => expect(effects.shakeAndDisappear).toHaveBeenCalledWith(controls, 1));
    expect(effects.disappear).not.toHaveBeenCalled();
    expect(effects.move).not.toHaveBeenCalled();
  });

  it("runs fall removal, invokes collapse, and restores state after reversing", async () => {
    const onCollapse = vi.fn();
    const { rerender } = renderHook(
      ({ state }) => useAnimateRemoving(
        item(state), 1, 20, 30, false, controls, true, onCollapse
      ),
      { initialProps: { state: ControlItemState.RemovingHead } }
    );

    expect(effects.moveThenFallRotateAndDisappear).toHaveBeenCalledWith(
      controls, 0, 0, 40, 0
    );
    await waitFor(() => expect(onCollapse).toHaveBeenCalledWith("item"));

    vi.mocked(controls.set).mockClear();
    rerender({ state: ControlItemState.Initial });
    expect(controls.set).toHaveBeenCalledWith(expect.objectContaining({
      x: 0,
      y: 0,
      opacity: 1,
      zIndex: 21,
    }));
  });

  it("starts or clears shake based on item flags", () => {
    const { rerender } = renderHook(
      ({ shake }) => useAnimateShake(item(ControlItemState.Initial, { shake }), controls, false),
      { initialProps: { shake: true } }
    );
    expect(effects.shake).toHaveBeenCalledWith(controls);

    rerender({ shake: false });
    expect(controls.stop).toHaveBeenCalled();
    expect(controls.set).toHaveBeenCalledWith({ x: 0, y: 0, rotate: 0, zIndex: 1 });
  });

  it("shakes disabled pre-removals except update replacements", () => {
    const { rerender } = renderHook(
      ({ state }) => useAnimateShake(item(state), controls, true),
      { initialProps: { state: ControlItemState.PreRemoveHead } }
    );
    expect(effects.shake).toHaveBeenCalledWith(controls);

    effects.shake.mockClear();
    rerender({ state: ControlItemState.PreRemoveUpdate });
    expect(effects.shake).not.toHaveBeenCalled();
  });
});
