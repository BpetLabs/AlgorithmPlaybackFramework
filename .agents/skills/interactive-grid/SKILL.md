---
name: interactive-grid
description: "Create, edit, audit, or synchronize grid controls in AnimatedPlayback JSON. Use when the requested work involves a grid, board, table, grid-cell state, or grid-cell border highlighting."
user-invocable: true
---

# Interactive Grid Rules

Apply [interactive-generic](../interactive-generic/SKILL.md) first.

## Grid shape and semantics

- Before setting `rows` and `cols`, define what each axis represents and map the algorithm's conceptual domain to grid coordinates using the request, code, and canonical trace.
- Derive `rows` and `cols` from the complete conceptual domain, including meaningful empty cells, rather than only the occupied cells or the storage shape of the source input.
- A grid may represent a rectangular two-dimensional array or matrix when the conceptual domain is a fixed set of coordinate-addressed cells and cell state is the relevant behavior. Do not substitute a grid when the user explicitly requires an array or jagged-array control, or when nested-array identity, row mutations, or jagged structure must be represented.
- If the axis meanings or domain size remain ambiguous and plausible interpretations produce materially different grids, ask what the grid should represent before authoring it.

## Cells and state

- Set positive integer `rows` and `cols`; grid coordinates are zero-based and must remain within those bounds.
- Address each cell by `row` and `col`; that coordinate is its state identity.
- Use `gridItems` for all cell initialization and changes. Grid cells do not use the generic `setValues`, `updates`, `inserts`, `deletes`, or target model.
- Store displayed cell content directly in `gridItems[].value`.
- Each `gridItems` entry is a persistent partial update. Include only changed properties; omitted properties retain their current values in that and later steps.
- Put at most one `gridItems` entry for a coordinate in the same batch.
- Use `borderColor: ""` to clear a highlight without changing that cell's value, background, text color, or other properties.

## Value timing

- For a paused cell assignment, keep the old value on that step and apply the new value through `gridItems` on the first following global step after the assignment executes.
- Preserve established semantic background and text colors when changing a value. Assign a new color only when the algorithm gives the cell a distinct visual state.

## Border highlighting

- Keep `showCellBorders` enabled; omit it to use the default `true` or set it to `true` explicitly. Do not toggle it to represent execution state.
- Use a cell's `borderColor` for algorithmic highlighting.
- A grid highlight requires a complete cell position. Combine all relevant execution state, such as the current iteration position and lane, to identify one cell, then highlight only that cell.
- Do not expand a cell reference into sibling cells, an entire row, or an entire column. Highlight an aggregate only when the algorithm explicitly addresses that aggregate.
- Use `Orange` for the primary current cell or loop cursor, `Pink` for a fixed or specifically tracked cell, and `Yellow` for a trailing or previous cell. For another semantic role, choose a distinct CSS named color and keep that role-color mapping consistent.
- Resolve standard-role color collisions with this precedence: `Orange`, then `Pink`, then `Yellow`. If only custom colors collide, choose one consistently.
- Clear all remaining algorithmic borders when their roles leave scope or the grid is no longer active, including at the end of playback.
