export interface HighlightLine {
  id?: string;
  range: string;
  backgroundColor?: string;
  borderColor?: string;
}

export interface HighlightRange {
  start: number;
  end: number;
}

export const Highlight = {
  Return: "var(--_apf-highlight-return, rgba(90, 160, 90, 0.3))",
  Unused: "var(--_apf-highlight-unused, rgba(128, 128, 128, 0.1))",
  ReturnLocation:
    "var(--_apf-highlight-return-location, rgba(200, 200, 200, 0.35))",
  False: "var(--_apf-highlight-false, rgba(175, 0, 0, 0.1))",
  Branch: "var(--_apf-highlight-branch, rgba(255, 220, 0, 0.25))",
  Pause: "var(--_apf-highlight-pause, rgba(255, 165, 0, 0.6))",
} as const;

export function parseHighlightRanges(range: string): HighlightRange[] {
  return range
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [startRaw, endRaw] = part.split("-").map((value) => Number(value.trim()));
      const start = Number.isFinite(startRaw) ? Math.max(1, Math.floor(startRaw)) : 1;
      const endCandidate = Number.isFinite(endRaw) ? Math.floor(endRaw) : start;
      const end = Math.max(start, endCandidate);
      return { start, end };
    });
}
