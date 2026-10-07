# AnimatedPlayback authoring

- Edit `src/playback.json` to create or revise the animation.
- Keep `src/AnimatedPlaybackPage.tsx` unchanged unless the requested work affects page integration or presentation.
- Always apply `interactive-generic` when editing playback JSON.
- Also apply each specialized skill matching the controls being edited.
- Treat `code` (`staticText`) as source code, `playbyplay` (`text`) as Play by Play narration, and `locals` (`dictionary`) as local variables.
- Place algorithm-specific controls inside `visualizationArea`. Add optional call-stack or console controls there when the playback needs them.
- Keep base control sizes and positions in `controlLayouts` in `src/AnimatedPlaybackPage.tsx`. Use JSON `render.layout` only when the animation intentionally changes layout at a playback step.

- Preserve unrelated controls, steps, formatting, and user-authored wording.
- Run `npm run build` after making changes.
