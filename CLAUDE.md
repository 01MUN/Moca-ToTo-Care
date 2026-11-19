# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Fluffy Days (플러피 데이즈)** — internal codename **Moca-ToTo Care (모카토토 케어)** — is an AI-powered pet care companion web app. Core features: gentle pet animations/pixel-art pet generator, daily care checklists, health & vet visit logging, GPS walk tracking with "Shapeify" route-to-shape morphing (paw/heart/bone), a neighborhood places map (vet, cafe, park, grooming) with reviews, family/co-parent sharing, and a Gemini-powered "AI Doctor" for multimodal (photo) health triage.

It is built and hosted via **Google AI Studio** (see `index.html` title, `metadata.json`, `README.md` link to `ai.studio`). The app is a mobile-first web UI (see `src/components/MobileFrameWrapper.tsx`, which renders the whole app inside a simulated iPhone/Android frame with a Flutter-branded top bar) — it is **not** a native Flutter app; a full Flutter/Dart source tree is instead embedded as string data (`src/data/flutterCode.ts`) and shown read-only via `FlutterCodeViewerModal.tsx` as a "reference implementation" for native porting.

Content and UI copy are primarily in **Korean**.

## Tech Stack

- **Frontend**: React 19 + TypeScript, Vite 6, Tailwind CSS 4 (via `@tailwindcss/vite`, no separate `tailwind.config`), `motion` (Framer Motion successor) for animation, `lucide-react` for icons, `canvas-confetti` for celebration effects.
- **Backend**: Express 4, run inside `server.ts` which also boots Vite as middleware (single dev process via `tsx server.ts`). Also integrates `@google/genai` (Gemini API) server-side for AI Doctor analysis.
- **Data layer**: `prisma/schema.prisma` defines a PostgreSQL + PostGIS schema (Users, Pets, DailyRecord, HealthRecord, WalkLog, Place, PlaceReview), and `src/db/schema.sql` mirrors it as raw SQL — **but `server.ts` currently uses in-memory arrays (`usersDb`, `familyInvitesDb`, etc.), not Prisma/Postgres**. Treat the Prisma schema as the target/aspirational persistence model, not the live one (확인 필요: whether a Prisma client is wired up anywhere, or if this is future work — no `@prisma/client` import was found).
- **API contract**: `docs/openapi.yaml` documents the intended `/api/v1/*` REST surface.
- **Build**: `vite build` for the client bundle + `esbuild` to bundle `server.ts` into `dist/server.cjs` (CJS, Node platform, external packages).
- **Package manager**: `bun.lock` is present (Bun), but `package.json` scripts assume Node-compatible tooling (`tsx`, `node`). 확인 필요: whether Bun or npm/Node is the intended runtime — README says `npm install` / `npm run dev`, but the lockfile is Bun's.

## Project Structure

```
server.ts              Express app: Vite middleware + all /api/v1/* routes (in-memory data store)
src/
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
- **Auth**: Custom mock JWT-like scheme, not real JWT. `server.ts`'s `getAuthUser()` parses a Bearer token of the form `token_<userId>_<timestamp>`; the client stores the token string in `localStorage` under `mocatoto_auth_token` (`src/services/api.ts`). 확인 필요: real JWT signing/verification is not implemented despite roadmap claiming "JWT 기반" auth.
- **Family sharing**: Users have `ownedPetIds` and `sharedPetIds`; `familyInvitesDb` holds invite codes that grant `sharedPetIds` access to co-parents (see `server.ts` `FamilyInviteRecord`, and `FamilyShareModal.tsx`).
- **Walk/Shapeify**: Raw GPS coordinates are smoothed with a Douglas-Peucker implementation (`src/utils/geoUtils.ts`) and then morphed into a themed SVG shape (paw/heart/bone), rendered in `WalkTab.tsx`.
- **AI Doctor**: Client uploads a photo (base64) which server-side code calls the Gemini API (`@google/genai`) for multimodal triage, returning a NORMAL/ATTENTION/URGENT classification plus a health score and care plan; UI in `AIInteractionModal.tsx`.

## Coding Conventions

- No ESLint or Prettier config is present in the repo. The only static check is `tsc --noEmit` (see `lint` script).
- TypeScript: strict-ish `tsconfig.json` (`isolatedModules`, `moduleDetection: force`), path alias `@/*` → project root (also mirrored in `vite.config.ts` resolve alias).
- React function components typed as `React.FC<Props>` with an explicit `Props` interface (see `MobileFrameWrapper.tsx`); `App.tsx` uses a plain default-exported function component instead.
- Styling is Tailwind utility classes, often with inline hex colors (e.g. `bg-[#181825]`, `text-[#3D2C1E]`) rather than a themed Tailwind config — color values are hardcoded per-component/per-theme (see `ThemeOption` in `types.ts` and `THEME_OPTIONS`).
- Domain types are centralized in `src/types.ts` and imported by both components and `services/api.ts`.
- UI copy/strings are written in Korean directly inline (no i18n layer).
- 확인 필요: no test files or test framework were found in the repo — there is no test command.

## Commands

```bash
npm install       # install dependencies (README-documented; bun.lock also present — see 확인 필요 above)
npm run dev        # tsx server.ts — starts Express + Vite middleware dev server on port 3000
npm run build       # vite build (client) + esbuild bundle of server.ts -> dist/server.cjs
npm run start       # node dist/server.cjs — run the production build
npm run clean       # rm -rf dist server.cjs
npm run lint         # tsc --noEmit (type-checking only; no ESLint)
```

There is no test script/framework configured (확인 필요 if tests are planned).

### Environment

Requires a `GEMINI_API_KEY` (see `.env.example`) for Gemini AI API calls; `APP_URL` is also expected, auto-injected by AI Studio/Cloud Run. Prisma's `DATABASE_URL` env var is referenced in `prisma/schema.prisma` but 확인 필요 whether it's actually used anywhere at runtime.
