# @mx-space/byline-admin

Admin dashboard for Byline, a React 19 SPA served by the Byline server.

## Tech Stack

| Component | Technology                                                     |
| --------- | -------------------------------------------------------------- |
| Framework | React 19 + Vite 8 (+ React Compiler)                           |
| Routing   | react-router 8 (HashRouter, routes generated from `src/views`) |
| State     | Jotai + Zustand + TanStack Query                               |
| UI        | Base UI primitives + Tailwind CSS v4                           |
| Editor    | Lexical (`@haklex/rich-*`), CodeMirror, Monaco, Excalidraw     |
| Auth      | Better Auth + passkeys                                         |
| Realtime  | @mx-space/ws-client                                            |

Shared contracts: `@mx-space/editor` (block node types and LiteXML).

## Development

```bash
# From the repo root
pnpm dev:admin        # vite dev server on :9528

# Or from this directory
pnpm dev
pnpm build            # production build → dist/
pnpm test             # vitest (happy-dom)
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint
```

Run the server alongside (`pnpm dev` at the repo root).

### Environment

All variables are optional (empty = safe defaults); see `.env.example`.

| Variable              | Purpose                                         |
| --------------------- | ----------------------------------------------- |
| `VITE_APP_BASE_API`   | Byline API endpoint                             |
| `VITE_APP_WEB_URL`    | Consumer site origin ("view on site" links)     |
| `VITE_APP_GATEWAY`    | Realtime gateway (derived from API origin)      |
| `VITE_APP_PUBLIC_URL` | Vite `base` for production builds               |

Runtime URL resolution precedence: server-injected `window.injectData` → build-time `VITE_APP_*` → fallbacks (see `src/constants/env.ts`).

## License

MIT
