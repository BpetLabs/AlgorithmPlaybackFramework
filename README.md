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
import "algorithm-playback-framework/styles.css";
```

React, React DOM, and Framer Motion are peer dependencies and remain external to the distributed bundle.

### Styling

Import the framework stylesheet once. It contains the structural styles and the default theme required by the controls:

```tsx
import "algorithm-playback-framework/styles.css";
```

No additional CSS is required. Every supported theme variable begins with `--apf-`. Their defaults are declared in the themed sections near the top of `algorithm-playback-framework/styles.css`, which is the source of truth for the customization API. Other selectors in that file are framework implementation details.

Playback JSON may use semantic aliases such as `"Highlight.Pause"`. `loadControls` resolves those aliases to the corresponding theme variables automatically.

## Starter

The [Animated Playback starter](examples/animated-playback-starter) is a copyable React application containing a sample playback and agent skills for authoring playback JSON.

## Development

Requires Node.js 20 or later.

```sh
npm install
npm run check
npm run test:coverage
```

`npm run check` runs strict TypeScript checking, the Vitest suite, and the ESM/CommonJS library build. `npm run test:coverage` writes an HTML coverage report to `coverage`. Build artifacts and declarations are written to `dist`.
