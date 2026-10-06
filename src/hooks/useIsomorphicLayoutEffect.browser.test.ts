// @vitest-environment jsdom

import { useLayoutEffect } from "react";
import { describe, expect, it } from "vitest";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

describe("useIsomorphicLayoutEffect in a browser", () => {
  it("uses React's layout effect when a window is available", () => {
    expect(useIsomorphicLayoutEffect).toBe(useLayoutEffect);
  });
});
