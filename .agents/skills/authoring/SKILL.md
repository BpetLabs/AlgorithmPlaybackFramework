---
name: authoring
description: "Create, populate, or update complete Algorithm Playback starter pages, including Page.tsx layouts, playback.json state, source-code embedding, trace sizing, control placement, and cross-control synchronization."
user-invocable: true
---

# Algorithm Playback Page Authoring

Use this skill to create, populate, or modify a complete playback page and its control layout.


## Select scope and interactive skills

Inventory the playback's control types before editing. This inventory determines which specialized skills may be needed; it does not put every control in scope.

Always load and apply `interactive-generic` when editing any playback control. Also load the specialized skill for each control type in scope:

- `staticText` code control: `interactive-code-highlights`
- `dictionary` or Locals control: `interactive-dictionary`
- `text`, Play by Play, or console control: `interactive-text`
- `array`, jagged array, or matrix control: `interactive-array`
- `stack`, queue, or priority queue control: `interactive-stack`
- `grid`, grid control: `interactive-grid`
- `nodeGraph` control: `interactive-graph`

Use full-playback scope for a new playback, an execution-flow or pause change, a schema-wide transformation, or an explicit audit. Include every control and step affected by the resulting trace.

Otherwise use localized scope. Include only the requested controls, controls that must change to remain synchronized, and the adjacent steps needed to verify state continuity. Preserve unrelated controls without auditing them.

Load specialized skills as control types enter scope. If the work later requires editing another control type, load its specialized skill before modifying that control.

Before completion, validate every in-scope control using both `interactive-generic` and its matching specialized skill. Under localized scope, validate only the affected controls and steps. Under full-playback scope, validate all trace-affected controls and steps.

## Default preservation and visualization boundaries

Unless the user explicitly requests otherwise:

- Do not modify, remove, hide, rename, reposition, resize, or reconfigure any default control or existing layout geometry. This includes the canvas size, `playback-visualization-area`, default layout maps, and existing control positions or dimensions.
- Needing space for a requested control does not authorize resizing or repositioning the canvas, visualization area, default controls, or existing layouts.
- Add and position non-default controls only through `visualizationControlLayouts`.
- Keep every non-default control's complete effective boundary inside `playback-visualization-area`, including its base rectangle, decorations, and animation-state boundary.
- Do not override renderer defaults or skill recommendations for preference, convenience, or because an option appears in documentation or an example.
- Override a default only when a measured requirement makes it necessary, such as fitting traced content, preventing overlap, satisfying containment, or maintaining required clearance.
- Use the smallest override that solves the measured requirement. Record the changed property and reason in the working notes, and report material deviations in the final response.

## Validate the request before creating files

Identify or determine:

- The existing page or the name and destination of a new page.
- At least one command or scenario, its input, and what each requested control represents.

If required controls cannot be inferred, stop and ask, "What playback controls should I create?" If the input cannot be inferred from its description, ask, "What input should I use?" If a control's purpose is unclear, ask, "What does this playback control represent?"

Not every input or runtime property needs a corresponding playback control.

## Trace the requested scenario

Before creating a playback or changing its execution trace or represented runtime state, run the supplied code once with the selected command and input. A descriptive input is sufficient; choose a representative concrete value when the request permits it. Reuse this canonical trace across all controls and specialized skills. Do not rerun the program for layout-only, wording-only, styling-only, metadata-only, or other edits that cannot affect runtime state.

Use the executed pauses, including conditional and fallback pauses, to determine the playback step count and the maximum size of dynamic controls.

- If the trace produces at most 50 steps, continue.
- If it produces more than 50 steps, stop, report the count, and ask for approval before continuing.
- Before exhaustive validation, also ask for approval when the playback has more than 6 dynamic controls or a visible code control exceeds 500 source lines. A localized edit may proceed without approval when it remains limited to its affected range.
- If the code cannot be executed with the available project tooling, report the blocker instead of guessing the trace.

## Scaffold a new page

Skip this section when modifying an existing page.

Copy `examples/animated-playback-starter/src/template` or a provided template by the user to `examples/animated-playback-starter/src/playbackpages/<page-name>`, or to the destination provided by the user. Derive a concise folder name from the algorithm when none is provided.

When a source-code file is provided and the `code` control exists:

1. Copy the source file into the page folder.
2. Run `examples/animated-playback-starter/src/tools/ConvertCode.ps1 -InputFile <source-path>`.
3. Put the converted output in the `staticValue` property of the control whose ID is `code`.

## Create the controls in `playback.json`

Create requested controls with empty `batches` only as temporary scaffolding before authoring their state transitions. Before completion, populate every in-scope control according to its purpose and the executed trace, subject only to the documented intentionally-static or no-relevant-state exception.

For a control created later by the running algorithm rather than supplied as input, initialize it with `"render": { "visible": false }`. Make it visible at the first playback step where its represented variable or object exists in scope, even when it is still empty and has not yet been read or mutated. Do not delay visibility until the control receives its first item or operation. Add a `renderBatches` entry at that step and, when the control otherwise has no state batch at the same step, add an empty batch so the visible render state is materialized in the playback timeline.

Keep these concerns in JSON:

- Control definitions and static values
- Initial state and playback batches
- Runtime content and visibility changes

Keep spatial layout, dimensions, titles, and renderer configuration in `Page.tsx`.

## Configure controls in `Page.tsx`

Add each control's layout and title. Prefer renderer defaults for optional control properties unless a control-specific preference below applies. Resolve an applicable item-based control's default `defaultItemOffset` from the existing page, established project configuration, or renderer documentation, and explicitly set it in `configureProps`. Inspect renderer source only when the value remains unresolved or the renderer itself changed. For jagged arrays, explicitly set `childGap`, `childWidth`, and `childHeight` instead; jagged slot sizes are derived recursively.

Override a renderer default only when the user requests different behavior, a control-specific preference below applies, or the executed trace demonstrates that the default cannot satisfy fit, containment, clearance, readability, or semantic requirements. When an override is necessary, set the smallest possible group of properties and preserve defaults for everything else.

Increase `defaultItemOffset` only for a specific measured requirement, such as traced content or child geometry that does not fit the default slot; do not increase it for general styling. Never reduce it below the control-specific minimum. If the trace cannot fit without going below that minimum, stop processing and inform the user.

### Whole-slot sizing

- Prevent partial terminal slots in every array- or stack-based control.
- For a fixed-size control, resolve its `defaultItemOffset` and rendered main-axis size. Require the size to be within 0.01 px of a whole multiple of the offset: `abs(size - round(size / offset) * offset) <= 0.01`.
- Use width for horizontal arrays. Use height for vertical arrays, stacks, dictionaries, text controls, and memory stacks. Jagged arrays fit recursively in both dimensions and do not use this fixed-slot check.
- Apply the check to the base layout and each in-scope step-specific render size. If it fails, adjust the main-axis size to a whole number of default slots while preserving containment and clearance.

When creating a page or changing layout, sizing, decorations, content bounds, or animation operations, reserve a stable effective boundary for each affected control. Reuse existing verified boundaries for unchanged controls. Calculate a changed boundary from the union of the control's maximum rendered state, decorations, and traced animation paths subject to the rules below.

Set `props.borderWidth = 2` in `configureProps` for every `dictionary` control, including the default `locals` control.

Place custom controls relative to `playback-visualization-area` when it exists. Otherwise, use the full available page area.

When `Page.tsx` provides separate `defaultControlLayouts` and `visualizationControlLayouts` maps, preserve that structure.

Size controls from the executed trace:

- A fixed array should fit its initialized length exactly. For example, `[1, 2, 3]` should have three visible slots.
- A dynamic array or list should fit the maximum count reached by the selected trace.
- A stack, queue, priority queue, or other growable control should fit its maximum traced size.
- After resolving the content size, expand it to the trace-wide effective boundary defined below. Do not use the content rectangle alone for placement.

## Placement and clearance rules

- Always use preferred sizes and prefered location for controls below unless necessary to fit text or boundaries. 
- For each control, calculate one stable trace-wide effective boundary: `union(base rendered boundary, decoration boundary, traced animation boundary)`.
- Use the control's maximum resolved base size across all steps. For `fitContent`, use its maximum resolved size.
- Expand the boundary for every decoration outside the container, including titles, item labels, row and column labels, axis descriptions, edge labels, arrowheads, strokes, and highlight borders. Measure rendered text when practical; otherwise reserve conservatively for the longest traced content.
- For controls whose geometry or animation operations changed, read their batches and identify operations that create a pending, transition, or completion animation state. Reuse prior verified geometry for unchanged controls. Do not use an allowlist of operation names or addressing modes; this rule applies to current and future animation-producing operations.
- The presence of an animation-producing operation is sufficient to require its animation-state boundary. Calculate that boundary from the resolved control and item sizes plus the operation's animation geometry, including its offsets, scale, and rotation where applicable. When several operations exist, use the union of their boundaries and record only the maximum left, right, top, and bottom overflow needed across the trace. Frame-by-frame replay is not required.
- Calculate every animation-state rectangle numerically from the item's complete rendered rectangle after translation, scale, and rotation; checking only the animation offset or the control origin is insufficient. Convert the result into visualization-area coordinates and verify `left >= 0`, `top >= 0`, `right <= area.width`, and `bottom <= area.height`.
- Check animation-state rectangles against the control's own titles, labels, and other decorations. Their union defines the external effective boundary, but a union alone does not detect internal overlap. No animated item may intersect its control's decorations at any traced state.
- The only exception is the downward `falling` phase of a removal. Exclude that phase from inter-control clearance and bottom containment so it may pass through controls and exit through the visualization floor. The preceding removal transition, including its complete horizontal movement, remains inside the effective boundary. Keep the falling phase's horizontal and rotated bounds inside the visualization area's left and right edges; it may not exit through the top.
- Keep every effective boundary fully inside `playback-visualization-area`. Separately, keep at least 25 px of empty clearance between each pair of controls, measured edge-to-edge between their already-expanded effective boundaries. The 25 px is additional inter-control space and does not require a margin between a control and the visualization-area walls; an effective boundary may touch a wall while remaining contained. Apply the specialized occupancy exception under Node graphs when a `nodeGraph` layout rectangle overlaps another control.
- For ordinary control effective boundaries `A` and `B`, at least one axis must satisfy `A.right + 25 <= B.left`, `B.right + 25 <= A.left`, `A.bottom + 25 <= B.top`, or `B.bottom + 25 <= A.top`.
- Treat the complete effective boundary as occupied from the control's first visible frame through its last. Empty space inside a layout rectangle or between currently visible items is not available to another control, except for unoccupied space inside a `nodeGraph` layout rectangle as defined below.
- Placement preferences never override animation containment or the additional 25 px clearance between controls.
- Make items larger when their item text requires it, or smaller when necessary to fit the visualization, without going below the control-specific minimums. The title length should not be used as justification to change the width of a control.
- For controls of type `array`, put caller-supplied input arrays before derived arrays in JSON order and visual reading order, normally top-to-bottom and left-to-right. Do not apply this ordering requirement to other control types.
- If the controls cannot fit within the available area, stop and recommend specific size, orientation, or placement changes.

### Arrays preferences and defaults

- Set `defaultHeaderPosition` to `"bottom"`;
- Preferred location: top-left.
- Prefer multiple arrays arranged vertically on the left side. Use one row at the top or bottom when vertical space is limited.
- Preferred `defaultItemOffset`: 40 px.
- Minimum `defaultItemOffset`: 25 px.
- Use `emptyItemText`: "0" if its a numberic array when the programming language uses zero-initialization; otherwise "".

### Jagged Array preferences and defaults

Parent preferences:

- Set `defaultHeaderPosition` to `"top"`;
- Location: top-left.
- Set `orientation` only on the root jagged array. Prefer `"horizontal"` unless the user requests `"vertical"`.
- Set `childGap` to 5 px unless the user requests another value.
- Preferred `childWidth` and `childHeight`: 40 px.
- Minimum `childWidth` and `childHeight`: 25.
- Do not set jagged `defaultItemOffset`, `itemGap`, `itemCrossAxisGap`, or `fitContent`; the renderer recursively derives every parent slot and container size from `childGap`, `childWidth`, and `childHeight`.
- Only leaf `array` controls contain values. Jagged parents declare ordered stable control IDs in `children`, render borders around their child slots, and provide hierarchy and alternating layout.
- Leaf arrays support normal value and structural mutations, with structural mutations requiring `now: true`. Jagged-parent inserts require `childId` and `now: true`; jagged-parent deletes require an index and `now: true` and detach the complete subtree.
- Every inserted jagged parent must declare a complete descendant path ending in at least one leaf array. Represent an empty row or column with a leaf array whose `initialItemCount` is `0`.
- Never put values directly on a jagged parent or update its child references in place. The set family may change parent-slot appearance properties such as `borderColor`; parent border highlights render on the referenced child's actual frame.
- Use `emptyItemText`: "0" if its a numberic array when the programming language uses zero-initialization; otherwise "".

Child preferences:

- Do not configure `orientation` on descendants or in `childDefaults`. Every level alternates automatically from the root orientation.

### Stack preferences and defaults

- Set `defaultHeaderPosition` to `"bottom"`;
- Preferred location: - Right of existing controls.
- Set `fitContent` for stacks so their rendered height follows the current item count. Size the layout height for the maximum traced item count; `layout.top + layout.height` remains the fixed bottom anchor as the stack grows and shrinks. For a vertical stack using `tailInserts`, include the pending item's one-slot overflow above the fitted stack in the trace-wide effective boundary.
- Place the bottom anchor near the visualization area's floor while reserving enough space below it for the bottom title, title gap, borders, and traced animation overflow. Keep the complete effective boundary contained.
- Preferred width: 100 px.
- Minimum `defaultItemOffset`: 25 px.

### Grid preferences and defaults

- Set `defaultHeaderPosition` to `"top"`;
- Preferred location: Centered horizontal and vertically.
- Preferred `defaultItemOffset`: 40 px.
- Minimum calculated cell width and height: 25 px.
- Use `emptyItemText`: "0" if its a numberic grid when the programming language uses zero-initialization; otherwise "".

### Node Graph preferences and defaults

- Set `defaultHeaderPosition` to `"top"`;
- Preferred location: Centered horizontal and vertically.
- Preferred calculated node width and height:: 40 px.
- Minimum: 25 px.
- Treat the `nodeGraph` layout rectangle as a positioning canvas rather than an occupied boundary. It may overlap another control's layout or effective boundary, and its empty space does not require clearance.
- Do not allow the nodeGraph title to overlap another control's effective boundary.
- Keep each rendered node rectangle at least 25 px from every other control's effective boundary. For localized edits, include adjacent state boundaries and any step where the changed node reaches its maximum extent.
- Choose row and column counts that produce square numeric nodes or rectangles wide enough for the longest text. Use `itemWidthScale` and `itemHeightScale` only if needed for specific node text; prefer to keep all nodes equal sizes.
- Use fractional rows or columns when needed to refine node spacing.
- Choose track sizing and gaps that keep arrows readable.
- Node Graphs should have no border.

## Build
- If framework source changed, run `npm.cmd run build` at the repository root before building or previewing the starter. The starter imports the framework package through its built `dist` exports.
- Run the narrowest starter typecheck, tests, or build that covers the changed files. Do not run multiple commands that validate the same invariant unless an earlier result is inconclusive or project scripts combine distinct required checks.
- If a starter Vite development server was already running when the framework was rebuilt, restart it with `npm.cmd run dev -- --force` before visual validation so optimized dependency output cannot remain stale.
