---
name: interactive-array
description: "Create, edit, audit, or synchronize array and jagged-array/matrix controls in AnimatedPlayback JSON. Use when the requested work involves an array or matrix control, its trace, or a directly coupled state change."
user-invocable: true
---

# Interactive Array and Matrix Rules

Apply [interactive-generic](../interactive-generic/SKILL.md) first.

## Shared value colors

- Every action that assigns a node value must include `backgroundColor` in the same input. Use `Teal` unless the user requests another color or the value's state defines one.
- For Boolean values, use `Red` for false and `Green` for true.

## Standalone arrays

### Values and mutations

- Store displayed values directly in the array's items.
- Follow the generic mutation timing for staged inserts, updates, deletes, and takes.

## Jagged arrays

### Containers and children

- Treat each `jaggedArray` as a structural container whose items reference child controls. Displayed values belong to leaf arrays.
- Every `jaggedArray` must declare `children`, containing its initially attached child IDs in order. Use `children: []` for an empty root.
- Controls cannot be created dynamically. Predeclare every potential child and its complete subtree in the controls list.
- To attach a predeclared child during playback, insert its `childId` into the parent. Inserting a `jaggedArray` child attaches its complete subtree.
- Deleting the parent's child entry detaches that complete subtree.
- A `jaggedArray` container does not support `updates`. Replace a child by deleting the existing subtree and inserting the replacement.
- Set actions on a `jaggedArray` item may change presentation properties, such as `borderColor`, for the child container referenced at that index. They must not assign displayed values or change `childId`.
- Every non-root jagged subtree must ultimately contain at least one declared leaf `array`.

### Leaf arrays

- Treat an `array` inside a jagged tree as a value-bearing leaf. An empty leaf may omit `initialItemCount` or set it to `0`.
- Leaf arrays may use immediate updates, inserts, deletes, and takes.

### Mutation timing

- Every mutation action on a container or leaf within a jagged tree requires `now: true`; `animateNow` is unsupported.
- When a paused statement performs a mutation, apply it on the following global step. The paused step must retain the pre-execution state.

## Highlights for standalone and jagged arrays

### Index colors

- Color borders by local role: `Orange` for a looping index, `Pink` for a specific index, and `Yellow` for a trailing index. Choose a distinct CSS named color for another role and keep the mapping consistent.
- Resolve standard-role color collisions in this order: `Orange`, `Pink`, then `Yellow`. If only custom colors collide, choose one consistently.

### Index highlights

- Apply these rules to standalone arrays, jagged containers, and leaf arrays inside jagged trees.
- Highlight one item for each explicit access path. In a standalone array, highlight the addressed item. In a jagged tree, highlight a leaf item for a value access or the referenced child container for a child-array access. Multiple access paths may highlight multiple items. Never highlight an ancestor merely to reach a leaf.
- Render a child-container highlight around that child's renderer frame, using the same active-reference color unless another active reference has higher color precedence.
- For a matrix, apply the corresponding roles independently to the referenced child container and leaf item.

### Update highlights

- Apply these rules to standalone arrays and leaf arrays inside jagged trees.
- For a staged paused update, set the existing current node's `borderColor` with `setValues` in the same batch. Keep `borderColor` out of `updates.input` so the incoming animated node remains unhighlighted. In the completion batch, clear the displaced node with `setValues` at the same index, `target: "outgoing"`, and `borderColor: ""`.
- For an immediate update in a jagged leaf, apply the update on the following global step with `now: true`. If an active reference continues to identify the replacement, include its `borderColor` in `updates.input`; otherwise omit it. No outgoing-node cleanup batch is required.
- When consecutive staged updates move a local, clear the previous current index and set the new current index in the next batch. Address the prior replacement's displaced node separately with `target: "outgoing"`.
- When consecutive immediate updates in a jagged leaf move a local, clear the previous current index with `setValues` and include the destination `borderColor` in `updates.input` on the following global step.
