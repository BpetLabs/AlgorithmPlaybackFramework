type ItemBoxStyleInput = {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
};

type ItemBoxStyleOptions = {
  borderWidth?: number;
};

const DEFAULT_OPTIONS = {
  defaultBackgroundColor: "transparent",
  borderWidth: 4,
};

export function buildItemBoxStyle(item: ItemBoxStyleInput, options: ItemBoxStyleOptions = {}) {
  return {
    backgroundColor: item.backgroundColor ?? DEFAULT_OPTIONS.defaultBackgroundColor,
    color: item.textColor ?? "#F9FAFB",
    borderStyle: "none",
    borderColor: "transparent",
    borderWidth: 0,
    boxSizing: "border-box" as const,
  };
}

export function buildHighlightOverlayStyle(
  item: ItemBoxStyleInput,
  options: ItemBoxStyleOptions & { borderRadius?: number | string } = {}
) {
  const borderColor = item.borderColor?.trim();
  if (!borderColor) return null;

  const borderWidth = item.borderWidth ?? options.borderWidth ?? DEFAULT_OPTIONS.borderWidth;

  return {
    position: "absolute" as const,
    inset: 0,
    border: `${borderWidth}px solid ${borderColor}`,
    borderRadius: options.borderRadius ?? 0,
    boxSizing: "border-box" as const,
    pointerEvents: "none" as const,
    zIndex: 1,
  };
}
