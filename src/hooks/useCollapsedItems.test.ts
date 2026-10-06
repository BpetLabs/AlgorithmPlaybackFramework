// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCollapsedItems } from "./useCollapsedItems";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useCollapsedItems", () => {
  it("starts with no collapsed ids", () => {
    const { result } = renderHook(() => useCollapsedItems(false));

    expect(result.current.collapsedIds.size).toBe(0);
  });

  it("tracks multiple collapsed ids in insertion order", () => {
    const { result } = renderHook(() => useCollapsedItems(false));

    act(() => {
      result.current.collapse("item-b");
      result.current.collapse("item-a");
    });

    expect([...result.current.collapsedIds]).toEqual(["item-b", "item-a"]);
  });

  it("deduplicates collapsed ids", () => {
    const { result } = renderHook(() => useCollapsedItems(false));

    act(() => {
      result.current.collapse("item-a");
      result.current.collapse("item-a");
    });

    expect([...result.current.collapsedIds]).toEqual(["item-a"]);
  });

  it("keeps the collapse callback stable across rerenders", () => {
    const { result, rerender } = renderHook(
      ({ disabled }) => useCollapsedItems(disabled),
      { initialProps: { disabled: false } }
    );
    const collapse = result.current.collapse;

    rerender({ disabled: true });

    expect(result.current.collapse).toBe(collapse);
  });

  it("does not schedule cleanup while animations are enabled", () => {
    const requestAnimationFrame = vi.fn();
    vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);
    const { result } = renderHook(() => useCollapsedItems(false));

    act(() => result.current.collapse("item-a"));

    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect([...result.current.collapsedIds]).toEqual(["item-a"]);
  });

  it("returns no collapsed ids immediately when animations are disabled", () => {
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 9));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const { result, rerender } = renderHook(
      ({ disabled }) => useCollapsedItems(disabled),
      { initialProps: { disabled: false } }
    );
    act(() => result.current.collapse("item-a"));

    rerender({ disabled: true });

    expect(result.current.collapsedIds.size).toBe(0);
  });

  it("clears collapsed state when animations become disabled", () => {
    let scheduledFrame: FrameRequestCallback | undefined;
    const cancelAnimationFrame = vi.fn();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      scheduledFrame = callback;
      return 7;
    });
    vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrame);

    const { result, rerender, unmount } = renderHook(
      ({ disabled }) => useCollapsedItems(disabled),
      { initialProps: { disabled: false } }
    );
    act(() => result.current.collapse("item-a"));

    rerender({ disabled: true });
    expect(result.current.collapsedIds.size).toBe(0);
    act(() => scheduledFrame?.(0));
    rerender({ disabled: false });
    expect(result.current.collapsedIds.size).toBe(0);

    rerender({ disabled: true });
    unmount();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(7);
  });
});
