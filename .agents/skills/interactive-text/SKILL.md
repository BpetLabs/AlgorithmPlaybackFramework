---
name: interactive-text
description: Create, edit, audit, or synchronize Play by Play narration, console output, and other text-control batches. Use when the requested work involves a text control, narration, output, or a directly coupled trace change.
---

# Interactive Text

Apply [interactive-generic](../interactive-generic/SKILL.md) first.

## Text batches

- Write each dynamic text message with `setValues` at index 0 and put its content in `input.value`.
- For new playbacks and trace changes, populate Play by Play with an introduction, narration at every execution pause, and a conclusion. Populate console and other text controls on the steps where their represented text exists.
- Preserve existing wording and formatting unless the user requests changes or a code or step change makes the text stale. Update stale text in the existing style.

## Play by Play

- Describe what the code does, not what the visualization displays.
- At each paused step, state relevant unpreviewed work completed since the preceding pause, then preview the pending effect of the current statement in future tense. A preview carries across the transition; do not restate that action as completed on the next step.
- When a step contains both unpreviewed completed work and a pending effect, separate them with `\n\n`. Do not use phrases such as "Pause before," "Paused at," or "The visualization shows."
- Include relevant unpaused control-flow effects between pauses, even when they leave a value unchanged.
- Keep each step concise and limited to actions relevant to that step.
- Preserve exact method names, variable names, coordinates, values, and language-specific capitalization from the code.
- Include `Command:` at the start of the first execution step when an execution input is provided; show the external invocation, not internal method calls.
- Keep introductory or concluding text separate from execution narration.
- The final conclusion text should read "Hope you learned something!"
- At step 0, describe what the code does, how it can be used, and not the specific execution input. For a coding problem, briefly describe the problem and include its time and space complexity in Big O notation.
- When a calculation completed or is pending at a paused step, show the full calculation there. On the next step, show only its result rather than repeating the calculation.

## Console output

- Treat each console-output call independently; display only the text emitted by that single call and never accumulate or retain earlier output.
- Do not show the new output while paused on the console-output statement because the paused statement has not executed yet.
- Show the emitted text on the immediate next step with `setValues` at index 0.
- On the following step, clear index 0 with `setValues` and `input.value: ""` so the output remains visible for only one post-execution step.

## Formatting

- Use sentence capitalization and correct punctuation. Start each paragraph after `\n\n` with a capital letter.
- Separate distinct code actions or ideas with the literal JSON escape sequence `\n\n`.
- For a message with five or fewer sentences, prefer `\n\n` between sentences.
- Within a multiline command, code block, or structured input, use a single `\n` for line breaks and `\n\n` between the command and surrounding prose.
- Do not use a single `\n` where a paragraph break is intended.
- Do not add `\n\n` merely to wrap one continuous sentence.
