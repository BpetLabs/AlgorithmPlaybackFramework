---
name: interactive-text
description: Create, edit, audit, or synchronize Play by Play narration, console output, and other text-control batches. Use when the requested work involves a text control, narration, output, or a directly coupled trace change.
---

# Interactive Text

Apply these rules whenever an in-scope AnimatedPlayback control is a text control, unless the user requests different wording. For new playbacks and trace changes, populate Play by Play at the introduction, every execution pause, and the conclusion. For localized edits, update only the affected messages and adjacent continuity checks. Populate console or other text controls at the steps where their represented text exists.

Before editing, apply [interactive-generic](../interactive-generic/SKILL.md) as the base skill. These rules extend it for Play by Play, console output, and other text controls.

## Content

- Do not change existing text descriptions or formatting unless asked and instead recommend changes, however do change text that aligns with code or step changes without asking, try to match the same style to existing text.
- Describe what the code does, not what the visualization displays.
- At each paused execution step, preview the pending effect of the current paused statement. Describe relevant operations completed since the previous pause only when they were not already previewed by the preceding narration.
- Do not restate a completed operation when the previous step already explained what that operation would do; treat that preview as carrying the operation across the transition.
- State unpreviewed completed operations directly. Describe the current paused statement in future tense, such as "will become" or "will add," because it has not executed yet.
- When a step contains both unpreviewed completed work and a pending effect, separate them with `\n\n`. Do not use phrases such as "Pause before," "Paused at," or "The visualization shows."
- Include relevant unpaused control-flow effects between pauses, even when they leave a value unchanged.
- Keep each step concise and limited to actions relevant to that step.
- Preserve exact method names, variable names, coordinates, values, and language-specific capitalization from the code.
- Include `Command:` at the start of the first execution step when an execution input is provided; show the external invocation, not internal method calls.
- Keep introductory or concluding text separate from execution narration.
- When there are 5 or less sentences prefer multi line \n\n breaks between sentences.
- The final conclusion text should read "Hope you learned something!"
- Introduction step at step 0 should describe what the code does, and not the specific input, and how it could be used. If it is a coding problem, it should very briefly describe the problem being solved and include its time and space complexity in Big O notation.
- Every input uses 'setValues' at input 0.

## Console output

- Treat each console-output call independently; display only the text emitted by that single call and never accumulate or retain earlier output.
- Do not show the new output while paused on the console-output statement because the paused statement has not executed yet.
- Show the emitted text on the immediate next step with `setValues` at index 0.
- Clear index 0 on the following step so the output is visible for only one post-execution step and cannot persist into another call.

## Formatting

- Use sentence capitalization and correct punctuation.
- Separate distinct code actions or ideas with the literal JSON escape sequence `\n\n`.
- Within a multiline command, code block, or structured input, use a single `\n` for line breaks and `\n\n` between the command and surrounding prose.
- Do not use a single `\n` where a paragraph break is intended.
- Do not add `\n\n` merely to wrap one continuous sentence.
- Start each paragraph after `\n\n` with a capital letter.

## Validation
- Verify every in-scope text control is populated at each selected step where its represented narration or output exists. Reject unexplained empty Play by Play, console, or other text scaffolds within that scope.
- For new playbacks and trace changes, validate every message against the shared execution trace. For a localized edit, validate only the affected messages plus the preceding and following messages needed to detect duplicated or omitted narration.
- Verify an operation previewed on one step is not redundantly restated as completed on the next step.
- Verify relevant unpaused control-flow effects between pauses are not omitted merely because they do not mutate a value.
- Verify that every console output is absent on its statement pause, appears only on the immediate next step, and is cleared on the step after that.
- Verify that console output never stacks or carries text from an earlier call.
- Verify that commands and identifiers match the selected language.
- Check every multi-action message for `\n\n` paragraph separation.
- Check capitalization, punctuation, and accidental duplicate punctuation.
