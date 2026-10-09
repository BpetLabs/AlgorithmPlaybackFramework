---
name: authoring
description: "Create or update Algorithm Playback starter pages, including Page.tsx layouts, playback.json scaffolding, source-code embedding, trace sizing, and routing to control-specific interactive skills."
user-invocable: true
---

# Algorithm Playback Page Authoring

Use this skill to create or modify a playback page and its initial control layout.

Before editing playback JSON, read `interactive-generic` and only the specialized skills needed for the requested controls:

- `interactive-array` for arrays and jagged arrays
- `interactive-stack` for stacks, queues, and priority queues
- `interactive-dictionary` for local-variable dictionaries
- `interactive-text` for play-by-play and console text
- `interactive-code-highlights` for code pauses and highlights
- `interactive-graph` for parent-child tree layouts

## Documentation

- `.\CONTROLS.md`

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

Add each control's layout and title. Pass renderer options through `configureProps`; include `defaultItemOffset` explicitly for applicable item-based controls.

Set `props.fitContent = true` in `configureProps` for every control whose renderer supports it. The current supported renderer types are `array`, `jaggedArray`, and `stack`; do not set it on unsupported renderers.

Set `props.borderWidth = 2` in `configureProps` for every `dictionary` control, including the default `locals` control.

Place custom controls relative to `playback-visualization-area` when it exists. Otherwise, use the available page area.

When `Page.tsx` provides separate `defaultControlLayouts` and `visualizationControlLayouts` maps, preserve that structure. Put `code`, `playbyplay`, and `locals` in `defaultControlLayouts`, and put every non-default control in `visualizationControlLayouts` so its coordinates remain relative to `playback-visualization-area`.

Size controls from the executed trace:

- A fixed array should fit its initialized length exactly. For example, `[1, 2, 3, 4, 5]` should have five visible slots.
- A dynamic array or list should fit the maximum count reached by the selected trace.
- A stack, queue, priority queue, or other growable control should fit its maximum traced size.
- With `fitContent` enabled, calculate the resolved control boundary at every trace step. Horizontal arrays fit their width, vertical arrays fit their height, and stacks fit their height while keeping their bottom edge anchored to the layout's original bottom edge. Account for the title moving with the fitted stack's top edge.

## Placement and clearance

- Treat each control's resolved rendered rectangle as occupied, including empty space inside that boundary. For a control without `fitContent`, this is its full `top`, `left`, `width`, and `height` rectangle. For a control with `fitContent`, use its fitted boundary at the current step rather than unused space in the declared layout. Expand the occupied bounds to include any title, label, rendered content, or traced animation phase that is subject to collision clearance. The downward-fall phase of a removal is explicitly exempt below.
- For every control, list the mutation operations that execute in the trace. For each current traced operation, determine whether it produces visible motion from its resulting item state, renderer, orientation, mutation family, and timing behavior. Reserve animation clearance only for paths that actually execute and animate.
- Calculate each animated item's path from the renderer's current motion distances. For a removal, treat the initial left/right movement as the **removal transition** and any subsequent downward movement as the **fall phase**; they have different collision rules. Inspect the animation implementation when the path is not documented rather than inferring it from the mutation name.
- Keep animation envelopes inside `playback-visualization-area`, except that a removal's downward-fall phase may pass through controls and exit through the bottom boundary as the visualization floor. Its horizontal and rotated bounds must remain inside the area's left and right boundaries. No animation may exit through the top or either side.
- Keep at least 25 px of edge-to-edge space between the expanded occupied bounds of every pair of controls. For controls `A` and `B`, at least one separating axis must satisfy `A.right + 25 <= B.left`, `B.right + 25 <= A.left`, `A.bottom + 25 <= B.top`, or `B.bottom + 25 <= A.top`. Empty space inside a control boundary is not available to another control or animation.
- Apply the same 25 px rule to insertions, movements, and the removal transition. The rule applies to that initial left/right removal movement, not to the fall phase. Once the fall begins, it may pass through other controls and does not require 25 px inter-control clearance; only its left and right boundary containment still applies.
- Placement preferences never override animation containment or the 25 px inter-control clearance.
- Make items larger when their text requires it, or smaller when necessary to fit the visualization, without going below the control-specific minimums.
- Put input controls first in JSON order and visual reading order, normally top-to-bottom and left-to-right.
- If the controls cannot fit within the available area, stop and recommend specific size, orientation, or placement changes.

### Arrays

- Preferred location: top-left.
- Prefer multiple arrays arranged vertically. Use one row at the top or bottom when vertical space is limited.
- Minimum `defaultItemOffset`: 25 px.

### Jagged arrays

Parent preferences:

- Location: top-left.
- `orientation`: `"horizontal"`. 
- `defaultItemOffset`: 60 px; minimum 45 px.
- `itemGap` or `itemCrossAxisGap`: 10 px where needed.
- Size the parent so every child has 10 px of clearance on each side.

Child preferences:

- `defaultItemOffset`: 40 px; minimum 25 px.
- Preferred orientation: `"vertical"`. Set `childDefaults.orientation` explicitly because child orientation otherwise follows the configured jagged-array orientation.

### Stacks

- Preferred location: right side, with the static stack's right edge one stack width from the visualization area's right wall. For area width `A` and stack width `W`, the preferred `left` is `A - 2W`; do not interpret the stack's `left` value itself as the wall clearance.
- Align the static stack's bottom edge with the visualization area's floor. A downward removal may fall through that bottom boundary, but it may not leave through either side.
- Preferred width: 120 px.
- Minimum `defaultItemOffset`: 25 px.
- For the vertical stack renderer, indexed inserts and updates enter from the left. Their leftward distance is `itemWidth + preInsertGap` when `preInsertGap` is set, otherwise approximately `1.05 * itemWidth`. Keep that entire entry corridor clear, plus the required 25 px separation from other controls.
- For the vertical stack renderer, animated removals first slide right by one `itemWidth`, then fall by one `itemWidth` while rotating up to 90 degrees. The rightward slide is the removal transition and must preserve 25 px clearance from other controls. The later fall phase may pass through controls and the floor, but its horizontal bounds must stay inside the visualization area's side boundaries. With resolved item width `W` and height `H`, a conservative right-side rotation extent is `W + (sqrt(W * W + H * H) - W) / 2` beyond the item's resting right edge.
- When multiple stacks are present, validate each stack's animation phases independently. Do not place another stack in an indexed-insert entry corridor or a removal-transition corridor even when their static rectangles have more than 25 px between them. The subsequent fall-phase corridor may cross other controls.

### Grids

- Preferred location: centered, aligned with neighboring controls when practical.
- Minimum calculated cell width and height: 25 px.

### Node graphs

- Preferred location: centered, aligned with neighboring controls when practical.
- Preferred calculated node width and height: 40 px; minimum 25 px.
- Apply the same 25 px edge-to-edge boundary clearance to nodeGraph controls; their bounds may not overlap another control's empty area.
- Choose row and column counts that produce square numeric nodes or rectangles wide enough for the longest text.
- Choose track sizing and gaps that keep arrows readable. Apply `interactive-graph` for tree placement and edge rules.

## Validate the completed page

- Verify the embedded `staticValue` matches the source file.
- Verify every pause and global step is synchronized across the relevant controls.
- Replay every step and confirm state, visibility, and pre-animation completion.
- Check titles, labels, and static control bounds at every step.
- Verify every renderer that supports `fitContent` has it enabled, then use its resolved fitted boundary for that step's layout and clearance checks.
- Verify every `dictionary` control sets `props.borderWidth = 2` in `configureProps`.
- Calculate and verify the edge-to-edge boundary gap for every pair of controls; each pair must have at least 25 px of separation on one axis.
- For every traced mutation, check both its pending and completion animation phases against every other control's occupied bounds and the visualization boundaries. For a removal, verify inter-control clearance during its horizontal transition, then allow its downward fall to cross controls and the floor while still verifying its horizontal and rotated bounds against both side boundaries.
- Confirm dynamic controls fit their maximum traced size and the final step count matches the trace.
- Before building or previewing the starter, run `npm.cmd run build` at the repository root. The starter imports the framework package through its built `dist` exports, so source changes are not visible until this build completes.
- Run the relevant typecheck, tests, and `npm.cmd run build` for `examples/animated-playback-starter` after the framework build.
- If a starter Vite development server was already running when the framework was rebuilt, restart it with `npm.cmd run dev -- --force` before visual validation so optimized dependency output cannot remain stale.
