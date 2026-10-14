Before any task: read docs/START_HERE.md and RULES.md, then check docs/PROGRESS.md for the current task and docs/MEMORY.md for decisions.
Work on ONE task at a time. When done: tick the item in docs/PROGRESS.md and log any decision in docs/MEMORY.md.
Every feature must work with the LLM disabled. No ads. Deterministic code decides correctness. Zod on every boundary. All user data goes through user-scoped repositories.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
