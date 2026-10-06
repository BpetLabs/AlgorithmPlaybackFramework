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

Import `algorithm-playback-framework/styles.css` once in the application entry point. The starter does this in `src/main.tsx`.

Framework defaults can be customized from a page or application stylesheet:

```css
.playback-page {
  --apf-control-background: #fff;
  --apf-text-color: #111827;
  --apf-border-color: #d1d5db;
  --apf-button-background: #2563eb;
  --apf-border-radius: 0.5rem;
}
```

The sample stores control layout in `playback.json`. Change each control's `render.layout` values to position it on the canvas.
