---
name: interactive-generic
description: "Create, populate, edit, audit, or synchronize AnimatedPlayback controls using shared rules for completeness, timing, targeting, cleanup, statefulness, and formatting. Use alongside every specialized interactive skill."
user-invocable: true
---

# Interactive Generic Control Rules

Apply this base skill to all AnimatedPlayback JSON work. Specialized skills override only their control-specific behavior; the user's explicit instructions take precedence.

## Scope and canonical trace

- Treat every declared control, including default and preexisting controls, as part of the playback.
- Use full-playback scope for new playbacks, trace or execution-flow changes, schema-wide transformations, and explicit audits. Populate and synchronize every control represented by the input or trace.
- For localized edits, change and validate only the requested controls, directly coupled controls, and adjacent steps needed to prove state continuity. Preserve unrelated controls and report observed out-of-scope issues without changing them.
- Use one canonical execution trace across all controls and specialized skills.

## Initial state and visibility

- Step 0 is the pre-invocation state. Caller-supplied input controls may appear there when they should be visible before the call, but method-created runtime state must not.
- Initialize method-created controls, collections, locals, counters, and other derived state at step 1 when setup creates them during the transition from step 0. State created later belongs on its first destination step.
- Put the external command and narration about completed setup at step 1. Introductory narration and the code control's initial scroll state belong at step 0.
- Initialize item values with the control's non-animated state-setting action, such as `setValues`; do not use an animated replacement action such as `updates`. A specialized control may define another initialization action.
- When preserving a renderer default, omit that item from initialization entirely. Do not emit a state-setting action merely to duplicate its default value, color, border, or another property.
- Set initial values when the represented control is initialized, or on the step where a hidden control becomes visible.
- If the first paused statement mutates state also initialized at step 1, order its batches so completed initialization runs first with `now: true` when required, followed by the paused statement's pending pre-animation. Verify that the renderer selects the later same-step snapshot.
- Verify that step 0 contains no method-created runtime values and step 1 contains the complete pre-state required by its paused statement.

## Mutation model and timing

- Use the code control's paused-line timeline as the authoritative global-step timeline.
- The paused-line timeline identifies when a trigger occurs; it does not restrict the visual source range that a specialized code-control skill assigns to that trigger.
- Put every pending control action caused by a paused line on that same global step, ordered by runtime evaluation order.
- Do not split same-line actions across steps because they use different mutation types or target different controls.
- When a specialized skill defines one visual state change as atomic, put every affected target in one control batch so the changes render in parallel. Do not serialize an atomic change across batches or steps; use ordered batches only for genuinely sequential runtime events.
- Use indexed `updates`, `inserts`, and `deletes` by default.
- Use head or tail mutation variants only when the user or a specialized skill explicitly requires their endpoint-specific animation behavior. Do not substitute them merely because they address the same logical item.
- Whenever an insert or update assigns `input.value`, include the intended `backgroundColor` in the same `input`.
- For initial state, use `setValues` as needed to address the intended item.
- The current pause trigger has not executed. Put its pending pre-animation action on that paused step for inserts, deletes, replacements, takes, and graph-node deletes.
- Complete all pending actions from that paused step on the next global step. Add an empty completion batch for each affected control that has no other action there; if the pending actions occur on the final step, add one final empty global step.
- Use `animateNow: true` if there is an animation or `now: true` only when a mutation completes during an unpaused transition and is not the current pause trigger.

## Targeting current and outgoing nodes

- Set operations accept `target: "current" | "outgoing" | "all"`; omitting `target` means `"current"`.
- `"current"` addresses the node that owns the logical index, head, or tail. An incoming replacement becomes current; there is no `"incoming"` target.
- `"outgoing"` addresses a node retained only to complete its removal animation. Use it when changing that visual node after it no longer owns the logical position, not merely because a current node moved.
- `"all"` changes both current and outgoing nodes and is valid only when both intentionally need the same property.
- When a highlighted node becomes outgoing during an insert, delete, or replacement, set the destination border on `"current"` and clear the animated node's border with `"outgoing"` in the completion batch.

## Item highlights

- These item-level rules apply to addressable data-control items, not source-line ranges in code controls. The specialized code-control skill defines the visual span of a code highlight.
- For controls with addressable items, derive exact item references and accesses from the canonical execution trace.
- An active item reference is program state that identifies one exact item, such as an array index, a complete grid-cell position, a node ID, or a nested-collection access path.
- Highlight only the individual item identified by an active item reference or read/write, including on paused steps. Do not expand a reference to sibling items, an entire row, an entire column, or another aggregate unless the algorithm explicitly addresses that aggregate.
- Preserve the highlight while the item reference remains in scope and continues to identify the same item. A paused statement that does not reference it does not clear the highlight.
- When an item reference moves, set the destination highlight and clear the former item in the same batch. Clear the highlight when the reference leaves scope.
- For a paused read or write, highlight the accessed item on the paused step while retaining its pre-execution state. For an access during an unpaused transition, show the highlight on the destination step.
- Use item borders for existing addressed items and active item references; do not use a border as a generic mutation marker.
- Any item in a `Pre*` animation state is already identified by that animation. Do not add a highlight border solely because the item is in a pre-animation state; add one only when the trace independently identifies the item through an access or active item reference.
- For a paused removal, highlight the existing item at the addressed position while retaining its pre-execution value and position.
- For a paused replacement, highlight the existing target rather than the incoming replacement unless another active item reference independently identifies the incoming item.
- Preserve an access highlight when an active item reference continues to identify the item; otherwise clear it on the next step.
- An item reference identifies at most one item in the same control at a time. If multiple active item references identify one item, render one border and use the specialized skill's color precedence.

## Values

- Put all displayed item content in `input.value`.
- Treat `emptyItemText` as the displayed value of every otherwise-empty item or cell. Include it in trace mapping, access highlighting, narration, sizing, and validation; do not add `setValues` merely to duplicate it.
- Do not use `leftAlignedValue` or `rightAlignedValue` unless the user explicitly requests those fields. They supplement presentation and never replace `value`.
- When a specialized control encodes several displayed fields in one item, use its documented `value` format.
- Render numeric maximum and minimum sentinels as `MAX` and `MIN` unless the user specifies otherwise.

## Color contrast

- Resolve the effective text and background colors for every displayed item state, including pending, incoming, and outgoing items.
- When `textColor` is omitted, inspect the renderer or theme default rather than assuming a foreground color.
- Require at least a 4:1 contrast ratio for normal text and 3:1 only when the rendered text qualifies as large text under WCAG.
- Do not infer accessibility from CSS color names. Calculate contrast from the resolved color values.
- Preserve semantic color consistency across related controls, but choose a darker or lighter variant when needed to satisfy contrast.

## Cleanup and minimization

- Within the selected scope, replay affected controls and remove duplicate, stale, or no-op actions. Include the preceding and following state boundaries for localized work.
- During cleanup-only work, report other skill mismatches with their control and step without changing them.
- Identify an action by its addressing mode, logical position, and resolved target. Actions for `"current"` and `"outgoing"` at the same position affect different nodes and are not duplicates.
- Within one batch, avoid repeated actions for the same identity when one final action represents the result.
- Do not clear a property immediately before setting it again on the same resolved target.
- Evaluate no-ops against the addressed target. A missing color and `""` are equivalent only on that target; clearing an outgoing color is not a no-op because the current node lacks one.
- Preserve mutation payloads required to render transitions.
- Remove unnecessary empty batches, but preserve those required to complete pending animations.

## Formatting

- Preserve nearby JSON style, 2-space indentation, object-key order, and unrelated files.
- Avoid extra indentation inside batches, `highlightLines`, `clearHighlights`, or nested action arrays.
