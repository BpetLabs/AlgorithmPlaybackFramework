# Animated Playback Starter

A copyable React application for authoring an AnimatedPlayback with AlgorithmPlaybackFramework.

This framework is designed for an AI to automatically create the controls and animations from a prompt given an Algorithm in any language. 

See [CONTROLS.md](./CONTROLS.md) for the available control types, their behavior, and the conventions used by the authoring skills.

## Start

```sh
npm install
npm run dev
```

## Integrate an existing React application

### Dependencies

```sh
npm install algorithm-playback-framework framer-motion
```

`src/main.tsx` imports two stylesheets:

- `algorithm-playback-framework/styles.css` provides required control structure and the default framework theme.
- `./styles.css` styles only this example page and can be replaced or removed.

Every supported framework theme variable and its default are declared in the themed sections near the top of `algorithm-playback-framework/styles.css`.
