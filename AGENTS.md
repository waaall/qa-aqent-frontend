# Repository Guidelines

## Project Structure & Module Organization

- `src/`: React + TypeScript source
  - `components/`: UI (Chat, Sidebar, Layout, Common)
  - `hooks/`: reusable logic (`useChat`, `useSession`, streaming helpers)
  - `services/`: API clients (Axios) and endpoints
  - `stores/`: Zustand state (`chatStore.ts`, `sessionStore.ts`)
  - `utils/`, `types/`, `config/`: shared helpers, types, app config
- `public/`: static assets served as-is
- `docs/`: project documentation
- `dist/`: production build output (generated)
- `.env.development` / `.env.production`: Vite environment config (`VITE_*`)

## Build, Test, and Development Commands

- `npm install` (or `npm ci` for clean installs)
- `npm run dev`: start Vite dev server (default `http://localhost:3000`)
- `npm run build`: run `tsc` then `vite build` → `dist/`
- `npm run preview`: serve the built app locally
- `npm run lint` / `npm run lint:fix`: ESLint checks/fixes (fails on any warning: `--max-warnings 0`)
- `npm run format` / `npm run format:check`: Prettier write/check for `src/**/*.{ts,tsx,css,json}`
- `npm run test`, `npm run test:run`, `npm run test:ui`, `npm run test:coverage`: run Vitest
- Optional: `pm2 start ecosystem.config.cjs` to run in the background

## Coding Style & Naming Conventions

- TypeScript + React (`.ts`/`.tsx`), ESM imports.
- Prefer absolute imports via `@/…` (alias to `src/`).
- Components use `PascalCase`; hooks use `useX`; styles are CSS Modules named `*.module.css`.
- Avoid `any` (warned by ESLint). Prefix intentionally-unused parameters with `_`.

## Testing Guidelines

- Framework: Vitest + Testing Library (jsdom).
- Name tests `*.test.ts(x)` (or place under `src/**/__tests__/`).
- Prefer user-visible assertions (roles/text) over internal implementation details.

## Commit & Pull Request Guidelines

- Commit history favors short, lower-case, verb-first summaries (e.g., `add pm2 support`, `fix doc errors`). Keep one topic per commit.
- PRs: include a clear description, linked issue/ticket if applicable, and screenshots for UI changes. Mention any `.env*` changes explicitly.
- Before requesting review, run `npm run lint` and `npm run test:run` (and `npm run build` for release changes).

## Configuration & Security Tips

- Dev proxy routes `/api` to `VITE_API_BASE_URL` (see `vite.config.ts`); don’t hard-code backend URLs in code.
- Only `VITE_` variables are exposed to the browser—never put secrets in `.env*`.
- Markdown rendering is sanitized (`rehype-sanitize`); don’t re-enable raw HTML without a security review.
