"use client";

import { useCallback, useEffect, useState } from "react";

const EMPTY_COLLAPSED_IDS = new Set<string>();

export function useCollapsedItems(disableAnimations: boolean) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!disableAnimations || collapsedIds.size === 0) return;

    const frame = requestAnimationFrame(() => {
      setCollapsedIds(new Set());
    });

    return () => cancelAnimationFrame(frame);
  }, [collapsedIds.size, disableAnimations]);

  const collapse = useCallback((id: string) => {
    setCollapsedIds((previous) => {
      if (previous.has(id)) return previous;
      return new Set(previous).add(id);
    });
  }, []);

  return {
    collapsedIds: disableAnimations ? EMPTY_COLLAPSED_IDS : collapsedIds,
    collapse,
  };
}
