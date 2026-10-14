---
name: interactive-graph
description: "Create, edit, audit, or synchronize node items in nodeGraph JSON. Use when the requested work involves a nodeGraph, its traversal state, layout, or a directly coupled trace change."
---

# Interactive Graph Rules

Apply [interactive-generic](../interactive-generic/SKILL.md) first.

## Graph state

- For new playbacks and trace changes, populate nodes and edges and synchronize traversal state from the shared execution trace.
- Store displayed node content directly in `graphNodes[].value`. Every graph-node object that assigns `value` must assign `backgroundColor` in the same object. Use a unique background color for each node and prefer colors that remain legible with white text.

## Tree edge direction and anchors

For parent-child tree visualizations, store each edge from child to parent:

- `from`: child node ID
- `to`: parent node ID
- `arrow`: `"prev"`, which places the arrowhead at the child and draws the visual direction from parent to child

For non-tree graphs, preserve the graph's semantic edge direction instead of applying the child-to-parent convention.

### Parent anchor

Choose the parent's `toAnchor` from the child's horizontal position:

- Child left of parent: `"lowerLeft"`
- Child centered under parent: `"bottom"`
- Child right of parent: `"lowerRight"`

Treat a child as centered when its horizontal center matches the parent's horizontal center after accounting for `columnSpan`.

### Child anchor

Use the child's top-center unless a wide horizontal offset makes a corner anchor clearer:

- Default: `"fromAnchor": "top"`
- Child more than one node width left of its parent: `"fromAnchor": "upperRight"`
- Child more than one node width right of its parent: `"fromAnchor": "upperLeft"`

Measure the distance between node centers against one resolved node width. In grid units, use the larger of the child and parent `columnSpan` values, defaulting a missing span to 1. Use a corner anchor only when the distance is strictly greater than that width; equality uses `top`.

## Traversal highlights

- Use `Orange` for the primary current node. Use `Yellow` for a secondary current or focus node when another simultaneous active node is needed. If it represents a pending traversal, color its incoming edge `Yellow` too.
- Use `Pink` for each ancestor on the active path from the start node to the current node, including the edges connecting those ancestors. Do not use `Yellow` merely because the path contains multiple nodes.
- When traversal descends to a represented child, change the former current node and its incoming edge to `Pink`, then color the child and its incoming edge `Orange` on that destination step. On the following pause, change the child's incoming edge to `Pink` if it remains on the active path, even if the child remains current. The root has no incoming edge.
- When traversal enters a null or otherwise unrepresented child, there is no node or incoming edge to color `Orange`. Change the former current node and its incoming edge to `Pink` while that call or state is active. On return, restore the parent node to `Orange` while keeping its incoming edge `Pink`.
- When traversal returns from a represented child, clear the departed child's border and incoming edge color. Change the parent from `Pink` to `Orange`, keep its incoming edge `Pink`, and preserve earlier ancestors and their connecting edges as `Pink`.
- Resolve standard-role color collisions with this precedence: `Orange`, then `Yellow`, then `Pink`. If only custom role colors collide, choose one consistently.
- When a node or edge leaves the active path and has no other highlighted role, clear its `borderColor` or `color` in that step. Clear all remaining node borders and edge colors when traversal finishes.

## Tree layout

- Place the root at row 0 and center the occupied tree bounds within the graph container.
- Allocate horizontal space from subtree width, node width, label length, and available container width. Upper rows generally need wider sibling gaps than deeper rows.
- Center each parent over the horizontal extent of its direct children when practical.
- Keep every node and its `columnSpan` inside the configured column count. Do not alter relative positions merely to make an asymmetric tree appear balanced.
- Avoid node overlap and edge crossings before optimizing compactness.
- Keep row gaps large enough for readable arrows and arrowheads without visually disconnecting related levels.
