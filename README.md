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
- To change the framework itself, follow
  [Develop the Framework](#develop-the-framework).

The available controls and playback JSON format are documented in
[playbackcontrols.md](playbackcontrols.md).

## Install the Framework

The package is not currently published to npm. Build it from a local checkout,
then install either the checkout or a packed tarball in the consuming React
application.

The framework requires React 18.2 or 19, React DOM 18.2 or 19, and Framer Motion
11 or 12 as peer dependencies.

### Install from a local checkout

First build the framework:

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

The consuming application must already include compatible `react` and
`react-dom` versions.

### Install a packed copy

To install an immutable package artifact instead of linking the checkout:

```sh
# In AlgorithmPlaybackFramework
npm pack

# In the consuming React application
npm install /path/to/algorithm-playback-framework-0.1.0.tgz framer-motion
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

## Develop the Framework

Framework source is under `src`. The `animated-playback-starter` application is
a separate consumer used to exercise the built package.

Important source locations:

- `src/common`: shared models and types.
- `src/components`: control renderers and playback UI.
- `src/hooks`: playback state management.
- `src/utils`: control loading and renderer-property utilities.
- `src/styles.css`: framework structure and the public `--apf-*` theme API.
- `src/index.ts`: root public exports.

Requirements:

- Node.js 20 or later.
- npm and the committed `package-lock.json`.

Install dependencies and run the full validation suite:

```sh
npm install
npm run check
```

`npm run check` runs strict TypeScript checking, coverage tests, the ESM and
CommonJS builds, and package validation. Generated build files are written to
`dist`; coverage output is written to `coverage`. Do not edit or commit either
directory.

During development, run the narrowest relevant test when possible:

```sh
npm test -- src/path/to/file.test.ts
```

Before completing a framework change:

1. Add or update tests for meaningful behavior, branches, or edge cases.
2. Export new public APIs through the applicable barrel and `src/index.ts`.
3. Preserve public API and `--apf-*` theme compatibility unless the change is
   intentionally breaking.
4. Run `npm run check`.
5. Rebuild and test the starter when the change affects rendered behavior.

## Pull Requests

Pull requests require human involvement. Automated coding agents must not open
a pull request unless a human explicitly requests it.

Opening a pull request does not guarantee human review, feedback, response, or
merge. Do not treat silence or inactivity as approval.

Before requesting a public pull request, explain the specific human need it
addresses:

- Who needs the change?
- What problem do they experience?
- How would they use the proposed change?
- How would accepting the change help them?

Describe a concrete human experience rather than a hypothetical or generic
benefit.

When opening a pull request:

1. Keep it focused on one change.
2. Open it as a draft.
3. Use a concise title describing the overall change.
4. Run and report the relevant tests.
5. Complete the [pull request template](.github/pull_request_template.md),
   including the human-need section for public contributions.
