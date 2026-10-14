---
name: interactive-array
description: "Create, edit, audit, or synchronize array and jagged-array/matrix controls in AnimatedPlayback JSON. Use when the requested work involves an array or matrix control, its trace, or a directly coupled state change."
user-invocable: true
---

# Interactive Array and Matrix Rules

Apply [interactive-generic](../interactive-generic/SKILL.md) first.

## Values and mutations

- Only leaf `array` controls in a jagged tree contain values. Jagged parents contain ordered child IDs in `children` and retain their container and child-slot borders. Parent set actions may change child-slot appearance such as `borderColor`, but must not set displayed values or replace `childId`. Render a parent-slot border on the referenced child's renderer frame rather than as an inset overlay.
- Insert a jagged-parent child with `childId` and `now: true`. Delete one by index with `now: true`; deletion detaches the referenced subtree.
- Every inserted jagged subtree branch must terminate in a declared leaf array. Represent an empty row or column with `initialItemCount: 0` on its leaf.

## Value colors

- Every action that assigns a node value must include `backgroundColor` in the same input. Use `Teal` unless the user requests another color or the value's state defines one.
- For Boolean values, use `Red` for false and `Green` for true.

## Index highlights

- Color borders by local role: `Orange` for a looping index, `Pink` for a specific index, and `Yellow` for a trailing index. Choose a distinct CSS named color for another role and keep the mapping consistent.
- Resolve standard-role color collisions in this order: `Orange`, `Pink`, then `Yellow`. If only custom colors collide, choose one consistently.
- Highlight one item for each explicit access path. Highlight the leaf for a leaf access, or the parent slot for a child-array access. Multiple access paths may highlight multiple items. Never highlight a parent merely to reach a leaf.
- Render each highlighted parent slot on the referenced child's renderer frame, using the same active-reference color unless another active reference has higher color precedence.
- When a paused `updates` mutation affects a highlighted index, set the current node's `borderColor` with `setValues` in the same batch. Keep `borderColor` out of `updates.input` so the incoming animated node remains unhighlighted. In the completion batch, clear the displaced node with `setValues` at the same index, `target: "outgoing"`, and `borderColor: ""`.
- When consecutive paused updates move a local, clear the previous current index and set the new current index in the next batch. Address the prior replacement's displaced node separately with `target: "outgoing"`.
- For a matrix, apply the same rules to the affected parent slot and leaf cell at their corresponding indices.
