---
name: interactive-stack
description: "Create, edit, audit, or synchronize stack-rendered stacks, call stacks, FIFO queues, or priority queues. Use when the requested work involves one of these controls, its runtime state, or a directly coupled trace change."
user-invocable: true
---

# Interactive Stack, Queue, and Priority Queue Rules

Use these rules when the requested work involves an AnimatedPlayback stack, call stack, FIFO queue, priority queue, or a directly coupled trace change. Populate its initial and runtime state and synchronize each in-scope mutation or call transition.

Before editing, apply [interactive-generic](../interactive-generic/SKILL.md) as the base skill. These rules extend it for stacks, queues, and priority queues.

## Choose the data-structure mode

- Stack: add and remove at the same visual top end.
- FIFO queue: add at the enqueue end and remove at the opposite dequeue end.
- Priority queue: keep entries visibly sorted by priority and mutate them by index.

Do not choose operations from the control's `type` alone. Determine the represented data structure and its visual orientation first.

## Head and tail placement

For the vertical stack renderer, index 0 and the head are at the bottom; the tail is at the top.

- Vertical stack: use `tailInserts` to push at the top and `tailTakes` to pop from the top.
- Vertical FIFO queue: use `tailInserts` to enqueue at the top and `headTakes` to dequeue from the bottom.

For a horizontal control, index 0 and the head are at the left; the tail is at the right.

- Horizontal FIFO queue: use `headInserts` to enqueue at the left and `tailDeletes` to dequeue from the right.
- For a horizontal stack, add and remove at whichever end is designated as the top. Use matching head operations for a left-side top or matching tail operations for a right-side top.

## Call-stack frames

When the stack represents a call stack:

- On a return pause that will pop a frame, add `**Return:** value` to that outgoing frame in the same pre-removal batch only when the method returns a value. Keep the return on its own final line and preserve tuple or structured return values accurately. Do not add a return line for `void` methods.
- Use the shared execution trace to determine what ran since the previous pause. For new playbacks and trace changes, check every pause. For a localized edit, check only the affected range plus its preceding and following state boundaries. If that code changed relevant local variables in a displayed frame, use `setValues` on that frame in the current batch so it reflects the destination pause state. This includes updating the resumed caller after a callee returns; target the caller's current logical index, not the outgoing callee.
- Include only arguments and local values relevant to understanding the active call and its return. Do not copy every in-scope variable into the frame.
- Format values as `name | value`. Put short, closely related values on one comma-separated line when space permits, such as `rob | 22, skip | 20`; use separate lines when grouping would reduce readability.
- Keep the same background color for a logical frame throughout its lifetime. When a frame corresponds to a node or item shown in another control, prefer that control's existing named color so the same entity is visually consistent across controls.

## Priority queues

- Use `inserts` with an explicit `index`; do not use `headInserts` or `tailInserts`.
- Use `takes` with an explicit `index`; do not use `deletes`.
- Maintain priority-queue order after every insertion.
- For a min-priority queue, sort priorities ascending and keep the minimum at index 0. Insert at the appropriate sorted index and take index 0.
- For a max-priority queue, sort priorities descending and keep the maximum at index 0. Insert at the appropriate sorted index and take index 0.
- Preserve insertion order among equal priorities unless the algorithm or API defines another tie-breaker.

## Animation timing

- Follow the base skill's pre-animation, completion-step, and `now` timing rules for the mutation selected above.
- When an insertion assigns a value, include its intended `backgroundColor` in the same input.

## Targeting nodes during mutations

- Apply the base skill's generic set, insert, and delete mutation model and its control-agnostic `current`/`outgoing`/`all` target model.
- Choose indexed, head, or tail addressing only after identifying the required mutation effect and logical position.

## Validation
- For a stack, verify last-in-first-out behavior at the same visual end.
- For a FIFO queue, verify additions and removals occur at opposite visual ends in first-in-first-out order.
- For a priority queue, verify every displayed state remains sorted in the configured min/max order, equal-priority ordering is correct, and every removal targets the highest-priority displayed entry.
- For a call stack, verify every non-void returning frame shows its pending `**Return:** value` and every void frame omits it; each displayed frame reflects relevant local-variable changes made by code executed since the previous pause; those changes use `setValues` on the current logical frame; frame text contains only relevant values in `name | value` form; and corresponding entities use consistent colors across controls.
- Verify no stale item borders remain after insertion highlighting ends.
