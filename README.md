# Algorithm Playback Framework

A React framework for building step-by-step algorithm visualizations with code
highlights, animated data structures, narration, state history, and playback
controls.

## Choose a Starting Point

- To generate a playback page from source code with an AI coding agent, use the
  [Animated Playback starter](animated-playback-starter/README.md).
- To add playback controls to an existing React application, follow
  [Install the Framework](#install-the-framework) and
  [Use the Framework](#use-the-framework).
- To change the framework itself, read the
  [contributing guide](CONTRIBUTING.md).

The available controls and playback JSON format are documented in
[playbackcontrols.md](playbackcontrols.md).

## Install the Framework

Install the framework and Framer Motion in the consuming React application:

```sh
npm install algorithm-playback-framework framer-motion
```

The framework requires React 18.2 or 19, React DOM 18.2 or 19, and Framer Motion
11 or 12 as peer dependencies. The consuming application must already include
compatible `react` and `react-dom` versions.

### Install from source

To use an unreleased version, clone and build the framework:

```sh
git clone https://github.com/bpet-dev/AlgorithmPlaybackFramework.git
cd AlgorithmPlaybackFramework
npm install
npm run build
```

Then run this from the consuming React application, replacing the path with the
location of the checkout:

```sh
npm install /path/to/AlgorithmPlaybackFramework framer-motion
```

### Install a packed copy

To install an immutable package artifact instead of linking the checkout:

```sh
# In AlgorithmPlaybackFramework
npm pack

# In the consuming React application
npm install /path/to/algorithm-playback-framework-1.0.0.tgz framer-motion
```

Rebuild and reinstall the package after changing framework source.

## Use the Framework

Use the [starter page template](animated-playback-starter/src/template/Page.tsx)
as the reference implementation for adding the framework to a React page. It
shows how to import the framework stylesheet, load playback data, connect the
playback state, lay out controls, and render the player.

For the complete AI-assisted workflow, including how to copy the template and
generate playback data, follow the
[Animated Playback starter instructions](animated-playback-starter/README.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for framework development, testing, and
pull-request guidance.
