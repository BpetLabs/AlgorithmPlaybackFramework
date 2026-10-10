---
name: interactive-dictionary
description: "Create, populate, edit, audit, or synchronize local-variable dictionary controls in AnimatedPlayback JSON. Use whenever a playback contains a dictionary or Locals control, including new playback authoring or trace changes."
user-invocable: true
---

# Interactive Dictionary State

Use this skill whenever an AnimatedPlayback contains a local-variable dictionary, including new playback authoring and trace changes.

A default Locals control is part of the playback even when the user does not mention it explicitly. If the animated method has relevant arguments or local variables, populate the control and synchronize it at every pause.

Before editing, read and apply [interactive-generic](../interactive-generic/SKILL.md) as the base skill. These rules extend it for local-variable dictionaries.

## Primary objective
- Keep dictionary state consistent with the current paused execution step.
- Show the pre-state on the paused line and the post-state on the next step after execution advances.

## State rules
- When a variable first appears or changes, give it Orange borderColor for that global step only.
- Clear that Orange border on the next global step if the variable has not changed again.
- Remove a variable immediately once it leaves scope; use now: true for removals.
- When removing a displayed variable from the entire animation, compact the remaining dictionary indices across every batch so the removal does not leave blank rows.
- Dictionary updates do not use pre-animation states.

## Pause semantics
- If that line mutates a variable, keep the old value on the paused step and show the new value on the following step.
- If there is a meaningful pause immediately after the assignment, prefer showing the updated value there.

## Loop indices
- Always display each active loop-index variable while it is in scope at the current pause.
- Add the loop index on the first pause in its scope, update it as the loop advances, and remove it immediately when execution leaves that scope.
- For nested loops, display every loop index whose scope is active at the current pause.

## Validation
- Verify every declared Locals or dictionary control displays the relevant variables for the current paused activation. Reject empty batches when the executed method has relevant arguments or local variables.
- Confirm changed variables get a single Orange border.
- Ensure unchanged variables do not keep stale borders.
- Ensure out-of-scope variables are removed promptly and paused assignments do not show future values.
- Verify every in-scope loop index is present and every out-of-scope loop index is absent.
- Verify that permanent variable removals leave compact, consistent indices in all `setValues` and `deletes` actions.
