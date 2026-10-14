# Layout and Sizing

Read this reference before creating or changing a control's layout, sizing, decorations, content bounds, renderer configuration, animation operations, or animation geometry in `Page.tsx`.

## Preserve defaults and existing geometry

Unless the user explicitly requests otherwise:

- Do not change anything inherited from the template. Only replace placeholders and add content in extension points explicitly defined by the template.
- If a layout or sizing rule cannot be satisfied within those spaces, stop and ask the user before changing the template.
- Template-provided values override every preference, default, minimum, and control-specific instruction in this reference.
- Needing space for a requested control does not authorize changing the canvas, visualization area, default controls, or existing layouts.
- Add and position non-default controls only through `visualizationControlLayouts`.
- When `Page.tsx` has separate `defaultControlLayouts` and `visualizationControlLayouts` maps, preserve that structure.
- Prefer renderer defaults and the documented preferred sizes. Do not shrink below a default or preferred size merely because the traced content would fit. Override upward only when the user requests it or measured fit, containment, clearance, readability, or semantics require it; use the smallest sufficient increase. Shrink only when the user requests compact sizing or the preferred size cannot be contained, and never below the documented minimum.

Place custom controls relative to `playback-visualization-area` when it exists; otherwise, use the full available page area.

## Configure controls

Add every control's layout and title.

Configure renderer properties for each newly added control in an explicit branch for its control ID. Do not use one catch-all branch to apply item sizing or renderer behavior to multiple visualization controls, even when they currently share a type. Leave template-provided renderer branches unchanged.

For each newly added item-based control, set `defaultItemOffset` explicitly in that control's ID branch to the documented preferred value. Resolve an unlisted value from the existing page, established project configuration, or renderer default; inspect renderer source only when it remains unresolved or may have changed. Jagged arrays use explicit `childGap`, `childWidth`, and `childHeight` instead because their slot sizes are derived recursively.

For example:

```tsx
configureProps={(id, props) => {
  if (id === "maxHeap") {
    props.defaultItemOffset = 40;
    props.fitContent = true;
  } else if (id === "minHeap") {
    props.defaultItemOffset = 40;
    props.fitContent = true;
  }
}}
```

## Size item content

Inspect every traced value, including temporary, outgoing, and return states. Size each logical item for its largest rendered state.

- Resolve the renderer's font, line height, padding, and inset borders. Measure text when practical; otherwise, use conservative font metrics.
- Recalculate wrapping after changing available width; content width and height are coupled.
- Calculate `requiredItemHeight = ceil(maxLineCount * lineHeight + verticalPadding + verticalClearance)`.
- Calculate `requiredItemWidth = ceil(maxRenderedLineWidth + horizontalPadding + horizontalClearance)`.
- When a border overlays content, reserve at least its width on each affected side.
- Keep the preferred control width and height when all traced content fits. Increase only the dimension that needs more space, use the smallest larger value that fits, and recalculate wrapping, item sizing, decorations, animation boundaries, containment, and clearance.
- Keep the preferred `defaultItemOffset` when content fits. Increase it when all items need more main-axis space and the larger size fits.
- Use an item's `itemOffset` only when that item needs extra space and a larger default would not fit, or when the user explicitly requests per-item sizing.
- Never reduce `defaultItemOffset` below the control-specific minimum.
- Use the preferred item dimensions and offsets when they fit every traced state. When they do not fit, use the smallest larger dimensions that do; do not increase them for styling alone.

After sizing items, recalculate wrapping, control dimensions, animation boundaries, title clearance, containment, and inter-control clearance.

## Determine maximum control content size

Determine the largest content size each affected control reaches across the trace. This is the base control size before adding decorations and animation overflow.

- Without `fitContent`, an array, stack, or dictionary keeps its configured static size. Use that size as its trace-wide maximum, and ensure its main-axis dimension ends after a complete slot.
- With `fitContent`, calculate the occupied main-axis extent at every step and use the largest extent as the control's maximum size. The rendered control still ends at the current last occupied slot at each step.
- To calculate a step's occupied extent, resolve each logical slot to its `itemOffset`, or to `defaultItemOffset` when omitted, and sum the offsets in visual order. Treat linked outgoing and incoming replacement items as one slot and use the larger offset while both render.
- Width is the main axis for horizontal arrays, which extend right. Height is the main axis for vertical arrays, which extend down, and for bottom-anchored stacks and dictionaries, which extend up. Jagged arrays fit recursively in both axes; text controls retain renderer-specific sizing.

After determining the maximum content size, expand it to the trace-wide effective boundary. Do not place controls using the content rectangle alone.

## Calculate effective boundaries

### Decoration boundaries

- Include every external decoration: titles, item labels, row and column labels, axis descriptions, edge labels, arrowheads, strokes, and highlight borders. Measure text when practical; otherwise reserve conservatively for the longest traced content.

### Animation-state boundaries

When animation operations or geometry change, read the batches and identify every operation that creates a pending, transition, or completion state.

For each such state, calculate the complete item rectangle after translation, scale, and rotation using resolved control and item sizes. Convert it to visualization-area coordinates. Record the maximum left, right, top, and bottom overflow across the trace; frame-by-frame replay is unnecessary.

No animated item may intersect its control's titles, labels, or other decorations. The external union alone does not detect this internal overlap.

The downward `falling` phase of a removal is the sole exception: exclude it from inter-control clearance and bottom containment so it may pass through controls and exit through the visualization floor. The preceding removal transition, including its full horizontal movement, remains in the effective boundary. The falling item must remain within the visualization area's left and right edges.

### Trace-wide effective boundary

After calculating the base rendered, decoration, and animation-state boundaries, combine them into one stable effective boundary for every created or geometrically changed control:

`union(base rendered boundary, decoration boundary, animation-state boundary)`

Reuse existing verified boundaries for unchanged controls.

## Enforce containment and clearance

Every effective boundary must satisfy:

- `left >= 0`
- `top >= 0`
- `right <= area.width`
- `bottom <= area.height`

Keep at least 25 px of empty space between each pair of already-expanded effective boundaries. No wall margin is required; a boundary may touch a visualization-area wall.

For ordinary boundaries `A` and `B`, at least one condition must hold:

- `A.right + 25 <= B.left`
- `B.right + 25 <= A.left`
- `A.bottom + 25 <= B.top`
- `B.bottom + 25 <= A.top`

Treat a control's complete effective boundary as occupied from its first visible frame through its last. Space inside a layout rectangle or between current items is unavailable to other controls, except for unoccupied space inside a `nodeGraph` positioning canvas as described below.

Placement preferences never override containment or clearance. If controls cannot fit, stop and recommend specific size, orientation, or placement changes.

## Control defaults and preferences

Use these preferences for newly added controls unless traced content or effective-boundary requirements make an adjustment necessary. They do not authorize changes to template-provided controls.

For every newly added control, apply and audit both preference categories from the table:

1. **Preferred control dimensions:** derive both axes and configure the resulting layout width and height.
2. **Preferred item sizing:** configure the listed item offset or item dimensions.

Neither category substitutes for the other. Setting `defaultItemOffset`, `childWidth`, `childHeight`, or node size does not satisfy the preferred control dimensions, and setting the layout width and height does not satisfy the preferred item sizing. When an override is necessary, evaluate and document the control-dimension and item-sizing deviations separately.

| Control | `defaultHeaderPosition` | Preferred placement | Preferred control width | Preferred control height | Preferred item sizing | Minimum item sizing |
| --- | --- | --- | --- | --- | --- | --- |
| Array | `"bottom"` | Top-left; multiple arrays vertically on the left | Sum of the maximum traced slot offsets for a horizontal array, with one resolved item offset as the minimum; 40 px for a vertical array | 40 px for a horizontal array; sum of the maximum traced slot offsets for a vertical array, with one resolved item offset as the minimum | `defaultItemOffset: 40` px | `defaultItemOffset: 25` px |
| Jagged array root | `"top"` | Top-left | Recursively derived from traced children, `childWidth`, and `childGap` | Recursively derived from traced children, `childHeight`, and `childGap` | `childWidth: 40`, `childHeight: 40`, `childGap: 5` px | `childWidth: 25`, `childHeight: 25` px |
| Stack | `"bottom"` | Right of existing controls, bottom-anchored | 100 px | Maximum of one slot or the maximum traced item count, multiplied by the resolved item offset | `defaultItemOffset: 40` px | `defaultItemOffset: 25` px |
| Dictionary | `"top"` | Right of existing controls | 240 px | 200 px | `defaultItemOffset: 25` px | `defaultItemOffset: 25` px |
| Grid | `"top"` | Horizontally and vertically centered | Columns multiplied by 40 px | Rows multiplied by 40 px | Cell width and height: 40 px; `defaultItemOffset: 40` px | Cell width and height: 25 px |
| Node graph | `"top"` | Horizontally and vertically centered | Smallest positioning canvas that contains all nodes, edges, and animation states | Smallest positioning canvas that contains all nodes, edges, and animation states | Node width and height: 40 px | Node width and height: 25 px |

The minimum item-sizing column is a hard floor for an approved compact layout, not an alternative preferred target. Keep every preferred control dimension and item size whenever it fits. When content requires a larger item or control, increase the affected dimension and recalculate the other axis, decorations, animation boundaries, containment, and clearance.

Use `emptyItemText: "0"` for numeric arrays, jagged-array leaves, and grids when the language uses zero initialization; otherwise use `emptyItemText: ""`.

### Arrays

- Prefer multiple arrays vertically on the left. Use one row at the top or bottom when vertical space is limited.
- Put caller-supplied input arrays before derived arrays in JSON order and visual reading order, normally top-to-bottom and left-to-right. This ordering rule does not apply to other control types.

### Jagged arrays

- Choose between a grid and jagged array from both the conceptual shape and how the algorithm uses the data; do not choose from the source type alone.
- Prefer a grid when the domain is a fixed rectangular set of coordinate-addressed cells and the algorithm primarily reads, writes, highlights, or traverses cells by row and column.
- Keep a jagged array when rows are independently meaningful, row lengths vary, rows are inserted, deleted, replaced, or reordered, or nested-array identity must be represented. An explicit user request for an array or jagged-array control takes precedence.

- Set `orientation` only on the root; prefer `"horizontal"` unless the user requests `"vertical"`.
- Set `childGap: 5` unless the user requests another value.
- Do not set `defaultItemOffset`, `itemGap`, `itemCrossAxisGap`, or `fitContent`; the renderer derives parent slots and container size recursively from `childGap`, `childWidth`, and `childHeight`.
- Do not configure `orientation` on descendants or in `childDefaults`; each level alternates automatically from the root orientation.

### Stacks

- Set `fitContent` so rendered height follows item count. Size the layout for the maximum traced count; `layout.top + layout.height` remains the fixed bottom anchor as the stack grows and shrinks.
- For a vertical stack using `tailInserts`, include the pending item's one-slot overflow above the fitted stack in the effective boundary.
- Place the bottom anchor near the visualization floor while reserving space below for the title, title gap, borders, and traced animation overflow.
- Increase the preferred width when item-content sizing requires it.

### Node graphs

- Treat the layout rectangle as a positioning canvas rather than an occupied boundary. It may overlap another control's layout or effective boundary, and its empty space requires no clearance.
- The title may not overlap another control's effective boundary.
- Keep every rendered node rectangle at least 25 px from other controls' effective boundaries. For localized edits, inspect adjacent state boundaries and every step where a changed node reaches maximum extent.
- Choose row and column counts that produce square numeric nodes or rectangles wide enough for the longest text. Use `itemWidthScale` and `itemHeightScale` only when specific node text requires them; otherwise keep nodes equal-sized.
- Fractional rows or columns may refine spacing. Choose track sizes and gaps that keep arrows readable.
- The control container must not render a frame, outline, border, or box shadow. For example, set `props.containerClassName = "bg-transparent"`. This does not apply to node borders, traversal highlights, or the surrounding visualization-area boundary.
