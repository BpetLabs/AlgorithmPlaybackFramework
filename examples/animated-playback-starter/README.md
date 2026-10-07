# Animated Playback Starter

A copyable React application for authoring an AnimatedPlayback with AlgorithmPlaybackFramework.

## Start

Copy this entire folder so the included `.agents/skills` remain available, then open the copied folder as your coding-agent workspace.

```sh
npm install
npm run dev
```

Edit `src/playback.json` directly or ask your coding agent.

The agent instructions select the generic animation skill plus the specialized skills required by the controls in the playback.

The starter reserves fixed regions for code, Play by Play narration, local variables, and playback navigation. Their controls begin empty. Replace their content in `src/playback.json` and adjust their base size or position in `controlLayouts` in `src/AnimatedPlaybackPage.tsx`.

The empty `visualizationArea` between the slider and lower panels is reserved for algorithm-specific arrays, stacks, grids, graphs, call stacks, console output, or other controls.

The page uses a fixed 1280 × 768 canvas. It does not grow or shrink with the viewport. On narrower screens, the canvas remains at its configured size and the page provides horizontal scrolling.

See [CONTROLS.md](./CONTROLS.md) for the available control types, their behavior, and the conventions used by the authoring skills.

## Integrate an existing React application

Copy `src/AnimatedPlaybackPage.tsx` and `src/playback.json` into the application, then install the runtime dependencies:

```sh
npm install algorithm-playback-framework framer-motion
```

`src/main.tsx` imports two stylesheets:

- `algorithm-playback-framework/styles.css` provides required control structure and the default framework theme.
- `./styles.css` styles only this example page and can be replaced or removed.

Every supported framework theme variable and its default are declared in the themed sections near the top of `algorithm-playback-framework/styles.css`.

The sample stores base control layouts in `controlLayouts` in `src/AnimatedPlaybackPage.tsx`. Playback JSON can optionally use `render.layout` for intentional step-specific layout changes.
