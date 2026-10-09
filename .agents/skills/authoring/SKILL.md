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

Documentation: `.\CONTROLS.md`

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

Place custom controls relative to `playback-visualization-area` when it exists. Otherwise, use the available page area.

Size controls from the executed trace:

- A fixed array should fit its initialized length exactly. For example, `[1, 2, 3, 4, 5]` should have five visible slots.
- A dynamic array or list should fit the maximum count reached by the selected trace.
- A stack, queue, priority queue, or other growable control should fit its maximum traced size.

## Placement and clearance

- Prevent items, titles, labels, nodes, and arrows from overlapping or crossing the visualization boundary.
- Keep at least 25 px between the occupied bounds of controls, including titles and any space reserved for pre-animation movement.
- If the trace has no animation, the additional pre-animation clearance is unnecessary.
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

- Preferred location: right side - one stack width away from the right wall.
- Align the bottom edge with the visualization area's floor.
- Preferred width: 120 px.
- Minimum `defaultItemOffset`: 25 px.

### Grids

- Preferred location: centered, aligned with neighboring controls when practical.
- Minimum calculated cell width and height: 25 px.

### Node graphs

- Preferred location: centered, aligned with neighboring controls when practical.
- Preferred calculated node width and height: 40 px; minimum 25 px.
- The nodeGraph control bounds may overlap another control's empty area, but rendered nodes, labels, and arrows must not overlap other rendered content.
- Choose row and column counts that produce square numeric nodes or rectangles wide enough for the longest text.
- Choose track sizing and gaps that keep arrows readable. Apply `interactive-graph` for tree placement and edge rules.

## Validate the completed page

- Verify the embedded `staticValue` matches the source file.
- Verify every pause and global step is synchronized across the relevant controls.
- Replay every step and confirm state, visibility, and pre-animation completion.
- Check titles, labels, animation clearance, and visualization boundaries at every step.
- Confirm dynamic controls fit their maximum traced size and the final step count matches the trace.
- Run the relevant typecheck, tests, and build for the starter page.
