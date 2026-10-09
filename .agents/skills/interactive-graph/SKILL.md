---
name: interactive-graph
description: "Use when creating or editing parent-child tree layouts in nodeGraph grid JSON, including arrow direction, anchors, placement, and spacing."
---

# Interactive Grid Tree Rules

Use these rules when creating or editing a parent-child tree in a `nodeGraph` grid.

Before editing, read and apply [interactive-generic](../interactive-generic/SKILL.md) as the base skill. These rules extend it for node-graph grid layout.

## Edge ownership and arrow direction

- Create graph edges only in the child-to-parent direction; never create an edge from a parent to a child.
- Store every edge with:
  - `from`: child node ID
  - `to`: parent node ID
- Draw the arrow visually from the parent down to the child.
- Because the stored edge runs from child to parent, use `"arrow": "prev"` so the arrowhead appears at the child.

## Parent anchor

Choose the parent's target anchor from the child's horizontal position:

- Child left of parent: `"toAnchor": "lowerLeft"`
- Child centered under parent: `"toAnchor": "bottom"`
- Child right of parent: `"toAnchor": "lowerRight"`

Treat a child as centered when its horizontal center matches the parent's horizontal center, accounting for `columnSpan`.

## Child anchor

Prefer the child's top-center so arrows remain as straight as possible:

- Default: `"fromAnchor": "top"`
- Child more than one node width left of its parent: `"fromAnchor": "upperRight"`
- Child more than one node width right of its parent: `"fromAnchor": "upperLeft"`

Measure horizontal distance between node centers and compare it with one resolved node width. In grid units, use the larger of the child and parent `columnSpan` values, defaulting each missing span to 1. Use a corner anchor only when the center distance is strictly greater than that width; equality still uses `top`.

## Node colors and borders

- Every action that assigns a node value must include a `backgroundColor` in the same input, whether the action initializes the node or changes it later. Use `Teal` by default unless the user requests another color or the value's state has a defined color.
- An node is relevant when a distinct in-scope local variable refers to it. Preserve that highlight across pauses until the local moves to another index or leaves scope; a pause whose statement does not reference the local does not end the highlight. A local variable may identify at most one highlighted index in a control at a time.
- If a node is accessed during unpaused execution between two pauses, show that access highlight on the destination step. Preserve it under the same scope rules, or clear it on the next step when it has no continuing in-scope owner.
- Color each relevant index by the role of its local variable, regardless of how many indices are highlighted in the control: use `Orange` for the current main specific node, and `Yellow` for any additional specific node as needed. Use `Pink` for a previous node and path. For another role, choose a distinct CSS named color and keep that role-color mapping consistent.
- If multiple locals refer to the same index, render one border for that index. Resolve standard role-color collisions with this precedence: `Orange`, then `Yellow`, then `Pink`. If only custom role colors collide, choose one consistently.
- Recompute local-to-node mappings at every step. Keep a border while the same in-scope local continues to refer to that index, including pauses where the local is not directly used. Clear or move it only when the local changes its referenced index or leaves scope. Also carry an access that occurred between pauses into the destination step as described above.
- When a the current node highlighted `orange` moves to another neighbor in another step, the now previous node should be updated to highlighted `pink` and its arrow highlighted `orange`. 
- When that new neighbor moves to another neighbor in another step, the same process should repeat but the parents incoming arrow should change to highlight `pink`.  
- `pink` nodes and arrows should stay highlighted as long as they represent the full path from the start to current node, when they no longer represent the path their arrows should go back to their default color. 

## Tree placement

- Start at row 0 with the root centered horizontally within the graph container.
- Use large gaps between the root's children and progressively smaller gaps between children at deeper levels.
- Center each parent over the horizontal extent of its direct children when practical.
- Center the complete occupied tree bounds within the graph container, not merely the raw column grid.
- Reserve balanced left and right margins.
- Keep nodes and their `columnSpan` inside the configured column count.
- Avoid node overlap and edge crossings before optimizing compactness.

## Spacing by depth

- Give upper rows enough horizontal separation to contain their complete subtrees.
- Reduce sibling column spacing progressively on deeper rows because those subtrees are smaller.
- Base spacing on node width, label length, and available container width rather than using one fixed gap for every row.
- Keep row gaps large enough that arrows and arrowheads remain readable without making related levels feel disconnected.

## Validation

- Verify every edge references an existing child and parent, with `from` as the child and `to` as the parent; reject reversed relationships.
- Verify the child is below its parent.
- Verify every arrowhead appears at the child and points downward from the parent.
- Verify parent anchors match the child's left, center, or right position.
- Verify child anchors use `top` unless the child-parent center distance is greater than one resolved node width.
- Verify the root and occupied tree bounds are visually centered in the graph container.
- Verify deeper rows use equal or tighter horizontal spacing than their parent rows.
