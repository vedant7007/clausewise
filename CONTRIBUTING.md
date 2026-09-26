# Contributing to ClauseWise

Thank you for helping make legal documents easier to understand. This guide covers how to set up
the project, the standards we hold code to, and how to open a pull request.

## Setup

```bash
nvm use                 # Node 22
npm ci
cp .env.example .env.local   # add GEMINI_API_KEY or GROQ_API_KEY
npm run dev
```

## Before you open a pull request

All four must pass locally; CI runs the same checks:

```bash
npm run lint && npm run typecheck && npm run test:coverage && npm run build
```

## Code standards

- **TypeScript strict, no `any`.** Derive domain types from the Zod schemas in `src/lib/schemas`.
- **Thin routes.** Route handlers validate input, call one service, and map errors. Put logic in
  `src/lib/services` or a pure library.
- **Never render unvalidated model output.** Add a Zod schema for any new model response and call it
  through `AIManager.generate`.
- **Ground every claim.** New model features that make claims about a document must return quotes
  and run them through the evidence verifier.
- **Errors.** Throw `AppError` with a user-safe message. Never expose stack traces, provider names or
  key state.
- **Documentation.** Every exported function gets a short JSDoc block: purpose, parameters, return
  value and failure mode.
- **Constants.** No magic numbers; name them.
- **Size.** One responsibility per file; split files that grow past about 200 lines.
- **Accessibility.** Use native elements first, label every control, keep 44 px targets, never convey
  meaning by colour alone, and add or update a component test.
- **Tests.** Add tests with every change. Coverage thresholds are enforced.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/): `feat(scope): ...`,
`fix(scope): ...`, `test(scope): ...`, `docs(scope): ...`, `perf(scope): ...`, `chore(scope): ...`.
Describe the actual change and why it was needed.

## Legal content

ClauseWise provides information, not advice. Prompts and UI copy must not tell users what they
should do legally or predict outcomes. If you add a fair baseline document, keep it balanced,
generic and clearly marked as a reference, not a template.

## Conduct

By participating you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).
