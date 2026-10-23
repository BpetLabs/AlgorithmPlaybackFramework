---
name: interactive-stack
description: "Create, edit, audit, or synchronize stack-rendered stacks, call stacks, FIFO queues, or priority queues. Use when the requested work involves one of these controls, its runtime state, or a directly coupled trace change."
user-invocable: true
---

# Interactive Stack, Queue, and Priority Queue Rules

Apply [interactive-generic](../interactive-generic/SKILL.md) first.

## Choose the data-structure mode

Determine the represented data structure and its visual orientation; do not choose operations from the control's `type` alone.

- Stack: add and remove at the same visual top end.
- FIFO queue: add at the enqueue end and remove at the opposite dequeue end.
- Priority queue: keep entries visibly sorted by priority and mutate them by index.

## Head and tail placement

The stack renderer is vertical and defaults to bottom-up. Set `reverseDirection: true` to render it top-down. Logical indices remain zero-based and unchanged.

- With `bottom-up`, index 0 and the head are at the bottom; the tail is at the top.
- With `top-down`, index 0 and the head are at the top; the tail is at the bottom.

- Vertical stack: use `tailInserts` to push at the tail and `tailTakes` to pop from the tail.
- Vertical FIFO queue: use `tailInserts` to enqueue at the tail and `headTakes` to dequeue from the head.

For a horizontal control, index 0 and the head are at the left; the tail is at the right.

- Horizontal FIFO queue: use `headInserts` to enqueue at the left and `tailDeletes` to dequeue from the right.
- Horizontal stacks are unsupported; use an array for a horizontal linear control.

## Call-stack frames

When the stack represents a call stack:

- Highlight the current active frame with an `Orange` border.
- On a return pause that will pop a frame, add `**Return:** value` to that outgoing frame in the same pre-removal batch only when the method returns a value. Keep the return on its own final line and preserve tuple or structured return values accurately. Do not add a return line for `void` methods.
- When the temporary return line needs more vertical space, increase that frame's `itemOffset` in the same pre-removal batch by only the amount required to fit the complete value. Keep the larger offset while the outgoing frame remains visible; the slot returns to its normal resolved size after removal completes.
- Include method names only when two or more distinct methods can appear on the logical stack at the same time.
- At each destination pause, use `setValues` to update relevant displayed frame variables changed since the preceding pause. After a callee returns, update the resumed caller at its current logical index, not the outgoing callee.
- Before authoring frames for a represented method, choose the smallest ordered property schema that distinguishes simultaneous calls and explains their next action or return. Do not copy every in-scope variable into the frame.
- Omit invocation-wide arguments that remain constant across every recursive frame when the command, narration, or another control already establishes them. Keep an invariant argument only when a frame would otherwise be ambiguous or its control flow could not be understood.
- Every frame for the same represented method must use the same property names in the same order. When a selected property has not received its value yet, display the literal value `_pending`. The temporary `**Return:**` annotation is not part of this shared schema.
- Format properties as `name | value`. Put short, closely related properties on one comma-separated line when space permits; otherwise use separate lines.
- Keep the same background color for a logical frame throughout its lifetime. When a frame corresponds to a node or item shown in another control, prefer that control's existing named color so the same entity is visually consistent across controls.

## Priority queues

- Use `inserts` with an explicit `index`; do not use `headInserts` or `tailInserts`.
- Use `takes` with an explicit `index`; do not use `deletes`.
- Maintain priority-queue order after every insertion.
- For a min-priority queue, sort priorities ascending and keep the minimum at index 0. Insert at the appropriate sorted index and take index 0.
- For a max-priority queue, sort priorities descending and keep the maximum at index 0. Insert at the appropriate sorted index and take index 0.
- Preserve insertion order among equal priorities unless the algorithm or API defines another tie-breaker.
