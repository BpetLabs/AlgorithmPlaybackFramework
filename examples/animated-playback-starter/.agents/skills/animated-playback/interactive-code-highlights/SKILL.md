---
name: interactive-code-highlights
description: "Create or edit code-highlight batches in interactive debugger JSON, including pause-to-pause execution, conditionals, loops, calls, returns, method borders, and cleanup."
---

# Interactive Code Highlights

Use this skill when updating the code-highlight section of interactive debugger JSON.

Before editing, read and apply [interactive-generic](../interactive-generic/SKILL.md) as the base skill. These rules extend it for code highlights.

## Governing rule

- Treat the execution path from the previous pause to the current pause as authoritative. What ran during the current transition always wins.
- Derive the complete semantic frame from the current transition before considering the previously rendered frame.
- Use prior rendered state only to emit minimal JSON actions. Never let a stale background determine current semantics.
- Recalculate explicitly allowed persistent context, including represented calls, method borders, recursive activation state, and active switch structure, at the current pause.

## Background meanings

- Clear: a line executed, was evaluated, or was structurally traversed during the current transition and has no stronger current semantic state.
- Highlight.Pause: the current paused statement. It has not executed yet and wins over every other background.
- Highlight.Branch: a visible call site whose represented child method is active.
- Highlight.Return: an explicit return statement that executed during the transition.
- Highlight.ReturnLocation: the visible call site where execution resumed after a represented child method returned.
- Highlight.False: only the executable interior of a conditional branch, arm, or loop body skipped because its condition evaluated false during the current transition.
- Highlight.Unused: a line in a relevant visible method scope that did not participate in the current transition and has no current persistent semantic state. This includes blank or whitespace-only lines when control flow did not cross them.

Do not assign more than one background to a line. Use its latest applicable event in the transition, followed by current call-stack semantics.

## Construct each frame

1. Identify the previous and current pauses. Advancing executes the previously paused statement.
   - In the destination frame, every line of that previously paused statement is Clear because it executed, unless the same source line later receives a stronger state during the transition. Leaving its loop, branch, method, or scope does not make the executed statement Unused.
2. Replay the exact dynamic path in order, including repeated source lines, loop back edges, recursive activations, calls, returns, conditions, and structural transfers.
3. Record, per visible line and activation:
   - executed, evaluated, or structurally traversed;
   - skipped conditional body;
   - current Pause, Branch, Return, or ReturnLocation;
   - untouched in the relevant visible scope.
4. If one source line receives multiple events during the transition, use its latest event. Then apply current persistent call-stack and switch-structure semantics, followed by Pause priority.
5. Classify every remaining untouched line in relevant bordered scopes as Highlight.Unused, including blank or whitespace-only lines. A blank line is Clear only when control flow structurally crossed it during the current transition, or receives a stronger state when another rule explicitly applies.
6. Compare the completed semantic frame with the prior rendered frame and emit only the required changes.

Never infer execution from lexical position. A line above or below the pause can be Clear, False, Unused, or a call/return semantic based only on the replayed path.

## Color rules
- Prefer CSS named colors over hexadecimal, RGB, RGBA, HSL, or HSLA values unless the Highlight enum colors are explicitly specified.

## When to pause
- Use the pause statements supplied by the user.
- When creating or changing pause locations and the user has not specified them, ask which statements should pause.
- If the total pause steps would be over 50, immediately stop processing and inform user of total pauses that would implemented and ask the user for permission. Do not do this if the total existing pause steps do not change or reduces even if over 50.
- Preserve existing pause locations unless the user requests changes.

## Conditional structure and skipped bodies

- Keep a condition or structural header Clear when it participates in control flow during the transition.
- When a branch is not taken, mark only its executable body interior Highlight.False.
- Keep the skipped branch's condition/header and structurally traversed closing brace Clear.
- Include blank lines and comments inside a skipped body in Highlight.False. Exclude its header and closing brace.
- Keep an entire compound structural line such as `} else if (...) {` Clear when control traverses it.
- If execution pauses inside a selected body before later arms are skipped, keep those later untouched arms Highlight.Unused.
- When the selected body completes and control transfers past later arms during the transition, keep their headers and closing structure Clear and mark their skipped body interiors Highlight.False.
- If a conditional arm is not reached or structurally skipped during the current transition, keep it Highlight.Unused.
- For a ternary expression, mark only the unchosen expression arm Highlight.False.
- If multiple statements exist in a single line even if only one executed the entire line should be clear.

### Switch statements

- Once a represented switch activation evaluates `switch (...)`, keep that line Clear through the frame that exits the switch.
- Keep every `case` or `default` label traversed while selecting or leaving an arm Clear through that switch activation's completion frame.
- Mark only skipped case-body statements, including their `break`, Highlight.False.
- Keep the structurally traversed switch closing brace Clear.
- Before a case label participates in the active switch selection, keep that label and its body Highlight.Unused.

## Calls and returns
- While a represented child call is active, mark its visible parent call line as Highlight.Branch. A method call is represented only when its implementation appears in the provided code and its child frame is animated. Never infer or visualize a hidden implementation with Highlight.Branch.
- On method entry, begin the callee portion of the path at the method's first visible line while preserving the caller location with Highlight.Branch. Apply the same rule to recursive activations; do not reset the shared source range.
- A visible method that begins and finishes between pauses may receive a Pink border without receiving Branch or ReturnLocation. Those call-site highlights require an animated child frame that remains represented across a pause.
- When execution returns from a represented child-method frame, replace that child method's visible caller call-site highlight with Highlight.ReturnLocation; do not leave it as Highlight.Branch or Highlight.Pause. A paused call whose implementation is not present in the provided code—including built-in, library, external, and omitted helper calls—clears like an ordinary statement after it executes and receives neither Highlight.Branch nor Highlight.ReturnLocation.
- On a return frame, classify caller lines around Highlight.ReturnLocation from the actual dynamic path. Lines not reached between pauses may remain Highlight.Unused even when they are lexically above the return location.
- When recursive activations share one source range, apply each line's latest relevant dynamic event. The current Pause and active activation take precedence over nonactive activations.

## Loops and repeated execution

- When a loop condition evaluates false, keep the evaluated condition/header and exit structure Clear, and mark the skipped executable body interior Highlight.False unless its coming from a pause inside the loop. Leave the condition/header itself Clear.
- Track each loop activation independently and determine whether the pause-to-pause path crossed that loop's back edge.
- Without a back-edge crossing, execution remains in the current iteration. Earlier and unreached loop code becomes or remains Highlight.Unused when it did not participate in the current transition.
- A back edge starts another iteration within the same method activation. Pre-loop setup becomes or remains Highlight.Unused, and only loop lines reached during the wrap lose Highlight.Unused; never reset the entire loop body.
- Replay events across a back edge in order. Retain each earlier event until a later event for the same source line replaces it, so a skipped body may remain False across the wrap. If the back edge reaches the same paused line, that line remains Pause.
- Keep evaluated loop headers, increments, and traversed braces Clear.
- If a transition starts from a pause inside a loop and then exits the loop, keep the evaluated loop condition and exit structure Clear; earlier and unreached loop code becomes or remains Highlight.Unused when it did not participate in the current transition. 
- For nested loops, replay every inner exit, inner back edge, and outer back edge in execution order.

### Loop-exit frame audit

For every transition that exits a loop, explicitly partition the loop and the path after it before generating the JSON diff:

1. Lines executed before the exit, including the previously paused statement, are Clear unless a later event gives them a stronger state.
2. The loop update, evaluated condition/header, exit structure, and lines traversed on the way to the next pause are Clear.
3. Loop-body lines not reached during this transition are Highlight.Unused, even if they were Clear because they ran in the previous iteration.
4. A transition that starts inside the loop body and then fails the next loop condition does not mark the unentered body Highlight.False; use Highlight.Unused as specified above.

Compare this complete destination frame with the prior frame only after all four groups are classified. In particular, check both directions of the state change: previously Clear body lines may need to become Unused, while previously Unused exit lines may need to become Clear.

## Borders and cleanup
- Use Orange for the method containing the current pause.
- Use Pink for a nonactive method whose complete implementation is visible and which either remains as suspended caller context or ran between pauses. Pink does not require the method to contain an internal pause or qualify for Branch and ReturnLocation.
- If recursive activations share one method range, Orange takes precedence over Pink.
- Borders should cover the full method body, including the signature and final brace.
- Step 0 should have "scrollBottom": 0.
- Keep the current `Highlight.Pause` statement within a stable viewport safe band when possible, with at least 18 visible lines above it and 18 visible lines below it.
- Determine the number of visible code lines from the page's code-control height and the static-text renderer's line height. Treat `scrollBottom: 0` as the initial top-aligned viewport.
- Preserve the current scroll target while the complete paused statement remains inside the safe band.
- When the pause crosses the top boundary, scroll upward only enough to restore 18 lines above it. When it crosses the bottom boundary, scroll downward only enough to restore 18 lines below it.
- Clamp the target to the available code range. Near the beginning or end of the code, allow fewer context lines when the requested margin is impossible.
- Emit `scrollBottom` only when the resolved target changes. Do not alternate scroll merely because consecutive pauses move within the safe band.
- Clear borders and highlights when a method range no longer qualifies for the current state.
- Compute the desired final background of every affected line before emitting actions. If its current state already matches, emit no action.
- When changing one background highlight directly to another, set the new highlight without clearing the old one first. Use clearHighlights only when the desired final background is Clear.
- Use clearHighlights only when a background or border truly needs to disappear.
- To clear both background and border, use a range-only clear object such as { "range": "..." }.
- To clear only background, use { "backgroundColor": true, "range": "..." }.
- To clear only border, use { "borderColor": true, "range": "..." }.
- Combine same-type highlight actions with comma-separated ranges.
- End with one final step that clears all values and sets "scrollBottom": 0.
- Ensure there are no unnecessary no-op or duplicate actions, including redundant `scrollBottom` values.

## Validation

- List the ordered dynamic events between every adjacent pair of pauses before reviewing ranges.
- Verify current-step executed, evaluated, and structurally traversed lines are Clear unless a stronger current semantic applies.
- For every transition, verify the complete previous `Highlight.Pause` range became Clear after execution unless a later event on the same source line gives it a stronger state. In particular, never change the previous pause to Highlight.Unused merely because execution exited its loop, branch, method, or scope.
- Verify conditional headers, switch headers, case labels, compound `} else if` lines, and traversed closing braces are Clear when their rules say they participated.
- Verify only skipped executable body interiors are False.
- Verify untouched lines are Unused and no stale False or Clear state leaked from the prior frame.
- Replay every frame against `staticValue`. For each blank or whitespace-only source line, verify it is Clear when control flow structurally crossed it and Highlight.Unused when it was untouched in the relevant scope; do not classify it from blankness alone. Recheck this participation mapping after source-line contraction or reorganization.
- Verify repeated source lines use the latest event from the current transition.
- Verify each frame has at most one Pause and each line has at most one background.
- For every loop exit, verify the full loop body—not only the old pause and closing brace—against the loop-exit frame audit. Confirm that previously Clear but now unreached body lines become Unused and that every traversed exit line becomes Clear.
- Verify represented calls and returns use Branch and ReturnLocation only with visible child frames.
- Verify explicit returns alone use Return.
- Verify every loop back edge and nested-loop exit is replayed independently.
- Verify Orange and Pink borders, backgrounds inside bordered scopes, pause-aware scroll targets, final cleanup, compact ranges, valid JSON, formatting, and absence of no-op actions.

## Reference example
- Use [dfspermutationsswap.json](../../../app/interactivecode/data/csharp/dfs/dfspermutationsswap.json),[khansort.json](../../../app/interactivecode/data/csharp/queue/khansort.json) and [calculator.json](../../../app/interactivecode/data/csharp/stack/calculator.json) as an illustrative reference for stateful batches, recursion, represented calls, and method borders. Recompute every highlight range from the generic rules above; the example never overrides them and its ranges must not be copied mechanically.
