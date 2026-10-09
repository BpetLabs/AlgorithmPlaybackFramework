---
name: authoring
description: "Create or update Algorithm Playback starter pages, including Page.tsx layouts, playback.json scaffolding, source-code embedding, trace sizing, and control placement."
user-invocable: true
---

# Algorithm Playback Page Authoring

Use this skill to create or modify a playback page and its initial control layout.

## Documentation

- Read the repository's [control reference](../../../CONTROLS.md) for renderer behavior, supported properties, and mutation semantics.

## Validate the request before creating files

Identify or determine:

- The existing page or the name and destination of a new page.
- The non-default controls and their types. The starter's default controls are `code`, `locals`, and `playbyplay`.
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

Create requested controls with empty `batches` before authoring their state transitions.

For a control created later by the running algorithm rather than supplied as input, initialize it with `"render": { "visible": false }` and make it visible in the batch where the runtime value becomes available.

Keep these concerns in JSON:

- Control definitions and static values
- Initial state and playback batches
- Runtime content and visibility changes

Keep spatial layout, dimensions, titles, and renderer configuration in `Page.tsx`.

## Configure controls in `Page.tsx`

Add each control's layout and title. Prefer renderer defaults for all optional control properties. As a documentation exception, inspect the current renderer code for each applicable item-based control and explicitly set its resolved default `defaultItemOffset` in `configureProps` so the value is visible in the page.

Override a renderer default only when the user requests different behavior or the executed trace demonstrates that the default cannot satisfy fit, containment, clearance, readability, or semantic requirements. When an override is necessary, set the smallest possible group of properties and preserve defaults for everything else.

Increase `defaultItemOffset` only for a specific measured requirement, such as traced content or child geometry that does not fit the default slot; do not increase it for general styling. Never reduce it below the control-specific minimum. If the trace cannot fit without going below that minimum, stop processing and inform the user.

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
- Calculate the base rendered boundary across every step. Include the container, border, resolved item sizes, gaps, offsets, spans, orientations, multiline content, `fitContent` movement or resizing, pending and outgoing states, and nested-child geometry. The layout rectangle alone is not sufficient when the renderer moves or resizes it.
- Expand the boundary for every decoration outside the container, including titles, item labels, row and column labels, axis descriptions, edge labels, arrowheads, strokes, and highlight borders. Measure rendered text when practical; otherwise reserve conservatively for the longest traced content.
- Determine whether each traced mutation actually animates from the current renderer, resolved props, item state, timing flags, and animation implementation. Do not infer an envelope from the mutation name or reuse an unverified formula.
- For each animation, include the paused pending state and next-step completion state; all mounted incoming, current, displaced, and outgoing nodes; and the real offsets, movement path, keyframes, scale, rotation, and disappearance behavior. Compose parent and child transforms for nested controls. Use axis-aligned bounds of transformed corners for scaling or rotation.
- Record the maximum left, right, top, and bottom overflow beyond the base rendered boundary. Animations triggered while advancing to a step run together, so completion motion from the previous pause and pending motion at the destination step must both fit. Use the trace-wide union rather than sharing space based on pause timing.
- The only exception is the downward `falling` phase of a removal. Exclude that phase from inter-control clearance and bottom containment so it may pass through controls and exit through the visualization floor. The preceding removal transition, including its complete horizontal movement, remains inside the effective boundary. Keep the falling phase's horizontal and rotated bounds inside the visualization area's left and right edges; it may not exit through the top.
- Keep every effective boundary fully inside `playback-visualization-area`. Separately, keep at least 25 px of empty clearance between each pair of controls, measured edge-to-edge between their already-expanded effective boundaries. The 25 px is additional inter-control space and does not require a margin between a control and the visualization-area walls; an effective boundary may touch a wall while remaining contained.
- For effective boundaries `A` and `B`, at least one axis must satisfy `A.right + 25 <= B.left`, `B.right + 25 <= A.left`, `A.bottom + 25 <= B.top`, or `B.bottom + 25 <= A.top`.
- Treat the complete effective boundary as occupied from the control's first visible frame through its last. Empty space inside a layout rectangle or between currently visible items is not available to another control.
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
`itemGap` or `itemCrossAxisGap`: set to 10 px always
- `orientation`: `"horizontal"`. 
- Minimum `defaultItemOffset`: 45 px.
- Set `itemGap` or `itemCrossAxisGap` only when the default spacing cannot provide the required clearance.
- Size the parent so every child has 10 px of clearance on each side.

Child preferences:

- Minimum `defaultItemOffset`: 25 px.
- Preferred orientation: `"vertical"`. Set `childDefaults.orientation` explicitly because child orientation otherwise follows the configured jagged-array orientation.

### Stacks

- Preferred location: right side, with the static stack's right edge one stack width from the visualization area's right wall. For area width `A` and stack width `W`, the preferred `left` is `A - 2W`; do not interpret the stack's `left` value itself as the wall clearance.
- Align the static stack's bottom edge with the visualization area's floor.
- Preferred width: 100 px.
- Minimum `defaultItemOffset`: 25 px.

### Grids

- Preferred location: centered, aligned with neighboring controls when practical.
- Minimum calculated cell width and height: 25 px.

### Node graphs

- Preferred location: centered, aligned with neighboring controls when practical.
- Preferred calculated node width and height: 40 px; minimum 25 px.
- Apply the same 25 px edge-to-edge boundary clearance to nodeGraph controls; their bounds may not overlap another control's empty area.
- Choose row and column counts that produce square numeric nodes or rectangles wide enough for the longest text.
- Choose track sizing and gaps that keep arrows readable.

## Validate the completed page

- Verify the embedded `staticValue` matches the source file.
- Verify every pause and global step is synchronized across the relevant controls.
- For every control, record its maximum base rectangle, decoration overflow on each side, animation overflow on each side, and final effective rectangle in visualization coordinates. Replay every transition and verify that current, incoming, displaced, and outgoing nodes stay inside that boundary except during the explicit `falling` phase; then verify containment and the additional 25 px separation between controls. Preview animated transitions because a static screenshot at a pause does not validate the path between pauses.
- Before building or previewing the starter, run `npm.cmd run build` at the repository root. The starter imports the framework package through its built `dist` exports, so source changes are not visible until this build completes.
- Run the relevant typecheck, tests, and `npm.cmd run build` for `examples/animated-playback-starter` after the framework build.
- If a starter Vite development server was already running when the framework was rebuilt, restart it with `npm.cmd run dev -- --force` before visual validation so optimized dependency output cannot remain stale.
