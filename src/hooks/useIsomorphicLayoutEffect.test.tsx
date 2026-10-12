import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect";

function LayoutEffectConsumer() {
  useIsomorphicLayoutEffect(() => undefined, []);
  return <div>SSR-safe</div>;
}

describe("useIsomorphicLayoutEffect", () => {
  it("does not emit a layout-effect warning during server rendering", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      renderToStaticMarkup(<LayoutEffectConsumer />);

      const emittedLayoutEffectWarning = consoleError.mock.calls.some(([message]) =>
        String(message).includes("useLayoutEffect does nothing on the server")
      );
      expect(emittedLayoutEffectWarning).toBe(false);
    } finally {
      consoleError.mockRestore();
    }
  });
});
