// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StaticTextRenderer } from "./StaticTextRenderer";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const snapshot = (overrides: Record<string, unknown> = {}) => ({
  id: "code",
  type: "staticText",
  step: 0,
  items: [],
  ...overrides,
});

describe("StaticTextRenderer", () => {
  it("merges adjacent border highlights and renders independent backgrounds and bold text", () => {
    const { container } = render(
      <StaticTextRenderer
        snapshot={snapshot({
          highlightLines: [
            { range: "1-2", borderColor: "red" },
            { range: "3", borderColor: "red" },
            { range: "2", backgroundColor: "blue" },
            { range: "4", backgroundColor: "green" },
          ],
        })}
        staticValue={"one\n**two**\nthree\nfour"}
        divWidth={200}
        divHeight={100}
      />
    );

    const elements = [...container.querySelectorAll<HTMLElement>("div")];
    expect(elements.filter((element) => element.style.border === "2px solid red")).toHaveLength(1);
    expect(elements.filter((element) => element.style.backgroundColor === "blue")).toHaveLength(1);
    expect(elements.filter((element) => element.style.backgroundColor === "green")).toHaveLength(1);
    expect(container.querySelector<HTMLElement>('span[style*="font-weight: 700"]')?.textContent).toBe("two");
  });

  it("jumps immediately for non-positive speed and clamps the target scroll position", () => {
    const { container, rerender } = render(
      <StaticTextRenderer
        snapshot={snapshot()}
        staticValue={"1\n2\n3\n4\n5\n6"}
        divWidth={200}
        divHeight={100}
        scrollSpeed={0}
      />
    );
    const scrollContainer = container.querySelector<HTMLElement>('[tabindex="0"]')!;
    Object.defineProperty(scrollContainer, "clientHeight", { configurable: true, value: 30 });
    Object.defineProperty(scrollContainer, "scrollHeight", { configurable: true, value: 200 });

    rerender(
      <StaticTextRenderer
        snapshot={snapshot({ step: 1, scrollBottom: 5 })}
        staticValue={"1\n2\n3\n4\n5\n6"}
        divWidth={200}
        divHeight={100}
        scrollSpeed={0}
      />
    );

    expect(scrollContainer.scrollTop).toBeCloseTo(48);
  });

  it("cancels animated scrolling after user interaction", () => {
    let scheduledFrame: FrameRequestCallback | undefined;
    const cancelAnimationFrame = vi.fn();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      scheduledFrame = callback;
      return 9;
    });
    vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrame);

    const { container, rerender } = render(
      <StaticTextRenderer snapshot={snapshot()} staticValue={"1\n2\n3\n4"} divWidth={100} divHeight={50} />
    );
    const scrollContainer = container.querySelector<HTMLElement>('[tabindex="0"]')!;
    Object.defineProperty(scrollContainer, "clientHeight", { configurable: true, value: 10 });
    Object.defineProperty(scrollContainer, "scrollHeight", { configurable: true, value: 100 });
    rerender(
      <StaticTextRenderer snapshot={snapshot({ step: 1, scrollBottom: 4 })} staticValue={"1\n2\n3\n4"} divWidth={100} divHeight={50} />
    );

    expect(scheduledFrame).toBeTypeOf("function");
    fireEvent.wheel(scrollContainer);
    expect(cancelAnimationFrame).toHaveBeenCalledWith(9);
  });
});
