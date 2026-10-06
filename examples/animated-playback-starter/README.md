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

## Integrate an existing React application

Copy `src/AnimatedPlaybackPage.tsx` and `src/playback.json` into the application, then install the runtime dependencies:

```sh
npm install algorithm-playback-framework framer-motion
```

`src/main.tsx` imports two stylesheets:

- `algorithm-playback-framework/styles.css` provides required control structure and the default framework theme.
- `./styles.css` styles only this example page and can be replaced or removed.

Every supported framework theme variable and its default are declared in the themed sections near the top of `algorithm-playback-framework/styles.css`.

The sample stores control layout in `playback.json`. Change each control's `render.layout` values to position it on the canvas.
