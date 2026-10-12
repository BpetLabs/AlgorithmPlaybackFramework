import { useEffect, useRef } from "react";
import { ControlItem } from "../../common/models/controlItem";
import { parseHighlightRanges } from "../../common/models/highlightLine";
import { Snapshot } from "../../common/models/snapshot";
import { BaseRendererProps } from "./RendererMap";
import { DEFAULT_RENDERER_CONTAINER_CLASS_NAME, resolveContainerClassName } from "./rendererConfig";
import { parseInlineBoldSegments } from "./utils/inlineBold";

interface StaticTextRendererProps extends BaseRendererProps {
  snapshot: Snapshot<ControlItem>;
  staticValue: string;
  scrollSpeed?: number;
}

export function StaticTextRenderer({
  staticValue,
  snapshot,
  divHeight,
  divWidth,
  scrollSpeed,
  borderWidth = 2,
  containerClassName,
  containerStyle,
}: StaticTextRendererProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isAutoScrollingRef = useRef(false);
  const snapshotHighlights = snapshot.highlightLines ?? [];
  const lines = staticValue.split("\n");
  const defaultScrollSpeedLinesPerSecond = 40;

  const paddingPx = 4;
  const fontSizePx = 12;
  const lineHeightEm = 1.2;
  const lineHeightPx = fontSizePx * lineHeightEm;
  const contentHeightPx = lines.length * lineHeightPx;
  const topInsetPx = -1;
  const bottomInsetPx = -1;
  const parsedHighlights = snapshotHighlights.flatMap((h) =>
    parseHighlightRanges(h.range).map(({ start, end }) => ({ ...h, start, end })),
  );
  const mergedBorderHighlights = parsedHighlights
    .filter((h) => h.borderColor)
    .sort((a, b) => a.start - b.start || a.end - b.end)
    .reduce<Array<typeof parsedHighlights[number]>>((merged, highlight) => {
      const previous = merged[merged.length - 1];
      if (
        previous &&
        previous.borderColor === highlight.borderColor &&
        highlight.start <= previous.end + 1
      ) {
        previous.end = Math.max(previous.end, highlight.end);
        return merged;
      }

      merged.push({ ...highlight });
      return merged;
    }, []);
  const boxHighlights = mergedBorderHighlights.map((h) => {
    const top = (h.start - 1) * lineHeightPx + topInsetPx;
    const bottom = h.end * lineHeightPx - bottomInsetPx;
    return { ...h, top, bottom };
  });
  const backgroundHighlights = parsedHighlights
    .filter((h) => h.backgroundColor)
    .map((h) => {
      const top = (h.start - 1) * lineHeightPx;
      const bottom = h.end * lineHeightPx;
      return { ...h, top, bottom };
    });

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    isAutoScrollingRef.current = false;

    const requestedBottomLine = snapshot.scrollBottom;
    if (!Number.isFinite(requestedBottomLine)) return;

    const bottomLine = Math.max(1, Math.floor(requestedBottomLine as number));
    const targetBottomPx = bottomLine * lineHeightPx;
    const targetScrollTop = Math.max(0, targetBottomPx - scrollContainer.clientHeight);
    const maxScrollTop = Math.max(0, scrollContainer.scrollHeight - scrollContainer.clientHeight);
    const clampedTarget = Math.min(targetScrollTop, maxScrollTop);
    const requestedSpeed = scrollSpeed ?? defaultScrollSpeedLinesPerSecond;

    if (!Number.isFinite(requestedSpeed) || requestedSpeed <= 0) {
      scrollContainer.scrollTop = clampedTarget;
      return;
    }

    const pxPerSecond = requestedSpeed * lineHeightPx;
    let lastTimestamp: number | null = null;

    const stepScroll = (timestamp: number) => {
      if (!scrollContainerRef.current) return;

      if (lastTimestamp === null) {
        lastTimestamp = timestamp;
      }

      const dtSeconds = (timestamp - lastTimestamp) / 1000;
      lastTimestamp = timestamp;

      const current = scrollContainerRef.current.scrollTop;
      const delta = clampedTarget - current;

      if (Math.abs(delta) <= 0.5) {
        scrollContainerRef.current.scrollTop = clampedTarget;
        isAutoScrollingRef.current = false;
        animationFrameRef.current = null;
        return;
      }

      const maxStep = pxPerSecond * dtSeconds;
      const step = Math.sign(delta) * Math.min(Math.abs(delta), maxStep);
      scrollContainerRef.current.scrollTop = current + step;
      animationFrameRef.current = requestAnimationFrame(stepScroll);
    };

    isAutoScrollingRef.current = true;
    animationFrameRef.current = requestAnimationFrame(stepScroll);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      isAutoScrollingRef.current = false;
    };
  }, [snapshot.step, snapshot.scrollBottom, lineHeightPx, scrollSpeed]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const cancelAutoScroll = () => {
      if (!isAutoScrollingRef.current) return;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      isAutoScrollingRef.current = false;
    };

    const handleWheel = () => cancelAutoScroll();
    const handleTouchMove = () => cancelAutoScroll();
    const handleKeyDown = (event: KeyboardEvent) => {
      const isScrollKey = [
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
        "Home",
        "End",
        " ",
      ].includes(event.key);
      if (isScrollKey) cancelAutoScroll();
    };
    const handlePointerDown = () => cancelAutoScroll();

    scrollContainer.addEventListener("wheel", handleWheel, { passive: true });
    scrollContainer.addEventListener("touchmove", handleTouchMove, { passive: true });
    scrollContainer.addEventListener("pointerdown", handlePointerDown, { passive: true });
    scrollContainer.addEventListener("keydown", handleKeyDown);

    return () => {
      scrollContainer.removeEventListener("wheel", handleWheel);
      scrollContainer.removeEventListener("touchmove", handleTouchMove);
      scrollContainer.removeEventListener("pointerdown", handlePointerDown);
      scrollContainer.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      data-apf-renderer="static-text"
      className={resolveContainerClassName(
        "rounded",
        DEFAULT_RENDERER_CONTAINER_CLASS_NAME,
        containerClassName
      )}
      style={{
        width: divWidth,
        height: divHeight,
        position: "relative",
        padding: paddingPx,
        boxSizing: "border-box",
        overflow: "hidden",
        ...containerStyle,
      }}
    >
      <div
        ref={scrollContainerRef}
        className="w-full h-full rounded overflow-auto font-mono text-white"
        tabIndex={0}
        style={{
          fontSize: `${fontSizePx}px`,
          lineHeight: `${lineHeightEm}em`,
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "relative",
            minHeight: `${contentHeightPx}px`,
          }}
        >
          {backgroundHighlights.map((h, i) => (
            <div
              key={`bg-${i}`}
              style={{
                position: "absolute",
                top: `${h.top}px`,
                bottom: `${Math.max(0, contentHeightPx - h.bottom)}px`,
                left: 0,
                right: 0,
                backgroundColor: h.backgroundColor ?? "transparent",
                zIndex: 1,
                pointerEvents: "none",
              }}
            />
          ))}

          {boxHighlights.map((h, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: `${h.top}px`,
                bottom: `${Math.max(0, contentHeightPx - h.bottom)}px`,
                left: 0,
                right: 0,
                border: `${borderWidth}px solid ${h.borderColor ?? "transparent"}`,
                borderRadius: "1px",
                zIndex: 3,
                pointerEvents: "none",
                boxSizing: "border-box",
              }}
            />
          ))}

          <pre
            className="w-full font-mono text-white rounded"
            style={{
              margin: 0,
              boxSizing: "border-box",
              whiteSpace: "pre",
              position: "relative",
              zIndex: 2,
            }}
          >
            {lines.map((lineValue, idx) => {
              return (
                <span
                  key={idx}
                  className="whitespace-pre"
                >
                  {parseInlineBoldSegments(lineValue).map((segment, segmentIdx) => (
                    <span
                      key={segmentIdx}
                      style={segment.bold ? { fontWeight: 700 } : undefined}
                    >
                      {segment.text}
                    </span>
                  ))}
                  {"\n"}
                </span>
              );
            })}
          </pre>
        </div>
      </div>
    </div>
  );
}
