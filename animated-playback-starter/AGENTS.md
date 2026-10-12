# Animated Playback Starter

## Authoring

- Before creating or modifying a playback page, read and follow
  `../.agents/skills/authoring/SKILL.md` completely, including every skill it
  directs you to use.
- Do not edit `src/main.tsx` to register a page; pages are discovered
  automatically.

## Build and Validation

- Requires Node.js 20.19 or later.
- Use npm and preserve `package-lock.json` unless dependencies change.
- If framework source changed, run `npm run build` at the repository root
  before building or previewing the starter. The starter imports the framework
  through its built `dist` exports.
- Validate starter or playback changes with `npm run build` in this directory.
- Run the narrowest validation that covers the change.
- Documentation-only changes do not require a full build.
- If a Vite development server was already running when the framework was
  rebuilt, restart it with `npm run dev -- --force` before visual validation so
  optimized dependencies cannot remain stale.

## Generated Files

- Do not edit or commit `dist`, `node_modules`, or other generated output.
- Edit `../src/styles.css`, not the generated root `../dist/styles.css`, when
  changing framework styles.
