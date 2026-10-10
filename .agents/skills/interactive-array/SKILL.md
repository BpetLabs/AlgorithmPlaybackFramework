---
name: interactive-array
description: "Create, populate, edit, audit, or synchronize array and jagged-array/matrix controls in AnimatedPlayback JSON, including initialization, mutations, node colors, and affected-index borders. Use whenever a playback contains an array or matrix control.
user-invocable: true
---

# Interactive Array and Matrix Rules

Use these rules whenever an AnimatedPlayback contains an `array` or `jaggedArray` control, including new playback authoring and trace changes. Populate the control with the relevant input and runtime state. Preserve the user's explicit animation and color choices when they differ from these defaults.

Before editing, apply [interactive-generic](../interactive-generic/SKILL.md) as the base skill. These rules extend it for arrays and matrices.

## Values and mutations

- Initialize node values with `setValues`, not `updates`.
- Array and matrix nodes may have renderer defaults. When the plan is to preserve a node's default, omit that node from initialization entirely: do not add a `setValues` entry for its value, color, border, or any other property. Use `setValues` only for nodes whose initial state must differ from the default.
- Set initial values when the array is initialized or in the step where a hidden array becomes visible.
- Use `updates`, `inserts`, or `deletes` for array mutations. Follow the base skill's pre-animation, completion-step, and `now` timing rules.
- Preserve update payloads, including the incoming item value needed to render the replacement transition.

## Node colors and borders

- Every action that assigns a node value must include a `backgroundColor` in the same input, whether the action initializes the node or changes it later. Use `Teal` by default unless the user requests another color or the value's state has a defined color.
- When a paused `updates` mutation affects a highlighted index, apply that index's `borderColor` with `setValues` in the same batch. Do not put `borderColor` in `updates.input`: the stationary array node should own the border while the incoming animated node remains unhighlighted.
- The same-batch stationary highlight addresses the current node. After the update completes, clear the displaced animated node in the next batch with `setValues` at the same index, `target: "outgoing"`, and `borderColor: ""`.
- When consecutive paused updates move a local to another index, clear the previous current index and set the new current index's border with `setValues` in the next batch. Handle the prior replacement's displaced visual node separately with `target: "outgoing"`. Keep `updates.input` limited to the incoming value, background color, and any non-border presentation properties.
- Leave default-backed nodes untouched only while their defaults are preserved. The first action that assigns them a value must also assign their background color.
- An index is relevant when a distinct in-scope local variable refers to it. Preserve that highlight across pauses until the local moves to another index or leaves scope; a pause whose statement does not reference the local does not end the highlight. A local variable may identify at most one highlighted index in a control at a time.
- If an array or matrix index is accessed during unpaused execution between two pauses, show that access highlight on the destination step. Preserve it under the same scope rules, or clear it on the next step when it has no continuing in-scope owner.
- Color each relevant index by the role of its local variable, regardless of how many indices are highlighted in the control: use `Orange` for a looping index, `Pink` for a specific index, and `Yellow` for a trailing index. For another role, choose a distinct CSS named color and keep that role-color mapping consistent.
- If multiple locals refer to the same index, render one border for that index. Resolve standard role-color collisions with this precedence: `Orange`, then `Pink`, then `Yellow`. If only custom role colors collide, choose one consistently.
- Recompute local-to-index mappings at every step. Keep a border while the same in-scope local continues to refer to that index, including pauses where the local is not directly used. Clear or move it only when the local changes its referenced index or leaves scope. Also carry an access that occurred between pauses into the destination step as described above.
- For a matrix, apply these rules to the affected row or cell controls at the corresponding indices for the parent and the child.
- If any array stores boolean values use `Red` for false and `Green` for true.

## Validation

- Verify each declared array or matrix contains the relevant input or runtime values and stays synchronized with the trace.
- Verify explicit initialization uses `setValues`, while default-backed nodes have no initialization action. Verify paused value replacements use `updates`, while already-completed value replacements use `setValues`.
- Verify every value-setting action includes the intended background color. Verify default-backed nodes remain untouched until an action assigns them a value and color together.
- For a highlighted paused update, verify the stationary array index owns the border through `setValues`, the incoming `updates.input` has no `borderColor`, and the next batch clears the displaced node with `target: "outgoing"`. Across consecutive updates, verify current-index highlights move separately and the replacement/current node is cleared only when its own logical highlight ends.
- Verify every persistent border maps to an in-scope local-variable reference, no local maps to more than one index in the same control, colors match local roles, shared-index colors follow precedence, between-pause accesses appear on the destination step, and mappings clear or move only when their local changes index or leaves scope.
