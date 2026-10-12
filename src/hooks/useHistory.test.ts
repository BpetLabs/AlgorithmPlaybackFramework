// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useHistory } from "./useHistory";

describe("useHistory", () => {
  it("navigates within bounds and truncates forward history after a new push", () => {
    const { result } = renderHook(() => useHistory("initial"));

    act(() => result.current.push("first"));
    act(() => result.current.push("second"));
    act(() => result.current.back());
    expect(result.current).toMatchObject({
      current: "first",
      index: 1,
      canGoBack: true,
      canGoForward: true,
    });

    act(() => result.current.push("replacement"));
    expect(result.current.history).toEqual(["initial", "first", "replacement"]);
    expect(result.current.canGoForward).toBe(false);

    act(() => result.current.back());
    act(() => result.current.back());
    act(() => result.current.back());
    expect(result.current.current).toBe("initial");
    expect(result.current.canGoBack).toBe(false);

    act(() => result.current.forward());
    expect(result.current.current).toBe("first");
  });
});
