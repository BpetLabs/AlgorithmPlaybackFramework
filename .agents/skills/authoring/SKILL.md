---
name: authoring
description: "Create, populate, or update complete Algorithm Playback starter pages, including Page.tsx layouts, playback.json state, source-code embedding, trace sizing, control placement, and cross-control synchronization."
user-invocable: true
---

# Algorithm Playback Page Authoring

Use this skill to create, populate, or modify a complete playback page and its control layout.


## Route to applicable interactive skills

Before creating or editing an AnimatedPlayback, inventory every control in the playback.

- `staticText` code control: `interactive-code-highlights`
- `dictionary` or locals control: `interactive-dictionary`
- `text`, Play by Play, or console control: `interactive-text`
- `array`, jagged array, or matrix control: `interactive-array`
- `stack`, queue, or priority queue control: `interactive-stack`
- `nodeGraph` control: `interactive-graph`
- `interactive-generic` - Covers all controls

Do not load specialized interactive skills for control types that are absent. 

Every declared control is part of the authoring scope, including controls supplied by the starter template and controls the user did not mention explicitly. Use the matching specialized skill to populate and synchronize each control when the input or executed trace contains state that the control represents.

Before completion, validate each control against the validation section of its matching interactive skill. Also apply the cross-control validation rules from `interactive-generic` to verify that every global step remains synchronized.

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

Before creating or updating controls, run the supplied code with the selected command and input. A descriptive input is sufficient; choose a representative concrete value when the request permits it.

Use the executed pauses, including conditional and fallback pauses, to determine the playback step count and the maximum size of dynamic controls.

- If the trace produces at most 50 steps, continue.
- If it produces more than 50 steps, stop, report the count, and ask for approval before continuing.
- If the code cannot be executed with the available project tooling, report the blocker instead of guessing the trace.

## Scaffold a new page

Skip this section when modifying an existing page.

Copy `examples/animated-playback-starter/src/template` to `examples/animated-playback-starter/src/playbackpages/<page-name>`, or to the destination provided by the user. Derive a concise folder name from the algorithm when none is provided.

When a source-code file is provided and the `code` control exists:

1. Copy the source file into the page folder.
2. Run `examples/animated-playback-starter/src/tools/ConvertCode.ps1 -InputFile <source-path>`.
3. Put the converted output in the `staticValue` property of the control whose ID is `code`.

## Create the controls in `playback.json`

Create requested controls with empty `batches` only as temporary scaffolding before authoring their state transitions. Before completion, populate every declared control according to its purpose and the executed trace, subject only to the documented intentionally-static or no-relevant-state exception.

For a control created later by the running algorithm rather than supplied as input, initialize it with `"render": { "visible": false }` and make it visible in the batch where the runtime value becomes available.

Keep these concerns in JSON:

- Control definitions and static values
- Initial state and playback batches
- Runtime content and visibility changes

Keep spatial layout, dimensions, titles, and renderer configuration in `Page.tsx`.

## Configure controls in `Page.tsx`

Add each control's layout and title. Prefer renderer defaults for all optional control properties. As a documentation exception, inspect the current renderer code for each applicable item-based control and explicitly set its resolved default `defaultItemOffset` in `configureProps` so the value is visible in the page. For jagged arrays, explicitly set `childGap`, `childWidth`, and `childHeight` instead; jagged slot sizes are derived recursively.

Override a renderer default only when the user requests different behavior or the executed trace demonstrates that the default cannot satisfy fit, containment, clearance, readability, or semantic requirements. When an override is necessary, set the smallest possible group of properties and preserve defaults for everything else.

Increase `defaultItemOffset` only for a specific measured requirement, such as traced content or child geometry that does not fit the default slot; do not increase it for general styling. Never reduce it below the control-specific minimum. If the trace cannot fit without going below that minimum, stop processing and inform the user.

### Whole-slot sizing

- Prevent partial terminal slots in every array- or stack-based control.
- For a fixed-size control, resolve its `defaultItemOffset` and rendered main-axis size. Require the size to be within 0.01 px of a whole multiple of the offset: `abs(size - round(size / offset) * offset) <= 0.01`.
- Use width for horizontal arrays. Use height for vertical arrays, stacks, dictionaries, text controls, and memory stacks. Jagged arrays fit recursively in both dimensions and do not use this fixed-slot check.
- Apply the check to the base layout and every step-specific render size. If it fails, adjust the main-axis size to a whole number of default slots while preserving containment and clearance.

Reserve a stable effective boundary for every control. Calculate it from the union of the control's maximum rendered state, decorations, and every traced animation path subject to the rules below. Reserve that complete boundary from the first visible frame.

Set `props.borderWidth = 2` in `configureProps` for every `dictionary` control, including the default `locals` control.

Place custom controls relative to `playback-visualization-area` when it exists. Otherwise, use the full available page area.

When `Page.tsx` provides separate `defaultControlLayouts` and `visualizationControlLayouts` maps, preserve that structure.

Size controls from the executed trace:

- A fixed array should fit its initialized length exactly. For example, `[1, 2, 3]` should have three visible slots.
- A dynamic array or list should fit the maximum count reached by the selected trace.
- A stack, queue, priority queue, or other growable control should fit its maximum traced size.
- After resolving the content size, expand it to the trace-wide effective boundary defined below. Do not use the content rectangle alone for placement.

## Placement and clearance

- For each control, calculate one stable trace-wide effective boundary: `union(base rendered boundary, decoration boundary, traced animation boundary)`.
- Use the control's maximum resolved base size across all steps. For `fitContent`, use its maximum resolved size.
- Expand the boundary for every decoration outside the container, including titles, item labels, row and column labels, axis descriptions, edge labels, arrowheads, strokes, and highlight borders. Measure rendered text when practical; otherwise reserve conservatively for the longest traced content.
- Read every batch for the control and identify every operation that creates a pending, transition, or completion animation state. Do not use an allowlist of operation names or addressing modes; this rule applies to current and future animation-producing operations.
- The presence of an animation-producing operation is sufficient to require its animation-state boundary. Calculate that boundary from the resolved control and item sizes plus the operation's animation geometry, including its offsets, scale, and rotation where applicable. When several operations exist, use the union of their boundaries and record only the maximum left, right, top, and bottom overflow needed across the trace. Frame-by-frame replay is not required.
- The only exception is the downward `falling` phase of a removal. Exclude that phase from inter-control clearance and bottom containment so it may pass through controls and exit through the visualization floor. The preceding removal transition, including its complete horizontal movement, remains inside the effective boundary. Keep the falling phase's horizontal and rotated bounds inside the visualization area's left and right edges; it may not exit through the top.
- Keep every effective boundary fully inside `playback-visualization-area`. Separately, keep at least 25 px of empty clearance between each pair of controls, measured edge-to-edge between their already-expanded effective boundaries. The 25 px is additional inter-control space and does not require a margin between a control and the visualization-area walls; an effective boundary may touch a wall while remaining contained. Apply the specialized occupancy exception under Node graphs when a `nodeGraph` layout rectangle overlaps another control.
- For ordinary control effective boundaries `A` and `B`, at least one axis must satisfy `A.right + 25 <= B.left`, `B.right + 25 <= A.left`, `A.bottom + 25 <= B.top`, or `B.bottom + 25 <= A.top`.
- Treat the complete effective boundary as occupied from the control's first visible frame through its last. Empty space inside a layout rectangle or between currently visible items is not available to another control, except for unoccupied space inside a `nodeGraph` layout rectangle as defined below.
- Placement preferences never override animation containment or the additional 25 px clearance between controls.
- Make items larger when their item text requires it, or smaller when necessary to fit the visualization, without going below the control-specific minimums. The title length should not be used as justification to change the width of a control.
- Put input controls first in JSON order and visual reading order, normally top-to-bottom and left-to-right.
- If the controls cannot fit within the available area, stop and recommend specific size, orientation, or placement changes.

### Arrays

- Preferred location: top-left.
- Prefer multiple arrays arranged vertically. Use one row at the top or bottom when vertical space is limited.
- Minimum `defaultItemOffset`: 25 px.

### Jagged arrays

Parent preferences:

- Location: top-left.
- Set `orientation` only on the root jagged array. Prefer `"horizontal"` unless the user requests `"vertical"`.
- Set `childGap` to 10 px unless the user requests another value.
- Set `childWidth` and `childHeight` to at least 25 px and large enough for the traced leaf content.
- Do not set jagged `defaultItemOffset`, `itemGap`, `itemCrossAxisGap`, or `fitContent`; the renderer recursively derives every parent slot and container size from `childGap`, `childWidth`, and `childHeight`.
- Leaf arrays in a jagged tree support value and structural mutations, with structural mutations requiring `now: true`. Jagged parents may insert only empty child containers and may remove only empty child containers; never put values directly on a jagged parent or update its child containers.
- An empty jagged parent occupies at least `childWidth + 2 × childGap` by `childHeight + 2 × childGap`.

Child preferences:

- Do not configure `orientation` on descendants or in `childDefaults`. Every level alternates automatically from the root orientation.

### Stacks

- Preferred location: - Right of existing controls
- Align the static stack's bottom edge with the visualization area's floor.
- Preferred width: 100 px.
- Minimum `defaultItemOffset`: 25 px.
- If a vertical stack uses `tailInserts`, use a fixed-height layout with `fitContent` disabled. Set its height to `(maximum traced item count + 1) × defaultItemOffset`; the additional top slot is reserved for the insertion animation.

### Grids

- Preferred location: centered, aligned with neighboring controls when practical.
- Minimum calculated cell width and height: 25 px.

### Node graphs

- Preferred location: centered, aligned with neighboring controls when practical.
- Preferred calculated node width and height: 40 px; minimum 25 px.
- Treat the `nodeGraph` layout rectangle as a positioning canvas rather than an occupied boundary. It may overlap another control's layout or effective boundary, and its empty space does not require clearance.
- Do not allow the nodeGraph title to overlap another control's effective boundary.
- At every step, keep each rendered node rectangle at least 25 px from every other control's effective boundary. Edges, edge labels, arrowheads, and empty graph space do not require inter-control clearance.
- Choose row and column counts that produce square numeric nodes or rectangles wide enough for the longest text. Use `itemWidthScale` and `itemHeightScale` only if needed for specific node text; prefer to keep all nodes equal sizes.
- Use fractional rows or columns when needed to refine node spacing.
- Choose track sizing and gaps that keep arrows readable.
- Node Graphs should have no border.

## Validate the completed page

- Check every changed layout value, renderer override, control definition, and batch action. Use each documented default or preferred value unless the user requested otherwise or the executed trace provides a specific, measured reason to deviate.
- Verify every slot-based control passes the whole-slot check at its fixed size or maximum resolved `fitContent` size. Do not accept a truncated terminal slot.
- Record the rule and trace-based reason for every deviation in the working notes. If a deviation has no valid justification, restore the documented default or preferred value before completion.
- Do not report the playback complete while any known skill-rule violation remains.
- Verify the embedded `staticValue` matches the source file.
- Verify every pause and global step is synchronized across the relevant controls.
- Verify every declared control is populated for the state it represents. Reject unexplained empty scaffolds, including default Code, Play by Play, and Locals controls.
- For every control, record its maximum base rectangle, decoration overflow, animation-state boundaries found by scanning all steps, and final effective rectangle. Verify that their union is contained and maintains the additional 25 px separation, subject to the explicit `falling` and `nodeGraph` exceptions.
- if a framework change was made, before building or previewing the starter, run `npm.cmd run build` at the repository root. The starter imports the framework package through its built `dist` exports, so source changes are not visible until this build completes.
- Run the relevant typecheck, tests, and `npm.cmd run build` for `examples/animated-playback-starter` after the framework build.
- If a starter Vite development server was already running when the framework was rebuilt, restart it with `npm.cmd run dev -- --force` before visual validation so optimized dependency output cannot remain stale.
