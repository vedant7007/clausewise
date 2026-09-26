# ClauseWise

**Know what you're signing.** A plain-English reader for rental agreements, job offers, NDAs and
loan papers. It shows which clauses tilt against you and backs every claim with a verified quote
from your document.

> ClauseWise provides legal information, not legal advice.

## Getting started

```bash
nvm use            # Node 22
npm ci
cp .env.example .env.local   # add GEMINI_API_KEY and/or GROQ_API_KEY
npm run dev
```

| Command                 | Purpose                    |
| ----------------------- | -------------------------- |
| `npm run lint`          | ESLint                     |
| `npm run typecheck`     | TypeScript, strict mode    |
| `npm run test`          | Vitest unit and UI tests   |
| `npm run test:coverage` | Tests with coverage report |
| `npm run build`         | Production build           |

## Licence

[MIT](LICENSE)
