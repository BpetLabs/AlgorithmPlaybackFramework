# Animated Playback Starter

A copyable React application for authoring an AnimatedPlayback with AlgorithmPlaybackFramework.

This framework is designed for an AI to automatically create the controls and animations from a prompt given an Algorithm in most languages. 

Once created, fine tune the styling using AI or manually adjustment.

See [playbackcontrols.md](./playbackcontrols.md) for the available control types, their behavior, and the conventions used by the authoring skills.

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

- `./src/styles.css` provides required control structure and the default framework theme.
- `./examples/animated-playback-starter/src/styles.css` can be replaced or removed.

Every supported framework theme variable and its default are declared in the themed sections near the top of `./src/styles.css`.

## Code Files

- Bring your small coding problem in any language. 
- You may want to adjust the code:
    - lines you wish to pause on are on a single line.
    - reduce calls to external methods for readability.
    - line length should be kept under 70 characters to fit the default `Code` control size.
    - add comments that would help a reader better understand the code.
- Uses `.\examples\animated-playback-starter\src\tools\ConvertCode.ps1` to copy into the playback json file.

## Design

- Keep any input to the playback page as small as possible to provide understanding. 
- You do not need to provide controls for everything in the code. 
- Strategically select pause locations
    - pausing on a line that performs an operation such as an Pop or Push on a stack or assignment on an array will provide pre animations.
    - you may want to ask AI to pause dynamically on such as pause only if all steps are skipped.
- Default animations, style, and highlighting, colors, etc are provided
    - Once created, edit the page file manual or ask the AI as appropriate so things look and act how you would like them.

## Samples

I have provided `.\examples\animated-playback-starter\src\samples`

## Playback Pages

Create each generated playback in its own URL-safe folder under playbackpages:

```text
playbackpages/
  bubble-sort/
    Page.tsx
    playback.json
```

`Page.tsx` must export the playback page as its default export. The starter
discovers matching pages automatically; do not edit `main.tsx`.

Open the page with its folder name in the query string:

```text
http://localhost:5173/?page=bubble-sort
```

Opening the starter without a `page` query displays all discovered pages.

From here you can test and eventually copy into your own project if desired. 
