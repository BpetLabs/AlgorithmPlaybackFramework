"use client";
import React from "react";

interface SliderControlProps {
  historyLength: number;
  currentIndex: number;
  onChange: (index: number) => void;
}

export function SliderControl({ historyLength, currentIndex, onChange }: SliderControlProps) {
  const maxIndex = Math.max(0, historyLength - 1);
  const resolvedIndex = Math.max(0, Math.min(currentIndex, maxIndex));
  const goBack = () => onChange(Math.max(0, resolvedIndex - 1));
  const goForward = () => onChange(Math.min(maxIndex, resolvedIndex + 1));

  return (
    <div data-apf-slider="" className="flex items-center gap-4">
      <button
        type="button"
        onClick={goBack}
        disabled={resolvedIndex === 0}
        aria-label="Previous step"
        className="px-2 py-1 bg-gray-500 text-white rounded"
      >
        &lt;
      </button>

      <input
        type="range"
        min={0}
        max={maxIndex}
        value={resolvedIndex}
        step={1}
        aria-label="Playback step"
        onInput={(event) => onChange(Number(event.currentTarget.value))}
        className="w-96"
      />

      <button
        type="button"
        onClick={goForward}
        disabled={resolvedIndex === maxIndex}
        aria-label="Next step"
        className="px-2 py-1 bg-gray-500 text-white rounded"
      >
        &gt;
      </button>
    </div>
  );
}
