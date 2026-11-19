# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Fluffy Days (플러피 데이즈)** — internal codename **Moca-ToTo Care (모카토토 케어)** — is an AI-powered pet care companion web app. Core features: gentle pet animations/pixel-art pet generator, daily care checklists, health & vet visit logging, GPS walk tracking with "Shapeify" route-to-shape morphing (paw/heart/bone), a neighborhood places map (vet, cafe, park, grooming) with reviews, family/co-parent sharing, and a Gemini-powered "AI Doctor" for multimodal (photo) health triage.

It is built and hosted via **Google AI Studio** (see `index.html` title, `metadata.json`, `README.md` link to `ai.studio`). The app is a mobile-first web UI (see `src/components/MobileFrameWrapper.tsx`, which renders the whole app inside a simulated iPhone/Android frame with a Flutter-branded top bar) — it is **not** a native Flutter app; a full Flutter/Dart source tree is instead embedded as string data (`src/data/flutterCode.ts`) and shown read-only via `FlutterCodeViewerModal.tsx` as a "reference implementation" for native porting.

Content and UI copy are primarily in **Korean**.

## Tech Stack

- **Frontend**: React 19 + TypeScript, Vite 6, Tailwind CSS 4 (via `@tailwindcss/vite`, no separate `tailwind.config`), `motion` (Framer Motion successor) for animation, `lucide-react` for icons, `canvas-confetti` for celebration effects.
- **Backend**: Express 4, run inside `server.ts` which also boots Vite as middleware (single dev process via `tsx server.ts`). Also integrates `@google/genai` (Gemini API) server-side for AI Doctor analysis.
- **Data layer**: `prisma/schema.prisma` defines a PostgreSQL + PostGIS schema (Users, Pets, DailyRecord, HealthRecord, WalkLog, Place, PlaceReview), and `src/db/schema.sql` mirrors it as raw SQL — **but the API (`src/server/store.ts`) currently uses in-memory arrays (`usersDb`, `familyInvitesDb`, etc.), not Prisma/Postgres**. Treat the Prisma schema as the target/aspirational persistence model, not the live one (확인 필요: whether a Prisma client is wired up anywhere, or if this is future work — no `@prisma/client` import was found).
- **API contract**: `docs/openapi.yaml` documents the intended `/api/v1/*` REST surface.
- **Build**: `vite build` for the client bundle + `esbuild` to bundle `server.ts` into `dist/server.cjs` (CJS, Node platform, external packages).
- **Package manager**: npm 사용 확정. `package-lock.json` is the single source of truth; `bun.lock` was a stray artifact and has been removed.

## Project Structure

```
server.ts              Entry point: loads JWT_SECRET (fails fast), createApp(), Vite middleware / static, listen()
src/
  server/app.ts        createApp({ jwtSecret, store? }): auth guard → JSON body parser (10mb) → route modules
  server/auth.ts       Deny-by-default JWT auth guard (PUBLIC_ROUTES allowlist) + getAuthUser(res)
  server/jwt.ts        HS256 sign/verify (alg pinned, iss/aud/exp/sub checked), loadJwtSecret()
  server/password.ts   bcrypt hash/verify (cost 10, 72-byte limit)
  server/schemas.ts    zod request schemas; server/validation.ts: validate() middleware + JSON body error handler
  server/store.ts      In-memory data (createStore() = fresh seed data per app instance)
  server/routes/*.ts   Route groups: auth, pets, records, walks, places, ai
  App.tsx              Root component; owns top-level state, loads data from API on mount
  main.tsx             React entry point
  types.ts             Shared TS types/interfaces for domain models
  components/          Tab screens (HomeTab, RecordsTab, WalkTab, CommunityTab) + modals (Auth, FamilyShare, AI Interaction, PixelPet, ThemeSelector, FlutterCodeViewer) + chrome (Navbar, BottomNav, Splash, MobileFrameWrapper)
  services/api.ts       Fetch client; each call falls back to local mock data on network/API error
  data/mockData.ts       Seed/fallback data (INITIAL_PETS, INITIAL_DAILY_RECORDS, etc.)
  data/flutterCode.ts    Embedded Flutter/Dart source shown in FlutterCodeViewerModal
  utils/geoUtils.ts      GPS route smoothing (Douglas-Peucker) utilities
  utils/pixelEngine.ts, kawaiiPixelEngine.ts   Pixel-art pet rendering/generation
  db/schema.sql          Raw SQL mirror of the Prisma schema
prisma/schema.prisma    PostgreSQL + PostGIS schema definitions
docs/openapi.yaml        REST API specification
```

### Architecture notes

- **Client/server data flow**: `App.tsx` loads pets, daily records, health records, and nearby places from `petApiService`/`authApiService` (`src/services/api.ts`) on mount via `Promise.all`, with each call individually falling back to the corresponding `INITIAL_*` mock dataset from `src/data/mockData.ts` on failure — the app is designed to remain usable offline/without a backend.
- **Auth**: HS256 JWT signed with `JWT_SECRET` (`src/server/jwt.ts`), issued by `POST /auth/login` and `/auth/signup`, 7-day expiry. `createAuthGuard` (`src/server/auth.ts`) protects all of `/api/v1` by default; only `POST /auth/login`, `POST /auth/signup`, and `GET /places/*` are public. Missing, invalid, forged, or expired tokens get a 401. There is no fallback user. Passwords are stored as bcrypt hashes (seed demo accounts use `password123`). Signup always creates `role: 'owner'`. The client stores the JWT in `localStorage` under `mocatoto_auth_token`. On a 401 from a protected call, `src/services/api.ts` clears the token, fires `authEvents.onUnauthorized`, and throws `UnauthorizedError`, which mock-data fallback never swallows. `App.tsx` then shows a non-dismissible login gate instead of app content. **Not yet implemented:** per-pet ownership checks (any logged-in user can read or modify any `petId`; see `docs/next-tasks/pet-ownership-authorization.md`), refresh tokens and logout revocation, and rate limiting.
- **Input validation**: every `/api/v1` route has a zod `validate({ params, query, body })` middleware (`src/server/schemas.ts`). Failures return `400 { success:false, message, errors:[{path,message}] }`. Bodies strip unknown keys because the client sends extra fields; `PATCH /pets/:petId` is strict.
- **Family sharing**: Users have `ownedPetIds` and `sharedPetIds`; `familyInvitesDb` holds invite codes that grant `sharedPetIds` access to co-parents (see `src/server/store.ts` `FamilyInviteRecord`, `src/server/routes/auth.ts`, and `FamilyShareModal.tsx`).
- **Walk/Shapeify**: Raw GPS coordinates are smoothed with a Douglas-Peucker implementation (`src/utils/geoUtils.ts`) and then morphed into a themed SVG shape (paw/heart/bone), rendered in `WalkTab.tsx`.
- **AI Doctor**: Client uploads a photo (base64) which server-side code calls the Gemini API (`@google/genai`) for multimodal triage, returning a NORMAL/ATTENTION/URGENT classification plus a health score and care plan; UI in `AIInteractionModal.tsx`.

## Coding Conventions

- No ESLint or Prettier config is present in the repo. The only static check is `tsc --noEmit` (see `lint` script).
- TypeScript: strict-ish `tsconfig.json` (`isolatedModules`, `moduleDetection: force`), path alias `@/*` → project root (also mirrored in `vite.config.ts` resolve alias).
- React function components typed as `React.FC<Props>` with an explicit `Props` interface (see `MobileFrameWrapper.tsx`); `App.tsx` uses a plain default-exported function component instead.
- Styling is Tailwind utility classes, often with inline hex colors (e.g. `bg-[#181825]`, `text-[#3D2C1E]`) rather than a themed Tailwind config — color values are hardcoded per-component/per-theme (see `ThemeOption` in `types.ts` and `THEME_OPTIONS`).
- Domain types are centralized in `src/types.ts` and imported by both components and `services/api.ts`.
- UI copy/strings are written in Korean directly inline (no i18n layer).
- **테스트**: Vitest, `npm test` (config in `vitest.config.ts`, separate from `vite.config.ts`). `src/services/api.ts`'s mock-data fallback is disabled when `VITEST`/`NODE_ENV=test` is set, so tests see real thrown errors instead of silent fallback data.

## Commands

```bash
npm install       # install dependencies (npm is the confirmed package manager)
npm run dev        # tsx server.ts — starts Express + Vite middleware dev server on port 3000
npm run build       # vite build (client) + esbuild bundle of server.ts -> dist/server.cjs
npm run start       # node dist/server.cjs — run the production build
npm run clean       # rm -rf dist server.cjs
npm run lint         # tsc --noEmit (type-checking only; no ESLint)
npm test             # vitest run
```

### Environment

Requires `JWT_SECRET` (min 32 chars, not the `.env.example` placeholder). The server exits on startup without it, so set it in `.env` locally and in the AI Studio Secrets panel for deploys. Also requires a `GEMINI_API_KEY` (see `.env.example`) for Gemini AI API calls; `APP_URL` is also expected, auto-injected by AI Studio/Cloud Run. Prisma's `DATABASE_URL` env var is referenced in `prisma/schema.prisma` but 확인 필요 whether it's actually used anywhere at runtime.
