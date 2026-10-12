# Generate an Animated Playback with AI

This starter is designed for using an AI coding agent to generate an
AnimatedPlayback page from source code. The prompt tells the agent which code
to animate, which controls to display, where playback should pause, and which
input values to use.

The AI coding agent must be able to read and write files in this repository. A
chat-only AI can suggest a playback, but it cannot create or verify the page.

## Run the Starter

From the repository root:

```sh
npm install
npm run build
cd examples/animated-playback-starter
npm install
npm run dev
```

Open <http://localhost:5173>. The starter lists every generated playback page.

## Generate a Sample Playback

Sample prompts are in:

```text
examples/animated-playback-starter/src/samples/aiprompts/
```

Each prompt references a matching source file in:

```text
examples/animated-playback-starter/src/samples/examplecodefiles/
```

To generate a page:

1. Open the repository root in your AI coding agent.
2. Choose a file from
   `examples/animated-playback-starter/src/samples/aiprompts`.
3. Copy the entire prompt into the agent and submit it without changing the
   working directory.
4. Allow the agent to read `.agents/skills`, copy the starter template, create
   the playback data, and verify the result.
5. Review the agent's final report for assumptions, validation results, or
   unresolved instructions.
6. Open the starter URL and select the generated page.

The prompt is an instruction for the AI agent, not a script to run in a
terminal.

## Generate a Playback from Your Own Code

Place a small source file in
`examples/animated-playback-starter/src/samples/examplecodefiles`, or reference
an existing source file elsewhere in the repository. Keep important operations
on separate lines and keep lines at or below 70 characters so they fit the
default Code control.

Copy one of the sample prompts and change these sections:

- `Code`: repository-relative path to the source file.
- `PlaybackControls`: data structures or visualizations the page should show.
- `Pause at`: source operations that should create playback steps.
- `Input`: concrete values that produce an understandable execution.
- `Rules`: algorithm-specific colors, highlights, labels, or behavior.

Use this prompt structure:

```text
Let's create a new playback.

Skills Location:
- .agents/skills

Template:
- examples/animated-playback-starter/src/template

Code:
- path/to/your/source-file

PlaybackControls:
- Describe the controls and visualizations to create.

Pause at:
- Describe the operations where playback should pause.

Input:
- Provide concrete input values and the behavior they should demonstrate.

Rules:
- Add any algorithm-specific presentation or behavior rules.

After completion:
- Review and verify that all applicable skills were followed.
- Check highlighting, control state, object placement, and narration.
- Run the relevant validation and fix any issues found.
- Report contradictions or instructions that need clarification.
```

Be specific about the desired controls and input, but let the authoring skills
define the JSON structure, animation timing, and synchronization rules.

## Generated Files

The agent creates each playback in a URL-safe folder:

```text
examples/animated-playback-starter/src/playbackpages/
  bubble-sort/
    Page.tsx
    playback.json
```

`Page.tsx` defines the page layout. `playback.json` contains the controls,
snapshots, narration, code highlights, and animations. The starter discovers
these folders automatically; do not edit `src/main.tsx`.

Open a main page to see the list of playback pages you have created.

```text
http://localhost:5173
```

See [playbackcontrols.md](../playbackcontrols.md) for the supported control
types and authoring conventions.

## Styling

The starter already imports the framework styles and its local page styles:

```tsx
import "algorithm-playback-framework/styles.css";
import "./styles.css";
```

No stylesheet changes are required to generate or run a playback. To customize
the starter page, edit
`examples/animated-playback-starter/src/styles.css`. To customize framework
colors or spacing, override its `--apf-*` variables there. Do not edit the
generated root `dist/styles.css` file.
