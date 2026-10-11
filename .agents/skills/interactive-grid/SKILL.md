---
name: interactive-grid
description: "Create, edit, audit, or synchronize grid controls in AnimatedPlayback JSON. Use when the requested work involves a grid, board, table, grid-cell state, or grid-cell border highlighting."
user-invocable: true
---

# Interactive Grid Rules

Use these rules when the requested work involves an AnimatedPlayback `grid` control, its cells, or a directly coupled trace change. Populate the relevant cells and synchronize their values and highlights with the execution trace.

Before editing, apply [interactive-generic](../interactive-generic/SKILL.md) as the base skill. These rules extend it for fixed-coordinate grids.

## Grid configuration and cells

- Set positive integer `rows` and `cols`; grid coordinates are zero-based and must remain within those bounds.
- Address every cell by `row` and `col`; the coordinate is the cell's state identity.
- Use `gridItems` to initialize or change grid cells.
- For grid-cell state, `gridItems` overrides the base skill's generic mutation and targeting model.
- Each `gridItems` entry is a persistent partial update. Put only the properties that change on the entry; all omitted properties retain their values on the current and future steps.
- Put at most one `gridItems` entry for a coordinate in the same batch.
- Use `borderColor: ""` to clear a highlight without changing that cell's value, background, text color, or other properties.

## Values and pause timing

- Show caller-supplied grid input at step 0 when it should be visible before invocation. Initialize method-created grid state at step 1 or the first destination step after its creation.
- A paused statement has not executed. For a paused cell assignment, keep the old value on that step and apply the new value through `gridItems` on the next global step.
- Border highlighting is the exception to value timing: show the accessed or targeted cell's border on the paused step while retaining its pre-execution value.
- Apply reads or writes that execute during an unpaused transition to the destination step.
- Preserve established semantic background and text colors when changing a value. Assign a new color only when the algorithm gives the cell a distinct visual state.

## Border highlighting

- Keep `showCellBorders` enabled; omit it to use the default `true` or set it to `true` explicitly. Do not toggle it to represent execution state.
- Use a cell's `borderColor` for algorithmic highlighting.
- Derive highlights from the shared execution trace. Highlight cells identified by active coordinate variables or accessed by the code executed since the preceding pause.
- Use `Orange` for the primary current cell or loop cursor, `Pink` for a fixed or specifically tracked cell, and `Yellow` for a trailing or previous cell. For another semantic role, choose a distinct CSS named color and keep that role-color mapping consistent.
- Preserve a role's border while the same in-scope role continues to identify that cell, including pauses that do not directly reference it. Move or clear the border only when the role's coordinate changes or the role leaves scope.
- If a cell is accessed during unpaused execution between pauses, show that access on the destination step. Keep it if an in-scope role continues to own it; otherwise clear it on the next step.
- A logical role may identify at most one cell in the same grid at a time. When the role moves, set the destination border and clear the former cell in the same batch.
- If multiple roles identify one cell, render one border. Resolve standard color collisions with this precedence: `Orange`, then `Pink`, then `Yellow`. If only custom colors collide, choose one consistently.
- Keep a write highlight separate from value timing: the paused write may highlight the current cell while it still displays the old value; the new value appears on the following step.
- Clear all remaining algorithmic borders when their roles leave scope or the grid is no longer active. Do not leave stale highlights at the end of playback.

## Validation

- Verify the configured dimensions are positive and every in-scope coordinate is within bounds.
- Verify every grid mutation uses coordinate-addressed `gridItems`, no generic mutation or target field is used for a grid cell, and each batch contains at most one entry per coordinate.
- Verify each `gridItems` entry contains only properties that change and omitted properties persist unchanged on later steps.
- Replay the affected trace range and verify values show pre-state on paused writes and post-state on the following destination step.
- For each step, derive required `(role, row, col, color)` highlights from the trace, not the JSON. Keep each role highlighted while in scope—even without a new access—move it with its coordinate, and clear its former cell when it moves, expires, or becomes invalid.
- After applying color-collision precedence, compare the required highlight set with the grid's rendered border set in both directions: every required role must produce its expected border, and every rendered border must correspond to a required active role. Also verify each role identifies at most one cell, role colors remain consistent, and moved or expired highlights are explicitly cleared.
- Verify structural cell borders remain independent from algorithmic highlight borders.
