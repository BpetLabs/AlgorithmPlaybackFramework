export function requirePositiveDimension(
  value: number,
  name: string
): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }

  return value;
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
