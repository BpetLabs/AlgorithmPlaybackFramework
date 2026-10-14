export function requirePositiveDimension(
  value: number,
  name: string
): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }

  return value;
}

export function rejectItemDimensions(
  itemWidth: number | undefined,
  itemHeight: number | undefined,
  controlType: string
) {
  if (itemWidth !== undefined) {
    throw new Error(
      `itemWidth is not supported for ${controlType} controls; use itemGap, itemCrossAxisGap, or itemOffset.`
    );
  }
  if (itemHeight !== undefined) {
    throw new Error(
      `itemHeight is not supported for ${controlType} controls; use itemGap, itemCrossAxisGap, or itemOffset.`
    );
  }
}

export function requirePositiveInteger(
  value: number | undefined,
  name: string
): number {
  if (!Number.isInteger(value) || (value ?? 0) <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return value as number;
}
