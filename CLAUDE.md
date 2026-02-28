# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server on port 3030
npm run build    # Lint + build (runs eslint then next build)
npm run eslint   # Lint only
npm start        # Start production server on port 3030
```

Node version: 20 (see .nvmrc). No test framework is configured.

## Environment Variables

- `WIX_PAGE_URL` — Base URL for the Wix backend (e.g., `https://splintor.wixsite.com/ypb1`)
- `PORTIVE_API_KEY` — API key for image handling

## Architecture

This is a **community phone book website for Yeruham, Israel** (Hebrew, RTL). Next.js 12 frontend on Vercel, with a Wix Corvid serverless backend for data storage and auth.

### Data flow

1. Next.js pages use `getServerSideProps` to fetch data from the Wix backend
2. `utils/data-layer.ts` is the single server-side module that calls Wix HTTP functions at `WIX_PAGE_URL/_functions/*`
3. Client-side navigation uses API routes under `pages/api/` which proxy to data-layer
4. `next.config.js` rewrites handle login, search suggestions, sitemap, and opensearch proxying

### Auth flow

Phone-number login → Wix validates → returns auth token → stored in cookie (`auth`) and localStorage (`authTitle`). Hash-based auth (`#auth:{token}`) enables link sharing. Guest login via `?guestLogin` query param shows only public pages.

### Key modules

- **`components/App.tsx`** — Root component, manages global state and auth gating
- **`components/AppComponent.tsx`** — Main UI after login (search, page display, editing)
- **`components/PageEditor.tsx`** — Quill-based WYSIWYG editor (dynamically imported)
- **`utils/data-layer.ts`** — All Wix backend communication (server-side only)
- **`utils/requests.client.ts`** — Client-side fetch wrappers for API routes
- **`utils/cookies.ts`** — Auth cookie and localStorage management
- **`site-info.json`** — Branding and configuration (title, colors, links)
- **`wix-site-code/`** — Copy of Wix backend code, kept here for version control

### Page routing

- `/` — Home/welcome page
- `/[title]` — Individual phone book page
- `/search/[search]` — Search results
- `/tag/[tag]` — Pages filtered by tag
- `/new_page` — Special route for creating new pages

## Task tracking

When completing an item from `claude-todo.txt` or `TODO.md`, remove the corresponding line from the file as part of the same commit. Also check the other file for the same item and remove it there too.

## Conventions

- **No semicolons** (enforced by ESLint)
- TypeScript with `strict: false`
- Functional components with hooks, no state management library
- All UI strings are in Hebrew, inline in components
- Bootstrap 5 RTL for layout and UI components
- The public tag `"ציבורי"` controls guest visibility (defined in `utils/consts.ts`)
