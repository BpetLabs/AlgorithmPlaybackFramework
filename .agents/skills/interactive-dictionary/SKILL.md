---
name: interactive-dictionary
description: "Create, edit, audit, or synchronize local-variable dictionary controls in AnimatedPlayback JSON. Use when the requested work involves a dictionary or Locals control, variable state, or a directly coupled trace change."
user-invocable: true
---

# Interactive Dictionary State

Use this skill when the requested work involves an AnimatedPlayback local-variable dictionary, its variable state, or a directly coupled trace change.

A default Locals control is part of the playback even when the user does not mention it explicitly. For new playbacks and trace changes, populate relevant arguments and local variables at every pause using the shared execution trace. For localized edits, synchronize only the affected range plus its preceding and following state boundaries.

Before editing, apply [interactive-generic](../interactive-generic/SKILL.md) as the base skill. These rules extend it for local-variable dictionaries.

## Primary objective
- Keep dictionary state consistent with the current paused execution step.
- Show the pre-state on the paused line and the post-state on the next step after execution advances.

## Row values
- Store each dictionary row in `input.value` using the format `name | value`
- Use the default 50/50 column split. Set `splitColumnWidths` only when rendered content overflows, clips, or becomes unreadable. Use the smallest adjustment that fits, with positive percentages totaling 100.

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
