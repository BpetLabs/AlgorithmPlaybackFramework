// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SliderControl } from "./SliderControl";

afterEach(cleanup);

describe("SliderControl", () => {
  it("clamps the current index and disables navigation at both bounds", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <SliderControl historyLength={3} currentIndex={-5} onChange={onChange} />
    );

    expect((screen.getByLabelText("Previous step") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText("Playback step") as HTMLInputElement).value).toBe("0");
    fireEvent.click(screen.getByLabelText("Next step"));
    expect(onChange).toHaveBeenCalledWith(1);

    rerender(<SliderControl historyLength={3} currentIndex={99} onChange={onChange} />);
    expect((screen.getByLabelText("Next step") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText("Playback step") as HTMLInputElement).value).toBe("2");
    fireEvent.click(screen.getByLabelText("Previous step"));
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it("reports direct range input changes and handles an empty history", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <SliderControl historyLength={5} currentIndex={2} onChange={onChange} />
    );

    fireEvent.input(screen.getByLabelText("Playback step"), { target: { value: "4" } });
    expect(onChange).toHaveBeenCalledWith(4);

    rerender(<SliderControl historyLength={0} currentIndex={4} onChange={onChange} />);
    expect((screen.getByLabelText("Previous step") as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByLabelText("Next step") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByLabelText("Playback step").getAttribute("max")).toBe("0");
  });
});
