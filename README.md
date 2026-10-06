# AlgorithmPlaybackFramework

A React framework for building step-by-step algorithm visualizations over code text with animated arrays, stacks, grids, graphs, state history, and playback controls.

## Library usage

The package exposes its public API from the package root:

```tsx
import {
  InteractiveControlRenderer,
  loadControls,
  useControlManager,
} from "algorithm-playback-framework";
```

React, React DOM, and Framer Motion are peer dependencies and remain external to the distributed bundle.

## Development

Requires Node.js 20 or later.

```sh
npm install
npm run check
```

`npm run check` runs strict TypeScript checking, the Vitest suite, and the ESM/CommonJS library build. Build artifacts and declarations are written to `dist`.
