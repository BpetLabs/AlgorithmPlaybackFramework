// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCollapsedItems } from "./useCollapsedItems";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useCollapsedItems", () => {
  it("deduplicates collapsed ids", () => {
    const { result } = renderHook(() => useCollapsedItems(false));

    act(() => {
      result.current.collapse("item-a");
      result.current.collapse("item-a");
    });

    expect([...result.current.collapsedIds]).toEqual(["item-a"]);
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
