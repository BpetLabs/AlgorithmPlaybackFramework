export type InlineTextSegment = {
  text: string;
  bold: boolean;
};

export function parseInlineBoldSegments(line: string): InlineTextSegment[] {
  const tokens = line.split(/(\*\*.*?\*\*)/g);
  return tokens
    .filter(token => token.length > 0)
    .map(token => {
      const isBoldToken = token.startsWith("**") && token.endsWith("**") && token.length >= 4;
      return {
        text: isBoldToken ? token.slice(2, -2) : token,
        bold: isBoldToken,
      };
    });
}

export function renderLineWithInlineBold(line: string) {
  if (!line) return "\u00a0";
  return parseInlineBoldSegments(line).map((segment, segmentIdx) => (
    <span
      key={segmentIdx}
      style={segment.bold ? { fontWeight: 700 } : undefined}
    >
      {segment.text}
    </span>
  ));
}
