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

The framework stylesheet provides usable defaults. Set `--apf-*` variables on any ancestor of the playback to customize them:

```css
.my-playback {
  --apf-text-color: #111827;
  --apf-secondary-text-color: #374151;
  --apf-muted-text-color: #6b7280;
  --apf-control-background: #fff;
  --apf-border-color: #d1d5db;
  --apf-grid-border-color: #d1d5db;
  --apf-divider-color: #e5e7eb;
  --apf-button-background: #2563eb;
  --apf-border-radius: 0.5rem;
}
```

Additional sizing variables are `--apf-border-width`, `--apf-font-mono`, `--apf-font-size-xs`, `--apf-line-height-xs`, `--apf-font-size-sm`, `--apf-line-height-sm`, `--apf-slider-gap`, `--apf-slider-width`, and `--apf-slider-max-width`.

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
