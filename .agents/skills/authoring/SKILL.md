---
name: authoring
description: "Create, populate, or update complete Algorithm Playback starter pages, including Page.tsx layouts, playback.json state, source-code embedding, trace sizing, control placement, and cross-control synchronization."
user-invocable: true
---

# Algorithm Playback Page Authoring

Create or modify a complete playback page and keep its controls, trace, and layout synchronized.

## Choose scope and load control skills

Inventory the playback's control types before editing; this does not put every control in scope. Always load and apply `interactive-generic` when editing a playback control, plus each specialized skill needed for an in-scope control:

- `staticText` code control: `interactive-code-highlights`
- `dictionary` or Locals control: `interactive-dictionary`
- `text`, Play by Play, or console control: `interactive-text`
- `array`, jagged array, or matrix control: `interactive-array`
- `stack`, queue, or priority queue control: `interactive-stack`
- `grid` control: `interactive-grid`
- `nodeGraph` control: `interactive-graph`

Use full-playback scope for a new playback, execution-flow or pause changes, schema-wide transformations, and explicit audits. Include every control and step affected by the trace.

Otherwise, use localized scope: include only the requested controls, controls that must change to remain synchronized, and adjacent steps needed to verify state continuity. Preserve unrelated controls without auditing them. If another control type enters scope, load its specialized skill before editing it.

Before completion, validate every in-scope control with both `interactive-generic` and its specialized skill. Validate all trace-affected controls and steps under full-playback scope; validate only the affected range under localized scope.

## Establish the request

Determine:

- The existing page, or the name and destination of a new page.
- At least one command or scenario, its input, and what each requested control represents.

If required controls cannot be inferred, ask, "What playback controls should I create?" If the input cannot be inferred, ask, "What input should I use?" If a control's purpose is unclear, ask, "What does this playback control represent?"

Do not create a control for every input or runtime property unless the request requires it.

## Establish the canonical trace

Before creating a playback or changing its execution trace or represented runtime state, run the supplied code once with the selected command and input. When the request permits, choose a representative concrete value from a descriptive input. Reuse this canonical trace across every control and specialized skill.

Do not rerun the program for layout-only, wording-only, styling-only, metadata-only, or other changes that cannot affect runtime state.

Use every executed pause, including conditional and fallback pauses, to determine playback step count and maximum dynamic-control sizes.

- At most 50 steps: continue.
- More than 50 steps: report the count and obtain approval before continuing.
- More than 6 dynamic controls or a visible code control over 500 source lines: obtain approval before exhaustive validation. A localized edit may proceed when limited to its affected range.
- Code cannot run with available project tooling: report the blocker instead of guessing the trace.

## Scaffold a new page

Skip this section when modifying an existing page.

Copy `animated-playback-starter/src/template`, or a user-provided template, to `animated-playback-starter/src/playbackpages/<page-name>` unless the user provides another destination. Derive a concise folder name from the algorithm when needed.

Do not change anything inherited from the template. Only replace placeholders and add content in extension points explicitly defined by the template. If the requested playback cannot be implemented within those spaces, stop and ask the user before changing the template. A skill preference or general authoring rule never overrides this restriction.

When a source file is provided and the page has a `code` control:

1. Copy the source file into the page folder.
2. Run `animated-playback-starter/src/tools/ConvertCode.ps1 -InputFile <source-path>`.
3. Put the converted output in the `staticValue` of the control whose ID is `code`.

## Author `playback.json`

Keep these concerns in JSON:

- Control definitions and static values.
- Initial state and playback batches.
- Runtime content and visibility changes.

Empty `batches` are temporary scaffolding only. Before completion, populate every in-scope control according to its purpose and the canonical trace, except when the relevant control skill permits an intentionally static or no-relevant-state control.

For a control created later by the algorithm rather than supplied as input:

1. Initialize it with `"render": { "visible": false }`.
2. Make it visible at the first step where the represented variable or object exists in scope, even when it is empty and has not been read or mutated.
3. Add a `renderBatches` entry at that step. If no state batch exists at the same step, add an empty batch so the visible render state is materialized in the timeline.

## Configure `Page.tsx`

Keep spatial layout, dimensions, titles, and renderer configuration in `Page.tsx`.

Before creating or changing control layout, sizing, decorations, content bounds, renderer configuration, animation operations, or animation geometry, read and apply [Layout and sizing](references/layout-and-sizing.md). It contains the mandatory preservation, containment, clearance, sizing, and control-specific rules.

Record every renderer-default override and its measured reason in the working notes. Report material deviations from the documented preferences in the final response.
