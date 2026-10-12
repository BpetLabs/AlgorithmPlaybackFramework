import { Highlight } from "../common/models/highlightLine";

const highlightAliases: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(Highlight).map(([name, value]) => [`Highlight.${name}`, value])
);

export function resolveHighlightAliases<T>(value: T): T {
  if (typeof value === "string") {
    return (highlightAliases[value] ?? value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveHighlightAliases(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        resolveHighlightAliases(nestedValue),
      ])
    ) as T;
  }

  return value;
}
