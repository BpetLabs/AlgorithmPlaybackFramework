---
name: interactive-dictionary
description: "Create, edit, audit, or synchronize local-variable dictionary controls in AnimatedPlayback JSON. Use when the requested work involves a dictionary or Locals control, variable state, or a directly coupled trace change."
user-invocable: true
---

# Interactive Dictionary State

Apply [interactive-generic](../interactive-generic/SKILL.md) first.

## Trace state

- Populate the default `Locals` control with relevant arguments and local variables from the shared execution trace.
- At each pause, show the variables in scope and their values before the paused statement executes. Show a mutation on the first following global step after that statement has executed.
- Always show active loop-index variables. Add each index on the first pause in its scope, update it as the loop advances, and remove it when execution leaves that scope. For nested loops, show every index currently in scope.

## Rows and mutations

- Store each row in `input.value` using the format `name | value`.
- Use the default 50/50 column split. Set `splitColumnWidths` only when rendered content overflows, clips, or becomes unreadable. Use the smallest adjustment that fits, with positive percentages totaling 100.
- Use indexed `setValues` when a row first appears or its value changes. Dictionary row changes do not use `updates`, `inserts`, or pending pre-animation states.
- Give a new or changed row `borderColor: "Orange"` for its destination global step. Clear it on the next global step unless the row changes again.
- Remove a row as soon as its variable leaves scope using indexed `deletes` with `now: true`.
- When removing a displayed variable from the playback definition, compact later row indices across every affected batch so no blank row remains.
