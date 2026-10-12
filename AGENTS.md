## Communication

- Be concise and precise in replies. 
- Prefer short, direct wording over filler, repetition
- Do not include conversational validation (e.g., "You're right," "Exactly," "Great question," "Good catch," "You're right to question that," or similar).
- Base conclusions on evidence rather than agreement with my framing.

## Framework Development

- The base framework source is under `src`; the application under
  `animated-playback-starter` is a separate consumer of the built package.
- Edit source files rather than generated output. Do not edit or commit `dist`,
  `coverage`, or `node_modules`.
- Public TypeScript APIs must be exported through `src/index.ts` and the
  applicable nested barrel files.
- Treat the `--apf-*` variables in `src/styles.css` as the public theme API.
  Preserve existing variables and behavior unless a breaking change is
  explicitly requested.
- Preserve backward compatibility for public components, hooks, utilities,
  types, and package exports unless a breaking change is explicitly requested.
- Use npm and update `package-lock.json` only when dependencies change.

## Framework Build and Validation

- Requires Node.js 20 or later.
- During development, run the narrowest typecheck or test that covers the
  change.
- Before completing a base-framework change, run `npm run check`. It performs
  type checking, coverage tests, the ESM/CommonJS build, and package validation.
- Documentation-only changes do not require a full build.

## Commits
- Preserve existing uncommitted changes. If they conflict with the requested work, ask before overwriting or discarding them.
- Stage only files changed for the current task.
- Do not commit unless explicitly asked.
- When committing, use a concise, imperative subject describing the change.
- Include a short commit body explaining what changed.
- Do not push unless explicitly asked.

## Pull Requests
- Pull requests require active human involvement. 
- Opening a pull request does not guarantee human review, feedback, response, or merge.
- Before requesting a pull request, explain the specific human need it addresses:
  who needs the change, what problem they face, and how the change would help.
- Open PRs as drafts.
- Use a concise title describing the overall PR change.
- Run the relevant tests before opening a PR.
- Follow .github/pull_request_template.md.

## Tests

- Only add tests that protect meaningful behavior, conditional branches, edge cases; avoid tests that merely restate static output, configuration, or implementation details.