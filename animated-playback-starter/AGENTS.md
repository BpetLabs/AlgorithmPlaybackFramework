# Animated Playback Starter

## Authoring

- Before creating or modifying a playback page, read and follow
  `../.agents/skills/authoring/SKILL.md` completely, including every skill it
  directs you to use.
- Start new pages from `src/template` and create them under
  `src/playbackpages/<page-name>`.
- Do not edit `src/main.tsx` to register a page; pages are discovered
  automatically.
- Keep `Page.tsx`, `playback.json`, code highlights, narration, and control
  state synchronized.

## Build and Validation

- Requires Node.js 20.19 or later.
- Use npm and preserve `package-lock.json` unless dependencies change.
- Build the framework from the repository root with `npm run build` before
  building or running the starter.
- Validate starter or playback changes with `npm run build` in this directory.
- Run the narrowest validation that covers the change.
- Documentation-only changes do not require a full build.

## Generated Files

- Do not edit or commit `dist`, `node_modules`, or other generated output.
- Edit `../src/styles.css`, not the generated root `../dist/styles.css`, when
  changing framework styles.
