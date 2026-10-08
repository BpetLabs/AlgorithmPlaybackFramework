---
name: interactive-generic
description: "Base rules for all AnimatedPlayback JSON, including animation timing, target selection, cleanup, statefulness, and formatting. Use alongside every specialized interactive skill."
user-invocable: true
---

# Interactive Generic Control Rules

This is the base skill for all AnimatedPlayback JSON work. Always apply it alongside any specialized interactive skill. Specialized skills extend these rules and take precedence only for their scoped control-specific behavior; the user's explicit instructions take precedence over both.

## Primary objective
- Keep control state consistent across steps, especially around pauses and transitions.
- Prefer minimal, stateful edits that preserve the intended animation.

## Generic mutation model
- Describe control mutations by effect: set, insert, or delete. Treat index, head, and tail as addressing modes, not different mutation semantics.
- Select the mutation effect first, then use the addressing mode that identifies the intended logical position.
- In JSON, the set family is `setValues`, `setHeadValues`, and `setTailValues`; the insert family is `inserts`, `headInserts`, and `tailInserts`; and the delete family is `deletes`, `headDeletes`, and `tailDeletes`.
- Apply the same timing, targeting, highlighting, and cleanup rules to every member of a mutation family.

## Pre-animation rules
- Pre-animation actions are allowed for insert and delete operations, replacements, takes, and graph-node deletes.
- Put the pre-animation action on the step where the mutating statement is paused.
- It represents the pending state and should not be treated as already completed.
- The next global step must contain a batch for that same control to complete the pending animation.
- If that next global step has no other action for the control, add an empty completion batch at `step + 1`.
- If the final step has such an action, add one final empty global step.
- Use now: true only when the mutation completes during an unpaused transition and is not the paused statement.

## Pause semantics
- Treat the paused line as a playback stop before execution.
- If a pre-animation step exists, it should signal what will happen after the pause.

## Step 0 and first execution step
- Treat step 0 as the pre-invocation state. Do not initialize state created by the animated method at step 0.
- Caller-supplied input visualizations may appear at step 0 when they should be visible before the call, such as an input objects. Introductory narration and the code control's initial scroll state should appear at step 0.
- Initialize method-created arrays, collections, locals, counters, and other derived runtime state at step 1, after the call and unpaused setup code have executed on the transition from step 0.
- Put the external command and any narration about completed setup at step 1 rather than step 0.
- If the first paused statement mutates a structure that is also initialized at step 1, use ordered batches at step 1: first apply the completed initialization with `now: true` when required, then apply the paused statement's pending pre-animation. Verify that the renderer selects the later same-step snapshot.
- Validate that step 0 contains no method-created runtime values and that step 1 contains the complete pre-state required by its paused statement.

## Targeting current and outgoing nodes
- Set operations accept `target: "current" | "outgoing" | "all"`. Omitting `target` is equivalent to `"current"`.
- `"current"` addresses the node that presently owns the logical index, head, or tail. The incoming replacement becomes the current node; there is no separate `"incoming"` target.
- `"outgoing"` addresses a node that remains alive only to finish its removal animation. Use it when a property must be changed on that animated node after it stops owning the current logical position.
- `"all"` applies the value change to both current and outgoing nodes. Use it only when both visual nodes intentionally need the same property change.
- Keep ordinary logical-state changes on `"current"`. Do not use `"outgoing"` merely because a node moved to a different logical position.
- When a highlighted node becomes outgoing during an insert, delete, or replacement transition, use a set operation to put the destination node's border on `"current"` and clear the animated node's border with `"outgoing"` in the completion batch. This rule applies to every control type and addressing mode.

## Values
- If a control value will be set as a number Max value or number Min value, set the node value to the text `MAX` or `MIN` instead unless otherwise specified.

## Cleanup and minimization
- Replay each control across steps and remove duplicate, stale, or no-op actions.
- Stick to cleanup actions, if you find other changes that mismatch to the skills mention the issue and the step that they occurs on without changing.  
- Treat an action's addressing mode, logical position, and resolved target as its identity. Actions for `"current"` and `"outgoing"` at the same index, head, or tail affect different nodes and are not duplicates.
- Within one batch, avoid repeated actions for the same identity when one final action can represent the result.
- Do not clear a property immediately before setting the same property again on the same resolved target.
- Evaluate no-ops against the addressed target. Missing `borderColor` or `backgroundColor` and an empty string are equivalent only on that same target; clearing an outgoing border is not a no-op merely because the current node has no border.
- Preserve mutation payloads required to render transitions.
- Remove unnecessary empty batches, but preserve empty batches required to complete pending animations.

## Cross-control validation
- After any change, verify that the affected state updates are reflected consistently across all relevant controls and steps.
- Ensure that a change to one control’s step progression is not left inconsistent with the others.
- If a mutation or transition affects multiple controls, update each control’s corresponding state rather than only one.
- When a transition leaves an outgoing node visible, verify that cleanup intended for that old visual node explicitly uses `target: "outgoing"` rather than accidentally changing the current node.
- Verify that a transition does not leave both the current and outgoing visual nodes with a border intended only for the current logical value.

## Formatting
- Preserve nearby JSON style, 2-space indentation, object-key order, and unrelated files.
- Avoid extra indentation inside batches, highlightLines, clearHighlights, or nested action arrays.
