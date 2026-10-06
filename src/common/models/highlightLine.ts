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
